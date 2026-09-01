/* Dev helper: screenshot one route in a tablet-sized viewport.
   Usage: node tools/shot.mjs "#/map" out.png            */
import { chromium } from 'playwright';

const hash = process.argv[2] || '#/';
const lang = process.env.LANG_UI || 'hi';
const out = process.argv[3] || 'shot.png';
const port = process.env.PORT || 8123;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2 });

// Unlock everything and silence speech so screenshots are quick.
await page.addInitScript((lang) => {
  localStorage.setItem('dimaag-ka-khel/v1', JSON.stringify({
    lang: lang, sound: false, voice: false, motion: true,
    stars: {}, struggle: {}, world: 99,
  }));
}, lang);

const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));

await page.goto(`http://localhost:${port}/index.html${hash}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: out });

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
