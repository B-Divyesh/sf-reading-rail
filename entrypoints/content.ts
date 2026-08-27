import { browser } from 'wxt/browser';
import { clampRail, nearestRectIndex, railOpacity, type RailRect } from '../lib/rail-math';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  SPACING_VALUES,
  settingsForHost,
  updateHostSettings,
  type SiteSettings,
} from '../lib/settings';

interface TextLine extends RailRect {
  text: string;
}

interface Candidate {
  element: HTMLElement;
  lines: TextLine[];
}

interface RailMessage {
  type: string;
  patch?: Partial<SiteSettings>;
  direction?: number;
}

const BLOCK_SELECTOR = 'p, li, blockquote, dd, dt, figcaption, td, th, pre, h1, h2, h3, h4, h5, h6';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    const hostName = location.hostname || 'local-page';
    let settings = { ...DEFAULT_SETTINGS };
    let candidates: Candidate[] = [];
    let blockIndex = 0;
    let lineIndex = 0;
    let host: HTMLDivElement | null = null;
    let shadow: ShadowRoot | null = null;
    let topShade: HTMLDivElement | null = null;
    let focusBand: HTMLDivElement | null = null;
    let bottomShade: HTMLDivElement | null = null;
    let placeLabel: HTMLSpanElement | null = null;
    let liveRegion: HTMLSpanElement | null = null;
    let resizeTimer = 0;
    let mutationTimer = 0;
    let speaking = false;

    const isVisible = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden'
        && style.display !== 'none'
        && rect.width > 24
        && rect.height > 8
        && element.textContent?.trim();
    };

    const getLines = (element: HTMLElement): TextLine[] => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || !node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
          if (parent.closest('button, input, textarea, select, option, [aria-hidden="true"]')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const fragments: Array<TextLine & { center: number }> = [];
      let node = walker.nextNode() as Text | null;
      while (node) {
        const value = node.textContent ?? '';
        for (const match of value.matchAll(/\S+(?:\s+|$)/g)) {
          const start = match.index ?? 0;
          const range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, Math.min(value.length, start + match[0].length));
          for (const rect of range.getClientRects()) {
            if (rect.width < 1 || rect.height < 1) continue;
            fragments.push({
              top: rect.top,
              bottom: rect.bottom,
              left: rect.left,
              right: rect.right,
              text: match[0].trim(),
              center: (rect.top + rect.bottom) / 2,
            });
          }
        }
        node = walker.nextNode() as Text | null;
      }

      const lines: Array<TextLine & { center: number }> = [];
      for (const fragment of fragments.sort((a, b) => a.center - b.center || a.left - b.left)) {
        const existing = lines.find((line) => Math.abs(line.center - fragment.center) < 3);
        if (existing) {
          existing.top = Math.min(existing.top, fragment.top);
          existing.bottom = Math.max(existing.bottom, fragment.bottom);
          existing.left = Math.min(existing.left, fragment.left);
          existing.right = Math.max(existing.right, fragment.right);
          existing.text += `${existing.text ? ' ' : ''}${fragment.text}`;
        } else {
          lines.push({ ...fragment });
        }
      }
      return lines.map(({ center: _center, ...line }) => line);
    };

    const collectCandidates = () => {
      candidates = Array.from(document.querySelectorAll<HTMLElement>(BLOCK_SELECTOR))
        .filter((element) => !element.closest('[data-reading-rail-root]') && isVisible(element))
        .map((element) => ({ element, lines: getLines(element) }))
        .filter((candidate) => candidate.lines.length > 0);
      if (!candidates.length) {
        blockIndex = 0;
        lineIndex = 0;
        announce('No readable text found on this page.');
        return;
      }
      blockIndex = Math.min(blockIndex, candidates.length - 1);
      lineIndex = Math.min(lineIndex, candidates[blockIndex].lines.length - 1);
    };

    const currentRect = (): TextLine | null => {
      const candidate = candidates[blockIndex];
      if (!candidate) return null;
      if (settings.mode === 'paragraph') {
        const rect = candidate.element.getBoundingClientRect();
        return {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          text: candidate.element.innerText.trim(),
        };
      }
      return candidate.lines[lineIndex] ?? null;
    };

    const currentPlace = () => {
      const candidate = candidates[blockIndex];
      if (!candidate) return 'No readable text';
      if (settings.mode === 'paragraph') return `Paragraph ${blockIndex + 1} of ${candidates.length}`;
      return `Line ${lineIndex + 1} of ${candidate.lines.length}`;
    };

    const announce = (message: string) => {
      if (liveRegion) liveRegion.textContent = message;
    };

    const buildOverlay = () => {
      if (host) return;
      host = document.createElement('div');
      host.dataset.readingRailRoot = '';
      host.setAttribute('aria-hidden', 'false');
      shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>
          :host { all: initial; }
          .shade, .band { position: fixed; left: 0; width: 100vw; pointer-events: none; z-index: 2147483646; }
          .shade { background: rgb(20 22 20); opacity: var(--rr-opacity, .68); }
          .top { top: 0; }
          .bottom { bottom: 0; }
          .band {
            border-block: 2px solid #1670aa;
            background: rgb(255 255 255 / .045);
            box-sizing: border-box;
            transition: top 180ms ease, height 180ms ease;
          }
          .place {
            position: absolute;
            top: -29px;
            left: max(8px, env(safe-area-inset-left));
            min-height: 24px;
            padding: 3px 8px;
            box-sizing: border-box;
            color: white;
            background: #164b73;
            border-radius: 2px 2px 0 0;
            font: 600 12px/18px system-ui, sans-serif;
            letter-spacing: .02em;
            white-space: nowrap;
          }
          .sr-only { position: fixed; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
          @media (prefers-reduced-motion: reduce) { .band { transition: none; } }
        </style>
        <div class="shade top"></div>
        <div class="band"><span class="place"></span></div>
        <div class="shade bottom"></div>
        <span class="sr-only" role="status" aria-live="polite"></span>
      `;
      [topShade, focusBand, bottomShade, placeLabel, liveRegion] = [
        shadow.querySelector('.top'),
        shadow.querySelector('.band'),
        shadow.querySelector('.bottom'),
        shadow.querySelector('.place'),
        shadow.querySelector('.sr-only'),
      ];
      document.documentElement.append(host);
    };

    const render = (shouldScroll = false) => {
      if (!settings.enabled) {
        host?.remove();
        host = shadow = topShade = focusBand = bottomShade = placeLabel = liveRegion = null;
        return;
      }
      buildOverlay();
      let rect = currentRect();
      if (!rect) {
        if (focusBand) focusBand.style.display = 'none';
        if (topShade) topShade.style.height = '100vh';
        if (bottomShade) bottomShade.style.height = '0';
        announce('No readable text found. Try a page with an article or document.');
        return;
      }
      if (shouldScroll && (rect.top < innerHeight * 0.14 || rect.bottom > innerHeight * 0.86)) {
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollBy({ top: (rect.top + rect.bottom) / 2 - innerHeight * 0.45, behavior: reduced ? 'auto' : 'smooth' });
        window.setTimeout(() => {
          collectCandidates();
          render(false);
        }, reduced ? 0 : 220);
      }
      const clamped = clampRail(rect, innerHeight, 6);
      const pad = settings.mode === 'line' ? 6 : 8;
      const top = Math.max(0, clamped.top - pad);
      const bottom = Math.min(innerHeight, clamped.bottom + pad);
      const opacity = railOpacity(settings.dim);
      if (topShade) {
        topShade.style.height = `${top}px`;
        topShade.style.setProperty('--rr-opacity', opacity);
      }
      if (focusBand) {
        focusBand.style.display = 'block';
        focusBand.style.top = `${top}px`;
        focusBand.style.height = `${Math.max(26, bottom - top)}px`;
      }
      if (bottomShade) {
        bottomShade.style.height = `${Math.max(0, innerHeight - bottom)}px`;
        bottomShade.style.setProperty('--rr-opacity', opacity);
      }
      if (placeLabel) placeLabel.textContent = currentPlace();
    };

    const chooseStartingPlace = () => {
      collectCandidates();
      const targetY = innerHeight * 0.42;
      const blockRects = candidates.map(({ element }) => element.getBoundingClientRect());
      blockIndex = Math.max(0, nearestRectIndex(blockRects, targetY));
      lineIndex = Math.max(0, nearestRectIndex(candidates[blockIndex]?.lines ?? [], targetY));
    };

    const move = (direction: number) => {
      if (!settings.enabled || !candidates.length) return;
      if (settings.mode === 'paragraph') {
        blockIndex = Math.min(candidates.length - 1, Math.max(0, blockIndex + direction));
        lineIndex = 0;
      } else {
        const candidate = candidates[blockIndex];
        const nextLine = lineIndex + direction;
        if (nextLine >= 0 && nextLine < candidate.lines.length) lineIndex = nextLine;
        else if (direction > 0 && blockIndex < candidates.length - 1) {
          blockIndex += 1;
          lineIndex = 0;
        } else if (direction < 0 && blockIndex > 0) {
          blockIndex -= 1;
          lineIndex = candidates[blockIndex].lines.length - 1;
        }
      }
      render(true);
      announce(currentPlace());
    };

    const applySpacing = () => {
      const id = 'reading-rail-spacing';
      let style = document.getElementById(id) as HTMLStyleElement | null;
      if (settings.spacing === 'original') {
        style?.remove();
        return;
      }
      if (!style) {
        style = document.createElement('style');
        style.id = id;
        document.documentElement.append(style);
      }
      const preset = SPACING_VALUES[settings.spacing];
      style.textContent = `${BLOCK_SELECTOR} { line-height: ${preset.lineHeight} !important; letter-spacing: ${preset.letterSpacing} !important; }`;
    };

    const persist = async (patch: Partial<SiteSettings>) => {
      const result = await browser.storage.local.get(SETTINGS_KEY);
      const updated = updateHostSettings(result[SETTINGS_KEY], hostName, patch);
      await browser.storage.local.set({ [SETTINGS_KEY]: updated });
      settings = settingsForHost(updated, hostName);
    };

    const toggle = async () => {
      await persist({ enabled: !settings.enabled });
      if (settings.enabled) chooseStartingPlace();
      else speechSynthesis.cancel();
      applySpacing();
      render();
      announce(settings.enabled ? `Reading Rail on. ${currentPlace()}` : 'Reading Rail off.');
    };

    const speak = () => {
      if (speaking) {
        speechSynthesis.cancel();
        speaking = false;
        announce('Reading stopped.');
        return;
      }
      const line = currentRect()?.text;
      if (!line) {
        announce('There is no current text to read.');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.onend = () => { speaking = false; announce('Finished reading.'); };
      utterance.onerror = () => { speaking = false; announce('The browser could not read this text.'); };
      speaking = true;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
      announce('Reading the current text.');
    };

    browser.runtime.onMessage.addListener((message: RailMessage) => {
      if (message.type === 'rr:get-state') {
        return Promise.resolve({ settings, place: currentPlace(), speaking, host: hostName, readable: candidates.length > 0 });
      }
      if (message.type === 'rr:toggle') return toggle().then(() => ({ settings, place: currentPlace() }));
      if (message.type === 'rr:update' && message.patch) {
        return persist(message.patch).then(() => {
          applySpacing();
          collectCandidates();
          render();
          announce('Reading settings saved for this site.');
          return { settings, place: currentPlace() };
        });
      }
      if (message.type === 'rr:move') {
        move(Math.sign(message.direction ?? 1));
        return Promise.resolve({ settings, place: currentPlace() });
      }
      if (message.type === 'rr:speak') { speak(); return Promise.resolve({ speaking, place: currentPlace() }); }
      if (message.type === 'rr:reset') {
        return persist({ ...DEFAULT_SETTINGS }).then(() => {
          speechSynthesis.cancel();
          applySpacing();
          render();
          return { settings, place: 'Rail reset' };
        });
      }
      return undefined;
    });

    document.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (event.key === 'Escape' && settings.enabled) {
        event.preventDefault();
        void persist({ enabled: false }).then(() => render());
      } else if (settings.enabled && !editing && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        move(event.key === 'ArrowDown' ? 1 : -1);
      }
    }, true);

    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => { collectCandidates(); render(); }, 120);
    });
    addEventListener('scroll', () => settings.enabled && render(), { passive: true });

    const observer = new MutationObserver((records) => {
      if (records.every((record) => (record.target as Element).closest?.('[data-reading-rail-root]'))) return;
      clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(() => { collectCandidates(); render(); }, 240);
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });

    void browser.storage.local.get(SETTINGS_KEY).then((result) => {
      settings = settingsForHost(result[SETTINGS_KEY], hostName);
      applySpacing();
      if (settings.enabled) chooseStartingPlace();
      else collectCandidates();
      render();
    });
  },
});
