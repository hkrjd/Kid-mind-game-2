/* ============================================================
   numberline — "नंबरों को क्रम में लगाओ" / Numbers in order.

   Tap the numbers from smallest to biggest. The hardest tier uses
   a run that does not start at one and has gaps, so the child has
   to compare rather than recite the counting song.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, delay } from '../core/ui.js';
import { NUMBERS } from '../content/packs.js';
import { numWord } from '../core/i18n.js';
import { sfx, speak } from '../core/audio.js';

const COUNT_BY_TIER = [3, 4, 5];

export default class NumberLineGame extends GameEngine {
  static id = 'numberline';
  static skills = ['numbers'];

  build(field) {
    const n = COUNT_BY_TIER[this.tier];

    if (this.tier < 2) {
      // A consecutive run starting at 1 or 2.
      const start = this.rng.int(1, Math.max(1, 10 - n + 1 - (this.tier === 0 ? 6 : 3)));
      this.wanted = Array.from({ length: n }, (_, i) => start + i);
    } else {
      // Any n distinct values from 1-10, so gaps are the norm.
      this.wanted = this.rng.sample(Array.from({ length: 10 }, (_, i) => i + 1), n)
        .sort((a, b) => a - b);
    }

    this.nextIndex = 0;

    field.classList.add('field--col');

    this.slots = this.wanted.map(() => el('div.slot', {}, ''));

    this.tiles = this.rng.shuffle(this.wanted).map((v) => {
      const node = tile(NUMBERS[v].e, {
        label: numWord(v),
        aria: numWord(v),
        onClick: (_e, nd) => this.tap(nd),
      });
      node._value = v;
      return node;
    });

    field.append(
      el('div.answer-row', {}, ...this.slots),
      el('div.answer-row', {}, ...this.tiles),
    );
  }

  tap(node) {
    if (node._placed || this.solved) return;

    if (node._value !== this.wanted[this.nextIndex]) { this.wrong(node); return; }

    node._placed = true;
    node.classList.add('tile--gone');
    const slot = this.slots[this.nextIndex];
    slot.textContent = NUMBERS[node._value].e;
    slot.classList.add('slot--full');
    sfx('count', this.nextIndex);
    speak(numWord(node._value));

    if (++this.nextIndex === this.wanted.length) this.after(650, () => this.win());
  }

  hintTarget() {
    return this.tiles.find((n) => !n._placed && n._value === this.wanted[this.nextIndex]);
  }

  solveStep() {
    this.hintTarget()?.click();
  }

  async autoSolve() {
    while (!this.solved && !this.destroyed && this.nextIndex < this.wanted.length) {
      const node = this.hintTarget();
      if (!node) break;
      node.click();
      await delay(15);
    }
  }
}
