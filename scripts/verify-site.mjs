import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.VERIFY_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const results = [];

for (const path of ['/', '/demo/', '/privacy/', '/terms/']) {
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
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    ogImage: document.querySelector('meta[property="og:image"]')?.content,
    twitterCard: document.querySelector('meta[name="twitter:card"]')?.content,
    appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.href,
  }));
  if (!basics.title || basics.lang !== 'en' || basics.mains !== 1 || basics.h1s !== 1 || basics.missingAlt
    || !basics.canonical || !basics.ogImage || basics.twitterCard !== 'summary_large_image' || !basics.appleTouchIcon) {
    throw new Error(`${path} failed semantic checks: ${JSON.stringify(basics)}`);
  }
  if (basics.scrollWidth > basics.viewportWidth) throw new Error(`${path} overflows at 390px`);
  const axe = await new AxeBuilder({ page }).analyze();
  const material = axe.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
  if (material.length) throw new Error(`${path} axe violations: ${material.map(({ id }) => id).join(', ')}`);
  if (consoleErrors.length) throw new Error(`${path} console errors: ${consoleErrors.join('; ')}`);
  results.push(`${path}: semantic checks pass; axe serious/critical 0`);
  if (path === '/') await page.screenshot({ path: '.factory/site-mobile.png', fullPage: true });
  if (path === '/demo/') {
    await page.getByRole('button', { name: 'Move focus to next reading unit' }).click();
    const status = await page.locator('#demo-status').textContent();
    if (status !== 'Line 2 of 9') throw new Error(`demo did not move: ${status}`);
    await page.getByRole('button', { name: 'Reset demo' }).click();
    if (await page.locator('#demo-status').textContent() !== 'Line 1 of 9') throw new Error('demo did not reset');
  }
  await page.close();
}

const notFound = await context.newPage();
const notFoundResponse = await notFound.goto(`${base}/no-such-page`, { waitUntil: 'networkidle' });
if (notFoundResponse?.status() !== 404) throw new Error(`unknown route returned ${notFoundResponse?.status()} instead of 404`);
if (await notFound.locator('h1').count() !== 1 || await notFound.locator('main').count() !== 1) throw new Error('404 misses required page structure');
if (!await notFound.getByRole('link', { name: 'Go to Reading Rail' }).count()) throw new Error('404 has no return route');
await notFound.close();

const headerResponse = await fetch(base);
for (const header of ['content-security-policy', 'cross-origin-opener-policy', 'x-frame-options']) {
  if (!headerResponse.headers.get(header)) throw new Error(`missing ${header} response header`);
}

const desktop = await context.newPage();
await desktop.setViewportSize({ width: 1440, height: 1000 });
await desktop.goto(base, { waitUntil: 'networkidle' });
await desktop.screenshot({ path: '.factory/site-desktop.png', fullPage: true });
await desktop.emulateMedia({ reducedMotion: 'reduce' });
const reducedDuration = await desktop.locator('.demo-rail').evaluate((element) => getComputedStyle(element).transitionDuration);
if (!['0.01s', '1e-05s'].includes(reducedDuration)) throw new Error(`reduced motion rail transition is ${reducedDuration}`);
await desktop.keyboard.press('Tab');
const skipFocused = await desktop.evaluate(() => document.activeElement?.classList.contains('skip-link'));
if (!skipFocused) throw new Error('keyboard does not reach the skip link first');

const links = await desktop.locator('a[href]').evaluateAll((anchors) => anchors
  .map((anchor) => anchor.href)
  .filter((href) => href.startsWith(location.origin)));
for (const href of [...new Set(links)]) {
  const response = await fetch(href);
  if (!response.ok) throw new Error(`local link failed: ${href} returned ${response.status}`);
}

const darkContext = await browser.newContext({ colorScheme: 'dark', viewport: { width: 390, height: 844 } });
for (const path of ['/', '/demo/', '/privacy/', '/terms/']) {
  const page = await darkContext.newPage();
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  const material = axe.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
  if (material.length) throw new Error(`${path} dark-mode axe violations: ${material.map(({ id }) => id).join(', ')}`);
  await page.close();
}
await darkContext.close();
await browser.close();
console.log(`${results.join('\n')}\n404: designed response and headers pass\nKeyboard: skip link first\nReduced motion: rail transition reduced\nDark mode: axe serious/critical 0`);
