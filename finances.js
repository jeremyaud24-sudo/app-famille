'use strict';
// Prévision de trésorerie, alertes de budget et patrimoine net.

function cfgTreso() {
  const d = { solde: null, seuil: 500, courantes: null, maj: ''}, o = etat.treso || (etat.treso = {});
  for (const k in d) if (o[k] === undefined) o[k] = d[k];
  return o;
}
function cfgPat() {
  const d = { maison: 0, epargne: 0, autres: 0, inflation: 2, epargneTaux: 2 }, o = etat.pat || (etat.pat = {});
  for (const k in d) if (o[k] === undefined) o[k] = d[k];
  return o;
}

// ---------- Trésorerie ----------
// Charges et revenus récurrents à venir, jour par jour
function evenementsFinanciers(depuis, jusqua) {
  const out = [];
  let ym = depuis.slice(0, 7);
  const fin = jusqua.slice(0, 7);
  while (ym <= fin) {
    etat.recurrents.filter(r => r.actif !== false).forEach(r => {
      const date = `${ym}-${pad(Math.min(r.jour, 28))}`;
      if (date > depuis && date <= jusqua) out.push({ date, libelle: r.libelle, montant: r.montant });
    });
    ym = moisSuivant(ym);
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
// Dépenses courantes par jour, estimées sur 90 jours (hors opérations marquées récurrentes)
function depenseCourante() {
  const auj = aujourdhui(), lim = iso(ajouteJours(new Date(), -90));
  const l = etat.tx.filter(t => !t.rec && !t.epargne && t.montant < 0 && t.date >= lim && t.date <= auj);
  if (!l.length) return 0;
  const premier = l.reduce((m, t) => (t.date < m ? t.date : m), auj);
  return -somme(l, t => t.montant) / Math.max(30, diffJours(premier, auj) + 1);
}
function projectionTreso(horizon = 45) {
  const c = cfgTreso();
  if (c.solde == null) return null;
  const auj = aujourdhui(), evs = evenementsFinanciers(auj, iso(ajouteJours(parse(auj), horizon)));
  const vj = c.courantes != null ? c.courantes / 30 : depenseCourante();
  let sans = c.solde;
  const pts = [];
  for (let i = 0; i <= horizon; i++) {
    const d = iso(ajouteJours(parse(auj), i));
    if (i) sans += somme(evs.filter(e => e.date === d), e => e.montant);
    pts.push({ label: d, v: [sans - vj * i, sans] });
  }
  const bas = pts.reduce((m, p) => (p.v[0] < m.v[0] ? p : m), pts[0]);
  const neg = pts.find(p => p.v[0] < 0);
  return { pts, evs, vj, bas, neg };
}
function alertesTreso() {
  const c = cfgTreso(), P = projectionTreso();
  if (!P) return [];
  const prochainSalaire = P.evs.find(e => e.montant > 0 && (!P.neg || e.date > P.neg.label));
  const suite = prochainSalaire ? ` Prochain revenu : ${prochainSalaire.libelle} le ${fmtDate(prochainSalaire.date)}.` : '';
  if (P.neg) return [['bad', `Solde négatif prévu le ${fmtDate(P.neg.label)} (${eur(P.neg.v[0])}).${suite}`]];
  if (P.bas.v[0] < c.seuil) return [['warn', `Solde bas prévu le ${fmtDate(P.bas.label)} : ${eur(P.bas.v[0])}, sous votre seuil de ${eur(c.seuil)}.${suite}`]];
  return [['ok', `Aucun découvert prévu sur 45 jours. Point le plus bas : ${eur(P.bas.v[0])} le ${fmtDate(P.bas.label)}.`]];
}
function alertesBudget() {
  const out = [], mois = aujourdhui().slice(0, 7), n = new Date(), jm = n.getDate(), nbJ = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
  const tx = etat.tx.filter(t => t.date.startsWith(mois) && t.montant < 0 && !t.epargne);
  Object.entries(etat.plafonds).filter(([, p]) => p > 0).forEach(([cat, p]) => {
    const l = tx.filter(t => t.cat === cat), v = -somme(l, t => t.montant);
    const fixe = -somme(l.filter(t => t.rec), t => t.montant), variable = v - fixe;
    if (v > p) out.push([`${cat} : plafond dépassé (${eur(v)} sur ${eur(p)})`, 'Budget', 'bad', 'budget']);
    else if (v >= 0.8 * p) out.push([`${cat} : ${Math.round(v / p * 100)} % du plafond du mois`, 'Budget', 'warn', 'budget']);
    else if (jm >= 7 && fixe + variable / jm * nbJ > p * 1.1) out.push([`${cat} : au rythme actuel, le plafond sera dépassé`, 'Rythme', 'warn', 'budget']);
  });
  alertesTreso().filter(a => a[0] !== 'ok').forEach(([cls, t]) => out.push([t, 'Trésorerie', cls, 'budget']));
  return out;
}

function bTreso() {
  const c = cfgTreso(), P = projectionTreso(), al = alertesTreso();
  const SEV = { bad: 'Important', warn: 'À surveiller', ok: 'Bien' };
  return `<section class="carte"><h2>Prévision de trésorerie</h2>
    ${fld('Solde actuel du compte courant (€)', `<input type="number" step="1" inputmode="decimal" data-treso="solde" value="${c.solde ?? ''}" placeholder="ex. 2 150">`)}
    <small>${c.maj ? `Saisi le ${fmtDate(c.maj)}. ` : ''}Mettez-le à jour de temps en temps : la prévision part de ce solde.</small>
    ${P ? `${al.map(([cls, t]) => `<div class="cons"><span class="pill ${cls}">${SEV[cls]}</span><p>${esc(t)}</p></div>`).join('')}
      ${grapheLigne('treso', P.pts, [{ nom: 'Avec dépenses courantes estimées', c: '--c1' }, { nom: 'Charges et revenus connus', c: '--c2', dash: '5 4' }], 'Solde prévu sur 45 jours')}
      <details><summary>Prochains mouvements et hypothèses</summary>
        <ul class="liste">${P.evs.slice(0, 10).map(e => `<li class="rang" style="min-height:44px"><span class="rang-txt">${esc(e.libelle)}<small>${fmtDate(e.date)}</small></span><b class="num" style="color:var(--${e.montant < 0 ? 'bad' : 'ok'})">${eur(e.montant)}</b></li>`).join('') || '<li class="vide">Aucune opération récurrente à venir.</li>'}</ul>
        <div class="duo" style="padding-top:8px">${fld('Seuil d’alerte (€)', `<input type="number" step="50" inputmode="decimal" data-treso="seuil" value="${c.seuil}">`)}${fld('Dépenses courantes par mois (€)', `<input type="number" step="50" inputmode="decimal" data-treso="courantes" value="${c.courantes ?? ''}" placeholder="${Math.round(P.vj * 30)} (auto)">`)}</div>
        <small>Dépenses courantes : courses, loisirs, carburant… Estimation automatique d'après vos opérations des 90 derniers jours hors récurrentes ; saisissez un montant pour la remplacer.${P.vj === 0 ? ' Aucune dépense courante enregistrée : la courbe ne montre pour l’instant que les charges fixes.' : ''}</small></details>`
      : '<p class="vide">Saisissez votre solde pour voir si une période sans salaire met votre compte sous tension.</p>'}</section>`;
}
function alertesCarte() {
  const l = alertesBudget().filter(a => a[1] !== 'Trésorerie');
  if (!l.length) return '';
  return `<section class="carte"><h2>Alertes</h2>${l.map(([t, tag, cls]) => `<div class="cons"><span class="pill ${cls}">${esc(tag)}</span><p>${esc(t)}</p></div>`).join('')}</section>`;
}

// ---------- Patrimoine net ----------
function patrimoineCalc() {
  const pat = cfgPat(), titres = etat.pf.length && typeof pfCalc === 'function' ? pfCalc().total : 0;
  const liq = typeof cfg === 'function' ? cfg().liquidites || 0 : 0;
  const prets = etat.prets.map(p => { const E = etatPret(p); return { nom: p.nom, crd: E.ok ? E.crd : 0 }; });
  const actifs = [
    ['Logement', pat.maison], ['Bourse (titres et liquidités)', titres + liq], ['Épargne', somme(etat.epargne || [], c => c.solde || 0) + pat.epargne],
    ['Objectifs d’épargne', somme(etat.objectifs, o => o.actuel || 0)], ['Compte courant', Math.max(0, cfgTreso().solde || 0)], ['Autres actifs', pat.autres],
  ].filter(([, v]) => v > 0);
  const totalA = somme(actifs, a => a[1]), dettes = somme(prets, p => p.crd);
  return { actifs, prets, totalA, dettes, net: totalA - dettes };
}
function majPatHisto() {
  const P = patrimoineCalc();
  if (P.totalA === 0 && P.dettes === 0) return;
  etat.patHisto = etat.patHisto || [];
  const d = aujourdhui(), e = { date: d, net: Math.round(P.net), dettes: Math.round(P.dettes) };
  const i = etat.patHisto.findIndex(x => x.date === d);
  if (i >= 0) etat.patHisto[i] = e; else etat.patHisto.push(e);
  etat.patHisto.sort((a, b) => a.date.localeCompare(b.date));
  if (etat.patHisto.length > 900) etat.patHisto = etat.patHisto.slice(-900);
}
VUES.patrimoine = function () {
  const P = patrimoineCalc(), pat = cfgPat(), COUL = ['#0b8f78', '#d98a1c', '#3b73e0', '#c23b63', '#8a5cd6', '#7b8a84'];
  const pts = (etat.patHisto || []).map(h => ({ label: h.date, v: [h.net, h.dettes] }));
  const maison = pat.maison, ltv = maison > 0 ? P.dettes / maison * 100 : null;
  return `
    <section class="hero"><p class="hero-lbl">Patrimoine net</p><p class="hero-val">${eur(P.net)}</p>
      <p class="hero-sub">Actifs ${eur(P.totalA)} · Dettes ${eur(P.dettes)}</p></section>
    ${P.actifs.length ? `<section class="carte"><h2>Composition des actifs</h2>
      <div class="empile" role="img" aria-label="Composition des actifs">${P.actifs.map(([n, v], i) => `<i style="flex:${v};background:${COUL[i]}" title="${esc(n)}"></i>`).join('')}</div>
      <ul class="legende">${P.actifs.map(([n, v], i) => `<li><i style="background:${COUL[i]}"></i>${esc(n)} <b class="num">${pc(v / P.totalA * 100)}</b></li>`).join('')}</ul>
      ${P.actifs.map(([n, v]) => `<div class="kv"><span>${esc(n)}</span><b>${eur(v)}</b></div>`).join('')}</section>` : ''}
    <section class="carte"><div class="carte-tete"><h2>Épargne</h2><button class="lien" data-act="ouvrir" data-sheet="epargne">Ajouter un compte</button></div>
      ${(etat.epargne || []).length ? `<ul class="liste">${etat.epargne.map(c => `<li class="rang"><button class="rang-btn" data-act="ouvrir" data-sheet="epargne" data-id="${c.id}" aria-label="Modifier ${esc(c.nom)}"><span class="rang-txt"><b>${esc(c.nom)}</b><small>${esc(nomEpargne(c.type))}${c.taux ? ' · ' + String(c.taux).replace('.', ',') + ' %' : ''}${c.mensuel ? ' · +' + eur(c.mensuel) + '/mois' : ''}</small></span><b class="num">${eur(c.solde || 0)}</b></button>
        <button class="btn sec" data-act="epargne-versement" data-id="${c.id}" style="min-height:36px;padding:0 12px">Versement</button></li>`).join('')}</ul>
        <div class="kv"><span>Total des comptes</span><b>${eur(somme(etat.epargne, c => c.solde || 0))}</b></div>
        ${somme(etat.epargne, c => (c.solde || 0) * (c.taux || 0) / 100) > 0 ? `<div class="kv"><span>Intérêts annuels estimés</span><b>${eur(somme(etat.epargne, c => (c.solde || 0) * (c.taux || 0) / 100))}</b></div>` : ''}`
        : '<p class="vide">Ajoutez vos livrets et placements (Livret A, assurance-vie, PEL…) pour suivre votre épargne et chaque versement.</p>'}
      ${pat.epargne > 0 ? `<div class="kv"><span>Épargne non détaillée</span><span><b>${eur(pat.epargne)}</b> <button class="lien" data-act="ouvrir" data-sheet="epargne" data-reprise="1">Détailler</button></span></div>` : ''}</section>
    ${carteProjEpargne()}
    <section class="carte"><h2>Dettes</h2>
      ${P.prets.map(p => `<div class="kv"><span>${esc(p.nom)} (capital restant dû)</span><b>${eur(p.crd)}</b></div>`).join('') || '<p class="vide">Aucun prêt suivi. Ajoutez-le dans l’onglet Prêts.</p>'}
      ${ltv != null ? `<small>Les prêts représentent ${pc(ltv)} de la valeur du logement.</small>` : ''}</section>
    <section class="carte"><h2>Évolution</h2>
      ${pts.length >= 2 ? grapheLigne('patrimoine', pts, [{ nom: 'Patrimoine net', c: '--c1' }, { nom: 'Dettes', c: '--c2', dash: '5 4' }], 'Patrimoine net et dettes')
        : '<p class="vide">Un point est enregistré chaque jour d’utilisation. La courbe apparaîtra dans quelques jours.</p>'}</section>
    <section class="carte"><h2>Mes valeurs</h2>
      ${fld('Valeur estimée du logement (€)', `<input type="number" step="1000" inputmode="decimal" data-pat="maison" value="${pat.maison || ''}">`)}
      <div class="duo">${fld('Épargne non détaillée (€)', `<input type="number" step="100" inputmode="decimal" data-pat="epargne" value="${pat.epargne || ''}">`)}${fld('Autres actifs (€)', `<input type="number" step="100" inputmode="decimal" data-pat="autres" value="${pat.autres || ''}">`)}</div>
      <small>Les autres valeurs viennent de l’application : bourse, comptes d’épargne, objectifs, solde du compte courant et prêts. Estimez le logement avec prudence, à partir de ventes récentes dans votre quartier.</small></section>`;
};
function changeFin(t) {
  if (t.dataset.treso) {
    const c = cfgTreso(), k = t.dataset.treso;
    c[k] = t.value === '' ? null : Number(t.value);
    if (k === 'seuil' && c.seuil == null) c.seuil = 500;
    if (k === 'solde') c.maj = aujourdhui();
  } else cfgPat()[t.dataset.pat] = Number(t.value) || 0;
  sauver(); rendre();
}

// ---------- Comptes d'épargne ----------
const TYPES_EPARGNE = [['livretA', 'Livret A'], ['ldds', 'LDDS'], ['lep', 'LEP'], ['pel', 'PEL'], ['av', 'Assurance-vie'], ['per', 'PER'], ['cat', 'Compte à terme'], ['autre', 'Autre']];
const nomEpargne = k => (TYPES_EPARGNE.find(t => t[0] === k) || [0, 'Autre'])[1];
SHEETS.epargne = d => {
  const c = d.id ? (etat.epargne || []).find(x => x.id === d.id) : null, reprise = !c && d.reprise === '1';
  const hist = c && c.mouvements && c.mouvements.length ? `<h3 class="mut" style="margin:0;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em">Derniers mouvements</h3><ul class="liste">${[...c.mouvements].reverse().slice(0, 5).map(m => `<li class="rang" style="min-height:38px"><span class="rang-txt">${fmtDate(m.date)}</span><b class="num" style="color:var(--${m.montant < 0 ? 'bad' : 'ok'})">${m.montant > 0 ? '+' : ''}${eur(m.montant)}</b></li>`).join('')}</ul>` : '';
  return { titre: c ? 'Modifier le compte' : 'Ajouter un compte d’épargne', corps: `<form class="formulaire" data-form="epargne"><input type="hidden" name="id" value="${c ? c.id : ''}"><input type="hidden" name="reprise" value="${reprise ? '1' : ''}">
    ${fld('Nom', `<input name="nom" required autocomplete="off" value="${esc(c ? c.nom : '')}" placeholder="Livret A de Jeremy">`)}
    ${fld('Type', `<select name="type">${optSel(TYPES_EPARGNE, c ? c.type : 'livretA')}</select>`)}
    <div class="duo">${fld('Taux annuel (%)', `<input type="number" name="taux" min="0" step="0.01" inputmode="decimal" value="${c && c.taux ? c.taux : ''}">`)}${fld('Versement mensuel (€)', `<input type="number" name="mensuel" min="0" step="10" inputmode="decimal" value="${c && c.mensuel ? c.mensuel : ''}">`)}</div>
    ${fld(reprise ? 'Montant à affecter à ce compte (€)' : 'Solde (€)', `<input type="number" name="solde" step="0.01" required inputmode="decimal" value="${c ? c.solde : reprise ? cfgPat().epargne : ''}">`)}
    ${reprise ? '<small>Ce montant sera retiré de l’épargne non détaillée.</small>' : ''}
    ${hist}
    <button class="btn plein">Enregistrer</button></form>` };
};
FORMS.epargne = f => {
  const o = { nom: f.nom.value.trim(), type: f.type.value, taux: Number(f.taux.value) || 0, mensuel: Number(f.mensuel.value) || 0, solde: Number(f.solde.value) || 0 };
  etat.epargne = etat.epargne || [];
  const i = etat.epargne.findIndex(x => x.id === f.id.value);
  if (i >= 0) {
    const ecart = o.solde - (etat.epargne[i].solde || 0);
    if (ecart) (etat.epargne[i].mouvements = etat.epargne[i].mouvements || []).push({ date: aujourdhui(), montant: ecart, ajustement: true });
    Object.assign(etat.epargne[i], o);
  } else {
    etat.epargne.push({ id: uid(), ...o, mouvements: [] });
    if (f.reprise.value === '1') cfgPat().epargne = Math.max(0, cfgPat().epargne - o.solde);
  }
};
ACTIONS['epargne-del'] = el => { etat.epargne = etat.epargne.filter(x => x.id !== el.dataset.id); };
ACTIONS['epargne-versement'] = async el => {
  const c = etat.epargne.find(x => x.id === el.dataset.id);
  const r = await dialogue({ titre: `Versement : ${c.nom}`, texte: `Solde actuel : ${eur(c.solde || 0)}. Saisissez un montant positif pour un versement, négatif pour un retrait.`, champs: [{ nom: 'm', label: 'Montant (€)', valeur: '' }], ok: 'Enregistrer' });
  const m = r && Number(String(r.m).replace(',', '.'));
  if (!m) return false;
  c.solde = (c.solde || 0) + m;
  (c.mouvements = c.mouvements || []).push({ date: aujourdhui(), montant: m });
  info(`${m > 0 ? 'Versement' : 'Retrait'} de ${eur(Math.abs(m))} enregistré.`);
};

// ---------- Projection de l'épargne ----------
// Capitalisation annuelle des intérêts, versements mensuels en fin de mois. Taux constants, avant impôts et prélèvements sociaux.
function projectionEpargne(horizon = 15) {
  const pat = cfgPat(), infl = (pat.inflation || 0) / 100;
  const comptes = [...(etat.epargne || []).map(c => ({ nom: c.nom, solde: c.solde || 0, taux: c.taux || 0, mens: c.mensuel || 0 }))];
  if (pat.epargne > 0) comptes.push({ nom: 'Épargne non détaillée', solde: pat.epargne, taux: pat.epargneTaux || 0, mens: 0 });
  if (!comptes.length) return null;
  const annees = Array.from({ length: horizon + 1 }, (_, y) => y);
  const sim = c => { // valeur et versements cumulés à chaque fin d'année
    const rm = Math.pow(1 + c.taux / 100, 1 / 12) - 1, v = [c.solde], vers = [0];
    let s = c.solde;
    for (let m = 1; m <= horizon * 12; m++) { s = s * (1 + rm) + c.mens; if (m % 12 === 0) { v.push(s); vers.push(c.mens * m); } }
    return { v, vers };
  };
  const res = comptes.map(c => ({ ...c, ...sim(c) }));
  const total = annees.map(y => somme(res, r => r.v[y])), versements = annees.map(y => somme(res, r => r.vers[y])), initial = somme(comptes, c => c.solde);
  return { annees, comptes: res, total, versements, initial, infl };
}
function carteProjEpargne() {
  const P = projectionEpargne(), pat = cfgPat();
  if (!P) return `<section class="carte"><h2>Projection de l’épargne</h2><p class="vide">Ajoutez un compte d’épargne avec son taux et son versement mensuel pour voir ce que vous aurez dans 5, 10 et 15 ans.</p></section>`;
  const an = new Date().getFullYear();
  const pts = P.annees.map(y => ({ label: `${an + y}-12-31`, v: [P.total[y], P.initial + P.versements[y]] }));
  const ligne = y => {
    const reel = P.total[y] / Math.pow(1 + P.infl, y), interets = P.total[y] - P.initial - P.versements[y];
    return `<tr><td><b>${y} ans</b><br><small>${an + y}</small></td><td><b>${eur(P.total[y])}</b></td><td>${eur(P.initial + P.versements[y])}</td><td style="color:var(--ok)">+${eur(interets)}</td><td>${eur(reel)}</td></tr>`;
  };
  return `<section class="carte"><h2>Projection de l’épargne</h2>
    <div class="defile"><table class="tab"><tr class="mut"><td>Horizon</td><td>Épargne</td><td>Versé</td><td>Intérêts</td><td>En € d’aujourd’hui</td></tr>${[5, 10, 15].map(ligne).join('')}</table></div>
    ${grapheLigne('projEpargne', pts, [{ nom: 'Épargne projetée', c: '--c1' }, { nom: 'Montant versé (départ + versements)', c: '--c2', dash: '5 4' }], 'Épargne projetée sur 15 ans', l => l.slice(0, 4))}
    <details><summary>Détail par compte et hypothèses</summary>
      <div class="defile"><table class="tab"><tr class="mut"><td>Compte</td><td>Taux</td><td>Par mois</td><td>5 ans</td><td>10 ans</td><td>15 ans</td></tr>
        ${P.comptes.map(c => `<tr><td>${esc(c.nom)}</td><td>${String(c.taux).replace('.', ',')} %</td><td>${c.mens ? eur(c.mens) : '—'}</td><td>${eur(c.v[5])}</td><td>${eur(c.v[10])}</td><td>${eur(c.v[15])}</td></tr>`).join('')}</table></div>
      <div class="duo" style="padding-top:8px">${fld('Inflation annuelle (%)', `<input type="number" step="0.1" min="0" inputmode="decimal" data-pat="inflation" value="${pat.inflation}">`)}${fld('Rendement de l’épargne non détaillée (%)', `<input type="number" step="0.1" min="0" inputmode="decimal" data-pat="epargneTaux" value="${pat.epargneTaux}">`)}</div>
      <small>Les taux et versements se règlent dans la fiche de chaque compte (touchez-le). Un compte sans taux est compté à 0 %.</small></details>
    <small>Projection théorique : taux et versements constants, intérêts réinvestis, avant impôts, prélèvements sociaux et frais. Les taux des livrets réglementés changent, et les placements en actions ou en unités de compte peuvent perdre de la valeur : ce n’est pas une garantie.</small></section>`;
}
