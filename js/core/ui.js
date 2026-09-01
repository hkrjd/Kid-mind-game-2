/* ============================================================
   ui.js — shared DOM widgets.

   Engines build their levels from these, which is how the touch
   floor, the feedback language and the reward flow stay identical
   across all twenty games.
   ============================================================ */

import { t } from './i18n.js';
import { sfx } from './audio.js';
import { getSetting } from './state.js';

/**
 * Apply a style object. Custom properties (--cols, --bin-color…)
 * need setProperty; Object.assign silently drops them.
 */
function setStyle(node, styles) {
  for (const [k, v] of Object.entries(styles)) {
    if (k.startsWith('--')) node.style.setProperty(k, String(v));
    else node.style[k] = v;
  }
}

/** Terse element factory: el('div.tile', {…}, children). */
export function el(spec, props = {}, ...children) {
  const [tagPart, ...classes] = String(spec).split('.');
  const node = document.createElement(tagPart || 'div');
  if (classes.length) node.className = classes.join(' ');

  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className += ` ${v}`;
    else if (k === 'style' && typeof v === 'object') setStyle(node, v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v === true ? '' : v);
  }

  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** A button that also makes a sound. Always meets the touch floor. */
export function button(label, onClick, { cls = '', aria, big = false } = {}) {
  return el(`button.btn${big ? '.btn--big' : ''}`, {
    class: cls,
    type: 'button',
    'aria-label': aria || (typeof label === 'string' ? label : undefined),
    onclick: (e) => { sfx('tap'); onClick?.(e); },
  }, label);
}

/** Round icon button — home, back, speaker. */
export function iconButton(icon, onClick, aria, cls = 'btn--ghost') {
  return button(icon, onClick, { cls: `btn--round ${cls}`, aria });
}

/* ------------------------------------------------------------
   Game chrome
   ------------------------------------------------------------ */

/**
 * The bar every level shows: home on the left, the spoken prompt in
 * the middle, and a replay-the-voice button on the right. Home is
 * always in the same corner so it becomes muscle memory.
 */
export function gameBar({ prompt, onHome, onReplay }) {
  const promptEl = el('p.gamebar__prompt', { text: prompt || '' });
  const bar = el('div.gamebar', {},
    iconButton('🏠', onHome, t('app.home')),
    promptEl,
    iconButton('🔊', onReplay, t('app.listen')));
  return { bar, setPrompt: (s) => { promptEl.textContent = s; } };
}

/** A screen header with a back button and a title. */
export function topBar(title, onBack) {
  return el('div.topbar', {},
    iconButton('⬅️', onBack, t('app.back')),
    el('h1.topbar__title', { text: title }),
    el('div.topbar__spacer'));
}

/* ------------------------------------------------------------
   Feedback
   ------------------------------------------------------------ */

/** Green pop on a correct tap. */
export function flashOk(node) {
  node.classList.remove('tile--oops');
  node.classList.add('tile--ok');
  sfx('correct');
}

/**
 * Orange wobble on a wrong tap. Deliberately non-destructive: the
 * element stays exactly where it was and stays playable.
 */
export function flashOops(node) {
  node.classList.remove('tile--oops');
  void node.offsetWidth;                 // restart the animation
  node.classList.add('tile--oops');
  sfx('oops');
  setTimeout(() => node.classList.remove('tile--oops'), 600);
}

/** Pulse the answer so a stuck child can see where to tap. */
export function showHint(node) {
  node?.classList.add('tile--hint');
}
export function clearAllHints(root = document) {
  root.querySelectorAll('.tile--hint').forEach((n) => n.classList.remove('tile--hint'));
}

/* ------------------------------------------------------------
   Rewards
   ------------------------------------------------------------ */

const CONFETTI_COLORS = ['#e8503a', '#f28c28', '#f5c518', '#4caf50', '#17a2b8', '#3d7bd6', '#9b59b6', '#e8629b'];

/** Drop confetti over `host`. No-op when animations are off. */
export function confetti(host, count = 60) {
  if (!getSetting('motion')) return;
  for (let i = 0; i < count; i++) {
    const bit = el('div.confetti', {
      style: {
        left: `${Math.random() * 100}%`,
        background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        animationDuration: `${1.5 + Math.random() * 1.6}s`,
        animationDelay: `${Math.random() * 0.5}s`,
        transform: `rotate(${Math.random() * 360}deg)`,
      },
    });
    host.appendChild(bit);
    setTimeout(() => bit.remove(), 3600);
  }
}

/**
 * The end-of-level celebration. Deliberately has no "you lost"
 * counterpart — the only way out of a level is winning it.
 */
