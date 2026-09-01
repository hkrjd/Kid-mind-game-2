/* Regenerate the screenshots the README links to.
   Captured at 1x so the files stay small enough to live in the repo.
   Usage: python3 -m http.server 8123 &  node tools/make-docs-shots.mjs   */
import { chromium } from 'playwright';

const port = process.env.PORT || 8123;

const SHOTS = [
  { name: 'hub',      hash: '#/',                 lang: 'hi' },
  { name: 'map',      hash: '#/map',              lang: 'hi' },
  { name: 'memory',   hash: '#/level/memory-8',   lang: 'hi' },
  { name: 'counting', hash: '#/level/numbers-0',  lang: 'hi' },
  { name: 'maze',     hash: '#/level/motor-1',    lang: 'hi' },
  { name: 'jigsaw',   hash: '#/level/shapes-11',  lang: 'hi' },
  { name: 'sorting',  hash: '#/level/logic-3',    lang: 'hi' },
  { name: 'letters',  hash: '#/level/letters-0',  lang: 'en' },
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const shot of SHOTS) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.addInitScript((lang) => {
    localStorage.setItem('dimaag-ka-khel/v1', JSON.stringify({
      lang, sound: false, voice: false, motion: true,
      stars: { 'memory-0': 3, 'memory-1': 3, 'memory-2': 2, 'memory-3': 3 },
      struggle: {}, world: 99,
    }));
  }, shot.lang);
  await page.goto(`http://localhost:${port}/index.html${shot.hash}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `docs/${shot.name}.png` });
  console.log(`docs/${shot.name}.png`);
  await page.close();
}

await browser.close();
