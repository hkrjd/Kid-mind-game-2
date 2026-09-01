/* ============================================================
   settings.js — grown-up controls, behind the parent gate.

   Reached only after a three-second hold, so a child tapping
   randomly cannot change the language or wipe their own stars.
   ============================================================ */

import { el, topBar, button, parentGate } from '../core/ui.js';
import { t, getLang } from '../core/i18n.js';
import { getSetting, setSetting, resetProgress, totalStars, completedCount } from '../core/state.js';
import { TOTAL_LEVELS } from '../core/catalog.js';
import { sfx } from '../core/audio.js';

/** A two-or-more-option segmented control. */
function segmented(options, current, onPick) {
  const seg = el('div.seg');
  options.forEach((o) => {
    const b = button(o.label, () => { onPick(o.value); }, {});
    b.setAttribute('aria-pressed', String(o.value === current));
    seg.appendChild(b);
  });
  return seg;
}

function row(label, hint, control) {
  return el('div.setting', {},
    el('div.setting__label', {}, label, hint ? el('span.setting__hint', { text: hint }) : null),
    control);
}

function onOff(key, rerender) {
  return segmented(
    [{ label: t('set.on'), value: true }, { label: t('set.off'), value: false }],
    getSetting(key),
    (v) => { setSetting(key, v); rerender(); },
  );
}

export function settingsScreen({ go }) {
  const screen = el('div.screen.map');

  function draw() {
    const body = el('div.settings__body', {},
      row(t('set.lang'), null, segmented(
        [{ label: 'हिन्दी', value: 'hi' }, { label: 'English', value: 'en' }],
        getLang(),
        (v) => { setSetting('lang', v); draw(); },
      )),

      row(t('set.sound'), null, onOff('sound', draw)),
      row(t('set.voice'), null, onOff('voice', draw)),
      row(t('set.motion'), null, onOff('motion', draw)),

      row(t('set.progress'),
        t('set.progress.val', { done: completedCount(), total: TOTAL_LEVELS, stars: totalStars() }),
        button('🗑️', () => confirmReset(), { cls: 'btn--danger', aria: t('set.reset') })));

    screen.replaceChildren(topBar(t('set.title'), () => go('#/')), body);
  }

  /** Wiping every star deserves a second, explicit yes. */
  function confirmReset() {
    const box = el('div.gate', {},
      el('h2.gate__title', { text: t('set.reset.confirm') }),
      el('div.reward__actions', {},
        button(t('set.reset.no'), () => box.remove(), { cls: 'btn--ghost', big: true }),
        button(t('set.reset.yes'), () => {
          resetProgress();
          sfx('oops');
          box.remove();
          draw();
        }, { cls: 'btn--danger', big: true })));
    document.body.appendChild(box);
  }

  // Show a placeholder until the grown-up passes the gate.
  screen.replaceChildren(topBar(t('set.title'), () => go('#/')));
  parentGate().then((ok) => (ok ? draw() : go('#/')));

  return screen;
}
