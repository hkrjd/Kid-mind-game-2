/* ============================================================
   engine.js — the contract every one of the twenty games follows.

   The base class owns everything that must behave identically
   across games: the top bar, spoken prompts, mistake handling,
   the escalating help ladder, stars, and the win flow. A subclass
   only has to build its own play field and say when it is solved.

   The help ladder is the heart of the design. A 5-year-old who is
   stuck does not read a hint, they give up. So:
      2 mistakes -> the answer starts pulsing
      4 mistakes -> the game solves that step itself and moves on
   The child always progresses. There is no failure state anywhere.
   ============================================================ */

import { el, gameBar, rewardOverlay, confetti, flashOk, flashOops,
         showHint, clearAllHints, delay } from './ui.js';
import { t, randomPraise, randomOops } from './i18n.js';
import { speak, sfx, say } from './audio.js';
import { noteStruggle, struggleFor } from './state.js';

const HINT_AFTER = 2;
const SOLVE_AFTER = 4;

export class GameEngine {
  /** Subclasses override. `skills` is metadata for the world map. */
  static id = 'base';
  static skills = [];

  /**
   * ctx: { level, rng, pack, tier, onExit, onNext }
   *   level  — the catalog entry being played
   *   rng    — seeded from the level id, so the layout is stable
   *   pack   — the content pack chosen for this level
   *   tier   — 0 | 1 | 2 difficulty, already softened for a child
   *            who has been struggling with this engine
   */
  constructor(ctx) {
    this.ctx = ctx;
    this.level = ctx.level;
    this.rng = ctx.rng;
    this.pack = ctx.pack;
    this.tier = ctx.tier;

    this.mistakes = 0;
    this.hintsUsed = 0;
    this.solved = false;
    this.destroyed = false;
    this._timers = new Set();
    this._teardowns = [];
  }

  /* ---------------- lifecycle ---------------- */

  /** Build the whole screen and start the intro narration. */
  mount(host) {
    this.host = host;

    this.field = el('div.field');
    this.root = el('div.game', {}, this.field);
    host.appendChild(this.root);

    // Build first. Several prompts describe what the level turned out
    // to be — which letter to listen for, how many differences there
    // are, whether the question is "more" or "fewer" — so asking for
    // the prompt before build() would render it from nothing.
    this.build(this.field);

    const chrome = gameBar({
      prompt: this.prompt(),
      onHome: () => this.ctx.onExit?.(),
      onReplay: () => this.intro(),
    });
    this.setPrompt = chrome.setPrompt;
    this.root.prepend(chrome.bar);

    // Let the field paint before the voice starts, so the child is
    // looking at the puzzle while it is described.
    this.after(320, () => this.intro());
    return this.root;
  }

  /** Speak the prompt, then let the subclass demo it. */
  async intro() {
    if (this.destroyed) return;
    await say(this.prompt());
    if (this.destroyed) return;
    this.demo?.();
  }

  destroy() {
    this.destroyed = true;
    this._timers.forEach(clearTimeout);
    this._timers.clear();
    this._teardowns.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
    this._teardowns.length = 0;
    this.onDestroy?.();
    this.root?.remove();
  }

  /* ---------------- helpers for subclasses ---------------- */

  /** setTimeout that is cancelled automatically on destroy. */
  after(ms, fn) {
    const id = setTimeout(() => { this._timers.delete(id); if (!this.destroyed) fn(); }, ms);
    this._timers.add(id);
    return id;
  }

  /** Register a cleanup function (drag teardowns, listeners…). */
  cleanup(fn) { this._teardowns.push(fn); }

  /** Sleep, aborting if the level was torn down mid-animation. */
  async wait(ms) {
    await delay(ms);
    return !this.destroyed;
  }

  /** The spoken/displayed instruction. Override for dynamic text. */
  prompt() {
    return t(`p.${this.constructor.id}`);
  }

  /* ---------------- correct / wrong ---------------- */

  /**
   * A correct action. Praises roughly a third of the time — constant
   * praise stops registering, occasional praise keeps its value.
   */
  correct(node, { praise = false, silent = false } = {}) {
    if (node) flashOk(node);
    else if (!silent) sfx('correct');
    if (praise || this.rng.chance(0.34)) speak(randomPraise(this.rng));
  }

  /**
   * A wrong action. Wobbles, never removes or blocks anything, and
   * climbs the help ladder.
   */
  wrong(node) {
    if (node) flashOops(node);
    else sfx('oops');
    this.mistakes++;

    if (this.mistakes === HINT_AFTER) {
      speak(randomOops(this.rng));
      this.after(700, () => this.giveHint());
    } else if (this.mistakes >= SOLVE_AFTER) {
      this.after(700, () => this.giveAway());
    } else {
      speak(randomOops(this.rng));
    }
  }

  /** Step 1 of the ladder: pulse the answer. */
  giveHint() {
    if (this.destroyed || this.solved) return;
    this.hintsUsed++;
    const target = this.hintTarget?.();
    if (target) {
      speak(t('hint.look'));
      (Array.isArray(target) ? target : [target]).forEach(showHint);
    }
  }

  /** Step 2: do it for them, so nobody gets stuck and quits. */
  giveAway() {
    if (this.destroyed || this.solved) return;
    this.hintsUsed++;
    clearAllHints(this.root);
    this.solveStep?.();
  }

  /* ---------------- winning ---------------- */

  /**
   * Stars reward independence, but finishing always earns at least
   * one. There is no zero-star outcome and no losing.
   */
  computeStars() {
    if (this.hintsUsed > 0) return 1;
    if (this.mistakes === 0) return 3;
    if (this.mistakes <= 2) return 2;
    return 1;
  }

  /** Call when the level is complete. */
  async win() {
    if (this.solved || this.destroyed) return;
    this.solved = true;
    clearAllHints(this.root);

    // Feed the adaptive-difficulty model: needing help softens the
    // next level of this game, a clean clear firms it back up.
    noteStruggle(this.constructor.id, this.hintsUsed > 0 ? 1 : -1);

    const stars = this.computeStars();
    await this.wait(420);
    if (this.destroyed) return;

    confetti(this.root);
    speak(randomPraise(this.rng));

    const overlay = rewardOverlay({
      stars,
      onHome: () => this.ctx.onExit?.(),
      onAgain: () => this.ctx.onAgain?.(),
      onNext: () => this.ctx.onNext?.(),
    });
    this.root.appendChild(overlay);
    this.ctx.onWin?.(stars);
  }

  /* ---------------- testing hook ---------------- */

  /**
   * Programmatically finish the level. Only the smoke test calls
   * this; it is how we verify all 300 levels are actually winnable.
   * Subclasses must implement it.
   */
  autoSolve() {
    throw new Error(`${this.constructor.id}: autoSolve() not implemented`);
  }

  /** Shared autoSolve body: click a sequence of nodes on a timer. */
  async autoClick(nodes, gap = 30) {
    for (const n of nodes) {
      if (this.destroyed || this.solved) return;
      n?.click();
      await delay(gap);
    }
  }
}

/**
 * How much to soften a level for a child who keeps needing help.
 * Returns an effective tier, never below 0.
 */
export function effectiveTier(engineId, tier) {
  return Math.max(0, tier - Math.floor(struggleFor(engineId) / 2));
}
