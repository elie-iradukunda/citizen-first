import { test, expect } from '@playwright/test';
import fs from 'node:fs';

// Full UI lifecycle:
//  A. institution admin CRUD (services / departments / staff) with pop-up modals
//  B. citizen public QR access page with view-details modals
//  C. citizen scans QR, views services, reports corruption, then the case is
//     responded to, escalated, and resolved through the citizen UI.
const SHOTS = 'e2e/screenshots';
fs.mkdirSync(SHOTS, { recursive: true });
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

test.describe.configure({ mode: 'serial' });

const stamp = Date.now().toString().slice(-6);
// names must be stable under the server's titleCase normalization
const serviceName = `Notary Support Desk ${stamp}`;
const departmentName = `Digital Records Unit ${stamp}`;
const staffName = `Test Staff Person ${stamp}`;

const ACCOUNTS = {
  citizen: { email: 'citizen.demo@saccfp.rw', password: 'Citizen@12345' },
  institution: { email: 'institution.admin@saccfp.rw', password: 'Institution@12345' },
  officer1: { email: 'rib.officer1@saccfp.rw', password: 'RibOfficer1@12345' },
};

async function login(page, { email, password }) {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20_000 });
}

async function apiLogin(request, { email, password }) {
  const res = await request.post('/api/auth/login', { data: { email, password } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).token;
}

const dialog = (page) => page.locator('[role="dialog"]');

async function closeDialog(page) {
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(dialog(page)).toHaveCount(0);
}

test('A. institution admin: full service/department/staff CRUD with modals', async ({ page }) => {
  await login(page, ACCOUNTS.institution);
  await expect(page.locator('h1')).toContainText(/Kacyiru Sector Office/i, { timeout: 20_000 });

  // --- SERVICE create ---
  const servicesPanel = page.locator('section#services');
  await servicesPanel.locator('input[name="name"]').fill(serviceName);
  await servicesPanel.locator('select[name="feeType"]').selectOption('paid');
  await servicesPanel.locator('input[name="officialFeeRwf"]').fill('1500');
  await servicesPanel.locator('input[name="schedule"]').fill('Monday to Friday, 08:00 - 12:00');
  await servicesPanel.locator('input[name="documents"]').fill('National ID, request letter');
  await servicesPanel.locator('input[name="description"]').fill('Notary support created by the e2e test.');
  await servicesPanel.getByRole('button', { name: /add service/i }).click();
  await expect(servicesPanel).toContainText(`Service "${serviceName}" was registered.`);

  const serviceCard = servicesPanel.locator('article', { hasText: serviceName });
  await expect(serviceCard).toContainText('1,500 RWF');
  await shot(page, '20-admin-service-created');

  // --- SERVICE view details modal ---
  await serviceCard.getByRole('button', { name: 'View Details' }).click();
  await expect(dialog(page)).toContainText('1,500 RWF');
  await expect(dialog(page)).toContainText('National ID, request letter');
  await shot(page, '21-admin-service-details-modal');
  await closeDialog(page);

  // --- SERVICE edit via modal ---
  await serviceCard.getByRole('button', { name: 'Edit' }).click();
  await dialog(page).locator('input[name="officialFeeRwf"]').fill('2500');
  await dialog(page).getByRole('button', { name: /save service/i }).click();
  await expect(servicesPanel).toContainText('Service updated successfully.');
  await expect(serviceCard).toContainText('2,500 RWF');

  // --- SERVICE delete via confirm modal ---
  await serviceCard.getByRole('button', { name: 'Delete' }).click();
  await dialog(page).getByRole('button', { name: /delete service/i }).click();
  await expect(servicesPanel).toContainText('Service deleted successfully.');
  await expect(servicesPanel.locator('article', { hasText: serviceName })).toHaveCount(0);

  // --- DEPARTMENT create / edit / delete ---
  const departmentsPanel = page.locator('section#departments');
  await departmentsPanel.locator('input[name="name"]').fill(departmentName);
  await departmentsPanel.locator('input[name="description"]').fill('Handles digital archives.');
  await departmentsPanel.getByRole('button', { name: /add department/i }).click();
  await expect(departmentsPanel).toContainText(`Department "${departmentName}" was created.`);

  const departmentCard = departmentsPanel.locator('article', { hasText: departmentName });
  await departmentCard.getByRole('button', { name: 'Edit' }).click();
  await dialog(page).locator('input[name="description"]').fill('Handles digital archives and citizen records.');
  await dialog(page).getByRole('button', { name: /save department/i }).click();
  await expect(departmentsPanel).toContainText('Department updated successfully.');
  await expect(departmentCard).toContainText('citizen records');

  await departmentCard.getByRole('button', { name: 'Delete' }).click();
  await dialog(page).getByRole('button', { name: /delete department/i }).click();
  await expect(departmentsPanel).toContainText('Department deleted successfully.');
  await expect(departmentsPanel.locator('article', { hasText: departmentName })).toHaveCount(0);

  // --- STAFF create / view / edit / delete ---
  const staffPanel = page.locator('section#staff');
  await staffPanel.locator('input[name="fullName"]').fill(staffName);
  await staffPanel.locator('input[name="nationalId"]').fill(`1198${stamp}00990011`.slice(0, 16));
  await staffPanel.locator('input[name="phone"]').fill('+250788555001');
  await staffPanel.locator('input[name="positionTitle"]').fill('Records Officer');
  await staffPanel.locator('input[name="email"]').fill(`e2e.staff.${stamp}@saccfp.rw`);
  await staffPanel.getByRole('button', { name: /add staff/i }).click();
  await expect(staffPanel).toContainText(`${staffName} was registered as staff.`);

  const staffCard = staffPanel.locator('article', { hasText: staffName });
  await staffCard.getByRole('button', { name: 'View Details' }).click();
  await expect(dialog(page)).toContainText('Records Officer');
  await expect(dialog(page)).toContainText('+250788555001');
  await shot(page, '22-admin-staff-details-modal');
  await closeDialog(page);

  await staffCard.getByRole('button', { name: 'Edit' }).click();
  await dialog(page).locator('input[name="positionTitle"]').fill('Senior Records Officer');
  await dialog(page).getByRole('button', { name: /save staff/i }).click();
  await expect(staffPanel).toContainText('Staff member updated successfully.');
  await expect(staffCard).toContainText('Senior Records Officer');

  await staffCard.getByRole('button', { name: 'Delete' }).click();
  await dialog(page).getByRole('button', { name: /delete staff/i }).click();
  await expect(staffPanel).toContainText('Staff member deleted successfully.');
  await expect(staffPanel.locator('article', { hasText: staffName })).toHaveCount(0);

  // --- LINK STAFF TO SERVICES (dissertation Table 16 sidebar feature) ---
  const linkingPanel = page.locator('section#linking');
  await expect(linkingPanel).toContainText(/Link staff to services/i);
  // seeded Kacyiru links are already present
  await expect(linkingPanel.locator('article', { hasText: 'Patrick Habimana' })).toContainText(
    'Citizen complaint reception',
  );
  // create a new link: default selects (leader + first service) are unlinked in the seed
  await linkingPanel.getByRole('button', { name: /^link$/i }).click();
  await expect(linkingPanel).toContainText(/is now responsible for/i);
  await shot(page, '23a-admin-staff-service-linked');
  // and unlink it again to leave the seed unchanged
  const newLinkCard = linkingPanel.locator('article', { hasText: 'Kacyiru Sector Institution Admin' });
  await newLinkCard.getByRole('button', { name: /unlink/i }).click();
  await expect(linkingPanel).toContainText('Staff-service link removed successfully.');

  // --- QR stays live through it all ---
  const qr = page.locator('img[alt^="Real QR code"]');
  await expect(qr).toBeVisible();
  expect(await qr.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
  await shot(page, '23-admin-crud-complete');
});

test('B. public QR access page shows services, staff contacts, and details modals', async ({ page }) => {
  await page.goto('/institutions/kacyiru-sector-office');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('body')).toContainText(/QR Public Access/i);
  await expect(page.locator('body')).toContainText(/Staff who support these services/i);

  // service details modal (fees + documents) - scope to the service card itself
  await page
    .locator('article', { hasText: 'Civil status certificate support' })
    .getByRole('button', { name: 'View Details' })
    .click();
  await expect(dialog(page)).toContainText(/Official fee/i);
  await expect(dialog(page)).toContainText(/Required documents/i);
  await shot(page, '24-public-service-details-modal');
  await closeDialog(page);

  // staff details modal (contacts + duties) - scope to the staff card itself
  // (service cards also mention staff names via "Responsible staff", so filter
  // by the phone number that only the staff card displays)
  await page
    .locator('article', { hasText: 'Agnes Mukamana' })
    .filter({ hasText: '+250788111201' })
    .getByRole('button', { name: 'View Details' })
    .click();
  await expect(dialog(page)).toContainText(/Phone/i);
  await expect(dialog(page)).toContainText(/Duties/i);
  await shot(page, '25-public-staff-details-modal');
  await closeDialog(page);
});

test('C. citizen: scan QR -> view details -> report corruption -> respond -> escalate -> resolve', async ({ page }) => {
  await login(page, ACCOUNTS.citizen);

  // --- scan result page for the scanned institution ---
  await page.goto('/dashboard/citizen/scan-services?institution=kacyiru-sector-office');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).toContainText(/Kacyiru Sector Office QR scan result/i);

  // service details modal from the scanned catalog
  await page.getByRole('button', { name: 'View Details' }).first().click();
  await expect(dialog(page)).toContainText(/Official fee/i);
  await shot(page, '26-citizen-scan-service-modal');
  await closeDialog(page);

  // --- submit a corruption report against scanned institution staff ---
  await page.goto('/dashboard/citizen/submit?institution=kacyiru-sector-office&source=qr');
  await page.waitForLoadState('networkidle');
  await page.locator('select[name="issueType"]').selectOption('corruption_issue');
  const accused = page.locator('select[multiple]');
  await expect(accused).toBeVisible();
  expect(await accused.locator('option').count()).toBeGreaterThan(0);
  await accused.selectOption({ index: 0 });
  await page.locator('textarea[name="message"]').fill(
    'After scanning the Kacyiru Sector Office QR code and checking the official fee, a staff member requested an unofficial payment above the published amount before serving me. I am reporting this corruption to RIB. Automated full-lifecycle e2e test.',
  );
  await page.getByRole('button', { name: /submit to rib/i }).click();
  // the page refetches dashboard data right after submitting, so poll until the
  // success banner (with the generated case id) is stable
  let caseId;
  await expect
    .poll(
      async () => {
        caseId = (await page.locator('body').innerText()).match(/Submitted:\s*(CF-\d{4}-\d{4})/)?.[1];
        return caseId ?? null;
      },
      { timeout: 20_000, message: 'case id must be shown to the citizen' },
    )
    .not.toBeNull();
  await shot(page, '27-citizen-corruption-submitted');

  // --- case appears in My Reports with a full details modal ---
  await page.goto('/dashboard/citizen/reports');
  await page.waitForLoadState('networkidle');
  // Panels are nested inside the page wrapper <section>; .last() picks the case panel itself
  const caseCard = page.locator('section', { hasText: caseId }).last();
  await expect(caseCard).toBeVisible();
  await caseCard.getByRole('button', { name: 'View Details' }).click();
  await expect(dialog(page)).toContainText('Report message');
  await expect(dialog(page)).toContainText(/Accused officials/i);
  await shot(page, '28-citizen-case-details-modal');
  await closeDialog(page);

  // --- RIB responds (officer API), citizen escalates through the UI ---
  const officerToken = await apiLogin(page.request, ACCOUNTS.officer1);
  const firstResponse = await page.request.post(`/api/dashboard/officer/complaints/${caseId}/respond`, {
    headers: { Authorization: `Bearer ${officerToken}` },
    data: {
      message: 'The investigation review recorded your corruption report and interviewed the service desk.',
      actionTaken: 'Interview completed',
    },
  });
  expect(firstResponse.ok()).toBeTruthy();

  await page.reload();
  await page.waitForLoadState('networkidle');
  const respondedCard = page.locator('section', { hasText: caseId }).last();
  await expect(respondedCard).toContainText(/RIB response from/i);
  await respondedCard.getByRole('button', { name: 'Escalate' }).click();
  await expect(page.locator('body')).toContainText(`${caseId} was escalated for further RIB follow-up.`);
  await shot(page, '29-citizen-case-escalated');

  // --- higher level responds, citizen accepts -> resolved ---
  const secondResponse = await page.request.post(`/api/dashboard/officer/complaints/${caseId}/respond`, {
    headers: { Authorization: `Bearer ${officerToken}` },
    data: {
      message: 'Supervisory review confirmed the misconduct and opened a disciplinary file against the officer.',
      actionTaken: 'Disciplinary file opened',
    },
  });
  expect(secondResponse.ok()).toBeTruthy();

  await page.reload();
  await page.waitForLoadState('networkidle');
  const acceptCard = page.locator('section', { hasText: caseId }).last();
  await acceptCard.getByRole('button', { name: 'Accept Response' }).click();
  await expect(page.locator('body')).toContainText(`${caseId} was closed after citizen feedback acceptance.`);

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('section', { hasText: caseId }).last()).toContainText(/Resolved/i);
  await shot(page, '30-citizen-case-resolved');

  // --- the resolved case remains trackable with its escalation timeline ---
  await page.goto(`/dashboard/citizen/track?caseId=${caseId}`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toContainText(caseId);
  await expect(page.locator('body')).toContainText(/Escalated to/i);
  await shot(page, '31-citizen-case-tracked');
});
