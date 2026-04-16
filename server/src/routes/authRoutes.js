import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { institutionEmployees, registeredCitizens, systemUsers } from '../data/registrationData.js';
import { createSession, removeSession } from '../data/sessionStore.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

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

function buildSafeUserProfile(user) {
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

router.post('/login', (request, response) => {
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
