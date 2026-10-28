// Shared helpers: URL resolution, data loading, theming. Used by the article AND the standalone chart page.
export const ROOT = new URL('../', import.meta.url);          // site root, wherever the page lives
export const url = (p) => new URL(p, ROOT).href;

export async function loadJSON(path, optional = false) {
  try {
    const r = await fetch(url(path), { cache: 'no-cache' }); // always revalidate so edits show on refresh
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    if (optional) return {};
    throw e;
  }
}

export async function loadSite() {
  const [site, data] = await Promise.all([loadJSON('config/site.json'), loadJSON('data/players.json')]);
  applyTheme(site);
  return { site, data };
}

export function currentTheme(site) {
  const q = new URLSearchParams(location.search).get('theme');
  return (q && site.themes.includes(q)) ? q : site.theme;
}

export function applyTheme(site, name = currentTheme(site)) {
  document.documentElement.dataset.theme = name;
  for (const [k, v] of Object.entries(site.tokenOverrides || {})) document.documentElement.style.setProperty(k, v);
  return name;
}

export function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
export const fmt = (v) => (isNum(v) ? String(v) : 'N/A');
export const pct = (v, { min, max }) => (isNum(v) ? Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100)) : 0);
export function tier(v, tiers) {
  if (!isNum(v)) return 'na';
  return v >= tiers.elite ? 'elite' : v >= tiers.high ? 'high' : v >= tiers.mid ? 'mid' : 'low';
}
export const playerById = (data, id) => data.players.find((p) => p.id === id);
