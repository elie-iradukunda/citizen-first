import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const SHOTS = 'e2e/screenshots';
fs.mkdirSync(SHOTS, { recursive: true });
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

const ACCOUNTS = {
  citizen: { email: 'citizen.demo@saccfp.rw', password: 'Citizen@12345', path: /\/dashboard\/citizen/ },
  institution: { email: 'institution.admin@saccfp.rw', password: 'Institution@12345', path: /\/dashboard\/institution/ },
  officer1: { email: 'rib.officer1@saccfp.rw', password: 'RibOfficer1@12345', path: /\/dashboard\/rib-officer-1/ },
  officer2: { email: 'rib.officer2@saccfp.rw', password: 'RibOfficer2@12345', path: /\/dashboard\/rib-officer-2/ },
};

async function login(page, { email, password }) {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20_000 });
}

test('public home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toContainText(/SACCFP|corruption|report/i);
  await shot(page, '01-public-home');
});

test('every public screen loads', async ({ page }) => {
  // discover a real institution slug for the QR public-access page
  let slug = 'kacyiru-sector-office';
  try {
    const res = await page.request.get('/api/institutions');
    const data = await res.json();
    if (Array.isArray(data.items) && data.items[0]?.slug) slug = data.items[0].slug;
  } catch { /* fall back to default slug */ }

  const screens = [
    ['/', '00-home'],
    ['/services', '00-services'],
    ['/governance-structure', '00-governance-structure'],
    ['/emergency', '00-emergency'],
    ['/assistant', '00-assistant'],
    ['/register/citizen', '00-register-citizen'],
    ['/register/institution', '00-register-institution'],
    [`/institutions/${slug}`, '00-institution-qr-access'],
    ['/report', '00-report'],
    ['/track', '00-track'],
    ['/login', '00-login'],
  ];
  for (const [path, name] of screens) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText(/something went wrong|application error|cannot GET/i);
    await shot(page, name);
  }
});

test('citizen can log in and reach the citizen dashboard', async ({ page }) => {
  await login(page, ACCOUNTS.citizen);
  await expect(page).toHaveURL(ACCOUNTS.citizen.path);
  await page.waitForLoadState('networkidle');
  await shot(page, '02-citizen-dashboard');
});

test('citizen can navigate every citizen sub-page', async ({ page }) => {
  await login(page, ACCOUNTS.citizen);
  const pages = [
    ['/dashboard/citizen/scan-services', '03-citizen-scan-services'],
    ['/dashboard/citizen/reports', '04-citizen-my-reports'],
    ['/dashboard/citizen/track', '05-citizen-track'],
  ];
  for (const [path, name] of pages) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText(/something went wrong|application error/i);
    await shot(page, name);
  }
});

test('citizen can submit a corruption report through the dashboard (CRUD create)', async ({ page }) => {
  await login(page, ACCOUNTS.citizen);
  await page.goto('/dashboard/citizen/submit');
  await page.waitForLoadState('networkidle');
  await shot(page, '06-citizen-submit-form');

  // corruption is the default and primary flow: pick the accused official + details
  await page.locator('select[name="issueType"]').selectOption('corruption_issue');
  const accused = page.locator('select[multiple]');
  await expect(accused).toBeVisible();
  const optionCount = await accused.locator('option').count();
  expect(optionCount).toBeGreaterThan(0);
  await accused.selectOption({ index: 0 });

  await page.locator('textarea[name="message"]').fill(
    'An official requested an unofficial payment before processing my service, and hinted at delays if I refused. I am reporting this corruption to RIB with the details available. Automated end-to-end test.',
  );
  await page.getByRole('button', { name: /submit to rib/i }).click();

  // success confirmation shows the generated case id
  await expect(page.locator('body')).toContainText(/Submitted:\s*CF-\d{4}|three-day response/i);
  await shot(page, '07-citizen-submit-success');
});

test('institution admin dashboard loads and generates a real QR code', async ({ page }) => {
  await login(page, ACCOUNTS.institution);
  await expect(page).toHaveURL(ACCOUNTS.institution.path);
  await page.waitForLoadState('networkidle');

  const qr = page.locator('img[alt^="Real QR code"]');
  await expect(qr).toBeVisible({ timeout: 20_000 });
  const src = await qr.getAttribute('src');
  expect(src).toMatch(/^data:image\/png;base64,/);
  await shot(page, '08-institution-admin-qr');

  // exercise QR regeneration
  const refresh = page.getByRole('button', { name: /refresh qr/i });
  if (await refresh.count()) {
    await refresh.first().click();
    await expect(qr).toBeVisible();
  }
});

test('RIB Officer 1 dashboard loads', async ({ page }) => {
  await login(page, ACCOUNTS.officer1);
  await expect(page).toHaveURL(ACCOUNTS.officer1.path);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText(/something went wrong|access denied/i);
  await shot(page, '09-rib-officer-1');
});

test('RIB Officer 2 dashboard loads', async ({ page }) => {
  await login(page, ACCOUNTS.officer2);
  await expect(page).toHaveURL(ACCOUNTS.officer2.path);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toContainText(/something went wrong|access denied/i);
  await shot(page, '10-rib-officer-2');
});

test('dashboard hub is reachable after login', async ({ page }) => {
  await login(page, ACCOUNTS.citizen);
  await page.goto('/dashboards');
  await page.waitForLoadState('networkidle');
  await shot(page, '11-dashboards-hub');
});

test('unauthenticated access to a dashboard redirects to login', async ({ page }) => {
  await page.goto('/dashboard/citizen');
  await expect(page).toHaveURL(/\/login/);
});

test('login page lists the three seeded system users and one-click sign-in works', async ({ page }) => {
  await page.goto('/login');

  // the three system users from the dissertation conceptual framework
  const body = page.locator('body');
  await expect(body).toContainText('Seeded presentation accounts');
  await expect(body).toContainText('Citizen');
  await expect(body).toContainText('Institution Admin');
  await expect(body).toContainText('RIB');
  // credentials are visible so the presenter can log in without typing
  await expect(body).toContainText('citizen.demo@saccfp.rw');
  await expect(body).toContainText('Citizen@12345');
  await expect(body).toContainText('institution.admin@saccfp.rw');
  await expect(body).toContainText('rib.officer1@saccfp.rw');
  await expect(body).toContainText('rib.officer2@saccfp.rw');
  await expect(body).toContainText('national.admin@citizenfirst.gov.rw');
  await shot(page, '12-login-seeded-accounts');

  // one click fills the form, sign in opens the right dashboard (RIB Admin)
  await page.getByRole('button', { name: /RIB Admin/ }).click();
  await expect(page.locator('input[type=email]')).toHaveValue('national.admin@citizenfirst.gov.rw');
  await page.locator('button[type=submit]').click();
  await page.waitForURL(/\/dashboard\/admin/, { timeout: 20_000 });
  await expect(page.locator('body')).not.toContainText(/something went wrong|access denied/i);
  await shot(page, '13-rib-admin-dashboard');
});
