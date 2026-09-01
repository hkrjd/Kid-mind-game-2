/* ============================================================
   drag.js — pointer drag with generous snapping.

   Built for a 5-year-old's motor control:
   - Pointer Events, so touch/pen/mouse all take one code path.
   - A dropped item snaps to the nearest valid target within a
     forgiving radius; "close enough" always counts.
   - The dragged element is cloned to a fixed-position ghost, so
     it is never clipped by an overflow container.
   ============================================================ */

import { sfx } from './audio.js';

const SNAP_RADIUS = 110;   // px — roughly a fingertip's error

function centreOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

/**
 * Make `el` draggable.
 *
 * opts:
 *   targets()    -> array of drop-target elements (called on drop,
 *                   so targets may appear/disappear mid-level)
 *   onDrop(target, el) -> handle a drop on a target (or null if the
 *                   child let go in empty space)
 *   onPick(el)   -> optional, fired when the drag starts
 *   radius       -> override the snap radius
 *
 * Returns a teardown function.
 */
export function makeDraggable(el, opts) {
  const radius = opts.radius ?? SNAP_RADIUS;
  let ghost = null;
  let offsetX = 0;
  let offsetY = 0;
  let pointerId = null;
  let lastOver = null;
  let moved = false;

  function nearestTarget(x, y) {
    let best = null;
    let bestDist = Infinity;
    for (const t of (opts.targets?.() || [])) {
      if (t.dataset.dropDisabled === 'true') continue;
      const c = centreOf(t);
      // Inside the target always wins, whatever the distance to its
      // centre; otherwise fall back to a radius around the centre.
      const inside = x >= c.x - c.w / 2 && x <= c.x + c.w / 2 &&
                     y >= c.y - c.h / 2 && y <= c.y + c.h / 2;
      const d = inside ? -1 : Math.hypot(x - c.x, y - c.y);
      if (d < bestDist && (inside || d <= radius)) { bestDist = d; best = t; }
    }
    return best;
  }

  function highlight(t) {
    if (lastOver === t) return;
    lastOver?.classList.remove('slot--over', 'bin--over');
    if (t) t.classList.add(t.classList.contains('bin') ? 'bin--over' : 'slot--over');
    lastOver = t;
  }

  function onDown(e) {
    if (pointerId !== null || el.dataset.dragDisabled === 'true') return;
    pointerId = e.pointerId;
    moved = false;
    const r = el.getBoundingClientRect();
    offsetX = e.clientX - r.left;
    offsetY = e.clientY - r.top;

    ghost = el.cloneNode(true);
    ghost.classList.add('dragging');
    ghost.style.width = `${r.width}px`;
    ghost.style.height = `${r.height}px`;
    ghost.style.left = `${r.left}px`;
    ghost.style.top = `${r.top}px`;
    document.body.appendChild(ghost);
    el.classList.add('drag-src');

    el.setPointerCapture?.(e.pointerId);
    sfx('pickup');
    opts.onPick?.(el);
    e.preventDefault();
  }

  function onMove(e) {
    if (e.pointerId !== pointerId || !ghost) return;
    moved = true;
    ghost.style.left = `${e.clientX - offsetX}px`;
    ghost.style.top = `${e.clientY - offsetY}px`;
    highlight(nearestTarget(e.clientX, e.clientY));
    e.preventDefault();
  }

  function finish(e) {
    if (e.pointerId !== pointerId) return;
    const x = e.clientX;
    const y = e.clientY;
    cleanupGhost();
    highlight(null);
    pointerId = null;
    // A tap without movement is not a drop — engines that want tap
    // behaviour bind their own click handler.
    opts.onDrop?.(moved ? nearestTarget(x, y) : null, el, moved);
  }

  function cleanupGhost() {
    ghost?.remove();
    ghost = null;
    el.classList.remove('drag-src');
  }

  function onCancel(e) {
    if (e.pointerId !== pointerId) return;
    cleanupGhost();
    highlight(null);
    pointerId = null;
  }

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', finish);
  el.addEventListener('pointercancel', onCancel);

  return () => {
    cleanupGhost();
    highlight(null);
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', finish);
    el.removeEventListener('pointercancel', onCancel);
  };
}

/** Animate `el` back to where it started — used on a bad drop. */
export function springBack(el) {
  el.animate(
    [{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
    { duration: 220, easing: 'cubic-bezier(.34,1.56,.64,1)' }
  );
}
