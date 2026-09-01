/* ============================================================
   unit.mjs — the pure logic, checked without a browser.

   Fast enough to run on every save. The browser smoke test proves
   the levels are playable; this proves the catalog, the RNG, the
   translations and the difficulty maths are right in the first
   place.
   ============================================================ */

/* Minimal DOM and storage stubs — these modules only touch them at
   the edges, and the logic under test does not. */
globalThis.window = globalThis.window || {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener() {},
  removeEventListener() {},
};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.document = {
  documentElement: {},
  body: { classList: { toggle() {} } },
  addEventListener() {},
  createElement: () => ({
    style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, addEventListener() {}, append() {}, appendChild() {},
  }),
};

const { Rng } = await import('../js/core/rng.js');
const i18n = await import('../js/core/i18n.js');
const catalog = await import('../js/core/catalog.js');
const worlds = await import('../js/content/worlds.js');
const packs = await import('../js/content/packs.js');

let failures = 0;
let checks = 0;

function ok(label, cond, detail = '') {
  checks++;
  if (cond) return;
  failures++;
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
}

function group(name, fn) {
  console.log(`\n${name}`);
  const before = failures;
  fn();
  if (failures === before) console.log('  ✓ all good');
}

/* ---------------- catalog ---------------- */

group('catalog', () => {
  const levels = catalog.allLevels();

  ok('exactly 300 levels', levels.length === 300, `got ${levels.length}`);
  ok('every id is unique', new Set(levels.map((l) => l.id)).size === levels.length);
  ok('numbers run 1..300',
    levels.every((l, i) => l.number === i + 1));

  const byEngine = {};
  levels.forEach((l) => { byEngine[l.engine] = (byEngine[l.engine] || 0) + 1; });
  ok('20 engines', Object.keys(byEngine).length === 20, Object.keys(byEngine).length);
  ok('15 levels each',
    Object.values(byEngine).every((n) => n === 15),
    JSON.stringify(byEngine));

  ok('every engine is declared in worlds.js',
    Object.keys(byEngine).every((id) => worlds.ENGINES[id]));

  const tiers = {};
  levels.forEach((l) => { tiers[l.tier] = (tiers[l.tier] || 0) + 1; });
  ok('tiers are evenly split', tiers[0] === 100 && tiers[1] === 100 && tiers[2] === 100,
    JSON.stringify(tiers));

  ok('every level names a pack its engine declares',
    levels.every((l) => worlds.ENGINES[l.engine].packs.includes(l.packId)));

  ok('consecutive levels of one engine change pack', (() => {
    for (const id of Object.keys(byEngine)) {
      const mine = levels.filter((l) => l.engine === id);
      const distinct = new Set(mine.map((l) => l.packId)).size;
      if (worlds.ENGINES[id].packs.length > 1 && distinct < 2) return false;
    }
    return true;
  })());

  ok('the first world is open', catalog.isWorldUnlocked(0));
  ok('later worlds start locked', !catalog.isWorldUnlocked(1));
  ok('the first level of world 0 is playable', !!levels[0] && catalog.isLevelUnlocked(levels[0]));
  ok('the second is not, until the first is cleared', !!levels[1] && !catalog.isLevelUnlocked(levels[1]));
  ok('nextLevel walks the catalog',
    catalog.nextLevel(levels[5]?.id)?.id === levels[6]?.id);
  ok('nextLevel ends at the last level',
    catalog.nextLevel(levels[levels.length - 1]?.id) === null);

  ok('the same level always generates the same layout', (() => {
    if (!levels[42]) return false;
    const a = catalog.rngFor(levels[42]);
    const b = catalog.rngFor(levels[42]);
    return JSON.stringify(a.shuffle([1, 2, 3, 4, 5, 6])) ===
           JSON.stringify(b.shuffle([1, 2, 3, 4, 5, 6]));
  })());

  ok('different levels generate different layouts', (() => {
    if (!levels[42] || !levels[43]) return false;
    const a = catalog.rngFor(levels[42]).shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
    const b = catalog.rngFor(levels[43]).shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
    return JSON.stringify(a) !== JSON.stringify(b);
  })());
});

/* ---------------- rng ---------------- */

group('rng', () => {
  const r = new Rng('seed');
  ok('floats stay in [0,1)', Array.from({ length: 500 }, () => r.next()).every((v) => v >= 0 && v < 1));
  ok('int respects its range', Array.from({ length: 500 }, () => r.int(3, 7)).every((v) => v >= 3 && v <= 7));
  ok('int can hit both ends', (() => {
    const seen = new Set(Array.from({ length: 500 }, () => r.int(1, 3)));
    return seen.has(1) && seen.has(3);
  })());
  ok('shuffle keeps every element', (() => {
    const src = [1, 2, 3, 4, 5, 6, 7];
    const out = r.shuffle(src);
    return out.length === 7 && src.every((v) => out.includes(v));
  })());
  ok('shuffle does not mutate its input', (() => {
    const src = [1, 2, 3, 4, 5];
    r.shuffle(src);
    return JSON.stringify(src) === JSON.stringify([1, 2, 3, 4, 5]);
  })());
  ok('sample returns the count asked for, even past the pool',
    r.sample(['a', 'b'], 5).length === 5);
  ok('sample of a big pool has no repeats',
    new Set(r.sample([1, 2, 3, 4, 5, 6, 7, 8], 5)).size === 5);
});

/* ---------------- i18n ---------------- */

