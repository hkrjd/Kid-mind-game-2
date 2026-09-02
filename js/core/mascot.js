/* ============================================================
   mascot.js — Gullu, the owl who plays along.

   Hand-authored SVG, so the game still ships no image files and
   still scales crisply on any tablet. Every mood is a CSS class on
   the root <svg>; nothing here runs an animation loop, so the
   mascot costs nothing while it is just sitting there blinking.

   Moods:
     idle       breathing, blinking, glancing about
     think      leans toward the puzzle, one wing to the beak
     happy      a bounce and a raised wing
     cheer      full celebration, for winning a level
     oops       a sympathetic head tilt — never a sad or cross face,
                because the game never tells a child they failed
   ============================================================ */

const MOODS = ['idle', 'think', 'happy', 'cheer', 'oops'];

/**
 * Build the owl. Returns the <svg> element; drive it with
 * setMood(el, 'happy').
 */
export function createMascot({ size = 120 } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');   // decorative; never announced
  svg.classList.add('mascot', 'mascot--idle');
  svg.innerHTML = `
    <defs>
      <linearGradient id="m-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4fc9d6"/>
        <stop offset="1" stop-color="#1f9bad"/>
      </linearGradient>
      <linearGradient id="m-belly" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff6dd"/>
        <stop offset="1" stop-color="#ffe2a8"/>
      </linearGradient>
    </defs>

    <!-- everything sits in one group so the whole bird can bob -->
    <g class="m-all">
      <ellipse class="m-shadow" cx="100" cy="182" rx="46" ry="8"/>

      <g class="m-body">
        <!-- feet -->
        <path class="m-foot" d="M76 156 q-11 12 -1 17 h22 q6-5 -3-17z"/>
        <path class="m-foot" d="M103 156 q-11 12 -1 17 h22 q6-5 -3-17z"/>

        <!-- ear tufts -->
        <path class="m-tuft" d="M56 60 q-6-26 12-34 q4 18 12 28z"/>
        <path class="m-tuft" d="M144 60 q6-26 -12-34 q-4 18 -12 28z"/>

        <!-- body -->
        <path class="m-shell" d="M100 34 q52 0 52 62 q0 56 -52 56 q-52 0 -52-56 q0-62 52-62z"/>
        <!-- belly -->
        <ellipse class="m-tummy" cx="100" cy="116" rx="30" ry="34"/>

        <!-- wings -->
        <path class="m-wing m-wing--l" d="M56 88 q-22 18 -14 48 q16 12 26-8 q-10-22 -12-40z"/>
        <path class="m-wing m-wing--r" d="M144 88 q22 18 14 48 q-16 12 -26-8 q10-22 12-40z"/>

        <!-- eyes -->
        <g class="m-eye m-eye--l">
          <circle class="m-white" cx="78" cy="86" r="24"/>
          <circle class="m-pupil" cx="78" cy="86" r="11"/>
          <circle class="m-glint" cx="84" cy="80" r="4"/>
        </g>
        <g class="m-eye m-eye--r">
          <circle class="m-white" cx="122" cy="86" r="24"/>
          <circle class="m-pupil" cx="122" cy="86" r="11"/>
          <circle class="m-glint" cx="128" cy="80" r="4"/>
        </g>

        <!-- beak -->
        <path class="m-beak" d="M100 100 l12 14 q-12 9 -24 0z"/>

        <!-- cheeks, only visible when pleased -->
        <ellipse class="m-cheek m-cheek--l" cx="62" cy="112" rx="9" ry="6"/>
        <ellipse class="m-cheek m-cheek--r" cx="138" cy="112" rx="9" ry="6"/>
      </g>

      <!-- sparkles, only for cheering -->
      <g class="m-sparks">
        <path class="m-spark" d="M30 44 l4 10 10 4 -10 4 -4 10 -4-10 -10-4 10-4z"/>
        <path class="m-spark" d="M168 34 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z"/>
        <path class="m-spark" d="M162 140 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z"/>
      </g>
    </g>`;
  return svg;
}

/** Switch mood. Unknown moods fall back to idle rather than sticking. */
export function setMood(svg, mood) {
  if (!svg) return;
  const next = MOODS.includes(mood) ? mood : 'idle';
  MOODS.forEach((m) => svg.classList.remove(`mascot--${m}`));
  svg.classList.add(`mascot--${next}`);
}

/**
 * Show a mood for a moment, then settle back to idle. Returns a
 * cancel function so a screen being torn down does not leave a
 * timer pointing at a detached element.
 */
export function flashMood(svg, mood, ms = 1400) {
  setMood(svg, mood);
  const id = setTimeout(() => setMood(svg, 'idle'), ms);
  return () => clearTimeout(id);
}
