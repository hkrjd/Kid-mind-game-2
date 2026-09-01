/* Dev check: every emoji in the content packs must render as a real
   glyph. A missing one shows as a tofu box on the child's tablet, and
   for a game whose entire artwork is emoji that is a content bug.     */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
await page.setContent('<body style="font: 64px serif"></body>');

// Collect every emoji literal used as content.
const src = ['js/content/packs.js', 'js/games/maze.js']
  .map((f) => readFileSync(f, 'utf8')).join('\n');
const emoji = [...new Set(
  [...src.matchAll(/(?:e|a|b|emoji|icon|START_EMOJI|GOAL_EMOJI):\s*'([^']+)'/g)].map((m) => m[1])
    .concat([...src.matchAll(/'(\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*)'/gu)].map((m) => m[1]))
)].filter((s) => /\p{Extended_Pictographic}/u.test(s));

const report = await page.evaluate((list) => {
  const measure = (ch) => {
    const span = document.createElement('span');
    span.style.cssText = 'position:absolute;font:64px serif;white-space:pre';
    span.textContent = ch;
    document.body.appendChild(span);
    const r = span.getBoundingClientRect();
    span.remove();
    return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 };
  };
  const tofu = measure('￿');       // a character no font has
  return list.map((ch) => {
    const m = measure(ch);
    return { ch, ...m, missing: Math.abs(m.w - tofu.w) < 0.5 };
  });
}, emoji);

const missing = report.filter((r) => r.missing);
console.log(`checked ${report.length} emoji`);
console.log(missing.length
  ? `MISSING GLYPHS (${missing.length}): ${missing.map((m) => m.ch).join(' ')}`
  : 'every emoji renders as a real glyph');

await browser.close();
process.exit(missing.length ? 1 : 0);
