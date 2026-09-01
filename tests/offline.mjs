/* ============================================================
   offline.mjs — prove the game still works with no network.

   A tablet in a car or on a plane is the normal case for this
   app, so "installs and then works offline" is a feature to test,
   not a nice-to-have.
   ============================================================ */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = Number(process.env.PORT || 8211);

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const file = join(ROOT, path === '/' ? 'index.html' : path);
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await context.newPage();

const problems = [];
page.on('pageerror', (e) => problems.push(`PAGEERROR ${e.message}`));

const url = `http://localhost:${PORT}/index.html`;

/* 1. First visit: the service worker installs and precaches. */
await page.goto(url, { waitUntil: 'networkidle' });
const registered = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready;
  return !!reg.active;
});
console.log(registered ? '✓ service worker registered' : '✗ service worker did not register');
if (!registered) problems.push('no service worker');

/* 2. Play one level so its engine module lands in the cache too. */
await page.evaluate(() => { location.hash = '#/level/memory-0'; });
await page.waitForFunction(() => window.__engine?.root?.isConnected, null, { timeout: 8000 });
console.log('✓ played a level online (engine module now cached)');
await page.waitForTimeout(600);

/* 3. Cut the network entirely and reload. */
await context.setOffline(true);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);

const hubOffline = await page.locator('.hub__play').count();
console.log(hubOffline ? '✓ title screen loads offline' : '✗ title screen failed offline');
if (!hubOffline) problems.push('hub did not load offline');

/* 4. A cached level must still be playable with no network. */
await page.evaluate(() => { location.hash = '#/level/memory-0'; });
let playable = false;
try {
  await page.waitForFunction(() => window.__engine?.root?.isConnected, null, { timeout: 8000 });
  playable = true;
} catch { /* reported below */ }
console.log(playable ? '✓ cached level plays offline' : '✗ cached level failed offline');
if (!playable) problems.push('level did not play offline');

await context.setOffline(false);
await browser.close();
server.close();

console.log(problems.length ? `\nFAILED:\n  ${problems.join('\n  ')}` : '\noffline: all checks passed');
process.exit(problems.length ? 1 : 0);
