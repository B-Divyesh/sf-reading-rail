import './style.css';

const paper = document.querySelector<HTMLElement>('#demo-paper');
const rail = document.querySelector<HTMLElement>('.demo-rail');
const lines = Array.from(document.querySelectorAll<HTMLElement>('.demo-line'));
const status = document.querySelector<HTMLElement>('#demo-status');
let current = 0;

const moveRail = (next: number) => {
  if (!paper || !rail || !status || !lines.length) return;
  current = Math.max(0, Math.min(lines.length - 1, next));
  const paperRect = paper.getBoundingClientRect();
  const lineRect = lines[current].getBoundingClientRect();
  paper.style.setProperty('--rail-top', `${lineRect.top - paperRect.top - 7}px`);
  paper.style.setProperty('--rail-height', `${lineRect.height + 14}px`);
  rail.style.setProperty('--rail-top', `${lineRect.top - paperRect.top - 7}px`);
  rail.style.setProperty('--rail-height', `${lineRect.height + 14}px`);
  rail.querySelector('span')!.textContent = `Line ${current + 1} of ${lines.length}`;
  status.textContent = `Line ${current + 1} of ${lines.length}. Use the arrow buttons or keys.`;
};

document.querySelector('#demo-up')?.addEventListener('click', () => moveRail(current - 1));
document.querySelector('#demo-down')?.addEventListener('click', () => moveRail(current + 1));
paper?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    moveRail(current + (event.key === 'ArrowDown' ? 1 : -1));
  }
});
new ResizeObserver(() => moveRail(current)).observe(paper!);
moveRail(0);
