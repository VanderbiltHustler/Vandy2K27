// Builds one profile per player (2K-style banner, chart, analysis box, navigation) and shows them as a carousel.
import { el, fmt, tier, url, currentTheme } from './core.js';
import { renderPlayerChart } from './chart.js';

const PLACEHOLDER = '[PLAYER ANALYSIS TO BE ADDED]';

function chartFor(p, ctx) {
  const wrap = el('div', 'profile__chart');
  if (ctx.site.chartMode === 'inline') {
    renderPlayerChart(wrap, p, ctx.data, { site: ctx.site, header: false, palette: 'category' });
    // animate when scrolled into view
    wrap.classList.remove('is-in');
    new IntersectionObserver((es, io) => es.forEach((e) => e.isIntersecting && (wrap.classList.add('is-in'), io.disconnect())), { threshold: 0.15 }).observe(wrap);
    return wrap;
  }
  const f = el('iframe', 'chart-frame');
  f.src = url(`charts/player.html?p=${encodeURIComponent(p.id)}&header=0&theme=${currentTheme(ctx.site)}&palette=category`);
  f.title = `${p.name} — individual attribute ratings`;
  f.loading = 'eager';
  f.scrolling = 'no';
  f.dataset.player = p.id;
  wrap.append(f);
  return wrap;
}

const SUFFIX = /^(jr\.?|sr\.?|ii|iii|iv)$/i;
function splitName(name) {
  const w = name.split(' '); let k = w.length - 1;
  while (k > 0 && SUFFIX.test(w[k])) k--;
  return [w.slice(0, k).join(' '), w.slice(k).join(' ')];
}
const feet = (h) => (h ? h.replace('-', "'") + '"' : 'N/A');

// 2K-style player banner: fed by data/bios.json + the tag from content/tags.json.
function cardHeader(p, ctx) {
  const bio = ctx.bios[p.id] || {};
  const [first, last] = splitName(p.name);
  const head = el('header', 'pcard');
  if (p.image) {
    const img = new Image(); img.src = url(p.image); img.alt = `Headshot of ${p.name}`; img.className = 'pcard__photo';
    img.addEventListener('error', () => img.remove());
    head.append(img);
  }
  const ring = el('div', 'pcard__ovr'); ring.dataset.tier = tier(p.overall, ctx.site.tiers);
  ring.setAttribute('aria-label', `Overall rating ${fmt(p.overall)}`);
  const pctv = Number.isFinite(p.overall) ? Math.max(0, Math.min(100, p.overall / (ctx.data.scale?.max ?? 99) * 100)) : 0;
  ring.style.setProperty('--p', pctv);
  ring.append(el('small', null, 'OVR'), el('b', null, fmt(p.overall)));
  head.append(ring);
  const mid = el('div', 'pcard__mid');
  const num = el('div', 'pcard__num', bio.number != null ? '#' + bio.number : 'N/A');
  const nm = el('div', 'pcard__name'); nm.append(el('span', 'pcard__first', first));
  const h2 = el('h2', 'pcard__last', last); h2.id = `name-${p.id}`; nm.append(h2);
  const stats = el('p', 'pcard__stats', `HT: ${feet(bio.height)} / WT: ${bio.weight ? bio.weight + ' lbs' : 'N/A'} / CLASS: ${bio.class || 'N/A'}`);
  const top = el('div', 'pcard__top'); top.append(num, el('div', 'pcard__id', null));
  top.lastChild.append(nm, stats);
  mid.append(top);
  if (ctx.tags[p.id]) mid.append(el('p', 'pcard__tag', ctx.tags[p.id]));
  head.append(mid);
  const side = el('dl', 'pcard__side');
  for (const [k, v] of [['Hometown', bio.hometown], ['High School', bio.highSchool]]) side.append(el('dt', null, k + ':'), el('dd', null, v || 'N/A'));
  head.append(side);
  return head;
}

