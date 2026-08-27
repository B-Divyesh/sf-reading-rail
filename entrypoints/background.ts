import { browser } from 'wxt/browser';

export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command) => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const type = command === 'speak-line' ? 'rr:speak' : 'rr:toggle';
    try {
      await browser.tabs.sendMessage(tab.id, { type });
    } catch {
      // Browser-internal pages intentionally reject content scripts.
    }
  });
});
