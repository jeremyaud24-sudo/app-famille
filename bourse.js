'use strict';
// Onglet Bourse : suivi du portefeuille, analyses et conseils basés sur des règles.
// Les cours sont saisis à la main (aucune donnée de marché n'est récupérée).

const TYPES_PF = ['Action', 'ETF', 'Fonds', 'Obligation', 'Crypto', 'Autre'];
const ENVELOPPES = ['PEA', 'PEA-PME', 'CTO', 'Assurance-vie', 'PER', 'Autre'];
const ZONES = ['Monde', 'Europe', 'USA', 'Émergents', 'Asie-Pacifique', 'Autre'];
const SECTEURS = ['Diversifié', 'Technologie', 'Santé', 'Finance', 'Industrie', 'Consommation', 'Énergie', 'Immobilier', 'Matériaux', 'Services publics', 'Télécoms', 'Autre'];
const ENV_IMPOSABLES = ['CTO', 'Autre'];

function cfg() {
  etat.pfCfg = { jourPlan: 5, strategie: 'cibles', pfu: 30, versement: 0, rendement: 6, mensuel: 0, annees: 20, depenses: 0, epargne: 0, realise: 0, liquidites: 0, eurusd: 1.1, ...(etat.pfCfg || {}) };
  return etat.pfCfg;
}
const somme = (a, f) => a.reduce((s, x) => s + f(x), 0);
const nb = s => { const v = Number(String(s).replace(',', '.')); return isNaN(v) ? null : v; };
const pc = n => n.toFixed(1).replace('.', ',') + ' %';
const couleurPl = n => (n >= 0 ? 'var(--ok)' : 'var(--ko)');

