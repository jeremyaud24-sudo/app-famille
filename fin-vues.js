'use strict';
// Rubrique Argent : budget, patrimoine et prêts, dans un style visuel (tuiles, courbes, barres) avec peu de texte.

const moisPrecedent = ym => { const [y, m] = ym.split('-').map(Number); return iso(new Date(y, m - 2, 1)).slice(0, 7); };
const bilanMois = ym => { const l = etat.tx.filter(t => t.date.startsWith(ym) && !t.epargne); return [somme(l.filter(t => t.montant > 0), t => t.montant), -somme(l.filter(t => t.montant < 0), t => t.montant)]; };
// Solde cumulé jour par jour (hors virements d'épargne)
function cumulMois(ym) {
  const [y, m] = ym.split('-').map(Number), nb = new Date(y, m, 0).getDate(), auj = aujourdhui(), cur = auj.slice(0, 7);
  const dernier = ym === cur ? Number(auj.slice(8)) : ym > cur ? 0 : nb;
  const l = etat.tx.filter(t => t.date.startsWith(ym) && !t.epargne);
  let s = 0; const v = [];
  for (let d = 1; d <= dernier; d++) { const dd = `${ym}-${pad(d)}`; s += somme(l.filter(t => t.date === dd), t => t.montant); v.push(s); }
  return v;
}
const evo = (a, b) => (b > 0 ? (a - b) / b * 100 : null);
const NOM_COURT = { Courses: 'Courses', Logement: 'Logement', Transport: 'Transp.', Santé: 'Santé', Loisirs: 'Loisirs', Enfants: 'Enfants', Autre: 'Autre' };