function navFor(p, i, order) {
    const nav = el('nav', 'profile__nav'); nav.setAttribute('aria-label', `${p.name} navigation`);
    const prev = order[(i - 1 + order.length) % order.length], next = order[(i + 1) % order.length];   // wraps around
    const mk = (cls, href, dir, name) => { const a = el('a', 'navbtn ' + cls); a.href = href; a.append(el('small', null, dir), el('span', null, name)); return a; };
    nav.append(prev ? mk('navbtn--prev', '#player-' + prev.id, '← Previous', prev.name) : el('span'));
    const back = el('a', 'navbtn navbtn--roster'); back.href = '#roster'; back.append(el('small', null, '↑'), el('span', null, 'Back to roster'));
    nav.append(back);
    nav.append(next ? mk('navbtn--next', '#player-' + next.id, 'Next →', next.name) : el('span'));
    return nav;
}

// Carousel: one profile at a time. Slides are the same
// <article id="player-…"> sections, so roster clicks, the Previous/Next buttons and #hash links all just work.
function setupCarousel(host, order) {
  host.classList.add('profiles--carousel');
  const slides = [...host.querySelectorAll('.profile')];
  const ids = order.map((p) => 'player-' + p.id);
  const bar = el('div', 'carousel__bar');
  const mk = (cls, label, txt) => { const b = el('button', 'carousel__btn ' + cls, txt); b.type = 'button'; b.setAttribute('aria-label', label); return b; };
  const prev = mk('carousel__btn--prev', 'Previous player', '←'), next = mk('carousel__btn--next', 'Next player', '→');
  const label = el('p', 'carousel__label'); label.setAttribute('aria-live', 'polite');
  const dots = el('div', 'carousel__dots');
  const dotEls = order.map((p, i) => { const d = el('button', 'carousel__dot'); d.type = 'button'; d.setAttribute('aria-label', p.name); d.addEventListener('click', () => go(i, true)); dots.append(d); return d; });
  const mid = el('div', 'carousel__mid'); mid.append(label, dots);
  bar.append(prev, mid, next);
  host.prepend(bar);

  let cur = -1;
  const show = (i) => {
    i = Math.max(0, Math.min(ids.length - 1, i));
    if (i === cur) return;
    cur = i;
    slides.forEach((sl, k) => sl.classList.toggle('is-active', k === i));
    dotEls.forEach((d, k) => { d.classList.toggle('is-on', k === i); d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    label.textContent = `${order[i].name} · ${i + 1} of ${ids.length}`;
  };
  const go = (i, scroll) => {
    i = (i + ids.length) % ids.length;   // wraps: last → first, first → last
    show(i);
    if (scroll) host.scrollIntoView({ behavior: 'instant', block: 'start' });
  };
  prev.addEventListener('click', () => go(cur - 1, true));
  next.addEventListener('click', () => go(cur + 1, true));
  const fromHash = () => { const i = ids.indexOf(location.hash.slice(1)); if (i >= 0) { show(i); return true; } return false; };
  if (!fromHash()) show(0);
  addEventListener('hashchange', () => { if (fromHash()) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' }); });
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft') go(cur - 1, false); else if (e.key === 'ArrowRight') go(cur + 1, false);
  });
  let x0 = null, y0 = 0;   // swipe
  host.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  host.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1), false);
  }, { passive: true });
}

export function renderProfiles(host, ctx) {
  const { order, analysis } = ctx;
  const frag = document.createDocumentFragment();
  order.forEach((p, i) => {
    const sec = el('article', 'profile');
    sec.id = 'player-' + p.id; sec.tabIndex = -1;
    sec.setAttribute('aria-labelledby', `name-${p.id}`);
    sec.dataset.tier = tier(p.overall, ctx.site.tiers);

    const box = el('section', 'pbox'); box.setAttribute('aria-label', `${p.name} analysis`);
    const paras = analysis[p.id];
    if (Array.isArray(paras) && paras.length) for (const t of paras) { const para = el('p'); para.innerHTML = t; box.append(para); }
    else { box.classList.add('is-empty'); box.append(el('p', 'placeholder', PLACEHOLDER)); }
    sec.append(cardHeader(p, ctx), chartFor(p, ctx), box);
    sec.append(navFor(p, i, order));
    frag.append(sec);
  });
  host.append(frag);
  setupCarousel(host, order);

  // Iframe auto-resize
  addEventListener('message', (e) => {
    if (e.data?.type !== 'player-chart:resize') return;
    for (const f of host.querySelectorAll('iframe.chart-frame')) {
      if (f.contentWindow === e.source) f.style.height = e.data.height + 'px';
    }
  });
}
