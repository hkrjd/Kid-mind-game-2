/* ============================================================
   shapefit — "आकार को सही जगह पर रखो" / Fit the shape.

   The classic posting-box toy. Each hole is the silhouette of the
   exact shape that belongs in it, so the match is unambiguous
   even before a child has the words for "circle" or "square".
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, delay } from '../core/ui.js';
import { makeDraggable, springBack } from '../core/drag.js';
import { itemName } from '../core/i18n.js';
import { sfx, speak } from '../core/audio.js';

const COUNT_BY_TIER = [2, 3, 4];

export default class ShapeFitGame extends GameEngine {
  static id = 'shapefit';
  static skills = ['shapes'];

  build(field) {
    const n = COUNT_BY_TIER[this.tier];

    // Tier 0 uses one shape family in different colours (easy: match
    // by colour). Higher tiers mix families so shape matters too.
    const pool = this.tier === 0
      ? this.pack.items.filter((i) => i.sh === this.rng.pick([...new Set(this.pack.items.map((x) => x.sh))]))
      : this.pack.items;

    const chosen = this.rng.sample(pool, n);
    this.remaining = n;
    this.selected = null;

    field.classList.add('field--col');

    /* --- the holes --- */
    this.holes = this.rng.shuffle(chosen).map((item) => {
      const hole = el('div.slot', {
        'aria-label': itemName(item),
        onclick: () => this.tapHole(hole),
      }, el('span', { style: { filter: 'brightness(0)', opacity: '.55' } }, item.e));
      hole._item = item;
      return hole;
    });

    /* --- the pieces --- */
    this.pieces = this.rng.shuffle(chosen).map((item) => {
      const node = tile(item.e, {
        aria: itemName(item),
        onClick: (_e, nd) => this.tapPiece(nd),
      });
      node._item = item;
      this.cleanup(makeDraggable(node, {
        targets: () => this.holes.filter((h) => !h._filled),
        onDrop: (hole, nd, moved) => {
          if (!moved) return;
          if (hole) this.place(nd, hole);
          else springBack(nd);
        },
      }));
      return node;
    });

    field.append(
      el('div.answer-row', {}, ...this.holes),
      el('div.answer-row', {}, ...this.pieces),
    );
  }

  tapPiece(node) {
    if (node._placed || this.solved) return;
    this.selected?.classList.remove('tile--hint');
    this.selected = this.selected === node ? null : node;
    if (this.selected) {
      this.selected.classList.add('tile--hint');
      sfx('pickup');
      speak(itemName(node._item));
    }
  }

  tapHole(hole) {
    if (!this.selected || hole._filled || this.solved) return;
    const node = this.selected;
    this.selected = null;
    node.classList.remove('tile--hint');
    this.place(node, hole);
  }

  place(node, hole) {
    if (node._placed || hole._filled || this.solved) return;

    if (node._item !== hole._item) {
      this.wrong(node);
      return;
    }

    node._placed = true;
    hole._filled = true;
    hole.dataset.dropDisabled = 'true';
    node.dataset.dragDisabled = 'true';
    node.classList.add('tile--gone');
    hole.replaceChildren(node._item.e);
    hole.classList.add('slot--full');
    sfx('match');

    if (--this.remaining === 0) this.after(600, () => this.win());
  }

  hintTarget() {
    const piece = this.pieces.find((p) => !p._placed);
    const hole = this.holes.find((h) => h._item === piece?._item);
    return [piece, hole].filter(Boolean);
  }

  solveStep() {
    const piece = this.pieces.find((p) => !p._placed);
    const hole = this.holes.find((h) => h._item === piece?._item);
    if (piece && hole) this.place(piece, hole);
  }

  async autoSolve() {
    for (const piece of this.pieces) {
      if (this.destroyed || this.solved) return;
      if (piece._placed) continue;
      piece.click();
      await delay(15);
      this.holes.find((h) => h._item === piece._item && !h._filled)?.click();
      await delay(15);
    }
  }
}
