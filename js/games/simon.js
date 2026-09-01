/* ============================================================
   simon — "जो देखा वो दोहराओ" / Repeat what you saw.

   Four coloured pads flash in a sequence with a pentatonic pitch
   each, so any sequence sounds musical rather than alarming. This
   is working memory, and a wrong tap simply replays the sequence
   instead of ending anything.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, grid, delay } from '../core/ui.js';
import { COLORS } from '../content/packs.js';
import { sfx } from '../core/audio.js';

const LENGTH_BY_TIER = [3, 4, 5];

const PADS = [
  { key: 'red',    emoji: '🔴', hex: COLORS.red.hex },
  { key: 'green',  emoji: '🟢', hex: COLORS.green.hex },
  { key: 'blue',   emoji: '🔵', hex: COLORS.blue.hex },
  { key: 'yellow', emoji: '🟡', hex: COLORS.yellow.hex },
];

export default class SimonGame extends GameEngine {
  static id = 'simon';
  static skills = ['memory'];

  build(field) {
    const len = LENGTH_BY_TIER[this.tier];
    this.sequence = Array.from({ length: len }, () => this.rng.int(0, PADS.length - 1));
    this.step = 0;
    this.accepting = false;

    this.pads = PADS.map((pad, i) => {
      const node = el('button.tile', {
        type: 'button',
        'aria-label': pad.key,
        style: { background: pad.hex, color: '#fff' },
        onclick: () => this.tap(i, node),
      }, pad.emoji);
      return node;
    });

    field.appendChild(grid(2, ...this.pads));
  }

  /** Say the prompt, then play the sequence for the first time. */
  async intro() {
    if (this.destroyed) return;
    await super.intro();
    await this.playSequence();
  }

  /** Flash and sound each pad in turn, then hand control to the child. */
  async playSequence() {
    this.accepting = false;
    this.step = 0;
    if (!(await this.wait(400))) return;

    for (const i of this.sequence) {
      if (this.destroyed || this.solved) return;
      await this.flash(i);
      if (!(await this.wait(200))) return;
    }
    this.accepting = true;
  }

  async flash(i) {
    const pad = this.pads[i];
    if (!pad) return;
    pad.classList.add('tile--ok');
    pad.style.transform = 'scale(1.08)';
    sfx(`pad${i}`);
    await delay(420);
    pad.classList.remove('tile--ok');
    pad.style.transform = '';
  }

  tap(i, node) {
    if (!this.accepting || this.solved) return;

    if (i !== this.sequence[this.step]) {
      this.accepting = false;
      this.wrong(node);
      // Show it again rather than ending the round.
      this.after(1100, () => this.playSequence());
      return;
    }

    sfx(`pad${i}`);
    node.classList.add('tile--ok');
    this.after(280, () => node.classList.remove('tile--ok'));

    if (++this.step === this.sequence.length) {
      this.accepting = false;
      this.after(500, () => this.win());
    }
  }

  hintTarget() {
    return this.pads[this.sequence[this.step]];
  }

  /** Replaying the sequence is the only sensible give-away here. */
  solveStep() {
    this.playSequence();
  }

  async autoSolve() {
    // Wait out the demonstration, then enter the sequence.
    while (!this.accepting && !this.destroyed && !this.solved) await delay(60);
    for (const i of this.sequence) {
      if (this.destroyed || this.solved) return;
      this.pads[i].click();
      await delay(30);
    }
  }
}
