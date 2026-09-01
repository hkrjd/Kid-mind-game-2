/* ============================================================
   firstsound — "कौन सा शब्द इस आवाज़ से शुरू होता है?"
                / Which word starts with this sound?

   Phonological awareness: hearing the first sound of a word is
   the single strongest predictor of early reading, and it works
   the same way in Devanagari as in the Latin alphabet.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, delay } from '../core/ui.js';
import { PACKS, GENERIC_PACK_IDS } from '../content/packs.js';
import { itemName, getLang, t } from '../core/i18n.js';
import { speak } from '../core/audio.js';

const CHOICES_BY_TIER = [2, 3, 4];

/**
 * The first letter of a word in the current language. For Hindi
 * this is the first Devanagari consonant/vowel sign, which is
 * exactly the "sound" a child is taught to listen for.
 */
function firstLetter(item, lang) {
  const name = (lang === 'hi' ? item.hi : item.en) || '';
  return name.trim().charAt(0).toUpperCase();
}

export default class FirstSoundGame extends GameEngine {
  static id = 'firstsound';
  static skills = ['letters'];

  build(field) {
    const lang = getLang();
    const n = CHOICES_BY_TIER[this.tier];

    // Draw from several packs so there are always enough distinct
    // starting letters, which one pack alone cannot guarantee.
    const pool = [this.pack, ...GENERIC_PACK_IDS.map((id) => PACKS[id])]
      .flatMap((p) => p.items);

    // One item per distinct first letter, then take n of them.
    const byLetter = new Map();
    for (const item of this.rng.shuffle(pool)) {
      const L = firstLetter(item, lang);
      if (L && !byLetter.has(L)) byLetter.set(L, item);
    }
    const chosen = this.rng.sample([...byLetter.values()], Math.min(n, byLetter.size));

    this.answer = this.rng.pick(chosen);
    this.letter = firstLetter(this.answer, lang);

    field.classList.add('field--col');

    const letterCard = el('div.big-emoji', {
      'aria-label': this.letter,
      style: { fontWeight: '900', color: '#fff', textShadow: '0 4px 0 rgba(0,0,0,.25)' },
    }, this.letter);

    this.tiles = chosen.map((item) => {
      const node = tile(item.e, {
        label: itemName(item),
        aria: itemName(item),
        onClick: (_e, nd) => this.tap(nd),
      });
      node._item = item;
      return node;
    });

    field.append(letterCard, el('div.answer-row', {}, ...this.tiles));
  }

  prompt() {
    return `${t('p.firstsound')} ${this.letter}`;
  }

  async intro() {
    if (this.destroyed) return;
    await speak(t('p.firstsound'));
    if (this.destroyed) return;
    await speak(this.letter);
  }

  tap(node) {
    if (this.solved) return;
    if (node._item === this.answer) {
      this.correct(node, { praise: true });
      speak(`${this.letter} — ${itemName(this.answer)}`);
      this.after(800, () => this.win());
    } else {
      this.wrong(node);
    }
  }

  hintTarget() {
    return this.tiles.find((n) => n._item === this.answer);
  }

  solveStep() { this.hintTarget()?.click(); }

  async autoSolve() {
    await delay(20);
    this.hintTarget()?.click();
  }
}
