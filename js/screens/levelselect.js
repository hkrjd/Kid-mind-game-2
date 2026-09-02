/* ============================================================
   levelselect.js — the 30 levels inside one world.

   Each button shows the game's own icon plus the stars earned, so
   a child recognises "the card game" or "the counting game" by
   picture rather than by name.
   ============================================================ */

import { el, topBar } from '../core/ui.js';
import { t } from '../core/i18n.js';
import { WORLDS } from '../content/worlds.js';
import { createScene } from '../core/scene.js';
import { levelsInWorld, isLevelUnlocked } from '../core/catalog.js';
import { starsFor, isDone } from '../core/state.js';
import { sfx, speak } from '../core/audio.js';

export function levelSelectScreen(worldIndex, { go }) {
  const world = WORLDS[worldIndex];
  const grid = el('div.levels__grid');

  levelsInWorld(worldIndex).forEach((level) => {
    const unlocked = isLevelUnlocked(level);
    const stars = starsFor(level.id);

    const btn = el(`button.lvl${unlocked ? '' : '.lvl--locked'}${isDone(level.id) ? '.lvl--done' : ''}`, {
      type: 'button',
      'aria-label': `${level.number}`,
      onclick: () => {
        if (!unlocked) { sfx('oops'); speak(t('app.locked')); return; }
        sfx('tap');
        go(`#/level/${level.id}`);
      },
    },
      el('span.lvl__icon', { text: level.icon }),
      el('span.lvl__num', { text: String(level.number) }),
      el('span.lvl__stars', { text: stars ? '⭐'.repeat(stars) : '' }));

    grid.appendChild(btn);
  });

  // Tinted by this category, so it feels like a place of its own.
  return el('div.screen.map.screen--scened', {},
    createScene(world.id), topBar(t(world.nameKey), () => go('#/map')), grid);
}
