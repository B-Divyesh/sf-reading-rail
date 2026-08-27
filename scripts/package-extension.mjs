import { cp, mkdir, readdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = join(root, '.output');
const siteDownloads = join(root, 'dist/site/downloads');
const extensionOutput = join(root, 'dist/extension');

const findZip = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await findZip(path);
      if (nested) return nested;
    } else if (entry.name.endsWith('.zip')) return path;
  }
  return undefined;
};

const zip = await findZip(output);
if (!zip) throw new Error('WXT did not produce a packaged extension zip.');
await mkdir(siteDownloads, { recursive: true });
await cp(zip, join(siteDownloads, 'reading-rail-chrome.zip'));

const builtDirectory = join(output, 'chrome-mv3');
await cp(builtDirectory, extensionOutput, { recursive: true, force: true });
console.log(`Packaged ${basename(zip)} as dist/site/downloads/reading-rail-chrome.zip`);
