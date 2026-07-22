import { Router } from 'express';
import {
  getEmailStatus,
  sendEmail,
  verifyEmailTransport,
} from '../services/emailService.js';

const router = Router();

router.get('/', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'citizen-first-api',
    timestamp: new Date().toISOString(),
  });
});

// Email diagnostics. Reveals the otherwise-hidden provider error so we can tell
// apart: SMTP timeout (host blocks outbound SMTP), auth failure (bad creds), or
// no provider configured (missing env vars).
router.get('/email', async (_request, response) => {
  const status = getEmailStatus();
  const verify = await verifyEmailTransport();
  response.json({
    ...status,
    verify,
    timestamp: new Date().toISOString(),
  });
});

// Sends a real test email. Guarded by the system admin access key so it cannot
// be abused, but still returns the true send result for troubleshooting.
router.post('/email/test', async (request, response) => {
  const providedKey =
    request.get('x-admin-key') || request.body?.accessKey || request.query?.accessKey || '';
  const expectedKey = process.env.SYSTEM_ADMIN_ACCESS_KEY || '';

  if (!expectedKey || providedKey !== expectedKey) {
    return response.status(401).json({
      message: 'A valid system admin access key is required to send a test email.',
    });
  }

  const to = String(request.body?.to || request.query?.to || '').trim();
  if (!to) {
    return response.status(400).json({
      message: 'Provide a "to" address to send the test email.',
    });
  }

  const result = await sendEmail(to, {
    subject: 'SACCFP email diagnostics test',
    html:
      '<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;color:#0f172a;">' +
      '<h2 style="color:#087536;">SACCFP email is working</h2>' +
      '<p>This is a diagnostics test message. If you can read it, outbound email delivery from the server is functioning.</p>' +
      `<p style="color:#64748b;font-size:12px;">Sent at ${new Date().toISOString()}</p>` +
      '</div>',
  });

  return response.status(result.sent ? 200 : 502).json(result);
});

export default router;
