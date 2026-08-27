import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const extensionPath = resolve('dist/extension');
const userDataDir = await mkdtemp(join(tmpdir(), 'reading-rail-verify-'));
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: true,
  channel: 'chromium',
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

try {
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await page.goto(process.env.VERIFY_URL ?? 'http://127.0.0.1:5173/', { waitUntil: 'networkidle' });

  const popup = await context.newPage();
  popup.on('pageerror', (error) => errors.push(error.message));
  popup.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.bringToFront();
  await popup.reload();
  await popup.locator('#app').waitFor({ state: 'visible' });
  await popup.setViewportSize({ width: 380, height: 780 });
  await popup.screenshot({ path: '.factory/popup.png', fullPage: true });
  const axe = await new AxeBuilder({ page: popup }).analyze();
  const material = axe.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
  if (material.length) throw new Error(`Popup axe violations: ${material.map(({ id }) => id).join(', ')}`);
  await popup.locator('#toggle').click();
  await page.locator('[data-reading-rail-root]').waitFor({ state: 'attached' });
  await popup.locator('input[name="spacing"][value="open"] + span').click();
  await page.locator('#reading-rail-spacing').waitFor({ state: 'attached' });
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await page.locator('[data-reading-rail-root]').waitFor({ state: 'detached' });
  if (errors.length) throw new Error(`Extension console errors: ${errors.join('; ')}`);
  console.log(`Extension ${extensionId}: popup, rail, movement, spacing, Escape, and axe verified`);
} finally {
  await context.close();
  await rm(userDataDir, { recursive: true, force: true });
}
