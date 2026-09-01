/* ============================================================
   ordering — "छोटे से बड़े के क्रम में लगाओ" / Smallest to biggest.

   Seriation: tap items in order, smallest first. Each correct tap
   flies into the next slot, which makes the ordering visible as
   it is built rather than only at the end.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, delay } from '../core/ui.js';
import { itemName, t } from '../core/i18n.js';
import { sfx, speak } from '../core/audio.js';

const COUNT_BY_TIER = [3, 4, 5];

export default class OrderingGame extends GameEngine {
  static id = 'ordering';
  static skills = ['logic'];

  build(field) {
    const n = COUNT_BY_TIER[this.tier];
    const item = this.rng.pick(this.pack.items);

    // Order by rendered size rather than by the pack's real-world
    // size hint: a child can see "bigger on screen" directly, and
    // it works for every pack.
    this.sizes = Array.from({ length: n }, (_, i) => 0.42 + (i * 0.58) / (n - 1));
    this.nextIndex = 0;

    field.classList.add('field--col');

    /* --- slots that fill left to right --- */
    this.slots = this.sizes.map(() => el('div.slot', {}, ''));

    /* --- the shuffled items --- */
    const order = this.rng.shuffle(this.sizes.map((_, i) => i));
    this.tiles = order.map((rank) => {
      const node = tile(
        el('span', { style: { fontSize: `${(this.sizes[rank] * 100).toFixed(0)}%`, lineHeight: 1 } }, item.e),
        { aria: `${itemName(item)} ${rank + 1}`, onClick: (_e, nd) => this.tap(nd) },
      );
      node._rank = rank;
      node._emoji = item.e;
      return node;
    });

    field.append(
      el('div.answer-row', {}, ...this.slots),
      el('div.answer-row', {}, ...this.tiles),
    );
  }

  prompt() {
    return t('p.ordering');
  }

  tap(node) {
    if (node._placed || this.solved) return;

    if (node._rank !== this.nextIndex) { this.wrong(node); return; }

    node._placed = true;
    node.classList.add('tile--gone');
    const slot = this.slots[this.nextIndex];
    slot.replaceChildren(el('span', {
      style: { fontSize: `${(this.sizes[node._rank] * 100).toFixed(0)}%`, lineHeight: 1 },
    }, node._emoji));
    slot.classList.add('slot--full');
    sfx('match');
    speak(this.nextIndex === 0 ? t('z.small') : (this.nextIndex === this.sizes.length - 1 ? t('z.big') : ''));

    if (++this.nextIndex === this.sizes.length) this.after(600, () => this.win());
  }

  hintTarget() {
    return this.tiles.find((n) => !n._placed && n._rank === this.nextIndex);
  }

  solveStep() {
    this.hintTarget()?.click();
  }

  async autoSolve() {
    while (!this.solved && !this.destroyed && this.nextIndex < this.sizes.length) {
      const node = this.tiles.find((n) => !n._placed && n._rank === this.nextIndex);
      if (!node) break;
      node.click();
      await delay(15);
    }
  }
}
