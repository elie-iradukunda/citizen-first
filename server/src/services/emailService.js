import dns from 'node:dns';
import nodemailer from 'nodemailer';
import { mailConfig } from '../config/mail.js';
import { templates } from './emailTemplates.js';

let transport = null;

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

if (mailConfig.provider === 'gmail' && mailConfig.isLive) {
  const smtpHost = await resolveGmailSmtpHost();
  const gmail = nodemailer.createTransport({
    host: smtpHost,
    port: 465,
    secure: true,
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

  transport = async ({ to, subject, html }) => {
    const info = await gmail.sendMail({
      from: mailConfig.from,
      to,
      subject,
      html,
      ...(mailConfig.replyTo ? { replyTo: mailConfig.replyTo } : {}),
    });

    return { id: info.messageId };
  };

  console.info(`Email provider: Gmail SMTP as ${mailConfig.gmailUser}`);
} else {
  console.warn(
    'No live email provider is configured. Set MAIL_PROVIDER=gmail, GMAIL_USER, and GMAIL_APP_PASSWORD to send real SACCFP email.',
  );
}

export async function sendEmail(to, { subject, html }) {
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
      transport({ to: recipient, subject, html }),
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

export { templates };
