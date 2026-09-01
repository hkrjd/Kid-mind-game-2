/* ============================================================
   main.js — boot, routing, and level loading.

   Routes are hash-based so the whole app is a single static file
   tree that works from file://, GitHub Pages, or an offline
   home-screen install with no server rules.

     #/            hub
     #/world/:i    level picker for one world
     #/level/:id   play a level
     #/settings    parent-gated settings
   ============================================================ */

import { load as loadState, getSetting, recordStars, unlockWorld } from './core/state.js';
import { unlock as unlockAudio, sfx } from './core/audio.js';
import { t } from './core/i18n.js';
import { el } from './core/ui.js';
import { allLevels, getLevel, nextLevel, rngFor, isWorldUnlocked, worldProgress } from './core/catalog.js';
import { WORLDS, ENGINES } from './content/worlds.js';
import { getPack, PAIR_SETS } from './content/packs.js';
import { effectiveTier } from './core/engine.js';

import { hubScreen } from './screens/hub.js';
import { mapScreen } from './screens/map.js';
import { levelSelectScreen } from './screens/levelselect.js';
import { settingsScreen } from './screens/settings.js';

const app = document.getElementById('app');

/** The engine instance currently on screen, so we can tear it down. */
let current = null;

/* ------------------------------------------------------------
   Navigation
   ------------------------------------------------------------ */

export function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function clearScreen() {
  if (current?.destroy) { try { current.destroy(); } catch { /* ignore */ } }
  current = null;
  app.replaceChildren();
}

function showScreen(node) {
  clearScreen();
  app.appendChild(node);
}

/* ------------------------------------------------------------
   Level loading
   ------------------------------------------------------------ */

const moduleCache = new Map();

async function loadEngine(moduleName) {
  if (moduleCache.has(moduleName)) return moduleCache.get(moduleName);
  const mod = await import(`./games/${moduleName}.js`);
  const Engine = mod.default || mod[Object.keys(mod)[0]];
  moduleCache.set(moduleName, Engine);
  return Engine;
}

/** Matching uses pair-relation sets; every other engine uses item packs. */
function packFor(level) {
  return level.engine === 'matching'
    ? (PAIR_SETS[level.packId] || Object.values(PAIR_SETS)[0])
    : getPack(level.packId);
}

async function playLevel(id) {
  const level = getLevel(id);
  if (!level) { go('#/'); return; }

  clearScreen();
  app.appendChild(el('div.screen.hub', {}, el('p.hub__sub', { text: t('app.loading') })));

  let Engine;
  try {
    Engine = await loadEngine(level.module);
  } catch (err) {
    console.error('[game] failed to load engine', level.module, err);
    clearScreen();
    app.appendChild(el('div.screen.hub', {},
      el('div.hub__logo', { text: '😅' }),
      el('h1.hub__title', { text: t('app.error') }),
      el('button.btn.hub__play', { type: 'button', onclick: () => go('#/') }, t('app.home'))));
    return;
  }

  const nxt = nextLevel(id);
  const engine = new Engine({
    level,
    rng: rngFor(level),
    pack: packFor(level),
    // Soften the tier for a child who has needed help with this game.
    tier: effectiveTier(level.engine, level.tier),
    onExit: () => go(`#/world/${level.world}`),
    onAgain: () => playLevel(id),
    onNext: () => (nxt ? playLevel(nxt.id) : go(`#/world/${level.world}`)),
    onWin: (stars) => {
      recordStars(level.id, stars);
      // Opening the next world here (rather than on the map) means the
      // unlock animation happens while the child is still celebrating.
      const nw = level.world + 1;
      if (nw < WORLDS.length && isWorldUnlocked(nw) && unlockWorld(nw)) sfx('unlock');
    },
  });

  clearScreen();
  current = engine;
  engine.mount(app);

  // Test hook: the smoke test drives levels through this.
  window.__engine = engine;
  window.__level = level;
}

/* ------------------------------------------------------------
   Router
   ------------------------------------------------------------ */

function render() {
  const hash = location.hash || '#/';
  const [, route, arg] = hash.split('/');

  if (route === 'world' && arg != null) {
    const wi = Number(arg);
    if (Number.isInteger(wi) && wi >= 0 && wi < WORLDS.length) {
      showScreen(levelSelectScreen(wi, { go }));
      return;
    }
  }

  if (route === 'level' && arg) { playLevel(arg); return; }

  if (route === 'map') { showScreen(mapScreen({ go })); return; }

  if (route === 'settings') { showScreen(settingsScreen({ go })); return; }

  showScreen(hubScreen({ go }));
}

window.addEventListener('hashchange', render);

/* ------------------------------------------------------------
   Boot
   ------------------------------------------------------------ */

/** Audio and fullscreen both need a real gesture; take the first one. */
function armFirstGesture() {
  const once = () => {
    unlockAudio();
    if (getSetting('fullscreen') !== false) requestFullscreenSafely();
    lockLandscape();
    window.removeEventListener('pointerdown', once);
    window.removeEventListener('keydown', once);
  };
  window.addEventListener('pointerdown', once, { once: false });
  window.addEventListener('keydown', once, { once: false });
}

function requestFullscreenSafely() {
  const d = document.documentElement;
  const fn = d.requestFullscreen || d.webkitRequestFullscreen;
  if (fn && !document.fullscreenElement) fn.call(d).catch(() => { /* user or browser said no */ });
}

function lockLandscape() {
  try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* unsupported */ }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;   // not allowed from file://
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('[sw]', e));
  });
}

/** Block the long-press context menu that interrupts drags. */
document.addEventListener('contextmenu', (e) => e.preventDefault());

/** Stop iOS double-tap zoom from firing mid-game. */
document.addEventListener('gesturestart', (e) => e.preventDefault());

loadState();
armFirstGesture();
registerServiceWorker();
render();

/* Debug surface used by tests/smoke.mjs. */
window.__app = { go, allLevels, playLevel, worldProgress, ENGINES };
