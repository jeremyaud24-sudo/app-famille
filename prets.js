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

VUES.prets = function () {
  if (!etat.prets.length) return `<section class="carte"><h2>Vos prêts</h2><p class="mut">Suivez le capital restant dû, les intérêts et la date de fin, et soyez alerté quand un rachat ou une renégociation peut faire baisser le coût.</p>
    <button class="btn" data-act="ouvrir" data-sheet="pret">Ajouter un prêt</button></section>`;
  const p = etat.prets.find(x => x.id === pretSel) || etat.prets[0];
  pretSel = p.id;
  const E = etatPret(p), c = cfgPret();
  const chips = etat.prets.length > 1 ? `<div class="chips" role="group" aria-label="Choisir un prêt">${etat.prets.map(x => `<button data-act="pret-sel" data-id="${x.id}" aria-pressed="${x.id === p.id}">${esc(x.nom)}</button>`).join('')}</div>` : '';
  const actions = `<div class="rangee"><button class="btn sec" data-act="ouvrir" data-sheet="pret" data-id="${p.id}">Modifier</button><button class="btn danger" data-act="pret-del" data-id="${p.id}">Supprimer</button></div>`;
  if (!E.ok) return `${chips}<section class="carte"><h2>${esc(p.nom)}</h2><p class="mut">Les données ne permettent pas de calculer l’échéancier : la mensualité ne couvre pas les intérêts. Vérifiez le taux, la durée et la mensualité.</p>${actions}</section>`;

  const assur = p.assurance || 0, pcRembourse = Math.min(100, (p.capital - E.crd) / p.capital * 100);
  const A = analyseRachat(p, E);
  const lignesTab = (s, nom, desc) => s ? `<tr><td><b>${nom}</b><br><small>${desc}</small></td><td>${eur(s.frais)}</td><td>${eur(s.Mn)}</td><td style="color:var(--${s.net > 0 ? 'ok' : 'bad'})"><b>${eur(s.net)}</b></td><td>${isFinite(s.rentab) ? s.rentab + ' mois' : '—'}</td></tr>` : '';
  let blocRachat;
  if (!A) blocRachat = `<p class="mut">Renseignez le taux actuellement proposé pour votre durée restante pour estimer une économie.</p>`;
  else {
    const t = A.best ? { ok: `Un taux de ${tx2(c.marche)} % ferait économiser environ ${eur(A.best.net)} net de frais (${eur(A.best.gainMensuel)} par mois).`, warn: `Gain net estimé : ${eur(A.best.net)}. À étudier avec des devis réels.`, '': A.ecart <= 0 ? 'Votre taux est inférieur à celui du marché : un rachat ferait payer plus cher.' : 'Les frais ou un écart de taux trop faible mangent le gain.' }[A.statut[0]] : '';
    blocRachat = `<div class="cons"><span class="pill ${A.statut[0]}">${A.statut[1]}</span><p>${esc(t)} Écart de taux : ${A.ecart.toFixed(2).replace('.', ',')} point${Math.abs(A.ecart) >= 2 ? 's' : ''}.</p></div>
      <div class="defile"><table class="tab"><tr class="mut"><td>Option</td><td>Frais</td><td>Mensualité</td><td>Gain net</td><td>Rentabilisé</td></tr>
        ${lignesTab(A.reneg, 'Renégociation', 'avenant avec votre banque')}${lignesTab(A.rachat, 'Rachat', 'autre banque, indemnité estimée ' + eur(A.ira))}</table></div>`;
  }
  const X = Math.min(c.anticipe || 0, E.crd);
  let anticipe = '';
  if (X > 0 && E.prochaine) {
    const np = planDepuis(E.crd - X, p.taux, E.M, E.prochaine.date, E.k + 1);
    anticipe = `<div class="kv"><span>Intérêts économisés</span><b>${eur(E.interetsRestants - somme(np.lignes, l => l.interets))}</b></div>
      <div class="kv"><span>Échéances en moins</span><b>${E.restant.length - np.lignes.length}</b></div>
      <div class="kv"><span>Nouvelle fin</span><b>${np.lignes.length ? fmtMois(np.lignes[np.lignes.length - 1].date) : 'Soldé'}</b></div>`;
  }
  const pts = [{ label: p.debut, v: [p.capital, 0] }];
  let cum = 0;
  E.lignes.forEach((l, i) => { cum += l.interets; if ((i + 1) % 12 === 0 || i === E.lignes.length - 1) pts.push({ label: l.date, v: [l.crd, cum] }); });
  const parAn = {};
  E.lignes.forEach(l => { const y = l.date.slice(0, 4); (parAn[y] = parAn[y] || { i: 0, c: 0, crd: 0 }); parAn[y].i += l.interets; parAn[y].c += l.capital; parAn[y].crd = l.crd; });

  return `${chips}
    <section class="hero"><p class="hero-lbl">Capital restant dû · ${esc(p.nom)}</p><p class="hero-val">${eur(E.crd)}</p>
      <div class="jauge" style="background:color-mix(in srgb,var(--pri-ink) 25%,transparent)"><i style="width:${pcRembourse}%;background:var(--pri-ink)"></i></div>
      <p class="hero-sub">${pc(pcRembourse)} remboursé sur ${eur(p.capital)} · fin ${fmtMois(E.fin)}</p></section>
    <section class="carte"><h2>Opportunité de rachat</h2>${blocRachat}
      <details><summary>Hypothèses (taux du marché et frais)</summary><div class="formulaire" style="padding-top:8px">
        ${fld('Taux proposé aujourd’hui pour votre durée restante (%)', `<input type="number" step="0.01" min="0" inputmode="decimal" data-pretcfg="marche" value="${c.marche || ''}">`)}
        <small>${c.maj ? `Mis à jour le ${fmtDate(c.maj)}.` : 'Non renseigné.'} Taux négociés observés en octobre 2026 : autour de 3,5 à 3,7 % sur 20 à 25 ans, hors assurance.</small>
        <div class="duo">${fld('Frais de dossier (€)', `<input type="number" step="50" min="0" inputmode="decimal" data-pretcfg="dossier" value="${c.dossier}">`)}${fld('Garantie et mainlevée (€)', `<input type="number" step="50" min="0" inputmode="decimal" data-pretcfg="garantie" value="${c.garantie}">`)}</div>
        ${fld('Frais d’avenant de renégociation (€)', `<input type="number" step="50" min="0" inputmode="decimal" data-pretcfg="avenant" value="${c.avenant}">`)}
        <small>Frais indicatifs à remplacer par ceux d’un devis. L’indemnité de remboursement anticipé est estimée au plus faible de 6 mois d’intérêts et 3 % du capital restant dû (à vérifier dans votre contrat). L’assurance emprunteur n’est pas incluse : la changer peut aussi faire économiser.</small></div></details></section>
    <section class="carte"><h2>Votre prêt</h2>
      <div class="kv"><span>Taux</span><b>${tx2(p.taux)} %</b></div>
      <div class="kv"><span>Mensualité${assur ? ' (hors assurance)' : ''}</span><b>${eur(E.M)}</b></div>
      ${assur ? `<div class="kv"><span>Assurance</span><b>${eur(assur)}</b></div><div class="kv"><span>Total par mois</span><b>${eur(E.M + assur)}</b></div>` : ''}
      <div class="kv"><span>Échéances restantes</span><b>${E.restant.length}</b></div>
      <div class="kv"><span>Prochaine échéance</span><b>${E.prochaine ? fmtDate(E.prochaine.date) : '—'}</b></div>
      <div class="kv"><span>Intérêts déjà payés</span><b>${eur(E.interetsPayes)}</b></div>
      <div class="kv"><span>Intérêts restants</span><b>${eur(E.interetsRestants)}</b></div>
      <div class="kv"><span>Coût total des intérêts</span><b>${eur(E.interetsPayes + E.interetsRestants)}</b></div></section>
    <section class="carte"><h2>Évolution</h2>${grapheLigne('pret' + p.id, pts, [{ nom: 'Capital restant dû', c: '--c1' }, { nom: 'Intérêts cumulés', c: '--c2', dash: '5 4' }], 'Capital restant dû et intérêts cumulés', fmtMois)}</section>
    <section class="carte"><h2>Remboursement anticipé</h2><p class="mut">Simulez un versement exceptionnel en gardant la même mensualité : la durée raccourcit.</p>
      ${fld('Montant remboursé (€)', `<input type="number" step="500" min="0" inputmode="decimal" data-pretcfg="anticipe" value="${c.anticipe || ''}">`)}${anticipe}
      <small>Des indemnités peuvent s’appliquer selon votre contrat.</small></section>
    <section class="carte"><h2>Échéancier par année</h2>${vueTable(['Année', 'Intérêts', 'Capital', 'Reste dû'], Object.entries(parAn).map(([y, v]) => [y, eur(v.i), eur(v.c), eur(v.crd)]))}</section>
    ${actions}`;
};

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
