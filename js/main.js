// Article page entry point: loads data/config/content, renders header, roster, profiles, sticky bar.
import { loadSite, loadJSON, el, url, applyTheme } from './core.js';
import { renderRoster } from './roster.js';
import { renderProfiles } from './profiles.js';

// Every load/reload starts at the top of the article on the first profile: drop any #player-… hash left in the URL.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (location.hash) history.replaceState(null, '', location.pathname + location.search);
scrollTo(0, 0);

const PH = (t) => `[${t}]`;

function renderHeader(host, a) {
  const field = (cls, tag, value, placeholder) => {
    const n = el(tag, cls);
    if (value) n.textContent = value; else { n.textContent = PH(placeholder); n.classList.add('placeholder'); }
    return n;
  };
  if (a.logo) { const i = new Image(); i.src = url(a.logo); i.alt = a.logoAlt || ''; i.className = 'masthead__logo'; const lnk = el('a', 'masthead__logolink'); lnk.href = a.logoLink || 'https://vanderbilthustler.com/'; lnk.target = '_blank'; lnk.rel = 'noopener'; lnk.setAttribute('aria-label', a.logoAlt || 'Vanderbilt Hustler'); lnk.append(i); host.append(lnk); }
  host.append(field('masthead__title', 'h1', a.title, 'ARTICLE TITLE — edit content/article.json'));
  host.append(field('masthead__dek', 'p', a.dek, 'SUBTITLE / DEK'));
  const by = el('p', 'masthead__by');
  const au = field('', 'span', a.author, 'AUTHOR'), dt = field('', 'time', a.date, 'PUBLICATION DATE');
  by.append(el('span', null, 'By '), au, el('span', 'sep', ' · '), dt);
  host.append(by);
  const intro = el('div', 'masthead__intro');
  if (a.intro?.length) for (const t of a.intro) { const p = el('p'); p.innerHTML = t; intro.append(p); }
  else intro.append(field('', 'p', '', 'INTRODUCTORY PARAGRAPH — add paragraphs to "intro" in content/article.json'));
  host.append(intro);
  if (a.title) document.title = a.title;
}

function renderConclusion(host, a) {
  host.replaceChildren();
  if (a.conclusion?.length) for (const t of a.conclusion) { const p = el('p'); p.innerHTML = t; host.append(p); }
  else { const p = el('p', 'placeholder', PH('CONCLUDING PARAGRAPH — add paragraphs to "conclusion" in content/article.json')); host.append(p); }
}

try {
  const { site, data } = await loadSite();
  const [article, analysis, tags, bios] = await Promise.all([loadJSON('content/article.json', true), loadJSON('content/analysis.json', true), loadJSON('content/tags.json', true), loadJSON('data/bios.json', true)]);
  const hot = await loadJSON('data/hotspots.json');
  const rosterIds = hot.grid?.display || hot.hotspots.map((h) => h.playerId);
  let order = [...data.players];
  if (site.profileOrder === 'roster') order.sort((a, b) => (rosterIds.indexOf(a.id) + 99) % 99 - (rosterIds.indexOf(b.id) + 99) % 99 || 0);
  else if (site.profileOrder === 'overall') order.sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));

  renderHeader(document.getElementById('masthead'), article);
  await renderRoster(document.getElementById('roster-host'), { site, data, order });
  renderConclusion(document.getElementById('conclusion'), article);
  renderProfiles(document.getElementById('profiles'), { site, data, order, analysis, article, tags, bios: bios.players || {} });

  addEventListener('hashchange', () => { const t = document.getElementById(location.hash.slice(1)); t?.focus({ preventScroll: true }); });
} catch (e) {
  document.getElementById('masthead').innerHTML = `<p class="placeholder">Could not load site data: ${e.message}<br>Serve this folder over HTTP (see README) — opening index.html via file:// blocks data loading.</p>`;
}
