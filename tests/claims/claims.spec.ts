import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const extensionPath = resolve('dist/extension');
const demoPath = 'http://127.0.0.1:4173/demo/';

interface ExtensionSession {
  context: BrowserContext;
  page: Page;
  popup: Page;
  close: () => Promise<void>;
}

async function openExtension(): Promise<ExtensionSession> {
  const userDataDir = await mkdtemp(join(tmpdir(), 'reading-rail-claims-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: 'chromium',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15_000 });
  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  await page.goto(demoPath, { waitUntil: 'networkidle' });
  const popup = await context.newPage();
  await page.bringToFront();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.reload();
  await popup.locator('#app').waitFor({ state: 'visible' });
  return {
    context,
    page,
    popup,
    close: async () => {
      await context.close();
      await rm(userDataDir, { recursive: true, force: true });
    },
  };
}

async function startRail(session: ExtensionSession) {
  await session.popup.locator('#toggle').click();
  await session.page.locator('[data-reading-rail-root]').waitFor({ state: 'attached' });
}

test('@claim:demo-sample opens a populated reading sample in one click', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).first().click();
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.demo-line')).toHaveCount(9);
  await expect(page.getByRole('heading', { name: 'Library website review notes' })).toBeVisible();
});

test('@claim:demo-isolation keeps demo activity out of real settings', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('reading-rail:real-settings', 'keep-this-value'));
  await page.goto('/demo/');
  await page.locator('#demo-down').click();
  await page.getByLabel('Wide').check();
  const result = await page.evaluate(() => ({
    real: localStorage.getItem('reading-rail:real-settings'),
    demo: localStorage.getItem('demo:reading-rail:sample-state'),
    keys: Object.keys(localStorage),
  }));
  expect(result.real).toBe('keep-this-value');
  expect(result.demo).toContain('"spacing":"wide"');
  expect(result.keys.every((key) => key.startsWith('demo:') || key === 'reading-rail:real-settings')).toBe(true);
});

test('@claim:demo-reset returns the sample to its initial line', async ({ page }) => {
  await page.goto('/demo/');
  await page.locator('#demo-down').click();
  await expect(page.locator('#demo-status')).toHaveText('Line 2 of 9');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#demo-status')).toHaveText('Line 1 of 9');
  await expect(page.locator('#demo-save-status')).toContainText('extension settings were not changed');
});

test('@claim:rail-line moves a rail through browser text one line at a time', async () => {
  const session = await openExtension();
  try {
    await startRail(session);
    await expect(session.popup.locator('#place')).toContainText('Line');
    const before = await session.popup.locator('#place').textContent();
    await session.popup.locator('#next').click();
    await expect(session.popup.locator('#place')).not.toHaveText(before ?? '');
    await expect(session.page.locator('[data-reading-rail-root]')).toBeAttached();
  } finally {
    await session.close();
  }
});

test('@claim:rail-paragraph focuses a paragraph instead of a line', async () => {
  const session = await openExtension();
  try {
    await startRail(session);
    await session.popup.locator('input[name="mode"][value="paragraph"]').check({ force: true });
    await expect(session.popup.locator('#place')).toContainText('Paragraph');
    const bandHeight = await session.page.locator('[data-reading-rail-root]').evaluate((host) => {
      const shadow = host.shadowRoot!;
      return shadow.querySelector<HTMLElement>('.band')!.getBoundingClientRect().height;
    });
    expect(bandHeight).toBeGreaterThan(35);
  } finally {
    await session.close();
  }
});

test('@claim:page-intact keeps links and selected text available with the rail', async () => {
  const session = await openExtension();
  try {
    await startRail(session);
    await session.page.locator('#demo-reference-link').click();
    await expect(session.page).toHaveURL(/#sample-reference$/);
    const selected = await session.page.locator('#demo-sample-copy').evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element.querySelector('p')!);
      const selection = getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    });
    expect(selected).toContain('public library team');
  } finally {
    await session.close();
  }
});

test('@claim:rail-reflow keeps the rail aligned after text reflows', async () => {
  const session = await openExtension();
  try {
    await startRail(session);
    await session.popup.locator('input[name="mode"][value="paragraph"]').check({ force: true });
    await session.page.setViewportSize({ width: 520, height: 820 });
    await session.page.waitForTimeout(350);
    const aligned = await session.page.locator('[data-reading-rail-root]').evaluate((host) => {
      const band = host.shadowRoot!.querySelector<HTMLElement>('.band')!.getBoundingClientRect();
      return band.top >= 0 && band.bottom <= window.innerHeight && band.height >= 26;
    });
    expect(aligned).toBe(true);
  } finally {
    await session.close();
  }
});

