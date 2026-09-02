/* ============================================================
   toy.js — a football in the empty part of the screen.

   Not part of any puzzle: tapping it just kicks it, and that is
   never counted as a mistake. It lives only where there is genuinely
   room — it measures the play field and hides itself if every corner
   is taken — so it can never sit on top of a card or a button.

   Gullu plays too. Every so often, if the child leaves the ball
   alone, it bounces as though he kicked it and he hops with delight;
   and when the child kicks it, he cheers. A game the two of them
   share in the margins, while the real puzzle waits in the middle.
   ============================================================ */

import { el } from './ui.js';
import { sfx } from './audio.js';
import { getSetting } from './state.js';

/** Things the ball must never overlap. */
const OCCUPIED = '.tile, .btn, .bin, .slot, .count-item, canvas, .grid, .answer-row, .count-strip, .big-emoji';

/**
 * Put a football in the field.
 *
 *   field   the engine's play field (position: relative)
 *   after   the engine's cancellable timer, so nothing outlives the level
 *   onKick  called whenever the ball is kicked, by child or by Gullu
 *
 * Returns a teardown.
 */
export function createFootball({ field, after, onKick }) {
  const ball = el('button.toy-ball', {
    type: 'button',
    'aria-label': 'football',
    onclick: () => kick(true),
  }, '⚽');
  field.appendChild(ball);

  let kicking = false;
  let quietTimer = null;

  function kick(byChild) {
    if (kicking || ball.hidden) return;
    kicking = true;
    ball.classList.remove('toy-ball--kick');
    void ball.offsetWidth;                    // restart the animation
    ball.classList.add('toy-ball--kick');
    sfx('kick');
    onKick?.(byChild);
    after(950, () => { ball.classList.remove('toy-ball--kick'); kicking = false; });
    scheduleGullu();
  }

  /* Gullu's turn: a kick of his own after the ball sits untouched. */
  function scheduleGullu() {
    clearTimeout(quietTimer);
    if (!getSetting('motion')) return;
    quietTimer = after(9000 + Math.random() * 5000, () => kick(false));
  }

  /* ---------- placement: only where nothing else is ---------- */

  function overlapsAnything(r) {
    for (const n of field.querySelectorAll(OCCUPIED)) {
      if (n === ball) continue;
      const b = n.getBoundingClientRect();
      if (b.width === 0 && b.height === 0) continue;
      const ox = Math.min(r.right, b.right) - Math.max(r.left, b.left);
      const oy = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
      if (ox > 4 && oy > 4) return true;
    }
    return false;
  }

  const CORNERS = [
    { left: '2%',  bottom: '2%' },
    { right: '2%', bottom: '2%' },
    { right: '2%', top: '2%' },
    { left: '2%',  top: '2%' },
  ];

  function place() {
    for (const c of CORNERS) {
      ball.hidden = false;
      ball.style.left = ball.style.right = ball.style.top = ball.style.bottom = '';
      Object.assign(ball.style, c);
      const r = ball.getBoundingClientRect();
      const inside = r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
      if (inside && !overlapsAnything(r)) return;
    }
    ball.hidden = true;                       // no room: better absent than in the way
  }

  const ro = new ResizeObserver(() => place());
  ro.observe(field);
  requestAnimationFrame(place);
  scheduleGullu();

  return () => {
    ro.disconnect();
    clearTimeout(quietTimer);
    ball.remove();
  };
}
