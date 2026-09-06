import './style.css';

type DemoMode = 'line' | 'paragraph';
type DemoSpacing = 'original' | 'wide';

interface DemoState {
  position: number;
  mode: DemoMode;
  dim: number;
  spacing: DemoSpacing;
}

const STORAGE_KEY = 'demo:reading-rail:sample-state';
const defaults: DemoState = { position: 0, mode: 'line', dim: 0.68, spacing: 'original' };
const paper = document.querySelector<HTMLElement>('#demo-paper')!;
const copy = document.querySelector<HTMLElement>('#demo-sample-copy')!;
const rail = document.querySelector<HTMLElement>('.demo-rail')!;
const railLabel = rail.querySelector<HTMLElement>('span')!;
const status = document.querySelector<HTMLElement>('#demo-status')!;
const saveStatus = document.querySelector<HTMLElement>('#demo-save-status')!;
const lines = Array.from(document.querySelectorAll<HTMLElement>('.demo-line'));
const modeInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="demo-mode"]'));
const spacingInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="demo-spacing"]'));
const dimInput = document.querySelector<HTMLInputElement>('#demo-dim')!;
const dimOutput = document.querySelector<HTMLOutputElement>('#demo-dim-output')!;

const load = (): DemoState => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<DemoState>;
    return {
      position: Number.isInteger(stored.position) && stored.position! >= 0 ? stored.position! : defaults.position,
      mode: stored.mode === 'paragraph' ? 'paragraph' : 'line',
      dim: typeof stored.dim === 'number' && stored.dim >= 0.25 && stored.dim <= 0.88 ? stored.dim : defaults.dim,
      spacing: stored.spacing === 'wide' ? 'wide' : 'original',
    };
  } catch {
    return { ...defaults };
  }
};

let state = load();

const itemCount = () => lines.length;
const currentItem = () => lines[Math.min(itemCount() - 1, state.position)];
const place = () => `${state.mode === 'line' ? 'Line' : 'Paragraph'} ${state.position + 1} of ${itemCount()}`;

const save = (message = 'Sample setting saved in demo storage only.') => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  saveStatus.textContent = ` ${message}`;
};

const render = () => {
  state.position = Math.max(0, Math.min(itemCount() - 1, state.position));
  const item = currentItem();
  const paperRect = paper.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const top = itemRect.top - paperRect.top - 7;
  const height = itemRect.height + 14;
  paper.style.setProperty('--rail-top', `${top}px`);
  paper.style.setProperty('--rail-height', `${height}px`);
  rail.style.setProperty('--rail-top', `${top}px`);
  rail.style.setProperty('--rail-height', `${height}px`);
  railLabel.textContent = place();
  status.textContent = place();
  paper.style.setProperty('--demo-dim', String(state.dim));
  copy.classList.toggle('is-wide', state.spacing === 'wide');
  dimInput.value = String(Math.round(state.dim * 100));
  dimOutput.value = `${Math.round(state.dim * 100)}%`;
  modeInputs.forEach((input) => { input.checked = input.value === state.mode; });
  spacingInputs.forEach((input) => { input.checked = input.value === state.spacing; });
};

const move = (direction: number) => {
  state.position = Math.max(0, Math.min(itemCount() - 1, state.position + direction));
  render();
  save(`Sample position is ${place()}.`);
};

document.querySelector('#demo-up')?.addEventListener('click', () => move(-1));
document.querySelector('#demo-down')?.addEventListener('click', () => move(1));
paper.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    move(event.key === 'ArrowDown' ? 1 : -1);
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    state.position = 0;
    render();
    save('Sample returned to the first line.');
  }
});
modeInputs.forEach((input) => input.addEventListener('change', () => {
  state.mode = input.value === 'paragraph' ? 'paragraph' : 'line';
  render();
  save(`Sample focus changed to ${state.mode}.`);
}));
spacingInputs.forEach((input) => input.addEventListener('change', () => {
  state.spacing = input.value === 'wide' ? 'wide' : 'original';
  render();
  save(`Sample spacing changed to ${state.spacing}.`);
}));
dimInput.addEventListener('input', () => {
  state.dim = Number(dimInput.value) / 100;
  render();
});
dimInput.addEventListener('change', () => save('Sample dim saved in demo storage only.'));
document.querySelector('#demo-reset')?.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  state = { ...defaults };
  render();
  saveStatus.textContent = ' Sample reset. Your extension settings were not changed.';
});
new ResizeObserver(render).observe(paper);
render();
