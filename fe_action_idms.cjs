const { chromium } = require('playwright');
const BASE = 'http://localhost:4000';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newContext({ viewport: { width: 1400, height: 950 } }).then(c => c.newPage());
  const results = [];
  function log(n, ok, d) { results.push([n, ok, d || '']); console.log((ok ? 'PASS' : 'FAIL'), n, d || ''); }

  // login officer
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('#em', 'officer@kamonyi.gov.rw');
  await page.fill('#pw', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/officer/, { timeout: 15000 });
  log('officer UI login', true);

  // registry loads
  await page.goto(BASE + '/officer/registry', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const cards = await page.getByRole('button', { name: /Create support request/i }).count();
  log('registry renders with create-request buttons', cards > 0, 'buttons=' + cards);

  // click "Create support request" and capture the API response (the previously-broken flow)
  const [resp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/support/requests') && r.request().method() === 'POST', { timeout: 15000 }).catch(() => null),
    page.getByRole('button', { name: /Create support request/i }).first().click(),
  ]);
  log('UI create support request -> API 200', resp && resp.status() === 200, 'status ' + (resp && resp.status()));

  // no error toast visible
  await page.waitForTimeout(1000);
  const errToast = await page.locator('text=/error|failed|unique|Ikibazo/i').count();
  log('no error toast after create', errToast === 0, 'matches=' + errToast);

  // provider UI login + search loads
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('#em', 'provider@ngo.rw'); await page.fill('#pw', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/provider/, { timeout: 15000 });
  await page.goto(BASE + '/provider/search', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const provErr = await page.locator('text=/Cannot reach the server|error/i').count();
  log('provider search page loads without error', provErr === 0, 'err=' + provErr);

  await browser.close();
  const fails = results.filter(r => !r[1]).length;
  console.log('\n==== FE RESULT: ' + (results.length - fails) + ' passed, ' + fails + ' failed ====');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
