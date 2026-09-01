/* ============================================================
   map.js — the world picker.

   Ten big cards. A locked world stays visible but greyed, so a
   child can see there is more to come rather than nothing at all.
   ============================================================ */

import { el, topBar } from '../core/ui.js';
import { t } from '../core/i18n.js';
import { WORLDS } from '../content/worlds.js';
import { worldProgress } from '../core/catalog.js';
import { sfx } from '../core/audio.js';

export function mapScreen({ go }) {
  const grid = el('div.map__grid');

  // Every category is open, so none of these cards can be locked.
  WORLDS.forEach((world, i) => {
    const { done, total, stars } = worldProgress(i);
    const name = t(world.nameKey);

    const card = el('div.world', {
      role: 'button',
      tabindex: 0,
      'aria-label': `${name} — ${done}/${total}`,
      style: { borderBottom: `10px solid ${world.color}` },
      onclick: () => {
        sfx('tap');
        go(`#/world/${i}`);
      },
    },
      el('div.world__icon', { text: world.icon }),
      el('div.world__name', { text: name }),
      el('div.world__stars', { text: `⭐ ${stars}  ·  ${done}/${total}` }));

    grid.appendChild(card);
  });

  return el('div.screen.map', {}, topBar(t('app.title'), () => go('#/')), grid);
}
