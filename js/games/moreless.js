/* ============================================================
   moreless — "ज़्यादा किस तरफ़ है?" / Which side has more?

   Comparing quantities without counting them, which is how number
   sense actually develops. The gap narrows tier by tier, and the
   hardest tier sometimes flips the question to "fewer" so the
   child has to listen rather than always tapping the big pile.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, delay } from '../core/ui.js';
import { t, numWord, itemName } from '../core/i18n.js';
import { speak } from '../core/audio.js';

/** [min count, max count, smallest allowed gap] */
const RULES_BY_TIER = [
  [1, 6, 3],
  [2, 8, 2],
  [3, 9, 1],
];

export default class MoreLessGame extends GameEngine {
  static id = 'moreless';
  static skills = ['numbers'];

  build(field) {
    const [lo, hi, minGap] = RULES_BY_TIER[this.tier];
    this.askLess = this.tier === 2 && this.rng.chance(0.4);

    let a = this.rng.int(lo, hi);
    let b = this.rng.int(lo, hi);
    // Force a clear enough difference, and never a tie.
    let guard = 0;
    while (Math.abs(a - b) < minGap && guard++ < 40) b = this.rng.int(lo, hi);
    if (a === b) b = Math.min(hi, a + minGap);

    const item = this.rng.pick(this.pack.items);
    this.counts = [a, b];
    const target = this.askLess ? Math.min(a, b) : Math.max(a, b);
    this.winningSide = this.counts.indexOf(target);

    field.classList.add('field--wrap');

    this.sides = this.counts.map((count, i) => {
      const pile = el('div.count-strip', { style: { maxWidth: '100%' } });
      for (let k = 0; k < count; k++) {
        pile.appendChild(el('span.count-item', {
          style: { animationDelay: `${k * 50}ms` },
        }, item.e));
      }

      const side = el('button.tile.tile--flat', {
        type: 'button',
        'aria-label': `${numWord(count)} ${itemName(item)}`,
        style: { width: '40%', height: '54vh', padding: 'var(--gap)' },
        onclick: () => this.tap(i, side),
      }, pile);
      side._count = count;
      return side;
    });

    field.append(...this.sides);
  }

  prompt() {
    return this.askLess ? t('p.moreless.less') : t('p.moreless');
  }

  tap(i, node) {
    if (this.solved) return;
    if (i === this.winningSide) {
      this.correct(node, { praise: true });
      speak(numWord(node._count));
      this.after(750, () => this.win());
    } else {
      this.wrong(node);
    }
  }

  hintTarget() {
    return this.sides[this.winningSide];
  }

  solveStep() {
    this.hintTarget()?.click();
  }

  async autoSolve() {
    await delay(20);
    this.sides[this.winningSide]?.click();
  }
}
