'use strict';
// Activité sportive par membre : plan d'entraînement, suivi des séances, conseils de récupération et d'alimentation.
// Les conseils sont des repères généraux de nutrition et de récupération du sport, pas un avis médical.

const SPORTS = [['course', 'Course à pied'], ['velo', 'Vélo'], ['natation', 'Natation'], ['muscu', 'Musculation'], ['marche', 'Marche ou randonnée'], ['yoga', 'Yoga ou mobilité'], ['collectif', 'Sport collectif'], ['fitness', 'Fitness ou HIIT'], ['autre', 'Autre']];
const nomSport = k => (SPORTS.find(s => s[0] === k) || [0, 'Autre'])[1];
const OBJECTIFS_SPORT = [['forme', 'Forme et santé'], ['endurance', 'Endurance'], ['force', 'Force et muscle'], ['perte', 'Perte de poids'], ['competition', 'Compétition']];
const NIVEAUX = [['debutant', 'Débutant'], ['moyen', 'Intermédiaire'], ['avance', 'Avancé']];
const JOURS_L = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const RPE_LIB = { 1: 'très facile', 3: 'facile', 5: 'modéré', 7: 'difficile', 8: 'très difficile', 10: 'maximal' };
const optRpe = sel => Array.from({ length: 10 }, (_, i) => i + 1).map(i => `<option value="${i}"${i === sel ? ' selected' : ''}>${i}${RPE_LIB[i] ? ' · ' + RPE_LIB[i] : ''}</option>`).join('');

