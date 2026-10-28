// Interactive roster: photo + hotspots + hover/tap/keyboard cards + fallback list.
import { el, fmt, loadJSON, playerById, url } from './core.js';
import { RatingCard } from './tooltip.js';

const lastName = (n) => n.split(' ').filter((w) => !/^(jr\.?|sr\.?|ii|iii|iv)$/i.test(w)).pop();

export async function renderRoster(host, { site, data, order }) {
  const map = await loadJSON('data/hotspots.json');
  const card = new RatingCard(data, site);
  const noHover = matchMedia('(hover: none)');

  const editing = new URLSearchParams(location.search).has('edit');
  const G = map.grid;
  const tiled = !!G && !editing;   // captioned grid; the editor (?edit=1) uses the original single-photo layout
  const stage = el('div', tiled ? 'roster__grid' : 'roster__stage');
  const src = map.image?.src || site.roster.image;
  const img = new Image();
  img.className = 'roster__img'; img.alt = map.image?.alt || 'Team roster photo'; img.decoding = 'async';
  img.addEventListener('error', () => {
    img.remove(); stage.classList.add('is-placeholder');
    stage.style.aspectRatio = String(map.image?.aspect || site.roster.placeholderAspect);
    const ph = el('div', 'roster__ph');
    ph.append(el('strong', null, 'ROSTER PHOTO PLACEHOLDER'),
      el('span', null, `Add your photo at ${src} (path set in config/site.json + data/hotspots.json).`));
    stage.prepend(ph);
  });
  img.src = url(src);
  const layer = el('div', 'roster__hotspots');
  const tiles = [];
  if (tiled) {
    img.remove();
    G.rows.forEach(([y0, y1]) => G.cols.forEach(([x0, x1]) => {
      const t = el('div', 'rtile'), ph = el('div', 'rtile__photo'), cw = x1 - x0, ch = y1 - y0;
      ph.style.cssText = `aspect-ratio:${cw}/${ch};background-image:url("${url(src)}");background-size:${G.width / cw * 100}% ${G.height / ch * 100}%;background-position:${x0 / (G.width - cw) * 100}% ${y0 / (G.height - ch) * 100}%`;
      t.append(ph); stage.append(t); tiles.push({ t, ph, x0, y0, cw, ch });
    }));
  } else {
    if (map.image?.aspect) stage.style.aspectRatio = String(map.image.aspect);
    stage.append(img, layer);
  }
  const spots = [];

  const missing = [];
  for (const hs of map.hotspots) {
    const p = playerById(data, hs.playerId);
    if (!p) { missing.push(hs.playerId); continue; }
    const a = el('a', 'hotspot');
    a.href = '#player-' + p.id;
    a.dataset.player = p.id;
    a.dataset.shape = hs.shape || 'ellipse';
    let tile = null;
    if (tiled) {
      const cx = hs.x / 100 * G.width, cy = hs.y / 100 * G.height;
      tile = tiles.find((c) => cx >= c.x0 && cx < c.x0 + c.cw && cy >= c.y0 && cy < c.y0 + c.ch);
    }
    a.style.cssText = tile
      ? `left:${(hs.x / 100 * G.width - tile.x0) / tile.cw * 100}%;top:${(hs.y / 100 * G.height - tile.y0) / tile.ch * 100}%;width:${hs.w / 100 * G.width / tile.cw * 100}%;height:${hs.h / 100 * G.height / tile.ch * 100}%`
      : `left:${hs.x}%;top:${hs.y}%;width:${hs.w}%;height:${hs.h}%`;
    a.setAttribute('aria-label', `${p.name}, overall ${fmt(p.overall)}. View profile.`);
    if (tile) {
      const cap = el('a', 'rtile__cap'); cap.href = '#player-' + p.id;
      const sc = el('span', 'rtile__score'); sc.append(el('span', 'rtile__ovr', 'OVR'), el('b', 'rtile__num', fmt(p.overall)));
      cap.append(el('span', 'rtile__name', lastName(p.name)), sc);
      tile.t.append(cap); tile.t.dataset.player = p.id;
    } else if (site.roster.showBadges) {
      const b = el('span', 'hotspot__badge'); b.setAttribute('aria-hidden', 'true');
      b.append(el('b', null, fmt(p.overall)), el('i', null, lastName(p.name)));
      a.append(b);
    }
    const showCard = (interactive = false) => card.show(p, a, hs.tooltip, { interactive });
    a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showCard(); });
    a.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') card.hide(80); });
    a.addEventListener('focus', () => showCard());
    a.addEventListener('blur', () => card.hide(80));
    a.addEventListener('click', (e) => {
      if (stage.classList.contains('is-editing')) { e.preventDefault(); return; }
      // Touch: first tap reveals the card (with a "View full profile" link); tapping again navigates.
      if (noHover.matches && !(card.current === p.id && card.interactive)) {
        e.preventDefault(); showCard(true);
      }
    });
    (tile ? tile.ph : layer).append(a); spots.push({ a, hs, p });
  }
  if (tiled && G.display?.length) {   // reorder portraits (each keeps its own crop of the photo)
    const rank = (t) => { const i = G.display.indexOf(t.dataset.player); return i < 0 ? 99 : i; };
    [...stage.children].sort((a, b) => rank(a) - rank(b)).forEach((t) => stage.append(t));
  }
  if (missing.length) console.warn('hotspots.json references unknown players:', missing);
  const unmapped = data.players.filter((p) => !map.hotspots.some((h) => h.playerId === p.id));
  if (unmapped.length) console.warn('players without a hotspot:', unmapped.map((p) => p.name));

  addEventListener('keydown', (e) => { if (e.key === 'Escape') card.hide(); });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.hotspot, .rcard')) card.hide();
  });

  host.append(stage);

  if (editing) {
    const { startEditor } = await import('./hotspot-editor.js');
    startEditor({ stage, spots, map, data, card });
  }
}