export function rewardOverlay({ stars = 3, title, onAgain, onNext, onHome }) {
  const starRow = el('div.reward__stars');
  for (let i = 0; i < 3; i++) {
    starRow.appendChild(el('span.reward__star', { text: i < stars ? '⭐' : '☆' }));
  }

  const overlay = el('div.reward', {},
    el('div.reward__icon', { text: '🎉' }),
    el('h2.reward__title', { text: title || t('reward.done') }),
    starRow,
    el('div.reward__actions', {},
      iconButton('🏠', onHome, t('app.home'), ''),
      onAgain && iconButton('🔁', onAgain, t('app.again'), ''),
      onNext && button(`${t('app.next')} ➡️`, onNext, { big: true, cls: 'hub__play' })));

  sfx('win');
  for (let i = 0; i < stars; i++) setTimeout(() => sfx('star'), 400 + i * 220);
  return overlay;
}

/* ------------------------------------------------------------
   Parent gate
   ------------------------------------------------------------ */

/**
 * Blocks settings behind a three-second press. A 5-year-old will
 * not hold still that long by accident, and unlike an arithmetic
 * gate it needs no reading.
 *
 * Resolves true if held to completion, false if cancelled.
 */
export function parentGate() {
  return new Promise((resolve) => {
    const HOLD_MS = 3000;
    const ring = el('div.gate__ring');
    const pad = el('div.gate__pad', { role: 'button', 'aria-label': t('gate.hint') }, ring, '👆');
    const gate = el('div.gate', {},
      el('h2.gate__title', { text: t('gate.title') }),
      pad,
      el('p.gate__hint', { text: t('gate.hint') }),
      button('✖️', () => close(false), { cls: 'btn--ghost' }));

    let raf = null;
    let start = 0;

    function tick(now) {
      const p = Math.min(100, ((now - start) / HOLD_MS) * 100);
      ring.style.setProperty('--p', p.toFixed(1));
      if (p >= 100) { sfx('unlock'); close(true); return; }
      raf = requestAnimationFrame(tick);
    }

    function down(e) {
      e.preventDefault();
      start = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function up() {
      cancelAnimationFrame(raf);
      raf = null;
      ring.style.setProperty('--p', 0);
    }

    function close(ok) {
      cancelAnimationFrame(raf);
      gate.remove();
      resolve(ok);
    }

    pad.addEventListener('pointerdown', down);
    pad.addEventListener('pointerup', up);
    pad.addEventListener('pointerleave', up);
    pad.addEventListener('pointercancel', up);

    document.body.appendChild(gate);
  });
}

/* ------------------------------------------------------------
   Layout helpers
   ------------------------------------------------------------ */

/**
 * A grid of tiles. Both --cols and --rows are published so the
 * stylesheet can size tiles to the largest square that fits.
 */
export function grid(cols, ...children) {
  const items = children.flat().filter(Boolean);
  const rows = Math.max(1, Math.ceil(items.length / cols));
  return el('div.grid', { style: { '--cols': String(cols), '--rows': String(rows) } }, ...items);
}

/**
 * Choose a column count that keeps `n` tiles roughly square on a
 * landscape screen, so tiles stay as large as possible.
 */
export function bestCols(n) {
  if (n <= 3) return n;
  if (n <= 4) return 2;
  if (n <= 6) return 3;
  if (n <= 8) return 4;
  if (n <= 9) return 3;
  if (n <= 12) return 4;
  if (n <= 16) return 4;
  return 5;
}

/** A tile showing one emoji, optionally captioned. */
export function tile(content, { label, cls = '', onClick, aria, data } = {}) {
  const node = el(`button.tile`, {
    class: cls,
    type: 'button',
    'aria-label': aria || label || (typeof content === 'string' ? content : undefined),
    dataset: data,
    onclick: onClick ? (e) => onClick(e, node) : undefined,
  }, content, label ? el('span.tile__label', { text: label }) : null);
  return node;
}

/** Wait, but cancellable via the returned handle. */
export function delay(ms) {
  let id;
  const p = new Promise((r) => { id = setTimeout(r, ms); });
  p.cancel = () => clearTimeout(id);
  return p;
}

/* ------------------------------------------------------------
   Canvas helper
   ------------------------------------------------------------ */

/**
 * Fit a square canvas to its parent and keep it fitted.
 *
 * Handles device-pixel-ratio scaling (so lines are crisp on a
 * retina tablet) and re-runs on rotation or any layout change,
 * which a one-shot measurement at build time always gets wrong.
 *
 * Calls `onSize(sidePx)` after each resize. Returns a teardown.
 */
export function fitSquareCanvas(canvas, onSize) {
  const apply = () => {
    const box = canvas.parentElement?.getBoundingClientRect();
    if (!box || box.width < 2 || box.height < 2) return;
    const side = Math.max(240, Math.floor(Math.min(box.width, box.height)) - 8);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${side}px`;
    canvas.style.height = `${side}px`;
    canvas.width = Math.round(side * dpr);
    canvas.height = Math.round(side * dpr);
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    onSize(side);
  };

  const ro = new ResizeObserver(apply);
  if (canvas.parentElement) ro.observe(canvas.parentElement);
  window.addEventListener('resize', apply);
  requestAnimationFrame(apply);

  return () => {
    ro.disconnect();
    window.removeEventListener('resize', apply);
  };
}