let sportM = '';
const membreSport = () => {
  const l = membresSport();
  if (!l.length) return null;
  if (!l.some(m => m.id === sportM)) sportM = l.some(m => m.id === etat.actif) ? etat.actif : l[0].id;
  return membre(sportM);
};
function ageDe(m) {
  if (!m || !m.naissance) return null;
  const n = new Date(), d = parse(m.naissance);
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return a;
}
const categorie = m => { if (m.tranche) return m.tranche; const a = ageDe(m); return a == null || a >= 18 ? 'adulte' : a >= 12 ? 'ado' : a >= 2 ? 'enfant' : 'bebe'; };
const membresSport = () => etat.membres.filter(m => categorie(m) !== 'bebe');
const profilSport = id => etat.sportProfils.find(x => x.id === id) || { id, poids: 0, objectif: 'forme', niveau: 'moyen', sommeil: 0, objHebdo: 0 };
const objectifHebdo = (m, p) => p.objHebdo || (categorie(m) === 'adulte' ? 150 : 420);
const seancesDe = id => etat.sportSeances.filter(s => s.membre === id);
const planDe = id => etat.sportPlan.filter(s => s.membre === id);
const progDe = id => (etat.sportProg || []).find(p => p.membre === id);
// Récurrence d'une séance prévue : ancien modèle (jour de la semaine) ou date de départ + fréquence
const REC_SPORT = [['', 'Une seule fois'], ['semaine', 'Chaque semaine'], ['quinzaine', 'Toutes les 2 semaines'], ['jour', 'Chaque jour'], ['mois', 'Chaque mois']];
const recSport = k => (REC_SPORT.find(r => r[0] === k) || REC_SPORT[0])[1];
function itemPrevu(x, date) {
  if (x.date == null) return x.jour === jourIdx(date); // ancien modèle : chaque semaine
  if (x.fin && date > x.fin) return false;
  return arrive({ date: x.date, rec: x.rec || '' }, date);
}
const prochainJour = idx => { for (let i = 0; i < 7; i++) { const d = iso(ajouteJours(new Date(), i)); if (jourIdx(d) === idx) return d; } return aujourdhui(); };
// Séances prévues un jour donné : séances récurrentes du plan + séances du programme
function prevuesLe(id, date) {
  const l = planDe(id).filter(x => itemPrevu(x, date));
  (etat.sportProg || []).filter(p => p.membre === id).forEach(p => {
    const off = diffJours(p.debut, date), n = Math.floor(off / 7) + 1;
    const sem = p.semaines.find(w => w.n === n);
    if (off >= 0 && sem) sem.seances.filter(x => x.jour === off % 7).forEach((x, k) => l.push({ ...x, id: `${p.id}:${n}:${x.id}`, membre: id, prog: p.nom, semaine: n }));
  });
  return l;
}
const trouverPrevue = (id, plan) => planDe(id).find(x => x.id === plan) || (() => { for (let i = -7; i <= 7; i++) { const x = prevuesLe(id, iso(ajouteJours(new Date(), i))).find(y => y.id === plan); if (x) return x; } return null; })();
const lundiIso = (d = new Date()) => iso(lundi(d));
const jourIdx = d => (parse(d).getDay() + 6) % 7;
function statsSemaine(id, lun) {
  const fin = iso(ajouteJours(parse(lun), 6)), l = seancesDe(id).filter(s => s.date >= lun && s.date <= fin);
  return { minutes: somme(l, s => s.duree), n: l.length, charge: somme(l, s => s.duree * s.rpe), jours: new Set(l.map(s => s.date)).size, l };
}
const semaine = k => iso(ajouteJours(parse(lundiIso()), -7 * k));
const pnum = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ---------- Allure ----------
const SPORT_DIST = ['course', 'marche', 'velo', 'natation'];
const mmss = sec => { const r = Math.round(sec); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };
const hhmmss = min => { const r = Math.round(min * 60), h = Math.floor(r / 3600), m = Math.floor(r % 3600 / 60), sc = r % 60; return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m}:${String(sc).padStart(2, '0')}`; };
// secondes par km (course, marche), par 100 m (natation), ou km/h (vélo)
function allureSec(s) {
  if (!s.distance || !s.duree || !SPORT_DIST.includes(s.type)) return null;
  return s.type === 'velo' ? s.distance / (s.duree / 60) : s.type === 'natation' ? s.duree * 60 / (s.distance * 10) : s.duree * 60 / s.distance;
}
const fmtAllureVal = (type, v) => (type === 'velo' ? `${v.toFixed(1).replace('.', ',')} km/h` : type === 'natation' ? `${mmss(v)}/100 m` : `${mmss(v)}/km`);
const fmtAllure = s => { const v = allureSec(s); return v == null ? '' : fmtAllureVal(s.type, v); };
const plageAllure = txt => { const m = /(\d+):(\d+)\s*-\s*(\d+):(\d+)/.exec(txt || ''); return m ? [m[1] * 60 + +m[2], m[3] * 60 + +m[4]] : null; };
function badgeAllure(s) {
  const r = plageAllure(s.allurePrevue), v = allureSec(s);
  if (!r || v == null || s.type !== 'course') return '';
  const facile = /foot|sortie/i.test(s.titre || '');
  return v < r[0] - 2 ? (facile ? '<span class="pill warn">Plus rapide que prévu</span>' : '<span class="pill ok">Plus rapide que prévu</span>')
    : v > r[1] + 2 ? '<span class="pill warn">Plus lent que prévu</span>' : '<span class="pill ok">Dans l’allure</span>';
}
let allureType = 'course';
const tempsTotal = l => somme(l, s => s.duree) * 60 / Math.max(0.001, somme(l, s => s.distance));
function carteAllure(m) {
  const p = profilSport(m.id), toutes = seancesDe(m.id).filter(s => allureSec(s) != null);
  const types = SPORT_DIST.filter(t => toutes.some(s => s.type === t));
  if (!types.length) return `<section class="carte"><h2>Allure</h2><p class="vide">Renseignez la distance de vos séances (course, marche, vélo, natation) pour suivre votre allure.</p></section>`;
  if (!types.includes(allureType)) allureType = types[0];
  const l = toutes.filter(s => s.type === allureType).sort((a, b) => a.date.localeCompare(b.date) || (a.id > b.id ? 1 : -1));
  const dern = l.slice(-12), velo = allureType === 'velo', fmtV = v => fmtAllureVal(allureType, v);
  const moyenne = lst => (velo ? somme(lst, s => s.distance) / (somme(lst, s => s.duree) / 60) : tempsTotal(lst));
  const dernieres = l.slice(-4), moy4 = moyenne(dernieres);
  const eligibles = allureType === 'course' ? l.filter(s => s.distance >= 3) : l;
  const meilleure = eligibles.length ? (velo ? Math.max(...eligibles.map(allureSec)) : Math.min(...eligibles.map(allureSec))) : null;
  let tendance = '';
  if (l.length >= 6) {
    const a = moyenne(l.slice(-3)), b = moyenne(l.slice(-6, -3)), d = velo ? a - b : b - a; // positif = mieux
    tendance = `<div class="kv"><span>Tendance (3 dernières sorties)</span><b style="color:var(--${d > 0 ? 'ok' : 'warn'})">${d > 0 ? 'En progrès' : 'Plus lente'} : ${velo ? Math.abs(d).toFixed(1).replace('.', ',') + ' km/h' : Math.abs(Math.round(d)) + ' s/km'}</b></div>`;
  }
  let projections = '';
  if (allureType === 'course') {
    const il56 = iso(ajouteJours(new Date(), -56)), rec = l.filter(s => s.distance >= 4 && s.date >= il56);
    if (rec.length) {
      const prev = D => Math.min(...rec.map(s => s.duree * Math.pow(D / s.distance, 1.06)));
      projections = `<div class="kv"><span>Estimation 10 km</span><b>${hhmmss(prev(10))}</b></div><div class="kv"><span>Estimation semi-marathon</span><b>${hhmmss(prev(21.0975))}</b></div>
        <small>Estimations indicatives (formule de Riegel) d’après votre meilleure sortie des 8 dernières semaines. Une sortie volontairement facile les sous-estime.</small>`;
    }
    if (p.obj10k) projections += `<div class="kv"><span>Objectif 10 km</span><b>${hhmmss(p.obj10k)}${p.ref10k ? ' · départ ' + hhmmss(p.ref10k) : ''}</b></div>`;
  }
  const pts = dern.map(s => ({ label: s.date, v: [allureSec(s)] }));
  return `<section class="carte"><h2>Allure</h2>
    ${types.length > 1 ? `<div class="chips" role="group" aria-label="Sport">${types.map(t => `<button data-act="allure-type" data-v="${t}" aria-pressed="${allureType === t}">${nomSport(t)}</button>`).join('')}</div>` : ''}
    <div class="kv"><span>Allure moyenne (4 dernières séances)</span><b>${fmtV(moy4)}</b></div>
    ${meilleure != null ? `<div class="kv"><span>Meilleure allure${allureType === 'course' ? ' (3 km ou plus)' : ''}</span><b>${fmtV(meilleure)}</b></div>` : ''}
    ${tendance}${projections}
    ${pts.length >= 2 ? grapheLigne('allure' + allureType, pts, [{ nom: 'Allure par séance', c: '--c1' }], `Allure des ${pts.length} dernières séances${velo ? '' : ' (plus bas = plus rapide)'}`, fmtCourt, fmtV) : '<small>Enregistrez au moins deux séances avec distance pour voir la courbe.</small>'}</section>`;
}

// ---------- Conseils ----------
function contexteJour(id, date) {
  const faites = seancesDe(id).filter(s => s.date === date);
  const prevues = prevuesLe(id, date);
  const l = faites.length ? faites : prevues.map(s => ({ duree: s.duree, rpe: s.rpe, type: s.type, prevue: true }));
  const minutes = somme(l, s => s.duree), rpe = Math.max(0, ...l.map(s => s.rpe));
  const type = !l.length ? 'repos' : (rpe >= 8 || minutes >= 90) ? 'long' : (minutes >= 45 || rpe >= 5) ? 'modere' : 'leger';
  return { l, minutes, rpe, type, prevue: !faites.length && prevues.length > 0 };
}
function conseilsSport(m) {
  const id = m.id, p = profilSport(id), cat = categorie(m), auj = aujourdhui(), demain = iso(ajouteJours(parse(auj), 1)), poids = p.poids || 0;
  const recup = [], jour = [], fond = [];
  const st = k => statsSemaine(id, semaine(k)), s0 = st(0), s1 = st(1), s2 = st(2), s3 = st(3);
  const moy = (s1.charge + s2.charge + s3.charge) / 3;
  const toutes = seancesDe(id), dates = new Set(toutes.map(s => s.date));
  const il7 = iso(ajouteJours(parse(auj), -6)), hier = iso(ajouteJours(parse(auj), -1));
  const l7 = toutes.filter(s => s.date >= il7 && s.date <= auj);
  let conso = 0;
  for (let i = 0; i < 40; i++) { const d = iso(ajouteJours(parse(auj), -i)); if (dates.has(d)) conso++; else if (i > 0) break; }
  const rpeRecent = Math.max(0, ...toutes.filter(s => s.date >= hier && s.date <= auj).map(s => s.rpe));
  const douleur = toutes.filter(s => s.douleur && s.date >= il7).sort((a, b) => b.date.localeCompare(a.date))[0];
  const aujC = contexteJour(id, auj), demC = contexteJour(id, demain);
  const adulte = cat === 'adulte', jeune = !adulte;

  // Récupération
  if (douleur) recup.push(['rouge', `Douleur signalée le ${fmtDate(douleur.date)} : réduisez la charge et évitez de forcer. Si elle dure plus de quelques jours, revient à chaque effort ou s’aggrave, consultez un professionnel de santé.`]);
  if (conso >= (adulte ? 4 : 3)) recup.push(['orange', `${conso} jours d’entraînement d’affilée : prévoyez un jour de repos ou une séance très légère (marche, mobilité).`]);
  if (l7.length && new Set(l7.map(s => s.date)).size === 7) recup.push(['rouge', 'Aucun jour de repos sur les 7 derniers jours : le repos fait partie de l’entraînement, c’est là que le corps progresse.']);
  if (rpeRecent >= 8) recup.push(['orange', `Séance intense récente (effort ${rpeRecent}/10) : laissez environ 48 h avant la prochaine séance dure et privilégiez aujourd’hui une séance facile, de la mobilité ou du repos.`]);
  if (rpeRecent >= 8 && demC.rpe >= 8 && demC.prevue) recup.push(['orange', 'Une séance intense est prévue demain juste après un gros effort : envisagez de la décaler ou de l’alléger.']);
  if (moy > 0 && s0.charge > 1.3 * moy) recup.push(['orange', `Charge de la semaine en hausse de ${Math.round((s0.charge / moy - 1) * 100)} % par rapport à votre moyenne des 3 semaines précédentes. Au-delà de +30 %, le risque de blessure augmente : stabilisez la fin de semaine.`]);
  else if (moy > 0 && s0.charge < 0.5 * moy && new Date().getDay() !== 1) recup.push(['info', 'Semaine plus légère que d’habitude : une bonne occasion de récupérer. Reprenez ensuite progressivement.']);
  if (s2.charge > 0 && s1.charge > s2.charge && s0.charge > s1.charge) recup.push(['orange', 'Trois semaines de hausse consécutives : prévoyez une semaine allégée (environ 30 à 40 % de volume en moins) pour assimiler.']);
  const sommeilMin = adulte ? 7 : cat === 'ado' ? 8 : 9;
  if (p.sommeil && p.sommeil < sommeilMin) recup.push(['orange', `Sommeil moyen de ${String(p.sommeil).replace('.', ',')} h : visez ${sommeilMin} h ou plus${adulte ? ' (7 à 9 h)' : ''}. C’est le premier levier de récupération.`]);
  else if (!p.sommeil) recup.push(['info', 'Renseignez votre sommeil moyen dans le profil pour affiner les conseils de récupération.']);
  const objH = objectifHebdo(m, p);
  const jSem = new Date().getDay();
  if ((jSem >= 4 || jSem === 0) && s0.minutes < objH) recup.push(['info', `Cette semaine : ${s0.minutes} min sur un objectif de ${objH} min${adulte ? ' (repère de 150 min d’activité modérée par semaine)' : ' (repère de 60 min par jour pour les enfants et adolescents)'}.`]);
  const dernier = dates.size ? [...dates].sort().pop() : null;
  if (!dernier || diffJours(dernier, auj) > 14) recup.push(['info', 'Peu d’activité récente : reprenez avec 2 à 3 séances faciles de 20 à 30 minutes avant d’augmenter.']);
  if (jeune) recup.push(['info', 'Chez l’enfant et l’adolescent, privilégiez le jeu, la variété des activités et le plaisir. Évitez la spécialisation précoce et les charges lourdes sans encadrement.']);
  if (!recup.length) recup.push(['vert', 'Rien d’inquiétant sur les derniers jours : continuez ainsi en gardant au moins un jour de repos par semaine.']);

  // Alimentation et hydratation du jour, selon la séance prévue ou faite
  const T = { repos: 'jour de repos', leger: 'séance légère', modere: 'séance modérée', long: 'séance longue ou intense' }[aujC.type];
  jour.push(['info', `Aujourd’hui : ${T}${aujC.l.length ? ` (${aujC.minutes} min${aujC.prevue ? ', prévue' : ''})` : ''}.`]);
  if (adulte && poids) {
    const g = { repos: [3, 5], leger: [3, 5], modere: [5, 7], long: [aujC.minutes >= 90 ? 7 : 6, 10] }[aujC.type];
    jour.push(['info', `Glucides : environ ${pnum(g[0] * poids)} à ${pnum(g[1] * poids)} g sur la journée (${g[0]} à ${g[1]} g par kg), à répartir sur les repas.`]);
    if (aujC.l.length) jour.push(['info', `Après la séance, dans les 2 heures : des glucides (riz, pâtes, pain, fruits) avec environ ${pnum(0.25 * poids)} à ${pnum(0.3 * poids)} g de protéines (œufs, yaourt grec, poisson, volaille, légumineuses).`]);
    const h = aujC.minutes >= 60 ? `Pendant la séance : 400 à 800 ml par heure selon la chaleur${aujC.minutes >= 90 ? ', avec 30 à 60 g de glucides par heure (boisson, banane, compote)' : ''}. ` : '';
    jour.push(['info', `Hydratation : environ ${pnum(5 * poids)} à ${pnum(7 * poids)} ml dans les 2 à 4 heures avant l’effort. ${h}Après, buvez en plusieurs fois, et davantage si vous avez beaucoup transpiré.`]);
  } else if (adulte) {
    jour.push(['info', 'Renseignez votre poids dans le profil pour obtenir des repères chiffrés (glucides, protéines, hydratation).']);
    if (aujC.l.length) jour.push(['info', 'Avant : un repas riche en glucides 2 à 4 heures avant. Après, dans les 2 heures : glucides et protéines. Buvez régulièrement pendant l’effort.']);
  } else {
    jour.push(['info', 'Petit-déjeuner complet, repas variés et une collation simple avant ou après l’activité (fruit, yaourt, pain). Buvez de l’eau régulièrement, surtout autour du sport.']);
  }
  if (demC.type === 'long' && demC.prevue) jour.push(['info', 'Séance longue ou intense demain : ce soir, un repas riche en glucides (pâtes, riz, pommes de terre) et une bonne hydratation, sans excès de graisses.']);
  if (aujC.type === 'repos' && adulte) jour.push(['info', 'Jour de repos : gardez des protéines à chaque repas et vous pouvez un peu réduire les glucides. Pas besoin de « compenser » : le corps répare.']);

  // Repères généraux
  if (adulte) {
    if (poids) {
      const [a, b] = p.objectif === 'force' ? [1.6, 2] : [1.4, 1.8], vf = n => String(n).replace('.', ',');
      fond.push(['info', `Protéines : environ ${pnum(a * poids)} à ${pnum(b * poids)} g par jour (${vf(a)} à ${vf(b)} g par kg), réparties sur 3 à 4 prises.`]);
    }
    if (p.objectif === 'perte') fond.push(['orange', 'Perte de poids : visez un déficit modéré et progressif, sans réduire fortement les apports les jours d’entraînement. Une alimentation trop pauvre ralentit la récupération et augmente le risque de blessure. L’avis d’un diététicien est utile.']);
    if (p.objectif === 'endurance' || p.objectif === 'competition') fond.push(['info', 'Pour les efforts de plus de 90 minutes, entraînez aussi votre digestion : testez à l’entraînement les aliments et boissons que vous utiliserez en compétition.']);
    fond.push(['info', 'Base de la semaine : légumes et fruits à chaque repas, féculents complets, sources de protéines variées, bonnes graisses (huile d’olive, noix, poissons gras). Hors sport, environ 1,5 L d’eau par jour.']);
  } else {
    fond.push(['info', `Chez ${cat === 'enfant' ? 'l’enfant' : 'l’adolescent'}, pas de régime ni de comptage de calories, et pas de compléments protéinés sans avis médical. L’essentiel : repas réguliers et variés, produits laitiers pour le calcium, fruits et légumes, féculents, une source de protéines à chaque repas.`]);
    fond.push(['info', `Sommeil recommandé : ${cat === 'enfant' ? '9 à 11 h' : '8 à 10 h'} par nuit, indispensable pour la croissance et la récupération.`]);
  }
  fond.push(['info', 'Ces repères sont généraux et ne remplacent pas l’avis d’un médecin ou d’un diététicien, en particulier en cas de maladie, de grossesse, de traitement ou de douleur persistante.']);
  return { recup, jour, fond };
}

// ---------- Vues ----------
const SEV_SPORT = { rouge: ['bad', 'Important'], orange: ['warn', 'À surveiller'], vert: ['ok', 'Bien'], info: ['', 'Repère'] };
const consSport = l => l.map(([n, t]) => `<div class="cons"><span class="pill ${SEV_SPORT[n][0]}">${SEV_SPORT[n][1]}</span><p>${esc(t)}</p></div>`).join('');
function chipsSport() {
  const m = membreSport();
  return m ? `<div class="chips" role="group" aria-label="Choisir un membre">${membresSport().map(x => `<button data-act="sport-membre" data-id="${x.id}" aria-pressed="${x.id === m.id}">${esc(x.nom)}</button>`).join('')}</div>` : '';
}
const videSport = () => `<section class="carte"><h2>Sport en famille</h2><p class="mut">Ajoutez d’abord les membres de la famille : chacun a son plan d’entraînement, son suivi et ses conseils.</p><button class="btn" data-act="ouvrir" data-sheet="membre">Ajouter un membre</button></section>`;

// ---------- Habillage « Strava » : résumé, journal, records, fil d'activités ----------
const ICO_SPORT = {
  course: '<circle cx="15" cy="4.5" r="2"/><path d="M13 9l-3 3 3 3-1 5M13 9l4 3 3-1M10 12l-3 1M13 15l4 4"/>',
  velo: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8l4 8M9 6h3"/>',
  natation: '<circle cx="16" cy="6" r="2"/><path d="M4 12l5-2 4 2 3-3M3 16q2.2 2 4.5 0t4.5 0 4.5 0 4.5 0M3 20q2.2 2 4.5 0t4.5 0 4.5 0 4.5 0"/>',
  muscu: '<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>',
  marche: '<circle cx="13" cy="4.5" r="2"/><path d="M12 8l-2 5 3 3v5M12 8l3 4 3 1M10 13l-3 7"/>',
  yoga: '<circle cx="12" cy="5" r="2"/><path d="M12 8v5M5 12q4 1 7 1t7-1M7 20q2-5 5-5t5 5"/>',
  collectif: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>',
  fitness: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
  autre: '<path d="M12 4l2.4 5 5.6.7-4.1 3.8 1.1 5.5L12 16.2 7 19l1.1-5.5L4 9.7 9.600 9z"/>',
};
const icoSport = (t, px = 22) => `<svg viewBox="0 0 24 24" width="${px}" height="${px}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO_SPORT[t] || ICO_SPORT.autre}</svg>`;
const kmTxt = d => (Math.round(d * 10) / 10).toString().replace('.', ',');
const dureeTxt = min => { const m = Math.round(min), h = Math.floor(m / 60); return h ? `${h} h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };
const quand = d => { const n = diffJours(d, aujourdhui()); return n === 0 ? 'Aujourd’hui' : n === 1 ? 'Hier' : fmtDate(d); };
let filMode = 'moi';

// Tracé fictif mais stable : une boucle déterminée par l'identifiant de la séance (aucun GPS dans l'application).
function traceSvg(s) {
  let h = 7; for (const c of String(s.id) + s.date) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
  const n = 8, k = Math.min(1.25, 0.75 + (s.distance || 5) / 40), rx = (40 + rnd() * 16) * k, ry = (20 + rnd() * 10) * k, rot = rnd() * Math.PI;
  const P = Array.from({ length: n }, (_, i) => { const a = i / n * 2 * Math.PI, r = 1 + (rnd() - .5) * .45, x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r; return [100 + x * Math.cos(rot) - y * Math.sin(rot), 50 + x * Math.sin(rot) + y * Math.cos(rot)]; });
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i + n - 1) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const rues = Array.from({ length: 5 }, () => `M${(rnd() * 200).toFixed(0)} 0L${(rnd() * 200).toFixed(0)} 100`).join('') + Array.from({ length: 4 }, () => `M0 ${(rnd() * 100).toFixed(0)}L200 ${(rnd() * 100).toFixed(0)}`).join('');
  return `<svg class="trace" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Tracé indicatif de la séance"><rect width="200" height="100" class="trace-fond"/><path d="${rues}" class="trace-rues"/><path d="M${(rnd() * 80).toFixed(0)} 100Q60 ${60 + (rnd() * 30) | 0} 120 100Z" class="trace-eau"/>
    <path d="${d}Z" class="trace-halo"/><path d="${d}Z" class="trace-ligne"/><circle cx="${P[0][0].toFixed(1)}" cy="${P[0][1].toFixed(1)}" r="4.2" fill="#2fb36d" stroke="#fff" stroke-width="1.6"/></svg>`;
}
function resumeSemaine(m) {
  const lun = semaine(0), jours = Array.from({ length: 7 }, (_, i) => { const date = iso(ajouteJours(parse(lun), i)), l = seancesDe(m.id).filter(s => s.date === date); return { date, min: somme(l, s => s.duree), km: somme(l, s => s.distance || 0) }; });
  const mx = Math.max(30, ...jours.map(j => j.min)), auj = aujourdhui(), st = statsSemaine(m.id, lun), km = somme(st.l, s => s.distance || 0);
  return { st, km, html: `<div class="sp-jours" role="img" aria-label="Minutes par jour cette semaine">${jours.map((j, i) => `<div class="sp-j${j.date === auj ? ' auj' : ''}${j.date > auj ? ' futur' : ''}" title="${fmtDate(j.date)} : ${j.min} min"><span class="sp-j-piste"><i style="height:${j.min ? Math.max(8, j.min / mx * 100) : 0}%"></i></span><b>${'LMMJVSD'[i]}</b></div>`).join('')}</div>` };
}
function anneau(pct, txt, sous) {
  const r = 26, c = 2 * Math.PI * r, p = Math.min(1, pct);
  return `<div class="sp-anneau"><svg viewBox="0 0 64 64" width="72" height="72" role="img" aria-label="${Math.round(pct * 100)} % de l’objectif"><circle cx="32" cy="32" r="${r}" class="an-piste"/><circle cx="32" cy="32" r="${r}" class="an-val" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 32 32)"/></svg><span><b>${txt}</b><small>${sous}</small></span></div>`;
}
function serieSemaines(id) {
  let n = 0, k = statsSemaine(id, semaine(0)).n ? 0 : 1;
  for (; k < 200 && statsSemaine(id, semaine(k)).n; k++) n++;
  return n;
}
function journal(id) {
  const auj = aujourdhui(), cols = Array.from({ length: 12 }, (_, w) => { const lun = semaine(11 - w); return Array.from({ length: 7 }, (_, i) => { const date = iso(ajouteJours(parse(lun), i)), min = somme(seancesDe(id).filter(s => s.date === date), s => s.duree); return `<i class="h${date > auj ? 'f' : min >= 90 ? 4 : min >= 60 ? 3 : min >= 30 ? 2 : min > 0 ? 1 : 0}" title="${fmtDate(date)}${min ? ' : ' + min + ' min' : ''}"></i>`; }).join(''); });
  return `<div class="sp-journal" role="img" aria-label="Journal des 12 dernières semaines">${cols.map(c => `<div>${c}</div>`).join('')}</div>`;
}
function recordsSport(id) {
  const l = seancesDe(id), longue = l.filter(s => s.distance).sort((a, b) => b.distance - a.distance)[0], course = l.filter(s => s.type === 'course' && s.distance >= 3 && allureSec(s) != null).sort((a, b) => allureSec(a) - allureSec(b))[0], dur = [...l].sort((a, b) => b.duree - a.duree)[0];
  const ligne = (ico, lbl, val, s) => `<div class="sp-rec"><span class="sp-rec-ico">${icoSport(ico, 20)}</span><span class="sp-rec-t"><small>${lbl}</small><b>${val}</b></span><small>${fmtDate(s.date).split(' ').slice(1).join(' ')}</small></div>`;
  return [longue && ligne(longue.type, 'Plus longue sortie', kmTxt(longue.distance) + ' km', longue), course && ligne('course', 'Meilleure allure (3 km +)', fmtAllureVal('course', allureSec(course)), course), dur && ligne(dur.type, 'Séance la plus longue', dureeTxt(dur.duree), dur)].filter(Boolean).join('');
}
function carteFil(s, moi) {
  const m = membre(s.membre), v = allureSec(s), dist = s.distance && SPORT_DIST.includes(s.type), bravos = s.bravos || [], aime = bravos.includes(etat.actif);
  const stats = dist ? [['Distance', kmTxt(s.distance) + ' km'], [s.type === 'velo' ? 'Vitesse' : 'Allure', v != null ? fmtAllureVal(s.type, v) : '–'], ['Durée', dureeTxt(s.duree)]] : [['Durée', dureeTxt(s.duree)], ['Effort', s.rpe + '/10'], ['Charge', pnum(s.duree * s.rpe)]];
  return `<article class="fil">
    <header>${avatar(s.membre, true)}<span class="fil-qui"><b>${esc(m ? m.nom : '')}</b><small>${quand(s.date)} · ${nomSport(s.type)}</small></span><span class="fil-ico">${icoSport(s.type, 22)}</span></header>
    <button class="fil-titre" data-act="ouvrir" data-sheet="seance" data-id="${s.id}">${esc(s.titre || nomSport(s.type))}</button>
    ${s.note ? `<p class="fil-note">${esc(s.note)}</p>` : ''}
    <div class="fil-stats">${stats.map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('')}</div>
    ${dist && s.type !== 'natation' ? traceSvg(s) : ''}
    <footer><span class="fil-badges">${badgeAllure(s)}${s.douleur ? '<span class="pill warn">Gêne</span>' : ''}</span>
      <button class="bravo${aime ? ' on' : ''}" data-act="bravo" data-id="${s.id}" aria-pressed="${aime}" aria-label="Féliciter, ${bravos.length} bravo${pl(bravos.length)}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.600a4.3 4.3 0 0 1 7.500 2.700C19.500 15.900 12 20.500 12 20.500z" fill="${aime ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>${bravos.length ? `<span>${bravos.length}</span>` : ''}</button>
      <button class="icone" data-act="seance-del" data-id="${s.id}" aria-label="Supprimer la séance">${ico('x', 18)}</button></footer>
    ${bravos.length ? `<p class="fil-bravos">Bravo de ${bravos.map(i => esc((membre(i) || { nom: '?' }).nom)).join(', ')}</p>` : ''}</article>`;
}

