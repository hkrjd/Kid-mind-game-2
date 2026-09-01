/* ============================================================
   jigsaw — "तस्वीर पूरी करो" / Finish the picture.

   The picture is one large emoji, and each piece is a window onto
   a different part of that same glyph. So the puzzle assembles
   into exactly the picture shown, with no artwork to ship.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, delay } from '../core/ui.js';
import { makeDraggable, springBack } from '../core/drag.js';
import { itemName } from '../core/i18n.js';
import { sfx, speak } from '../core/audio.js';

/** [columns, rows] */
const SPLIT_BY_TIER = [[2, 2], [3, 2], [3, 3]];

/** Assembled picture size: as big as the screen comfortably allows,
    leaving room for the tray of loose pieces beside it. */
function boardSize() {
  return Math.round(Math.max(240, Math.min(window.innerHeight * 0.62, window.innerWidth * 0.34)));
}

export default class JigsawGame extends GameEngine {
  static id = 'jigsaw';
  static skills = ['shapes'];

  build(field) {
    const [cols, rows] = SPLIT_BY_TIER[this.tier];
    this.item = this.rng.pick(this.pack.items);
    this.cols = cols;
    this.rows = rows;
    this.board = boardSize();

    const pw = this.board / cols;
    const ph = this.board / rows;
    this.remaining = cols * rows;
    this.selected = null;

    /* --- the board: empty slots in picture order --- */
    this.slots = [];
    const board = el('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${pw}px)`,
        gridAutoRows: `${ph}px`,
        gap: '3px',
        padding: '10px',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(255,255,255,.14)',
      },
    });

    for (let i = 0; i < cols * rows; i++) {
      const slot = el('div.slot', {
        style: { minWidth: 0, minHeight: 0, borderWidth: '4px', borderRadius: '10px' },
        onclick: () => this.tapSlot(slot),
      });
      slot._index = i;
      this.slots.push(slot);
      board.appendChild(slot);
    }

    /* --- the loose pieces --- */
    this.pieces = this.rng.shuffle(this.slots.map((s) => s._index)).map((index) => {
      const node = el('button', {
        type: 'button',
        'aria-label': `${itemName(this.item)} ${index + 1}`,
        style: {
          width: `${pw}px`, height: `${ph}px`,
          minWidth: 0, minHeight: 0,
          padding: 0, border: 'none',
          borderRadius: '10px',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer',
        },
        onclick: () => this.tapPiece(node),
      }, this.window(index, pw, ph));
      node._index = index;

      this.cleanup(makeDraggable(node, {
        targets: () => this.slots.filter((s) => !s._filled),
        radius: 90,
        onDrop: (slot, nd, moved) => {
          if (!moved) return;
          if (slot) this.place(nd, slot);
          else springBack(nd);
        },
      }));
      return node;
    });

    const tray = el('div', {
      style: {
        display: 'flex', flexWrap: 'wrap', gap: '8px',
        justifyContent: 'center', alignContent: 'center',
        maxWidth: `${this.board + 20}px`,
      },
    }, ...this.pieces);

    // A small reference so the child can see what they are building.
    const reference = el('div', {
      'aria-label': itemName(this.item),
      style: { fontSize: `${Math.round(this.board * 0.2)}px`, lineHeight: 1, opacity: '.9' },
    }, this.item.e);

    field.append(
      board,
      el('div', {
        style: {
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 'var(--gap)', minWidth: 0,
        },
      }, reference, tray),
    );
  }

  /**
   * One tile of the picture: a clipping window holding the whole
   * emoji, shifted so the requested cell shows through.
   */
  window(index, pw, ph) {
    const c = index % this.cols;
    const r = Math.floor(index / this.cols);
    return el('div', {
      style: {
        width: '100%', height: '100%',
        overflow: 'hidden', borderRadius: '10px',
        position: 'relative',
      },
    }, el('span', {
      style: {
        position: 'absolute',
        left: `${-c * pw}px`,
        top: `${-r * ph}px`,
        width: `${this.board}px`, height: `${this.board}px`,
        fontSize: `${this.board * 0.86}px`,
        lineHeight: `${this.board}px`,
        textAlign: 'center',
      },
    }, this.item.e));
  }

  /* ---------- placing ---------- */

  tapPiece(node) {
    if (node._placed || this.solved) return;
    this.selected?.classList.remove('tile--hint');
    this.selected = this.selected === node ? null : node;
    if (this.selected) { this.selected.classList.add('tile--hint'); sfx('pickup'); }
  }

  tapSlot(slot) {
    if (!this.selected || slot._filled || this.solved) return;
    const node = this.selected;
    this.selected = null;
    node.classList.remove('tile--hint');
    this.place(node, slot);
  }

  place(node, slot) {
    if (node._placed || slot._filled || this.solved) return;

    if (node._index !== slot._index) { this.wrong(node); return; }

    node._placed = true;
    slot._filled = true;
    slot.dataset.dropDisabled = 'true';
    node.dataset.dragDisabled = 'true';
    node.style.visibility = 'hidden';

    const pw = this.board / this.cols;
    const ph = this.board / this.rows;
    slot.replaceChildren(this.window(slot._index, pw, ph));
    slot.classList.add('slot--full');
    slot.style.background = 'transparent';
    sfx('match');

    if (--this.remaining === 0) {
      speak(itemName(this.item));
      this.after(650, () => this.win());
    }
  }

  hintTarget() {
    const piece = this.pieces.find((p) => !p._placed);
    const slot = this.slots.find((s) => s._index === piece?._index);
    return [piece, slot].filter(Boolean);
  }

  solveStep() {
    const piece = this.pieces.find((p) => !p._placed);
    const slot = this.slots.find((s) => s._index === piece?._index);
    if (piece && slot) this.place(piece, slot);
  }

  async autoSolve() {
    for (const piece of this.pieces) {
      if (this.destroyed || this.solved) return;
      if (piece._placed) continue;
      piece.click();
      await delay(12);
      this.slots.find((s) => s._index === piece._index)?.click();
      await delay(12);
    }
  }
}
