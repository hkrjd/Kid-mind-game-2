/* ============================================================
   catalog.js — turns 20 engines into 300 concrete levels.

   Every level is a plain data object. Nothing here imports a game
   module, so the catalog is cheap to build at start-up and the
   engines themselves load lazily when a level is actually opened.
   ============================================================ */

import { WORLDS, ENGINES, LEVELS_PER_WORLD, TOTAL_LEVELS, UNLOCK_RATIO } from '../content/worlds.js';
import { Rng } from './rng.js';
import { isDone, starsFor } from './state.js';

/**
 * Difficulty rises across an engine's 15 levels: five easy, five
 * medium, five hard. Slow on purpose — repetition at one level is
 * how a 5-year-old consolidates a skill.
 */
function tierFor(indexInEngine) {
  return Math.min(2, Math.floor(indexInEngine / 5));
}

let LEVELS = null;

/** Build (once) the flat, ordered list of all 300 levels. */
function buildCatalog() {
  if (LEVELS) return LEVELS;
  const out = [];

  WORLDS.forEach((world, wi) => {
    const [engA, engB] = world.engines;
    // Alternate the two engines so a world reads A B A B…, giving
    // variety without introducing an unfamiliar rule.
    for (let i = 0; i < LEVELS_PER_WORLD; i++) {
      const engineId = i % 2 === 0 ? engA : engB;
      const indexInEngine = Math.floor(i / 2);
      const spec = ENGINES[engineId];
      const packs = spec.packs;

      const level = {
        id: `${world.id}-${i}`,
        engine: engineId,
        module: spec.module,
        icon: spec.icon,
        world: wi,
        worldId: world.id,
        indexInWorld: i,
        indexInEngine,
        // Cycle packs so consecutive levels of the same engine always
        // change subject matter.
        packId: packs[indexInEngine % packs.length],
        tier: tierFor(indexInEngine),
        number: wi * LEVELS_PER_WORLD + i + 1,   // 1..300, shown to the child
      };
      out.push(level);
    }
  });

  LEVELS = out;
  return LEVELS;
}

export function allLevels() {
  return buildCatalog();
}

export function levelsInWorld(worldIndex) {
  return buildCatalog().filter((l) => l.world === worldIndex);
}

export function getLevel(id) {
  return buildCatalog().find((l) => l.id === id) || null;
}

/** The level after `id` in catalog order, or null at the very end. */
export function nextLevel(id) {
  const list = buildCatalog();
  const i = list.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < list.length ? list[i + 1] : null;
}

/** A fresh, level-specific RNG. Same level id => same layout. */
export function rngFor(level) {
  return new Rng(`${level.id}|${level.engine}|${level.packId}|${level.tier}`);
}

/* ---------------- progression ---------------- */

export function worldProgress(worldIndex) {
  const list = levelsInWorld(worldIndex);
  const done = list.filter((l) => isDone(l.id)).length;
  const stars = list.reduce((sum, l) => sum + starsFor(l.id), 0);
  return { done, total: list.length, stars, maxStars: list.length * 3 };
}

/** World 0 is always open; later worlds need the previous one 60% done. */
export function isWorldUnlocked(worldIndex) {
  if (worldIndex <= 0) return true;
  const prev = worldProgress(worldIndex - 1);
  return prev.done >= Math.ceil(prev.total * UNLOCK_RATIO);
}

/**
 * Levels unlock one at a time inside a world, so a child always has
 * exactly one obvious "next" button to press.
 */
export function isLevelUnlocked(level) {
  if (!isWorldUnlocked(level.world)) return false;
  if (level.indexInWorld === 0) return true;
  const prev = levelsInWorld(level.world)[level.indexInWorld - 1];
  return isDone(prev.id);
}

/** The level the big Play button should jump to. */
export function firstUnplayedLevel() {
  const list = buildCatalog();
  return list.find((l) => !isDone(l.id) && isLevelUnlocked(l)) || list[0];
}

export { TOTAL_LEVELS, WORLDS };