VUES.suivisport = function () {
  const m = membreSport();
  if (!m) return videSport();
  const p = profilSport(m.id), objH = objectifHebdo(m, p), R = resumeSemaine(m), s0 = R.st, auj = aujourdhui();
  const aFaire = prevuesLe(m.id, auj).filter(x => !seancesDe(m.id).some(s => s.date === auj && s.type === x.type));
  const serie = serieSemaines(m.id), tri = l => [...l].sort((a, b) => b.date.localeCompare(a.date) || (b.id > a.id ? 1 : -1));
  const fil = tri(filMode === 'famille' ? etat.sportSeances.filter(s => membre(s.membre)) : seancesDe(m.id)).slice(0, filMode === 'famille' ? 14 : 10), rec = recordsSport(m.id);
  const stats = R.km > 0 ? [['Distance', kmTxt(R.km) + ' km'], ['Durée', dureeTxt(s0.minutes)], ['Séances', s0.n]] : [['Durée', dureeTxt(s0.minutes)], ['Séances', s0.n], ['Jours actifs', s0.jours]];
  return `${chipsSport()}
    <section class="sp-hero"><div class="sp-id">${avatar(m.id, true)}<span><b>${esc(m.nom)}</b><small>Cette semaine</small></span><button class="lien" data-act="ouvrir" data-sheet="sport-profil">Profil</button></div>
      <div class="sp-stats">${stats.map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('')}</div>${R.html}</section>
    <div class="fin-grille">
      <section class="sp-tuile"><span class="t-lbl">Objectif</span>${anneau(s0.minutes / objH, s0.minutes + '<i> min</i>', 'sur ' + objH)}</section>
      <section class="sp-tuile"><span class="t-lbl">Série</span><span class="t-val sp-serie">${serie}<i> sem.</i></span><small class="mut">${serie ? 'consécutives avec une séance' : 'Une séance lance la série'}</small></section></div>
    <section class="sp-tuile"><span class="t-lbl">Journal · 12 semaines</span>${journal(m.id)}</section>
    ${aFaire.length ? `<section class="sp-tuile"><span class="t-lbl">À faire aujourd’hui</span>${aFaire.map(x => `<div class="rang"><span class="sp-rec-ico">${icoSport(x.type, 20)}</span><span class="rang-txt"><b>${esc(x.titre || nomSport(x.type))}</b><small>${x.duree} min · effort ${x.rpe}/10</small></span><button class="btn" data-act="ouvrir" data-sheet="seance" data-plan="${x.id}">Valider</button></div>`).join('')}</section>` : ''}
    ${rec ? `<section class="sp-tuile"><span class="t-lbl">Records</span>${rec}</section>` : ''}
    ${carteParcours(m)}
    ${carteAllure(m)}
    <div class="chips" role="group" aria-label="Fil d’activités"><button data-act="fil-mode" data-v="moi" aria-pressed="${filMode === 'moi'}">Mes activités</button><button data-act="fil-mode" data-v="famille" aria-pressed="${filMode === 'famille'}">Fil de la famille</button></div>
    ${fil.map(s => carteFil(s)).join('') || '<section class="sp-tuile"><p class="vide">Aucune séance. Touchez « + Séance » pour publier la première.</p></section>'}`;
};
ACTIONS['fil-mode'] = el => { filMode = el.dataset.v; return 'vue'; };
ACTIONS.bravo = el => {
  const s = etat.sportSeances.find(x => x.id === el.dataset.id); if (!s) return;
  const qui = etat.actif || s.membre; s.bravos = s.bravos || [];
  const i = s.bravos.indexOf(qui); if (i >= 0) s.bravos.splice(i, 1); else s.bravos.push(qui);
};
VUES.plansport = function () {
  const m = membreSport();
  if (!m) return videSport();
  const plan = planDe(m.id), auj = jourIdx(aujourdhui()), prog = progDe(m.id), lun = lundiIso();
  const semPrev = Array.from({ length: 7 }, (_, i) => prevuesLe(m.id, iso(ajouteJours(parse(lun), i)))).flat();
  const min = somme(semPrev, x => x.duree), charge = somme(semPrev, x => x.duree * x.rpe);
  let carteProg = '';
  if (prog) {
    const n = Math.floor(diffJours(prog.debut, aujourdhui()) / 7) + 1, tot = prog.semaines.length, fin = iso(ajouteJours(parse(prog.debut), 7 * tot - 1));
    const w = prog.semaines.find(x => x.n === n);
    carteProg = `<section class="carte"><div class="carte-tete"><h2>${esc(prog.nom)}</h2><span class="pill pri">${n < 1 ? 'À venir' : n > tot ? 'Terminé' : `Semaine ${n}/${tot}`}</span></div>
      ${prog.objectif ? `<p class="mut">${esc(prog.objectif)}</p>` : ''}
      ${prog.course ? `<div class="kv"><span>Course</span><b>${fmtDate(prog.course)}${diffJours(aujourdhui(), prog.course) >= 0 ? ` · dans ${diffJours(aujourdhui(), prog.course)} j` : ''}</b></div>` : ''}
      ${w && !w.seances.length ? `<p class="mut">Pas de séance du programme cette semaine${w.note ? ' (semaine ' + w.n + ' ' + esc(w.note) + ')' : ''}. Reprise lundi prochain avec la semaine ${n + 1}.</p>` : ''}
      ${w && w.seances.length ? `<h3>Cette semaine</h3><ul class="liste">${[...w.seances].sort((a, b) => a.jour - b.jour).map(x => `<li class="rang" style="min-height:48px"><span class="heure" style="flex-basis:60px">${JOURS_L[x.jour].slice(0, 3)}</span><span class="rang-txt"><b>${esc(x.titre)}</b><small>${esc(x.contenu)}${x.allure && x.allure !== '-' ? ' · ' + esc(x.allure) : ''}</small></span></li>`).join('')}</ul>` : ''}
      <details><summary>Voir tout le programme</summary>${prog.semaines.map(w2 => `<h3>Semaine ${w2.n}${w2.n === n ? ' · en cours' : ''}${w2.note ? ' · ' + esc(w2.note) : ''}</h3><ul class="liste">${w2.seances.map(x => `<li class="rang" style="min-height:44px"><span class="rang-txt"><b>${esc(x.titre)}</b><small>${JOURS_L[x.jour]} ${fmtDate(iso(ajouteJours(parse(prog.debut), 7 * (w2.n - 1) + x.jour))).split(' ').slice(1).join(' ')} · ${esc(x.contenu)}${x.allure && x.allure !== '-' ? ' · ' + esc(x.allure) : ''}</small></span></li>`).join('')}</ul>`).join('')}</details>
      <div class="rangee"><button class="btn sec" data-act="prog-semaine" data-id="${prog.id}">Changer la semaine en cours</button><button class="btn danger" data-act="prog-del" data-id="${prog.id}">Supprimer</button></div>
      <small>Les durées marquées « estimées » servent seulement aux conseils. Le programme s’affiche dans le suivi du jour et alimente les conseils de récupération.</small></section>`;
  }
  return `${chipsSport()}
    ${carteProg}
    <section class="carte"><div class="carte-tete"><h2>Séances de la semaine</h2><span class="pill pri">${plan.length} dans le plan</span></div>
      <p class="mut">${semPrev.length ? `Cette semaine : ${semPrev.length} séance${pl(semPrev.length)} prévue${pl(semPrev.length)} · ${min} min · charge prévue ${pnum(charge)}` : plan.length ? 'Aucune séance prévue cette semaine.' : 'Ajoutez des séances qui reviennent chaque semaine (renforcement, cours collectif…), ou partez d’un modèle.'}</p>
      <button class="btn sec" data-act="ouvrir" data-sheet="modele-plan">Partir d’un modèle</button></section>
    ${JOURS_L.map((j, i) => { const date = iso(ajouteJours(parse(lun), i)), l = prevuesLe(m.id, date); return `<section class="carte"${i === auj ? ' style="border-color:var(--pri)"' : ''}><div class="carte-tete"><h2>${j}${i === auj ? ' · aujourd’hui' : ''}</h2><button class="lien" data-act="ouvrir" data-sheet="plan-item" data-jour="${i}">Ajouter</button></div>
      ${l.length ? `<ul class="liste">${l.map(x => x.prog ? `<li class="rang" style="min-height:48px"><span class="rang-txt"><b>${esc(x.titre || nomSport(x.type))}</b><small>${nomSport(x.type)} · ${x.duree} min${x.estime ? ' (estimée)' : ''} · effort ${x.rpe}/10${x.note ? ' · ' + esc(x.note) : ''}</small></span><span class="pill">Programme</span></li>`
        : `<li><button class="rang" data-act="ouvrir" data-sheet="plan-item" data-id="${x.id}"><span class="rang-txt"><b>${esc(x.titre || nomSport(x.type))}</b><small>${nomSport(x.type)} · ${x.duree} min · effort ${x.rpe}/10${x.note ? ' · ' + esc(x.note) : ''} · ↻ ${recSport(x.date == null ? 'semaine' : x.rec).toLowerCase()}</small></span></button></li>`).join('')}</ul>` : '<small>Repos</small>'}</section>`; }).join('')}`;
};
VUES.conseilssport = function () {
  const m = membreSport();
  if (!m) return videSport();
  const p = profilSport(m.id), C = conseilsSport(m);
  return `${chipsSport()}
    <section class="carte"><div class="carte-tete"><h2>Profil de ${esc(m.nom)}</h2><button class="lien" data-act="ouvrir" data-sheet="sport-profil">Modifier</button></div>
      <div class="kv"><span>Catégorie</span><b>${{ adulte: 'Adulte', ado: 'Adolescent', enfant: 'Enfant' }[categorie(m)]}${ageDe(m) != null ? ' · ' + ageDe(m) + ' ans' : ''}</b></div>
      <div class="kv"><span>Poids</span><b>${p.poids ? p.poids + ' kg' : 'à renseigner'}</b></div>
      <div class="kv"><span>Objectif</span><b>${OBJECTIFS_SPORT.find(o => o[0] === p.objectif)[1]}</b></div>
      <div class="kv"><span>Sommeil moyen</span><b>${p.sommeil ? p.sommeil + ' h' : 'à renseigner'}</b></div></section>
    <section class="carte"><h2>Récupération</h2>${consSport(C.recup)}</section>
    <section class="carte"><h2>Aujourd’hui : alimentation et hydratation</h2>${consSport(C.jour)}</section>
    <section class="carte"><h2>Repères généraux</h2>${consSport(C.fond)}</section>`;
};

