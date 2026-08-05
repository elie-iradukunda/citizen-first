const { chromium } = require('playwright');

const OUT = process.argv[2];
const BASE = 'http://localhost:4000';

const ROLES = {
  officer: { email: 'officer@kamonyi.gov.rw', pages: [
    ['registry', '01_officer_registry'],
    ['register', '02_officer_register'],
    ['requests', '03_officer_requests'],
    ['corrections', '04_officer_corrections'],
  ]},
  beneficiary: { email: 'alice@beneficiary.rw', pages: [
    ['profile', '05_beneficiary_profile'],
    ['support', '06_beneficiary_support'],
    ['opportunities', '07_beneficiary_opportunities'],
    ['messages', '08_beneficiary_messages'],
  ]},
  provider: { email: 'provider@ngo.rw', pages: [
    ['search', '09_provider_search'],
    ['offers', '10_provider_offers'],
  ]},
  admin: { email: 'admin@disability.gov.rw', pages: [
    ['reports', '11_admin_reports'],
    ['users', '12_admin_users'],
    ['audit', '13_admin_audit'],
  ]},
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/00_login.png', fullPage: true });
  console.log('shot 00_login');

  for (const [role, cfg] of Object.entries(ROLES)) {
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.fill('#em', cfg.email);
    await page.fill('#pw', 'password123');
    await page.click('button[type=submit]');
    try { await page.waitForURL(new RegExp('/' + role), { timeout: 15000 }); } catch (e) { console.log('WARN login nav', role, e.message); }
    await page.waitForTimeout(1500);
    for (const [route, name] of cfg.pages) {
      await page.goto(BASE + '/' + role + '/' + route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1400);
      await page.screenshot({ path: OUT + '/' + name + '.png', fullPage: true });
      console.log('shot', name);
    }
    await ctx.clearCookies();
    await page.evaluate(() => localStorage.clear()).catch(() => {});
  }
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
