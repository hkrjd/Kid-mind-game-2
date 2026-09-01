/* ============================================================
   hub.js — the title screen.

   One giant Play button that resumes exactly where the child left
   off, so a 5-year-old can start alone without reading anything.
   ============================================================ */

import { el, button, iconButton } from '../core/ui.js';
import { t } from '../core/i18n.js';
import { totalStars, completedCount } from '../core/state.js';
import { firstUnplayedLevel, TOTAL_LEVELS } from '../core/catalog.js';
import { speak } from '../core/audio.js';

export function hubScreen({ go }) {
  const next = firstUnplayedLevel();

  const screen = el('div.screen.hub', {},
    el('div.hub__logo', { text: '🧠' }),
    el('h1.hub__title', { text: t('app.title') }),
    el('p.hub__sub', { text: t('app.subtitle') }),

    el('div.hub__stars', {}, '⭐ ', String(totalStars()),
      el('span', { style: { opacity: .7, fontWeight: 700, fontSize: '.75em' } },
        `  ·  ${completedCount()}/${TOTAL_LEVELS}`)),

    el('div.hub__actions', {},
      button(`▶ ${t('app.play')}`, () => go(`#/level/${next.id}`), { cls: 'hub__play' }),
      iconButton('🗺️', () => go('#/map'), t('app.back'), 'btn--ghost'),
      iconButton('⚙️', () => go('#/settings'), t('app.settings'), 'btn--ghost')));

  // Greet on arrival so a child who cannot read still knows what to do.
  setTimeout(() => speak(`${t('app.title')}. ${t('app.play')}!`), 500);
  return screen;
}
