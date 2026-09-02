/* ============================================================
   hub.js — the title screen.

   One giant Play button that opens the list of game categories.
   Sending the child straight into the next level skipped that list
   entirely, and a parent looking for "what games are in here?"
   could not find it behind a small map icon.
   ============================================================ */

import { el, button, iconButton } from '../core/ui.js';
import { t } from '../core/i18n.js';
import { totalStars, completedCount } from '../core/state.js';
import { TOTAL_LEVELS } from '../core/catalog.js';
import { speak } from '../core/audio.js';
import { createScene } from '../core/scene.js';
import { createMascot, setMood } from '../core/mascot.js';

export function hubScreen({ go }) {
  const gullu = createMascot({ size: 150 });
  gullu.classList.add('hub__mascot');

  const screen = el('div.screen.hub.screen--scened', {},
    createScene(),
    el('div.hub__logo', {}, gullu),
    el('h1.hub__title', { text: t('app.title') }),
    el('p.hub__sub', { text: t('app.subtitle') }),

    el('div.hub__stars', {}, '⭐ ', String(totalStars()),
      el('span', { style: { opacity: .7, fontWeight: 700, fontSize: '.75em' } },
        `  ·  ${completedCount()}/${TOTAL_LEVELS}`)),

    el('div.hub__actions', {},
      button(`▶ ${t('app.play')}`, () => go('#/map'), { cls: 'hub__play' }),
      iconButton('⚙️', () => go('#/settings'), t('app.settings'), 'btn--ghost')));

  // Greet on arrival so a child who cannot read still knows what to do,
  // with a wave from Gullu to go with it.
  setTimeout(() => {
    setMood(gullu, 'happy');
    setTimeout(() => setMood(gullu, 'idle'), 1800);
    speak(`${t('app.title')}. ${t('app.play')}!`);
  }, 500);
  return screen;
}
