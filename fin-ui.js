'use strict';
// Composants visuels de la rubrique Argent : courbes d'aire, barres verticales, variations, périodes.

let finSeq = 0;
const PERIODES = [['1s', '1S', 7], ['1m', '1M', 30], ['3m', '3M', 90], ['1a', '1A', 365], ['tout', 'Max', 99999]];
const periodesHtml = (courante, act) => `<div class="periodes" role="group" aria-label="Période">${PERIODES.map(([k, n]) => `<button data-act="${act}" data-v="${k}" aria-pressed="${courante === k}">${n}</button>`).join('')}</div>`;
const dansPeriode = (hist, per) => { const j = PERIODES.find(p => p[0] === per)[2], lim = iso(ajouteJours(new Date(), -j)); return hist.filter(h => h.date >= lim); };
const eurSigne = n => `${n >= 0 ? '+' : '−'}${eur(Math.abs(n))}`;
const pcSigne = n => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2).replace('.', ',')} %`;
const deltaFin = (n, texte, inverse = false) => `<span class="delta ${(n >= 0) !== inverse ? 'ok' : 'bad'}">${n >= 0 ? '▲' : '▼'} ${texte}</span>`;

// Courbe lissée (Catmull-Rom → Bézier)
function lisse(pts) {
  if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, t = 0.16;
    d += ` C${(p1[0] + (p2[0] - p0[0]) * t).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) * t).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) * t).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) * t).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
// Courbe d'aire sans axes : le chiffre est dans la tuile, la courbe donne la tendance
function sparkline(vals, { h = 96, couleur = '--c1', marqueur = null } = {}) {
  if (!vals || vals.length < 2) return '';
  const W = 300, pad = 6, id = 'sp' + (++finSeq);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
  const X = i => pad + i * (W - 2 * pad) / (vals.length - 1), Y = v => pad + 4 + (hi - v) / (hi - lo) * (h - 2 * pad - 8);
  const pts = vals.map((v, i) => [X(i), Y(v)]), fin = pts[pts.length - 1];
  const mk = marqueur != null ? pts[Math.max(0, Math.min(vals.length - 1, marqueur))] : fin;
  return `<svg class="spark" viewBox="0 0 ${W} ${h}" role="img" aria-label="Évolution"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(${couleur})" stop-opacity=".4"/><stop offset="1" stop-color="var(${couleur})" stop-opacity="0"/></linearGradient></defs>
    <path d="${lisse(pts)} L${fin[0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z" fill="url(#${id})"/>
    <path d="${lisse(pts)}" fill="none" stroke="var(${couleur})" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${mk[0].toFixed(1)}" cy="${mk[1].toFixed(1)}" r="4" fill="var(${couleur})" stroke="var(--bg)" stroke-width="2"/></svg>`;
}
// Barres verticales avec pastille sous chaque barre
function barresV(items, h = 120) {
  return `<div class="barresv" style="--h:${h}px">${items.map(it => `<div class="bv" title="${esc(it.titre)}"><div class="bv-piste"><i style="height:${Math.max(5, Math.round(it.part * 100))}%;background:${it.couleur || 'var(--pri)'}"></i></div>${it.pastille}</div>`).join('')}</div>`;
}
const pastilleInit = t => `<span class="av neutre" aria-hidden="true">${esc(String(t).slice(0, 2).toUpperCase())}</span>`;
const videFin = (titre, bouton, sheet) => `<section class="fin-tuile"><span class="t-lbl">${esc(titre)}</span><button class="btn" data-act="ouvrir" data-sheet="${sheet}">${esc(bouton)}</button></section>`;

// Choix d'un montant (solde du compte courant)
ACTIONS['treso-solde'] = async () => {
  const c = cfgTreso();
  const r = await dialogue({ titre: 'Solde du compte courant', champs: [{ nom: 's', label: 'Solde actuel (€)', valeur: c.solde ?? '' }], ok: 'Enregistrer' });
  const v = r && Number(String(r.s).replace(',', '.'));
  if (v == null || isNaN(v)) return false;
  c.solde = v; c.maj = aujourdhui();
};
let patPer = '1a';
ACTIONS.pper = el => { patPer = el.dataset.v; return 'vue'; };