// ---------- Budget ----------
VUES.budget = function () {
  const [an, mo] = moisBudget.split('-').map(Number), prec = moisPrecedent(moisBudget), mPrec = MOIS[Number(prec.slice(5)) - 1].slice(0, 4);
  const [rev, dep] = bilanMois(moisBudget), [rev0, dep0] = bilanMois(prec), solde = rev - dep, solde0 = rev0 - dep0;
  const tx = etat.tx.filter(t => t.date.startsWith(moisBudget)).sort((a, b) => b.date.localeCompare(a.date));
  const parCat = c => -somme(tx.filter(t => t.cat === c && t.montant < 0 && !t.epargne), t => t.montant);
  const cats = NOMS_CATS.filter(c => c !== 'Revenus').map(c => [c, parCat(c)]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const eRev = evo(rev, rev0), eDep = evo(dep, dep0);
  const c = cfgTreso(), P = projectionTreso(), alT = alertesTreso()[0];
  const alertes = alertesBudget().filter(a => a[1] !== 'Trésorerie');
  const maxCat = Math.max(1, ...cats.slice(0, 5).map(([k, v]) => etat.plafonds[k] ? Math.max(v, etat.plafonds[k]) : v));
  const cumul = cumulMois(moisBudget);
  return `
    <div class="mois-nav"><button class="icone" data-act="mois-budget" data-n="-1" aria-label="Mois précédent">‹</button><b class="cap">${MOIS[mo - 1]} ${an}</b><button class="icone" data-act="mois-budget" data-n="1" aria-label="Mois suivant">›</button></div>
    <section class="fin-tuile grand"><span class="t-lbl">Solde du mois</span>
      <span class="t-ligne"><b class="t-val">${eur(solde)}</b>${rev0 || dep0 ? deltaFin(solde - solde0, eur(Math.abs(solde - solde0))) : ''}</span>
      ${sparkline(cumul, { h: 110 })}</section>
    <div class="fin-grille">
      <section class="fin-tuile"><span class="t-lbl">Revenus</span><b class="t-val">${eur(rev)}</b><span class="t-bas">${eRev != null ? deltaFin(eRev, Math.abs(eRev).toFixed(0) + ' %') + ' vs ' + mPrec + '.' : '&nbsp;'}</span></section>
      <section class="fin-tuile"><span class="t-lbl">Dépenses</span><b class="t-val">${eur(dep)}</b><span class="t-bas">${eDep != null ? deltaFin(eDep, Math.abs(eDep).toFixed(0) + ' %', true) + ' vs ' + mPrec + '.' : '&nbsp;'}</span></section></div>
    <button class="fin-tuile tuile-btn" data-act="treso-solde"><span class="t-lbl">Compte courant</span>
      ${c.solde == null ? '<span class="t-ligne"><b class="t-val">Saisir mon solde</b></span>'
        : `<span class="t-ligne"><b class="t-val">${eur(c.solde)}</b>${alT ? `<span class="pill ${alT[0]}">${alT[0] === 'ok' ? 'Sans découvert' : alT[0] === 'warn' ? 'Solde bas prévu' : 'Découvert prévu'}</span>` : ''}</span>
          ${P ? sparkline(P.pts.map(p => p.v[0]), { h: 80, couleur: alT && alT[0] === 'bad' ? '--bad' : '--c1' }) + `<span class="t-bas">Point bas sur 45 jours : ${eur(P.bas.v[0])} · ${fmtCourt(P.bas.label)}</span>` : ''}`}</button>
    ${alertes.length ? `<section class="fin-tuile"><span class="t-lbl">Alertes</span>${alertes.map(([t, tag, cls]) => `<span class="alerte-ligne"><span class="pill ${cls}">${esc(tag)}</span>${esc(t)}</span>`).join('')}</section>` : ''}
    ${cats.length ? `<section class="fin-tuile"><span class="t-lbl">Dépenses par catégorie</span>
      <div class="rep"><div class="rep-leg"><span class="t-bas">Principale dépense</span><b class="t-nom">${esc(cats[0][0])} · ${dep ? Math.round(cats[0][1] / dep * 100) : 0} %</b></div>
        ${barresV(cats.slice(0, 5).map(([k, v]) => { const p = etat.plafonds[k] || 0; return { part: v / maxCat, titre: `${k} : ${eur(v)}${p ? ' sur ' + eur(p) : ''}`, couleur: p && v > p ? 'var(--bad)' : 'var(--acc)', pastille: `<span class="bv-lbl">${NOM_COURT[k] || k}</span>` }; }), 110)}</div></section>` : ''}
    ${etat.objectifs.length ? `<section class="fin-tuile"><div class="carte-tete"><span class="t-lbl">Objectifs d’épargne</span><button class="lien" data-act="ouvrir" data-sheet="objectif">Ajouter</button></div>
      ${etat.objectifs.map(o => { const part = o.cible ? Math.min(100, (o.actuel || 0) / o.cible * 100) : 0; return `<div class="obj"><div class="bar"><b>${esc(o.nom)}</b><span class="num">${eur(o.actuel || 0)} <span class="mut">/ ${eur(o.cible)}</span></span></div>
        <div class="jauge"><i style="width:${part}%;background:var(--c1)"></i></div>
        <div class="bar"><small>${Math.round(part)} %</small><span><button class="lien" data-act="obj-versement" data-id="${o.id}">Versement</button><button class="icone" data-act="obj-del" data-id="${o.id}" aria-label="Supprimer ${esc(o.nom)}" style="width:36px;height:36px">${ico('x', 16)}</button></span></div></div>`; }).join('')}</section>`
      : `<button class="fin-tuile tuile-btn" data-act="ouvrir" data-sheet="objectif"><span class="t-lbl">Objectifs d’épargne</span><span class="t-ligne"><b class="t-nom">+ Créer un objectif</b></span></button>`}
    <section class="fin-tuile"><span class="t-lbl">Opérations</span><ul class="liste">
      ${tx.slice(0, 40).map(t => `<li class="rang"><button class="rang-btn" data-act="ouvrir" data-sheet="tx" data-id="${t.id}" aria-label="Modifier ${esc(t.libelle)}"><span class="rang-txt">${esc(t.libelle)}<small>${fmtDate(t.date)} · ${esc(t.cat)}${t.rec ? ' · auto' : ''}${t.epargne ? ' · épargne' : ''}</small></span>
        <b class="num" style="color:${t.epargne ? 'var(--mut)' : t.montant < 0 ? 'var(--ink)' : 'var(--ok)'}">${t.montant > 0 ? '+' : ''}${eur(t.montant)}</b></button>
        <button class="icone" data-act="tx-del" data-id="${t.id}" aria-label="Supprimer ${esc(t.libelle)}">${ico('x', 18)}</button></li>`).join('') || '<li class="vide">Aucune opération ce mois-ci.</li>'}</ul></section>
    <details class="fin-det"><summary>Opérations automatiques (${etat.recurrents.length})</summary>
      <ul class="liste">${etat.recurrents.map(r => `<li class="rang ${r.actif === false ? 'fait' : ''}"><button class="rang-btn" data-act="ouvrir" data-sheet="recurrent" data-id="${r.id}" aria-label="Modifier ${esc(r.libelle)}"><span class="rang-txt">${esc(r.libelle)}<small>Le ${r.jour} · ${esc(r.cat)}${r.actif === false ? ' · suspendue' : ''}</small></span>
        <b class="num">${eur(r.montant)}</b></button><button class="icone" data-act="rec-del" data-id="${r.id}" aria-label="Supprimer ${esc(r.libelle)}">${ico('x', 18)}</button></li>`).join('')}</ul>
      <button class="btn sec" data-act="ouvrir" data-sheet="recurrent">Ajouter</button></details>
    <details class="fin-det"><summary>Plafonds et prévision</summary>
      <div class="duo" style="padding-top:8px">${NOMS_CATS.filter(x => x !== 'Revenus').map(k => fld('Plafond ' + k + ' (€)', `<input type="number" min="0" step="10" class="plaf" data-plafond="${k}" value="${etat.plafonds[k] || ''}" inputmode="decimal">`)).join('')}</div>
      <div class="duo" style="padding-top:8px">${fld('Seuil d’alerte (€)', `<input type="number" step="50" inputmode="decimal" data-treso="seuil" value="${c.seuil}">`)}${fld('Dépenses courantes par mois (€)', `<input type="number" step="50" inputmode="decimal" data-treso="courantes" value="${c.courantes ?? ''}" placeholder="${P ? Math.round(P.vj * 30) : 0} (auto)">`)}</div></details>
    <details class="fin-det"><summary>Importer un relevé (CSV)</summary>
      <label class="btn sec">Choisir un fichier CSV<input type="file" id="importCsv" accept=".csv,text/csv,text/plain" hidden></label></details>`;
};

// ---------- Patrimoine ----------
VUES.patrimoine = function () {
  const P = patrimoineCalc(), pat = cfgPat(), hist = dansPeriode(etat.patHisto || [], patPer);
  const dNet = hist.length >= 2 ? hist[hist.length - 1].net - hist[0].net : null;
  const COUL = ['#6c8cff', '#5ad1a6', '#e8b95b', '#c98aff', '#ff8aa0', '#8fa4a8'];
  const acts = P.actifs.slice(0, 5), maxA = Math.max(1, ...acts.map(a => a[1]));
  const comptes = etat.epargne || [], totEp = somme(comptes, x => x.solde || 0);
  const proj = projectionEpargne();
  const interets = somme(comptes, x => (x.solde || 0) * (x.taux || 0) / 100);
  return `
    <div class="fin-tete"><span class="t-lbl" style="font-size:1.1rem">Patrimoine</span>${periodesHtml(patPer, 'pper')}</div>
    <section class="fin-tuile grand"><span class="t-lbl">Patrimoine net</span>
      <span class="t-ligne"><b class="t-val">${eur(P.net)}</b>${dNet != null ? deltaFin(dNet, eur(Math.abs(dNet))) : ''}</span>
      ${hist.length >= 2 ? sparkline(hist.map(h => h.net), { h: 110 }) : '<span class="t-bas">La courbe apparaît après quelques jours d’utilisation.</span>'}</section>
    <div class="fin-grille">
      <section class="fin-tuile"><span class="t-lbl">Actifs</span><b class="t-val">${eur(P.totalA)}</b></section>
      <section class="fin-tuile"><span class="t-lbl">Dettes</span><b class="t-val">${eur(P.dettes)}</b>${pat.maison > 0 && P.dettes ? `<span class="t-bas">${Math.round(P.dettes / pat.maison * 100)} % du logement</span>` : ''}</section></div>
    ${acts.length ? `<section class="fin-tuile"><span class="t-lbl">Répartition des actifs</span>
      <div class="rep"><div class="rep-leg"><span class="t-bas">Premier poste</span><b class="t-nom">${esc(acts[0][0])} · ${Math.round(acts[0][1] / P.totalA * 100)} %</b></div>
        ${barresV(acts.map(([n, v], i) => ({ part: v / maxA, titre: `${n} : ${eur(v)}`, couleur: COUL[i], pastille: pastilleInit(n) })), 110)}</div></section>` : ''}
    <section class="fin-tuile"><div class="carte-tete"><span class="t-lbl">Épargne</span><button class="lien" data-act="ouvrir" data-sheet="epargne">Ajouter</button></div>
      <span class="t-ligne"><b class="t-val">${eur(totEp + pat.epargne)}</b>${interets > 0 ? `<span class="mut">+${eur(interets)}/an</span>` : ''}</span>
      <ul class="liste">${comptes.map(c => `<li class="rang" style="min-height:52px"><button class="rang-btn" data-act="ouvrir" data-sheet="epargne" data-id="${c.id}" aria-label="Modifier ${esc(c.nom)}"><span class="rang-txt"><b>${esc(c.nom)}</b><small>${esc(nomEpargne(c.type))}${c.taux ? ' · ' + String(c.taux).replace('.', ',') + ' %' : ''}${c.mensuel ? ' · +' + eur(c.mensuel) + '/mois' : ''}</small></span><b class="num">${eur(c.solde || 0)}</b></button>
        <button class="btn sec" data-act="epargne-versement" data-id="${c.id}" style="min-height:36px;padding:0 12px">+</button></li>`).join('')}
        ${pat.epargne > 0 ? `<li class="rang" style="min-height:48px"><span class="rang-txt"><b>Non détaillée</b></span><b class="num">${eur(pat.epargne)}</b><button class="lien" data-act="ouvrir" data-sheet="epargne" data-reprise="1">Détailler</button></li>` : ''}</ul></section>
    ${proj ? `<section class="fin-tuile"><span class="t-lbl">Épargne projetée</span>
      <div class="proj">${[5, 10, 15].map(y => `<div><small>${y} ans</small><b>${eur(proj.total[y])}</b></div>`).join('')}</div>
      ${sparkline(proj.total, { h: 90, couleur: '--acc' })}
      <details class="fin-det"><summary>Détail et hypothèses</summary>
        <div class="defile"><table class="tab"><tr class="mut"><td>Horizon</td><td>Versé</td><td>Intérêts</td><td>En € actuels</td></tr>${[5, 10, 15].map(y => `<tr><td>${y} ans</td><td>${eur(proj.initial + proj.versements[y])}</td><td style="color:var(--ok)">+${eur(proj.total[y] - proj.initial - proj.versements[y])}</td><td>${eur(proj.total[y] / Math.pow(1 + proj.infl, y))}</td></tr>`).join('')}</table></div>
        <div class="duo" style="padding-top:8px">${fld('Inflation (%)', `<input type="number" step="0.1" min="0" inputmode="decimal" data-pat="inflation" value="${pat.inflation}">`)}${fld('Rendement non détaillé (%)', `<input type="number" step="0.1" min="0" inputmode="decimal" data-pat="epargneTaux" value="${pat.epargneTaux}">`)}</div>
        <small>Taux et versements constants, avant impôts : une hypothèse, pas une garantie.</small></details></section>` : ''}
    <details class="fin-det"><summary>Mes valeurs</summary>
      ${fld('Valeur du logement (€)', `<input type="number" step="1000" inputmode="decimal" data-pat="maison" value="${pat.maison || ''}">`)}
      <div class="duo" style="padding-top:8px">${fld('Épargne non détaillée (€)', `<input type="number" step="100" inputmode="decimal" data-pat="epargne" value="${pat.epargne || ''}">`)}${fld('Autres actifs (€)', `<input type="number" step="100" inputmode="decimal" data-pat="autres" value="${pat.autres || ''}">`)}</div></details>`;
};

// ---------- Prêts ----------
VUES.prets = function () {
  if (!etat.prets.length) return videFin('Vos prêts', 'Ajouter un prêt', 'pret');
  const p = etat.prets.find(x => x.id === pretSel) || etat.prets[0];
  pretSel = p.id;
  const E = etatPret(p), c = cfgPret();
  const chips = etat.prets.length > 1 ? `<div class="chips" role="group" aria-label="Choisir un prêt">${etat.prets.map(x => `<button data-act="pret-sel" data-id="${x.id}" aria-pressed="${x.id === p.id}">${esc(x.nom)}</button>`).join('')}</div>` : '';
  const actions = `<div class="rangee"><button class="btn sec" data-act="ouvrir" data-sheet="pret" data-id="${p.id}">Modifier</button><button class="btn danger" data-act="pret-del" data-id="${p.id}">Supprimer</button></div>`;
  if (!E.ok) return `${chips}<section class="fin-tuile"><span class="t-lbl">${esc(p.nom)}</span><span class="t-bas">L’échéancier ne peut pas être calculé : vérifiez le taux, la durée et la mensualité.</span></section>${actions}`;
  const assur = p.assurance || 0, pcR = Math.min(100, (p.capital - E.crd) / p.capital * 100), A = analyseRachat(p, E);
  const vals = [p.capital, ...E.lignes.filter((_, i) => i % 3 === 2).map(l => l.crd)];
  const totI = E.interetsPayes + E.interetsRestants, partPayes = totI ? E.interetsPayes / totI * 100 : 0;
  const lignesTab = (s, nom) => s ? `<tr><td><b>${nom}</b></td><td>${eur(s.frais)}</td><td>${eur(s.Mn)}</td><td style="color:var(--${s.net > 0 ? 'ok' : 'bad'})"><b>${eur(s.net)}</b></td><td>${isFinite(s.rentab) ? s.rentab + ' mois' : '—'}</td></tr>` : '';
  const X = Math.min(c.anticipe || 0, E.crd);
  let anticipe = '';
  if (X > 0 && E.prochaine) {
    const np = planDepuis(E.crd - X, p.taux, E.M, E.prochaine.date, E.k + 1);
    anticipe = `<div class="kv"><span>Intérêts économisés</span><b>${eur(E.interetsRestants - somme(np.lignes, l => l.interets))}</b></div><div class="kv"><span>Échéances en moins</span><b>${E.restant.length - np.lignes.length}</b></div><div class="kv"><span>Nouvelle fin</span><b>${np.lignes.length ? fmtMois(np.lignes[np.lignes.length - 1].date) : 'Soldé'}</b></div>`;
  }
  const parAn = {};
  E.lignes.forEach(l => { const y = l.date.slice(0, 4); (parAn[y] = parAn[y] || { i: 0, c: 0, crd: 0 }); parAn[y].i += l.interets; parAn[y].c += l.capital; parAn[y].crd = l.crd; });
  return `${chips}
    <section class="fin-tuile grand"><span class="t-lbl">Capital restant dû · ${esc(p.nom)}</span>
      <span class="t-ligne"><b class="t-val">${eur(E.crd)}</b><span class="delta ok">${Math.round(pcR)} % remboursé</span></span>
      ${sparkline(vals, { h: 110, couleur: '--acc', marqueur: Math.floor(E.k / 3) })}</section>
    <div class="fin-grille">
      <section class="fin-tuile"><span class="t-lbl">Mensualité</span><b class="t-val">${eur(E.M + assur)}</b>${assur ? `<span class="t-bas">dont assurance ${eur(assur)}</span>` : '<span class="t-bas">&nbsp;</span>'}</section>
      <section class="fin-tuile"><span class="t-lbl">Fin du prêt</span><b class="t-val cap">${fmtMois(E.fin)}</b><span class="t-bas">${E.restant.length} échéances · ${tx2(p.taux)} %</span></section></div>
    <section class="fin-tuile"><span class="t-lbl">Intérêts</span>
      <div class="rep"><div class="rep-leg"><span class="t-bas">Déjà payés</span><b class="t-nom">${eur(E.interetsPayes)}</b><span class="t-bas" style="margin-top:6px">Restants</span><b class="t-nom">${eur(E.interetsRestants)}</b></div>
        ${barresV([{ part: partPayes / 100, titre: 'Part déjà payée', couleur: 'var(--acc)', pastille: `<span class="bv-lbl">${Math.round(partPayes)} %</span>` }], 110)}</div></section>
    <section class="fin-tuile"><span class="t-lbl">Rachat ou renégociation</span>
      ${A ? `<span class="t-ligne"><b class="t-val">${eur(A.best ? A.best.net : 0)}</b><span class="pill ${A.statut[0]}">${A.statut[1]}</span></span>
        <span class="t-bas">Marché ${tx2(c.marche)} % · votre taux ${tx2(p.taux)} %${A.ecart <= 0 ? ' : le vôtre est plus bas' : ''}</span>`
        : '<span class="t-bas">Saisissez le taux du marché dans les hypothèses pour estimer un gain.</span>'}</section>
    <details class="fin-det"><summary>Comparatif et hypothèses</summary>
      ${A ? `<div class="defile"><table class="tab"><tr class="mut"><td>Option</td><td>Frais</td><td>Mensualité</td><td>Gain net</td><td>Rentabilisé</td></tr>${lignesTab(A.reneg, 'Renégociation')}${lignesTab(A.rachat, 'Rachat')}</table></div>` : ''}
      <div class="formulaire" style="padding-top:8px">
        ${fld('Taux proposé aujourd’hui (%)', `<input type="number" step="0.01" min="0" inputmode="decimal" data-pretcfg="marche" value="${c.marche || ''}">`)}
        <div class="duo">${fld('Frais de dossier (€)', `<input type="number" step="50" min="0" inputmode="decimal" data-pretcfg="dossier" value="${c.dossier}">`)}${fld('Garantie et mainlevée (€)', `<input type="number" step="50" min="0" inputmode="decimal" data-pretcfg="garantie" value="${c.garantie}">`)}</div>
        ${fld('Frais d’avenant (€)', `<input type="number" step="50" min="0" inputmode="decimal" data-pretcfg="avenant" value="${c.avenant}">`)}
        <small>Frais indicatifs à remplacer par un devis. Indemnité de remboursement anticipé estimée : le plus faible de 6 mois d’intérêts et 3 % du capital restant dû.</small></div></details>
    <details class="fin-det"><summary>Remboursement anticipé</summary>
      ${fld('Montant remboursé (€)', `<input type="number" step="500" min="0" inputmode="decimal" data-pretcfg="anticipe" value="${c.anticipe || ''}">`)}${anticipe}</details>
    <details class="fin-det"><summary>Échéancier par année</summary>${vueTable(['Année', 'Intérêts', 'Capital', 'Reste dû'], Object.entries(parAn).map(([y, v]) => [y, eur(v.i), eur(v.c), eur(v.crd)]))}</details>
    ${actions}`;
};
