/* Dev helper: play a level to completion and capture the reward screen.
   Usage: node tools/shot-win.mjs "memory-0" out.png                   */
import { chromium } from 'playwright';

const levelId = process.argv[2] || 'memory-0';
const out = process.argv[3] || 'win.png';
const port = process.env.PORT || 8123;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2 });
await page.addInitScript(() => localStorage.setItem('dimaag-ka-khel/v1', JSON.stringify({
  lang: 'hi', sound: false, voice: false, motion: true, stars: {}, struggle: {}, world: 99,
})));

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`http://localhost:${port}/index.html#/level/${levelId}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__engine?.root?.isConnected, null, { timeout: 8000 });
await page.evaluate(() => window.__engine.autoSolve());
await page.waitForSelector('.reward', { timeout: 10000 });
await page.waitForTimeout(1200);          // let the stars land
await page.screenshot({ path: out });

console.log(errors.length ? 'ERRORS: ' + errors.join('; ') : 'reward captured');
await browser.close();
