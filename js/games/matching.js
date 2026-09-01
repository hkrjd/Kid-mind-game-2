/* ============================================================
   matching — "जोड़ी मिलाओ" / Match what goes together.

   Not identical pairs but real-world relations a 5-year-old
   already knows: hen and chick, lock and key, rain and umbrella.
   Two columns, tap one on the left then its partner on the right.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, delay, fitGrid } from '../core/ui.js';
import { getLang } from '../core/i18n.js';
import { sfx, speak } from '../core/audio.js';

const PAIRS_BY_TIER = [3, 4, 5];

/** The pack here is a PAIR_SET, whose entries carry both halves. */
function nameOf(pair, side) {
  return getLang() === 'hi' ? pair[`${side}hi`] : pair[`${side}en`];
}

export default class MatchingGame extends GameEngine {
  static id = 'matching';
  static skills = ['logic'];

  build(field) {
    // Each side is one vertical column, so the pair count is limited
    // by how many tiles fit down the screen — five of them run off the
    // bottom of a 768px tablet.
    const fit = fitGrid(PAIRS_BY_TIER[this.tier], { forceCols: 1, widthFraction: 0.34 });
    this.pairs = this.rng.sample(this.pack.pairs, fit.count);
    this.tileSize = fit.tile;
    this.remaining = this.pairs.length;
    this.selected = null;

    const lefts = this.rng.shuffle(this.pairs);
    const rights = this.rng.shuffle(this.pairs);

    this.lefts = lefts.map((p) => {
      const node = tile(p.a, {
        label: nameOf(p, 'a'),
        aria: nameOf(p, 'a'),
        onClick: (_e, nd) => this.tapLeft(nd),
      });
      node.style.setProperty('--tile', `${this.tileSize}px`);
      node._pair = p;
      return node;
    });

    this.rights = rights.map((p) => {
      const node = tile(p.b, {
        label: nameOf(p, 'b'),
        aria: nameOf(p, 'b'),
        onClick: (_e, nd) => this.tapRight(nd),
      });
      node.style.setProperty('--tile', `${this.tileSize}px`);
      node._pair = p;
      return node;
    });

    field.append(
      el('div.answer-row', { style: { flexDirection: 'column' } }, ...this.lefts),
      el('div.big-emoji', { text: '↔️', style: { opacity: .7 } }),
      el('div.answer-row', { style: { flexDirection: 'column' } }, ...this.rights),
    );
  }

  tapLeft(node) {
    if (node._done || this.solved) return;
    this.selected?.classList.remove('tile--hint');
    this.selected = this.selected === node ? null : node;
    if (this.selected) {
      this.selected.classList.add('tile--hint');
      sfx('pickup');
      speak(nameOf(node._pair, 'a'));
    }
  }

  tapRight(node) {
    if (node._done || this.solved) return;
    if (!this.selected) { sfx('tap'); return; }

    const left = this.selected;
    if (left._pair === node._pair) {
      left.classList.remove('tile--hint');
      this.selected = null;
      left._done = node._done = true;
      left.classList.add('tile--ok');
      node.classList.add('tile--ok');
      left.disabled = node.disabled = true;
      sfx('match');
      speak(`${nameOf(node._pair, 'a')} — ${nameOf(node._pair, 'b')}`);
      if (--this.remaining === 0) this.after(650, () => this.win());
    } else {
      this.wrong(node);
    }
  }

  hintTarget() {
    const left = this.selected || this.lefts.find((n) => !n._done);
    const right = this.rights.find((n) => n._pair === left?._pair);
    return [left, right].filter(Boolean);
  }

  solveStep() {
    const left = this.lefts.find((n) => !n._done);
    const right = this.rights.find((n) => n._pair === left?._pair);
    if (!left || !right) return;
    this.selected?.classList.remove('tile--hint');
    this.selected = left;
    this.tapRight(right);
  }

  async autoSolve() {
    for (const left of this.lefts) {
      if (this.destroyed || this.solved) return;
      if (left._done) continue;
      left.click();
      await delay(15);
      this.rights.find((r) => r._pair === left._pair)?.click();
      await delay(15);
    }
  }
}
