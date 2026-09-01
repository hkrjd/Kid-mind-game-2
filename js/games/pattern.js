/* ============================================================
   pattern — "आगे क्या आएगा?" / What comes next?

   Repeating-sequence completion, the foundation of algebraic
   thinking. AB AB A_ at first; by the hardest tier the gap is in
   the middle of an ABC run, which needs real rule extraction
   rather than "copy the thing before the hole".
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, delay } from '../core/ui.js';
import { itemName } from '../core/i18n.js';
import { speak } from '../core/audio.js';

/** Each shape is a list of item indices, repeated to fill the row. */
const SHAPES_BY_TIER = [
  [[0, 1]],                                  // AB
  [[0, 0, 1], [0, 1, 1], [0, 1, 2]],         // AAB, ABB, ABC
  [[0, 1, 2], [0, 0, 1, 1], [0, 1, 1, 2]],   // longer rules
];

export default class PatternGame extends GameEngine {
  static id = 'pattern';
  static skills = ['logic'];

  build(field) {
    const shape = this.rng.pick(SHAPES_BY_TIER[this.tier]);
    const distinct = Math.max(...shape) + 1;
    const items = this.rng.sample(this.pack.items, distinct);

    // Repeat the rule until the row is long enough to be readable
    // as a pattern (at least two full cycles plus a bit).
    const reps = this.tier === 0 ? 3 : 2;
    const seq = [];
    for (let r = 0; r < reps; r++) seq.push(...shape);
    if (this.tier > 0) seq.push(shape[0]);       // start a third cycle

    // Easy tiers hide the last item; the hardest hides one inside
    // the run, which cannot be solved by copying the neighbour.
    this.gapAt = this.tier === 2
      ? shape.length + this.rng.int(0, shape.length - 1)
      : seq.length - 1;

    this.answer = items[seq[this.gapAt]];

    field.classList.add('field--col');

    /* --- the sequence, with a hole --- */
    const row = el('div.answer-row');
    seq.forEach((idx, i) => {
      if (i === this.gapAt) {
        this.gapNode = el('div.slot', {}, '❓');
        row.appendChild(this.gapNode);
      } else {
        const t = tile(items[idx].e, { aria: itemName(items[idx]), cls: 'tile--flat' });
        t.disabled = true;
        row.appendChild(t);
      }
    });

    /* --- the choices: the answer plus distractors drawn from the
           pattern's own items, so guessing by novelty cannot work --- */
    const wanted = this.tier === 0 ? 2 : 3;
    const others = items.filter((i) => i !== this.answer);
    const pool = [...others, ...this.pack.items.filter((i) => !items.includes(i))];
    const distractors = this.rng.sample(pool, Math.max(0, wanted - 1));
    const choices = this.rng.shuffle([this.answer, ...distractors]);

    this.choices = choices.map((item) => {
      const node = tile(item.e, {
        label: itemName(item),
        aria: itemName(item),
        onClick: (_e, n) => this.tap(n),
      });
      node._item = item;
      return node;
    });

    field.append(row, el('div.answer-row', {}, ...this.choices));
  }

  tap(node) {
    if (this.solved) return;
    if (node._item === this.answer) {
      this.correct(node, { praise: true });
      this.gapNode.textContent = this.answer.e;
      this.gapNode.classList.add('slot--full');
      speak(itemName(this.answer));
      this.after(700, () => this.win());
    } else {
      this.wrong(node);
    }
  }

  hintTarget() {
    return this.choices.find((n) => n._item === this.answer);
  }

  solveStep() {
    const node = this.hintTarget();
    if (node) node.click();
  }

  async autoSolve() {
    await delay(20);
    this.hintTarget()?.click();
  }
}
