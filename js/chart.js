// Reusable full-attribute chart. One function renders any player's dataset; it is used
// inline by the article (chartMode:"inline") and by charts/player.html (iframe embedding).
import { el, fmt, isNum, pct, tier } from './core.js';

function meter(value, scale, tiers, label) {
  const track = el('div', 'bar');
  track.setAttribute('role', 'meter');
  track.setAttribute('aria-label', label);
  track.setAttribute('aria-valuemin', scale.min);
  track.setAttribute('aria-valuemax', scale.max);
  if (isNum(value)) track.setAttribute('aria-valuenow', value);
  else track.setAttribute('aria-valuetext', 'unavailable');
  track.dataset.tier = tier(value, tiers);
  const fill = el('span', 'bar__fill');
  fill.style.setProperty('--w', pct(value, scale) + '%');
  fill.style.setProperty('--wn', Math.max(1, pct(value, scale)));   // unitless, for the fixed-scale gradient
  track.append(fill);
  return track;
}

export function renderPlayerChart(host, player, data, { site, header = true, animate = true, palette = '' } = {}) {
  const scale = data.meta.scale, tiers = site.tiers;
  host.replaceChildren();
  host.classList.add('pchart');
  host.classList.toggle('is-in', !animate);
  host.classList.toggle('pchart--cat', palette === 'category');   // per-category bar colors (tokens --cat-*)

  if (header) {
    const h = el('header', 'pchart__head');
    h.append(el('h3', 'pchart__name', player.name));
    const ovr = el('div', 'ovr');
    ovr.dataset.tier = tier(player.overall, tiers);
    ovr.append(el('span', 'ovr__num', fmt(player.overall)), el('span', 'ovr__lbl', 'OVR'));
    ovr.setAttribute('aria-label', `Overall rating ${fmt(player.overall)}`);
    h.append(ovr);
    host.append(h);
  }

  const grid = el('div', 'pchart__groups');
  for (const cat of data.categories) {
    const sec = el('section', 'group'); sec.dataset.cat = cat.key;
    const head = el('div', 'group__head');
    head.append(el('h4', 'group__title', cat.label));
    const cr = player.categoryRatings?.[cat.key];
    const badge = el('span', 'group__rating', fmt(cr));
    badge.dataset.tier = tier(cr, tiers);
    badge.title = `${cat.label} category rating`;
    badge.setAttribute('aria-label', `${cat.label} category rating: ${fmt(cr)}`);
    head.append(badge);
    sec.append(head);

    const list = el('ul', 'attrs');
    for (const a of cat.attributes) {
      const v = player.attributes?.[a.key];
      const li = el('li', 'attr');
      li.append(el('span', 'attr__label', a.label));
      li.append(meter(v, scale, tiers, `${a.label}: ${isNum(v) ? v + ' out of ' + scale.max : 'unavailable'}`));
      const val = el('span', 'attr__val', fmt(v));
      val.dataset.tier = tier(v, tiers);
      li.append(val);
      list.append(li);
    }
    sec.append(list);
    grid.append(sec);
  }
  host.append(grid);

  if (animate) requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('is-in')));
  return host;
}
