/* ============================================================
   audit.mjs — is each puzzle actually a good puzzle?

   The smoke test proves every level can be won, but it wins them
   by clicking the answer the engine nominated. That says nothing
   about two things a child would notice immediately:

   1. Is the puzzle well posed? Exactly one right answer, the
      "odd" one really odd, the count really matching the pile.
      A level with two valid answers passes the smoke test and
      still punishes a child for being right.

   2. Does the never-stuck promise hold? A child who only ever
      taps the wrong thing must still finish the level, via the
      hint at two mistakes and the solve-it-for-them at four.
      Nothing tested that until now.

     node tests/audit.mjs                 # everything
     node tests/audit.mjs --engine oddone # one game
     node tests/audit.mjs --quick         # validity only, skip the slow part
   ============================================================ */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = Number(process.env.PORT || 8288);

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? (args[i + 1] ?? true) : null; };
const onlyEngine = flag('engine');
const quick = args.includes('--quick');

/* ---------------- server ---------------- */

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = createServer(async (req, res) => {
  try {
    const p = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const file = join(ROOT, p === '/' ? 'index.html' : p);
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end('nope'); }
});
await new Promise((r) => server.listen(PORT, r));

/* ------------------------------------------------------------
   Per-engine validity checks.

   Each runs inside the page against the live engine and returns
   an array of problem strings (empty means the puzzle is sound).
   ------------------------------------------------------------ */
