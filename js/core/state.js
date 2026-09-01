/* ============================================================
   state.js — settings + progress, persisted to localStorage.

   No accounts, no network, no analytics. Everything a child does
   stays on their own tablet.
   ============================================================ */

import { setLang, LANGS } from './i18n.js';
import { setSound, setVoice } from './audio.js';

const KEY = 'dimaag-ka-khel/v1';

const DEFAULTS = {
  lang: 'hi',
  sound: true,
  voice: true,
  motion: true,
  fullscreen: true,
  /** levelId -> stars earned (1..3). Absent = not yet completed. */
  stars: {},
  /**
   * engineId -> rolling struggle score. Goes up when a child needs
   * hints, down when they clear a level cleanly. Engines read this
   * to soften the next level, so a child never hits a wall.
   */
  struggle: {},
};

let data = { ...DEFAULTS };
let saveTimer = null;

function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

export function load() {
  let stored = null;
  try { stored = safeParse(localStorage.getItem(KEY)); } catch { /* private mode */ }
  data = { ...DEFAULTS, ...(stored || {}) };
  data.stars = { ...(stored?.stars || {}) };
  data.struggle = { ...(stored?.struggle || {}) };
  if (!LANGS.includes(data.lang)) data.lang = 'hi';
  applySettings();
  return data;
}

/** Debounced so rapid star updates do not thrash storage. */
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* quota / private mode */ }
  }, 120);
}

/** Push the stored settings into the modules that own them. */
function applySettings() {
  setLang(data.lang);
  setSound(data.sound);
  setVoice(data.voice);
  document.body.classList.toggle('no-motion', !data.motion);
}

/* ---------------- settings ---------------- */

export function getSetting(k) { return data[k]; }

export function setSetting(k, v) {
  data[k] = v;
  applySettings();
  save();
}

/* ---------------- progress ---------------- */

export function starsFor(levelId) { return data.stars[levelId] || 0; }

export function isDone(levelId) { return !!data.stars[levelId]; }

/** Record a result. Stars only ever go up, so replaying is safe. */
export function recordStars(levelId, stars) {
  const prev = data.stars[levelId] || 0;
  if (stars > prev) data.stars[levelId] = stars;
  save();
  return stars > prev;
}

export function totalStars() {
  return Object.values(data.stars).reduce((a, b) => a + b, 0);
}

export function completedCount() {
  return Object.keys(data.stars).length;
}

/* ---------------- adaptive difficulty ---------------- */

export function struggleFor(engineId) {
  return data.struggle[engineId] || 0;
}

/**
 * `delta` is +1 per hint the child needed, -1 for a clean clear.
 *
 * Clamped to [0, 4]: paired with effectiveTier's halving that is a
 * softening of up to two tiers, which is enough to walk a child all
 * the way back to the easiest version of a game they keep finding
 * hard. A lower ceiling would leave the hardest tier permanently out
 * of reach for them; a higher one would let a single bad afternoon
 * trivialise the game for good.
 */
export function noteStruggle(engineId, delta) {
  const next = Math.max(0, Math.min(4, (data.struggle[engineId] || 0) + delta));
  data.struggle[engineId] = next;
  save();
  return next;
}

export function resetProgress() {
  data.stars = {};
  data.struggle = {};
  save();
}
