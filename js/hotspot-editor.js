// Hotspot editor — enabled with index.html?edit=1. Drag to move, arrows nudge, +/- resize,
// remap player / tooltip side in the panel, then Copy JSON into data/hotspots.json.
import { el } from './core.js';

export function startEditor({ stage, spots, map, data, card }) {
  stage.classList.add('is-editing');
  const hsOf = (s) => s.hs;
  let sel = null;
  const panel = el('aside', 'editor');
  panel.innerHTML = `<h3>Hotspot editor</h3>
    <p class="editor__hint">Drag a hotspot to move it. Arrow keys nudge (Shift = bigger). <kbd>+</kbd>/<kbd>-</kbd> resize.</p>
    <label>Player <select data-f="player"></select></label>
    <label>Tooltip <select data-f="tooltip"><option>auto</option><option>jersey</option><option>left</option><option>right</option><option>top</option><option>bottom</option></select></label>
    <label>Shape <select data-f="shape"><option>ellipse</option><option>rect</option></select></label>
    <output data-f="read">Select a hotspot</output>
    <div class="editor__btns"><button data-a="copy">Copy hotspots.json</button><button data-a="dl">Download</button></div>`;
  document.body.append(panel);
  const q = (s) => panel.querySelector(s);
  for (const p of data.players) q('[data-f=player]').append(new Option(p.name, p.id));

  const json = () => JSON.stringify({ ...map, hotspots: spots.map(hsOf) }, null, 2) + '\n';
  const read = () => { if (sel) q('[data-f=read]').textContent = `x ${sel.hs.x}  y ${sel.hs.y}  w ${sel.hs.w}  h ${sel.hs.h}`; };
  const apply = (s) => { s.a.style.cssText = `left:${s.hs.x}%;top:${s.hs.y}%;width:${s.hs.w}%;height:${s.hs.h}%`; s.a.dataset.shape = s.hs.shape; read(); };
  const select = (s) => {
    sel?.a.classList.remove('is-selected'); sel = s; s.a.classList.add('is-selected');
    q('[data-f=player]').value = s.hs.playerId; q('[data-f=tooltip]').value = s.hs.tooltip || 'auto';
    q('[data-f=shape]').value = s.hs.shape || 'ellipse'; read();
    const p = data.players.find((x) => x.id === s.hs.playerId); card.show(p, s.a, s.hs.tooltip);
  };
  const round = (n) => Math.round(n * 100) / 100;

  for (const s of spots) {
    const label = el('span', 'hotspot__tag', s.p.name); s.a.append(label);
    s.a.addEventListener('pointerdown', (e) => {
      e.preventDefault(); select(s); s.a.setPointerCapture(e.pointerId);
      const r = stage.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, ox = s.hs.x, oy = s.hs.y;
      const move = (ev) => { s.hs.x = round(ox + (ev.clientX - sx) / r.width * 100); s.hs.y = round(oy + (ev.clientY - sy) / r.height * 100); apply(s); card.reposition(); };
      const up = () => { s.a.removeEventListener('pointermove', move); s.a.removeEventListener('pointerup', up); };
      s.a.addEventListener('pointermove', move); s.a.addEventListener('pointerup', up);
    });
    s.a.addEventListener('keydown', (e) => {
      const st = e.shiftKey ? 1 : 0.1;
      const k = { ArrowLeft: ['x', -st], ArrowRight: ['x', st], ArrowUp: ['y', -st], ArrowDown: ['y', st] }[e.key];
      if (k) { e.preventDefault(); s.hs[k[0]] = round(s.hs[k[0]] + k[1]); apply(s); card.reposition(); }
      if (e.key === '+' || e.key === '=' || e.key === '-') {
        e.preventDefault(); const f = e.key === '-' ? 0.97 : 1.03; s.hs.w = round(s.hs.w * f); s.hs.h = round(s.hs.h * f); apply(s); card.reposition();
      }
    });
  }
  q('[data-f=player]').addEventListener('change', (e) => {
    if (!sel) return;
    const other = spots.find((s) => s !== sel && s.hs.playerId === e.target.value);
    if (other) { other.hs.playerId = sel.hs.playerId; other.p = data.players.find((p) => p.id === other.hs.playerId); other.a.querySelector('.hotspot__tag').textContent = other.p.name; other.a.dataset.player = other.hs.playerId; }
    sel.hs.playerId = e.target.value; sel.p = data.players.find((p) => p.id === e.target.value);
    sel.a.querySelector('.hotspot__tag').textContent = sel.p.name; sel.a.dataset.player = sel.hs.playerId;
    card.show(sel.p, sel.a, sel.hs.tooltip);
  });
  q('[data-f=tooltip]').addEventListener('change', (e) => { if (sel) { sel.hs.tooltip = e.target.value; card.show(sel.p, sel.a, sel.hs.tooltip); } });
  q('[data-f=shape]').addEventListener('change', (e) => { if (sel) { sel.hs.shape = e.target.value; apply(sel); } });
  panel.addEventListener('click', async (e) => {
    const a = e.target.dataset.a;
    if (a === 'copy') { await navigator.clipboard.writeText(json()); e.target.textContent = 'Copied!'; setTimeout(() => (e.target.textContent = 'Copy hotspots.json'), 1500); }
    if (a === 'dl') { const l = el('a'); l.href = URL.createObjectURL(new Blob([json()], { type: 'application/json' })); l.download = 'hotspots.json'; l.click(); }
  });
}
