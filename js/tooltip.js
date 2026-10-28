// Floating NBA-2K-style rating card. Positioned with fixed coords, auto-flips to stay in the viewport.
import { el, fmt, pct, tier } from './core.js';

export class RatingCard {
  constructor(data, site) {
    this.data = data; this.site = site;
    this.node = el('div', 'rcard');
    this.node.setAttribute('role', 'status');
    this.node.hidden = true;
    document.body.append(this.node);
    this.current = null;
    addEventListener('scroll', () => this.reposition(), { passive: true });
    addEventListener('resize', () => this.reposition());
    addEventListener('hashchange', () => this.hide());
  }

  fill(player) {
    const { scale } = this.data.meta, tiers = this.site.tiers, n = this.node;
    n.replaceChildren();
    const top = el('div', 'rcard__top');
    top.append(el('div', 'rcard__name', player.name));
    const ovr = el('div', 'rcard__ovr');
    ovr.dataset.tier = tier(player.overall, tiers);
    ovr.style.setProperty('--p', pct(player.overall, scale));
    ovr.append(el('span', 'rcard__ovrnum', fmt(player.overall)), el('span', 'rcard__ovrlbl', 'OVR'));
    top.append(ovr);
    n.append(top);
    for (const cat of this.data.categories) {
      const v = player.categoryRatings?.[cat.key];
      const row = el('div', 'rcard__row'); row.dataset.cat = cat.key;
      row.append(el('span', 'rcard__lbl', this.site.categoryShortLabels?.[cat.key] || cat.label));
      const bar = el('span', 'bar'); bar.dataset.tier = tier(v, tiers);
      bar.setAttribute('aria-hidden', 'true');
      const fill = el('span', 'bar__fill'); fill.style.setProperty('--w', pct(v, scale) + '%'); fill.style.setProperty('--wn', Math.max(1, pct(v, scale)));
      bar.append(fill); row.append(bar);
      row.append(el('span', 'rcard__val', fmt(v)));
      row.setAttribute('aria-label', `${cat.label}: ${fmt(v)}`);
      n.append(row);
    }
    if (this.interactive) {
      const go = el('a', 'rcard__go', 'View full profile →');
      go.href = '#player-' + player.id;
      go.addEventListener('click', () => this.hide());
      n.append(go);
    }
  }

  show(player, anchor, pref = 'auto', { interactive = false } = {}) {
    clearTimeout(this.hideTimer);
    this.interactive = interactive;
    this.node.classList.toggle('is-interactive', interactive);
    if (this.current !== player.id || interactive) this.fill(player);
    this.current = player.id; this.anchor = anchor; this.pref = pref;
    this.node.hidden = false;
    this.node.classList.remove('is-in');
    this.reposition();
    requestAnimationFrame(() => this.node.classList.add('is-in'));
    // animate bars
    requestAnimationFrame(() => requestAnimationFrame(() => this.node.classList.add('bars-in')));
  }

  hide(delay = 0) {
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      this.node.classList.remove('is-in', 'bars-in');
      this.node.hidden = true; this.current = null; this.anchor = null;
    }, delay);
  }

  reposition() {
    if (!this.anchor || this.node.hidden) return;
    const a = this.anchor.getBoundingClientRect();
    if (a.bottom < 0 || a.top > innerHeight) return this.hide();
    const w = this.node.offsetWidth, h = this.node.offsetHeight;
    const vw = document.documentElement.clientWidth, vh = innerHeight, gap = 12, m = 8;
    const sides = {
      // 'jersey': centered on the hotspot, starting below the head so it covers the player's own jersey, not faces
      jersey: { x: a.left + a.width / 2 - w / 2, y: a.top + a.height * (this.site.cardJerseyOffset ?? 0.9) },
      right:  { x: a.right + gap, y: a.top + a.height / 2 - h / 2 },
      left:   { x: a.left - gap - w, y: a.top + a.height / 2 - h / 2 },
      bottom: { x: a.left + a.width / 2 - w / 2, y: a.bottom + gap },
      top:    { x: a.left + a.width / 2 - w / 2, y: a.top - gap - h },
    };
    // If 'jersey' would run off the bottom of the viewport, slide it up — but only far enough to still clear the face.
    sides.jersey.y = Math.min(sides.jersey.y, Math.max(vh - h - m, a.top + a.height * 0.6));
    const fits = (p) => p.x >= m && p.x + w <= vw - m && p.y >= m && p.y + h <= vh - m;
    const cx = a.left + a.width / 2;
    const auto = cx < vw / 2 ? ['right', 'left'] : ['left', 'right'];
    const order = [...(this.pref && this.pref !== 'auto' ? [this.pref] : ['jersey']), 'jersey', ...auto, 'bottom', 'top'];
    let pos = order.map((s) => sides[s]).find(fits);
    if (!pos) pos = sides[order[0]];
    const x = Math.max(m, Math.min(pos.x, vw - w - m));
    const y = Math.max(m, Math.min(pos.y, vh - h - m));
    this.node.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }
}
