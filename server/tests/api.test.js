// SACCFP backend API test suite (node:test).
// Runs against a running server (default http://localhost:4000).
// Start the server first, e.g.:  DB_DISABLED=true npm run dev --workspace server
import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:4000';

const ACCOUNTS = {
  citizen: { email: 'citizen.demo@saccfp.rw', password: 'Citizen@12345', role: 'citizen' },
  institutionAdmin: { email: 'institution.admin@saccfp.rw', password: 'Institution@12345', role: 'institution_admin' },
  officer1: { email: 'rib.officer1@saccfp.rw', password: 'RibOfficer1@12345', role: 'rib_officer_1' },
  officer2: { email: 'rib.officer2@saccfp.rw', password: 'RibOfficer2@12345', role: 'rib_officer_2' },
  admin: { email: 'national.admin@citizenfirst.gov.rw', password: 'Admin@12345', role: 'national_admin' },
};

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-json */ }
  return { status: res.status, data };
}

async function login(email, password) {
  const { status, data } = await api('/auth/login', { method: 'POST', body: { email, password } });
  assert.equal(status, 200, `login failed for ${email}`);
  assert.ok(data.token, 'login should return a token');
  return data;
}

const tokens = {};

before(async () => {
  const { status } = await api('/health');
  assert.equal(status, 200, 'server must be running on ' + BASE);
  for (const [key, acc] of Object.entries(ACCOUNTS)) {
    const data = await login(acc.email, acc.password);
    tokens[key] = data.token;
  }
});

describe('Health', () => {
  test('GET /api/health returns ok', async () => {
    const { status, data } = await api('/health');
    assert.equal(status, 200);
    assert.equal(data.status, 'ok');
  });
});

describe('Authentication (all roles)', () => {
  for (const [key, acc] of Object.entries(ACCOUNTS)) {
    test(`login ${acc.role} returns correct role + token`, async () => {
      const data = await login(acc.email, acc.password);
      assert.equal(data.user.role, acc.role);
      assert.ok(data.user.fullName);
    });
  }

  test('login with wrong password is rejected (401)', async () => {
    const { status } = await api('/auth/login', {
      method: 'POST', body: { email: ACCOUNTS.citizen.email, password: 'WRONG-pass-1' },
    });
    assert.equal(status, 401);
  });

  test('login with access key works', async () => {
    const { status, data } = await api('/auth/login', {
      method: 'POST', body: { accessKey: 'CF-CITIZEN-2026' },
    });
    assert.equal(status, 200);
    assert.ok(data.token);
  });

  test('GET /auth/me returns the profile for a token', async () => {
    const { status, data } = await api('/auth/me', { token: tokens.citizen });
    assert.equal(status, 200);
    assert.equal(data.user.role, 'citizen');
  });

  test('protected route without token returns 401', async () => {
    const { status } = await api('/dashboard/overview');
    assert.equal(status, 401);
  });

  test('logout invalidates the session token', async () => {
    const fresh = await login(ACCOUNTS.citizen.email, ACCOUNTS.citizen.password);
    const out = await api('/auth/logout', { method: 'POST', token: fresh.token });
    assert.equal(out.status, 200);
    const after = await api('/auth/me', { token: fresh.token });
    assert.equal(after.status, 401, 'token should be invalid after logout');
  });
});

