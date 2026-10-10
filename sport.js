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
// Séances prévues un jour donné : séances hebdomadaires récurrentes + séances du programme
function prevuesLe(id, date) {
  const l = planDe(id).filter(x => x.jour === jourIdx(date));
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

VUES.suivisport = function () {
  const m = membreSport();
  if (!m) return videSport();
  const p = profilSport(m.id), objH = objectifHebdo(m, p), s0 = statsSemaine(m.id, semaine(0)), auj = aujourdhui();
  const prevu = prevuesLe(m.id, auj);
  const faitsAuj = seancesDe(m.id).filter(s => s.date === auj);
  const aFaire = prevu.filter(x => !faitsAuj.some(s => s.type === x.type));
  const semaines = Array.from({ length: 8 }, (_, i) => { const k = 7 - i, lun = semaine(k), d = parse(lun); return { label: `Semaine du ${d.getDate()} ${MOIS[d.getMonth()]}`, court: `${d.getDate()}/${d.getMonth() + 1}`, v: [statsSemaine(m.id, lun).minutes] }; });
  const recent = [...seancesDe(m.id)].sort((a, b) => b.date.localeCompare(a.date) || (b.id > a.id ? 1 : -1)).slice(0, 10);
  return `${chipsSport()}
    <section class="hero"><p class="hero-lbl">Cette semaine · ${esc(m.nom)}</p><p class="hero-val">${s0.minutes} <span style="font-size:1.1rem;font-weight:600">/ ${objH} min</span></p>
      <div class="jauge" style="background:color-mix(in srgb,var(--pri-ink) 25%,transparent)"><i style="width:${Math.min(100, s0.minutes / objH * 100)}%;background:var(--pri-ink)"></i></div>
      <p class="hero-sub">${s0.n} séance${pl(s0.n)} · ${s0.jours} jour${pl(s0.jours)} actif${pl(s0.jours)} · charge ${pnum(s0.charge)}</p></section>
    <section class="carte"><div class="carte-tete"><h2>Aujourd’hui</h2><button class="lien" data-goto="plansport">Plan</button></div>
      ${aFaire.map(x => `<div class="rang"><span class="rang-txt"><b>${esc(x.titre || nomSport(x.type))}</b><small>${nomSport(x.type)} · ${x.duree} min · effort ${x.rpe}/10</small></span><button class="btn" data-act="ouvrir" data-sheet="seance" data-plan="${x.id}">Valider</button></div>`).join('')
        || (faitsAuj.length ? `<p class="mut">Séance enregistrée aujourd’hui : ${faitsAuj.map(s => esc(s.titre || nomSport(s.type)) + ' ' + s.duree + ' min').join(', ')}.</p>` : '<p class="vide">Rien de prévu aujourd’hui. Jour de repos ou séance libre.</p>')}</section>
    <section class="carte"><h2>Minutes par semaine</h2>${grapheBarres('sport8', semaines, [{ nom: 'Minutes', c: '--c1' }], 'Minutes d’activité sur 8 semaines', v => Math.round(v) + ' min')}</section>
    <section class="carte"><div class="carte-tete"><h2>Dernières séances</h2><button class="lien" data-act="ouvrir" data-sheet="sport-profil">Profil</button></div>
      <ul class="liste">${recent.map(s => `<li class="rang"><button class="rang-btn" data-act="ouvrir" data-sheet="seance" data-id="${s.id}"><span class="rang-txt"><b>${esc(s.titre || nomSport(s.type))}</b><small>${fmtDate(s.date)} · ${s.duree} min · effort ${s.rpe}/10${s.distance ? ' · ' + String(s.distance).replace('.', ',') + ' km' : ''}${s.douleur ? ' · douleur' : ''}</small></span></button>
        <button class="icone" data-act="seance-del" data-id="${s.id}" aria-label="Supprimer la séance">${ico('x', 18)}</button></li>`).join('') || '<li class="vide">Aucune séance enregistrée. Touchez « + Séance » pour commencer.</li>'}</ul></section>`;
};
VUES.plansport = function () {
  const m = membreSport();
  if (!m) return videSport();
  const plan = planDe(m.id), auj = jourIdx(aujourdhui()), prog = progDe(m.id), lun = lundiIso();
  const min = somme(plan, x => x.duree), charge = somme(plan, x => x.duree * x.rpe);
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
    <section class="carte"><div class="carte-tete"><h2>Séances de la semaine</h2><span class="pill pri">${plan.length} récurrente${pl(plan.length)}</span></div>
      <p class="mut">${plan.length ? `Séances récurrentes : ${min} min par semaine · charge prévue ${pnum(charge)}` : 'Ajoutez des séances qui reviennent chaque semaine (renforcement, cours collectif…), ou partez d’un modèle.'}</p>
      <button class="btn sec" data-act="ouvrir" data-sheet="modele-plan">Partir d’un modèle</button></section>
    ${JOURS_L.map((j, i) => { const date = iso(ajouteJours(parse(lun), i)), l = prevuesLe(m.id, date); return `<section class="carte"${i === auj ? ' style="border-color:var(--pri)"' : ''}><div class="carte-tete"><h2>${j}${i === auj ? ' · aujourd’hui' : ''}</h2><button class="lien" data-act="ouvrir" data-sheet="plan-item" data-jour="${i}">Ajouter</button></div>
      ${l.length ? `<ul class="liste">${l.map(x => x.prog ? `<li class="rang" style="min-height:48px"><span class="rang-txt"><b>${esc(x.titre || nomSport(x.type))}</b><small>${nomSport(x.type)} · ${x.duree} min${x.estime ? ' (estimée)' : ''} · effort ${x.rpe}/10${x.note ? ' · ' + esc(x.note) : ''}</small></span><span class="pill">Programme</span></li>`
        : `<li><button class="rang" data-act="ouvrir" data-sheet="plan-item" data-id="${x.id}"><span class="rang-txt"><b>${esc(x.titre || nomSport(x.type))}</b><small>${nomSport(x.type)} · ${x.duree} min · effort ${x.rpe}/10${x.note ? ' · ' + esc(x.note) : ''}</small></span></button></li>`).join('')}</ul>` : '<small>Repos</small>'}</section>`; }).join('')}`;
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
  const s = d.id ? etat.sportSeances.find(x => x.id === d.id) : null, pl_ = d.plan ? trouverPrevue(sportM, d.plan) : null;
  const v = (k, def = '') => (s ? s[k] : pl_ && pl_[k] != null ? pl_[k] : def);
  return { titre: s ? 'Modifier la séance' : 'Enregistrer une séance', corps: `<form class="formulaire" data-form="seance"><input type="hidden" name="id" value="${s ? s.id : ''}">
    <div class="duo">${fld('Pour', `<select name="membre">${optionsMembres(s ? s.membre : sportM)}</select>`)}${fld('Date', `<input type="date" name="date" value="${s ? s.date : aujourdhui()}" required>`)}</div>
    <div class="duo">${fld('Sport', `<select name="type">${optSel(SPORTS, v('type', 'course'))}</select>`)}${fld('Durée (min)', `<input type="number" name="duree" min="1" max="600" required inputmode="numeric" value="${v('duree')}">`)}</div>
    ${fld('Effort ressenti (1 à 10)', `<select name="rpe">${optRpe(Number(v('rpe', 5)))}</select>`)}
    ${fld('Titre (facultatif)', `<input name="titre" autocomplete="off" value="${esc(v('titre'))}" placeholder="Sortie longue">`)}
    <div class="duo">${fld('Distance (km)', `<input type="number" name="distance" min="0" step="0.1" inputmode="decimal" value="${s && s.distance ? s.distance : ''}">`)}${fld('Note', `<input name="note" autocomplete="off" value="${esc(s ? s.note : '')}">`)}</div>
    <label class="rang-main"><input type="checkbox" class="coche" name="douleur"${s && s.douleur ? ' checked' : ''}><span class="rang-txt">Douleur ou gêne pendant la séance<small>Utilisé pour adapter les conseils de récupération</small></span></label>
    <button class="btn plein">Enregistrer</button></form>` };
};
SHEETS['plan-item'] = d => {
  const x = d.id ? etat.sportPlan.find(i => i.id === d.id) : null;
  return { titre: x ? 'Modifier la séance prévue' : 'Séance prévue', corps: `<form class="formulaire" data-form="plan-item"><input type="hidden" name="id" value="${x ? x.id : ''}"><input type="hidden" name="membre" value="${x ? x.membre : sportM}">
    <div class="duo">${fld('Jour', `<select name="jour">${JOURS_L.map((j, i) => `<option value="${i}"${i === Number(x ? x.jour : (d.jour ?? 0)) ? ' selected' : ''}>${j}</option>`).join('')}</select>`)}${fld('Sport', `<select name="type">${optSel(SPORTS, x ? x.type : 'course')}</select>`)}</div>
    ${fld('Titre (facultatif)', `<input name="titre" autocomplete="off" value="${esc(x ? x.titre : '')}" placeholder="Fractionné 10 × 1 min">`)}
    <div class="duo">${fld('Durée (min)', `<input type="number" name="duree" min="1" max="600" required inputmode="numeric" value="${x ? x.duree : ''}">`)}${fld('Effort prévu (1 à 10)', `<select name="rpe">${optRpe(Number(x ? x.rpe : 5))}</select>`)}</div>
    ${fld('Note (facultatif)', `<input name="note" autocomplete="off" value="${esc(x ? x.note : '')}">`)}
    <button class="btn plein">Enregistrer</button>${x ? `<button type="button" class="btn danger plein" data-act="plan-item-del" data-id="${x.id}">Supprimer</button>` : ''}</form>` };
};
SHEETS['sport-profil'] = () => {
  const m = membreSport(), p = profilSport(m.id);
  return { titre: 'Profil sportif de ' + m.nom, corps: `<form class="formulaire" data-form="sport-profil"><input type="hidden" name="id" value="${m.id}">
    <div class="duo">${fld('Poids (kg)', `<input type="number" name="poids" min="10" max="250" step="0.1" inputmode="decimal" value="${p.poids || ''}">`)}${fld('Sommeil moyen (h)', `<input type="number" name="sommeil" min="3" max="12" step="0.5" inputmode="decimal" value="${p.sommeil || ''}">`)}</div>
    <div class="duo">${fld('Objectif', `<select name="objectif">${optSel(OBJECTIFS_SPORT, p.objectif)}</select>`)}${fld('Niveau', `<select name="niveau">${optSel(NIVEAUX, p.niveau)}</select>`)}</div>
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
  const o = { membre: f.membre.value, date: f.date.value, type: f.type.value, duree: Number(f.duree.value) || 0, rpe: Number(f.rpe.value) || 5, titre: f.titre.value.trim(), distance: Number(f.distance.value) || 0, note: f.note.value.trim(), douleur: f.douleur.checked };
  const i = etat.sportSeances.findIndex(x => x.id === f.id.value);
  if (i >= 0) Object.assign(etat.sportSeances[i], o); else etat.sportSeances.push({ id: uid(), ...o });
  sportM = o.membre;
};
FORMS['plan-item'] = f => {
  const o = { membre: f.membre.value, jour: Number(f.jour.value), type: f.type.value, titre: f.titre.value.trim(), duree: Number(f.duree.value) || 0, rpe: Number(f.rpe.value) || 5, note: f.note.value.trim() };
  const i = etat.sportPlan.findIndex(x => x.id === f.id.value);
  if (i >= 0) Object.assign(etat.sportPlan[i], o); else etat.sportPlan.push({ id: uid(), ...o });
};
FORMS['sport-profil'] = f => {
  const o = { id: f.id.value, poids: Number(f.poids.value) || 0, sommeil: Number(f.sommeil.value) || 0, objectif: f.objectif.value, niveau: f.niveau.value, objHebdo: Number(f.objHebdo.value) || 0 };
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
