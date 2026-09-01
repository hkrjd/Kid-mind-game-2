/* ============================================================
   maze — "रास्ता ढूँढो" / Find the way.

   Drag a finger from the mouse to the cheese. The path follows
   whole cells rather than exact pixels, and backing up over your
   own trail erases it, so there is no way to get wedged.

   Tapping an adjacent cell works too: a continuous drag across a
   large screen is genuinely hard for small hands.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, delay, fitSquareCanvas } from '../core/ui.js';
import { sfx, speak } from '../core/audio.js';
import { t } from '../core/i18n.js';

const SIZE_BY_TIER = [3, 4, 5];

const START_EMOJI = '🐭';
const GOAL_EMOJI = '🧀';

export default class MazeGame extends GameEngine {
  static id = 'maze';
  static skills = ['spatial'];

  build(field) {
    this.n = SIZE_BY_TIER[this.tier];
    this.cells = this.generate(this.n);
    this.path = [0];                      // cell indices, from the start
    this.goal = this.n * this.n - 1;

    const wrap = el('div.canvas-wrap');
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-label', t('p.maze'));
    wrap.appendChild(this.canvas);
    field.appendChild(wrap);

    this.bindPointer();

    this.cleanup(fitSquareCanvas(this.canvas, (side) => this.onResize(side)));
  }

  /* ---------------- maze generation ---------------- */

  /**
   * Recursive backtracker. Every cell is reachable, and there is
   * exactly one route between any two cells — so a child who keeps
   * going forward cannot end up in an unsolvable state.
   */
  generate(n) {
    const cells = Array.from({ length: n * n }, () => ({ n: true, e: true, s: true, w: true, seen: false }));
    const idx = (r, c) => r * n + c;
    const stack = [0];
    cells[0].seen = true;
    let visited = 1;

    while (visited < n * n) {
      const cur = stack[stack.length - 1];
      const r = Math.floor(cur / n);
      const c = cur % n;

      const options = [];
      if (r > 0 && !cells[idx(r - 1, c)].seen) options.push(['n', idx(r - 1, c), 's']);
      if (r < n - 1 && !cells[idx(r + 1, c)].seen) options.push(['s', idx(r + 1, c), 'n']);
      if (c > 0 && !cells[idx(r, c - 1)].seen) options.push(['w', idx(r, c - 1), 'e']);
      if (c < n - 1 && !cells[idx(r, c + 1)].seen) options.push(['e', idx(r, c + 1), 'w']);

      if (!options.length) { stack.pop(); continue; }

      const [dir, next, back] = this.rng.pick(options);
      cells[cur][dir] = false;
      cells[next][back] = false;
      cells[next].seen = true;
      visited++;
      stack.push(next);
    }
    return cells;
  }

  /** Are two cells neighbours with no wall between them? */
  open(a, b) {
    const n = this.n;
    const ra = Math.floor(a / n), ca = a % n;
    const rb = Math.floor(b / n), cb = b % n;
    if (ra === rb && cb === ca + 1) return !this.cells[a].e;
    if (ra === rb && cb === ca - 1) return !this.cells[a].w;
    if (ca === cb && rb === ra + 1) return !this.cells[a].s;
    if (ca === cb && rb === ra - 1) return !this.cells[a].n;
    return false;
  }

  /* ---------------- rendering ---------------- */

  onResize(side) {
    if (this.destroyed) return;
    this.side = side;
    this.cell = side / this.n;
    this.draw();
  }

  draw() {
    const ctx = this.canvas?.getContext('2d');
    if (!ctx) return;
    const { side, cell, n } = this;

    ctx.clearRect(0, 0, side, side);
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, side, side);

    /* the trail so far */
    ctx.strokeStyle = '#f5c518';
    ctx.lineWidth = cell * 0.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    this.path.forEach((id, i) => {
      const x = (id % n) * cell + cell / 2;
      const y = Math.floor(id / n) * cell + cell / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    if (this.path.length === 1) {
      const x = cell / 2, y = cell / 2;
      ctx.moveTo(x, y); ctx.lineTo(x + 0.01, y);
    }
    ctx.stroke();

    /* walls */
    ctx.strokeStyle = '#574399';
    ctx.lineWidth = Math.max(6, cell * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n;
      const x = c * cell, y = r * cell;
      const w = this.cells[i];
      if (w.n) { ctx.moveTo(x, y); ctx.lineTo(x + cell, y); }
      if (w.w) { ctx.moveTo(x, y); ctx.lineTo(x, y + cell); }
      if (w.s) { ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); }
      if (w.e) { ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); }
    }
    ctx.stroke();

    /* start and goal */
    ctx.font = `${cell * 0.62}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const head = this.path[this.path.length - 1];
    ctx.fillText(START_EMOJI, (head % n) * cell + cell / 2, Math.floor(head / n) * cell + cell / 2);
    ctx.fillText(GOAL_EMOJI, (this.goal % n) * cell + cell / 2, Math.floor(this.goal / n) * cell + cell / 2);
  }

  /* ---------------- input ---------------- */

  bindPointer() {
    const cellAt = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const c = Math.floor(((e.clientX - r.left) / r.width) * this.n);
      const row = Math.floor(((e.clientY - r.top) / r.height) * this.n);
      if (c < 0 || row < 0 || c >= this.n || row >= this.n) return -1;
      return row * this.n + c;
    };

    let down = false;
    const move = (e) => { if (down) this.tryStep(cellAt(e)); };
    const start = (e) => {
      down = true;
      this.canvas.setPointerCapture?.(e.pointerId);
      this.tryStep(cellAt(e));
      e.preventDefault();
    };
    const end = () => { down = false; };

    this.canvas.addEventListener('pointerdown', start);
    this.canvas.addEventListener('pointermove', move);
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
    this.cleanup(() => {
      this.canvas.removeEventListener('pointerdown', start);
      this.canvas.removeEventListener('pointermove', move);
      this.canvas.removeEventListener('pointerup', end);
      this.canvas.removeEventListener('pointercancel', end);
    });
  }

  /** Extend or retract the trail by one cell. */
  tryStep(target) {
    if (target < 0 || this.solved) return;
    const head = this.path[this.path.length - 1];
    if (target === head) return;

    // Backing onto the previous cell rubs the trail out.
    if (this.path.length > 1 && target === this.path[this.path.length - 2]) {
      this.path.pop();
      sfx('tap');
      this.draw();
      return;
    }

    if (!this.open(head, target)) return;    // a wall: simply no move
    if (this.path.includes(target)) return;  // no crossing our own trail

    this.path.push(target);
    sfx('count', this.path.length);
    this.draw();

    if (target === this.goal) {
      speak(GOAL_EMOJI);
      this.after(400, () => this.win());
    }
  }

  /* ---------------- help ---------------- */

  /** Breadth-first from the current head to the cheese. */
  routeToGoal() {
    const head = this.path[this.path.length - 1];
    const prev = new Map([[head, null]]);
    const queue = [head];
    while (queue.length) {
      const cur = queue.shift();
      if (cur === this.goal) break;
      for (const nb of [cur - this.n, cur + this.n, cur - 1, cur + 1]) {
        if (nb < 0 || nb >= this.n * this.n || prev.has(nb)) continue;
        if (!this.open(cur, nb)) continue;
        prev.set(nb, cur);
        queue.push(nb);
      }
    }
    const route = [];
    for (let at = this.goal; at != null; at = prev.get(at)) {
      route.unshift(at);
      if (at === head) break;
    }
    return route.slice(1);
  }

  /** Nudge: draw the next correct cell in a highlight colour. */
  giveHint() {
    this.hintsUsed++;
    const next = this.routeToGoal()[0];
    if (next == null) return;
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'rgba(245,197,24,.55)';
    ctx.fillRect((next % this.n) * this.cell + 4, Math.floor(next / this.n) * this.cell + 4,
      this.cell - 8, this.cell - 8);
  }

  solveStep() {
    const next = this.routeToGoal()[0];
    if (next != null) this.tryStep(next);
  }

  async autoSolve() {
    for (const cell of this.routeToGoal()) {
      if (this.destroyed || this.solved) return;
      this.tryStep(cell);
      await delay(12);
    }
  }
}
