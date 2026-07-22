import { getClientBaseUrl } from './publicBaseUrl.js';

const provider = String(process.env.MAIL_PROVIDER || '').trim().toLowerCase();
const gmailUser = process.env.GMAIL_USER || '';
const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const resendApiKey = (process.env.RESEND_API_KEY || '').trim();

// Auto-detect the provider from whatever credentials are present when
// MAIL_PROVIDER is not set explicitly. Resend (HTTP API over port 443) is
// preferred on hosts that block outbound SMTP (e.g. Railway).
const resolvedProvider =
  provider ||
  (resendApiKey ? 'resend' : '') ||
  (gmailUser && gmailAppPassword ? 'gmail' : '') ||
  'none';

const defaultFrom =
  resolvedProvider === 'gmail' && gmailUser
    ? `SACCFP <${gmailUser}>`
    : 'SACCFP <no-reply@saccfp.rw>';

export const mailConfig = {
  provider: resolvedProvider,
  gmailUser,
  gmailAppPassword,
  resendApiKey,
  from: process.env.MAIL_FROM || defaultFrom,
  replyTo: process.env.MAIL_REPLY_TO || '',
  appName: process.env.APP_NAME || 'SACCFP',
  appUrl: process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || getClientBaseUrl(),
  timeoutMs: Number(process.env.MAIL_TIMEOUT_MS || 10000),
  get isLive() {
    if (this.provider === 'resend') {
      return Boolean(this.resendApiKey);
    }
    if (this.provider === 'gmail') {
      return Boolean(this.gmailUser && this.gmailAppPassword);
    }
    return false;
  },
};
