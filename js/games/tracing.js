/* ============================================================
   tracing — "लकीर पर उँगली चलाओ" / Trace the line.

   Pre-writing practice: follow a dotted guide with one finger.
   The tolerance is deliberately wide — the point is the movement,
   not precision, and a 5-year-old's line wobbles a lot.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, delay, fitSquareCanvas } from '../core/ui.js';
import { sfx, speak } from '../core/audio.js';
import { t } from '../core/i18n.js';

/** Fraction of waypoints that must be touched to count as traced. */
const COVERAGE_TO_WIN = 0.82;
/** How far off the line a finger may stray, as a fraction of the canvas. */
const TOLERANCE = 0.11;

/* --- Shape generators. All return points in a 0..1 square. --- */

const line = (x1, y1, x2, y2, steps = 26) =>
  Array.from({ length: steps + 1 }, (_, i) => [x1 + ((x2 - x1) * i) / steps, y1 + ((y2 - y1) * i) / steps]);

const polygon = (pts, perSide = 12) => {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    out.push(...line(x1, y1, x2, y2, perSide).slice(0, -1));
  }
  out.push(pts[0]);
  return out;
};

const circle = (steps = 44) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    return [0.5 + 0.36 * Math.cos(a), 0.5 + 0.36 * Math.sin(a)];
  });

const zigzag = (peaks = 4) => {
  const pts = [];
  for (let i = 0; i <= peaks * 2; i++) {
    pts.push([0.12 + (0.76 * i) / (peaks * 2), i % 2 === 0 ? 0.74 : 0.26]);
  }
  return pts.flatMap((p, i, arr) => (i === arr.length - 1 ? [p] : line(p[0], p[1], arr[i + 1][0], arr[i + 1][1], 8).slice(0, -1)));
};

const wave = (steps = 60) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const x = 0.1 + (0.8 * i) / steps;
    return [x, 0.5 + 0.26 * Math.sin((i / steps) * Math.PI * 3)];
  });

const SHAPES_BY_TIER = [
  [
    { name: 's.circle', path: () => line(0.12, 0.5, 0.88, 0.5) },
    { name: 's.circle', path: () => line(0.5, 0.12, 0.5, 0.88) },
    { name: 's.circle', path: circle },
  ],
  [
    { name: 's.square', path: () => polygon([[0.2, 0.2], [0.8, 0.2], [0.8, 0.8], [0.2, 0.8]]) },
    { name: 's.triangle', path: () => polygon([[0.5, 0.14], [0.86, 0.82], [0.14, 0.82]]) },
    { name: 's.circle', path: circle },
  ],
  [
    { name: 's.circle', path: () => zigzag(4) },
    { name: 's.circle', path: () => wave() },
    { name: 's.diamond', path: () => polygon([[0.5, 0.12], [0.86, 0.5], [0.5, 0.88], [0.14, 0.5]]) },
  ],
];

export default class TracingGame extends GameEngine {
  static id = 'tracing';
  static skills = ['motor'];

  build(field) {
    this.shape = this.rng.pick(SHAPES_BY_TIER[this.tier]);
    this.guide = this.shape.path();

    // Waypoints are a thinned-out copy of the guide: enough to prove
    // the whole line was followed, few enough to be forgiving.
    const stride = Math.max(1, Math.round(this.guide.length / 18));
    this.waypoints = this.guide.filter((_, i) => i % stride === 0).map(([x, y]) => ({ x, y, hit: false }));
    this.ink = [];

    const wrap = el('div.canvas-wrap');
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-label', t('p.tracing'));
    wrap.appendChild(this.canvas);
    field.appendChild(wrap);

    this.bindPointer();
    // There is no way to trace "wrongly", only to make no headway, so
    // this game's help ladder runs on a timer too.
    this.startIdleHelp();

    this.cleanup(fitSquareCanvas(this.canvas, (side) => this.onResize(side)));
  }

  onResize(side) {
    if (this.destroyed) return;
    this.side = side;
    this.draw();
  }

  draw() {
    const ctx = this.canvas?.getContext('2d');
    if (!ctx) return;
    const S = this.side;

    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, S, S);

    /* the dotted guide */
    ctx.setLineDash([S * 0.028, S * 0.032]);
    ctx.strokeStyle = '#cfc6e6';
    ctx.lineWidth = S * 0.045;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    this.guide.forEach(([x, y], i) => (i ? ctx.lineTo(x * S, y * S) : ctx.moveTo(x * S, y * S)));
    ctx.stroke();
    ctx.setLineDash([]);

    /* waypoints already touched */
    for (const w of this.waypoints) {
      if (!w.hit) continue;
      ctx.fillStyle = 'rgba(76,175,80,.35)';
      ctx.beginPath();
      ctx.arc(w.x * S, w.y * S, S * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }

    /* the child's own line */
    ctx.strokeStyle = '#f28c28';
    ctx.lineWidth = S * 0.05;
    ctx.beginPath();
    this.ink.forEach((seg) => {
      seg.forEach(([x, y], i) => (i ? ctx.lineTo(x * S, y * S) : ctx.moveTo(x * S, y * S)));
    });
    ctx.stroke();

    /* where to begin */
    const [sx, sy] = this.guide[0];
    ctx.font = `${S * 0.09}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👉', sx * S, sy * S);
  }

  bindPointer() {
    const at = (e) => {
      const r = this.canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    };

    let drawing = false;
    const start = (e) => {
      drawing = true;
      this.ink.push([]);
      this.canvas.setPointerCapture?.(e.pointerId);
      this.visit(...at(e));
      e.preventDefault();
    };
    const move = (e) => { if (drawing) this.visit(...at(e)); };
    const end = () => { drawing = false; };

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

  /** Record a point of the child's line and tick off nearby waypoints. */
  visit(x, y) {
    if (this.solved) return;
    const stroke = this.ink[this.ink.length - 1] || (this.ink.push([]), this.ink[this.ink.length - 1]);
    stroke.push([x, y]);

    let newHits = 0;
    for (const w of this.waypoints) {
      if (w.hit) continue;
      if (Math.hypot(w.x - x, w.y - y) <= TOLERANCE) { w.hit = true; newHits++; }
    }
    if (newHits) {
      this.noteProgress();
      sfx('count', this.waypoints.filter((w) => w.hit).length);
    }

    this.draw();

    const hit = this.waypoints.filter((w) => w.hit).length;
    if (hit / this.waypoints.length >= COVERAGE_TO_WIN) {
      speak(t(this.shape.name));
      this.after(400, () => this.win());
    }
  }

  /** Show the first few unvisited waypoints as bright dots. */
  giveHint() {
    this.hintsUsed++;
    const ctx = this.canvas.getContext('2d');
    const S = this.side;
    ctx.fillStyle = 'rgba(245,197,24,.85)';
    this.waypoints.filter((w) => !w.hit).slice(0, 4).forEach((w) => {
      ctx.beginPath();
      ctx.arc(w.x * S, w.y * S, S * 0.035, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  solveStep() {
    // Draw the rest of the line for them, then celebrate.
    this.ink.push(this.guide.slice());
    this.waypoints.forEach((w) => { w.hit = true; });
    this.draw();
    this.after(400, () => this.win());
  }

  async autoSolve() {
    for (const [x, y] of this.guide) {
      if (this.destroyed || this.solved) return;
      this.visit(x, y);
      await delay(4);
    }
  }
}
