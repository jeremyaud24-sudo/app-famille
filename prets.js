'use strict';
// Suivi de prêts (échéancier, capital restant dû) et analyse rachat / renégociation.
// Le taux du marché est saisi à la main : l'application n'interroge aucune source externe.

let pretSel = '';
function cfgPret() {
  const d = { marche: 0, maj: '', dossier: 1000, garantie: 1500, avenant: 500, anticipe: 0}, o = etat.pretCfg || (etat.pretCfg = {});
  for (const k in d) if (o[k] === undefined) o[k] = d[k];
  return o;
}
const addMois = (d, m) => {
  const x = new Date(d.getFullYear(), d.getMonth() + m, 1);
  x.setDate(Math.min(d.getDate(), new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
  return x;
};
const tx2 = n => n.toFixed(2).replace('.', ',');
const fmtMois = s => { const d = parse(s); return `${MOIS[d.getMonth()]} ${d.getFullYear()}`; };
const tauxMois = t => t / 1200;
function mensualiteCalc(C, t, n) {
  const r = tauxMois(t);
  return n <= 0 ? 0 : r ? C * r / (1 - Math.pow(1 + r, -n)) : C / n;
}
// Échéancier à partir d'un capital donné, mensualité constante
function planDepuis(crd, t, M, debut, depart = 1) {
  const r = tauxMois(t), lignes = [], d0 = parse(debut);
  let c = crd;
  for (let k = 0; c > 0.005 && k < 1200; k++) {
    const i = c * r;
    let cap = M - i;
    if (cap <= 0) return { lignes, ok: false };
    if (cap > c) cap = c;
    c -= cap;
    lignes.push({ n: depart + k, date: iso(addMois(d0, k)), interets: i, capital: cap, paiement: i + cap, crd: Math.max(0, c) });
  }
  return { lignes, ok: true };
}
function etatPret(p) {
  const M = p.mensualite > 0 ? p.mensualite : mensualiteCalc(p.capital, p.taux, Math.round(p.duree * 12));
  const pl = planDepuis(p.capital, p.taux, M, p.debut);
  if (!pl.ok || !pl.lignes.length) return { ok: false, M };
  const auj = aujourdhui(), k = pl.lignes.filter(l => l.date <= auj).length;
  const payees = pl.lignes.slice(0, k), restant = pl.lignes.slice(k);
  const crd = k ? pl.lignes[k - 1].crd : p.capital;
  return {
    ok: true, M, lignes: pl.lignes, k, payees, restant, crd,
    interetsPayes: somme(payees, l => l.interets), interetsRestants: somme(restant, l => l.interets),
    fin: pl.lignes[pl.lignes.length - 1].date, prochaine: restant[0],
  };
}
// Scénario : refinancer le capital restant sur la durée restante à un nouveau taux
function scenario(E, taux, frais) {
  const n = E.restant.length;
  if (!n || !taux || E.crd <= 0) return null;
  const Mn = mensualiteCalc(E.crd, taux, n), interetsNew = Mn * n - E.crd;
  const brut = E.interetsRestants - interetsNew, net = brut - frais, gainMensuel = E.M - Mn;
  return { Mn, brut, frais, net, gainMensuel, rentab: gainMensuel > 0 ? Math.ceil(frais / gainMensuel) : Infinity };
}
function analyseRachat(p, E) {
  const c = cfgPret();
  if (!c.marche || !E.ok) return null;
  const ira = Math.min(0.03 * E.crd, 6 * E.crd * tauxMois(p.taux));
  const reneg = scenario(E, c.marche, c.avenant);
  const rachat = scenario(E, c.marche, ira + c.dossier + c.garantie);
  const best = [reneg, rachat].filter(Boolean).sort((a, b) => b.net - a.net)[0] || null;
  let statut = ['', 'Pas rentable aujourd’hui'];
  if (best && best.net >= 3000 && best.rentab <= 36) statut = ['ok', 'Opportunité'];
  else if (best && best.net >= 1000 && best.rentab <= 48) statut = ['warn', 'À étudier'];
  return { ira, reneg, rachat, best, statut, ecart: p.taux - c.marche };
}
function pretsAlertes() {
  const c = cfgPret(), out = [];
  etat.prets.forEach(p => {
    const E = etatPret(p), a = E.ok && analyseRachat(p, E);
    if (a && a.statut[0]) out.push([`Prêt « ${p.nom} » : ${a.statut[1].toLowerCase()} (gain net ≈ ${eur(a.best.net)})`, 'Taux', a.statut[0], 'prets']);
  });
  if (etat.prets.length && (!c.maj || diffJours(c.maj, aujourdhui()) > 30)) out.push(['Mettre à jour le taux du marché pour vos prêts', 'À faire', 'pri', 'prets']);
  return out;
}

SHEETS.pret = d => {
  const p = d.id ? etat.prets.find(x => x.id === d.id) : null, v = (k, def = '') => (p && p[k] != null ? p[k] : def);
  return { titre: p ? 'Modifier le prêt' : 'Ajouter un prêt', corps: `<form class="formulaire" data-form="pret"><input type="hidden" name="id" value="${p ? p.id : ''}">
    ${fld('Nom', `<input name="nom" required autocomplete="off" value="${esc(v('nom', 'Prêt maison'))}">`)}
    <div class="duo">${fld('Capital emprunté (€)', `<input type="number" name="capital" step="any" min="1" required inputmode="decimal" value="${v('capital')}">`)}${fld('Taux annuel (%)', `<input type="number" name="taux" step="0.001" min="0" required inputmode="decimal" value="${v('taux')}">`)}</div>
    <div class="duo">${fld('Durée (années)', `<input type="number" name="duree" step="0.5" min="1" required inputmode="decimal" value="${v('duree')}">`)}${fld('1re échéance', `<input type="date" name="debut" required value="${v('debut')}">`)}</div>
    <div class="duo">${fld('Mensualité hors assurance (€)', `<input type="number" name="mensualite" step="0.01" min="0" inputmode="decimal" value="${v('mensualite', '') || ''}">`)}${fld('Assurance par mois (€)', `<input type="number" name="assurance" step="0.01" min="0" inputmode="decimal" value="${v('assurance', '') || ''}">`)}</div>
    <small>Si vous connaissez la mensualité de votre tableau d’amortissement, saisissez-la : le calcul sera plus fidèle. Sinon, elle est déduite du capital, du taux et de la durée.</small>
    <button class="btn plein">Enregistrer</button></form>` };
};
FORMS.pret = f => {
  const o = { nom: f.nom.value.trim(), capital: Number(f.capital.value), taux: Number(f.taux.value), duree: Number(f.duree.value), debut: f.debut.value, mensualite: Number(f.mensualite.value) || 0, assurance: Number(f.assurance.value) || 0 };
  const i = etat.prets.findIndex(x => x.id === f.id.value);
  if (i >= 0) etat.prets[i] = { ...etat.prets[i], ...o }; else { o.id = uid(); etat.prets.push(o); pretSel = o.id; }
};
ACTIONS['pret-sel'] = el => { pretSel = el.dataset.id; return 'vue'; };
ACTIONS['pret-del'] = el => { etat.prets = etat.prets.filter(x => x.id !== el.dataset.id); pretSel = ''; };
function changePret(t) {
  const k = t.dataset.pretcfg, c = cfgPret();
  c[k] = Number(t.value) || 0;
  if (k === 'marche') c.maj = aujourdhui();
  sauver(); rendre();
}
