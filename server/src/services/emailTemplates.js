import { mailConfig } from '../config/mail.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const firstName = (fullName) => String(fullName || 'there').trim().split(/\s+/)[0];

const paragraph = (content) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#334155;">${content}</p>`;

const rows = (items) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:10px 0 18px;border-collapse:collapse;">
    ${items
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(
        ([label, value]) => `
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#64748b;width:40%;">${escapeHtml(label)}</td>
        <td style="padding:8px 0;font-size:13px;color:#0f172a;font-weight:700;">${escapeHtml(value)}</td>
      </tr>`,
      )
      .join('')}
  </table>`;

const linkButton = (href, label) => `
  <p style="margin:20px 0;">
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#087536;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 18px;font-size:14px;font-weight:800;">
      ${escapeHtml(label)}
    </a>
  </p>`;

const shell = (title, bodyHtml) => `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#eef2f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dbe3ee;">
      <tr>
        <td style="background:#087536;padding:22px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:900;letter-spacing:1px;">${escapeHtml(mailConfig.appName)}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:21px;line-height:1.35;color:#0f172a;">${escapeHtml(title)}</h1>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6;">
          This is an automated notification from ${escapeHtml(mailConfig.appName)}.
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const templates = {
  inviteCreated({ recipientName, institutionName, targetLevel, registrationLink, expiresAt, location }) {
    return {
      subject: `SACCFP institution invite: ${institutionName}`,
      html: shell(
        'Institution registration invite',
        paragraph(`Hello ${escapeHtml(firstName(recipientName))},`) +
          paragraph('You have been invited to register an institution on SACCFP.') +
          rows([
            ['Institution', institutionName],
            ['Target level', targetLevel],
            ['Location', location],
            ['Expires', expiresAt],
          ]) +
          linkButton(registrationLink, 'Open invite link') +
          paragraph('Use this link only for the authorized institution leader.'),
      ),
    };
  },

  institutionRegistered({ leaderName, institutionName, loginEmail, accessKey, publicUrl }) {
    return {
      subject: `SACCFP institution registered: ${institutionName}`,
      html: shell(
        'Institution registration completed',
        paragraph(`Hello ${escapeHtml(firstName(leaderName))},`) +
          paragraph('Your institution profile is now active on SACCFP.') +
          rows([
            ['Institution', institutionName],
            ['Login email', loginEmail],
            ['Access key', accessKey],
            ['Public page', publicUrl],
          ]) +
          linkButton(mailConfig.appUrl, 'Open SACCFP'),
      ),
    };
  },

  citizenWelcome({ fullName, loginEmail }) {
    return {
      subject: 'Your SACCFP citizen account is ready',
      html: shell(
        'Citizen account created',
        paragraph(`Hello ${escapeHtml(firstName(fullName))},`) +
          paragraph('Your citizen account has been created. You can now scan institution QR codes, submit reports, and track case responses.') +
          rows([['Login email', loginEmail]]) +
          linkButton(`${mailConfig.appUrl}/login`, 'Login to SACCFP'),
      ),
    };
  },

  staffAccountCreated({ fullName, institutionName, loginEmail, accessKey }) {
    return {
      subject: `SACCFP platform account created for ${institutionName}`,
      html: shell(
        'Platform account created',
        paragraph(`Hello ${escapeHtml(firstName(fullName))},`) +
          paragraph('A SACCFP platform account has been created for you.') +
          rows([
            ['Institution', institutionName],
            ['Login email', loginEmail],
            ['Access key', accessKey],
          ]) +
          linkButton(`${mailConfig.appUrl}/login`, 'Login to SACCFP'),
      ),
    };
  },

  complaintAssigned({ officerName, caseId, category, institutionName, message }) {
    return {
      subject: `New SACCFP case assigned: ${caseId}`,
      html: shell(
        'New citizen report assigned',
        paragraph(`Hello ${escapeHtml(firstName(officerName))},`) +
          paragraph(escapeHtml(message)) +
          rows([
            ['Case ID', caseId],
            ['Category', category],
            ['Institution', institutionName],
          ]) +
          linkButton(`${mailConfig.appUrl}/dashboard/officer`, 'Open officer dashboard'),
      ),
    };
  },

  complaintSubmitted({ fullName, caseId, category, institutionName }) {
    return {
      subject: `SACCFP report submitted: ${caseId}`,
      html: shell(
        'Your report was submitted',
        paragraph(`Hello ${escapeHtml(firstName(fullName))},`) +
          paragraph('Your report was received and routed to the responsible review office.') +
          rows([
            ['Case ID', caseId],
            ['Category', category],
            ['Institution', institutionName],
          ]) +
          linkButton(`${mailConfig.appUrl}/dashboard/citizen/track?caseId=${encodeURIComponent(caseId)}`, 'Track case'),
      ),
    };
  },

  complaintResponse({ fullName, caseId, responderName, actionTaken }) {
    return {
      subject: `SACCFP response received: ${caseId}`,
      html: shell(
        'Official response received',
        paragraph(`Hello ${escapeHtml(firstName(fullName))},`) +
          paragraph('A review officer has responded to your report. Please review the feedback and accept it or request escalation if it is not satisfactory.') +
          rows([
            ['Case ID', caseId],
            ['Responded by', responderName],
            ['Action taken', actionTaken],
          ]) +
          linkButton(`${mailConfig.appUrl}/dashboard/citizen/track?caseId=${encodeURIComponent(caseId)}`, 'Review response'),
      ),
    };
  },

  complaintClosed({ officerName, caseId, citizenName }) {
    return {
      subject: `SACCFP case closed by citizen: ${caseId}`,
      html: shell(
        'Citizen accepted the response',
        paragraph(`Hello ${escapeHtml(firstName(officerName))},`) +
          paragraph('The citizen accepted the response and the case is now closed.') +
          rows([
            ['Case ID', caseId],
            ['Citizen', citizenName],
          ]),
      ),
    };
  },
};