const VALIDATORS = {

  memory: `
    const bad = [];
    const counts = {};
    for (const c of e.cards) counts[c._item.e] = (counts[c._item.e] || 0) + 1;
    for (const [emoji, n] of Object.entries(counts))
      if (n !== 2) bad.push(\`\${emoji} appears \${n} times, not 2\`);
    if (Object.keys(counts).length !== e.total) bad.push('pair count does not match the board');
    return bad;`,

  findhidden: `
    const bad = [];
    const hits = e.tiles.filter((t) => t._item === e.target);
    if (hits.length !== 1) bad.push(\`target appears \${hits.length} times, not 1\`);
    const sameEmoji = e.tiles.filter((t) => t._item.e === e.target.e);
    if (sameEmoji.length !== 1) bad.push(\`a distractor uses the target's emoji (\${sameEmoji.length} matches)\`);
    return bad;`,

  oddone: `
    const bad = [];
    const odd = e.tiles.filter((t) => t._item === e.oddItem);
    if (odd.length !== 1) bad.push(\`odd item appears \${odd.length} times\`);
    const others = e.tiles.filter((t) => t._item !== e.oddItem).map((t) => t._item);
    if (others.some((o) => o.e === e.oddItem.e))
      bad.push('a non-odd tile shows the same emoji as the odd one');
    return bad;`,

  sorting: `
    const bad = [];
    for (const item of e.items) {
      const homes = e.bins.filter((b) => b._key === item._key);
      if (homes.length !== 1) bad.push(\`"\${item._item.e}" fits \${homes.length} bins, not 1\`);
    }
    if (new Set(e.bins.map((b) => b._key)).size !== e.bins.length)
      bad.push('two bins share a key');
    return bad;`,

  counting: `
    const bad = [];
    if (e.things.length !== e.answer)
      bad.push(\`\${e.things.length} things on screen but the answer is \${e.answer}\`);
    const right = e.buttons.filter((b) => b._n === e.answer);
    if (right.length !== 1) bad.push(\`\${right.length} buttons carry the answer\`);
    if (new Set(e.buttons.map((b) => b._n)).size !== e.buttons.length)
      bad.push('duplicate number options');
    return bad;`,

  numberline: `
    const bad = [];
    for (let i = 1; i < e.wanted.length; i++)
      if (e.wanted[i] <= e.wanted[i - 1]) bad.push('wanted order is not ascending');
    const vals = e.tiles.map((t) => t._value).sort((a, b) => a - b);
    if (JSON.stringify(vals) !== JSON.stringify([...e.wanted].sort((a, b) => a - b)))
      bad.push('tiles do not match the wanted set');
    return bad;`,

  letters: `
    const bad = [];
    const right = e.tiles.filter((t) => t._letter === e.answer);
    if (right.length !== 1) bad.push(\`\${right.length} tiles are the answer\`);
    const glyphs = e.tiles.map((t) => t._letter.e);
    if (new Set(glyphs).size !== glyphs.length) bad.push('the same letter is offered twice');
    return bad;`,

  firstsound: `
    const bad = [];
    const L = e.letter;
    const starts = e.tiles.filter((t) => {
      const name = (window.__lang === 'hi' ? t._item.hi : t._item.en) || '';
      return name.trim().charAt(0).toUpperCase() === L;
    });
    if (starts.length !== 1)
      bad.push(\`\${starts.length} of the choices start with "\${L}" — the question has \${starts.length} right answers\`);
    if (!starts.includes(e.tiles.find((t) => t._item === e.answer)))
      bad.push('the nominated answer does not start with the letter shown');
    return bad;`,

  pattern: `
    const bad = [];
    const right = e.choices.filter((c) => c._item === e.answer);
    if (right.length !== 1) bad.push(\`\${right.length} choices are the answer\`);
    const emojis = e.choices.map((c) => c._item.e);
    if (new Set(emojis).size !== emojis.length) bad.push('two choices show the same picture');
    if (!e.gapNode) bad.push('no gap rendered in the sequence');
    return bad;`,

  ordering: `
    const bad = [];
    for (let i = 1; i < e.sizes.length; i++)
      if (e.sizes[i] <= e.sizes[i - 1]) bad.push('sizes are not strictly increasing');
    const ranks = e.tiles.map((t) => t._rank).sort((a, b) => a - b);
    if (JSON.stringify(ranks) !== JSON.stringify(e.sizes.map((_, i) => i)))
      bad.push('ranks are not a clean permutation');
    return bad;`,

  shapefit: `
    const bad = [];
    if (e.pieces.length !== e.holes.length) bad.push('piece and hole counts differ');
    for (const p of e.pieces) {
      const fits = e.holes.filter((h) => h._item === p._item);
      if (fits.length !== 1) bad.push(\`a piece fits \${fits.length} holes\`);
    }
    return bad;`,

  jigsaw: `
    const bad = [];
    const pi = e.pieces.map((p) => p._index).sort((a, b) => a - b);
    const si = e.slots.map((s) => s._index).sort((a, b) => a - b);
    const want = e.slots.map((_, i) => i);
    if (JSON.stringify(pi) !== JSON.stringify(want)) bad.push('pieces are not one per position');
    if (JSON.stringify(si) !== JSON.stringify(want)) bad.push('slots are not one per position');
    return bad;`,

  matching: `
    const bad = [];
    if (e.lefts.length !== e.rights.length) bad.push('sides have different lengths');
    for (const l of e.lefts) {
      const partners = e.rights.filter((r) => r._pair === l._pair);
      if (partners.length !== 1) bad.push(\`a left item has \${partners.length} partners\`);
    }
    const leftEmoji = e.lefts.map((l) => l._pair.a);
    if (new Set(leftEmoji).size !== leftEmoji.length) bad.push('a picture repeats on the left');
    const rightEmoji = e.rights.map((r) => r._pair.b);
    if (new Set(rightEmoji).size !== rightEmoji.length) bad.push('a picture repeats on the right');
    return bad;`,

  shadow: `
    const bad = [];
    const right = e.tiles.filter((t) => t._item === e.answer);
    if (right.length !== 1) bad.push(\`\${right.length} tiles match the shadow\`);
    const sameGlyph = e.tiles.filter((t) => t._item.e === e.answer.e);
    if (sameGlyph.length !== 1) bad.push('another choice shows the same picture as the answer');
    return bad;`,

  spotdiff: `
    const bad = [];
    for (let i = 0; i < e.left.tiles.length; i++) {
      const same = e.left.tiles[i]._item.e === e.right.tiles[i]._item.e;
      if (e.changed.has(i) && same) bad.push(\`cell \${i} is marked different but looks identical\`);
      if (!e.changed.has(i) && !same) bad.push(\`cell \${i} differs but is not counted\`);
    }
    if (e.changed.size !== e.totalDiffs) bad.push('difference count does not match the marked cells');
    if (e.changed.size < 1) bad.push('no differences at all');
    return bad;`,

  simon: `
    const bad = [];
    if (!e.sequence.length) bad.push('empty sequence');
    if (e.sequence.some((i) => i < 0 || i >= e.pads.length)) bad.push('sequence points outside the pads');
    return bad;`,

  tracing: `
    const bad = [];
    if (!e.guide || e.guide.length < 5) bad.push('guide path is too short to trace');
    if (!e.waypoints || e.waypoints.length < 5) bad.push('too few waypoints');
    const out = e.guide.filter(([x, y]) => x < 0 || x > 1 || y < 0 || y > 1);
    if (out.length) bad.push(\`\${out.length} guide points fall outside the canvas\`);
    return bad;`,

  maze: `
    const bad = [];
    const route = e.routeToGoal();
    if (!route.length) bad.push('the cheese is not reachable from the start');
    if (route[route.length - 1] !== e.goal) bad.push('the route does not end at the cheese');
    // every step must be through an opening, not a wall
    let prev = e.path[e.path.length - 1];
    for (const step of route) {
      if (!e.open(prev, step)) { bad.push('the route passes through a wall'); break; }
      prev = step;
    }
    return bad;`,

  addsub: `
    const bad = [];
    const expect = e.isSub ? e.a - e.b : e.a + e.b;
    if (e.answer !== expect) bad.push(\`answer \${e.answer} but \${e.a} \${e.isSub ? '-' : '+'} \${e.b} = \${expect}\`);
    if (e.answer < 0) bad.push('negative answer');
    const right = e.buttons.filter((b) => b._n === e.answer);
    if (right.length !== 1) bad.push(\`\${right.length} buttons carry the answer\`);
    const shown = e.field.querySelectorAll('.count-item').length;
    const wantShown = e.isSub ? e.a : e.a + e.b;
    if (shown !== wantShown) bad.push(\`\${shown} things drawn but the sum uses \${wantShown}\`);
    return bad;`,

  moreless: `
    const bad = [];
    const [a, b] = e.counts;
    if (a === b) bad.push('both sides hold the same number — no right answer');
    const want = e.askLess ? Math.min(a, b) : Math.max(a, b);
    if (e.counts[e.winningSide] !== want) bad.push('the winning side is not the one the question asks for');
    for (let i = 0; i < 2; i++) {
      const drawn = e.sides[i].querySelectorAll('.count-item').length;
      if (drawn !== e.counts[i]) bad.push(\`side \${i} shows \${drawn} things but counts \${e.counts[i]}\`);
    }
    return bad;`,
};

