// Full role-capability audit of SACCFP: every role performs its job end to end.
const BASE = 'http://localhost:4000/api';
let pass = 0, fail = 0; const fails = [];
async function api(method, path, token, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
    ...(body && { body: JSON.stringify(body) }),
  });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS', name); }
  else { fail++; fails.push(name + (detail ? ' :: ' + detail : '')); console.log('  FAIL', name, detail || ''); }
}
const login = async (email, password) => (await api('POST', '/auth/login', null, { email, password })).data?.token;

(async () => {
  console.log('== PUBLIC (no login) ==');
  let r = await api('GET', '/institutions');
  ok('public institution directory', r.status === 200 && Array.isArray(r.data?.items ?? r.data), 'status ' + r.status);
  r = await api('GET', '/institutions/kacyiru-sector-office/access-qr');
  ok('public QR access page (scan result)', r.status === 200, 'status ' + r.status);
  for (const p of ['/public/services', '/public/emergency-contacts', '/public/routing-guide', '/public/assistant-questions']) {
    r = await api('GET', p); ok('public info ' + p, r.status === 200, 'status ' + r.status);
  }
  r = await api('GET', '/registration/hierarchy');
  ok('public governance hierarchy', r.status === 200, 'status ' + r.status);

  console.log('== LOGIN all roles ==');
  const citizen = await login('citizen.demo@saccfp.rw', 'Citizen@12345');
  const inst = await login('institution.admin@saccfp.rw', 'Institution@12345');
  const off1 = await login('rib.officer1@saccfp.rw', 'RibOfficer1@12345');
  const off2 = await login('rib.officer2@saccfp.rw', 'RibOfficer2@12345');
  const admin = await login('national.admin@citizenfirst.gov.rw', 'Admin@12345');
  ok('citizen login', !!citizen); ok('institution admin login', !!inst);
  ok('RIB officer 1 login', !!off1); ok('RIB officer 2 login', !!off2); ok('national admin login', !!admin);
  ok('reject wrong password', (await api('POST', '/auth/login', null, { email: 'citizen.demo@saccfp.rw', password: 'WrongPass123' })).status === 401);

  console.log('== ROLE DASHBOARDS load ==');
  ok('citizen dashboard', (await api('GET', '/dashboard/citizen', citizen)).status === 200);
  ok('officer 1 dashboard', (await api('GET', '/dashboard/officer', off1)).status === 200);
  ok('officer 2 dashboard', (await api('GET', '/dashboard/officer', off2)).status === 200);
  ok('national admin dashboard', (await api('GET', '/dashboard/admin', admin)).status === 200);
  ok('officer explorer', (await api('GET', '/dashboard/officer/explorer', off1)).status === 200);

  console.log('== CITIZEN -> OFFICER -> ESCALATION -> RESOLVE lifecycle ==');
  const ctx = await api('GET', '/dashboard/citizen/context', citizen);
  ok('citizen context (accusable leaders)', ctx.status === 200 && Array.isArray(ctx.data?.accusedLeaderOptions), 'status ' + ctx.status);
  const sector = (ctx.data?.accusedLeaderOptions ?? []).find((e) => e.level === 'sector');
  ok('sector-level accusable leader visible', !!sector);
  const submit = await api('POST', '/dashboard/citizen/complaints', citizen, {
    issueType: 'corruption_issue', category: 'Abuse of authority',
    message: 'Audit: the sector desk demanded an unofficial payment; requesting independent review of this abuse of authority.',
    reportingMode: 'verified', submittedVia: 'dashboard',
    accusedLeaderEmployeeIds: sector ? [sector.leader.employeeId] : [],
  });
  ok('citizen submits corruption report', submit.status === 201 && submit.data?.item?.id, 'status ' + submit.status + ' ' + JSON.stringify(submit.data).slice(0, 100));
  const caseId = submit.data?.item?.id;
  ok('sector accusation starts review at district', submit.data?.item?.currentLevel === 'district', 'level ' + submit.data?.item?.currentLevel);

  let resp = await api('POST', `/dashboard/officer/complaints/${caseId}/respond`, off1, { message: 'District review recorded and interviewed the intake desk.', actionTaken: 'Interview completed' });
  ok('officer 1 responds at district', resp.status === 200, 'status ' + resp.status + ' ' + JSON.stringify(resp.data).slice(0, 90));
  let esc = await api('POST', `/dashboard/citizen/complaints/${caseId}/escalate`, citizen, { note: 'The response does not address the threat.' });
  ok('citizen escalates district -> province', esc.status === 200 && esc.data?.item?.currentLevel === 'province', 'level ' + esc.data?.item?.currentLevel + ' status ' + esc.status);
  resp = await api('POST', `/dashboard/officer/complaints/${caseId}/respond`, off1, { message: 'Supervisory review confirmed misconduct and opened a disciplinary file.', actionTaken: 'Disciplinary file opened' });
  ok('officer responds at province', resp.status === 200, 'status ' + resp.status);
  esc = await api('POST', `/dashboard/citizen/complaints/${caseId}/escalate`, citizen, { note: 'I want national oversight to confirm.' });
  ok('citizen escalates province -> national', esc.status === 200 && esc.data?.item?.currentLevel === 'national', 'level ' + esc.data?.item?.currentLevel + ' status ' + esc.status);
  resp = await api('POST', `/dashboard/officer/complaints/${caseId}/respond`, admin, { message: 'National oversight confirms the disciplinary action and closes the review.', actionTaken: 'Disciplinary action confirmed' });
  ok('national admin responds at national', resp.status === 200, 'status ' + resp.status + ' ' + JSON.stringify(resp.data).slice(0, 90));
  const accept = await api('POST', `/dashboard/citizen/complaints/${caseId}/accept-feedback`, citizen, { note: 'The full escalation path worked; I accept the outcome.' });
  ok('citizen accepts -> case resolved', accept.status === 200 && (accept.data?.item?.status === 'resolved'), 'status ' + accept.status + ' ' + (accept.data?.item?.status));
  const msg = await api('POST', `/dashboard/complaints/${caseId}/messages`, citizen, { body: 'Thank you for the follow-up.' });
  ok('citizen posts a case message', msg.status === 200 || msg.status === 201, 'status ' + msg.status);

  console.log('== INSTITUTION ADMIN CRUD ==');
  const IID = 'GOV-KACYIRU-SECTOR';
  const manage = await api('GET', `/registration/institutions/${IID}/manage`, inst);
  ok('institution admin manage view', manage.status === 200 && manage.data, 'status ' + manage.status);
  const u = Date.now().toString().slice(-5);
  const svc = await api('POST', `/registration/institutions/${IID}/services`, inst, { name: 'Audit service ' + u, feeType: 'free', schedule: 'Mon-Fri 08:00-12:00', documents: 'National ID', description: 'Created by audit.' });
  ok('institution admin creates a service', svc.status === 200 || svc.status === 201, 'status ' + svc.status + ' ' + JSON.stringify(svc.data).slice(0, 90));
  const dept = await api('POST', `/registration/institutions/${IID}/departments`, inst, { name: 'Audit dept ' + u, description: 'Created by audit.' });
  ok('institution admin creates a department', dept.status === 200 || dept.status === 201, 'status ' + dept.status + ' ' + JSON.stringify(dept.data).slice(0, 90));
  ok('institution admin lists employees', (await api('GET', `/registration/employees/${IID}`, inst)).status === 200);
  // cleanup service
  if (svc.status < 300) await api('DELETE', `/registration/institutions/${IID}/services/${encodeURIComponent('Audit service ' + u)}`, inst);

  console.log('== NATIONAL ADMIN institution governance ==');
  ok('admin lists all institutions', (await api('GET', '/registration/institutions', admin)).status === 200);
  const invite = await api('POST', '/registration/invites', admin, { targetLevel: 'district', institutionNameHint: 'Audit District Office', location: { country: 'Rwanda', province: 'Kigali City', district: 'Gasabo' } });
  ok('admin creates a registration invite (QR)', invite.status === 201 && invite.data?.item?.token, 'status ' + invite.status);

  console.log('== RBAC negative checks ==');
  ok('citizen blocked from officer dashboard', (await api('GET', '/dashboard/officer', citizen)).status === 403);
  ok('officer blocked from admin dashboard', (await api('GET', '/dashboard/admin', off1)).status === 403);
  ok('citizen blocked from admin dashboard', (await api('GET', '/dashboard/admin', citizen)).status === 403);
  ok('citizen blocked from creating invites', [401, 403].includes((await api('POST', '/registration/invites', citizen, { targetLevel: 'district', institutionNameHint: 'Audit District Office', location: { country: 'Rwanda', province: 'Kigali City', district: 'Gasabo' } })).status));
  ok('no token blocked from citizen dashboard', (await api('GET', '/dashboard/citizen', null)).status === 401);

  console.log('\n==== SACCFP AUDIT: ' + pass + ' passed, ' + fail + ' failed ====');
  if (fails.length) { console.log('FAILURES:'); fails.forEach((f) => console.log('  - ' + f)); }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