test('@claim:dim-surroundings dims text around the current reading unit', async () => {
  const session = await openExtension();
  try {
    await startRail(session);
    await session.popup.locator('#dim').evaluate((input: HTMLInputElement) => {
      input.value = '88';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(session.popup.locator('#dim-output')).toHaveText('88%');
    const opacity = await session.page.locator('[data-reading-rail-root]').evaluate((host) => {
      const top = host.shadowRoot!.querySelector<HTMLElement>('.top')!;
      return getComputedStyle(top).opacity;
    });
    expect(Number(opacity)).toBeCloseTo(0.88, 2);
  } finally {
    await session.close();
  }
});

test('@claim:spacing-local saves original, open, and wide spacing for one site only', async () => {
  const session = await openExtension();
  try {
    await startRail(session);
    await session.popup.locator('input[name="spacing"][value="wide"]').check({ force: true });
    await session.page.locator('#reading-rail-spacing').waitFor({ state: 'attached' });
    const spacing = await session.page.locator('#demo-sample-copy p').first().evaluate((element) => {
      const style = getComputedStyle(element);
      return { fontSize: Number.parseFloat(style.fontSize), letterSpacing: Number.parseFloat(style.letterSpacing), lineHeight: Number.parseFloat(style.lineHeight) };
    });
    expect(spacing.letterSpacing).toBeGreaterThan(0);
    expect(spacing.lineHeight).toBeGreaterThan(spacing.fontSize * 1.5);
    await session.popup.locator('input[name="spacing"][value="open"]').check({ force: true });
    const openSpacing = await session.page.locator('#demo-sample-copy p').first().evaluate((element) => Number.parseFloat(getComputedStyle(element).letterSpacing));
    expect(openSpacing).toBeGreaterThan(0);
    await session.page.goto('http://localhost:4173/demo/', { waitUntil: 'networkidle' });
    await session.popup.reload();
    await session.popup.locator('#app').waitFor({ state: 'visible' });
    await expect(session.popup.locator('input[name="spacing"][value="original"]')).toBeChecked();
  } finally {
    await session.close();
  }
});

test('@claim:browser-speech starts browser speech for selected text', async () => {
  const session = await openExtension();
  try {
    await startRail(session);
    await session.popup.locator('#speak').click();
    await expect(session.popup.locator('#speak')).toHaveText('Stop reading');
  } finally {
    await session.close();
  }
});

test('@claim:keyboard-escape uses Arrow keys to move and Escape to hide', async () => {
  const session = await openExtension();
  try {
    await startRail(session);
    const place = () => session.page.locator('[data-reading-rail-root]').evaluate((host) => host.shadowRoot!.querySelector('.place')!.textContent);
    const before = await place();
    await session.page.keyboard.press('ArrowUp');
    await expect.poll(place).not.toBe(before);
    await session.page.keyboard.press('Escape');
    await session.page.locator('[data-reading-rail-root]').waitFor({ state: 'detached' });
  } finally {
    await session.close();
  }
});

test('@claim:reset-local returns this site to its default reading settings', async () => {
  const session = await openExtension();
  try {
    await startRail(session);
    await session.popup.locator('input[name="mode"][value="paragraph"]').check({ force: true });
    await session.popup.locator('input[name="spacing"][value="wide"]').check({ force: true });
    await session.popup.locator('#reset').click();
    await expect(session.popup.locator('#toggle-label')).toHaveText('Start rail');
    await expect(session.popup.locator('input[name="mode"][value="line"]')).toBeChecked();
    await expect(session.popup.locator('input[name="spacing"][value="original"]')).toBeChecked();
    await session.page.locator('[data-reading-rail-root]').waitFor({ state: 'detached' });
  } finally {
    await session.close();
  }
});

test('@claim:local-settings keeps this site’s rail settings after a page reload', async () => {
  const session = await openExtension();
  try {
    await startRail(session);
    await session.popup.locator('input[name="mode"][value="paragraph"]').check({ force: true });
    await session.popup.locator('#dim').evaluate((input: HTMLInputElement) => {
      input.value = '88';
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await session.popup.locator('input[name="spacing"][value="wide"]').check({ force: true });
    await session.page.reload({ waitUntil: 'networkidle' });
    await session.popup.reload();
    await session.popup.locator('#app').waitFor({ state: 'visible' });
    await expect(session.popup.locator('#toggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(session.popup.locator('input[name="mode"][value="paragraph"]')).toBeChecked();
    await expect(session.popup.locator('#dim-output')).toHaveText('88%');
    await expect(session.popup.locator('input[name="spacing"][value="wide"]')).toBeChecked();
  } finally {
    await session.close();
  }
});

test('@claim:private-network uses no account, upload, or tracking request', async () => {
  const session = await openExtension();
  const requests: Array<{ method: string; url: string }> = [];
  try {
    session.page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
    await session.page.reload({ waitUntil: 'networkidle' });
    await session.popup.reload();
    await session.popup.locator('#app').waitFor({ state: 'visible' });
    await startRail(session);
    await session.popup.locator('#next').click();
    await session.popup.locator('input[name="spacing"][value="open"]').check({ force: true });
    expect(requests.filter((request) => request.method !== 'GET')).toEqual([]);
    expect(requests.every((request) => request.url.startsWith('http://127.0.0.1:4173/'))).toBe(true);
  } finally {
    await session.close();
  }
});

test('@claim:free-download downloads the extension without an account', async ({ page }) => {
  await page.goto('/');
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Download' }).click(),
  ]).then(([event]) => event);
  expect(download.suggestedFilename()).toBe('reading-rail-chrome.zip');
  await expect(page).toHaveURL(/\/$/);
});
