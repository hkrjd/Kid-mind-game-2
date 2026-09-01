/* ============================================================
   oddone — "अलग कौन सा है?" / Which one is different?

   The odd item is obvious at first (a fruit among animals) and
   subtle later (the one square among circles of the same colour),
   which is a real step up in abstraction for this age.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { grid, fitGrid, tile, delay } from '../core/ui.js';
import { getPack, GENERIC_PACK_IDS } from '../content/packs.js';
import { itemName } from '../core/i18n.js';
import { speak } from '../core/audio.js';

const COUNT_BY_TIER = [3, 4, 6];

export default class OddOneGame extends GameEngine {
  static id = 'oddone';
  static skills = ['logic'];

  build(field) {
    const fit = fitGrid(COUNT_BY_TIER[this.tier]);
    const { same, odd } = this.pickSet(fit.count);

    this.oddItem = odd;
    const all = this.rng.shuffle([...same, odd]);

    this.tiles = all.map((item) => tile(item.e, {
      label: itemName(item),
      aria: itemName(item),
      onClick: (_e, node) => this.tap(node),
    }));
    this.tiles.forEach((node, i) => { node._item = all[i]; });

    field.appendChild(grid(fit, ...this.tiles));
  }

  /**
   * Tier 0-1: the odd one comes from a different pack entirely — a kite
   * among fruit. Obvious, which is the point at these tiers.
   *
   * Tier 2: five DIFFERENT things that happen to share a colour, plus
   * one of another colour. That is a real step up, because the child
   * has to notice the property rather than the picture.
   */
  pickSet(n) {
    if (this.tier < 2) {
      const otherId = this.rng.pick(GENERIC_PACK_IDS.filter((p) => p !== this.pack.id));
      const other = getPack(otherId);
      return {
        same: this.rng.sample(this.pack.items, n - 1),
        odd: this.rng.pick(other.items),
      };
    }

    // Pool every generic pack: no single pack has enough items of one
    // colour, and drawing from just one used to fall back to showing the
    // same picture five times — which made the hardest tier the easiest.
    const pool = GENERIC_PACK_IDS.flatMap((id) => getPack(id).items);
    const byColor = {};
    for (const it of pool) (byColor[it.c] ??= []).push(it);

    const usable = Object.entries(byColor)
      .filter(([, list]) => new Set(list.map((i) => i.e)).size >= n - 1)
      .map(([c]) => c);

    const color = this.rng.pick(usable);
    // Distinct pictures, so the puzzle is about colour, not repetition.
    const seen = new Set();
    const family = this.rng.shuffle(byColor[color]).filter((it) => {
      if (seen.has(it.e)) return false;
      seen.add(it.e);
      return true;
    });

    const same = family.slice(0, n - 1);
    const odd = this.rng.pick(pool.filter((it) => it.c !== color && !seen.has(it.e)));
    return { same, odd };
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
