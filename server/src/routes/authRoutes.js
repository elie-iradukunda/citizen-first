import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import {
  createPasswordCredentials,
  institutionEmployees,
  registeredCitizens,
  systemUsers,
} from '../data/registrationData.js';
import { createSession, removeSession, removeSessionsForUser } from '../data/sessionStore.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { rateLimit, resetRateLimit } from '../middleware/rateLimit.js';
import { getClientBaseUrl } from '../config/publicBaseUrl.js';
import { isEmailLive, sendEmailInBackground, templates } from '../services/emailService.js';

const router = Router();

// Password reset tokens live only until they are used or expire. Keyed by the
// token itself so a lookup cannot be done from the email address alone.
const passwordResetTokens = new Map();
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Anything that is not an explicit development run is treated as production.
// Defaulting the other way would mean a deployment that simply forgot to set
// NODE_ENV silently exposes reset links.
function isProductionEnvironment() {
  const environment = process.env.NODE_ENV ?? '';
  return environment !== 'development' && environment !== 'test';
}

// Password guessing is the cheapest attack on this platform, so both the login
// and the reset-request endpoints get a budget per caller.
const loginLimiter = rateLimit({
  name: 'auth-login',
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
});

const passwordResetLimiter = rateLimit({
  name: 'auth-password-reset',
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many password reset requests. Please wait 15 minutes and try again.',
});

function consumeResetToken(token) {
  const entry = passwordResetTokens.get(token);
  if (!entry) {
    return null;
  }

  if (new Date(entry.expiresAt) < new Date()) {
    passwordResetTokens.delete(token);
    return null;
  }

  return entry;
}

const loginSchema = z.object({
  accessKey: z.string().trim().min(8).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(6).optional(),
}).superRefine((payload, context) => {
  const hasAccessKey = Boolean(payload.accessKey);
  const hasPasswordAuth = Boolean(payload.email && payload.password);

  if (!hasAccessKey && !hasPasswordAuth) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide either accessKey or email + password.',
      path: ['accessKey'],
    });
  }
});

function verifyPassword(password, salt, expectedHash) {
  if (!password || !salt || !expectedHash) {
    return false;
  }

  const calculatedHash = crypto.scryptSync(password, salt, 64).toString('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHash, 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );
  } catch {
    return false;
  }
}

export function buildSafeUserProfile(user) {
  const citizenRecord =
    user.role === 'citizen'
      ? registeredCitizens.find((entry) => entry.nationalId === user.nationalId) ?? null
      : null;
  const institutionEmployee =
    user.role !== 'citizen' && user.institutionId && user.nationalId
      ? institutionEmployees.find(
          (entry) =>
            entry.institutionId === user.institutionId && entry.nationalId === user.nationalId,
        ) ?? null
      : null;

  return {
    userId: user.userId,
    citizenId: citizenRecord?.citizenId ?? null,
    employeeId: user.employeeId ?? institutionEmployee?.employeeId ?? null,
    fullName: user.fullName,
    email: user.email ?? null,
    phone: user.phone ?? institutionEmployee?.phone ?? citizenRecord?.phone ?? null,
    nationalId: user.nationalId ?? null,
    role: user.role,
    level: user.level,
    institutionId: user.institutionId ?? null,
    positionTitle: user.positionTitle ?? institutionEmployee?.positionTitle ?? null,
    location: user.location ?? null,
  };
}

