/* ============================================================
   worlds.js — how the 300 levels are grouped on the map.

   Ten worlds, each pairing two related games. Within a world the
   two games alternate (A B A B …) so a child gets variety without
   ever facing a rule they have not met, and difficulty rises across
   the world rather than jumping between games.
   ============================================================ */

import { GENERIC_PACK_IDS, PAIR_SET_IDS } from './packs.js';

/** Packs that suit "count these things" / "which is different" games. */
const GENERIC = GENERIC_PACK_IDS;

/**
 * One entry per game engine.
 *   packs  — content pools this engine cycles through
 *   icon   — shown on the level button
 *   module — lazily imported from js/games/<module>.js
 */
export const ENGINES = {
  memory:     { icon: '🃏', module: 'memory',     packs: GENERIC },
  findhidden: { icon: '🔍', module: 'findhidden', packs: GENERIC },
  oddone:     { icon: '🤔', module: 'oddone',     packs: GENERIC },
  sorting:    { icon: '🧺', module: 'sorting',    packs: ['shapes', ...GENERIC] },
  counting:   { icon: '🔢', module: 'counting',   packs: GENERIC },
  numberline: { icon: '📏', module: 'numberline', packs: GENERIC },
  letters:    { icon: '🔤', module: 'letters',    packs: GENERIC },
  firstsound: { icon: '👂', module: 'firstsound', packs: GENERIC },
  pattern:    { icon: '🔁', module: 'pattern',    packs: ['shapes', ...GENERIC] },
  ordering:   { icon: '📶', module: 'ordering',   packs: GENERIC },
  shapefit:   { icon: '🔷', module: 'shapefit',   packs: ['shapes'] },
  jigsaw:     { icon: '🧩', module: 'jigsaw',     packs: GENERIC },
  matching:   { icon: '🔗', module: 'matching',   packs: PAIR_SET_IDS },
  rhyme:      { icon: '🎵', module: 'rhyme',      packs: GENERIC },
  spotdiff:   { icon: '🔎', module: 'spotdiff',   packs: GENERIC },
  simon:      { icon: '🎹', module: 'simon',      packs: ['shapes'] },
  tracing:    { icon: '✍️', module: 'tracing',    packs: ['shapes'] },
  maze:       { icon: '🌀', module: 'maze',       packs: GENERIC },
  addsub:     { icon: '➕', module: 'addsub',     packs: GENERIC },
  moreless:   { icon: '⚖️', module: 'moreless',   packs: GENERIC },
};

/** Levels contributed by each engine. 20 engines x 15 = 300. */
export const LEVELS_PER_ENGINE = 15;

/**
 * Ten worlds x two engines x 15 levels = 300 levels.
 * Order is a deliberate learning progression: recognition and
 * memory first, symbolic work (letters, numbers) next, and the
 * fine-motor and arithmetic games last.
 */
export const WORLDS = [
  { id: 'memory',    nameKey: 'w.memory',    icon: '🧠', color: '#9b59b6', engines: ['memory', 'findhidden'] },
  { id: 'logic',     nameKey: 'w.logic',     icon: '💡', color: '#f5c518', engines: ['oddone', 'sorting'] },
  { id: 'pattern',   nameKey: 'w.pattern',   icon: '🔁', color: '#17a2b8', engines: ['pattern', 'ordering'] },
  { id: 'numbers',   nameKey: 'w.numbers',   icon: '🔢', color: '#3d7bd6', engines: ['counting', 'numberline'] },
  { id: 'shapes',    nameKey: 'w.shapes',    icon: '🔷', color: '#4caf50', engines: ['shapefit', 'jigsaw'] },
  { id: 'letters',   nameKey: 'w.letters',   icon: '🔤', color: '#e8629b', engines: ['letters', 'firstsound'] },
  { id: 'pairs',     nameKey: 'w.pairs',     icon: '🔗', color: '#f28c28', engines: ['matching', 'rhyme'] },
  { id: 'attention', nameKey: 'w.attention', icon: '👀', color: '#e8503a', engines: ['spotdiff', 'simon'] },
  { id: 'motor',     nameKey: 'w.motor',     icon: '✍️', color: '#8d6e63', engines: ['tracing', 'maze'] },
  { id: 'master',    nameKey: 'w.master',    icon: '🏆', color: '#574399', engines: ['addsub', 'moreless'] },
];

export const LEVELS_PER_WORLD = LEVELS_PER_ENGINE * 2;   // 30
export const TOTAL_LEVELS = WORLDS.length * LEVELS_PER_WORLD;  // 300

/**
 * A world unlocks when the previous one is 60% cleared. Not 100%:
 * a child who finds one game hard should never be walled off from
 * everything else.
 */
export const UNLOCK_RATIO = 0.6;
