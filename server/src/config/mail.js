import { getClientBaseUrl } from './publicBaseUrl.js';

const provider = String(process.env.MAIL_PROVIDER || '').trim().toLowerCase();
const gmailUser = process.env.GMAIL_USER || '';
const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

const resolvedProvider =
  provider || (gmailUser && gmailAppPassword ? 'gmail' : '') || 'none';

const defaultFrom =
  resolvedProvider === 'gmail' && gmailUser
    ? `SACCFP <${gmailUser}>`
    : 'SACCFP <no-reply@saccfp.rw>';

export const mailConfig = {
  provider: resolvedProvider,
  gmailUser,
  gmailAppPassword,
  from: process.env.MAIL_FROM || defaultFrom,
  replyTo: process.env.MAIL_REPLY_TO || '',
  appName: process.env.APP_NAME || 'SACCFP',
  appUrl: process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || getClientBaseUrl(),
  timeoutMs: Number(process.env.MAIL_TIMEOUT_MS || 10000),
  get isLive() {
    return this.provider === 'gmail' && Boolean(this.gmailUser && this.gmailAppPassword);
  },
};