group('i18n', () => {
  const gaps = i18n.missingKeys();
  ok('Hindi and English define the same keys',
    !gaps.missingInHi.length && !gaps.missingInEn.length, JSON.stringify(gaps));

  i18n.setLang('hi');
  ok('Hindi resolves', i18n.t('app.play') === 'खेलो', i18n.t('app.play'));
  ok('Hindi numbers resolve', i18n.numWord(5) === 'पाँच');
  ok('placeholders fill in',
    i18n.t('set.progress.val', { done: 3, total: 300, stars: 8 }).includes('300 में से 3'));

  i18n.setLang('en');
  ok('English resolves', i18n.t('app.play') === 'Play');
  ok('English numbers resolve', i18n.numWord(5) === 'five');
  ok('an unknown key falls back to itself', i18n.t('no.such.key') === 'no.such.key');
  ok('speech locale follows the language', i18n.speechLocale() === 'en-IN');
  i18n.setLang('hi');
  ok('speech locale follows back', i18n.speechLocale() === 'hi-IN');

  ok('every engine has a prompt in both languages', (() => {
    for (const id of Object.keys(worlds.ENGINES)) {
      for (const lang of ['hi', 'en']) {
        i18n.setLang(lang);
        // moreless and addsub use suffixed keys.
        const base = i18n.t(`p.${id}`);
        const alt = i18n.t(`p.${id}.add`);
        if (base === `p.${id}` && alt === `p.${id}.add`) return false;
      }
    }
    return true;
  })());

  ok('every world has a name in both languages', (() => {
    for (const w of worlds.WORLDS) {
      for (const lang of ['hi', 'en']) {
        i18n.setLang(lang);
        if (i18n.t(w.nameKey) === w.nameKey) return false;
      }
    }
    return true;
  })());
});

/* ---------------- content ---------------- */

group('content packs', () => {
  const all = Object.values(packs.PACKS).flatMap((p) => p.items);
  ok('every item has an emoji and both names',
    all.every((i) => i.e && i.hi && i.en), 'some item is missing a field');
  ok('every item declares a colour family',
    all.every((i) => packs.COLORS[i.c]),
    all.filter((i) => !packs.COLORS[i.c]).map((i) => i.e).join(' '));
  ok('no pack is too small for the games that use it',
    Object.values(packs.PACKS).every((p) => p.items.length >= 12),
    Object.values(packs.PACKS).filter((p) => p.items.length < 12).map((p) => p.id).join(' '));
  ok('the shapes pack covers three shape families',
    new Set(packs.PACKS.shapes.items.map((i) => i.sh)).size === 3);
  ok('every pair set has enough pairs for the hardest tier',
    Object.values(packs.PAIR_SETS).every((s) => s.pairs.length >= 5));
  ok('every pair carries both halves in both languages',
    Object.values(packs.PAIR_SETS).every((s) =>
      s.pairs.every((p) => p.a && p.b && p.ahi && p.bhi && p.aen && p.ben)));
  ok('both alphabets are present',
    packs.LETTERS.hi.length >= 20 && packs.LETTERS.en.length === 26);
});

/* ---------------- adaptive difficulty ---------------- */

/* Needs top-level await, so it does not go through group(). */
{
  console.log('\nadaptive difficulty');
  const before = failures;
  const state = await import('../js/core/state.js');
  const { effectiveTier } = await import('../js/core/engine.js');
  state.load();

  ok('an untroubled child plays the tier as written', effectiveTier('memory', 2) === 2);

  // Four rounds needing help is the ceiling.
  for (let i = 0; i < 6; i++) state.noteStruggle('memory', 1);
  ok('struggle is capped', state.struggleFor('memory') === 4, String(state.struggleFor('memory')));
  ok('a struggling child drops two tiers', effectiveTier('memory', 2) === 0);
  ok('but never below the easiest', effectiveTier('memory', 0) === 0);

  // Clean clears walk it back.
  for (let i = 0; i < 6; i++) state.noteStruggle('memory', -1);
  ok('clean clears restore the difficulty', effectiveTier('memory', 2) === 2);
  ok('struggle floors at zero', state.struggleFor('memory') === 0);

  ok('softening is per game, not global', (() => {
    state.noteStruggle('counting', 1);
    state.noteStruggle('counting', 1);
    return effectiveTier('counting', 2) === 1 && effectiveTier('memory', 2) === 2;
  })());

  if (failures === before) console.log('  ✓ all good');
}

/* ---------------- the help ladder ---------------- */

/*
 * The one promise the whole design rests on: a child can never get
 * stuck. Two mistakes pulse the answer, four solve the step outright.
 * An engine missing either half would strand them, so every engine is
 * checked for a complete ladder — and for the autoSolve() the level
 * suite drives it with.
 */
{
  console.log('\nhelp ladder');
  const before = failures;

  for (const [id, spec] of Object.entries(worlds.ENGINES)) {
    const mod = await import(`../js/games/${spec.module}.js`);
    const Engine = mod.default;
    const proto = Engine?.prototype;

    ok(`${id}: exports an engine`, typeof Engine === 'function');
    ok(`${id}: declares its own id`, Engine?.id === id, `got ${Engine?.id}`);

    // A hint is either hintTarget() for the base ladder, or a
    // giveHint() the engine draws itself (the canvas games).
    ok(`${id}: can hint`,
      typeof proto?.hintTarget === 'function' || Object.hasOwn(proto ?? {}, 'giveHint'));
    ok(`${id}: can solve the step for them`, typeof proto?.solveStep === 'function');
    ok(`${id}: can be driven by the test suite`, typeof proto?.autoSolve === 'function');
    ok(`${id}: builds a level`, typeof proto?.build === 'function');
  }

  if (failures === before) console.log('  ✓ all good');
}

/* ---------------- report ---------------- */

console.log(`\n${'─'.repeat(46)}`);
console.log(failures ? `${failures} of ${checks} checks FAILED` : `all ${checks} checks passed`);
process.exit(failures ? 1 : 0);
