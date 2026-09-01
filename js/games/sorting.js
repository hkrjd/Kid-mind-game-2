/* ============================================================
   sorting — "हर चीज़ को सही डिब्बे में डालो" / Sort into bins.

   Classification: by colour, by shape, or by category. Accepts
   both drag-and-drop and tap-item-then-tap-bin, because plenty of
   5-year-olds find a sustained drag harder than two taps.
   ============================================================ */

import { GameEngine } from '../core/engine.js';
import { el, tile, delay } from '../core/ui.js';
import { makeDraggable, springBack } from '../core/drag.js';
import { getPack, COLORS, GENERIC_PACK_IDS } from '../content/packs.js';
import { t, itemName, getLang } from '../core/i18n.js';
import { sfx, speak } from '../core/audio.js';

const SETUP_BY_TIER = [
  { bins: 2, items: 4 },
  { bins: 2, items: 6 },
  { bins: 3, items: 6 },
];

export default class SortingGame extends GameEngine {
  static id = 'sorting';
  static skills = ['logic'];

  build(field) {
    const setup = SETUP_BY_TIER[this.tier];
    const plan = this.planSort(setup.bins, setup.items);
    this.rule = plan.rule;

    field.classList.add('field--col');

    /* --- bins --- */
    this.bins = plan.groups.map((g) => {
      const bin = el('div.bin', {
        style: { '--bin-color': g.color || 'var(--joy-blue)' },
        'aria-label': g.label,
      }, g.icon, el('span.bin__count', { text: '0' }));
      bin._key = g.key;
      bin._count = 0;
      bin.addEventListener('click', () => this.tapBin(bin));
      return bin;
    });

    /* --- items to sort --- */
    this.items = plan.items.map((item) => {
      const node = tile(item.e, {
        aria: itemName(item),
        cls: 'tile--flat',
        onClick: (_e, n) => this.tapItem(n),
      });
      node._item = item;
      node._key = plan.keyOf(item);
      this.cleanup(makeDraggable(node, {
        targets: () => this.bins,
        onDrop: (bin, n, moved) => {
          if (!moved) return;               // a plain tap is handled by onClick
          if (bin) this.place(n, bin);
          else springBack(n);
        },
      }));
      return node;
    });

    this.remaining = this.items.length;
    this.selected = null;

    field.append(
      el('div.answer-row', {}, ...this.bins),
      el('div.answer-row', {}, ...this.items),
    );
  }

  /**
   * Decide what we are sorting by. The shapes pack supports clean
   * colour and shape rules; other packs sort by which pack an item
   * came from, which reads to a child as "animals vs fruit".
   */
  planSort(binCount, itemCount) {
    if (this.pack.id === 'shapes') {
      const byColor = this.tier === 0 || this.rng.chance(0.5);
      const field = byColor ? 'c' : 'sh';
      const values = [...new Set(this.pack.items.map((i) => i[field]))];
      const chosen = this.rng.sample(values, binCount);

      const groups = chosen.map((v) => {
        const sample = this.pack.items.find((i) => i[field] === v);
        return {
          key: v,
          icon: sample.e,
          color: byColor ? COLORS[v]?.hex : 'var(--joy-blue)',
          label: byColor ? (COLORS[v]?.[getLang()] || v) : t(`s.${v}`),
        };
      });

      const items = [];
      for (let i = 0; i < itemCount; i++) {
        const v = chosen[i % chosen.length];
        items.push(this.rng.pick(this.pack.items.filter((it) => it[field] === v)));
      }
      return { rule: field, groups, items: this.rng.shuffle(items), keyOf: (it) => it[field] };
    }

    // Category sort: this level's pack versus other packs.
    const otherIds = this.rng.sample(GENERIC_PACK_IDS.filter((p) => p !== this.pack.id), binCount - 1);
    const packs = [this.pack, ...otherIds.map(getPack)];

    const groups = packs.map((p) => ({
      key: p.id,
      icon: p.icon,
      color: 'var(--joy-blue)',
      label: p[getLang()] || p.en,
    }));

    const items = [];
    for (let i = 0; i < itemCount; i++) {
      const p = packs[i % packs.length];
      const it = this.rng.pick(p.items);
      items.push({ ...it, _pack: p.id });
    }
    return { rule: 'pack', groups, items: this.rng.shuffle(items), keyOf: (it) => it._pack };
  }

  /* ---------- tap-to-place ---------- */

  tapItem(node) {
    if (node._placed || this.solved) return;
    this.selected?.classList.remove('tile--hint');
    this.selected = this.selected === node ? null : node;
    if (this.selected) {
      this.selected.classList.add('tile--hint');
      sfx('pickup');
      speak(itemName(node._item));
    }
  }

  tapBin(bin) {
    if (!this.selected || this.solved) return;
    const node = this.selected;
    this.selected = null;
    node.classList.remove('tile--hint');
    this.place(node, bin);
  }

  /* ---------- the actual rule check ---------- */

  place(node, bin) {
    if (node._placed || this.solved) return;

    if (node._key !== bin._key) {
      this.wrong(node);
      bin.animate([{ transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'none' }],
        { duration: 300 });
      return;
    }

    node._placed = true;
    node.dataset.dragDisabled = 'true';
    node.classList.add('tile--gone');
    bin._count++;
    bin.querySelector('.bin__count').textContent = String(bin._count);
    bin.animate([{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }],
      { duration: 260, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    sfx('match');

    if (--this.remaining === 0) this.after(500, () => this.win());
  }

  hintTarget() {
    const node = this.items.find((n) => !n._placed);
    const bin = this.bins.find((b) => b._key === node?._key);
    return [node, bin].filter(Boolean);
  }

  solveStep() {
    const node = this.items.find((n) => !n._placed);
    const bin = this.bins.find((b) => b._key === node?._key);
    if (node && bin) this.place(node, bin);
  }

  async autoSolve() {
    for (const node of this.items) {
      if (this.destroyed || this.solved) return;
      if (node._placed) continue;
      node.click();                                        // select
      await delay(15);
      this.bins.find((b) => b._key === node._key)?.click(); // place
      await delay(15);
    }
  }
}
