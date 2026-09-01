/* ============================================================
   update.mjs — does a deployed fix actually reach a tablet that
   already has the game?

   This is the failure the offline test cannot see. A service
   worker is only reinstalled when its own bytes change, so under
   a cache-first strategy a tablet that had once loaded the game
   kept serving that copy forever: every later fix was invisible.

   The check: install the worker against build A, switch what the
   server returns to build B, and confirm a returning visitor ends
   up on B — while still working with the network cut.
   ============================================================ */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = Number(process.env.PORT || 8233);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml' };

/** Flipped mid-test to stand in for deploying a new version. */
let build = 'A';

const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const file = join(ROOT, path === '/' ? 'index.html' : path);
    let body = await readFile(file);
    // Stamp the build into the page, the way a real deploy changes it.
    if (extname(file) === '.html') {
      body = Buffer.from(String(body).replace('<head>', `<head><meta name="build" content="${build}">`));
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await context.newPage();
const url = `http://localhost:${PORT}/index.html`;

const problems = [];
const seen = () => page.evaluate(() =>
  document.querySelector('meta[name="build"]')?.content ?? '?');

/* 1. First visit: the worker installs and caches build A. */
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => navigator.serviceWorker.ready);
await page.waitForTimeout(400);
console.log(`first visit sees build ${await seen()}`);
if (await seen() !== 'A') problems.push('first visit did not see build A');

/* 2. Ship a fix. sw.js itself is unchanged, exactly as when only a
      game file is edited — the case that used to be invisible. */
build = 'B';

/* 3. A returning visitor must end up on the new build. Stale-while-
      revalidate serves the cached copy first and refreshes behind it,
      so this is allowed to take a second visit — but not more. */
let landedOn = null;
for (let visit = 1; visit <= 2; visit++) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  landedOn = await seen();
  console.log(`return visit ${visit} sees build ${landedOn}`);
  if (landedOn === 'B') break;
}
if (landedOn !== 'B') {
  problems.push('a returning visitor never received the new build — every fix would be invisible on a tablet that already has the game');
}

/* 4. And none of that may cost us working offline. */
await context.setOffline(true);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const worksOffline = await page.locator('.hub__play').count() > 0;
console.log(worksOffline ? 'still works with the network cut' : 'BROKEN offline');
if (!worksOffline) problems.push('the app no longer works offline');
await context.setOffline(false);

await browser.close();
server.close();

console.log(problems.length ? `\nFAILED:\n  ${problems.join('\n  ')}` : '\nupdates reach returning players, and offline still works');
process.exit(problems.length ? 1 : 0);