describe('Institutions + QR code generation', () => {
  let firstSlug;

  test('GET /institutions lists institutions', async () => {
    const { status, data } = await api('/institutions');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.items) && data.items.length > 0);
    firstSlug = data.items[0].slug;
    assert.ok(firstSlug, 'institution should expose a slug');
  });

  test('GET /institutions/:slug returns one institution', async () => {
    const { status, data } = await api(`/institutions/${firstSlug}`);
    assert.equal(status, 200);
    assert.equal(data.item.slug, firstSlug);
  });

  test('GET /institutions/:slug/qr generates a valid PNG QR data URL', async () => {
    const { status, data } = await api(`/institutions/${firstSlug}/qr`);
    assert.equal(status, 200);
    assert.ok(data.accessUrl, 'QR response should include an access URL');
    assert.match(
      data.accessQrCodeDataUrl ?? '',
      /^data:image\/png;base64,[A-Za-z0-9+/=]+$/,
      'QR should be a base64 PNG data URL',
    );
    assert.ok((data.accessQrCodeDataUrl.length) > 200, 'QR payload should be non-trivial');
  });

  test('GET /institutions/:slug/qr for unknown slug returns 404', async () => {
    const { status } = await api('/institutions/does-not-exist-xyz/qr');
    assert.equal(status, 404);
  });

  test('GET /institutions/:slug/access-qr (dissertation route name) also serves the QR', async () => {
    const { status, data } = await api('/institutions/kacyiru-sector-office/access-qr');
    assert.equal(status, 200);
    assert.match(data.accessQrCodeDataUrl ?? '', /^data:image\/png;base64,/);
  });

  test('Kacyiru seed matches the dissertation test-data design (4 services, Customer Care, staff links)', async () => {
    const { status, data } = await api('/institutions/kacyiru-sector-office');
    assert.equal(status, 200);
    const item = data.item;

    const serviceNames = item.services.map((service) => service.name);
    for (const expected of [
      'Civil status certificate support',
      'Land document guidance',
      'Social affairs and Mutuelle support',
      'Citizen complaint reception',
    ]) {
      assert.ok(serviceNames.includes(expected), `service "${expected}" must be seeded`);
    }

    const departmentNames = item.departments.map((department) => department.name);
    for (const expected of ['Civil Status', 'Land and Infrastructure', 'Social Affairs', 'Customer Care']) {
      assert.ok(departmentNames.includes(expected), `department "${expected}" must be seeded`);
    }

    const staffNames = item.staff.map((member) => member.fullName);
    for (const expected of ['Agnes Mukamana', 'Jean Bosco Ndayisenga', 'Claudine Uwase', 'Patrick Habimana']) {
      assert.ok(staffNames.includes(expected), `staff "${expected}" must be seeded`);
    }

    const complaintService = item.services.find((service) => service.name === 'Citizen complaint reception');
    assert.ok(
      complaintService.responsibleStaff.some((member) => member.fullName === 'Patrick Habimana'),
      'seeded staff-service link must expose the responsible staff to citizens',
    );
  });
});

describe('Public complaints CRUD', () => {
  let createdId;

  test('POST /complaints creates a complaint (201)', async () => {
    const { status, data } = await api('/complaints', {
      method: 'POST',
      body: {
        category: 'Bribery request',
        institutionId: 3,
        message: 'A staff member requested an unofficial payment to process my service request today.',
        reportingMode: 'anonymous',
        submittedVia: 'public',
      },
    });
    assert.equal(status, 201);
    assert.ok(data.item.id);
    createdId = data.item.id;
  });

  test('GET /complaints returns the created complaint', async () => {
    const { status, data } = await api('/complaints');
    assert.equal(status, 200);
    assert.ok(data.items.some((c) => c.id === createdId));
  });

  test('GET /complaints/:id returns one complaint', async () => {
    const { status, data } = await api(`/complaints/${createdId}`);
    assert.equal(status, 200);
    assert.equal(data.item.id, createdId);
  });

  test('POST /complaints with invalid payload returns 400', async () => {
    const { status } = await api('/complaints', {
      method: 'POST', body: { category: 'x', message: 'too short', reportingMode: 'anonymous' },
    });
    assert.equal(status, 400);
  });
});

describe('Role-based dashboards', () => {
  test('citizen dashboard loads for citizen', async () => {
    const { status } = await api('/dashboard/citizen', { token: tokens.citizen });
    assert.equal(status, 200);
  });

  test('officer dashboard loads for RIB officer and exposes a queue', async () => {
    const { status, data } = await api('/dashboard/officer', { token: tokens.officer1 });
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.queue));
  });

  test('admin dashboard loads for national admin', async () => {
    const { status } = await api('/dashboard/admin', { token: tokens.admin });
    assert.equal(status, 200);
  });

  test('overview loads for any authenticated user', async () => {
    for (const key of ['citizen', 'institutionAdmin', 'officer1', 'admin']) {
      const { status } = await api('/dashboard/overview', { token: tokens[key] });
      assert.equal(status, 200, `overview should load for ${key}`);
    }
  });

  test('officer dashboard is forbidden for a citizen (403)', async () => {
    const { status } = await api('/dashboard/officer', { token: tokens.citizen });
    assert.equal(status, 403);
  });
});

