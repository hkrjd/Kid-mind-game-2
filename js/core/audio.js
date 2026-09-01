/* ============================================================
   audio.js — all sound, with zero audio files.

   Sound effects are synthesised with the Web Audio API and the
   voice comes from the tablet's own speechSynthesis. That keeps
   the whole app tiny and fully offline, and gives us Hindi and
   English narration for free.

   Tone choices matter for this age: correct = rising major
   interval, "try again" = a soft low blip (never a buzzer — a
   harsh error sound makes 5-year-olds stop playing).
   ============================================================ */

import { speechLocale, getLang } from './i18n.js';

let ctx = null;
let master = null;
let soundOn = true;
let voiceOn = true;
let voices = [];

/** Lazily create the context; browsers require a gesture first. */
function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.32;          // headroom; kids hold tablets close
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setSound(on) { soundOn = !!on; }
export function setVoice(on) { voiceOn = !!on; if (!voiceOn) stopSpeech(); }
export function isSoundOn() { return soundOn; }
export function isVoiceOn() { return voiceOn; }

/** Call once from the first real user gesture to unlock audio. */
export function unlock() {
  ac();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  loadVoices();
}

/* ------------------------------------------------------------
   Synth primitives
   ------------------------------------------------------------ */

/** One enveloped oscillator note. */
function note(freq, when, dur, { type = 'sine', gain = 0.5, glideTo = null } = {}) {
  const c = ac();
  if (!c || !soundOn) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + dur);

  // Short attack, exponential decay: reads as a soft mallet/chime
  // rather than a synth beep.
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

/** Filtered noise burst — used for whoosh and soft percussion. */
function noise(when, dur, { freq = 900, q = 1.2, gain = 0.28 } = {}) {
  const c = ac();
  if (!c || !soundOn) return;
  const t0 = c.currentTime + when;
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);

  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = c.createGain();
  g.gain.value = gain;

  src.connect(bp).connect(g).connect(master);
  src.start(t0);
}

/* Equal-tempered helper: MIDI-ish note number -> Hz (A4 = 440). */
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

/* ------------------------------------------------------------
   The sound palette
   ------------------------------------------------------------ */
const SFX = {
  /** Neutral acknowledgement of a touch. */
  tap:      () => note(hz(76), 0, 0.09, { type: 'triangle', gain: 0.30 }),

  /** Card flip / reveal. */
  flip:     () => { noise(0, 0.10, { freq: 1600, gain: 0.16 }); note(hz(72), 0.01, 0.10, { type: 'sine', gain: 0.22 }); },

  /** Correct — a rising major third. Unmistakably "yes". */
  correct:  () => { note(hz(76), 0, 0.14, { type: 'sine', gain: 0.42 });
                    note(hz(80), 0.09, 0.20, { type: 'sine', gain: 0.42 }); },

  /** Try again — soft, low, falling. Sympathetic, not punishing. */
  oops:     () => note(hz(60), 0, 0.24, { type: 'sine', gain: 0.26, glideTo: hz(55) }),

  /** A pair matched / an item placed correctly. */
  match:    () => { note(hz(72), 0, 0.12, { type: 'triangle', gain: 0.36 });
                    note(hz(79), 0.08, 0.16, { type: 'triangle', gain: 0.34 });
                    note(hz(84), 0.16, 0.26, { type: 'sine', gain: 0.30 }); },

  /** A star lands in the reward screen. */
  star:     () => { note(hz(84), 0, 0.10, { type: 'sine', gain: 0.34 });
                    note(hz(91), 0.06, 0.22, { type: 'sine', gain: 0.30 }); },

  /** Level complete — a little major arpeggio + sparkle. */
  win:      () => { [72, 76, 79, 84].forEach((n, i) =>
                      note(hz(n), i * 0.11, 0.34, { type: 'triangle', gain: 0.38 }));
                    note(hz(88), 0.46, 0.5, { type: 'sine', gain: 0.30 });
                    noise(0.46, 0.4, { freq: 2600, gain: 0.10 }); },

  /** Picking a piece up / dropping it. */
  pickup:   () => noise(0, 0.09, { freq: 700, gain: 0.16 }),
  drop:     () => note(hz(64), 0, 0.11, { type: 'triangle', gain: 0.28 }),

  /** Screen transitions. */
  whoosh:   () => noise(0, 0.22, { freq: 480, q: 0.7, gain: 0.14 }),

  /** Simon-says pads — four pitches of a pentatonic scale so any
      sequence sounds pleasant. */
  pad0:     () => note(hz(72), 0, 0.34, { type: 'sine', gain: 0.42 }),
  pad1:     () => note(hz(76), 0, 0.34, { type: 'sine', gain: 0.42 }),
  pad2:     () => note(hz(79), 0, 0.34, { type: 'sine', gain: 0.42 }),
  pad3:     () => note(hz(84), 0, 0.34, { type: 'sine', gain: 0.42 }),

  /** Counting cadence — pitch rises with each item counted. */
  count:    (i = 0) => note(hz(67 + Math.min(i, 10)), 0, 0.12, { type: 'triangle', gain: 0.32 }),

  /** Unlocking a new world. */
  unlock:   () => { [67, 72, 76, 79, 84].forEach((n, i) =>
                      note(hz(n), i * 0.08, 0.4, { type: 'sine', gain: 0.34 })); },
};

/** Play a named effect. Unknown names are ignored, never thrown. */
export function sfx(name, arg) {
  if (!soundOn) return;
  try { SFX[name]?.(arg); } catch { /* audio is never fatal */ }
}

/* ------------------------------------------------------------
   Speech — the tablet's own TTS voices
   ------------------------------------------------------------ */

function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = window.speechSynthesis.getVoices() || [];
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  // Chrome populates voices asynchronously.
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

/** Best available voice for the current language, or null. */
function pickVoice() {
  const want = speechLocale();
  if (!voices.length) loadVoices();
  const base = want.split('-')[0];
  return voices.find((v) => v.lang === want)
      || voices.find((v) => v.lang?.replace('_', '-') === want)
      || voices.find((v) => v.lang?.startsWith(base))
      || null;
}

export function stopSpeech() {
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
}

/**
 * Speak a line. Returns a promise that settles when speech ends
 * (or immediately if speech is off/unavailable), so callers can
 * sequence "say the prompt, then demo it".
 */
export function speak(text, { rate, pitch, interrupt = true } = {}) {
  if (!voiceOn || !text || !('speechSynthesis' in window)) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      if (interrupt) stopSpeech();
      const u = new SpeechSynthesisUtterance(String(text));
      const v = pickVoice();
      if (v) u.voice = v;
      u.lang = speechLocale();
      // Slower than default and slightly high — easier for a young
      // child to follow, and friendlier.
      u.rate = rate ?? (getLang() === 'hi' ? 0.82 : 0.88);
      u.pitch = pitch ?? 1.15;
      u.volume = 1;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
      // Safety net: some engines never fire onend for short strings.
      setTimeout(resolve, 1200 + String(text).length * 90);
    } catch {
      resolve();
    }
  });
}

/** Speak, then resolve after an extra beat — used for prompts. */
export function say(text, pauseMs = 220) {
  return speak(text).then(() => new Promise((r) => setTimeout(r, pauseMs)));
}
