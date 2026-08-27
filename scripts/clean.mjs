import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
for (const relative of ['dist', '.output']) {
  const target = resolve(root, relative);
  if (!target.startsWith(`${root}/`)) throw new Error(`Refusing to clean outside project: ${target}`);
  await rm(target, { recursive: true, force: true });
}