function pfCalc() {
  const fxUsd = cfg().eurusd || 1;
  const ps = etat.pf.map(p => {
    const fx = p.devise === 'USD' ? fxUsd : 1, coursEur = p.cours / fx, pruEur = p.pru / fx;
    return { ...p, fx, coursEur, val: p.qte * coursEur, cout: p.qte * pruEur };
  });
  const total = somme(ps, p => p.val), investi = somme(ps, p => p.cout);
  ps.forEach(p => { p.poids = total ? p.val / total * 100 : 0; p.pl = p.val - p.cout; p.plPct = p.cout ? p.pl / p.cout * 100 : 0; });
  return { ps, total, investi, pl: total - investi };
}
const monnaie = (n, dev) => (dev === 'USD' ? n.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' }) : eur(n));
// Historique : un point par jour, mis à jour à chaque sauvegarde
function majHisto() {
  if (!etat.pf || !etat.pf.length) return;
  const S = pfCalc(), liq = cfg().liquidites || 0, d = aujourdhui();
  const e = { date: d, valeur: Math.round((S.total + liq) * 100) / 100, investi: Math.round((S.investi + liq) * 100) / 100 };
  etat.pfHisto = etat.pfHisto || [];
  const i = etat.pfHisto.findIndex(x => x.date === d);
  if (i >= 0) etat.pfHisto[i] = e; else etat.pfHisto.push(e);
  etat.pfHisto.sort((a, b) => a.date.localeCompare(b.date));
  if (etat.pfHisto.length > 900) etat.pfHisto = etat.pfHisto.slice(-900);
}
function groupe(ps, cle) {
  const m = {};
  ps.forEach(p => { const k = p[cle] || 'Autre'; m[k] = (m[k] || 0) + p.val; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

// ---------- Moteur de conseils ----------
function conseils(S) {
  const c = cfg(), out = [], { ps, total } = S;
  const add = (n, t) => out.push([n, t]);
  if (!ps.length) return [['info', 'Ajoutez vos lignes pour obtenir une analyse.']];

  // Épargne de précaution
  if (c.depenses > 0) {
    const mois = c.epargne / c.depenses;
    if (mois < 3) add('rouge', `Épargne de précaution : ${mois.toFixed(1)} mois de dépenses couverts. Avant de renforcer la Bourse, constituez 3 à 6 mois de dépenses sur des supports disponibles (livrets) : sans ça, un imprévu vous oblige à vendre au pire moment.`);
    else if (mois < 6) add('orange', `Épargne de précaution : ${mois.toFixed(1)} mois couverts. Correct ; visez 6 mois si vos revenus sont variables ou si vous avez des enfants à charge.`);
    else add('vert', `Épargne de précaution : ${mois.toFixed(1)} mois couverts. Bon matelas pour investir sereinement à long terme.`);
  } else add('info', 'Renseignez vos dépenses mensuelles et votre épargne disponible (Paramètres) pour évaluer votre matelas de sécurité.');

  // Concentration par ligne (hors supports diversifiés)
  const indiv = ps.filter(p => p.secteur !== 'Diversifié');
  indiv.filter(p => p.poids > 25).forEach(p => add('rouge', `${p.ticker} pèse ${pc(p.poids)} du portefeuille. Au-delà de ~20-25 % sur une seule société, un accident (fraude, profit warning) pèse lourd. Envisagez d'alléger ou de ne plus renforcer.`));
  indiv.filter(p => p.poids > 15 && p.poids <= 25).forEach(p => add('orange', `${p.ticker} pèse ${pc(p.poids)}. Repère courant : 5 à 10 % par ligne, 15 % maximum pour une conviction forte.`));

  // Nombre de lignes effectif (indice de Herfindahl)
  const hhi = somme(ps, p => (p.poids / 100) ** 2), neff = hhi ? 1 / hhi : 0;
  const poidsIndiv = somme(indiv, p => p.poids);
  if (ps.length >= 2) {
    if (neff < 5 && poidsIndiv > 50) add('orange', `Diversification faible : l'équivalent de ${neff.toFixed(1).replace(".", ",")} lignes de poids égal. Soit élargir à 15-25 lignes de secteurs différents, soit adopter un socle d'ETF larges (monde, Europe) et limiter les actions en direct à une poche « satellite » de 20-30 %.`);
    else if (neff >= 12) add('vert', `Bonne diversification par ligne (≈ ${neff.toFixed(0)} lignes équivalentes).`);
  }
  if (poidsIndiv > 70 && !ps.some(p => p.type === 'ETF' && p.secteur === 'Diversifié')) add('info', 'Aucun ETF diversifié : un ETF monde à frais réduits comme socle réduit le risque de mauvais choix individuel et fait gagner du temps.');

  // Secteurs et zones
  const sect = groupe(indiv, 'secteur');
  const totIndiv = somme(indiv, p => p.val);
  if (sect.length && totIndiv) {
    const [s, v] = sect[0];
    if (v / totIndiv > 0.35) add('orange', `Secteur dominant : ${s} représente ${pc(v / totIndiv * 100)} de vos lignes directes. Un retournement sectoriel affecterait tout le portefeuille à la fois.`);
  }
  const zones = groupe(ps.filter(p => p.zone !== 'Monde'), 'zone'), totZ = somme(zones, z => z[1]);
  if (zones.length && totZ) {
    const [z, v] = zones[0];
    if (v / totZ > 0.75 && totZ / total > 0.5) add('info', `Concentration géographique : ${pc(v / totZ * 100)} sur la zone ${z} (hors supports « Monde »). Le biais domestique est fréquent ; vérifiez qu'il est voulu.`);
  }
  const crypto = somme(ps.filter(p => p.type === 'Crypto'), p => p.poids);
  if (crypto > 10) add('orange', `Crypto : ${pc(crypto)} du portefeuille. Actif très volatil : beaucoup d'investisseurs plafonnent à 5-10 % et n'investissent que ce qu'ils peuvent perdre.`);

  // Gagnants / perdants
  ps.filter(p => p.cout && p.plPct <= -25).forEach(p => add('orange', `${p.ticker} : ${pc(p.plPct)}. Ne moyennez pas à la baisse par réflexe : vérifiez si la raison de l'achat tient toujours. Sur CTO, la moins-value peut compenser des plus-values (reportable sur 10 ans, à vérifier).`));
  ps.filter(p => p.plPct >= 100 && p.poids > 12).forEach(p => add('orange', `${p.ticker} a doublé (+${pc(p.plPct)}) et pèse ${pc(p.poids)} : le succès a déséquilibré votre portefeuille. Un allègement partiel remet le risque au niveau voulu (sans impôt à l'intérieur d'un PEA).`));

  // Frais
  const frais = somme(ps, p => p.val * (p.frais || 0)) / (total || 1);
  const cher = ps.filter(p => (p.frais || 0) > 0.5);
  if (cher.length) add('orange', `Frais élevés : ${cher.map(p => `${p.ticker} (${pc(p.frais)})`).join(', ')}. Un écart de 1 %/an coûte environ 20 % du capital final sur 25 ans ; comparez avec des ETF équivalents (souvent 0,1-0,3 %).`);
  else if (frais > 0 && frais < 0.3) add('vert', `Frais courants pondérés faibles (${frais.toFixed(2).replace('.', ',')} %/an).`);

  // Dividendes
  ps.filter(p => p.div && p.cours && p.div / p.cours > 0.08).forEach(p => add('orange', `${p.ticker} : rendement ${pc(p.div / p.cours * 100)}. Un rendement très élevé signale souvent un risque de baisse du dividende ou une décote du cours (piège à rendement).`));

  // Enveloppes
  const env = groupe(ps, 'enveloppe'), pea = env.find(e => e[0] === 'PEA');
  if (!pea && total > 0) add('info', "Aucune ligne en PEA : pour des actions/ETF européens éligibles, l'enveloppe offre une fiscalité allégée après 5 ans de détention (prélèvements sociaux restants). À comparer au CTO selon vos objectifs.");
  const coutPea = somme(ps.filter(p => p.enveloppe === 'PEA'), p => p.cout);
  if (coutPea > 135000) add('orange', `PEA : ${eur(coutPea)} versés environ, à rapprocher du plafond de 150 000 €. Vérifiez vos versements réels (hors plus-values).`);
  const cto = ps.filter(p => ENV_IMPOSABLES.includes(p.enveloppe) && p.pl > 0);
  if (cto.length) add('info', `Plus-values latentes hors enveloppe fiscale : ${eur(somme(cto, p => p.pl))}. Chaque vente est imposable : privilégiez les arbitrages dans le PEA/AV et tenez compte des moins-values disponibles.`);

  // Fraîcheur des cours
  const vieux = ps.filter(p => !p.maj || (Date.now() - parse(p.maj)) / 864e5 > 7);
  if (vieux.length) add('info', `Cours à mettre à jour (plus de 7 jours) : ${vieux.map(p => p.ticker).join(', ')}. Les analyses ne sont fiables que sur des cours récents.`);

  // Cibles
  const cibles = ps.filter(p => p.cible > 0);
  if (cibles.length) {
    const st = somme(ps, p => p.cible || 0);
    if (Math.abs(st - 100) > 0.5) add('orange', `Vos allocations cibles totalisent ${pc(st)} (devraient faire 100 %).`);
    ps.filter(p => p.cible > 0 && Math.abs(p.poids - p.cible) > 5).forEach(p => add('info', `${p.ticker} : ${pc(p.poids)} contre une cible de ${pc(p.cible)} (écart de ${pc(p.poids - p.cible)}). Voir « Rééquilibrage ».`));
  }
  return out;
}


// ---------- Où investir ensuite (pistes d'allocation, pas de titre désigné) ----------
const SECTEURS_COMPLEMENT = ['Santé', 'Consommation', 'Services publics', 'Finance', 'Industrie', 'Énergie', 'Matériaux', 'Télécoms', 'Immobilier', 'Technologie'];
function prochainInvest(S) {
  const c = cfg(), { ps, total } = S, out = [];
  const base = total + (c.versement > 0 ? c.versement : 0);
  if (!ps.length) return out;
  const etf = ps.filter(p => p.secteur === 'Diversifié');
  const valEtf = somme(etf, p => p.val);

  const gros = ps.filter(p => p.secteur !== 'Diversifié' && p.poids > 25);
  if (gros.length) out.push(['À ne pas renforcer', `${gros.map(p => p.ticker).join(', ')} dépasse${gros.length > 1 ? 'nt' : ''} 25 % du portefeuille. Orientez vos prochains versements vers d'autres supports plutôt que d'augmenter cette concentration.`]);

  if (valEtf / (base || 1) < 0.4) {
    const manque = Math.max(0, 0.5 * base - valEtf);
    out.push(['1. Un socle diversifié', `Un ETF large (monde, ou monde + Europe) répartit le risque sur des centaines de sociétés pour 0,1 à 0,4 % de frais par an. Un socle d'environ la moitié du portefeuille représente ${eur(manque)} à ajouter.${c.versement > 0 ? ` Votre versement de ${eur(c.versement)} irait naturellement ici.` : ' Renseignez un versement prévu dans « Rééquilibrage » pour affiner.'} À vérifier avant achat : éligibilité à votre enveloppe (PEA ou CTO), frais, encours, méthode de réplication.`]);
  }

  const indiv = ps.filter(p => p.secteur !== 'Diversifié'), totI = somme(indiv, p => p.val);
  if (totI) {
    const poidsS = Object.fromEntries(groupe(indiv, 'secteur').map(([k, v]) => [k, v / totI * 100]));
    const dominant = Math.max(0, ...Object.values(poidsS));
    const vides = SECTEURS_COMPLEMENT.filter(s => (poidsS[s] || 0) < 5).slice(0, 3);
    if (vides.length && (dominant > 35 || Object.keys(poidsS).length <= 3))
      out.push(['2. Des secteurs qui manquent', `Vos lignes directes sont concentrées. Pour rééquilibrer, explorez d'abord des entreprises dans : ${vides.join(', ')}. Ces secteurs réagissent souvent différemment du reste de votre portefeuille.`]);
  }

  const zonesPresentes = new Set(ps.filter(p => p.zone !== 'Monde' || p.secteur !== 'Diversifié').map(p => p.zone));
  const absentes = ['Europe', 'USA', 'Émergents', 'Asie-Pacifique'].filter(z => !zonesPresentes.has(z) && !(etf.some(p => p.zone === 'Monde')));
  if (absentes.length) out.push(['3. Des zones absentes', `Aucune exposition à : ${absentes.join(', ')}. Un ETF dédié est plus simple et moins risqué qu'une action isolée pour couvrir une zone entière.`]);

  out.push(['Taille d\'une nouvelle ligne', `Sur la base de ${eur(base)} : environ ${eur(base * 0.05)} (5 %) pour une première position, ${eur(base * 0.1)} (10 %) au maximum.${base < 1000 ? ' Avec un petit capital, mieux vaut peu de lignes plutôt que de nombreuses positions minuscules, et peu d\'achats si votre courtier prélève des frais fixes.' : ''}`]);
  return out;
}

// ---------- Proposition d'action chiffrée ----------
function proposition(S) {
  const c = cfg(), { ps, total } = S, etapes = [];
  if (!ps.length) return etapes;
  const v = c.versement > 0 ? c.versement : 0, base = total + v;
  const valEtf = somme(ps.filter(p => p.secteur === 'Diversifié'), p => p.val);
  if (c.depenses > 0 && c.epargne / c.depenses < 3)
    etapes.push(['Avant tout : épargne de précaution', `Elle couvre moins de 3 mois de dépenses. Complétez-la avant d'ajouter à la Bourse.`]);
  const gros = ps.filter(p => p.secteur !== 'Diversifié' && p.poids > 25).sort((a, b) => b.poids - a.poids)[0];
  const besoinEtf = Math.max(0, 0.5 * base - valEtf);

  if (v > 0) {
    const etf = Math.min(v, besoinEtf), reste = v - etf;
    if (etf > 0) etapes.push([`Investir ${eur(etf)} dans un ETF large`, `Un ETF monde (indice type MSCI World ou FTSE All-World) porte le socle vers 50 % du portefeuille. Comparez frais, encours et éligibilité PEA/CTO avant d'acheter.`]);
    if (reste > 0) {
      const ligne = Math.min(reste, 0.05 * base);
      etapes.push([`Option : ${eur(ligne)} sur une ligne complémentaire`, `Une entreprise d'un secteur absent de votre portefeuille, choisie avec la grille ci-dessous, sans dépasser 5 % du total. Le reste (${eur(reste - ligne)}) peut aller dans l'ETF.`]);
    }
    if (gros) etapes.push([`Ne pas renforcer ${gros.ticker}`, `Elle pèse ${pc(gros.poids)} : les nouveaux versements la diluent d'eux-mêmes (à ${eur(base)} de portefeuille, elle passerait à ${pc(gros.val / base * 100)}) sans aucune vente.`]);
  } else {
    if (besoinEtf > 0) etapes.push(['Fixer un versement', `Indiquez un montant dans « Rééquilibrage » : c'est le levier le plus simple. Pour atteindre un socle de 50 %, il faudrait ${eur(besoinEtf)} au total dans un ETF large.`]);
    if (gros) {
      const vendre = gros.val - 0.25 * total, gain = gros.pl > 0 ? vendre * gros.pl / gros.val : 0;
      const imposable = ENV_IMPOSABLES.includes(gros.enveloppe);
      etapes.push([`Alternative : alléger ${gros.ticker} de ${eur(vendre)}`, `Cela la ramènerait à 25 % du portefeuille, et le montant irait dans un ETF large. ${imposable && gain > 0 ? `Plus-value réalisée estimée : ${eur(gain)}, soit environ ${eur(gain * c.pfu / 100)} d'impôt à ${c.pfu} %.` : 'Pas d\'impôt estimé sur cette vente.'} Inconvénient : vous renoncez à une partie d'un titre qui monte ; avantage : le risque est réparti. Sans vente, vos futurs versements feront le même travail plus lentement.`]);
    }
  }
  return etapes;
}
const GRILLE = [
  'Je sais expliquer en deux phrases comment l’entreprise gagne de l’argent.',
  'Son chiffre d’affaires et ses bénéfices progressent sur 5 à 10 ans.',
  'Sa dette reste raisonnable par rapport à ses bénéfices.',
  'Elle a un avantage durable (marque, prix, technologie, coûts) face à ses concurrents.',
  'Le prix payé n’est pas démesuré par rapport aux bénéfices et au secteur (PER, rendement du flux de trésorerie).',
  'Je supporterais de voir la ligne perdre 50 % sans vendre.',
  'Elle ne ferait pas dépasser 10 % du portefeuille.',
  'Elle apporte un secteur ou une zone qui me manque.',
];

// ---------- Rendu ----------
const barres = (liste, total) => liste.map(([k, v]) => `<div><div class="bar"><span>${esc(k)}</span><span class="num">${pc(total ? v / total * 100 : 0)} · ${eur(v)}</span></div><div class="jauge"><i style="width:${total ? v / total * 100 : 0}%;background:var(--pri)"></i></div></div>`).join('');
const opts = (liste, sel) => liste.map(o => `<option${o === sel ? ' selected' : ''}>${o}</option>`).join('');
const champ = (id, label, val, step = '1', extra = '') => fld(label, `<input type="number" step="${step}" min="0" inputmode="decimal" data-pfcfg="${id}" value="${val || ''}" ${extra}>`);

function rebalancement(S) {
  const c = cfg(), cibles = S.ps.filter(p => p.cible > 0);
  if (!cibles.length) return '<p class="mut">Définissez une « cible % » sur vos lignes pour obtenir un plan de rééquilibrage.</p>';
  const base = S.total + c.versement;
  const lignes = cibles.map(p => ({ p, delta: p.cible / 100 * base - p.val }));
  let achat = lignes.map(l => Math.max(l.delta, 0));
  const sPos = somme(achat, x => x);
  if (c.versement > 0 && sPos > c.versement) achat = achat.map(x => x / sPos * c.versement);
  return `<table class="tab"><tr class="mut"><td>Ligne</td><td>Actuel</td><td>Cible</td><td>Action</td></tr>
    ${lignes.map((l, i) => {
      const mont = c.versement > 0 ? achat[i] : l.delta;
      const n = l.p.coursEur ? Math.floor(Math.abs(mont) / l.p.coursEur) : 0;
      const txt = Math.abs(mont) < 1 ? '—' : `${mont > 0 ? 'Acheter' : 'Vendre'} ${eur(Math.abs(mont))}${n ? ` (~${n} titre${n > 1 ? "s" : ""})` : ''}`;
      return `<tr><td>${esc(l.p.ticker)}</td><td>${pc(l.p.poids)}</td><td>${pc(l.p.cible)}</td><td style="color:${mont > 0 ? 'var(--ok)' : 'var(--ko)'}">${txt}</td></tr>`;
    }).join('')}</table>
    <p class="mut">${c.versement > 0 ? 'Avec un versement : on achète uniquement les lignes sous-pondérées, sans vendre (moins de frais et d\'impôt).' : 'Sans versement : le plan suppose des ventes ; préférez rééquilibrer avec de nouveaux versements.'}</p>`;
}

function projection() {
  const c = cfg(), P = pfCalc().total, n = c.annees || 0;
  const fv = r => {
    const g = (1 + r / 100) ** n, rm = (1 + r / 100) ** (1 / 12) - 1;
    return P * g + c.mensuel * (rm ? ((1 + rm) ** (12 * n) - 1) / rm : 12 * n);
  };
  const versé = P + c.mensuel * 12 * n;
  return `<table class="tab"><tr class="mut"><td>Rendement/an</td><td>Capital final</td><td>En euros d'aujourd'hui (infl. 2 %)</td></tr>
    ${[Math.max(c.rendement - 2, 0), c.rendement, c.rendement + 2].map(r => `<tr><td>${pc(r)}</td><td><b>${eur(fv(r))}</b></td><td>${eur(fv(r) / 1.02 ** n)}</td></tr>`).join('')}</table>
    <p class="mut">Total versé : ${eur(versé)} sur ${n} ans. Simulation théorique : les marchés ne rapportent pas un taux constant et le capital peut baisser, y compris longtemps.</p>`;
}



// ---------- Plan d'investissement mensuel ----------
// Répartit le versement mensuel en achats seulement (jamais de vente) : vers les lignes sous leur cible,
// ou à parts égales entre les lignes qui ne dépassent pas 25 % si aucune cible n'est définie.
function planAllocation(S, montant, strategie) {
  const { ps, total } = S;
  if (!ps.length || montant <= 0) return [];
  const cibles = ps.filter(p => p.cible > 0);
  let parts;
  if (strategie === 'cibles' && cibles.length) {
    const base = total + montant;
    const manque = cibles.map(p => Math.max(0, p.cible / 100 * base - p.val));
    const s = somme(manque, x => x);
    parts = cibles.map((p, i) => (s > 0 ? manque[i] / s : p.cible / somme(cibles, c => c.cible)));
    return cibles.map((p, i) => ({ p, montant: montant * parts[i] })).filter(l => l.montant >= 0.01).map(l => ({ ...l, qte: l.montant / l.p.coursEur }));
  }
  const elig = ps.filter(p => p.poids <= 25 || p.secteur === 'Diversifié');
  const cible = elig.length ? elig : ps;
  return cible.map(p => ({ p, montant: montant / cible.length, qte: montant / cible.length / p.coursEur }));
}
const planMoisFait = () => (etat.planExec || []).find(x => x.mois === aujourdhui().slice(0, 7));
function planAlertes() {
  const c = cfg();
  if (!etat.pf.length || !(c.mensuel > 0) || planMoisFait() || new Date().getDate() < (c.jourPlan || 5)) return [];
  return [[`Plan d’investissement du mois : ${eur(c.mensuel)} à investir`, 'À faire', 'warn', 'bourse']];
}
function bPlan(S) {
  const c = cfg(), al = planAllocation(S, c.mensuel, c.strategie), fait = planMoisFait();
  const hasCibles = S.ps.some(p => p.cible > 0);
  return `
    <section class="carte"><h2>Plan mensuel</h2>
      <div class="duo">${champ('mensuel', 'Versement mensuel (€)', c.mensuel, '10')}${champ('jourPlan', 'Jour d’investissement (1-28)', c.jourPlan, '1', 'max="28"')}</div>
      <div class="chips" role="group" aria-label="Répartition"><button data-act="plan-strat" data-v="cibles" aria-pressed="${c.strategie === 'cibles'}">Selon mes cibles</button><button data-act="plan-strat" data-v="egal" aria-pressed="${c.strategie === 'egal'}">Parts égales</button></div>
      ${c.strategie === 'cibles' && !hasCibles ? '<small>Aucune cible définie sur vos lignes : la répartition est en parts égales. Ajoutez des cibles dans la fiche d’une ligne.</small>' : ''}
      ${fait ? `<div class="cons"><span class="pill ok">Fait</span><p>Plan du mois enregistré le ${fmtDate(fait.date)} : ${eur(fait.total)} investis.</p></div>` : `<div class="cons"><span class="pill warn">À faire</span><p>Plan du mois pas encore appliqué (prévu le ${c.jourPlan || 5} du mois).</p></div>`}</section>
    ${al.length ? `<section class="carte"><h2>Achats de ce mois</h2>
      <div class="defile"><table class="tab"><tr class="mut"><td>Ligne</td><td>Montant</td><td>Quantité</td><td>Part</td></tr>
        ${al.map(l => `<tr><td><b>${esc(l.p.ticker)}</b></td><td>${eur(l.montant)}</td><td>${String(Number(l.qte.toFixed(4))).replace('.', ',')}</td><td>${pc(l.montant / c.mensuel * 100)}</td></tr>`).join('')}</table></div>
      <small>Quantités estimées aux cours enregistrés (mettez-les à jour avant d’acheter). Aucune vente n’est proposée.</small>
      ${fait ? '' : '<button class="btn plein" data-act="plan-exec">J’ai passé ces achats</button>'}</section>`
      : '<section class="carte"><p class="vide">Indiquez un versement mensuel pour obtenir la répartition du mois.</p></section>'}
    ${(etat.planExec || []).length ? `<section class="carte"><h2>Historique</h2><ul class="liste">${[...etat.planExec].reverse().slice(0, 8).map(x => `<li class="rang" style="min-height:44px"><span class="rang-txt">${fmtMois(x.date)}<small>${x.lignes.map(l => esc(l.ticker)).join(', ')}</small></span><b class="num">${eur(x.total)}</b></li>`).join('')}</ul>
      <div class="kv"><span>Total investi via le plan</span><b>${eur(somme(etat.planExec, x => x.total))}</b></div></section>` : ''}
    <small>Règle de répartition simple, pas un conseil personnalisé. Investir régulièrement lisse le prix d’achat mais n’élimine pas le risque de perte.</small>`;
}
ACTIONS['plan-strat'] = el => { cfg().strategie = el.dataset.v; };
ACTIONS['plan-exec'] = async () => {
  const S = pfCalc(), c = cfg(), al = planAllocation(S, c.mensuel, c.strategie);
  if (!al.length) return false;
  if (!await confirmer(`Appliquer ${eur(c.mensuel)} d’achats sur ${al.length} ligne${pl(al.length)} ? Quantités et prix de revient seront mis à jour aux cours enregistrés.`)) return false;
  al.forEach(l => {
    const p = etat.pf.find(x => x.id === l.p.id);
    p.pru = (p.qte * p.pru + l.qte * p.cours) / (p.qte + l.qte);
    p.qte += l.qte; p.maj = aujourdhui();
  });
  (etat.planExec = etat.planExec || []).push({ date: aujourdhui(), mois: aujourdhui().slice(0, 7), total: c.mensuel, lignes: al.map(l => ({ ticker: l.p.ticker, montant: l.montant })) });
  info('Plan du mois enregistré.');
};

// ---------- Interface ----------
let bTab = 'synthese', bRep = 'type', bPer = '3m';
const B_TABS = [['synthese', 'Synthèse'], ['lignes', 'Lignes'], ['conseils', 'Conseils'], ['plan', 'Plan'], ['outils', 'Outils']];
const REP = [['type', 'Type'], ['secteur', 'Secteur'], ['zone', 'Zone'], ['enveloppe', 'Enveloppe']];
const SEV = { rouge: ['bad', 'Important'], orange: ['warn', 'À surveiller'], vert: ['ok', 'Positif'], info: ['', 'Info'] };
const COUL_PF = ['#0b8f78', '#d98a1c', '#3b73e0', '#c23b63', '#8a5cd6', '#7b8a84'];
const pillPl = (n, p) => `<span class="pill ${n >= 0 ? 'ok' : 'bad'}">${n >= 0 ? '▲' : '▼'} ${eur(Math.abs(n))} · ${pc(Math.abs(p))}</span>`;
const q6 = n => Number((+n).toFixed(6));
const r4 = n => Number((+n).toFixed(4));
const initiales = t => esc(String(t).slice(0, 2).toUpperCase());

function bHistorique() {
  const PER = [['1m', '1 mois', 30], ['3m', '3 mois', 90], ['tout', 'Tout', 99999]];
  const lim = iso(ajouteJours(new Date(), -PER.find(p => p[0] === bPer)[2]));
  const pts = (etat.pfHisto || []).filter(h => h.date >= lim).map(h => ({ label: h.date, v: [h.valeur, h.investi] }));
  return `<section class="carte"><div class="carte-tete"><h2>Évolution</h2></div>
    <div class="chips" role="group" aria-label="Période">${PER.map(([k, n]) => `<button data-act="bper" data-v="${k}" aria-pressed="${bPer === k}">${n}</button>`).join('')}</div>
    ${pts.length >= 2 ? grapheLigne('histo', pts, [{ nom: 'Valeur', c: '--c1' }, { nom: 'Investi', c: '--c2', dash: '5 4' }], 'Valeur et montant investi')
      : '<p class="vide">L’historique se construit chaque jour où vous mettez à jour vos cours ou ouvrez l’application. Revenez demain pour voir la courbe.</p>'}</section>`;
}

function bSynthese(S) {
  const c = cfg(), { ps, total, investi, pl } = S;
  const trie = [...ps].sort((a, b) => b.val - a.val);
  const segs = trie.slice(0, 5).map(p => [p.ticker, p.val]);
  const reste = somme(trie.slice(5), p => p.val);
  if (reste > 0) segs.push(['Autres', reste]);
  const ordre = { rouge: 0, orange: 1, vert: 2, info: 3 };
  const cons = conseils(S).sort((a, b) => ordre[a[0]] - ordre[b[0]]);
  const retenir = cons.filter(x => x[0] !== 'info').slice(0, 3);
  const etape = proposition(S)[0];
  const vieux = ps.filter(p => !p.maj || (Date.now() - parse(p.maj)) / 864e5 > 7).length;
  return `
    <section class="hero"><p class="hero-lbl">Valeur du portefeuille</p><p class="hero-val">${eur(total)}</p>
      ${pillPl(pl, investi ? pl / investi * 100 : 0)}
      <p class="hero-sub">Investi ${eur(investi)}${c.liquidites ? ` · Liquidités ${eur(c.liquidites)}` : ''}${c.realise ? ` · Réalisé ${eur(c.realise)}` : ''}</p></section>
    ${bHistorique()}
    <section class="carte"><h2>Répartition par ligne</h2>
      <div class="empile" role="img" aria-label="Répartition par ligne">${segs.map(([k, v], i) => `<i style="flex:${v};background:${COUL_PF[i]}" title="${esc(k)}"></i>`).join('')}</div>
      <ul class="legende">${segs.map(([k, v], i) => `<li><i style="background:${COUL_PF[i]}"></i>${esc(k)} <b class="num">${pc(total ? v / total * 100 : 0)}</b></li>`).join('')}</ul></section>
    ${retenir.length ? `<section class="carte"><div class="carte-tete"><h2>À retenir</h2><button class="lien" data-act="btab" data-v="conseils">Tous les conseils</button></div>
      ${retenir.map(([n, t]) => `<div class="cons"><span class="pill ${SEV[n][0]}">${SEV[n][1]}</span><p>${esc(t)}</p></div>`).join('')}</section>` : ''}
    ${etape ? `<section class="carte"><div class="carte-tete"><h2>Prochaine étape</h2><button class="lien" data-act="btab" data-v="conseils">Détail</button></div>
      <p><b>${esc(etape[0])}</b></p><p class="mut">${esc(etape[1])}</p></section>` : ''}
    ${vieux ? `<button class="carte" data-act="ouvrir" data-sheet="cours" style="text-align:left"><b>${vieux} cours à mettre à jour</b><small>Les analyses sont fiables avec des cours récents. Touchez pour tout mettre à jour d’un coup.</small></button>` : ''}`;
}

function bLignes(S) {
  const { ps, total } = S, trie = [...ps].sort((a, b) => b.val - a.val);
  const groupes = groupe(ps, bRep);
  return `
    <div class="rangee"><button class="btn sec" data-act="ouvrir" data-sheet="cours">Mettre à jour les cours</button></div>
    <section class="carte"><ul class="liste">
      ${trie.map(p => `<li><button class="rang" data-act="ouvrir" data-sheet="ligne" data-id="${p.id}" aria-label="${esc(p.ticker)}, détail">
        <span class="av neutre">${initiales(p.ticker)}</span>
        <span class="rang-txt"><b>${esc(p.ticker)}</b><small>${esc(p.nom || p.type)} · ${pc(p.poids)}${p.devise === 'USD' ? ' · USD' : ''}</small></span>
        <span class="droite"><b class="num">${eur(p.val)}</b><span class="pill ${p.pl >= 0 ? 'ok' : 'bad'}">${p.pl >= 0 ? '▲' : '▼'} ${pc(Math.abs(p.plPct))}</span></span></button></li>`).join('')}
    </ul></section>
    <section class="carte"><h2>Répartition</h2>
      <div class="chips" role="group" aria-label="Critère de répartition">${REP.map(([k, n]) => `<button data-act="brep" data-v="${k}" aria-pressed="${bRep === k}">${n}</button>`).join('')}</div>
      ${barres(groupes, total)}</section>`;
}

function bConseils(S) {
  const ordre = { rouge: 0, orange: 1, vert: 2, info: 3 };
  const cons = conseils(S).sort((a, b) => ordre[a[0]] - ordre[b[0]]);
  const prop = proposition(S), idees = prochainInvest(S);
  return `
    <section class="carte"><h2>Proposition d’action</h2>
      ${prop.map(([t, d], i) => `<div class="etape"><b class="n">${i + 1}</b><div><b>${esc(t)}</b><p class="mut">${esc(d)}</p></div></div>`).join('') || '<p class="vide">Ajoutez vos lignes pour obtenir une proposition.</p>'}
      ${cfg().versement > 0 ? '' : '<button class="btn sec" data-act="btab" data-v="outils">Saisir un versement prévu</button>'}
      <small>Calculée à partir de vos données et de règles générales de répartition. Ce n’est pas un conseil en investissement personnalisé : vous restez décisionnaire.</small></section>
    <section class="carte"><h2>Analyse</h2>
      ${cons.map(([n, t]) => `<div class="cons"><span class="pill ${SEV[n][0]}">${SEV[n][1]}</span><p>${esc(t)}</p></div>`).join('')}</section>
    <section class="carte"><h2>Où investir ensuite</h2>
      ${idees.map(([t, d]) => `<div class="cons"><p><b>${esc(t)}</b><br><span class="mut">${esc(d)}</span></p></div>`).join('')}
      <details><summary>Grille pour choisir une action</summary>
        <ul class="liste">${GRILLE.map(g => `<li class="rang" style="min-height:0"><span class="rang-txt">${esc(g)}</span></li>`).join('')}</ul>
        <small>Si vous ne pouvez pas valider la plupart des points, un ETF large reste souvent le choix le plus sûr.</small></details>
      <small>L’application ne désigne aucun titre à acheter : personne ne prédit les cours. Ces pistes indiquent ce qui manque à votre portefeuille.</small></section>`;
}

function bOutils(S) {
  const c = cfg(), { ps, total, investi } = S;
  const revenu = somme(ps, p => p.qte * (p.div || 0));
  const fraisAn = somme(ps, p => p.val * (p.frais || 0) / 100);
  const imposable = somme(ps.filter(p => ENV_IMPOSABLES.includes(p.enveloppe) && p.pl > 0), p => p.pl);
  return `
    <section class="carte"><h2>Rééquilibrage</h2>${champ('versement', 'Versement prévu (€)', c.versement, '10')}${rebalancement(S)}</section>
    <section class="carte"><h2>Dividendes, frais, fiscalité</h2>
      <div class="kv"><span>Dividendes annuels estimés</span><b>${eur(revenu)}</b></div>
      <div class="kv"><span>Rendement sur valeur / sur coût</span><b>${pc(total ? revenu / total * 100 : 0)} / ${pc(investi ? revenu / investi * 100 : 0)}</b></div>
      <div class="kv"><span>Frais annuels (ETF, fonds)</span><b>${eur(fraisAn)}</b></div>
      <div class="kv"><span>Impôt estimé si vente des plus-values hors PEA/AV/PER</span><b>${eur(imposable * c.pfu / 100)}</b></div>
      <small>Taux utilisé : ${c.pfu} %. À vérifier selon la réglementation en vigueur et votre situation.</small></section>
    <section class="carte"><div class="carte-tete"><h2>Dividendes reçus</h2><button class="lien" data-act="ouvrir" data-sheet="div">Ajouter</button></div>
      <div class="kv"><span>Reçus en ${aujourdhui().slice(0, 4)}</span><b>${eur(somme((etat.divs || []).filter(d => d.date.startsWith(aujourdhui().slice(0, 4))), d => d.montant))}</b></div>
      <div class="kv"><span>Estimés sur 12 mois (selon vos lignes)</span><b>${eur(revenu)}</b></div>
      <ul class="liste">${[...(etat.divs || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map(d => `<li class="rang"><span class="rang-txt"><b>${esc(d.ticker)}</b><small>${fmtDate(d.date)}</small></span><b class="num" style="color:var(--ok)">+${eur(d.montant)}</b>
        <button class="icone" data-act="div-del" data-id="${d.id}" aria-label="Supprimer ce dividende">${ico('x', 18)}</button></li>`).join('') || '<li class="vide">Enregistrez les dividendes versés pour suivre votre revenu passif.</li>'}</ul></section>
    <section class="carte"><h2>Simulation long terme</h2>
      <div class="duo">${champ('mensuel', 'Versement mensuel (€)', c.mensuel, '10')}${champ('rendement', 'Rendement/an (%)', c.rendement, '0.5')}</div>
      ${champ('annees', 'Durée (ans)', c.annees, '1', 'max="60"')}${projection()}</section>
    <section class="carte"><h2>Paramètres</h2>
      <div class="duo">${champ('depenses', 'Dépenses mensuelles du foyer (€)', c.depenses, '50')}${champ('epargne', 'Épargne de précaution (€)', c.epargne, '100')}</div>
      <div class="duo">${champ('liquidites', 'Liquidités du compte (€)', c.liquidites, '1')}${champ('eurusd', 'Change : 1 € = … $', c.eurusd, '0.01')}</div>
      ${champ('pfu', 'Taux d’impôt sur plus-values (%)', c.pfu, '0.1')}</section>`;
}

VUES.bourse = function () {
  const S = pfCalc();
  if (!S.ps.length) return `<section class="carte"><h2>Votre portefeuille</h2><p class="mut">Ajoutez vos lignes (actions, ETF…) pour suivre la valeur, la répartition et recevoir des pistes d’amélioration. Les cours sont saisis à la main.</p>
    <button class="btn" data-act="ouvrir" data-sheet="pos">Ajouter une première ligne</button></section>`;
  const corps = { synthese: bSynthese, lignes: bLignes, conseils: bConseils, plan: bPlan, outils: bOutils }[bTab](S);
  return `<div class="chips" role="tablist" aria-label="Sections de la Bourse">${B_TABS.map(([k, n]) => `<button role="tab" data-act="btab" data-v="${k}" aria-selected="${bTab === k}">${n}</button>`).join('')}</div>${corps}`;
};

// ---------- Feuilles de saisie ----------
SHEETS.pos = () => ({ titre: 'Ajouter une ligne', corps: `<form class="formulaire" data-form="pos">
  <div class="duo">${fld('Ticker ou nom court', '<input name="ticker" required autocomplete="off" placeholder="CW8">')}${fld('Nom (facultatif)', '<input name="nom" autocomplete="off">')}</div>
  <div class="duo">${fld('Quantité', '<input type="number" name="qte" step="any" min="0" required inputmode="decimal">')}${fld('Prix de revient', '<input type="number" name="pru" step="any" min="0" required inputmode="decimal">')}</div>
  <div class="duo">${fld('Cours actuel', '<input type="number" name="cours" step="any" min="0" required inputmode="decimal">')}${fld('Devise', '<select name="devise"><option>EUR</option><option>USD</option></select>')}</div>
  <div class="duo">${fld('Type', `<select name="type">${opts(TYPES_PF)}</select>`)}${fld('Enveloppe', `<select name="enveloppe">${opts(ENVELOPPES)}</select>`)}</div>
  <div class="duo">${fld('Secteur', `<select name="secteur">${opts(SECTEURS)}</select>`)}${fld('Zone', `<select name="zone">${opts(ZONES)}</select>`)}</div>
  <details><summary>Options (dividende, frais, cible)</summary><div class="formulaire" style="padding-top:8px">
    <div class="duo">${fld('Dividende annuel / titre (€)', '<input type="number" name="div" step="any" min="0" inputmode="decimal">')}${fld('Frais annuels (%)', '<input type="number" name="frais" step="0.01" min="0" inputmode="decimal">')}</div>
    ${fld('Cible dans le portefeuille (%)', '<input type="number" name="cible" step="1" min="0" max="100" inputmode="decimal">')}</div></details>
  <button class="btn plein">Ajouter la ligne</button></form>` });

SHEETS.cours = () => ({ titre: 'Mettre à jour les cours', corps: `<form class="formulaire" data-form="cours">
  <p class="mut">Saisissez le cours actuel de chaque ligne, en euros.</p>
  ${etat.pf.map(p => fld(`${esc(p.ticker)}${p.devise === 'USD' ? ' ($)' : ''}${p.maj ? ` · mis à jour le ${fmtDate(p.maj)}` : ''}`, `<input type="number" name="c_${p.id}" step="any" min="0" value="${r4(p.cours)}" inputmode="decimal" required>`)).join('')}
  <button class="btn plein">Enregistrer les cours</button></form>` });

SHEETS.ligne = d => {
  const p = pfCalc().ps.find(x => x.id === d.id);
  if (!p) return { titre: 'Ligne', corps: '<p>Ligne introuvable.</p>' };
  return { titre: p.ticker, corps: `
    <div><b class="score">${eur(p.val)}</b> ${pillPl(p.pl, p.plPct)}</div>
    <small>${q6(p.qte)} × ${monnaie(p.cours, p.devise)} · PRU ${monnaie(p.pru, p.devise)} · ${pc(p.poids)} du portefeuille${p.devise === 'USD' ? ` · valeur convertie à ${cfg().eurusd} $/€` : ''}</small>
    <small>${esc(p.nom ? p.nom + ' · ' : '')}${esc(p.type)} · ${esc(p.enveloppe)} · ${esc(p.secteur)} · ${esc(p.zone)}</small>
    <form class="formulaire" data-form="pos-edit"><input type="hidden" name="id" value="${p.id}">
      <div class="duo">${fld(`Cours actuel (${p.devise === 'USD' ? '$' : '€'})`, `<input type="number" name="cours" step="any" min="0" value="${r4(p.cours)}" inputmode="decimal" required>`)}${fld('Cible (%)', `<input type="number" name="cible" step="1" min="0" max="100" value="${p.cible || ''}" inputmode="decimal">`)}</div>
      <div class="duo">${fld('Dividende annuel / titre (€)', `<input type="number" name="div" step="any" min="0" value="${p.div || ''}" inputmode="decimal">`)}${fld('Frais annuels (%)', `<input type="number" name="frais" step="0.01" min="0" value="${p.frais || ''}" inputmode="decimal">`)}</div>
      <button class="btn plein">Enregistrer</button></form>
    <div class="rangee"><button class="btn sec" data-act="pf-achat" data-id="${p.id}">Renforcer</button><button class="btn sec" data-act="pf-vente" data-id="${p.id}">Vendre</button><button class="btn danger" data-act="pf-del" data-id="${p.id}">Supprimer</button></div>` };
};

// ---------- Actions ----------
SHEETS.div = () => ({ titre: 'Dividende reçu', corps: `<form class="formulaire" data-form="div">
  ${fld('Ligne', `<input name="ticker" list="tickers" required autocomplete="off" placeholder="Ticker"><datalist id="tickers">${etat.pf.map(p => `<option value="${esc(p.ticker)}">`).join('')}</datalist>`)}
  <div class="duo">${fld('Montant net (€)', '<input type="number" name="montant" step="0.01" min="0" required inputmode="decimal">')}${fld('Date', `<input type="date" name="date" value="${aujourdhui()}" required>`)}</div>
  <button class="btn plein">Enregistrer</button></form>` });
FORMS.div = f => { (etat.divs = etat.divs || []).push({ id: uid(), date: f.date.value, ticker: f.ticker.value.trim().toUpperCase(), montant: Number(f.montant.value) }); };
ACTIONS['div-del'] = el => { etat.divs = etat.divs.filter(d => d.id !== el.dataset.id); };
ACTIONS.bper = el => { bPer = el.dataset.v; return 'vue'; };
ACTIONS.btab = el => { bTab = el.dataset.v; window.scrollTo(0, 0); return 'vue'; };
ACTIONS.brep = el => { bRep = el.dataset.v; return 'vue'; };
ACTIONS['pf-del'] = el => { etat.pf = etat.pf.filter(p => p.id !== el.dataset.id); };
ACTIONS['pf-achat'] = async el => {
  const p = etat.pf.find(x => x.id === el.dataset.id);
  const r = await dialogue({ titre: `Renforcer ${p.ticker}`, champs: [{ nom: 'q', label: 'Quantité achetée' }, { nom: 'px', label: `Prix unitaire (frais inclus, ${p.devise === 'USD' ? '$' : '€'})`, valeur: r4(p.cours) }], ok: 'Enregistrer' });
  const q = r && nb(r.q), px = r && nb(r.px);
  if (!q || q <= 0 || px === null || px < 0) return false;
  p.pru = (p.qte * p.pru + q * px) / (p.qte + q);
  p.qte += q;
  fermerFeuille();
};
ACTIONS['pf-vente'] = async el => {
  const p = etat.pf.find(x => x.id === el.dataset.id);
  const r = await dialogue({ titre: `Vendre ${p.ticker}`, texte: `Quantité détenue : ${p.qte}`, champs: [{ nom: 'q', label: 'Quantité vendue' }, { nom: 'px', label: `Prix de vente unitaire (${p.devise === 'USD' ? '$' : '€'})`, valeur: r4(p.cours) }], ok: 'Enregistrer' });
  const q = r && nb(r.q), px = r && nb(r.px);
  if (!q || q <= 0 || q > p.qte) { if (r) info(`Quantité invalide (maximum ${p.qte}).`); return false; }
  if (px === null || px < 0) return false;
  cfg().realise += (px - p.pru) * q / (p.devise === 'USD' ? (cfg().eurusd || 1) : 1);
  p.qte -= q;
  if (p.qte <= 0) etat.pf = etat.pf.filter(x => x.id !== p.id);
  fermerFeuille();
};
FORMS.pos = f => etat.pf.push({
  id: uid(), ticker: f.ticker.value.trim().toUpperCase(), nom: f.nom.value.trim(), type: f.type.value, enveloppe: f.enveloppe.value,
  secteur: f.secteur.value, zone: f.zone.value, devise: f.devise.value, qte: Number(f.qte.value), pru: Number(f.pru.value), cours: Number(f.cours.value),
  div: Number(f.div.value) || 0, frais: Number(f.frais.value) || 0, cible: Number(f.cible.value) || 0, maj: aujourdhui(),
});
FORMS['pos-edit'] = f => {
  const p = etat.pf.find(x => x.id === f.id.value);
  if (!p) return;
  const cours = Number(f.cours.value) || 0;
  if (cours !== p.cours) p.maj = aujourdhui();
  Object.assign(p, { cours, cible: Number(f.cible.value) || 0, div: Number(f.div.value) || 0, frais: Number(f.frais.value) || 0 });
};
FORMS.cours = f => etat.pf.forEach(p => {
  const v = Number(f['c_' + p.id].value);
  if (!isNaN(v)) { p.cours = v; p.maj = aujourdhui(); }
});
function changePf(t) {
  cfg()[t.dataset.pfcfg] = Number(t.value) || 0;
  sauver(); rendre();
}
majHisto();
sauver();