// ---------- Feuilles ----------
SHEETS.seance = d => {
  const s = d.id ? etat.sportSeances.find(x => x.id === d.id) : null, pc = d.parcours ? etat.sportParcours.find(x => x.id === d.parcours) : null, pl_ = d.plan ? trouverPrevue(sportM, d.plan) : pc ? { titre: pc.nom, type: pc.sport, distance: pc.km } : null;
  const v = (k, def = '') => (s ? s[k] : pl_ && pl_[k] != null ? pl_[k] : def);
  return { titre: s ? 'Modifier la séance' : 'Enregistrer une séance', corps: `<form class="formulaire" data-form="seance"><input type="hidden" name="id" value="${s ? s.id : ''}"><input type="hidden" name="allurePrevue" value="${esc(s ? s.allurePrevue || '' : pl_ ? pl_.allure || '' : '')}">
    <div class="duo">${fld('Pour', `<select name="membre">${optionsMembres(s ? s.membre : sportM)}</select>`)}${fld('Date', `<input type="date" name="date" value="${s ? s.date : aujourdhui()}" required>`)}</div>
    <div class="duo">${fld('Sport', `<select name="type">${optSel(SPORTS, v('type', 'course'))}</select>`)}${fld('Durée (min)', `<input type="number" name="duree" min="1" max="600" step="0.1" required inputmode="decimal" value="${v('duree')}">`)}</div>
    ${fld('Effort ressenti (1 à 10)', `<select name="rpe">${optRpe(Number(v('rpe', 5)))}</select>`)}
    ${fld('Titre (facultatif)', `<input name="titre" autocomplete="off" value="${esc(v('titre'))}" placeholder="Sortie longue">`)}
    <div class="duo">${fld('Distance (km)', `<input type="number" name="distance" min="0" step="0.1" inputmode="decimal" value="${s && s.distance ? s.distance : pc ? pc.km : ''}">`)}${fld('Note', `<input name="note" autocomplete="off" value="${esc(s ? s.note : '')}">`)}</div>
    ${!s && !pl_ ? `<div class="duo">${fld('Répéter cette séance', `<select name="rec">${REC_SPORT.filter(r => r[0] !== 'jour').map(([k, n]) => `<option value="${k}">${k ? n : 'Ne pas répéter'}</option>`).join('')}</select>`)}${fld('Jusqu’au (facultatif)', '<input type="date" name="fin">')}</div>
    <small>Une séance répétée est ajoutée à votre plan : elle apparaîtra aux prochaines dates avec le bouton « Valider ».</small>` : ''}
    <label class="rang-main"><input type="checkbox" class="coche" name="douleur"${s && s.douleur ? ' checked' : ''}><span class="rang-txt">Douleur ou gêne pendant la séance<small>Utilisé pour adapter les conseils de récupération</small></span></label>
    <button class="btn plein">Enregistrer</button></form>` };
};
SHEETS['plan-item'] = d => {
  const x = d.id ? etat.sportPlan.find(i => i.id === d.id) : null;
  const date = x ? (x.date || prochainJour(x.jour)) : d.jour != null ? prochainJour(Number(d.jour)) : aujourdhui();
  return { titre: x ? 'Modifier la séance prévue' : 'Séance prévue', corps: `<form class="formulaire" data-form="plan-item"><input type="hidden" name="id" value="${x ? x.id : ''}"><input type="hidden" name="membre" value="${x ? x.membre : sportM}">
    <div class="duo">${fld('Première séance', `<input type="date" name="date" value="${date}" required>`)}${fld('Répéter', `<select name="rec">${REC_SPORT.map(([k, n]) => `<option value="${k}"${k === (x ? (x.date == null ? 'semaine' : x.rec || '') : 'semaine') ? ' selected' : ''}>${n}</option>`).join('')}</select>`)}</div>
    ${fld('Jusqu’au (facultatif)', `<input type="date" name="fin" value="${x && x.fin ? x.fin : ''}">`)}
    <div class="duo">${fld('Sport', `<select name="type">${optSel(SPORTS, x ? x.type : 'course')}</select>`)}${fld('Titre (facultatif)', `<input name="titre" autocomplete="off" value="${esc(x ? x.titre : '')}" placeholder="Fractionné 10 × 1 min">`)}</div>
    <div class="duo">${fld('Durée (min)', `<input type="number" name="duree" min="1" max="600" required inputmode="numeric" value="${x ? x.duree : ''}">`)}${fld('Effort prévu (1 à 10)', `<select name="rpe">${optRpe(Number(x ? x.rpe : 5))}</select>`)}</div>
    ${fld('Note (facultatif)', `<input name="note" autocomplete="off" value="${esc(x ? x.note : '')}">`)}
    <button class="btn plein">Enregistrer</button>${x ? `<button type="button" class="btn danger plein" data-act="plan-item-del" data-id="${x.id}">Supprimer</button>` : ''}</form>` };
};
SHEETS['sport-profil'] = () => {
  const m = membreSport(), p = profilSport(m.id);
  return { titre: 'Profil sportif de ' + m.nom, corps: `<form class="formulaire" data-form="sport-profil"><input type="hidden" name="id" value="${m.id}">
    <div class="duo">${fld('Poids (kg)', `<input type="number" name="poids" min="10" max="250" step="0.1" inputmode="decimal" value="${p.poids || ''}">`)}${fld('Sommeil moyen (h)', `<input type="number" name="sommeil" min="3" max="12" step="0.5" inputmode="decimal" value="${p.sommeil || ''}">`)}</div>
    <div class="duo">${fld('Objectif', `<select name="objectif">${optSel(OBJECTIFS_SPORT, p.objectif)}</select>`)}${fld('Niveau', `<select name="niveau">${optSel(NIVEAUX, p.niveau)}</select>`)}</div>
    <div class="duo">${fld('Temps 10 km actuel (min)', `<input type="number" name="ref10k" min="0" step="0.5" inputmode="decimal" value="${p.ref10k || ''}">`)}${fld('Objectif 10 km (min)', `<input type="number" name="obj10k" min="0" step="0.5" inputmode="decimal" value="${p.obj10k || ''}">`)}</div>
    ${fld('Objectif hebdomadaire (minutes)', `<input type="number" name="objHebdo" min="0" step="10" inputmode="numeric" value="${p.objHebdo || ''}" placeholder="${objectifHebdo(m, p)} (repère)">`)}
    <small>Le poids sert uniquement à calculer des repères d’alimentation. Il est partagé avec la famille si la synchronisation est active.</small>
    <button class="btn plein">Enregistrer</button></form>` };
};
const MODELES = {
  course3: ['Course à pied, 3 séances par semaine', [[0, 'course', 'Footing facile', 30, 4], [2, 'course', 'Fractionné', 35, 7], [5, 'course', 'Sortie longue', 50, 5]]],
  forme3: ['Forme générale, 3 séances', [[0, 'muscu', 'Renforcement complet', 45, 6], [2, 'velo', 'Cardio modéré', 40, 5], [4, 'muscu', 'Renforcement et gainage', 40, 6], [5, 'marche', 'Marche active', 60, 3]]],
  muscu4: ['Musculation, 4 jours haut et bas du corps', [[0, 'muscu', 'Haut du corps', 60, 7], [1, 'muscu', 'Bas du corps', 60, 7], [3, 'muscu', 'Haut du corps', 60, 7], [4, 'muscu', 'Bas du corps', 60, 7]]],
  enfant: ['Enfant ou ado : activité presque tous les jours', [[0, 'collectif', 'Sport collectif ou jeux', 60, 5], [1, 'velo', 'Vélo ou trottinette', 45, 4], [3, 'natation', 'Natation', 45, 5], [5, 'collectif', 'Sport collectif', 60, 5], [6, 'marche', 'Jeux de plein air', 60, 4]]],
};
SHEETS['modele-plan'] = () => ({ titre: 'Choisir un modèle', corps: `<p class="mut">Un modèle remplace le plan actuel de ${esc(membreSport().nom)}. Vous pourrez ensuite modifier chaque séance.</p>
  <ul class="liste">${Object.entries(MODELES).map(([k, [n, l]]) => `<li><button class="rang" data-act="plan-modele" data-m="${k}"><span class="rang-txt"><b>${esc(n)}</b><small>${l.length} séances · ${somme(l, x => x[3])} min par semaine</small></span></button></li>`).join('')}</ul>` });

