'use strict';
// Onglet Bourse : suivi du portefeuille, analyses et conseils basés sur des règles.
// Les cours sont saisis à la main (aucune donnée de marché n'est récupérée).

const TYPES_PF = ['Action', 'ETF', 'Fonds', 'Obligation', 'Crypto', 'Autre'];
const ENVELOPPES = ['PEA', 'PEA-PME', 'CTO', 'Assurance-vie', 'PER', 'Autre'];
const ZONES = ['Monde', 'Europe', 'USA', 'Émergents', 'Asie-Pacifique', 'Autre'];
const SECTEURS = ['Diversifié', 'Technologie', 'Santé', 'Finance', 'Industrie', 'Consommation', 'Énergie', 'Immobilier', 'Matériaux', 'Services publics', 'Télécoms', 'Autre'];
const ENV_IMPOSABLES = ['CTO', 'Autre'];

function cfg() {
  etat.pfCfg = { pfu: 30, versement: 0, rendement: 6, mensuel: 0, annees: 20, depenses: 0, epargne: 0, realise: 0, ...(etat.pfCfg || {}) };
  return etat.pfCfg;
}
const somme = (a, f) => a.reduce((s, x) => s + f(x), 0);
const nb = s => { const v = Number(String(s).replace(',', '.')); return isNaN(v) ? null : v; };
const pc = n => n.toFixed(1).replace('.', ',') + ' %';
const couleurPl = n => (n >= 0 ? 'var(--ok)' : 'var(--ko)');

