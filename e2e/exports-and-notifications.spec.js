import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const SHOTS = 'e2e/screenshots';
fs.mkdirSync(SHOTS, { recursive: true });

const ACCOUNTS = {
  citizen: { email: 'citizen.demo@saccfp.rw', password: 'Citizen@12345' },
  officer1: { email: 'rib.officer1@saccfp.rw', password: 'RibOfficer1@12345' },
  admin: { email: 'kasinelydivine30000@gmail.com', password: 'kasine2003' },
};

async function login(page, { email, password }) {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20_000 });
}

// Clicking the button must produce a real file, not just fire a request — the
// download is the feature, so the browser has to be the thing that confirms it.
async function clickAndCaptureDownload(page, buttonName) {
  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
  await page.getByRole('button', { name: buttonName }).first().click();
  const download = await downloadPromise;

  const path = await download.path();
  const contents = fs.readFileSync(path, 'utf8');

  return { filename: download.suggestedFilename(), contents };
}

test('national admin can export cases, institutions, staff, and citizens to a spreadsheet', async ({
  page,
}) => {
  await login(page, ACCOUNTS.admin);
  await page.waitForLoadState('networkidle');

  const cases = await clickAndCaptureDownload(page, /export cases/i);
  expect(cases.filename).toMatch(/^saccfp-cases-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(cases.contents).toContain('Case ID');
  expect(cases.contents.split('\r\n').length).toBeGreaterThan(2);

  const institutions = await clickAndCaptureDownload(page, /export institutions/i);
  expect(institutions.filename).toMatch(/^saccfp-institutions-/);
  expect(institutions.contents).toContain('Institution');

  const staff = await clickAndCaptureDownload(page, /export staff/i);
  expect(staff.filename).toMatch(/^saccfp-staff-/);
  expect(staff.contents).toContain('Position');

  const citizens = await clickAndCaptureDownload(page, /export citizens/i);
  expect(citizens.filename).toMatch(/^saccfp-citizens-/);
  expect(citizens.contents).toContain('National ID');

  await page.screenshot({ path: `${SHOTS}/40-admin-exports.png`, fullPage: true });
});

test('an officer can export their own case queue', async ({ page }) => {
  await login(page, ACCOUNTS.officer1);
  await page.waitForLoadState('networkidle');

  const { filename, contents } = await clickAndCaptureDownload(page, /export cases/i);
  expect(filename).toMatch(/^saccfp-cases-/);
  expect(contents).toContain('Case ID');
});

test('a citizen can export their own reports', async ({ page }) => {
  await login(page, ACCOUNTS.citizen);
  await page.goto('/dashboard/citizen/reports');
  await page.waitForLoadState('networkidle');

  const { filename, contents } = await clickAndCaptureDownload(page, /export my reports/i);
  expect(filename).toMatch(/^saccfp-cases-/);
  expect(contents).toContain('Case ID');

  await page.screenshot({ path: `${SHOTS}/41-citizen-export.png`, fullPage: true });
});

test('the notification bell and profile menu open, and close again', async ({ page }) => {
  await login(page, ACCOUNTS.citizen);
  await page.waitForLoadState('networkidle');

  const bell = page.getByRole('button', { name: /notifications/i });
  await expect(bell).toBeVisible();
  await bell.click();
  await expect(page.getByText(/^Notifications$/)).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/42-notifications-open.png`, fullPage: true });

  // Escape must dismiss it: the panel is an overlay, and before this work the
  // bell had no handler at all.
  await page.keyboard.press('Escape');
  await expect(page.getByText(/^Notifications$/)).toBeHidden();

  const profileButton = page.locator('header button').filter({ hasText: /Citizen Demo User/ });
  await profileButton.first().click();
  await expect(page.getByRole('button', { name: /^log out$/i }).last()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/43-profile-menu-open.png`, fullPage: true });

  await page.keyboard.press('Escape');
});

test('public case tracking never exposes the report body or the reporter', async ({ page }) => {
  // Find a real case ID as the national admin, then look it up the way an
  // anonymous member of the public would.
  await login(page, ACCOUNTS.admin);
  const listed = await page.request.get('/api/complaints', {
    headers: {
      Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('cf_auth_token'))}`,
    },
  });
  const caseId = (await listed.json()).items?.[0]?.id;
  expect(caseId, 'the seed must contain at least one case').toBeTruthy();

  // Auth here is a bearer token held in localStorage, never a cookie, so a
  // request without an explicit Authorization header is genuinely anonymous.
  const tracked = await page.request.get(`/api/complaints/${caseId}`);
  expect(tracked.status()).toBe(200);

  const item = (await tracked.json()).item;
  expect(item.id).toBe(caseId);
  expect(item.status).toBeTruthy();
  for (const field of ['reporterProfile', 'message', 'evidenceImage', 'voiceNote', 'location']) {
    expect(item[field], `public tracking must not expose ${field}`).toBeUndefined();
  }
});