// ---------- Actions et formulaires ----------
FORMS.seance = f => {
  const o = { membre: f.membre.value, date: f.date.value, type: f.type.value, duree: Number(f.duree.value) || 0, rpe: Number(f.rpe.value) || 5, titre: f.titre.value.trim(), allurePrevue: f.allurePrevue.value, distance: Number(f.distance.value) || 0, note: f.note.value.trim(), douleur: f.douleur.checked };
  const i = etat.sportSeances.findIndex(x => x.id === f.id.value);
  if (i >= 0) Object.assign(etat.sportSeances[i], o); else etat.sportSeances.push({ id: uid(), ...o });
  sportM = o.membre;
  if (f.rec && f.rec.value && i < 0) { // récurrence : la séance rejoint le plan
    const doublon = etat.sportPlan.some(x => x.membre === o.membre && x.type === o.type && (x.titre || '') === o.titre && x.date != null && x.rec === f.rec.value && jourIdx(x.date) === jourIdx(o.date));
    if (!doublon) etat.sportPlan.push({ id: uid(), membre: o.membre, date: o.date, jour: jourIdx(o.date), rec: f.rec.value, fin: f.fin ? f.fin.value : '', type: o.type, titre: o.titre, duree: o.duree, rpe: o.rpe, note: o.note });
  }
};
FORMS['plan-item'] = f => {
  const o = { membre: f.membre.value, date: f.date.value, jour: jourIdx(f.date.value), rec: f.rec.value, fin: f.fin.value, type: f.type.value, titre: f.titre.value.trim(), duree: Number(f.duree.value) || 0, rpe: Number(f.rpe.value) || 5, note: f.note.value.trim() };
  const i = etat.sportPlan.findIndex(x => x.id === f.id.value);
  if (i >= 0) Object.assign(etat.sportPlan[i], o); else etat.sportPlan.push({ id: uid(), ...o });
};
FORMS['sport-profil'] = f => {
  const o = { id: f.id.value, poids: Number(f.poids.value) || 0, sommeil: Number(f.sommeil.value) || 0, objectif: f.objectif.value, niveau: f.niveau.value, objHebdo: Number(f.objHebdo.value) || 0, ref10k: Number(f.ref10k.value) || 0, obj10k: Number(f.obj10k.value) || 0 };
  const i = etat.sportProfils.findIndex(x => x.id === o.id);
  if (i >= 0) etat.sportProfils[i] = o; else etat.sportProfils.push(o);
};
ACTIONS['sport-membre'] = el => { sportM = el.dataset.id; return 'vue'; };
ACTIONS['seance-del'] = el => { etat.sportSeances = etat.sportSeances.filter(x => x.id !== el.dataset.id); };
ACTIONS['plan-item-del'] = el => { etat.sportPlan = etat.sportPlan.filter(x => x.id !== el.dataset.id); };
ACTIONS['plan-modele'] = async el => {
  const m = membreSport(), [, l] = MODELES[el.dataset.m];
  if (planDe(m.id).length && !await confirmer(`Remplacer le plan actuel de ${m.nom} par ce modèle ?`)) return false;
  etat.sportPlan = etat.sportPlan.filter(x => x.membre !== m.id).concat(l.map(([jour, type, titre, duree, rpe]) => ({ id: uid(), membre: m.id, jour, type, titre, duree, rpe, note: '' })));
  fermerFeuille();
  info('Plan enregistré. Modifiez les séances à votre convenance.');
};
ACTIONS['prog-del'] = el => { etat.sportProg = etat.sportProg.filter(p => p.id !== el.dataset.id); };
ACTIONS['prog-semaine'] = async el => {
  const p = etat.sportProg.find(x => x.id === el.dataset.id);
  const r = await dialogue({ titre: 'Semaine en cours du programme', texte: `Indiquez à quelle semaine du programme (1 à ${p.semaines.length}) correspond cette semaine. Les dates de toutes les séances sont recalculées.`, champs: [{ nom: 'n', label: 'Semaine du programme cette semaine', valeur: Math.min(p.semaines.length, Math.max(1, Math.floor(diffJours(p.debut, aujourdhui()) / 7) + 1)) }], ok: 'Appliquer' });
  const n = r && Math.round(Number(r.n));
  if (!n || n < 1 || n > p.semaines.length) return false;
  p.debut = iso(ajouteJours(parse(lundiIso()), -7 * (n - 1)));
  if (p.courseJour != null) p.course = iso(ajouteJours(parse(p.debut), 7 * (p.semaines.length - 1) + p.courseJour));
};
ACTIONS['allure-type'] = el => { allureType = el.dataset.v; return 'vue'; };