function pfCalc() {
  const ps = etat.pf.map(p => ({ ...p, val: p.qte * p.cours, cout: p.qte * p.pru }));
  const total = somme(ps, p => p.val), investi = somme(ps, p => p.cout);
  ps.forEach(p => { p.poids = total ? p.val / total * 100 : 0; p.pl = p.val - p.cout; p.plPct = p.cout ? p.pl / p.cout * 100 : 0; });
  return { ps, total, investi, pl: total - investi };
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
const barres = (liste, total) => liste.map(([k, v]) => `<div style="margin-bottom:6px"><div class="bar" style="margin:0"><span>${esc(k)}</span><span>${pc(total ? v / total * 100 : 0)} · ${eur(v)}</span></div><div class="jauge"><i style="width:${total ? v / total * 100 : 0}%;background:var(--pri)"></i></div></div>`).join('');
const opts = (liste, sel) => liste.map(o => `<option${o === sel ? ' selected' : ''}>${o}</option>`).join('');
const champ = (id, label, val, step = '1', extra = '') => `<label class="mut" style="display:block">${label}<br><input type="number" step="${step}" min="0" data-pfcfg="${id}" value="${val || ''}" ${extra} style="width:100%"></label>`;

function rebalancement(S) {
  const c = cfg(), cibles = S.ps.filter(p => p.cible > 0);
  if (!cibles.length) return '<p class="mut">Définissez une « cible % » sur vos lignes pour obtenir un plan de rééquilibrage.</p>';
  const base = S.total + c.versement;
  const lignes = cibles.map(p => ({ p, delta: p.cible / 100 * base - p.val }));
  let achat = lignes.map(l => Math.max(l.delta, 0));
  const sPos = somme(achat, x => x);
  if (c.versement > 0 && sPos > c.versement) achat = achat.map(x => x / sPos * c.versement);
  return `<table style="width:100%;border-collapse:collapse"><tr class="mut"><td>Ligne</td><td>Actuel</td><td>Cible</td><td>Action</td></tr>
    ${lignes.map((l, i) => {
      const mont = c.versement > 0 ? achat[i] : l.delta;
      const n = l.p.cours ? Math.floor(Math.abs(mont) / l.p.cours) : 0;
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
  return `<table style="width:100%;border-collapse:collapse"><tr class="mut"><td>Rendement/an</td><td>Capital final</td><td>En euros d'aujourd'hui (infl. 2 %)</td></tr>
    ${[Math.max(c.rendement - 2, 0), c.rendement, c.rendement + 2].map(r => `<tr><td>${pc(r)}</td><td><b>${eur(fv(r))}</b></td><td>${eur(fv(r) / 1.02 ** n)}</td></tr>`).join('')}</table>
    <p class="mut">Total versé : ${eur(versé)} sur ${n} ans. Simulation théorique : les marchés ne rapportent pas un taux constant et le capital peut baisser, y compris longtemps.</p>`;
}

VUES.bourse = function () {
  const c = cfg(), S = pfCalc(), { ps, total, investi, pl } = S;
  const insights = conseils(S);
  const ico = { rouge: '🔴', orange: '🟠', vert: '🟢', info: 'ℹ️' };
  const revenu = somme(ps, p => p.qte * (p.div || 0));
  const fraisAn = somme(ps, p => p.val * (p.frais || 0) / 100);
  const imposable = somme(ps.filter(p => ENV_IMPOSABLES.includes(p.enveloppe) && p.pl > 0), p => p.pl);
  const trie = [...ps].sort((a, b) => b.val - a.val);
  return `
    <div class="card">
      <div class="bar"><span>Valeur</span><b class="score">${eur(total)}</b></div>
      <div class="bar"><span>Investi</span><b>${eur(investi)}</b></div>
      <div class="bar"><span>Plus/moins-value latente</span><b style="color:${couleurPl(pl)}">${eur(pl)} (${pc(investi ? pl / investi * 100 : 0)})</b></div>
      ${c.realise ? `<div class="bar"><span>Réalisé (ventes saisies)</span><b style="color:${couleurPl(c.realise)}">${eur(c.realise)}</b></div>` : ''}
    </div>
    <div class="card"><h2>🧭 Analyse et conseils</h2>
      <ul class="list">${insights.map(([n, t]) => `<li style="align-items:flex-start"><span>${ico[n]}</span><div class="grow">${esc(t)}</div></li>`).join('')}</ul>
      <p class="mut">Informations générales issues de règles courantes de gestion de portefeuille. Ce n'est pas un conseil en investissement personnalisé : un placement comporte un risque de perte en capital.</p>
    </div>
        <div class="card"><h2>🎯 Où investir ensuite</h2>
      <ul class="list">${prochainInvest(S).map(([t, d]) => `<li style="align-items:flex-start"><div class="grow"><b>${esc(t)}</b><br><span class="mut">${esc(d)}</span></div></li>`).join('') || '<li class="vide">Ajoutez vos lignes pour obtenir des pistes.</li>'}</ul>
      <details style="margin-top:8px"><summary><b>Grille pour choisir une action</b></summary>
        <ul class="list">${GRILLE.map(g => `<li style="align-items:flex-start"><span>☐</span><div class="grow">${esc(g)}</div></li>`).join('')}</ul>
        <p class="mut">Si vous ne pouvez pas cocher la plupart des cases, l'ETF reste souvent le choix le plus sûr.</p></details>
      <p class="mut">L'application ne désigne volontairement aucun titre à acheter : personne ne prédit les cours, et une recommandation individuelle suppose de connaître votre situation. Ces pistes indiquent ce qui manque à votre portefeuille.</p>
    </div>
    <div class="card"><h2>🧾 Proposition d'action</h2>
      <ol style="margin:0;padding-left:20px">${proposition(S).map(([t, d]) => `<li style="margin-bottom:8px"><b>${esc(t)}</b><br><span class="mut">${esc(d)}</span></li>`).join('') || '<li class="mut">Ajoutez vos lignes pour obtenir une proposition.</li>'}</ol>
      <p class="mut">Proposition calculée à partir de vos données et de règles générales de répartition. Elle illustre une démarche possible, elle ne constitue pas un conseil en investissement personnalisé. Vous restez décisionnaire.</p>
    </div>
    <div class="card"><h2>📊 Répartition</h2>
      ${ps.length ? `<h3 class="mut">Par support</h3>${barres(trie.map(p => [p.ticker, p.val]), total)}
      <h3 class="mut">Par type</h3>${barres(groupe(ps, 'type'), total)}
      <h3 class="mut">Par secteur</h3>${barres(groupe(ps, 'secteur'), total)}
      <h3 class="mut">Par zone</h3>${barres(groupe(ps, 'zone'), total)}
      <h3 class="mut">Par enveloppe</h3>${barres(groupe(ps, 'enveloppe'), total)}` : '<p class="vide">Aucune ligne</p>'}
    </div>
    <div class="card"><h2>📈 Lignes</h2><ul class="list">
      ${trie.map(p => `<li style="flex-wrap:wrap">
        <div class="grow"><b>${esc(p.ticker)}</b> <span class="mut">${esc(p.nom || '')} · ${p.type} · ${p.enveloppe} · ${p.zone}</span><br>
          <span class="mut">${p.qte} × ${eur(p.cours)} (PRU ${eur(p.pru)}) · ${pc(p.poids)}</span><br>
          <b>${eur(p.val)}</b> <span style="color:${couleurPl(p.pl)}">${eur(p.pl)} (${pc(p.plPct)})</span></div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
          <input type="number" step="0.01" data-pf="cours" data-id="${p.id}" value="${p.cours}" style="width:90px" title="Cours actuel" aria-label="Cours ${esc(p.ticker)}">
          <input type="number" step="1" min="0" max="100" data-pf="cible" data-id="${p.id}" value="${p.cible || ''}" placeholder="cible %" style="width:70px" aria-label="Cible ${esc(p.ticker)}">
          <button class="btn sec" data-act="pf-achat" data-id="${p.id}">Renforcer</button>
          <button class="btn sec" data-act="pf-vente" data-id="${p.id}">Vendre</button>
          <button class="btn del" data-act="pf-del" data-id="${p.id}" aria-label="Supprimer">✕</button></div></li>`).join('') || '<li class="vide">Ajoutez votre première ligne ci-dessous</li>'}
    </ul></div>
    <div class="card"><h2>⚖️ Rééquilibrage</h2>
      ${champ('versement', 'Versement prévu (€)', c.versement, '10')}
      <div style="margin-top:8px">${rebalancement(S)}</div></div>
    <div class="card"><h2>💰 Dividendes, frais et fiscalité</h2>
      <div class="bar"><span>Dividendes annuels estimés</span><b>${eur(revenu)}</b></div>
      <div class="bar"><span>Rendement sur valeur / sur coût</span><b>${pc(total ? revenu / total * 100 : 0)} / ${pc(investi ? revenu / investi * 100 : 0)}</b></div>
      <div class="bar"><span>Frais annuels estimés (ETF/fonds)</span><b>${eur(fraisAn)}</b></div>
      <div class="bar"><span>Impôt estimé si vente des plus-values hors PEA/AV/PER</span><b>${eur(imposable * c.pfu / 100)}</b></div>
      <p class="mut">Taux d'imposition utilisé : ${c.pfu} % (modifiable dans les paramètres, à vérifier selon la réglementation en vigueur et votre situation).</p></div>
    <div class="card"><h2>🔮 Simulation sur le long terme</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
        ${champ('mensuel', 'Versement mensuel (€)', c.mensuel, '10')}${champ('rendement', 'Rendement/an (%)', c.rendement, '0.5')}${champ('annees', 'Durée (ans)', c.annees, '1', 'max="60"')}</div>
      ${projection()}</div>
    <details class="card"><summary><b>Ajouter une ligne</b></summary>
      <form data-form="pos" class="formgrid" style="margin-top:10px">
        <input type="text" name="ticker" placeholder="Ticker ou nom court (ex : CW8)" required>
        <input type="text" name="nom" placeholder="Nom complet (optionnel)">
        <select name="type" aria-label="Type">${opts(TYPES_PF)}</select>
        <select name="enveloppe" aria-label="Enveloppe">${opts(ENVELOPPES)}</select>
        <select name="secteur" aria-label="Secteur">${opts(SECTEURS)}</select>
        <select name="zone" aria-label="Zone">${opts(ZONES)}</select>
        <input type="number" name="qte" step="any" min="0" placeholder="Quantité" required>
        <input type="number" name="pru" step="any" min="0" placeholder="Prix de revient (PRU)" required>
        <input type="number" name="cours" step="any" min="0" placeholder="Cours actuel" required>
        <input type="number" name="div" step="any" min="0" placeholder="Dividende annuel / titre">
        <input type="number" name="frais" step="0.01" min="0" placeholder="Frais annuels % (ETF)">
        <input type="number" name="cible" step="1" min="0" max="100" placeholder="Cible % du portefeuille">
        <button class="btn">Ajouter</button></form></details>
    <details class="card"><summary><b>Paramètres</b></summary><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">
      ${champ('depenses', 'Dépenses mensuelles du foyer (€)', c.depenses, '50')}${champ('epargne', 'Épargne de précaution disponible (€)', c.epargne, '100')}${champ('pfu', 'Taux d\'impôt sur plus-values (%)', c.pfu, '0.1')}</div></details>`;
};

// ---------- Actions ----------
ACTIONS['pf-del'] = async el => { if (!await confirmer('Supprimer cette ligne ?')) return false; etat.pf = etat.pf.filter(p => p.id !== el.dataset.id); };
ACTIONS['pf-achat'] = async el => {
  const p = etat.pf.find(x => x.id === el.dataset.id);
  const r = await dialogue({ titre: `Renforcer ${p.ticker}`, champs: [{ nom: 'q', label: 'Quantité achetée' }, { nom: 'px', label: 'Prix unitaire (frais inclus)', valeur: p.cours }], ok: 'Enregistrer' });
  const q = r && nb(r.q), px = r && nb(r.px);
  if (!q || q <= 0 || px === null || px < 0) return false;
  p.pru = (p.qte * p.pru + q * px) / (p.qte + q);
  p.qte += q;
};
ACTIONS['pf-vente'] = async el => {
  const p = etat.pf.find(x => x.id === el.dataset.id);
  const r = await dialogue({ titre: `Vendre ${p.ticker}`, texte: `Quantité détenue : ${p.qte}`, champs: [{ nom: 'q', label: 'Quantité vendue' }, { nom: 'px', label: 'Prix de vente unitaire', valeur: p.cours }], ok: 'Enregistrer' });
  const q = r && nb(r.q), px = r && nb(r.px);
  if (!q || q <= 0 || q > p.qte) { if (r) info(`Quantité invalide (maximum ${p.qte}).`); return false; }
  if (px === null || px < 0) return false;
  cfg().realise += (px - p.pru) * q;
  p.qte -= q;
  if (p.qte <= 0) etat.pf = etat.pf.filter(x => x.id !== p.id);
};
FORMS.pos = f => etat.pf.push({
  id: uid(), ticker: f.ticker.value.trim().toUpperCase(), nom: f.nom.value.trim(), type: f.type.value, enveloppe: f.enveloppe.value,
  secteur: f.secteur.value, zone: f.zone.value, qte: Number(f.qte.value), pru: Number(f.pru.value), cours: Number(f.cours.value),
  div: Number(f.div.value) || 0, frais: Number(f.frais.value) || 0, cible: Number(f.cible.value) || 0, maj: aujourdhui(),
});
function changePf(t) {
  if (t.dataset.pfcfg) cfg()[t.dataset.pfcfg] = Number(t.value) || 0;
  else {
    const p = etat.pf.find(x => x.id === t.dataset.id);
    if (!p) return;
    if (t.dataset.pf === 'cours') { p.cours = Number(t.value) || 0; p.maj = aujourdhui(); }
    else p.cible = Number(t.value) || 0;
  }
  sauver(); rendre();
}
TITRES.bourse = 'Bourse';
