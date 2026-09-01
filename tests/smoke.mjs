/* ============================================================
   smoke.mjs — drive every level in the catalog to completion.

   This is the safety net for a 300-level catalog: it opens each
   level, calls the engine's autoSolve(), and fails if the level
   does not actually reach a win state, if the console reports an
   error, or if any tappable element is smaller than the touch
   floor a 5-year-old needs.

     node tests/smoke.mjs                  # everything
     node tests/smoke.mjs --engine memory  # one game
     node tests/smoke.mjs --limit 20       # first N levels
     node tests/smoke.mjs --no-touch       # skip the size audit
     node tests/smoke.mjs --viewport 800x600   # a small 7-inch tablet
   ============================================================ */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = Number(process.env.PORT || 8199);

/** Minimum tappable size, in CSS px. Matches --touch in base.css. */
const TOUCH_MIN = 120;
/** Small chrome controls are allowed to be a bit under the tile floor. */
const TOUCH_MIN_CHROME = 88;

const args = process.argv.slice(2);
const flag = (name, def = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? true) : def;
};
const onlyEngine = flag('engine');
const limit = Number(flag('limit', 0));
const checkTouch = !args.includes('--no-touch');
const headed = args.includes('--headed');

/* Default is a 10-inch tablet in landscape. Pass --viewport to check a
   smaller one: tiles shrink to fit, and the touch floor must still hold
   on the smallest screen a child might actually be handed. */
const [vw, vh] = String(flag('viewport', '1024x768')).split('x').map(Number);

/* ---------------- tiny static server ---------------- */

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

/* ---------------- browser ---------------- */

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  headless: !headed,
});
const page = await browser.newPage({ viewport: { width: vw, height: vh } });

const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR ${e.message}`));

// Sound, speech and animation all off: the test should measure
// logic, not wait on timers.
await page.addInitScript(() => {
  localStorage.setItem('dimaag-ka-khel/v1', JSON.stringify({
    lang: 'hi', sound: false, voice: false, motion: false,
    stars: {}, struggle: {}, world: 99,
  }));
});

await page.goto(`http://localhost:${PORT}/index.html#/`, { waitUntil: 'networkidle' });

/* Hindi and English must define exactly the same keys — a string
   added to one language and not the other is a bug, not a warning. */
const i18nGaps = await page.evaluate(async () => {
  const m = await import('./js/core/i18n.js');
  return m.missingKeys();
});
if (i18nGaps.missingInHi.length || i18nGaps.missingInEn.length) {
  console.error('\ni18n key parity FAILED');
  if (i18nGaps.missingInHi.length) console.error('  missing in hi:', i18nGaps.missingInHi.join(', '));
  if (i18nGaps.missingInEn.length) console.error('  missing in en:', i18nGaps.missingInEn.join(', '));
  await browser.close();
  server.close();
  process.exit(1);
}
console.log('i18n key parity: ok');

let levels = await page.evaluate(() => window.__app.allLevels().map((l) => ({
  id: l.id, engine: l.engine, number: l.number, tier: l.tier, packId: l.packId,
})));
if (onlyEngine) levels = levels.filter((l) => l.engine === onlyEngine);
if (limit > 0) levels = levels.slice(0, limit);

console.log(`\nRunning ${levels.length} levels at ${vw}x${vh}…\n`);

/* ---------------- per-level run ---------------- */

const failures = [];
const engineStats = new Map();
const t0 = Date.now();

async function auditTouchTargets(level) {
  const bad = await page.evaluate(({ min, minChrome }) => {
    const out = [];
    const sel = '.tile, .btn, .bin, .slot, .lvl, .world, .count-item';
    for (const node of document.querySelectorAll(sel)) {
      if (node.classList.contains('tile--gone')) continue;
      const r = node.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;   // not laid out
      const floor = node.closest('.gamebar, .topbar') ? minChrome : min;
      if (r.width < floor - 0.5 || r.height < floor - 0.5) {
        out.push(`${node.className.split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)} < ${floor}`);
      }
      // Big enough is not sufficient — the body clips overflow, so a
      // control pushed past the edge is invisible and untappable.
      if (node.closest('.map__grid, .levels__grid, .settings__body')) continue;  // these scroll
      if (r.bottom > innerHeight + 1 || r.top < -1 || r.right > innerWidth + 1 || r.left < -1) {
        out.push(`${node.className.split(' ')[0]} off-screen (top ${Math.round(r.top)}, bottom ${Math.round(r.bottom)} vs ${innerHeight})`);
      }
    }
    return [...new Set(out)];
  }, { min: TOUCH_MIN, minChrome: TOUCH_MIN_CHROME });

  if (bad.length) failures.push({ level: level.id, engine: level.engine, why: `touch target too small: ${bad.join('; ')}` });
  return bad.length === 0;
}

for (const level of levels) {
  const before = consoleErrors.length;
  const stat = engineStats.get(level.engine) || { pass: 0, fail: 0 };
  let ok = true;
  let why = '';

  try {
    await page.evaluate((id) => { window.__engine = null; window.location.hash = `#/level/${id}`; }, level.id);

    // Wait for the engine to mount and build its field.
    await page.waitForFunction(
      (id) => window.__engine && window.__level?.id === id && window.__engine.root?.isConnected,
      level.id,
      { timeout: 8000 },
    );

    if (checkTouch) await auditTouchTargets(level);

    // The app must never scroll sideways on any screen.
    if (await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) {
      failures.push({ level: level.id, engine: level.engine, why: 'page scrolls horizontally' });
    }

    await page.evaluate(() => window.__engine.autoSolve());
    await page.waitForFunction(() => window.__engine?.solved === true, null, { timeout: 12000 });

    // The win overlay is the child-visible proof the level ended.
    await page.waitForSelector('.reward', { timeout: 6000 });
  } catch (err) {
    ok = false;
    why = err.message.split('\n')[0];
  }

  const newErrors = consoleErrors.slice(before);
  if (newErrors.length) { ok = false; why = why || `console: ${newErrors[0]}`; }

  if (ok) { stat.pass++; }
  else { stat.fail++; failures.push({ level: level.id, engine: level.engine, why }); }
  engineStats.set(level.engine, stat);

  process.stdout.write(ok ? '.' : 'x');
  if ((levels.indexOf(level) + 1) % 60 === 0) process.stdout.write(`  ${levels.indexOf(level) + 1}\n`);
}

/* ---------------- report ---------------- */

const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n\n${'─'.repeat(58)}`);
console.log(`${'engine'.padEnd(14)} pass  fail`);
console.log('─'.repeat(58));
for (const [engine, s] of [...engineStats].sort()) {
  const mark = s.fail ? '✗' : '✓';
  console.log(`${mark} ${engine.padEnd(12)} ${String(s.pass).padStart(4)}  ${String(s.fail).padStart(4)}`);
}
console.log('─'.repeat(58));

const passed = levels.length - failures.length;
console.log(`\n${passed}/${levels.length} levels passed in ${secs}s`);

if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  for (const f of failures.slice(0, 25)) console.log(`  ${f.level.padEnd(16)} [${f.engine}] ${f.why}`);
  if (failures.length > 25) console.log(`  … and ${failures.length - 25} more`);
}

await browser.close();
server.close();
process.exit(failures.length ? 1 : 0);
