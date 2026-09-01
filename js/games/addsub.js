/* ============================================================
   addsub — "कुल कितने हुए?" / "कितने बचे?"
            How many altogether / how many are left.

   Arithmetic kept entirely concrete: real things to count, and
   for subtraction the things that left are still shown, faded,
   so a child can see what "taking away" did.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, delay } from '../core/ui.js';
import { NUMBERS } from '../content/packs.js';
import { numWord, t } from '../core/i18n.js';
import { speak } from '../core/audio.js';

/** [largest total, may subtract] */
const RULES_BY_TIER = [
  [3, false],
  [5, false],
  [10, true],
];

export default class AddSubGame extends GameEngine {
  static id = 'addsub';
  static skills = ['numbers'];

  build(field) {
    const [max, allowSub] = RULES_BY_TIER[this.tier];
    this.isSub = allowSub && this.rng.chance(0.45);
    this.item = this.rng.pick(this.pack.items);

    if (this.isSub) {
      const total = this.rng.int(3, max);
      const taken = this.rng.int(1, total - 1);
      this.a = total;
      this.b = taken;
      this.answer = total - taken;
    } else {
      this.a = this.rng.int(1, max - 1);
      this.b = this.rng.int(1, max - this.a);
      this.answer = this.a + this.b;
    }

    field.classList.add('field--col');

    field.append(this.buildSum(), this.buildChoices(max));
  }

  /** The sum, laid out as things rather than digits. */
  buildSum() {
    const row = el('div.answer-row', { style: { alignItems: 'center' } });

    if (this.isSub) {
      // All the things, with the taken ones crossed out in place.
      const pile = el('div.count-strip');
      for (let i = 0; i < this.a; i++) {
        const gone = i >= this.a - this.b;
        pile.appendChild(el('span.count-item.count-item--static', {
          style: gone
            ? { opacity: '.28', filter: 'grayscale(1)', transform: 'rotate(-14deg)' }
            : {},
        }, this.item.e));
      }
      row.append(pile, el('div.big-emoji', { text: '➖' }),
        el('div.big-emoji', { text: NUMBERS[this.b].e }));
    } else {
      row.append(
        this.pile(this.a),
        el('div.big-emoji', { text: '➕' }),
        this.pile(this.b),
      );
    }
    return row;
  }

  pile(n) {
    const strip = el('div.count-strip', { style: { maxWidth: '32vw' } });
    for (let i = 0; i < n; i++) {
      strip.appendChild(el('span.count-item.count-item--static', {
        style: { animationDelay: `${i * 60}ms` },
      }, this.item.e));
    }
    return strip;
  }

  buildChoices(max) {
    const set = new Set([this.answer]);
    let spread = 1;
    while (set.size < 3 && spread < 12) {
      for (const cand of [this.answer - spread, this.answer + spread]) {
        if (set.size >= 3) break;
        if (cand >= 0 && cand <= Math.max(10, max)) set.add(cand);
      }
      spread++;
    }

    this.buttons = this.rng.shuffle([...set]).map((n) => {
      const node = tile(NUMBERS[n].e, {
        label: numWord(n),
        aria: numWord(n),
        onClick: (_e, nd) => this.tap(n, nd),
      });
      node._n = n;
      return node;
    });

    return el('div.answer-row', {}, ...this.buttons);
  }

  prompt() {
    return this.isSub ? t('p.addsub.sub') : t('p.addsub.add');
  }

  tap(n, node) {
    if (this.solved) return;
    if (n === this.answer) {
      this.correct(node, { praise: true });
      speak(numWord(this.answer));
      this.after(800, () => this.win());
    } else {
      this.wrong(node);
    }
  }

  hintTarget() {
    return this.buttons.find((b) => b._n === this.answer);
  }

  solveStep() { this.hintTarget()?.click(); }

  async autoSolve() {
    await delay(20);
    this.hintTarget()?.click();
  }
}
