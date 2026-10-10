'use strict';
// Graphiques SVG sans dépendance : courbe (historique) et barres groupées (budget).
// Couleurs : --c1 (teal) et --c2 (ambre), validées daltonisme/contraste en clair et en sombre.

const GRAPHES = {};
const eurCourt = n => Math.round(n).toLocaleString('fr-FR') + ' €';
const fmtCourt = s => { const d = parse(s); return `${d.getDate()} ${MOIS[d.getMonth()].slice(0, 4)}.`; };
const cleLegende = s => `<li><i class="cle" style="${s.dash ? `background:repeating-linear-gradient(90deg,var(${s.c}) 0 5px,transparent 5px 8px)` : `background:var(${s.c})`}"></i>${esc(s.nom)}</li>`;

function vueTable(entetes, lignes) {
  return `<details class="tabledata"><summary>Voir les données</summary><div class="defile"><table class="tab"><thead><tr class="mut">${entetes.map(h => `<td>${esc(h)}</td>`).join('')}</tr></thead>
    <tbody>${lignes.map(l => `<tr>${l.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}

function grapheLigne(id, pts, series, titre, fmtX = fmtCourt, fmtV = eurCourt) {
  const W = 340, H = 190, L = 50, R = 12, T = 10, B = 26;
  const tous = pts.flatMap(p => p.v);
  let lo = Math.min(...tous), hi = Math.max(...tous);
  if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
  const pad = (hi - lo) * 0.15; const positif = Math.min(...tous) >= 0; lo -= pad; hi += pad;
  if (positif) lo = Math.max(0, lo);
  const X = i => L + (pts.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (pts.length - 1));
  const Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const ticks = [lo, (lo + hi) / 2, hi];
  GRAPHES[id] = { pts, series, W, L, R, X, fmtX, fmtV };
  const chemins = series.map((s, k) => {
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.v[k]).toFixed(1)}`).join(' ');
    const dernier = pts.length - 1;
    return `<path d="${d}" fill="none" stroke="var(${s.c})" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>
      <circle cx="${X(dernier).toFixed(1)}" cy="${Y(pts[dernier].v[k]).toFixed(1)}" r="4" fill="var(${s.c})" stroke="var(--surf)" stroke-width="2"/>`;
  }).join('');
  return `<figure class="graphe"><figcaption class="mut">${esc(titre)}</figcaption>
    <ul class="legende">${series.map(cleLegende).join('')}</ul>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(titre)}">
      ${ticks.map(t => `<line x1="${L}" x2="${W - R}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${(Y(t) + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--mut)">${fmtV(t)}</text>`).join('')}
      <text x="${L}" y="${H - 6}" font-size="10" fill="var(--mut)">${fmtX(pts[0].label)}</text>
      <text x="${W - R}" y="${H - 6}" font-size="10" fill="var(--mut)" text-anchor="end">${fmtX(pts[pts.length - 1].label)}</text>
      ${chemins}
      <line id="${id}-x" y1="${T}" y2="${H - B}" stroke="var(--mut)" stroke-width="1" visibility="hidden"/>
      <rect data-graphe="${id}" x="${L}" y="0" width="${W - L - R}" height="${H - B}" fill="transparent"/>
    </svg>
    ${vueTable(['Date', ...series.map(s => s.nom)], pts.map(p => [fmtX(p.label), ...p.v.map(fmtV)]))}</figure>`;
}

function grapheBarres(id, mois, series, titre, fmtV = eurCourt) {
  const W = 340, H = 190, L = 50, R = 8, T = 10, B = 26;
  const max = Math.max(1, ...mois.flatMap(m => m.v)) * 1.1;
  const Y = v => T + (1 - v / max) * (H - T - B), base = H - B;
  const col = (W - L - R) / mois.length, bw = series.length === 1 ? Math.min(22, col - 8) : Math.min(18, col / 2 - 3);
  const barre = (x, v) => {
    const y = Y(v), h = base - y; if (h < 0.5) return '';
    const r = Math.min(4, h / 2, bw / 2);
    return `d="M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${base} Z"`;
  };
  const corps = mois.map((m, i) => {
    const cx = L + col * (i + .5), tip = JSON.stringify({ titre: m.label, rows: series.map((s, k) => ({ c: s.c, nom: s.nom, val: fmtV(m.v[k]) })) });
    return `${m.v.map((v, k) => { const b = barre(series.length === 1 ? cx - bw / 2 : k ? cx + 1 : cx - bw - 1, v); return b ? `<path ${b} fill="var(${series[k].c})"/>` : ''; }).join('')}
      <text x="${cx}" y="${H - 8}" font-size="10" fill="var(--mut)" text-anchor="middle">${esc(m.court)}</text>
      <rect x="${L + col * i}" y="${T}" width="${col}" height="${H - T - B}" fill="transparent" tabindex="0" data-tip='${esc(tip)}' aria-label="${esc(m.label)}"/>`;
  }).join('');
  return `<figure class="graphe"><figcaption class="mut">${esc(titre)}</figcaption>
    <ul class="legende">${series.map(cleLegende).join('')}</ul>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(titre)}">
      ${[0, max / 2, max].map(t => `<line x1="${L}" x2="${W - R}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" stroke="var(--line)"/><text x="${L - 6}" y="${(Y(t) + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--mut)">${fmtV(t)}</text>`).join('')}
      ${corps}</svg>
    ${vueTable(['Mois', ...series.map(s => s.nom)], mois.map(m => [m.label, ...m.v.map(fmtV)]))}</figure>`;
}

// ---------- Infobulle (survol et focus clavier) ----------
let tipEl;
function poserTip(info, x, y) {
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl); }
  tipEl.textContent = '';
  const t = document.createElement('div'); t.className = 'tip-titre'; t.textContent = info.titre; tipEl.appendChild(t);
  info.rows.forEach(r => {
    const l = document.createElement('div'); l.className = 'tip-ligne';
    const k = document.createElement('i'); k.className = 'cle'; k.style.background = `var(${r.c})`;
    const n = document.createElement('span'); n.textContent = r.nom;
    const v = document.createElement('b'); v.textContent = r.val;
    l.append(k, n, v); tipEl.appendChild(l);
  });
  tipEl.hidden = false;
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  tipEl.style.left = Math.max(8, Math.min(innerWidth - w - 8, x - w / 2)) + 'px';
  tipEl.style.top = Math.max(8, y - h - 14) + 'px';
}
function cacherTip() {
  if (tipEl) tipEl.hidden = true;
  document.querySelectorAll('[id$="-x"]').forEach(l => l.setAttribute('visibility', 'hidden'));
}
function survolLigne(e, hit) {
  const g = GRAPHES[hit.dataset.graphe]; if (!g) return;
  const svg = hit.ownerSVGElement, r = svg.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * g.W;
  let best = 0, d = Infinity;
  g.pts.forEach((_, i) => { const dd = Math.abs(g.X(i) - x); if (dd < d) { d = dd; best = i; } });
  const l = document.getElementById(hit.dataset.graphe + '-x');
  l.setAttribute('x1', g.X(best)); l.setAttribute('x2', g.X(best)); l.setAttribute('visibility', 'visible');
  poserTip({ titre: g.fmtX(g.pts[best].label), rows: g.series.map((s, k) => ({ c: s.c, nom: s.nom, val: g.fmtV(g.pts[best].v[k]) })) },
    r.left + g.X(best) / g.W * r.width, e.clientY || r.top + 40);
}
document.addEventListener('pointermove', e => {
  const hit = e.target.closest?.('[data-graphe]');
  if (hit) return survolLigne(e, hit);
  const t = e.target.closest?.('[data-tip]');
  if (t) poserTip(JSON.parse(t.dataset.tip), e.clientX, e.clientY); else cacherTip();
});
document.addEventListener('pointerleave', cacherTip, true);
document.addEventListener('focusin', e => {
  const t = e.target.closest?.('[data-tip]'); if (!t) return;
  const r = t.getBoundingClientRect(); poserTip(JSON.parse(t.dataset.tip), r.left + r.width / 2, r.top + 30);
});
document.addEventListener('focusout', cacherTip);
