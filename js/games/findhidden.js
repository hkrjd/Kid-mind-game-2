/* ============================================================
   findhidden — "ये कहाँ छुपा है?" / Where is it hiding?

   Visual search among distractors. Trains the sustained scanning
   a child needs before they can pick a letter out of a word.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, grid, fitGrid, delay } from '../core/ui.js';
import { itemName, t } from '../core/i18n.js';
import { speak } from '../core/audio.js';

const COUNT_BY_TIER = [6, 12, 20];

export default class FindHiddenGame extends GameEngine {
  static id = 'findhidden';
  static skills = ['attention'];

  build(field) {
    // Ask for the tier's count, but take only what fits this screen:
    // a tile pushed off the bottom edge is one a child cannot tap.
    // The target picture sits above the grid and needs its own room.
    const fit = fitGrid(COUNT_BY_TIER[this.tier], { reserveY: 170 });
    const n = fit.count;
    const [target, ...rest] = this.rng.sample(this.pack.items, Math.min(this.pack.items.length, 4));
    this.target = target;

    // One target hidden among repeated distractors. At the hardest
    // tier the distractors are few and similar, so the target does
    // not pop out by novelty.
    const distractorPool = rest.length ? rest : [this.rng.pick(this.pack.items)];
    const cells = Array.from({ length: n - 1 }, (_, i) => distractorPool[i % distractorPool.length]);
    const all = this.rng.shuffle([target, ...cells]);

    field.classList.add('field--col');

    /* --- what to look for --- */
    const wanted = el('div.answer-row', {},
      el('div.big-emoji', { text: target.e }));

    this.tiles = all.map((item) => {
      const node = tile(item.e, {
        aria: itemName(item),
        cls: 'tile--flat',
        onClick: (_e, nd) => this.tap(nd),
      });
      node._item = item;
      return node;
    });

    field.append(wanted, grid(fit, ...this.tiles));
  }

  prompt() {
    return `${t('p.findhidden')} ${itemName(this.target)}`;
  }

  tap(node) {
    if (this.solved) return;
    if (node._item === this.target) {
      this.correct(node, { praise: true });
      speak(itemName(this.target));
      this.after(650, () => this.win());
    } else {
      this.wrong(node);
    }
  }

  hintTarget() {
    return this.tiles.find((n) => n._item === this.target);
  }

  solveStep() {
    this.hintTarget()?.click();
  }

  async autoSolve() {
    await delay(20);
    this.hintTarget()?.click();
  }
}
