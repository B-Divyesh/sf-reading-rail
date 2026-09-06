import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('dist/site');
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? '0.0.0.0';

const types = {
  '.avif': 'image/avif', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.webp': 'image/webp', '.xml': 'application/xml; charset=utf-8',
  '.zip': 'application/zip',
};

const headers = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; upgrade-insecure-requests",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

const exists = async (path) => access(path).then(() => true).catch(() => false);

createServer(async (request, response) => {
  if (!request.url || !['GET', 'HEAD'].includes(request.method ?? 'GET')) {
    response.writeHead(405, { ...headers, Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const safePath = normalize(pathname).replace(/^([/\\])+/, '');
  let file = join(root, safePath || 'index.html');
  if ((pathname.endsWith('/') && pathname !== '/') || (await exists(file) && (await stat(file)).isDirectory())) file = join(file, 'index.html');
  let status = 200;
  if (!(await exists(file))) {
    file = join(root, '404.html');
    status = 404;
  }

  const extension = extname(file);
  const cacheControl = pathname.startsWith('/assets/')
    ? 'public, max-age=31536000, immutable'
    : pathname.startsWith('/downloads/') ? 'public, max-age=3600' : 'no-cache';
  response.writeHead(status, { ...headers, 'Cache-Control': cacheControl, 'Content-Type': types[extension] ?? 'application/octet-stream' });
  if (request.method === 'HEAD') return response.end();
  createReadStream(file).pipe(response);
}).listen(port, host, () => console.log(`Reading Rail site at http://${host}:${port}`));
