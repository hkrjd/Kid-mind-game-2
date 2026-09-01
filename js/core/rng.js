/* ============================================================
   rng.js — small seeded PRNG.

   Every level is generated from a seed derived from its id, so
   level 137 looks identical on every device and every reload.
   That makes bugs reproducible and lets the smoke test rely on
   a stable catalog.
   ============================================================ */

/** FNV-1a: string -> 32-bit unsigned int. */
export function hashSeed(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * mulberry32 — 32-bit PRNG. Tiny, fast, and good enough for
 * shuffling a dozen emoji.
 */
export class Rng {
  constructor(seed) {
    this.state = (typeof seed === 'string' ? hashSeed(seed) : seed >>> 0) || 0x9e3779b9;
  }

  /** Float in [0, 1). */
  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Random element. */
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** New array, Fisher-Yates shuffled. Does not mutate the input. */
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * n distinct elements. If n exceeds the pool it repeats the pool
   * rather than returning short — engines always get the count they
   * asked for, so a small content pack can never break a level.
   */
  sample(arr, n) {
    if (n <= arr.length) return this.shuffle(arr).slice(0, n);
    const out = [];
    while (out.length < n) out.push(...this.shuffle(arr).slice(0, Math.min(arr.length, n - out.length)));
    return out;
  }

  /** True with probability p. */
  chance(p) {
    return this.next() < p;
  }
}