/* ---------------- browser ---------------- */

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR ${e.message}`));
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

await page.addInitScript(() => {
  localStorage.setItem('dimaag-ka-khel/v1', JSON.stringify({
    lang: 'hi', sound: false, voice: false, motion: false,
    stars: {}, struggle: {}, world: 99,
  }));
  window.__lang = 'hi';
});

await page.goto(`http://localhost:${PORT}/index.html#/`, { waitUntil: 'networkidle' });

let levels = await page.evaluate(() => window.__app.allLevels()
  .map((l) => ({ id: l.id, engine: l.engine, tier: l.tier, number: l.number })));

// One level per tier per engine — enough to exercise every configuration.
const sample = [];
for (const l of levels) {
  if (onlyEngine && l.engine !== onlyEngine) continue;
  if (!sample.some((s) => s.engine === l.engine && s.tier === l.tier)) sample.push(l);
}

console.log(`\nAuditing ${sample.length} levels (every engine at every tier)\n`);

const findings = [];

async function openLevel(id) {
  await page.evaluate((i) => {
    window.__app.resetProgress();
    window.__engine = null;
    location.hash = `#/level/${i}`;
  }, id);
  await page.waitForFunction((i) => window.__engine && window.__level?.id === i
    && window.__engine.root?.isConnected, id, { timeout: 8000 });
  await page.waitForTimeout(120);
}

