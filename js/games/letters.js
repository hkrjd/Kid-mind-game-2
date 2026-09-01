/* ============================================================
   letters — "जो अक्षर सुना वो दबाओ" / Tap the letter you hear.

   Uses whichever alphabet matches the interface language: A-Z in
   English, the Devanagari varnamala in Hindi. Purely auditory, so
   a pre-reader can play it from the very first level.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { tile, grid, fitGrid, delay } from '../core/ui.js';
import { LETTERS, EASY_LETTERS } from '../content/packs.js';
import { getLang, t } from '../core/i18n.js';
import { speak } from '../core/audio.js';

const CHOICES_BY_TIER = [3, 4, 6];

export default class LettersGame extends GameEngine {
  static id = 'letters';
  static skills = ['letters'];

  build(field) {
    const lang = getLang();
    // Start with the first ten letters, which are the ones a child
    // meets first in both scripts, before opening the full set.
    const pool = this.tier === 0 ? EASY_LETTERS[lang] : LETTERS[lang];
    const fit = fitGrid(Math.min(CHOICES_BY_TIER[this.tier], pool.length));

    const choices = this.rng.sample(pool, fit.count);
    this.answer = this.rng.pick(choices);

    this.tiles = choices.map((letter) => {
      const node = tile(letter.e, {
        aria: letter.sound,
        onClick: (_e, nd) => this.tap(nd),
      });
      node.style.fontWeight = '900';
      node._letter = letter;
      return node;
    });

    field.appendChild(grid(fit, ...this.tiles));
  }

  prompt() {
    return t('p.letters');
  }

  /** Say the prompt, then the letter itself — that is the question. */
  async intro() {
    if (this.destroyed) return;
    await speak(this.prompt());
    if (this.destroyed) return;
    await speak(this.answer.sound);
  }

  tap(node) {
    if (this.solved) return;
    if (node._letter === this.answer) {
      this.correct(node, { praise: true });
      speak(this.answer.sound);
      this.after(650, () => this.win());
    } else {
      this.wrong(node);
      // Repeat the letter — the child may simply not have heard it.
      this.after(900, () => speak(this.answer.sound));
    }
  }

  hintTarget() {
    return this.tiles.find((n) => n._letter === this.answer);
  }

  solveStep() { this.hintTarget()?.click(); }

  async autoSolve() {
    await delay(20);
    this.hintTarget()?.click();
  }
}
