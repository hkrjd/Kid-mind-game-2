/* GitHub Pages serves a project site from /<repo>/, not from the root.
   Every path in the app is relative, but "should be fine" is not a
   check — this serves the app under a subpath and plays a level there. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const BASE = '/Kid-mind-game-2';
const PORT = Number(process.env.PORT || 8777);

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(req.url.split('?')[0]));
  // Serve ONLY under the subpath, exactly like a project Pages site.
  if (!path.startsWith(BASE)) { res.writeHead(404).end('outside base path'); return; }
  path = path.slice(BASE.length) || '/';
  try {
    const file = join(ROOT, path === '/' ? 'index.html' : path.replace(/^(\.\.[/\\])+/, ''));
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

const problems = [];
page.on('pageerror', (e) => problems.push(`PAGEERROR ${e.message}`));
page.on('console', (m) => m.type() === 'error' && problems.push(`CONSOLE ${m.text()}`));
page.on('requestfailed', (r) => problems.push(`FAILED REQUEST ${r.url()}`));
page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`); });

const url = `http://localhost:${PORT}${BASE}/`;
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

console.log(`serving from ${BASE}/ — exactly like GitHub Pages\n`);
console.log(await page.locator('.hub__play').count() ? '✓ title screen renders' : '✗ title screen missing');

// The manifest and service worker must resolve under the subpath too.
const manifestOk = await page.evaluate(async () => {
  const href = document.querySelector('link[rel=manifest]')?.href;
  const res = await fetch(href);
  const m = await res.json();
  return res.ok && !!m.name;
});
console.log(manifestOk ? '✓ manifest loads' : '✗ manifest failed');

const swOk = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  return !!reg?.active && reg.scope.includes('Kid-mind-game-2');
});
console.log(swOk ? '✓ service worker registers under the subpath' : '✗ service worker failed');

// And a level — this is what lazily imports a game module by relative path.
await page.evaluate(() => { location.hash = '#/level/memory-0'; });
let played = false;
try {
  await page.waitForFunction(() => window.__engine?.root?.isConnected, null, { timeout: 8000 });
  await page.evaluate(() => window.__engine.autoSolve());
  await page.waitForSelector('.reward', { timeout: 10000 });
  played = true;
} catch { /* reported below */ }
console.log(played ? '✓ a level loads and can be won' : '✗ level failed to load');

await browser.close();
server.close();

const bad = problems.filter((p) => !/favicon/i.test(p));
if (bad.length) console.log(`\nproblems:\n  ${bad.join('\n  ')}`);
const ok = manifestOk && swOk && played && !bad.length;
console.log(ok ? '\nsubpath hosting: all checks passed' : '\nsubpath hosting: FAILED');
process.exit(ok ? 0 : 1);
