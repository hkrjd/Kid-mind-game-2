/* ============================================================
   spotdiff — "फ़र्क़ ढूँढो" / Find what is different.

   Two panels of the same picture with a few cells swapped. Tapping
   either copy of a changed cell counts it, because a child who has
   spotted the difference should not also have to guess which side
   we wanted.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, delay } from '../core/ui.js';
import { itemName, t } from '../core/i18n.js';
import { sfx, speak } from '../core/audio.js';

/** [columns, rows, how many cells differ] */
const SETUP_BY_TIER = [
  [2, 2, 1],
  [3, 2, 2],
  [3, 3, 3],
];

export default class SpotDiffGame extends GameEngine {
  static id = 'spotdiff';
  static skills = ['attention'];

  build(field) {
    const [cols, rows, diffs] = SETUP_BY_TIER[this.tier];
    const cells = cols * rows;

    const items = this.rng.sample(this.pack.items, Math.min(this.pack.items.length, cells + diffs + 2));
    const base = Array.from({ length: cells }, (_, i) => items[i % items.length]);

    // Choose which cells differ, and swap in an item that is not
    // already sitting in that position.
    const changed = this.rng.sample(Array.from({ length: cells }, (_, i) => i), diffs);
    const right = base.slice();
    for (const idx of changed) {
      const alt = items.find((it) => it !== base[idx] && !right.includes(it))
                || items.find((it) => it !== base[idx]);
      right[idx] = alt;
    }

    this.changed = new Set(changed);
    this.found = new Set();
    this.totalDiffs = changed.length;

    this.left = this.panel(base, cols, rows, 'L');
    this.right = this.panel(right, cols, rows, 'R');

    field.append(this.left.node, el('div.big-emoji', { text: '🔎', style: { opacity: .8 } }), this.right.node);
  }

  /** One side. --tile is set inline because the default sizing
      assumes a full-width grid, and here two grids share the row. */
  panel(items, cols, rows, side) {
    const tiles = items.map((item, i) => {
      const node = tile(item.e, {
        aria: itemName(item),
        cls: 'tile--flat',
        onClick: (_e, nd) => this.tap(i, nd),
      });
      node._index = i;
      node._side = side;
      return node;
    });

    const node = el('div.grid', {
      style: {
        '--cols': String(cols),
        '--rows': String(rows),
        '--tile': `min(calc(40vw / ${cols}), calc(58vh / ${rows}), 150px)`,
      },
    }, ...tiles);

    return { node, tiles };
  }

  prompt() {
    return `${t('p.spotdiff')} (${this.totalDiffs})`;
  }

  tap(index, node) {
    if (this.solved) return;

    if (!this.changed.has(index)) { this.wrong(node); return; }
    if (this.found.has(index)) { sfx('tap'); return; }

    this.found.add(index);
    // Light up the pair, so the child sees both halves of the find.
    for (const t of [this.left.tiles[index], this.right.tiles[index]]) {
      t.classList.add('tile--ok');
      t.classList.remove('tile--hint');
    }
    sfx('match');
    speak(itemName(node._item ?? {}) || '');

    if (this.found.size === this.totalDiffs) this.after(650, () => this.win());
  }

  hintTarget() {
    const next = [...this.changed].find((i) => !this.found.has(i));
    return next == null ? null : [this.left.tiles[next], this.right.tiles[next]];
  }

  solveStep() {
    const next = [...this.changed].find((i) => !this.found.has(i));
    if (next != null) this.tap(next, this.left.tiles[next]);
  }

  async autoSolve() {
    for (const i of this.changed) {
      if (this.destroyed || this.solved) return;
      this.left.tiles[i].click();
      await delay(20);
    }
  }
}
