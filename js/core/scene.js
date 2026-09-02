/* ============================================================
   scene.js — the living backdrop behind every screen.

   Drifting clouds, rising bubbles and a slow twinkle, tinted by
   whichever category the child is in, so the ten worlds feel like
   ten places rather than one purple rectangle.

   It is a handful of absolutely-positioned shapes animated purely
   in CSS: no animation loop, no images, nothing to download, and
   it disappears entirely when animations are off. The layer never
   takes a pointer event, so it can never swallow a tap meant for
   the game.
   ============================================================ */

import { el } from './ui.js';

/** How each world's backdrop is tinted and what floats through it. */
const SCENES = {
  memory:    { tint: '#9b59b6', motif: '💭', sky: ['#7d5cc4', '#4c3a8f'] },
  logic:     { tint: '#f5c518', motif: '✨', sky: ['#7a63c9', '#4a3a86'] },
  pattern:   { tint: '#17a2b8', motif: '🔷', sky: ['#4f8fc0', '#33487f'] },
  numbers:   { tint: '#3d7bd6', motif: '🔢', sky: ['#5379c9', '#333f85'] },
  shapes:    { tint: '#4caf50', motif: '🟢', sky: ['#4f9c93', '#2f5a72'] },
  letters:   { tint: '#e8629b', motif: '🔤', sky: ['#a45fae', '#5b3785'] },
  pairs:     { tint: '#f28c28', motif: '🧡', sky: ['#9a6bb8', '#553a8c'] },
  attention: { tint: '#e8503a', motif: '👁️', sky: ['#a05a9a', '#553a86'] },
  motor:     { tint: '#8d6e63', motif: '🖐️', sky: ['#7a63b0', '#463877'] },
  master:    { tint: '#574399', motif: '🏆', sky: ['#6f5bbd', '#3d2f6b'] },
};

const DEFAULT = { tint: '#9b8cf0', motif: '⭐', sky: ['#6f5bbd', '#3d2f6b'] };

/**
 * Build the backdrop for a world (or the neutral one when no world
 * is given). Append it as the FIRST child of a screen.
 */
export function createScene(worldId) {
  const s = SCENES[worldId] || DEFAULT;

  const scene = el('div.scene', {
    'aria-hidden': 'true',
    style: {
      '--scene-tint': s.tint,
      '--sky-top': s.sky[0],
      '--sky-bottom': s.sky[1],
    },
  });

  // Three clouds at different depths, so the drift reads as distance.
  [0, 1, 2].forEach((i) => {
    scene.appendChild(el(`div.scene__cloud.scene__cloud--${i}`));
  });

  // A few motifs of the world drifting upward, well faded back so
  // they never compete with the puzzle for attention.
  for (let i = 0; i < 6; i++) {
    scene.appendChild(el('div.scene__mote', {
      style: {
        left: `${6 + i * 16 + (i % 2) * 5}%`,
        animationDelay: `${i * 2.6}s`,
        animationDuration: `${17 + (i % 3) * 5}s`,
        fontSize: `${16 + (i % 3) * 9}px`,
      },
    }, s.motif));
  }

  scene.appendChild(el('div.scene__glow'));
  return scene;
}
