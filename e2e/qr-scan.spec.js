import { test, expect, devices } from '@playwright/test';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import fs from 'node:fs';

const SHOTS = 'e2e/screenshots';
fs.mkdirSync(SHOTS, { recursive: true });

// Emulate a real phone (Pixel 5: mobile viewport, touch, mobile UA).
test.use({ ...devices['Pixel 5'] });

// Decode a base64 PNG data URL the same way a phone camera decodes a QR.
function decodeQr(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const png = PNG.sync.read(Buffer.from(base64, 'base64'));
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return result?.data ?? null;
}

test('a phone can scan the institution QR, view everything, and report', async ({ page, browser }) => {
  // --- 1. The institution publishes its QR (this is the image a phone captures) ---
  await page.goto('/login');
  await page.locator('input[type=email]').fill('institution.admin@saccfp.rw');
  await page.locator('input[type=password]').fill('Institution@12345');
  await page.locator('button[type=submit]').click();
  await page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 20_000 });

  const qrImg = page.locator('img[alt^="Real QR code"]');
  await expect(qrImg).toBeVisible({ timeout: 20_000 });
  const qrSrc = await qrImg.getAttribute('src');
  expect(qrSrc).toMatch(/^data:image\/png;base64,/);
  fs.writeFileSync(`${SHOTS}/phone-00-qr-code.png`, Buffer.from(qrSrc.split(',')[1], 'base64'));

  // --- 2. Decode the QR exactly like a phone camera would ---
  const scannedUrl = decodeQr(qrSrc);
  console.log('[phone-scan] the phone camera reads this URL from the QR:', scannedUrl);
  expect(scannedUrl, 'QR must decode to a URL').toBeTruthy();
  expect(scannedUrl).toContain('/institutions/kacyiru-sector-office');
  const target = new URL(scannedUrl);

  // discover a real published service name to assert it is visible after scanning
  const profileRes = await page.request.get(`/api/institutions/${target.pathname.split('/').pop()}`);
  const profile = (await profileRes.json()).item ?? {};
  const firstServiceName = (profile.services ?? [])[0]?.name ?? 'service';

  // --- 3. Open the scanned link on a fresh phone (what happens after scanning) ---
  const phone = await browser.newContext({ ...devices['Pixel 5'] });
  const scan = await phone.newPage();
  await scan.goto(target.pathname + target.search);
  await scan.waitForLoadState('networkidle');

  const body = scan.locator('body');
  // The citizen can VIEW ALL THINGS: profile, services (+ schedules/fees/docs), departments, report entry
  await expect(body).toContainText(/QR Public Access/i);
  await expect(body).toContainText(/Institution services/i);
  await expect(body).not.toContainText(/No services were published/i);
  await expect(body).toContainText(new RegExp(firstServiceName.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  await expect(body).toContainText(/Departments and support services/i);
  await expect(body).toContainText(/Report an issue|Login to report|Create account/i);
  await scan.screenshot({ path: `${SHOTS}/phone-01-scanned-view.png`, fullPage: true });

  // open the full public information view
  const viewFull = scan.getByRole('link', { name: /view full information/i })
    .or(scan.getByRole('button', { name: /view full information/i }));
  if (await viewFull.count()) {
    await viewFull.first().click();
    await scan.waitForLoadState('networkidle');
    await scan.screenshot({ path: `${SHOTS}/phone-02-full-info.png`, fullPage: true });
  }

  // --- 4. The citizen REPORTS WELL from the phone ---
  await scan.goto('/login?redirect=/dashboard/citizen/submit');
  await scan.locator('input[type=email]').fill('citizen.demo@saccfp.rw');
  await scan.locator('input[type=password]').fill('Citizen@12345');
  await scan.locator('button[type=submit]').click();
  await scan.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 20_000 });

  // Carry the scanned office through to the form — that is the whole point of
  // scanning, and it is what loads that office's real staff to accuse. Landing
  // on the bare submit page would instead show the "how do you want to report?"
  // choice screen.
  const scannedSlug = target.pathname.split('/').pop();
  await scan.goto(`/dashboard/citizen/submit?institution=${scannedSlug}&source=qr`);
  await scan.waitForLoadState('networkidle');
  // corruption is the default and primary flow: report against an accused official
  await scan.locator('select[name="issueType"]').selectOption('corruption_issue');
  const accused = scan.locator('select[multiple]');
  await expect(accused).toBeVisible();
  await accused.selectOption({ index: 0 });
  await scan.locator('textarea[name="message"]').fill(
    'I scanned the office QR code on my phone, reviewed the official services and fees, and I am reporting a bribery request: an official asked for an unofficial payment before serving me. Automated phone-scan end-to-end test.',
  );
  await scan.getByRole('button', { name: /submit to rib/i }).click();
  await expect(scan.locator('body')).toContainText(/Submitted:\s*CF-\d{4}|three-day response/i);
  await scan.screenshot({ path: `${SHOTS}/phone-03-report-submitted.png`, fullPage: true });

  await phone.close();
});