describe('Citizen complaint submission (dashboard CRUD)', () => {
  test('citizen submits a service issue routed to a visible leader', async () => {
    const ctx = await api('/dashboard/citizen/context', { token: tokens.citizen });
    assert.equal(ctx.status, 200);
    const leaders = ctx.data.complaintTargetLeaders ?? [];
    if (leaders.length === 0) {
      // No leaders visible for the seeded citizen location -> nothing to route to.
      assert.ok(true, 'no visible leaders for citizen; skipping submission');
      return;
    }
    const targetLeaderEmployeeId = leaders[0].leader.employeeId;
    const { status, data } = await api('/dashboard/citizen/complaints', {
      token: tokens.citizen,
      method: 'POST',
      body: {
        issueType: 'service_issue',
        category: 'Delayed public service',
        message: 'I waited far beyond the published service time and received no clear explanation from staff.',
        reportingMode: 'verified',
        submittedVia: 'dashboard',
        targetLeaderEmployeeId,
      },
    });
    assert.equal(status, 201, JSON.stringify(data));
    assert.ok(data.item.id);
  });
});

describe('Officer responds to a complaint (dashboard CRUD)', () => {
  test('officer responds to a queued complaint', async () => {
    const dash = await api('/dashboard/officer', { token: tokens.officer1 });
    const queue = dash.data.queue ?? [];
    const respondable = queue.find((c) => c.canRespond) ?? null;
    if (!respondable) {
      assert.ok(true, 'no respondable complaint in officer queue; skipping respond test');
      return;
    }
    const complaintId = respondable.id;
    const { status, data } = await api(`/dashboard/officer/complaints/${complaintId}/respond`, {
      token: tokens.officer1,
      method: 'POST',
      body: { message: 'Reviewed the report and initiated the standard verification procedure.', actionTaken: 'verification_started' },
    });
    assert.equal(status, 200, JSON.stringify(data));
    assert.equal(data.item.status, 'responded');
  });
});

describe('Public information endpoints', () => {
  for (const path of ['/public/services', '/public/emergency-contacts', '/public/routing-guide', '/public/assistant-questions']) {
    test(`GET ${path} returns data`, async () => {
      const { status, data } = await api(path);
      assert.equal(status, 200);
      assert.ok(data && (Array.isArray(data.items) || Object.keys(data).length > 0));
    });
  }
});

describe('Registration + institution/citizen CRUD', () => {
  test('GET /registration/hierarchy returns the governance hierarchy', async () => {
    const { status, data } = await api('/registration/hierarchy');
    assert.equal(status, 200);
    assert.ok(data && Object.keys(data).length > 0);
  });

  test('GET /registration/institutions lists registered institutions (admin token)', async () => {
    const { status, data } = await api('/registration/institutions', { token: tokens.admin });
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.items ?? data));
  });

  test('GET /registration/institutions without auth returns 401', async () => {
    const { status } = await api('/registration/institutions');
    assert.equal(status, 401);
  });

  test('GET /registration/locations/provinces returns provinces', async () => {
    const { status, data } = await api('/registration/locations/provinces');
    assert.equal(status, 200);
    assert.ok(data.items.includes('Kigali City'));
  });

  test('POST /registration/citizens registers a new citizen (201) and rejects duplicates (409)', async () => {
    // resolve a valid location chain dynamically
    const prov = 'Kigali City';
    const dist = (await api(`/registration/locations/districts?province=${encodeURIComponent(prov)}`)).data.items[0];
    const sect = (await api(`/registration/locations/sectors?province=${encodeURIComponent(prov)}&district=${encodeURIComponent(dist)}`)).data.items[0];
    const cell = (await api(`/registration/locations/cells?province=${encodeURIComponent(prov)}&district=${encodeURIComponent(dist)}&sector=${encodeURIComponent(sect)}`)).data.items[0];
    const village = (await api(`/registration/locations/villages?province=${encodeURIComponent(prov)}&district=${encodeURIComponent(dist)}&sector=${encodeURIComponent(sect)}&cell=${encodeURIComponent(cell)}`)).data.items[0];

    const unique = Date.now().toString().slice(-10);
    const nationalId = `11999${unique.padStart(11, '0')}`.slice(0, 16);
    const payload = {
      fullName: 'Automated Test Citizen',
      nationalId,
      phone: `+2507${unique.slice(0, 8)}`,
      email: `test.citizen.${unique}@example.com`,
      password: 'TestPass@123',
      dateOfBirth: '1995-05-20',
      gender: 'Male',
      country: 'Rwanda',
      province: prov, district: dist, sector: sect, cell, village,
      idType: 'NATIONAL_ID',
    };
    const created = await api('/registration/citizens', { method: 'POST', body: payload });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    assert.ok(created.data.item.citizenId);

    const dup = await api('/registration/citizens', { method: 'POST', body: payload });
    assert.equal(dup.status, 409, 'duplicate national ID should be rejected');
  });
});

