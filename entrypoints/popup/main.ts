import { browser } from 'wxt/browser';
import { DEFAULT_SETTINGS, type SiteSettings } from '../../lib/settings';
import './style.css';

interface PageState {
  settings: SiteSettings;
  place: string;
  speaking?: boolean;
  host: string;
  readable: boolean;
}

const elements = {
  app: document.querySelector<HTMLDivElement>('#app')!,
  unavailable: document.querySelector<HTMLElement>('#unavailable')!,
  host: document.querySelector<HTMLSpanElement>('#host-name')!,
  toggle: document.querySelector<HTMLButtonElement>('#toggle')!,
  toggleLabel: document.querySelector<HTMLSpanElement>('#toggle-label')!,
  place: document.querySelector<HTMLParagraphElement>('#place')!,
  previous: document.querySelector<HTMLButtonElement>('#previous')!,
  next: document.querySelector<HTMLButtonElement>('#next')!,
  dim: document.querySelector<HTMLInputElement>('#dim')!,
  dimOutput: document.querySelector<HTMLOutputElement>('#dim-output')!,
  speak: document.querySelector<HTMLButtonElement>('#speak')!,
  reset: document.querySelector<HTMLButtonElement>('#reset')!,
  status: document.querySelector<HTMLParagraphElement>('#status')!,
};

let activeTabId: number | undefined;
let state: PageState = { settings: { ...DEFAULT_SETTINGS }, place: '', host: '', readable: false };

const send = async (message: object) => {
  if (!activeTabId) throw new Error('No active tab');
  return browser.tabs.sendMessage(activeTabId, message) as Promise<Partial<PageState>>;
};

const announce = (message: string) => { elements.status.textContent = message; };

const render = () => {
  const { settings } = state;
  elements.host.textContent = state.host;
  elements.toggle.setAttribute('aria-pressed', String(settings.enabled));
  elements.toggle.classList.toggle('is-on', settings.enabled);
  elements.toggleLabel.textContent = settings.enabled ? 'Hide rail' : 'Start rail';
  elements.place.textContent = state.readable ? state.place : 'No article text found yet';
  elements.place.classList.toggle('is-muted', !state.readable);
  elements.previous.disabled = !settings.enabled || !state.readable;
  elements.next.disabled = !settings.enabled || !state.readable;
  elements.speak.disabled = !settings.enabled || !state.readable;
  elements.speak.textContent = state.speaking ? 'Stop reading' : 'Read aloud';
  elements.dim.value = String(Math.round(settings.dim * 100));
  elements.dimOutput.value = `${Math.round(settings.dim * 100)}%`;
  document.querySelector<HTMLInputElement>(`input[name="mode"][value="${settings.mode}"]`)!.checked = true;
  document.querySelector<HTMLInputElement>(`input[name="spacing"][value="${settings.spacing}"]`)!.checked = true;
};

const mergeResponse = (response: Partial<PageState>) => {
  state = { ...state, ...response, settings: response.settings ?? state.settings };
  render();
};

const update = async (patch: Partial<SiteSettings>, message: string) => {
  try {
    mergeResponse(await send({ type: 'rr:update', patch }));
    announce(message);
  } catch {
    showUnavailable();
  }
};

const showUnavailable = () => {
  elements.app.hidden = true;
  elements.unavailable.hidden = false;
};

elements.toggle.addEventListener('click', async () => {
  mergeResponse(await send({ type: 'rr:toggle' }));
  announce(state.settings.enabled ? 'Reading Rail started.' : 'Reading Rail hidden.');
});
elements.previous.addEventListener('click', async () => mergeResponse(await send({ type: 'rr:move', direction: -1 })));
elements.next.addEventListener('click', async () => mergeResponse(await send({ type: 'rr:move', direction: 1 })));
elements.speak.addEventListener('click', async () => {
  mergeResponse(await send({ type: 'rr:speak' }));
  announce(state.speaking ? 'Reading current text.' : 'Reading stopped.');
});
elements.reset.addEventListener('click', async () => {
  mergeResponse(await send({ type: 'rr:reset' }));
  announce('Settings reset for this site.');
});
elements.dim.addEventListener('input', () => { elements.dimOutput.value = `${elements.dim.value}%`; });
elements.dim.addEventListener('change', () => void update({ dim: Number(elements.dim.value) / 100 }, 'Surrounding dim saved.'));
document.querySelectorAll<HTMLInputElement>('input[name="mode"]').forEach((input) => {
  input.addEventListener('change', () => void update({ mode: input.value as SiteSettings['mode'] }, 'Reading unit saved.'));
});
document.querySelectorAll<HTMLInputElement>('input[name="spacing"]').forEach((input) => {
  input.addEventListener('change', () => void update({ spacing: input.value as SiteSettings['spacing'] }, 'Text spacing saved for this site.'));
});

void browser.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
  activeTabId = tab?.id;
  if (!activeTabId) return showUnavailable();
  try {
    const response = await send({ type: 'rr:get-state' });
    state = { ...state, ...response } as PageState;
    elements.app.hidden = false;
    render();
  } catch {
    showUnavailable();
  }
});
