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

// Splits a `Name <address@host>` header into the parts Brevo's JSON API wants.
function parseFromAddress(value) {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  if (match) {
    return { name: match[1] || mailConfig.appName, email: match[2].trim() };
  }
  return { name: mailConfig.appName, email: String(value).trim() };
}

// --- Brevo (HTTP API over port 443) ------------------------------------------
// Railway blocks every outbound SMTP port including 2525, so Brevo's relay is
// unreachable from the hosted service and only its HTTP API can deliver. Unlike
// Resend's sandbox, a verified sender may email any recipient.
function initBrevo() {
  activeProvider = 'brevo';

  const sender = parseFromAddress(mailConfig.from);

  transport = async ({ to, subject, html, attachments }) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': mailConfig.brevoApiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(mailConfig.replyTo ? { replyTo: { email: mailConfig.replyTo } } : {}),
        // Brevo's API has no content-id field, so a `cid` attachment cannot be
        // embedded inline here — it rides along as a normal attachment instead.
        ...(attachments?.length
          ? {
              attachment: attachments.map(({ filename, contentBase64 }) => ({
                name: filename,
                content: contentBase64,
              })),
            }
          : {}),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.message || payload?.code || `HTTP ${response.status}`;
      throw new Error(`Brevo API rejected the message: ${detail}`);
    }
    return { id: payload?.messageId ?? 'brevo' };
  };

  verifyTransport = async () => {
    const response = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': mailConfig.brevoApiKey, Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Brevo API key check failed: HTTP ${response.status}`);
    }
  };

  console.info(`Email provider: Brevo HTTP API as ${sender.email}`);
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
    if (response.ok) {
      return;
    }

    // A sending-only key is rejected by /domains but can still deliver mail,
    // so that specific refusal counts as a healthy transport.
    const payload = await response.json().catch(() => ({}));
    if (payload?.name === 'restricted_api_key') {
      return;
    }

    throw new Error(
      `Resend API key check failed: HTTP ${response.status}${
        payload?.message ? ` — ${payload.message}` : ''
      }`,
    );
  };

  console.info('Email provider: Resend HTTP API');
}

// Wires a nodemailer instance up as the active transport. Shared by the Gmail
// and generic SMTP providers, which differ only in how they are constructed.
function useNodemailer(mailer) {
  transport = async ({ to, subject, html, attachments }) => {
    const info = await mailer.sendMail({
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

  verifyTransport = () => mailer.verify();
}

// --- Generic SMTP relay ------------------------------------------------------
// For relays that listen on a port the host leaves open — Brevo/Mailgun on 2525,
// for example — since Railway blocks the standard 25/465/587.
function initSmtp() {
  activeProvider = 'smtp';

  useNodemailer(
    nodemailer.createTransport({
      host: mailConfig.smtpHost,
      port: mailConfig.smtpPort,
      secure: mailConfig.smtpSecure,
      requireTLS: !mailConfig.smtpSecure,
      auth: {
        user: mailConfig.smtpUser,
        pass: mailConfig.smtpPassword,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    }),
  );

  console.info(
    `Email provider: SMTP as ${mailConfig.smtpUser} (${mailConfig.smtpHost}:${mailConfig.smtpPort})`,
  );
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

  useNodemailer(gmail);

  console.info(`Email provider: Gmail SMTP as ${mailConfig.gmailUser} (${smtpHost}:${smtpPort})`);
}

if (mailConfig.provider === 'brevo' && mailConfig.isLive) {
  initBrevo();
} else if (mailConfig.provider === 'resend' && mailConfig.isLive) {
  initResend();
} else if (mailConfig.provider === 'smtp' && mailConfig.isLive) {
  initSmtp();
} else if (mailConfig.provider === 'gmail' && mailConfig.isLive) {
  await initGmail();
} else {
  console.warn(
    'No live email provider is configured. Set MAIL_PROVIDER + credentials ' +
      '(BREVO_API_KEY for Brevo, RESEND_API_KEY for Resend, SMTP_HOST + SMTP_USER + ' +
      'SMTP_PASSWORD for a generic SMTP relay, or GMAIL_USER + GMAIL_APP_PASSWORD for ' +
      'Gmail) to send real SACCFP email.',
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