router.post('/login', loginLimiter, (request, response) => {
  const parseResult = loginSchema.safeParse(request.body);
  if (!parseResult.success) {
    return response.status(400).json({
      message: 'Invalid login payload.',
      errors: parseResult.error.flatten(),
    });
  }

  const { accessKey, email, password } = parseResult.data;
  const normalizedEmail = email?.trim().toLowerCase();

  const user = accessKey
    ? systemUsers.find((entry) => entry.accessKey === accessKey && entry.status === 'active')
    : systemUsers.find(
        (entry) => entry.email?.toLowerCase() === normalizedEmail && entry.status === 'active',
      );

  if (!user) {
    return response.status(401).json({
      message: 'Invalid login credentials.',
    });
  }

  if (!accessKey) {
    const passwordIsValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!passwordIsValid) {
      return response.status(401).json({
        message: 'Invalid login credentials.',
      });
    }
  }

  // The budget exists to slow down guessing, not to punish a whole office that
  // shares one public address, so a real sign-in clears it.
  resetRateLimit('auth-login', request);

  const token = crypto.randomBytes(24).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  createSession(token, {
    userId: user.userId,
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  return response.json({
    token,
    user: buildSafeUserProfile(user),
  });
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(16),
  password: z.string().min(8).max(64),
});

// Always answers the same way whether or not the address belongs to an account,
// so this endpoint cannot be used to discover who is registered.
router.post('/forgot-password', passwordResetLimiter, (request, response) => {
  const parseResult = forgotPasswordSchema.safeParse(request.body);
  if (!parseResult.success) {
    return response.status(400).json({
      message: 'Provide a valid email address.',
    });
  }

  const normalizedEmail = parseResult.data.email.trim().toLowerCase();
  const genericResponse = {
    message:
      'If that email belongs to a SACCFP account, a reset link has been sent. Check your inbox and spam folder.',
  };

  const user = systemUsers.find(
    (entry) => entry.email?.toLowerCase() === normalizedEmail && entry.status === 'active',
  );

  if (!user) {
    return response.json(genericResponse);
  }

  // Only the newest link stays valid.
  for (const [existingToken, entry] of passwordResetTokens.entries()) {
    if (entry.userId === user.userId) {
      passwordResetTokens.delete(existingToken);
    }
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
  passwordResetTokens.set(token, { userId: user.userId, expiresAt });
  const resetLink = `${getClientBaseUrl()}/reset-password?token=${token}`;

  sendEmailInBackground(
    user.email,
    templates.passwordReset({
      fullName: user.fullName,
      resetLink,
      expiresAt: new Date(expiresAt).toLocaleString('en-US'),
    }),
  );

  // In local development, with no mail provider configured, the link could
  // never reach anyone — so it is returned directly to keep the flow testable.
  //
  // It must NEVER be returned outside development: the response would hand any
  // anonymous caller a working reset link for any address they name, which is a
  // complete account takeover (national admin included). A hosted deployment
  // whose SMTP is misconfigured still counts as production, so this is keyed on
  // the environment rather than on whether mail happens to be working.
  if (!isEmailLive() && !isProductionEnvironment()) {
    return response.json({ ...genericResponse, resetLink });
  }

  if (!isEmailLive()) {
    console.error(
      '[auth] Password reset requested but no mail provider is configured. ' +
        'The user cannot receive the link. Configure RESEND_API_KEY or GMAIL_* credentials.',
    );
  }

  return response.json(genericResponse);
});

router.post('/reset-password', (request, response) => {
  const parseResult = resetPasswordSchema.safeParse(request.body);
  if (!parseResult.success) {
    return response.status(400).json({
      message: 'Password must be at least 8 characters and the reset link must be complete.',
    });
  }

  const { token, password } = parseResult.data;
  const entry = consumeResetToken(token);
  if (!entry) {
    return response.status(400).json({
      message: 'This reset link is invalid or has expired. Request a new one.',
    });
  }

  const user = systemUsers.find(
    (candidate) => candidate.userId === entry.userId && candidate.status === 'active',
  );
  if (!user) {
    passwordResetTokens.delete(token);
    return response.status(400).json({
      message: 'This reset link is invalid or has expired. Request a new one.',
    });
  }

  const { passwordSalt, passwordHash } = createPasswordCredentials(password, user.userId);
  user.passwordSalt = passwordSalt;
  user.passwordHash = passwordHash;

  passwordResetTokens.delete(token);
  removeSessionsForUser(user.userId);

  return response.json({
    message: 'Password updated. You can now sign in with your new password.',
    email: user.email,
  });
});

router.get('/me', requireAuth, (request, response) => {
  return response.json({
    user: buildSafeUserProfile(request.auth.user),
  });
});

router.post('/logout', requireAuth, (request, response) => {
  removeSession(request.auth.token);
  return response.json({
    message: 'Logged out successfully.',
  });
});

export default router;
