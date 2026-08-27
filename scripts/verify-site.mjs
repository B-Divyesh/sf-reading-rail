import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.VERIFY_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const results = [];

for (const path of ['/', '/privacy/', '/terms/']) {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  if (!response?.ok()) throw new Error(`${path} returned ${response?.status()}`);
  const basics = await page.evaluate(() => ({
    title: document.title,
    lang: document.documentElement.lang,
    mains: document.querySelectorAll('main').length,
    h1s: document.querySelectorAll('h1').length,
    missingAlt: document.querySelectorAll('img:not([alt])').length,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  if (!basics.title || basics.lang !== 'en' || basics.mains !== 1 || basics.h1s !== 1 || basics.missingAlt) {
    throw new Error(`${path} failed semantic checks: ${JSON.stringify(basics)}`);
  }
  if (basics.scrollWidth > basics.viewportWidth) throw new Error(`${path} overflows at 390px`);
  const axe = await new AxeBuilder({ page }).analyze();
  const material = axe.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
  if (material.length) throw new Error(`${path} axe violations: ${material.map(({ id }) => id).join(', ')}`);
  if (consoleErrors.length) throw new Error(`${path} console errors: ${consoleErrors.join('; ')}`);
  results.push(`${path}: semantic checks pass; axe serious/critical 0`);
  if (path === '/') await page.screenshot({ path: '.factory/site-mobile.png', fullPage: true });
  await page.close();
}

const desktop = await context.newPage();
await desktop.setViewportSize({ width: 1440, height: 1000 });
await desktop.goto(base, { waitUntil: 'networkidle' });
await desktop.screenshot({ path: '.factory/site-desktop.png', fullPage: true });
await browser.close();
console.log(results.join('\n'));
