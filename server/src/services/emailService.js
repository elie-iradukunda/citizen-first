import dns from 'node:dns';
import nodemailer from 'nodemailer';
import { mailConfig } from '../config/mail.js';
import { templates } from './emailTemplates.js';

let transport = null; // async ({to, subject, html}) => { id }
let verifyTransport = null; // async () => void  (throws on failure)
let activeProvider = 'none';

async function resolveGmailSmtpHost() {
  if (process.env.GMAIL_SMTP_HOST) {
    return process.env.GMAIL_SMTP_HOST;
  }

  if (process.env.GMAIL_FORCE_IPV4 === 'false') {
    return 'smtp.gmail.com';
  }

  try {
    const addresses = await dns.promises.resolve4('smtp.gmail.com');
    return addresses[0] ?? 'smtp.gmail.com';
  } catch (error) {
    console.warn(`Could not resolve Gmail IPv4 SMTP host, using smtp.gmail.com: ${error.message}`);
    return 'smtp.gmail.com';
  }
}

// --- Resend (HTTP API over port 443) -----------------------------------------
// Works on hosts that block outbound SMTP, such as Railway Trial/Hobby plans.
function initResend() {
  activeProvider = 'resend';

  const send = async ({ to, subject, html, attachments }) => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mailConfig.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: mailConfig.from,
        to: [to],
        subject,
        html,
        ...(mailConfig.replyTo ? { reply_to: mailConfig.replyTo } : {}),
        ...(attachments?.length
          ? {
              attachments: attachments.map(({ filename, contentBase64, cid }) => ({
                filename,
                content: contentBase64,
                ...(cid ? { content_id: cid } : {}),
              })),
            }
          : {}),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.message || payload?.error || `HTTP ${response.status}`;
      throw new Error(`Resend API rejected the message: ${detail}`);
    }
    return { id: payload?.id ?? 'resend' };
  };

  transport = send;
  verifyTransport = async () => {
    // Resend has no verify endpoint; a valid key returns 200 on /domains.
    const response = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${mailConfig.resendApiKey}` },
    });
    if (!response.ok) {
      throw new Error(`Resend API key check failed: HTTP ${response.status}`);
    }
  };

  console.info('Email provider: Resend HTTP API');
}

// --- Gmail (SMTP) ------------------------------------------------------------
async function initGmail() {
  activeProvider = 'gmail';

  const smtpHost = await resolveGmailSmtpHost();
  const smtpPort = Number(process.env.GMAIL_SMTP_PORT || 587);
  const smtpSecure =
    process.env.GMAIL_SMTP_SECURE === undefined
      ? smtpPort === 465
      : process.env.GMAIL_SMTP_SECURE === 'true';
  const gmail = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: !smtpSecure,
    auth: {
      user: mailConfig.gmailUser,
      pass: mailConfig.gmailAppPassword,
    },
    tls: {
      servername: 'smtp.gmail.com',
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });

  transport = async ({ to, subject, html, attachments }) => {
    const info = await gmail.sendMail({
      from: mailConfig.from,
      to,
      subject,
      html,
      ...(mailConfig.replyTo ? { replyTo: mailConfig.replyTo } : {}),
      ...(attachments?.length
        ? {
            attachments: attachments.map(({ filename, contentBase64, cid }) => ({
              filename,
              content: Buffer.from(contentBase64, 'base64'),
              ...(cid ? { cid, contentDisposition: 'inline' } : {}),
            })),
          }
        : {}),
    });

    return { id: info.messageId };
  };

  verifyTransport = () => gmail.verify();

  console.info(`Email provider: Gmail SMTP as ${mailConfig.gmailUser} (${smtpHost}:${smtpPort})`);
}

if (mailConfig.provider === 'resend' && mailConfig.isLive) {
  initResend();
} else if (mailConfig.provider === 'gmail' && mailConfig.isLive) {
  await initGmail();
} else {
  console.warn(
    'No live email provider is configured. Set MAIL_PROVIDER + credentials ' +
      '(RESEND_API_KEY for Resend, or GMAIL_USER + GMAIL_APP_PASSWORD for Gmail) to send real SACCFP email.',
  );
}

// `attachments` entries are { filename, contentBase64, cid? }. An entry with a
// `cid` is embedded inline, so images render even when the server itself is not
// publicly reachable (local dev) — hosted image URLs cannot work there.
export async function sendEmail(to, { subject, html, attachments }) {
  const recipient = String(to || '').trim();
  if (!recipient) {
    return { sent: false, error: 'No recipient address.' };
  }

  if (!transport) {
    console.info(`[email:not-sent] to=${recipient} subject="${subject}"`);
    return { sent: false, error: 'Email provider is not configured.' };
  }

  try {
    const { id } = await Promise.race([
      transport({ to: recipient, subject, html, attachments }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Mail provider did not respond within ${mailConfig.timeoutMs}ms.`)),
          mailConfig.timeoutMs,
        ),
      ),
    ]);

    console.info(`[email:sent] to=${recipient} subject="${subject}" id=${id}`);
    return { sent: true, id };
  } catch (error) {
    console.error(`[email:failed] to=${recipient} subject="${subject}" -> ${error.message}`);
    return { sent: false, error: error.message };
  }
}

export function sendEmailInBackground(to, message) {
  Promise.resolve()
    .then(() => sendEmail(to, message))
    .catch((error) => console.error(`[email:background] ${error.message}`));
}

export function isEmailLive() {
  return mailConfig.isLive;
}

// Reports whether the configured provider can actually reach its mail server.
// Used by the diagnostics endpoint to expose the otherwise-hidden failure.
export async function verifyEmailTransport() {
  if (!verifyTransport) {
    return { ok: false, provider: activeProvider, error: 'Email provider is not configured.' };
  }
  try {
    await Promise.race([
      verifyTransport(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Verification timed out after ${mailConfig.timeoutMs}ms.`)),
          mailConfig.timeoutMs,
        ),
      ),
    ]);
    return { ok: true, provider: activeProvider };
  } catch (error) {
    return { ok: false, provider: activeProvider, error: error.message };
  }
}

export function getEmailStatus() {
  return {
    provider: mailConfig.provider,
    activeProvider,
    isLive: mailConfig.isLive,
    from: mailConfig.from,
    hasTransport: Boolean(transport),
  };
}

export { templates };
