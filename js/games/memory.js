/* ============================================================
   memory — "जोड़ी मिलाओ" / Find the matching pair.

   Classic concentration. Three pairs at the easiest tier, which
   is genuinely achievable for a 5-year-old; twelve cards at the
   hardest, which is about the ceiling for this age.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { grid, fitGrid, delay } from '../core/ui.js';
import { el } from '../core/ui.js';
import { sfx, speak } from '../core/audio.js';
import { itemName } from '../core/i18n.js';

const PAIRS_BY_TIER = [3, 4, 6];

export default class MemoryGame extends GameEngine {
  static id = 'memory';
  static skills = ['memory'];

  build(field) {
    // Cards come in pairs, so fit the deck and then round down to a
    // whole number of pairs.
    const wanted = PAIRS_BY_TIER[this.tier] * 2;
    const pairs = Math.max(2, Math.floor(fitGrid(wanted).count / 2));
    const fit = fitGrid(pairs * 2);
    const items = this.rng.sample(this.pack.items, pairs);
    const deck = this.rng.shuffle([...items, ...items]);

    this.total = pairs;
    this.matched = 0;
    this.flipped = [];
    this.busy = false;

    this.cards = deck.map((item) => {
      const card = el('button.tile.card-back', {
        type: 'button',
        'aria-label': '?',
        onclick: () => this.tap(card),
      }, '❓');
      card._item = item;
      card._up = false;
      return card;
    });

    field.appendChild(grid(fit, ...this.cards));
  }

  face(card, up) {
    card._up = up;
    card.textContent = up ? card._item.e : '❓';
    card.classList.toggle('card-back', !up);
    card.setAttribute('aria-label', up ? itemName(card._item) : '?');
  }

  async tap(card) {
    if (this.busy || card._up || card._done || this.solved) return;

    this.face(card, true);
    sfx('flip');
    this.flipped.push(card);
    if (this.flipped.length < 2) return;

    this.busy = true;
    const [a, b] = this.flipped;
    this.flipped = [];

    if (a._item.e === b._item.e) {
      a._done = b._done = true;
      this.matched++;
      sfx('match');
      speak(itemName(a._item));
      a.classList.add('tile--ok');
      b.classList.add('tile--ok');
      this.busy = false;
      if (this.matched === this.total) this.after(500, () => this.win());
    } else {
      // Hold the mismatch on screen long enough to actually be seen
      // and remembered — this is the whole point of the game.
      this.wrong(b);
      if (!(await this.wait(1100))) return;
      this.face(a, false);
      this.face(b, false);
      this.busy = false;
    }
  }

  /** Pulse the partner of a card that is already face up. */
  hintTarget() {
    const up = this.flipped[0];
    const pool = this.cards.filter((c) => !c._done && c !== up);
    if (up) return pool.filter((c) => c._item.e === up._item.e);
    // Nothing revealed yet — pulse any one full pair.
    const first = pool[0];
    return first ? pool.filter((c) => c._item.e === first._item.e) : null;
  }

  /** Turn one pair face up permanently and count it. */
  solveStep() {
    const pool = this.cards.filter((c) => !c._done);
    if (!pool.length) return;
    const target = this.flipped[0] || pool[0];
    const pair = pool.filter((c) => c._item.e === target._item.e).slice(0, 2);
    this.flipped = [];
    pair.forEach((c) => {
      this.face(c, true);
      c._done = true;
      c.classList.add('tile--ok');
    });
    this.matched++;
    sfx('match');
    if (this.matched === this.total) this.after(600, () => this.win());
  }

  async autoSolve() {
    // Play it the way a child would: click, wait for the flip-back
    // animation, click again. This exercises the real tap path.
    const seen = new Set();
    for (const card of this.cards) {
      if (this.destroyed || this.solved) return;
      if (card._done || seen.has(card)) continue;
      const partner = this.cards.find((c) => c !== card && !c._done && c._item.e === card._item.e);
      if (!partner) continue;
      seen.add(card);
      seen.add(partner);
      card.click();
      await delay(20);
      partner.click();
      await delay(40);
    }
  }
}
