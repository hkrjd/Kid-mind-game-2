/* ============================================================
   counting — "गिनो और सही नंबर दबाओ" / Count and tap the number.

   Tapping an item counts it aloud with a rising pitch, so a child
   who cannot yet count silently can count by touching — which is
   exactly how counting is taught at this age.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, delay } from '../core/ui.js';
import { NUMBERS } from '../content/packs.js';
import { numWord, itemName } from '../core/i18n.js';
import { sfx, speak } from '../core/audio.js';

const RANGE_BY_TIER = [[1, 3], [2, 5], [4, 10]];
const CHOICES_BY_TIER = [3, 4, 4];

export default class CountingGame extends GameEngine {
  static id = 'counting';
  static skills = ['numbers'];

  build(field) {
    const [lo, hi] = RANGE_BY_TIER[this.tier];
    const answer = this.rng.int(lo, hi);
    this.answer = answer;
    this.item = this.rng.pick(this.pack.items);
    this.counted = 0;

    field.classList.add('field--col');

    /* --- the things to count --- */
    const strip = el('div.count-strip');
    this.things = [];
    for (let i = 0; i < answer; i++) {
      const thing = el('span.count-item', {
        role: 'button',
        'aria-label': itemName(this.item),
        style: { animationDelay: `${i * 70}ms` },
        onclick: () => this.tapThing(thing),
      }, this.item.e);
      this.things.push(thing);
      strip.appendChild(thing);
    }

    /* --- the number buttons --- */
    const options = this.buildOptions(answer, CHOICES_BY_TIER[this.tier], lo, hi);
    this.buttons = options.map((n) => {
      const b = tile(NUMBERS[n].e, {
        label: numWord(n),
        aria: numWord(n),
        onClick: (_e, node) => this.tapNumber(n, node),
      });
      b._n = n;
      return b;
    });

    field.append(strip, el('div.answer-row', {}, ...this.buttons));
  }

  /** Distractors sit next to the answer, so guessing wildly fails. */
  buildOptions(answer, count, lo, hi) {
    const set = new Set([answer]);
    let spread = 1;
    while (set.size < count && spread < 12) {
      for (const cand of [answer - spread, answer + spread]) {
        if (set.size >= count) break;
        if (cand >= Math.max(1, lo - 1) && cand <= Math.min(10, hi + 2)) set.add(cand);
      }
      spread++;
    }
    // Top up from the whole 1-10 range if the window was too tight.
    while (set.size < count) set.add(this.rng.int(1, 10));
    return this.rng.shuffle([...set]);
  }

  /** Touch-to-count: each tap says the next number out loud. */
  tapThing(thing) {
    if (thing._counted || this.solved) return;
    thing._counted = true;
    this.counted++;
    thing.style.opacity = '.45';
    sfx('count', this.counted);
    speak(numWord(this.counted));
  }

  tapNumber(n, node) {
    if (this.solved) return;
    if (n === this.answer) {
      this.correct(node, { praise: true });
      speak(`${numWord(this.answer)} ${itemName(this.item)}`);
      this.after(800, () => this.win());
    } else {
      this.wrong(node);
    }
  }

  hintTarget() {
    return this.buttons.find((b) => b._n === this.answer);
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