// ---------- Parcours proposés (Claude via « sample » ; la position reste sur l'appareil, jamais synchronisée) ----------
const SPORTS_PARCOURS = [['course', 'Course à pied'], ['velo', 'Vélo'], ['marche', 'Marche ou randonnée']];
const parcoursEnCours = {};
const kmEntre = (a, b) => { const R = 6371, r = x => x * Math.PI / 180, dl = r(b.lat - a.lat), dg = r(b.lng - a.lng), h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const longueurBoucle = pts => pts.reduce((s, p, i) => s + kmEntre(p, pts[(i + 1) % pts.length]), 0) * 1.25; // × 1,25 : les rues ne sont pas des lignes droites
function promptParcours(o) {
  const lieu = o.pos ? `aux coordonnées GPS ${o.pos} (déduis le quartier ou la ville)` : `à « ${o.depart} »`;
  const mode = { course: 'course à pied', velo: 'vélo', marche: 'marche ou randonnée' }[o.sport];
  return `Tu es un guide sportif local. Propose un parcours en boucle de ${o.km} km pour la ${mode}, au départ et à l'arrivée ${lieu}.
Réponds uniquement avec un objet JSON : {"nom":"Boucle du parc ...","points":[{"nom":"Départ : ...","lat":0.00000,"lng":0.00000}],"surface":"...","denivele":"...","conseils":["..."]}.
Règles : 6 à 10 points dans l'ordre du parcours, le premier est le départ (la boucle se referme sur lui) ; utilise des lieux réels et connus (parcs, quais, pistes cyclables, ponts, places) sur des voies adaptées et sûres, loin des routes rapides ; coordonnées décimales à 5 chiffres, aussi exactes que possible ; la distance de la boucle doit approcher ${o.km} km ; "surface" et "denivele" en une courte phrase (« principalement bitume et chemin stabilisé », « plat ») ; 2 à 4 conseils courts (éclairage, heures calmes, point d'eau). Écris en français.`;
}
async function lancerParcours(o) {
  let sample = null;
  try { sample = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch { sample = null; }
  if (!sample) { parcoursEnCours[o.membre] = { etat: 'erreur', code: 'indisponible' }; rendreSiPossible(); return; }
  parcoursEnCours[o.membre] = { etat: 'cours' }; rendreSiPossible();
  try {
    const d = await sample.json(promptParcours(o));
    const t = (x, n) => String(x == null ? '' : x).slice(0, n);
    let pts = (Array.isArray(d && d.points) ? d.points : []).map(x => ({ nom: t(x && x.nom, 80), lat: Number(x && x.lat), lng: Number(x && x.lng) })).filter(x => x.nom && Math.abs(x.lat) <= 90 && Math.abs(x.lng) <= 180 && (x.lat || x.lng)).slice(0, 12);
    if (pts.length) pts = pts.filter(x => kmEntre(pts[0], x) < Math.max(12, o.km)); // écarte les points aberrants
    if (pts.length < 4) throw { code: 'format' };
    const km = Math.round(longueurBoucle(pts) * 10) / 10;
    etat.sportParcours = [{ id: uid(), membre: o.membre, nom: t(d.nom, 90) || `Boucle de ${o.km} km`, sport: o.sport, demande: o.km, km, depart: o.depart, points: pts, surface: t(d.surface, 160), denivele: t(d.denivele, 160), conseils: (Array.isArray(d.conseils) ? d.conseils : []).slice(0, 5).map(c => t(c, 200)), date: aujourdhui() }, ...etat.sportParcours].slice(0, 12);
    sauver();
    delete parcoursEnCours[o.membre];
  } catch (e) { parcoursEnCours[o.membre] = { etat: 'erreur', code: e && e.code === 'cancelled' ? 'annule' : (e && e.code) || 'inconnue' }; }
  rendreSiPossible();
}
const ERR_PARCOURS = { not_granted: 'Autorisation refusée : acceptez l’utilisation de Claude pour obtenir un parcours.', rate_limited: 'Trop de demandes en peu de temps. Réessayez dans un moment.', indisponible: 'La génération n’est pas disponible ici.', format: 'La réponse n’a pas pu être lue (parcours trop incertain pour ce lieu). Précisez le départ et réessayez.' };
const gmParcours = (pts, mode) => {
  const a = pts.slice(0, 11).map(x => `${x.lat},${x.lng}`);
  return `https://www.google.com/maps/dir/?api=1&travelmode=${mode === 'velo' ? 'bicycling' : 'walking'}&origin=${a[0]}&destination=${a[0]}${a.length > 1 ? '&waypoints=' + encodeURIComponent(a.slice(1).join('|')) : ''}`;
};
function carteParcours(m) {
  const e = parcoursEnCours[m.id], l = etat.sportParcours.filter(x => x.membre === m.id), p = l[0];
  let corps = '';
  if (e && e.etat === 'cours') corps = '<p class="mut">Recherche d’un parcours autour de votre point de départ… (quelques dizaines de secondes)</p>';
  else {
    if (e && e.etat === 'erreur' && e.code !== 'annule') corps += `<p class="mut">${esc(ERR_PARCOURS[e.code] || 'Une erreur est survenue. Réessayez.')}</p>`;
    if (p) {
      const lieux = p.points.map(x => ({ ...x, jour: 1 })), ecart = Math.abs(p.km - p.demande) / p.demande > 0.35;
      corps += `<div class="carte-tete"><h3>${esc(p.nom)}</h3><span class="pill pri">≈ ${kmTxt(p.km)} km</span></div>
        ${carteSvg(lieux, 1, p.depart, true)}
        <ul class="liste">${p.points.map((x, i) => `<li class="rang" style="min-height:40px"><span class="pt-n" style="background:${coulJour(1)}">${i + 1}</span><span class="rang-txt">${esc(x.nom)}</span></li>`).join('')}</ul>
        ${p.surface ? `<div class="kv"><span>Terrain</span><b style="text-align:right">${esc(p.surface)}</b></div>` : ''}${p.denivele ? `<div class="kv"><span>Dénivelé</span><b style="text-align:right">${esc(p.denivele)}</b></div>` : ''}
        ${p.conseils.length ? `<ul class="liste">${p.conseils.map(c => `<li class="rang" style="min-height:0"><span class="rang-txt">${esc(c)}</span></li>`).join('')}</ul>` : ''}
        ${ecart ? `<small>Longueur estimée ${kmTxt(p.km)} km pour ${kmTxt(p.demande)} km demandés : relancez pour un tracé plus proche.</small>` : ''}
        <div class="rangee"><a class="btn" target="_blank" rel="noopener" href="${esc(gmParcours(p.points, p.sport))}">Ouvrir l’itinéraire dans Google Maps ↗</a><button class="btn sec" data-act="ouvrir" data-sheet="seance" data-parcours="${p.id}">Enregistrer la sortie</button></div>
        <div class="rangee"><button class="btn sec" data-act="ouvrir" data-sheet="parcours">Autre parcours</button><button class="btn danger" data-act="parcours-del" data-id="${p.id}">Supprimer</button></div>
        <small>Tracé schématique proposé par Claude à partir de connaissances générales, sans accès à internet : longueur estimée à ±25 %. Vérifiez l’itinéraire dans Google Maps avant de partir, surtout de nuit.</small>`;
    } else corps += '<p class="mut">Indiquez votre point de départ et la distance voulue : Claude propose une boucle avec sa carte et un lien d’itinéraire Google Maps.</p><button class="btn" data-act="ouvrir" data-sheet="parcours">Proposer un parcours</button>';
  }
  return `<section class="sp-tuile"><span class="t-lbl">Parcours près de chez vous</span>${corps}</section>`;
}
SHEETS.parcours = () => {
  const m = membreSport(), prochaine = prevuesLe(m.id, aujourdhui()).find(x => x.type === 'course' && x.distance) || null;
  return { titre: 'Proposer un parcours', corps: `<form class="formulaire" data-form="parcours"><input type="hidden" name="pos" value="">
    ${fld('Point de départ (adresse, quartier ou ville)', `<input name="depart" autocomplete="street-address" value="${esc(etat.parcoursDepart || '')}" placeholder="Parc de la Tête d’Or, Lyon" required>`)}
    <button type="button" class="btn sec" data-act="geoloc">Me localiser</button><small id="geoInfo">La localisation automatique n’est pas toujours autorisée dans cette fenêtre : saisissez alors votre ville.</small>
    <div class="duo">${fld('Sport', `<select name="sport">${optSel(SPORTS_PARCOURS, 'course')}</select>`)}${fld('Distance (km)', `<input type="number" name="km" min="1" max="100" step="0.5" required inputmode="decimal" value="${prochaine ? prochaine.distance : 8}">`)}</div>
    <small>Votre position reste sur cet appareil et n’est pas partagée avec la famille. Elle est envoyée à Claude pour calculer le parcours.</small>
    <button class="btn plein">Proposer un parcours</button></form>` };
};
FORMS.parcours = f => {
  const m = membreSport(); if (!m) return;
  const o = { membre: m.id, depart: f.depart.value.trim(), pos: f.pos.value, sport: f.sport.value, km: Math.max(1, Number(f.km.value) || 8) };
  if (o.depart !== 'Ma position actuelle') o.pos = '';
  etat.parcoursDepart = o.depart;
  setTimeout(() => lancerParcours(o), 30);
};
ACTIONS.geoloc = el => {
  const f = el.closest('form'), info_ = document.getElementById('geoInfo');
  if (!navigator.geolocation) { if (info_) info_.textContent = 'Localisation indisponible : saisissez votre ville.'; return false; }
  if (info_) info_.textContent = 'Localisation en cours…';
  navigator.geolocation.getCurrentPosition(
    pos => { if (!f) return; f.elements.pos.value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`; f.elements.depart.value = 'Ma position actuelle'; if (info_) info_.textContent = 'Position détectée.'; },
    () => { if (info_) info_.textContent = 'Localisation refusée ou indisponible ici : saisissez votre ville ou votre adresse.'; },
    { timeout: 8000, maximumAge: 60000 });
  return false;
};
ACTIONS['parcours-del'] = el => { etat.sportParcours = etat.sportParcours.filter(x => x.id !== el.dataset.id); };
