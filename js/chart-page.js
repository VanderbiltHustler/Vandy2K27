// Standalone chart page: charts/player.html?p=<player-id>[&theme=..][&header=0]
// Posts its height to the parent window so an <iframe> can resize to fit (no scrollbars).
import { loadSite, el, playerById } from './core.js';
import { renderPlayerChart } from './chart.js';

const params = new URLSearchParams(location.search);
const host = document.getElementById('chart');
const embedded = window.self !== window.top;
if (embedded) document.documentElement.classList.add('is-embedded');

function postHeight() {
  if (!embedded) return;
  const h = Math.ceil(host.getBoundingClientRect().height);
  parent.postMessage({ type: 'player-chart:resize', id: params.get('p'), height: h }, '*');
}

try {
  const { site, data } = await loadSite();
  const player = playerById(data, params.get('p'));
  if (!player) {
    host.append(el('p', 'pchart__error', `No player with id "${params.get('p')}". Available: ${data.players.map((p) => p.id).join(', ')}`));
  } else {
    document.title = `${player.name} — attribute ratings`;
    renderPlayerChart(host, player, data, { site, header: params.get('header') !== '0', animate: !embedded || true, palette: params.get('palette') || '' });
  }
} catch (e) {
  host.append(el('p', 'pchart__error', 'Could not load chart data. ' + e.message));
}
new ResizeObserver(postHeight).observe(host);
postHeight();
