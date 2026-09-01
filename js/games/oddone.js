/* ============================================================
   oddone — "अलग कौन सा है?" / Which one is different?

   The odd item is obvious at first (a fruit among animals) and
   subtle later (the one square among circles of the same colour),
   which is a real step up in abstraction for this age.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { grid, bestCols, tile, delay } from '../core/ui.js';
import { getPack, GENERIC_PACK_IDS } from '../content/packs.js';
import { itemName } from '../core/i18n.js';
import { speak } from '../core/audio.js';

const COUNT_BY_TIER = [3, 4, 6];

export default class OddOneGame extends GameEngine {
  static id = 'oddone';
  static skills = ['logic'];

  build(field) {
    const n = COUNT_BY_TIER[this.tier];
    const { same, odd } = this.pickSet(n);

    this.oddItem = odd;
    const all = this.rng.shuffle([...same, odd]);

    this.tiles = all.map((item) => tile(item.e, {
      label: itemName(item),
      aria: itemName(item),
      onClick: (_e, node) => this.tap(node),
    }));
    this.tiles.forEach((node, i) => { node._item = all[i]; });

    field.appendChild(grid(bestCols(all.length), ...this.tiles));
  }

  /**
   * Tier 0-1: the odd one comes from a different pack entirely.
   * Tier 2: everything comes from one pack and only a single
   * attribute (colour, or shape) differs — much harder.
   */
  pickSet(n) {
    const items = this.pack.items;

    if (this.tier < 2) {
      const otherId = this.rng.pick(GENERIC_PACK_IDS.filter((p) => p !== this.pack.id));
      const other = getPack(otherId);
      return { same: this.rng.sample(items, n - 1), odd: this.rng.pick(other.items) };
    }

    // Group by colour and look for a group big enough to fill the
    // board, leaving an outsider of a different colour.
    const byColor = {};
    items.forEach((it) => (byColor[it.c] ??= []).push(it));
    const big = Object.entries(byColor)
      .filter(([, list]) => list.length >= n - 1)
      .map(([c]) => c);

    if (big.length) {
      const color = this.rng.pick(big);
      const odd = this.rng.pick(items.filter((it) => it.c !== color));
      if (odd) return { same: this.rng.sample(byColor[color], n - 1), odd };
    }

    // Fallback for a pack with no large colour group: repeat one
    // item and make a single different item the odd one out.
    const [a, b] = this.rng.sample(items, 2);
    return { same: Array.from({ length: n - 1 }, () => a), odd: b };
  }

  tap(node) {
    if (this.solved) return;
    if (node._item === this.oddItem) {
      this.correct(node, { praise: true });
      speak(itemName(this.oddItem));
      this.after(700, () => this.win());
    } else {
      this.wrong(node);
    }
  }

  hintTarget() {
    return this.tiles.find((n) => n._item === this.oddItem);
  }

  solveStep() {
    const node = this.hintTarget();
    if (node) { this.correct(node); this.after(600, () => this.win()); }
  }

  async autoSolve() {
    await delay(20);
    this.hintTarget()?.click();
  }
}
