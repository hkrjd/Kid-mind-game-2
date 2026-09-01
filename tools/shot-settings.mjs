/* Dev helper: pass the parent gate for real (a three-second hold) and
   capture the settings screen behind it.                              */
import { chromium } from 'playwright';

const port = process.env.PORT || 8123;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2 });
await page.addInitScript(() => localStorage.setItem('dimaag-ka-khel/v1', JSON.stringify({
  lang: 'hi', sound: false, voice: false, motion: true,
  stars: { 'memory-0': 3, 'memory-1': 2, 'memory-2': 3 }, struggle: {}, world: 1,
})));

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`http://localhost:${port}/index.html#/settings`, { waitUntil: 'networkidle' });
await page.waitForSelector('.gate__pad');

// A short press must NOT open the gate.
const pad = await page.locator('.gate__pad').boundingBox();
const cx = pad.x + pad.width / 2;
const cy = pad.y + pad.height / 2;
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.waitForTimeout(800);
await page.mouse.up();
await page.waitForTimeout(300);
const stillGated = await page.locator('.gate__pad').count();
console.log(stillGated ? 'short press correctly rejected' : 'BUG: short press opened the gate');

// A full three-second hold must open it.
await page.mouse.down();
await page.waitForTimeout(3400);
await page.mouse.up();
await page.waitForTimeout(500);

const opened = await page.locator('.settings__body').count();
console.log(opened ? 'three-second hold opened settings' : 'BUG: hold did not open settings');

await page.screenshot({ path: process.argv[2] || 'settings.png' });
console.log(errors.length ? 'ERRORS: ' + errors.join('; ') : 'no page errors');
await browser.close();
