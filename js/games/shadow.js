/* ============================================================
   shadow — "परछाई किसकी है?" / Whose shadow is this?

   The silhouette is the same emoji rendered with brightness(0),
   so it is a genuine shadow of the exact glyph the child will
   match it to — no separate artwork, and always a perfect fit.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, grid, fitGrid, delay } from '../core/ui.js';
import { itemName } from '../core/i18n.js';
import { speak } from '../core/audio.js';

const CHOICES_BY_TIER = [3, 4, 6];

export default class ShadowGame extends GameEngine {
  static id = 'shadow';
  static skills = ['attention'];

  build(field) {
    // The silhouette sits above the choices and needs its own room.
    const fit = fitGrid(CHOICES_BY_TIER[this.tier], { reserveY: 170 });
    const items = this.rng.sample(this.pack.items, fit.count);
    this.answer = this.rng.pick(items);

    field.classList.add('field--col');

    const shadow = el('div.big-emoji', {
      'aria-label': 'shadow',
      style: {
        filter: 'brightness(0)',
        opacity: '.82',
        // A slight squash reads as a shadow cast on the ground
        // rather than a black copy of the picture.
        transform: 'scaleY(.94)',
      },
    }, this.answer.e);

    this.tiles = items.map((item) => {
      const node = tile(item.e, {
        label: itemName(item),
        aria: itemName(item),
        onClick: (_e, nd) => this.tap(nd),
      });
      node._item = item;
      return node;
    });

    field.append(shadow, grid(fit, ...this.tiles));
  }

  tap(node) {
    if (this.solved) return;
    if (node._item === this.answer) {
      this.correct(node, { praise: true });
      speak(itemName(this.answer));
      this.after(700, () => this.win());
    } else {
      this.wrong(node);
    }
  }

  hintTarget() {
    return this.tiles.find((n) => n._item === this.answer);
  }

  solveStep() { this.hintTarget()?.click(); }

  async autoSolve() {
    await delay(20);
    this.hintTarget()?.click();
  }
}