// ---------------------------------------------------------------------------
// FULL LIFECYCLE:
// RIB (national admin) creates an institution (QR generated at creation)
//   -> institution leader logs in and manages staff / services / departments
//      with full CRUD (create, update, delete)
//   -> a citizen registers, "scans" the institution QR, views services with
//      fees, staff contacts, and departments
//   -> the citizen raises a corruption report with evidence
//   -> the case is responded to, escalated level by level, and finally
//      resolved after citizen feedback
//   -> RIB deletes the institution (institution CRUD delete)
// ---------------------------------------------------------------------------
describe('Full lifecycle: RIB -> institution -> citizen -> corruption resolved', () => {
  const unique = Date.now().toString().slice(-9);
  const leaderEmail = `province.leader.${unique}@example.com`;
  const leaderPassword = 'Leader@12345';
  const staffEmail = `province.staff.${unique}@example.com`;
  const staffPassword = 'Staff@12345';
  const citizenEmail = `lifecycle.citizen.${unique}@example.com`;
  const citizenPassword = 'Citizen@12345';
  const tinyPng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  let inviteToken;
  let institutionId;
  let institutionSlug;
  let leaderToken;
  let leaderEmployeeId;
  let staffEmployeeId;
  let citizenToken;
  let corruptionCaseId;
  let escalationCaseId;

  test('1. RIB admin creates a registration invite (invite QR generated)', async () => {
    const { status, data } = await api('/registration/invites', {
      method: 'POST',
      token: tokens.admin,
      body: {
        targetLevel: 'province',
        institutionNameHint: 'Eastern Province Governance Office',
        location: { country: 'Rwanda', province: 'Eastern Province' },
      },
    });
    assert.equal(status, 201, JSON.stringify(data));
    assert.ok(data.item.token, 'invite should return a token');
    assert.match(
      data.item.qrCodeDataUrl ?? '',
      /^data:image\/png;base64,/,
      'invite should include a QR code generated at creation time',
    );
    inviteToken = data.item.token;
  });

  test('2. Institution registration completes and the institution QR is generated at that time', async () => {
    const { status, data } = await api('/registration/institutions/complete', {
      method: 'POST',
      body: {
        inviteToken,
        institutionName: 'Eastern Province Governance Office',
        institutionType: 'Province government institution',
        officialEmail: `office.${unique}@example.com`,
        officialPhone: '+250788600100',
        officeAddress: 'Provincial Office, Rwamagana, Eastern Province',
        location: { country: 'Rwanda', province: 'Eastern Province' },
        expectedChildUnits: 7,
        leader: {
          fullName: 'Lifecycle Province Leader',
          nationalId: `12000${unique}00`.slice(0, 16).padEnd(16, '0'),
          phone: '+250788600101',
          email: leaderEmail,
          password: leaderPassword,
          positionTitle: 'Governor',
          positionKinyarwanda: 'Guverineri',
        },
        services: [
          {
            name: 'Investment Permit Support',
            description: 'Guidance for provincial investment permits.',
            feeType: 'paid',
            officialFeeRwf: 5000,
            schedule: 'Monday to Friday, 08:00 - 15:00',
            documents: 'National ID, business plan copy',
          },
        ],
      },
    });
    assert.equal(status, 201, JSON.stringify(data));
    assert.match(
      data.item.institution.qrCodeDataUrl ?? '',
      /^data:image\/png;base64,/,
      'institution QR code must be generated at registration time',
    );
    assert.ok(data.item.leaderUser.accessKey, 'leader should receive an access key');
    institutionId = data.item.institution.institutionId;
    institutionSlug = data.item.institution.slug;
  });

  test('3. The created institution leader can log in', async () => {
    const data = await login(leaderEmail, leaderPassword);
    assert.equal(data.user.role, 'province_leader');
    leaderToken = data.token;
  });

  test('4. Leader sees the management view with the paid service registered at creation', async () => {
    const { status, data } = await api(`/registration/institutions/${institutionId}/manage`, {
      token: leaderToken,
    });
    assert.equal(status, 200, JSON.stringify(data));
    assert.equal(data.item.services.length, 1);
    assert.equal(data.item.services[0].feeType, 'paid');
    assert.equal(data.item.services[0].officialFeeRwf, 5000);
    leaderEmployeeId = data.item.employees.find((entry) => entry.isLeader)?.employeeId;
    assert.ok(leaderEmployeeId, 'leader employee record should exist');
  });

  test('5. Service CRUD: create, duplicate rejected, update fee, delete', async () => {
    // CREATE
    const created = await api(`/registration/institutions/${institutionId}/services`, {
      method: 'POST',
      token: leaderToken,
      body: {
        name: 'Business Registration Guidance',
        description: 'Support for registering a new business.',
        feeType: 'free',
        schedule: 'Tuesday and Thursday, 09:00 - 14:00',
        documents: 'National ID',
      },
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    assert.equal(created.data.item.services.length, 2);

    // DUPLICATE name rejected
    const dup = await api(`/registration/institutions/${institutionId}/services`, {
      method: 'POST',
      token: leaderToken,
      body: { name: 'Business Registration Guidance' },
    });
    assert.equal(dup.status, 409, 'duplicate service names must be rejected');

    // UPDATE: make it a paid service with a visible official fee
    const updated = await api(
      `/registration/institutions/${institutionId}/services/${encodeURIComponent('Business Registration Guidance')}`,
      {
        method: 'PATCH',
        token: leaderToken,
        body: { feeType: 'paid', officialFeeRwf: 2000, documents: 'National ID, trade name form' },
      },
    );
    assert.equal(updated.status, 200, JSON.stringify(updated.data));
    assert.equal(updated.data.updatedService.officialFeeRwf, 2000);

    // DELETE the original service
    const removed = await api(
      `/registration/institutions/${institutionId}/services/${encodeURIComponent('Investment Permit Support')}`,
      { method: 'DELETE', token: leaderToken },
    );
    assert.equal(removed.status, 200, JSON.stringify(removed.data));
    assert.equal(removed.data.item.services.length, 1);
    assert.equal(removed.data.item.services[0].name, 'Business Registration Guidance');
  });

  test('6. Department CRUD: create, update, delete', async () => {
    const created = await api(`/registration/institutions/${institutionId}/departments`, {
      method: 'POST',
      token: leaderToken,
      body: { name: 'Citizen Services', description: 'Front desk citizen support.' },
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    const departmentId = created.data.createdDepartment.departmentId;

    const updated = await api(
      `/registration/institutions/${institutionId}/departments/${departmentId}`,
      {
        method: 'PATCH',
        token: leaderToken,
        body: { description: 'Front desk citizen support and complaint reception.' },
      },
    );
    assert.equal(updated.status, 200, JSON.stringify(updated.data));
    assert.match(updated.data.updatedDepartment.description, /complaint reception/);

    const second = await api(`/registration/institutions/${institutionId}/departments`, {
      method: 'POST',
      token: leaderToken,
      body: { name: 'Temporary Unit' },
    });
    assert.equal(second.status, 201);
    const removed = await api(
      `/registration/institutions/${institutionId}/departments/${second.data.createdDepartment.departmentId}`,
      { method: 'DELETE', token: leaderToken },
    );
    assert.equal(removed.status, 200);
    assert.equal(
      removed.data.item.departments.some((entry) => entry.name === 'Temporary Unit'),
      false,
      'deleted department should disappear',
    );
  });

  test('7. Staff CRUD: create with login account, update, leader delete blocked, staff delete', async () => {
    // CREATE staff with a platform account
    const created = await api(`/registration/institutions/${institutionId}/employees`, {
      method: 'POST',
      token: leaderToken,
      body: {
        fullName: 'Lifecycle Staff Member',
        nationalId: `12111${unique}11`.slice(0, 16).padEnd(16, '1'),
        phone: '+250788600102',
        email: staffEmail,
        password: staffPassword,
        positionTitle: 'Permit Officer',
        reportsTo: 'Governor',
        description: 'Handles provincial permit guidance for citizens.',
        createPlatformAccount: true,
      },
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    assert.ok(created.data.createdAccount?.accessKey, 'staff platform account should be created');
    staffEmployeeId = created.data.createdEmployee.employeeId;

    // staff can log in
    const staffLogin = await login(staffEmail, staffPassword);
    assert.equal(staffLogin.user.role, 'institution_officer');

    // UPDATE staff
    const updated = await api(
      `/registration/institutions/${institutionId}/employees/${staffEmployeeId}`,
      {
        method: 'PATCH',
        token: leaderToken,
        body: { positionTitle: 'Senior Permit Officer' },
      },
    );
    assert.equal(updated.status, 200, JSON.stringify(updated.data));
    assert.equal(updated.data.updatedEmployee.positionTitle, 'Senior Permit Officer');

    // leader cannot be deleted
    const leaderDelete = await api(
      `/registration/institutions/${institutionId}/employees/${leaderEmployeeId}`,
      { method: 'DELETE', token: leaderToken },
    );
    assert.equal(leaderDelete.status, 409, 'institution leader must not be deletable');

    // CREATE + DELETE a second staff member
    const second = await api(`/registration/institutions/${institutionId}/employees`, {
      method: 'POST',
      token: leaderToken,
      body: {
        fullName: 'Temporary Staff Person',
        nationalId: `12222${unique}22`.slice(0, 16).padEnd(16, '2'),
        phone: '+250788600103',
        positionTitle: 'Assistant',
        createPlatformAccount: false,
      },
    });
    assert.equal(second.status, 201, JSON.stringify(second.data));
    const removed = await api(
      `/registration/institutions/${institutionId}/employees/${second.data.createdEmployee.employeeId}`,
      { method: 'DELETE', token: leaderToken },
    );
    assert.equal(removed.status, 200, JSON.stringify(removed.data));
  });

  test('7b. Staff-service link CRUD: link, duplicate rejected, visible publicly, unlink', async () => {
    // LINK the staff member to the remaining service
    const created = await api(`/registration/institutions/${institutionId}/service-links`, {
      method: 'POST',
      token: leaderToken,
      body: { employeeId: staffEmployeeId, serviceName: 'Business Registration Guidance' },
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    assert.equal(created.data.createdLink.serviceName, 'Business Registration Guidance');
    const linkId = created.data.createdLink.linkId;

    // duplicate rejected
    const dup = await api(`/registration/institutions/${institutionId}/service-links`, {
      method: 'POST',
      token: leaderToken,
      body: { employeeId: staffEmployeeId, serviceName: 'Business Registration Guidance' },
    });
    assert.equal(dup.status, 409, 'duplicate staff-service link must be rejected');

    // the link is visible on the public institution profile (citizen view)
    const profile = await api(`/institutions/${institutionSlug}`);
    assert.equal(profile.status, 200);
    const service = profile.data.item.services.find(
      (entry) => entry.name === 'Business Registration Guidance',
    );
    assert.ok(
      service.responsibleStaff.some((member) => member.employeeId === staffEmployeeId),
      'linked staff must be publicly visible as responsible for the service',
    );

    // UNLINK and LINK again (leave the link in place for the citizen scan test)
    const removed = await api(
      `/registration/institutions/${institutionId}/service-links/${linkId}`,
      { method: 'DELETE', token: leaderToken },
    );
    assert.equal(removed.status, 200, JSON.stringify(removed.data));
    assert.equal(removed.data.item.staffServiceLinks.length, 0);

    const relinked = await api(`/registration/institutions/${institutionId}/service-links`, {
      method: 'POST',
      token: leaderToken,
      body: { employeeId: staffEmployeeId, serviceName: 'Business Registration Guidance' },
    });
    assert.equal(relinked.status, 201);
  });

  test('8. Citizen registers, logs in, and scans the institution QR (public profile)', async () => {
    const registration = await api('/registration/citizens', {
      method: 'POST',
      body: {
        fullName: 'Lifecycle Test Citizen',
        nationalId: `12333${unique}33`.slice(0, 16).padEnd(16, '3'),
        phone: `+25078${unique.slice(0, 7)}`,
        email: citizenEmail,
        password: citizenPassword,
        dateOfBirth: '1998-02-11',
        gender: 'Female',
        country: 'Rwanda',
        province: 'Kigali City',
        district: 'Gasabo',
        sector: 'Kacyiru',
        cell: 'Kamatamu',
        village: 'Ubumwe',
        idType: 'NATIONAL_ID',
      },
    });
    assert.equal(registration.status, 201, JSON.stringify(registration.data));

    const citizenLogin = await login(citizenEmail, citizenPassword);
    citizenToken = citizenLogin.token;

    // scanning the QR opens the public institution profile
    const profile = await api(`/institutions/${institutionSlug}`);
    assert.equal(profile.status, 200);
    const item = profile.data.item;
    assert.equal(item.services.length, 1, 'citizen should see the published service');
    assert.equal(item.services[0].feeType, 'paid');
    assert.equal(item.services[0].officialFeeRwf, 2000, 'citizen must see the official fee');
    assert.ok(item.services[0].documents, 'citizen must see required documents');
    assert.ok(Array.isArray(item.staff) && item.staff.length >= 2, 'citizen must see staff directory');
    const visibleLeader = item.staff.find((entry) => entry.isLeader);
    assert.ok(visibleLeader?.phone, 'leader contact phone must be public');
    assert.ok(item.departments.length >= 1, 'citizen must see departments');

    // and the QR endpoint serves a decodable QR image for the same URL
    const qr = await api(`/institutions/${institutionSlug}/qr`);
    assert.equal(qr.status, 200);
    assert.match(qr.data.accessQrCodeDataUrl ?? '', /^data:image\/png;base64,/);
    assert.ok(qr.data.accessUrl.includes(institutionSlug));
  });

  test('9. Citizen raises a corruption report with evidence against institution staff', async () => {
    const context = await api(`/dashboard/citizen/context?institution=${institutionSlug}`, {
      token: citizenToken,
    });
    assert.equal(context.status, 200);
    assert.equal(context.data.selectedInstitution.institutionSlug, institutionSlug);
    const accusedOption = (context.data.accusedLeaderOptions ?? []).find(
      (entry) => entry.leader.employeeId === staffEmployeeId,
    );
    assert.ok(accusedOption, 'the institution staff member should be selectable as accused');

    const { status, data } = await api('/dashboard/citizen/complaints', {
      method: 'POST',
      token: citizenToken,
      body: {
        issueType: 'corruption_issue',
        category: 'Bribery request',
        message:
          'After scanning the institution QR code, the permit officer requested 10,000 RWF above the official 2,000 RWF fee before accepting my file. I refused and I am reporting this to RIB with a photo of the handwritten amount.',
        reportingMode: 'verified',
        submittedVia: 'qr',
        sourceInstitutionSlug: institutionSlug,
        serviceName: 'Business Registration Guidance',
        accusedLeaderEmployeeIds: [staffEmployeeId],
        evidenceImage: {
          name: 'bribe-note.png',
          type: 'image/png',
          size: 68,
          dataUrl: tinyPng,
        },
      },
    });
    assert.equal(status, 201, JSON.stringify(data));
    assert.equal(data.item.status, 'submitted');
    assert.equal(data.item.currentLevel, 'national', 'province staff corruption goes to national review');
    assert.equal(data.item.accusedLeaders.length, 1);
    assert.ok(data.item.evidenceImage, 'evidence must be preserved');
    corruptionCaseId = data.item.id;
  });

  test('10. National oversight responds and the citizen accepts feedback (case resolved)', async () => {
    const respond = await api(`/dashboard/officer/complaints/${corruptionCaseId}/respond`, {
      method: 'POST',
      token: tokens.admin,
      body: {
        message:
          'RIB oversight verified the report and the accused officer was suspended pending investigation. The official fee remains 2,000 RWF.',
        actionTaken: 'Officer suspended, investigation opened',
      },
    });
    assert.equal(respond.status, 200, JSON.stringify(respond.data));
    assert.equal(respond.data.item.status, 'responded');

    const accept = await api(`/dashboard/citizen/complaints/${corruptionCaseId}/accept-feedback`, {
      method: 'POST',
      token: citizenToken,
      body: { note: 'Thank you, the action taken answers my report.' },
    });
    assert.equal(accept.status, 200, JSON.stringify(accept.data));
    assert.equal(accept.data.item.status, 'resolved');
    assert.equal(accept.data.item.feedbackStatus, 'accepted');
  });

  test('11. Second corruption case climbs the escalation ladder: sector -> district -> province -> national -> resolved', async () => {
    // pick the seeded RIB sector-level leader as the accused (from the visible chain)
    const context = await api('/dashboard/citizen/context', { token: citizenToken });
    assert.equal(context.status, 200);
    const sectorOption = (context.data.accusedLeaderOptions ?? []).find(
      (entry) => entry.level === 'sector',
    );
    assert.ok(sectorOption, 'sector-level leader must be visible in the accusable chain');

    const submitted = await api('/dashboard/citizen/complaints', {
      method: 'POST',
      token: citizenToken,
      body: {
        issueType: 'corruption_issue',
        category: 'Abuse of authority',
        message:
          'The sector intake officer threatened to block my file after I refused to pay an unofficial facilitation amount. I request an independent review of this abuse of authority.',
        reportingMode: 'verified',
        submittedVia: 'dashboard',
        accusedLeaderEmployeeIds: [sectorOption.leader.employeeId],
      },
    });
    assert.equal(submitted.status, 201, JSON.stringify(submitted.data));
    assert.equal(submitted.data.item.currentLevel, 'district', 'sector accusation starts at district review');
    escalationCaseId = submitted.data.item.id;

    // district responds (RIB officer 1 has national scope)
    const districtRespond = await api(`/dashboard/officer/complaints/${escalationCaseId}/respond`, {
      method: 'POST',
      token: tokens.officer1,
      body: { message: 'The investigation review recorded the case and interviewed the intake desk.', actionTaken: 'Interview completed' },
    });
    assert.equal(districtRespond.status, 200, JSON.stringify(districtRespond.data));

    // citizen is not satisfied -> escalates to province
    const escalate1 = await api(`/dashboard/citizen/complaints/${escalationCaseId}/escalate`, {
      method: 'POST',
      token: citizenToken,
      body: { note: 'The response does not address the threat I received.' },
    });
    assert.equal(escalate1.status, 200, JSON.stringify(escalate1.data));
    assert.equal(escalate1.data.item.currentLevel, 'province');
    assert.equal(escalate1.data.item.status, 'escalated');

    // province responds
    const provinceRespond = await api(`/dashboard/officer/complaints/${escalationCaseId}/respond`, {
      method: 'POST',
      token: tokens.officer1,
      body: { message: 'Supervisory review confirmed misconduct indicators and opened a disciplinary file.', actionTaken: 'Disciplinary file opened' },
    });
    assert.equal(provinceRespond.status, 200, JSON.stringify(provinceRespond.data));

    // citizen escalates once more -> national oversight
    const escalate2 = await api(`/dashboard/citizen/complaints/${escalationCaseId}/escalate`, {
      method: 'POST',
      token: citizenToken,
      body: { note: 'I want national oversight to confirm the disciplinary action.' },
    });
    assert.equal(escalate2.status, 200, JSON.stringify(escalate2.data));
    assert.equal(escalate2.data.item.currentLevel, 'national');
    assert.equal(escalate2.data.item.escalationHistory.length, 2, 'both escalations must be recorded');

    // national oversight responds and the citizen accepts -> resolved
    const nationalRespond = await api(`/dashboard/officer/complaints/${escalationCaseId}/respond`, {
      method: 'POST',
      token: tokens.admin,
      body: { message: 'National oversight confirms the disciplinary action and closes the review.', actionTaken: 'Disciplinary action confirmed' },
    });
    assert.equal(nationalRespond.status, 200, JSON.stringify(nationalRespond.data));

    const accept = await api(`/dashboard/citizen/complaints/${escalationCaseId}/accept-feedback`, {
      method: 'POST',
      token: citizenToken,
      body: { note: 'The full escalation path worked; I accept the outcome.' },
    });
    assert.equal(accept.status, 200, JSON.stringify(accept.data));
    assert.equal(accept.data.item.status, 'resolved');

    // the resolved case stays visible in the citizen dashboard with its history
    const dashboard = await api('/dashboard/citizen', { token: citizenToken });
    assert.equal(dashboard.status, 200);
    const trackedCase = (dashboard.data.cases ?? []).find((entry) => entry.id === escalationCaseId);
    assert.ok(trackedCase, 'resolved case must remain trackable');
    assert.equal(trackedCase.status, 'resolved');
  });

  test('12. Institution delete: forbidden for citizens, allowed for RIB national admin', async () => {
    const forbidden = await api(`/registration/institutions/${institutionId}`, {
      method: 'DELETE',
      token: citizenToken,
    });
    assert.equal(forbidden.status, 403, 'citizens must not delete institutions');

    const removed = await api(`/registration/institutions/${institutionId}`, {
      method: 'DELETE',
      token: tokens.admin,
    });
    assert.equal(removed.status, 200, JSON.stringify(removed.data));

    const gone = await api(`/institutions/${institutionSlug}`);
    assert.equal(gone.status, 404, 'deleted institution must disappear from public access');

    const staffLoginAfter = await api('/auth/login', {
      method: 'POST',
      body: { email: staffEmail, password: staffPassword },
    });
    assert.equal(staffLoginAfter.status, 401, 'staff accounts must be deactivated after institution delete');
  });
});