/* ---------- part 1: is the puzzle well posed? ---------- */

console.log('── puzzle validity ─────────────────────────────────────');
for (const level of sample) {
  const body = VALIDATORS[level.engine];
  if (!body) { findings.push({ level: level.id, engine: level.engine, kind: 'validity', why: 'no validator written' }); continue; }
  await openLevel(level.id);
  let problems;
  try {
    problems = await page.evaluate(`(() => { const e = window.__engine; ${body} })()`);
  } catch (err) {
    problems = [`validator threw: ${err.message.split('\n')[0]}`];
  }
  for (const why of problems) findings.push({ level: level.id, engine: level.engine, tier: level.tier, kind: 'validity', why });
  process.stdout.write(problems.length ? 'x' : '.');
}
console.log('');

/* ---------- part 2: can a child who only taps wrong still finish? ---------- */

if (!quick) {
  console.log('\n── never-stuck guarantee ───────────────────────────────');
  for (const level of sample) {
    await openLevel(level.id);

    // A child who never gets anywhere. In most games that means tapping
    // the wrong thing over and over; in the maze and the tracing game
    // there is nothing to get wrong, so it means simply not making
    // progress — and that path has to be exercised the same way, or a
    // game whose ladder can never fire would still look fine here.
    const result = await page.evaluate(async () => {
      const e = window.__engine;
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let sawHint = false;
      const noteHint = () => {
        if (e.hintsUsed > 0 || document.querySelector('.tile--hint')) sawHint = true;
      };

      if (e.idleMs) {
        // Stall completely: touch nothing at all and let the clock run.
        e.idleMs = 350;              // the real wait is 14s; shorten it here
        e.noteProgress();
        for (let i = 0; i < 90 && !e.solved && !e.destroyed; i++) {
          await sleep(180);
          noteHint();
        }
      } else {
        for (let i = 0; i < 24 && !e.solved && !e.destroyed; i++) {
          e.wrong(null);
          await sleep(260);
          noteHint();
          await sleep(560);
        }
      }
      // win() sets solved immediately but appends the reward overlay
      // after a beat, so wait for the overlay itself, not the flag.
      for (let i = 0; i < 30 && !document.querySelector('.reward'); i++) await sleep(120);
      return {
        solved: e.solved,
        sawHint,
        mistakes: e.mistakes,
        hintsUsed: e.hintsUsed,
        rewardShown: !!document.querySelector('.reward'),
      };
    });

    if (!result.solved) {
      findings.push({ level: level.id, engine: level.engine, tier: level.tier, kind: 'stuck',
        why: `never finished (${result.mistakes} wrong taps, ${result.hintsUsed} hints) — a child could be stranded here` });
    } else if (!result.sawHint) {
      findings.push({ level: level.id, engine: level.engine, tier: level.tier, kind: 'stuck',
        why: 'finished but never offered a hint on the way' });
    } else if (!result.rewardShown) {
      findings.push({ level: level.id, engine: level.engine, tier: level.tier, kind: 'stuck',
        why: 'marked solved but showed no reward screen' });
    }
    process.stdout.write(result.solved && result.sawHint && result.rewardShown ? '.' : 'x');
  }
  console.log('');
}

/* ---------- report ---------- */

if (consoleErrors.length) {
  for (const err of [...new Set(consoleErrors)].slice(0, 10)) {
    findings.push({ level: '-', engine: '-', kind: 'console', why: err });
  }
}

console.log(`\n${'═'.repeat(72)}`);
if (!findings.length) {
  console.log(`No problems found across ${sample.length} levels.`);
} else {
  const byKind = {};
  for (const f of findings) (byKind[f.kind] ??= []).push(f);
  for (const [kind, list] of Object.entries(byKind)) {
    console.log(`\n${kind.toUpperCase()} — ${list.length} finding(s)`);
    for (const f of list) console.log(`  ${String(f.level).padEnd(14)} [${f.engine}] ${f.why}`);
  }
}
console.log(`${'═'.repeat(72)}\n`);

await browser.close();
server.close();
process.exit(findings.length ? 1 : 0);
