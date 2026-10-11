'use strict';

const CLE = 'app-famille-v1';
const COULEURS = ['#0b6b5b', '#c2417c', '#b45309', '#2563eb', '#7c3aed', '#be123c', '#0e7490', '#15803d', '#9333ea', '#c2410c', '#475569', '#a16207'];
const NOMS_COULEURS = ['Vert sapin', 'Rose', 'Ocre', 'Bleu', 'Violet', 'Grenat', 'Turquoise', 'Vert', 'Pourpre', 'Orange brûlé', 'Gris ardoise', 'Moutarde'];
const couleurLibre = () => COULEURS.find(c => !etat.membres.some(m => m.couleur === c)) || COULEURS[etat.membres.length % COULEURS.length];
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// ---------- Données ----------
const defaut = () => ({ membres: [], actif: null, courses: [], taches: [], events: [], repas: {}, tx: [], plafonds: {}, pf: [], pfCfg: {}, freq: {}, recurrents: [], objectifs: [], divs: [], pfHisto: [], prets: [], pretCfg: {}, treso: {}, pat: {}, patHisto: [], recettes: [], carnet: [], voyages: [], cadeaux: [], planExec: [], menuVal: [], menuRefus: [], accueil: {}, sportProfils: [], sportPlan: [], sportSeances: [], sportProg: [], epargne: [], sportParcours: [], parcoursDepart: '', meteo: {} });
let etat = charger();

function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? { ...defaut(), ...JSON.parse(brut) } : defaut();
  } catch { return defaut(); }
}
function ecrireLocal() {
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch { info('Impossible de sauvegarder les données.'); }
}
function sauver() {
  if (typeof majHisto === 'function') majHisto();
  if (typeof majPatHisto === 'function') majPatHisto();
  ecrireLocal();
  if (typeof syncPousser === 'function') syncPousser();
}
// Rendu des mises à jour distantes : on conserve la saisie en cours (valeur, focus, curseur)
let rendreEnAttente = false;
function rendreSiPossible() {
  const a = document.activeElement;
  let rest = null;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.closest('main')) {
    const sel = a.form && a.form.dataset.form ? `[data-form="${a.form.dataset.form}"] [name="${a.name}"]`
      : a.dataset.repas ? `[data-repas="${a.dataset.repas}"][data-slot="${a.dataset.slot}"]` : null;
    if (!sel) { rendreEnAttente = true; return; }
    rest = { sel, value: a.value, s: a.selectionStart, e: a.selectionEnd };
  }
  rendreEnAttente = false;
  rendre();
  if (rest) {
    const n = document.querySelector(rest.sel);
    if (n) { n.value = rest.value; n.focus(); try { n.setSelectionRange(rest.s, rest.e); } catch {} }
  }
}
document.addEventListener('focusout', () => { if (rendreEnAttente) setTimeout(rendreSiPossible, 80); });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const membre = id => etat.membres.find(m => m.id === id);
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const aujourdhui = () => iso(new Date());
const lundi = d => { const r = new Date(d); r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); return r; };
const ajouteJours = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const fmtDate = s => { const d = parse(s); return `${JOURS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MOIS[d.getMonth()]}`; };
const fmtLong = s => { const d = parse(s); return ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][d.getDay()] + ` ${d.getDate()} ${MOIS[d.getMonth()]}`; };
const avatar = (id, grand) => { const m = membre(id); return m ? `<span class="av${grand ? ' gd' : ''}" style="--c:${m.couleur}" title="${esc(m.nom)}">${esc(m.nom.trim().charAt(0).toUpperCase())}</span>` : ''; };
const pastille = id => { const m = membre(id); return m ? `<span class="tag" style="background:${m.couleur}">${esc(m.nom)}</span>` : ''; };
const optionsMembres = (sel, vide) =>
  (vide ? `<option value="">${vide}</option>` : '') +
  etat.membres.map(m => `<option value="${m.id}"${m.id === sel ? ' selected' : ''}>${esc(m.nom)}</option>`).join('');
const fld = (label, interieur) => `<label class="champ"><span>${label}</span>${interieur}</label>`;
const pl = n => (n === 1 ? '' : 's');
const diffJours = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const cle = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const REC_NOMS = { jour: 'Chaque jour', semaine: 'Chaque semaine', mois: 'Chaque mois', an: 'Chaque année' };
function prochaine(d, rec) {
  const x = parse(d);
  if (rec === 'jour') x.setDate(x.getDate() + 1);
  else if (rec === 'semaine') x.setDate(x.getDate() + 7);
  else if (rec === 'mois') x.setMonth(x.getMonth() + 1);
  else x.setFullYear(x.getFullYear() + 1);
  return iso(x);
}
function arrive(e, d) {
  if (e.date === d) return true;
  if (!e.rec || d < e.date) return false;
  const a = parse(e.date), b = parse(d);
  if (e.rec === 'jour') return true;
  if (e.rec === 'quinzaine') return diffJours(e.date, d) % 14 === 0;
  if (e.rec === 'semaine') return diffJours(e.date, d) % 7 === 0;
  if (e.rec === 'mois') return a.getDate() === b.getDate();
  if (e.rec === 'an') return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
  return false;
}
const evenementsDu = d => etat.events.filter(e => arrive(e, d)).sort((a, b) => (a.heure || '').localeCompare(b.heure || ''));
const echeanceTag = t => {
  if (!t.echeance) return '';
  if (t.fait) return `<small>${fmtDate(t.echeance)}</small>`;
  const d = diffJours(aujourdhui(), t.echeance);
  return d < 0 ? '<span class="pill bad">En retard</span>' : d === 0 ? '<span class="pill warn">Aujourd’hui</span>' : d === 1 ? '<span class="pill pri">Demain</span>' : `<small>${fmtDate(t.echeance)}</small>`;
};
// Rayons des courses : mots-clés → rayon
const RAYONS = {
  'Fruits & légumes': ['pomme', 'banane', 'orange', 'citron', 'tomate', 'salade', 'carotte', 'courgette', 'oignon', 'ail', 'pomme de terre', 'patate', 'poire', 'fraise', 'avocat', 'concombre', 'poivron', 'champignon', 'legume', 'fruit', 'raisin', 'kiwi', 'brocoli'],
  'Boulangerie': ['pain', 'baguette', 'croissant', 'brioche', 'viennoiserie'],
  'Crèmerie': ['lait', 'beurre', 'fromage', 'yaourt', 'yogourt', 'creme', 'oeuf', 'emmental', 'mozzarella', 'gruyere', 'comte'],
  'Viandes & poissons': ['poulet', 'boeuf', 'steak', 'jambon', 'saucisse', 'lardons', 'poisson', 'saumon', 'thon', 'viande', 'dinde', 'porc', 'crevette'],
  'Épicerie': ['pates', 'riz', 'farine', 'sucre', 'sel', 'huile', 'cafe', 'the', 'cereale', 'biscuit', 'chocolat', 'confiture', 'conserve', 'sauce', 'semoule', 'lentille', 'miel', 'compote'],
  'Boissons': ['eau', 'jus', 'soda', 'biere', 'vin', 'cola', 'sirop', 'limonade'],
  'Surgelés': ['surgele', 'glace', 'pizza', 'frite'],
  'Hygiène & entretien': ['savon', 'shampoing', 'dentifrice', 'papier', 'lessive', 'liquide vaisselle', 'eponge', 'sac poubelle', 'mouchoir', 'gel douche', 'deodorant', 'couche', 'nettoyant', 'essuie'],
  'Autre': [],
};
const RAYONS_ORDRE = Object.keys(RAYONS);
const rayonDe = nom => { const k = cle(nom); return RAYONS_ORDRE.find(r => RAYONS[r].some(m => k.includes(m))) || 'Autre'; };
function parseCourse(t) {
  t = t.trim();
  let m = t.match(/^(\d+(?:[.,]\d+)?)\s*(?:x|×)?\s+(.+)$/i);
  if (m) return [m[2].trim(), Number(m[1].replace(',', '.'))];
  m = t.match(/^(.+?)\s*(?:x|×)\s*(\d+)$/i);
  if (m) return [m[1].trim(), Number(m[2])];
  return [t, 1];
}
function ajouterCourseDetail(nom, qte, pour) {
  const k = cle(nom), ex = etat.courses.find(c => !c.fait && cle(c.nom) === k);
  const f = etat.freq[k] || { nom, n: 0 };
  etat.freq[k] = { nom: f.nom, n: f.n + 1 };
  if (ex) { ex.qte = (ex.qte || 1) + qte; return { etat: 'maj', id: ex.id }; }
  const c = { id: uid(), nom, qte, rayon: rayonDe(nom), fait: false };
  if (pour) c.pour = pour;
  etat.courses.unshift(c);
  return { etat: 'new', id: c.id };
}
const ajouterCourse = (nom, qte, pour) => ajouterCourseDetail(nom, qte, pour).etat;

// ---------- Icônes ----------
const ICONES = {
  accueil: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  agenda: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  listes: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.3 1.3L7 5M3.5 12l1.3 1.3L7 11M3.5 18l1.3 1.3L7 17"/>',
  argent: '<path d="M4 19V5M4 19h16"/><path d="M8 15l4-4 3 3 5-6"/>',
  famille: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15.5 14.2c3 0 5.5 2 5.5 5.3"/>',
  planning: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M8 15l2.5 2.5L16 13"/>',
  maison: '<path d="M4 10h16l-1.4 8.2a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8z"/><path d="M8.5 10l3.5-6 3.5 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  sport: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  recherche: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
};
const ico = (n, t = 22) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n]}</svg>`;

// ---------- Navigation ----------
const SECTIONS = {
  accueil: { titre: 'Accueil', vues: ['accueil'] },
  planning: { titre: 'Planning', vues: ['agenda', 'taches', 'voyages', 'cadeaux'], noms: { agenda: 'Agenda', taches: 'Tâches', voyages: 'Voyages', cadeaux: 'Cadeaux' } },
  maison: { titre: 'Maison', vues: ['courses', 'repas', 'recettes', 'carnet'], noms: { courses: 'Courses', repas: 'Repas', recettes: 'Recettes', carnet: 'Carnet' } },
  argent: { titre: 'Argent', vues: ['budget', 'patrimoine', 'bourse', 'prets'], noms: { budget: 'Budget', patrimoine: 'Patrimoine', bourse: 'Bourse', prets: 'Prêts' } },
  sport: { titre: 'Sport', vues: ['suivisport', 'plansport', 'conseilssport'], noms: { suivisport: 'Suivi', plansport: 'Programme', conseilssport: 'Conseils' } },
  famille: { titre: 'Famille et réglages', vues: ['membres'], cache: true }, // hors barre : accessible par l'avatar en haut
};
const NOMS_ONGLETS = { accueil: 'Accueil', planning: 'Planning', maison: 'Maison', argent: 'Argent', sport: 'Sport' };
const AJOUT = { // bouton « + » flottant par vue
  taches: ['tache', 'Tâche'], agenda: ['event', 'Événement'], bourse: ['pos', 'Ligne'], budget: ['tx', 'Opération'], prets: ['pret', 'Prêt'], recettes: ['recette-form', 'Recette'], suivisport: ['seance', 'Séance'], patrimoine: ['epargne', 'Épargne'], plansport: ['plan-item', 'Séance prévue'], carnet: ['carnet', 'Fiche'], voyages: ['voyage', 'Voyage'], cadeaux: ['cadeau', 'Idée'], membres: ['membre', 'Membre'],
};
let section = 'accueil';
const sous = { planning: 'agenda', maison: 'courses', argent: 'budget', famille: 'membres', sport: 'suivisport' };
const NAV_CLE = 'app-famille-nav';
// On rouvre toujours l'appli sur l'accueil, mais chaque rubrique retrouve sa dernière page
function sauverNav() { try { localStorage.setItem(NAV_CLE, JSON.stringify({ sous })); } catch {} }
function restaurerNav() {
  try {
    const n = JSON.parse(localStorage.getItem(NAV_CLE) || 'null');
    if (n && n.sous) for (const [s, v] of Object.entries(n.sous)) if (SECTIONS[s] && SECTIONS[s].vues.includes(v)) sous[s] = v;
  } catch {}
}
let jourSel = aujourdhui();
let moisAff = new Date(); moisAff.setDate(1);
let semaineAff = lundi(new Date());
let moisBudget = iso(new Date()).slice(0, 7);
let filtreT = '';

const vueCourante = () => (SECTIONS[section].vues.length > 1 ? sous[section] : SECTIONS[section].vues[0]);
function aller(v) {
  if (SECTIONS[v]) section = v;
  else { section = Object.keys(SECTIONS).find(s => SECTIONS[s].vues.includes(v)); sous[section] = v; }
  fermerFeuille();
  sauverNav();
  rendre();
  window.scrollTo(0, 0);
}

function rendre() {
  const S = SECTIONS[section], v = vueCourante(), actif = membre(etat.actif);
  document.body.classList.toggle('fin', section === 'argent');
  document.body.classList.toggle('sp', section === 'sport');
  document.getElementById('titre').textContent = section === 'accueil' ? `Bonjour${actif ? ', ' + actif.nom : ''}` : S.titre;
  document.getElementById('sousTitre').textContent = section === 'accueil' && typeof accueilCfg === 'function' && accueilCfg().masques.includes('meteo') ? fmtLong(aujourdhui()) : '';
  document.getElementById('tabs').innerHTML = Object.keys(SECTIONS).filter(s => !SECTIONS[s].cache).map(s =>
    `<button data-goto="${s}"${s === section ? ' aria-current="page"' : ''}><span class="pastille">${ico(s)}</span>${NOMS_ONGLETS[s]}</button>`).join('');
  const nav = document.getElementById('sousNav');
  nav.hidden = S.vues.length < 2;
  nav.innerHTML = S.vues.length < 2 ? '' : `<div class="seg${S.vues.length > 3 ? ' dense' : ''}" role="tablist">${S.vues.map(x =>
    `<button role="tab" data-goto="${x}" aria-selected="${x === v}">${S.noms[x]}</button>`).join('')}</div>`;
  document.getElementById('btnRech').innerHTML = ico('recherche');
  document.getElementById('btnProfil').innerHTML = actif ? avatar(actif.id) : ico('famille', 20);
  document.getElementById('btnProfil').setAttribute('aria-label', actif ? `Profil : ${actif.nom}, famille et réglages` : 'Famille et réglages');
  document.getElementById('vue').innerHTML = VUES[v]();
  const a = AJOUT[v];
  document.getElementById('fabZone').innerHTML = a ? `<button class="fab" data-act="ouvrir" data-sheet="${a[0]}" aria-label="Ajouter : ${a[1]}">${ico('plus')}${a[1]}</button>` : '';
}

// ---------- Vues ----------
const VUES = {
  accueil() { return ''; },

  courses() {
    const aAcheter = etat.courses.filter(c => !c.fait), panier = etat.courses.filter(c => c.fait);
    const dans = new Set(aAcheter.map(c => cle(c.nom)));
    const hab = Object.entries(etat.freq).filter(([k, v]) => v.n >= 2 && !dans.has(k)).sort((a, b) => b[1].n - a[1].n).slice(0, 8);
    const parRayon = RAYONS_ORDRE.map(r => [r, aAcheter.filter(c => (c.rayon || rayonDe(c.nom)) === r)]).filter(([, l]) => l.length);
    const ligne = c => `<li class="rang ${c.fait ? 'fait' : ''}"><label class="rang-main"><input type="checkbox" class="coche" data-act="course-fait" data-id="${c.id}"${c.fait ? ' checked' : ''}><span class="rang-txt">${esc(c.nom)}${c.pour ? `<small>pour ${esc(c.pour)}</small>` : ''}</span></label>
      ${c.qte > 1 ? `<span class="pill pri">×${c.qte}</span>` : ''}
      <button class="icone" data-act="course-del" data-id="${c.id}" aria-label="Supprimer ${esc(c.nom)}">${ico('x', 18)}</button></li>`;
    return `
      <form class="ajout" data-form="course"><input type="text" name="nom" placeholder="Ajouter (ex. 2 yaourts)" aria-label="Nouvel article" required autocomplete="off" enterkeyhint="done"><button class="btn" aria-label="Ajouter">${ico('plus', 20)}</button></form>
      ${hab.length ? `<div class="chips" role="group" aria-label="Articles habituels">${hab.map(([k, v]) => `<button data-act="course-hab" data-k="${esc(k)}">+ ${esc(v.nom)}</button>`).join('')}</div>` : ''}
      <section class="carte"><div class="carte-tete"><h2>À acheter</h2><span class="pill pri">${aAcheter.length}</span></div>
        ${parRayon.map(([r, l]) => `<h3>${r}</h3><ul class="liste">${l.map(ligne).join('')}</ul>`).join('') || '<p class="vide">Rien à acheter. Ajoutez un article ci-dessus.</p>'}</section>
      ${panier.length ? `<section class="carte"><div class="carte-tete"><h2>Dans le panier</h2><button class="lien" data-act="course-vider">Vider</button></div>
        <ul class="liste">${panier.map(ligne).join('')}</ul></section>` : ''}`;
  },

  taches() {
    const scores = etat.membres.map(m => ({ m, pts: etat.taches.filter(t => t.fait && t.par === m.id).reduce((s, t) => s + (t.points || 0), 0) })).sort((a, b) => b.pts - a.pts);
    const liste = etat.taches.filter(t => !filtreT || t.membre === filtreT).sort((a, b) => (a.fait - b.fait) || (a.echeance || '9').localeCompare(b.echeance || '9'));
    return `
      ${etat.membres.length ? `<div class="chips" role="group" aria-label="Filtrer par personne">
        <button data-act="filtre" data-v="" aria-pressed="${!filtreT}">Tout le monde</button>
        ${etat.membres.map(m => `<button data-act="filtre" data-v="${m.id}" aria-pressed="${filtreT === m.id}">${esc(m.nom)}</button>`).join('')}</div>` : ''}
      <section class="carte"><ul class="liste">
        ${liste.map(t => `<li class="rang ${t.fait ? 'fait' : ''}"><input type="checkbox" class="coche" data-act="tache-fait" data-id="${t.id}" aria-label="Terminer ${esc(t.titre)}"${t.fait ? ' checked' : ''}>
          <button class="rang-btn" data-act="ouvrir" data-sheet="tache" data-id="${t.id}" aria-label="Modifier ${esc(t.titre)}"><span class="rang-txt">${esc(t.titre)}<small>${[t.points ? `+${t.points} point${pl(t.points)}` : '', t.rec ? '↻ ' + REC_NOMS[t.rec].toLowerCase() : ''].filter(Boolean).join(' · ')}</small></span></button>${echeanceTag(t)}${avatar(t.membre)}
          <button class="icone" data-act="tache-del" data-id="${t.id}" aria-label="Supprimer ${esc(t.titre)}">${ico('x', 18)}</button></li>`).join('')
          || `<li class="vide">Aucune tâche.<br><button class="btn sec" data-act="ouvrir" data-sheet="tache">Ajouter une tâche</button></li>`}
      </ul></section>
      ${scores.some(s => s.pts > 0) ? `<section class="carte"><h2>Classement</h2><ul class="liste">
        ${scores.map((s, i) => `<li class="rang"><span class="mut num" style="width:20px">${i + 1}</span>${avatar(s.m.id)}<span class="rang-txt">${esc(s.m.nom)}</span><b class="score">${s.pts}</b></li>`).join('')}</ul>
        <small>Les points vont à la personne qui coche la tâche (membre actif en haut à droite).</small></section>` : ''}`;
  },

  agenda() {
    const an = moisAff.getFullYear(), mo = moisAff.getMonth();
    const decal = (new Date(an, mo, 1).getDay() + 6) % 7, nbJ = new Date(an, mo + 1, 0).getDate();
    const cases = Array.from({ length: decal }, () => '<div></div>');
    for (let j = 1; j <= nbJ; j++) {
      const d = `${an}-${pad(mo + 1)}-${pad(j)}`, evs = evenementsDu(d);
      cases.push(`<button class="jour${d === jourSel ? ' sel' : ''}${d === aujourdhui() ? ' auj' : ''}" data-act="jour" data-date="${d}" aria-label="${fmtDate(d)}${evs.length ? ', ' + evs.length + ' événement' + pl(evs.length) : ''}" aria-pressed="${d === jourSel}">${j}
        <span class="pts">${evs.slice(0, 3).map(e => `<b style="background:${membre(e.membre)?.couleur || 'var(--pri)'}"></b>`).join('')}</span></button>`);
    }
    const evs = evenementsDu(jourSel);
    return `
      <section class="carte">
        <div class="carte-tete"><button class="icone" data-act="mois" data-n="-1" aria-label="Mois précédent">‹</button><h2 class="cap">${MOIS[mo]} ${an}</h2><button class="icone" data-act="mois" data-n="1" aria-label="Mois suivant">›</button></div>
        <div class="mois">${JOURS.map(j => `<div class="h">${j}</div>`).join('')}${cases.join('')}</div>
        <button class="lien" data-act="aujourdhui" style="align-self:center">Revenir à aujourd’hui</button>
      </section>
      <section class="carte"><h2 class="cap">${fmtLong(jourSel)}</h2>
        <ul class="liste">${evs.map(e => `<li class="rang"><button class="rang-btn" data-act="ouvrir" data-sheet="event" data-id="${e.id}" aria-label="Modifier ${esc(e.titre)}"><span class="heure">${esc(e.heure || '—')}</span><span class="rang-txt">${esc(e.titre)}${e.rec ? `<small>↻ ${REC_NOMS[e.rec].toLowerCase()}</small>` : ''}</span>${avatar(e.membre)}</button>
          <button class="icone" data-act="event-del" data-id="${e.id}" aria-label="Supprimer ${esc(e.titre)}">${ico('x', 18)}</button></li>`).join('')
          || '<li class="vide">Aucun événement ce jour-là.</li>'}</ul></section>`;
  },

  repas() {
    const jours = Array.from({ length: 7 }, (_, i) => ajouteJours(semaineAff, i)), auj = aujourdhui();
    return `
      <div class="carte-tete"><button class="icone" data-act="semaine" data-n="-1" aria-label="Semaine précédente">‹</button>
        <b>${fmtDate(iso(semaineAff))} → ${fmtDate(iso(jours[6]))}</b>
        <button class="icone" data-act="semaine" data-n="1" aria-label="Semaine suivante">›</button></div>
      ${typeof ideesRepas === 'function' ? ideesRepas() : ''}
      ${jours.map(d => { const k = iso(d), r = etat.repas[k] || {}; return `<div class="jr${k === auj ? ' auj' : ''}"><h3>${fmtLong(k)}${k === auj ? ' · aujourd’hui' : ''}</h3>
        ${fld('Midi', `<input data-repas="${k}" data-slot="midi" list="dlRecettes" value="${esc(r.midi)}" placeholder="—">`)}
        ${fld('Soir', `<input data-repas="${k}" data-slot="soir" list="dlRecettes" value="${esc(r.soir)}" placeholder="—">`)}</div>`; }).join('')}
      <datalist id="dlRecettes">${etat.recettes.map(x => `<option value="${esc(x.nom)}">`).join('')}</datalist>
      <button class="btn sec plein" data-act="repas-courses">Ajouter les plats de la semaine aux courses</button>`;
  },

  membres() {
    return `
      <button class="lien" data-goto="accueil" style="align-self:flex-start">‹ Retour à l’accueil</button>
      <section class="carte"><h2>Membres</h2><ul class="liste">
        ${etat.membres.map(m => `<li class="rang"><button class="rang-btn" data-act="ouvrir" data-sheet="membre" data-id="${m.id}" aria-label="Modifier ${esc(m.nom)}">${avatar(m.id, true)}<span class="rang-txt"><b>${esc(m.nom)}</b>${m.naissance ? `<small>Né(e) le ${fmtDate(m.naissance)}</small>` : ''}</span></button>
          <button class="icone" data-act="membre-del" data-id="${m.id}" aria-label="Supprimer ${esc(m.nom)}">${ico('x', 18)}</button></li>`).join('')
          || `<li class="vide">Ajoutez les membres de la famille.<br><button class="btn sec" data-act="ouvrir" data-sheet="membre">Ajouter un membre</button></li>`}</ul></section>
      ${typeof syncCarte === 'function' ? syncCarte() : ''}
      ${typeof blocNatif === 'function' ? blocNatif() : ''}
      <section class="carte"><h2>Sauvegarde</h2>
        <p class="mut">Les données restent sur cet appareil. Exportez-les pour les conserver ou les copier sur un autre appareil.</p>
        <div class="rangee"><button class="btn" data-act="export">Exporter</button><button class="btn sec" data-act="import-coller">Importer (coller)</button></div>
        <label class="btn sec">Importer un fichier<input type="file" id="import" accept="application/json" hidden></label></section>`;
  },
};

// ---------- Feuilles de saisie (bottom sheets) ----------
const SHEETS = {
  tache: d => {
    const t = d.id ? etat.taches.find(x => x.id === d.id) : null;
    return { titre: t ? 'Modifier la tâche' : 'Nouvelle tâche', corps: `<form class="formulaire" data-form="tache"><input type="hidden" name="id" value="${t ? t.id : ''}">
    ${fld('Tâche', `<input name="titre" required autocomplete="off" placeholder="Sortir les poubelles" value="${esc(t ? t.titre : '')}">`)}
    <div class="duo">${fld('Pour', `<select name="membre">${optionsMembres(t ? t.membre : etat.actif, 'Tout le monde')}</select>`)}
    ${fld('Points', `<input type="number" name="points" min="0" max="100" value="${t ? t.points : 1}" inputmode="numeric">`)}</div>
    <div class="duo">${fld('Échéance (facultatif)', `<input type="date" name="echeance" value="${t ? t.echeance || '' : ''}">`)}${fld('Répéter', `<select name="rec"><option value="">Jamais</option>${Object.entries(REC_NOMS).map(([k, n]) => `<option value="${k}"${t && t.rec === k ? ' selected' : ''}>${n}</option>`).join('')}</select>`)}</div>
    <button class="btn plein">${t ? 'Enregistrer' : 'Ajouter la tâche'}</button>${t ? `<button type="button" class="btn danger plein" data-act="tache-del" data-id="${t.id}">Supprimer</button>` : ''}</form>` };
  },
  event: d => {
    const e = d.id ? etat.events.find(x => x.id === d.id) : null;
    return { titre: e ? 'Modifier l’événement' : 'Nouvel événement', corps: `<form class="formulaire" data-form="event"><input type="hidden" name="id" value="${e ? e.id : ''}">
    ${fld('Titre', `<input name="titre" required autocomplete="off" placeholder="Rendez-vous dentiste" value="${esc(e ? e.titre : '')}">`)}
    <div class="duo">${fld('Date', `<input type="date" name="date" value="${e ? e.date : jourSel}" required>`)}${fld('Heure', `<input type="time" name="heure" value="${e ? e.heure || '' : ''}">`)}</div>
    <div class="duo">${fld('Pour', `<select name="membre">${optionsMembres(e ? e.membre : '', 'Toute la famille')}</select>`)}
    ${fld('Répéter', `<select name="rec"><option value="">Jamais</option>${Object.entries(REC_NOMS).map(([k, n]) => `<option value="${k}"${e && e.rec === k ? ' selected' : ''}>${n}</option>`).join('')}</select>`)}</div>
    ${e && e.rec ? '<small>La modification s’applique à toutes les occurrences de cet événement récurrent.</small>' : ''}
    <button class="btn plein">${e ? 'Enregistrer' : 'Ajouter l’événement'}</button>${e ? `<button type="button" class="btn danger plein" data-act="event-del" data-id="${e.id}">Supprimer</button>` : ''}</form>` };
  },
  membre: d => {
    const m = d.id ? membre(d.id) : null, coul = m ? m.couleur : couleurLibre();
    return { titre: m ? 'Modifier le membre' : 'Nouveau membre', corps: `<form class="formulaire" data-form="membre"><input type="hidden" name="id" value="${m ? m.id : ''}">
    ${fld('Prénom', `<input name="nom" required autocomplete="off" value="${esc(m ? m.nom : '')}">`)}
    ${fld('Date de naissance (facultatif)', `<input type="date" name="naissance" value="${esc(m ? m.naissance || '' : '')}">`)}
    <fieldset class="champ" style="border:0;padding:0;margin:0"><legend style="padding:0;margin-bottom:6px">Couleur</legend>
      <div class="palette" role="radiogroup" aria-label="Couleur du membre">${COULEURS.map((c, k) => { const pris = etat.membres.find(x => x.couleur === c && (!m || x.id !== m.id)); return `<label title="${NOMS_COULEURS[k]}${pris ? ' (utilisée par ' + esc(pris.nom) + ')' : ''}" style="--c:${c}"><input type="radio" name="couleur" value="${c}" aria-label="${NOMS_COULEURS[k]}"${c === coul ? ' checked' : ''}><span></span></label>`; }).join('')}</div></fieldset>
    <button class="btn plein">${m ? 'Enregistrer' : 'Ajouter'}</button></form>` };
  },
  tx: d => {
    const t = d.id ? etat.tx.find(x => x.id === d.id) : null, neg = !t || t.montant < 0;
    return { titre: t ? 'Modifier l’opération' : 'Nouvelle opération', corps: `<form class="formulaire" data-form="tx"><input type="hidden" name="id" value="${t ? t.id : ''}">
    <div class="choix" role="radiogroup" aria-label="Type"><label><input type="radio" name="type" value="-1"${neg ? ' checked' : ''}>Dépense</label><label><input type="radio" name="type" value="1"${neg ? '' : ' checked'}>Revenu</label></div>
    ${fld('Libellé', `<input name="libelle" required autocomplete="off" value="${esc(t ? t.libelle : '')}">`)}
    <div class="duo">${fld('Montant (€)', `<input type="number" name="montant" step="0.01" min="0" required inputmode="decimal" value="${t ? Math.abs(t.montant) : ''}">`)}
    ${fld('Date', `<input type="date" name="date" value="${t ? t.date : (moisBudget === aujourdhui().slice(0, 7) ? aujourdhui() : moisBudget + '-01')}" required>`)}</div>
    ${fld('Catégorie', `<select name="cat"><option value="">Automatique</option>${t && t.epargne ? '<option value="Épargne" selected>Épargne (virement)</option>' : ''}${NOMS_CATS.filter(c => c !== 'Revenus').map(c => `<option${t && t.cat === c ? ' selected' : ''}>${c}</option>`).join('')}</select>`)}
    <button class="btn plein">${t ? 'Enregistrer' : 'Ajouter'}</button></form>` };
  },
};
SHEETS.profil = () => ({ titre: 'Qui utilise l’appli ?', corps: `<p class="mut">Votre prénom sert à attribuer vos points, vos tâches et votre suivi sportif. Ce choix reste sur cet appareil.</p>
  <ul class="liste">${etat.membres.map(m => `<li><button class="rang" data-act="actif" data-id="${m.id}">${avatar(m.id)}<span class="rang-txt"><b>${esc(m.nom)}</b></span>${m.id === etat.actif ? '<span class="pill ok">Vous</span>' : ''}</button></li>`).join('') || '<li class="vide">Aucun membre pour l’instant.</li>'}</ul>
  <button class="btn plein" data-act="aller-famille">Famille, synchronisation et sauvegarde</button>
  <button class="btn sec plein" data-act="ouvrir" data-sheet="accueil-perso">Personnaliser l’accueil</button>` });
SHEETS.article = () => ({ titre: 'Ajouter à la liste de courses', corps: `<form class="formulaire" data-form="course">
  ${fld('Article', '<input name="nom" required autocomplete="off" placeholder="2 yaourts" enterkeyhint="done">')}
  <button class="btn plein">Ajouter</button></form>` });
SHEETS.recurrent = d => {
  const r = d.id ? etat.recurrents.find(x => x.id === d.id) : null, neg = !r || r.montant < 0;
  return { titre: r ? 'Modifier l’opération automatique' : 'Opération automatique', corps: `<form class="formulaire" data-form="recurrent"><input type="hidden" name="id" value="${r ? r.id : ''}">
  <div class="choix" role="radiogroup" aria-label="Type"><label><input type="radio" name="type" value="-1"${neg ? ' checked' : ''}>Dépense</label><label><input type="radio" name="type" value="1"${neg ? '' : ' checked'}>Revenu</label></div>
  ${fld('Libellé', `<input name="libelle" required autocomplete="off" placeholder="Loyer" value="${esc(r ? r.libelle : '')}">`)}
  <div class="duo">${fld('Montant (€)', `<input type="number" name="montant" step="0.01" min="0" required inputmode="decimal" value="${r ? Math.abs(r.montant) : ''}">`)}${fld('Jour du mois (1-28)', `<input type="number" name="jour" min="1" max="28" required inputmode="numeric" value="${r ? r.jour : 1}">`)}</div>
  ${fld('Catégorie', `<select name="cat"><option value="">Automatique</option>${NOMS_CATS.filter(c => c !== 'Revenus').map(c => `<option${r && r.cat === c ? ' selected' : ''}>${c}</option>`).join('')}</select>`)}
  ${r ? `<label class="rang-main"><input type="checkbox" class="coche" name="actif"${r.actif === false ? '' : ' checked'}><span class="rang-txt">Active<small>Décochez pour suspendre sans supprimer</small></span></label>
  <label class="rang-main"><input type="checkbox" class="coche" name="maj" checked><span class="rang-txt">Mettre aussi à jour l’opération de ce mois<small>Sinon la modification s’applique à partir du mois prochain</small></span></label>` : ''}
  <button class="btn plein">${r ? 'Enregistrer' : 'Ajouter'}</button></form>` };
};
SHEETS.objectif = () => ({ titre: 'Nouvel objectif d’épargne', corps: `<form class="formulaire" data-form="objectif">
  ${fld('Nom', '<input name="nom" required autocomplete="off" placeholder="Vacances d’été">')}
  <div class="duo">${fld('Montant visé (€)', '<input type="number" name="cible" step="1" min="1" required inputmode="decimal">')}${fld('Déjà épargné (€)', '<input type="number" name="actuel" step="1" min="0" value="0" inputmode="decimal">')}</div>
  ${fld('Date visée (facultatif)', '<input type="date" name="date">')}
  <button class="btn plein">Créer l’objectif</button></form>` });
let RESULTATS = [];
SHEETS.recherche = () => ({ titre: 'Rechercher', corps: `<input id="q" type="search" placeholder="Courses, tâches, événements, lignes…" aria-label="Rechercher" autocomplete="off"><div id="resRech" class="resultats"><p class="vide">Tapez au moins 2 lettres.</p></div>` });
function rechercher(q) {
  const k = cle(q), R = [];
  if (k.length < 2) return R;
  const m = s => cle(s || '').includes(k), add = (g, t, s, extra) => R.push({ g, t, s, ...extra });
  etat.courses.filter(c => m(c.nom)).slice(0, 6).forEach(c => add('Courses', c.nom, c.fait ? 'Dans le panier' : 'À acheter', { vue: 'courses' }));
  etat.taches.filter(t => m(t.titre)).slice(0, 6).forEach(t => add('Tâches', t.titre, t.fait ? 'Terminée' : t.echeance ? 'Échéance ' + fmtDate(t.echeance) : 'À faire', { vue: 'taches' }));
  etat.events.filter(e => m(e.titre)).slice(0, 6).forEach(e => add('Agenda', e.titre, fmtDate(e.date) + (e.rec ? ' · ' + REC_NOMS[e.rec].toLowerCase() : ''), { vue: 'agenda', date: e.date }));
  Object.entries(etat.repas).forEach(([d, r]) => [r.midi, r.soir].filter(x => x && m(x)).forEach(x => add('Repas', x, fmtDate(d), { vue: 'repas', date: d })));
  etat.tx.filter(t => m(t.libelle) || m(t.cat)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).forEach(t => add('Budget', t.libelle, `${fmtDate(t.date)} · ${eur(t.montant)}`, { vue: 'budget', mois: t.date.slice(0, 7) }));
  etat.objectifs.filter(o => m(o.nom)).forEach(o => add('Budget', o.nom, 'Objectif d’épargne', { vue: 'budget' }));
  etat.recurrents.filter(r => m(r.libelle)).forEach(r => add('Budget', r.libelle, 'Opération récurrente', { vue: 'budget' }));
  etat.pf.filter(p => m(p.ticker) || m(p.nom)).forEach(p => add('Bourse', p.ticker + (p.nom ? ' · ' + p.nom : ''), 'Ligne du portefeuille', { vue: 'bourse', onglet: 'lignes' }));
  etat.prets.filter(x => m(x.nom)).forEach(x => add('Prêts', x.nom, 'Prêt immobilier ou crédit', { vue: 'prets' }));
  etat.membres.filter(x => m(x.nom)).forEach(x => add('Famille', x.nom, 'Membre', { vue: 'membres' }));
  return R;
}
function afficherResultats(q) {
  RESULTATS = rechercher(q);
  const z = document.getElementById('resRech');
  if (!z) return;
  if (cle(q).length < 2) { z.innerHTML = '<p class="vide">Tapez au moins 2 lettres.</p>'; return; }
  if (!RESULTATS.length) { z.innerHTML = '<p class="vide">Aucun résultat.</p>'; return; }
  const groupes = [...new Set(RESULTATS.map(r => r.g))];
  z.innerHTML = groupes.map(g => `<h3 class="mut" style="margin:10px 0 2px;font-size:.78rem;text-transform:uppercase;letter-spacing:.06em">${g}</h3><ul class="liste">${RESULTATS.map((r, i) => r.g === g ? `<li><button class="rang" data-act="res" data-i="${i}"><span class="rang-txt">${esc(r.t)}<small>${esc(r.s)}</small></span></button></li>` : '').join('')}</ul>`).join('');
}
function ouvrirFeuille(nom, data) {
  const s = SHEETS[nom](data || {});
  feuille(s.titre, s.corps);
}
function feuille(titre, corps) {
  fermerFeuille();
  const fond = document.createElement('div');
  fond.className = 'modal';
  fond.innerHTML = `<div class="boite" role="dialog" aria-modal="true" aria-label="${esc(titre)}"><div class="boite-tete"><h2>${esc(titre)}</h2>
    <button type="button" class="icone" data-fermer aria-label="Fermer">${ico('x', 20)}</button></div>${corps}</div>`;
  document.body.appendChild(fond);
  fond.addEventListener('click', e => { if (e.target === fond || e.target.closest('[data-fermer]')) fermerFeuille(); });
  fond.querySelector('input:not([type=radio]):not([type=hidden]),select,textarea')?.focus();
}
const fermerFeuille = () => document.querySelectorAll('.modal').forEach(m => m.remove());

// ---------- Actions ----------
const UNDO = new Set(['course-del', 'course-vider', 'tache-del', 'event-del', 'tx-del', 'membre-del', 'pf-del', 'rec-del', 'obj-del', 'div-del', 'pret-del', 'recette-del', 'carnet-del', 'cadeau-del', 'voyage-del', 'voy-item-del', 'voy-etape-del', 'voy-dep-del', 'seance-del', 'parcours-del', 'plan-item-del', 'prog-del', 'prog-del-voy', 'epargne-del']);
const ACTIONS = {
  'ouvrir': el => { ouvrirFeuille(el.dataset.sheet, el.dataset); return 'vue'; },
  'actif': el => { etat.actif = el.dataset.id; fermerFeuille(); },
  'aller-famille': () => { aller('famille'); return 'vue'; },
  'filtre': el => { filtreT = el.dataset.v; return 'vue'; },
  'course-fait': el => { const c = etat.courses.find(x => x.id === el.dataset.id); c.fait = el.checked; },
  'course-hab': el => { const v = etat.freq[el.dataset.k]; if (v) ajouterCourse(v.nom, 1); },
  'res': el => {
    const r = RESULTATS[Number(el.dataset.i)];
    if (!r) return 'vue';
    if (r.date) { jourSel = r.date; moisAff = new Date(parse(r.date).getFullYear(), parse(r.date).getMonth(), 1); semaineAff = lundi(parse(r.date)); }
    if (r.mois) moisBudget = r.mois;
    if (r.onglet) bTab = r.onglet;
    if (r.voy) voySel = r.voy;
    aller(r.vue);
    return 'vue';
  },
  'rec-del': el => { etat.recurrents = etat.recurrents.filter(x => x.id !== el.dataset.id); },
  'obj-del': el => { etat.objectifs = etat.objectifs.filter(x => x.id !== el.dataset.id); },
  'obj-versement': async el => {
    const o = etat.objectifs.find(x => x.id === el.dataset.id);
    const r = await dialogue({ titre: `Versement : ${o.nom}`, champs: [{ nom: 'v', label: 'Montant versé (€)' }], ok: 'Ajouter' });
    const v = r && Number(String(r.v).replace(',', '.'));
    if (!v || v <= 0) return false;
    o.actuel = (o.actuel || 0) + v;
  },
  'course-del': el => { etat.courses = etat.courses.filter(x => x.id !== el.dataset.id); },
  'course-vider': () => { etat.courses = etat.courses.filter(c => !c.fait); },
  'tache-fait': el => {
    const t = etat.taches.find(x => x.id === el.dataset.id);
    t.fait = el.checked;
    t.par = el.checked ? (etat.actif || t.membre || null) : null;
    if (el.checked && t.rec && !t.suivante) { // tâche récurrente : prochaine occurrence
      const n = { ...t, id: uid(), fait: false, par: null, suivante: null, echeance: prochaine(t.echeance || aujourdhui(), t.rec) };
      etat.taches.push(n); t.suivante = n.id;
    } else if (!el.checked && t.suivante) {
      etat.taches = etat.taches.filter(x => !(x.id === t.suivante && !x.fait)); t.suivante = null;
    }
  },
  'tache-del': el => { etat.taches = etat.taches.filter(x => x.id !== el.dataset.id); },
  'event-del': el => { etat.events = etat.events.filter(x => x.id !== el.dataset.id); },
  'membre-del': el => {
    const id = el.dataset.id;
    etat.membres = etat.membres.filter(m => m.id !== id);
    if (etat.actif === id) etat.actif = null;
    etat.taches.forEach(t => { if (t.membre === id) t.membre = ''; if (t.par === id) t.par = null; });
    etat.events.forEach(e => { if (e.membre === id) e.membre = ''; });
    etat.sportSeances = etat.sportSeances.filter(x => x.membre !== id);
    etat.sportPlan = etat.sportPlan.filter(x => x.membre !== id);
    etat.sportProg = etat.sportProg.filter(x => x.membre !== id);
    etat.sportProfils = etat.sportProfils.filter(x => x.id !== id);
  },
  'mois-budget': el => {
    const [y, m] = moisBudget.split('-').map(Number);
    moisBudget = iso(new Date(y, m - 1 + Number(el.dataset.n), 1)).slice(0, 7);
    return 'vue';
  },
  'tx-del': el => { etat.tx = etat.tx.filter(x => x.id !== el.dataset.id); },
  'jour': el => { jourSel = el.dataset.date; return 'vue'; },
  'aujourdhui': () => { jourSel = aujourdhui(); moisAff = new Date(); moisAff.setDate(1); return 'vue'; },
  'mois': el => { moisAff = new Date(moisAff.getFullYear(), moisAff.getMonth() + Number(el.dataset.n), 1); return 'vue'; },
  'semaine': el => { semaineAff = ajouteJours(semaineAff, 7 * Number(el.dataset.n)); return 'vue'; },
  'repas-courses': () => {
    const noms = new Set(etat.courses.map(c => c.nom.toLowerCase()));
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const r = etat.repas[iso(ajouteJours(semaineAff, i))] || {};
      [r.midi, r.soir].filter(Boolean).forEach(p => {
        const nom = p.trim();
        if (nom && !noms.has(nom.toLowerCase())) { ajouterCourse(nom, 1); noms.add(nom.toLowerCase()); n++; }
      });
    }
    info(n ? `${n} élément${pl(n)} ajouté${pl(n)} aux courses.` : 'Rien à ajouter.');
  },
  'export': async () => {
    await dialogue({ titre: 'Exporter les données', texte: 'Copiez ce texte et conservez-le dans un fichier ou une note : il suffit de le coller dans « Importer » pour tout retrouver.', champs: [{ nom: 'json', zone: true, lecture: true, valeur: JSON.stringify(etat) }], ok: 'Fermer', annuler: false, copie: true });
    return 'vue';
  },
  'import-coller': async () => {
    const r = await dialogue({ titre: 'Importer des données', texte: 'Collez le texte exporté depuis l’application.', champs: [{ nom: 'json', zone: true, valeur: '' }], ok: 'Importer' });
    if (!r) return 'vue';
    await restaurer(r.json);
    return 'vue';
  },
};

const FORMS = {
  course: f => { const [nom, qte] = parseCourse(f.nom.value); if (nom && ajouterCourse(nom, qte) === 'maj') info('Quantité mise à jour.'); else if (nom && f.closest('.modal')) info('Ajouté à la liste de courses.'); },
  tache: f => {
    const o = { titre: f.titre.value.trim(), membre: f.membre.value, points: Number(f.points.value) || 0, echeance: f.echeance.value, rec: f.rec.value }, t = f.id.value && etat.taches.find(x => x.id === f.id.value);
    if (t) Object.assign(t, o); else etat.taches.push({ id: uid(), ...o, fait: false, par: null });
  },
  event: f => { const o = { titre: f.titre.value.trim(), date: f.date.value, heure: f.heure.value, membre: f.membre.value, rec: f.rec.value }, e = f.id.value && etat.events.find(x => x.id === f.id.value); if (e) Object.assign(e, o); else etat.events.push({ id: uid(), ...o }); jourSel = f.date.value; moisAff = new Date(parse(jourSel).getFullYear(), parse(jourSel).getMonth(), 1); },
  tx: f => {
    const m = Math.abs(Number(f.montant.value)) * Number(f.type.value);
    const o = { date: f.date.value, libelle: f.libelle.value.trim(), montant: m, cat: m > 0 ? 'Revenus' : (f.cat.value || devine(f.libelle.value)) };
    const i = f.id && f.id.value ? etat.tx.findIndex(x => x.id === f.id.value) : -1;
    if (i >= 0) Object.assign(etat.tx[i], o); else etat.tx.push({ id: uid(), ...o });
  },
  recurrent: f => {
    const m = Math.abs(Number(f.montant.value)) * Number(f.type.value);
    const o = { libelle: f.libelle.value.trim(), montant: m, jour: Math.min(28, Math.max(1, Number(f.jour.value) || 1)), cat: m > 0 ? 'Revenus' : (f.cat.value || devine(f.libelle.value)) };
    const r = f.id && f.id.value ? etat.recurrents.find(x => x.id === f.id.value) : null;
    if (!r) { etat.recurrents.push({ id: uid(), ...o, dernier: '' }); appliquerRecurrents(); return; }
    Object.assign(r, o, { actif: f.actif.checked });
    if (f.maj.checked) {
      const ym = aujourdhui().slice(0, 7), cleTx = `${r.id}:${ym}`, i = etat.tx.findIndex(t => t.rec === cleTx), date = `${ym}-${pad(r.jour)}`;
      if (i >= 0 && (date <= aujourdhui() && r.actif)) Object.assign(etat.tx[i], { libelle: o.libelle, montant: o.montant, cat: o.cat, date });
      else if (i >= 0) { etat.tx.splice(i, 1); r.dernier = iso(new Date(Number(ym.slice(0, 4)), Number(ym.slice(5)) - 2, 1)).slice(0, 7); } // sera recréée à sa nouvelle date
    }
    appliquerRecurrents();
  },
  objectif: f => etat.objectifs.push({ id: uid(), nom: f.nom.value.trim(), cible: Number(f.cible.value), actuel: Number(f.actuel.value) || 0, date: f.date.value }),
  membre: f => {
    const o = { nom: f.nom.value.trim(), naissance: f.naissance.value, couleur: f.couleur.value || couleurLibre() };
    const m = f.id && f.id.value ? membre(f.id.value) : null;
    if (m) { Object.assign(m, o); return; }
    const n = { id: uid(), ...o };
    etat.membres.push(n);
    if (!etat.actif) etat.actif = n.id;
  },
};

// ---------- Opérations récurrentes (générées à l'ouverture et à la création) ----------
const moisSuivant = ym => { const [y, m] = ym.split('-').map(Number); return iso(new Date(y, m, 1)).slice(0, 7); };
function appliquerRecurrents() {
  const auj = aujourdhui(), cur = auj.slice(0, 7);
  let change = false;
  etat.recurrents.forEach(r => {
    if (r.actif === false) return;
    let ym = r.dernier ? moisSuivant(r.dernier) : cur;
    while (ym <= cur) {
      const date = `${ym}-${pad(Math.min(r.jour, 28))}`;
      if (date > auj) break;
      const k = `${r.id}:${ym}`;
      if (!etat.tx.some(t => t.rec === k)) etat.tx.push({ id: uid(), date, libelle: r.libelle, montant: r.montant, cat: r.cat, rec: k });
      r.dernier = ym; change = true; ym = moisSuivant(ym);
    }
  });
  if (change) sauver();
}

// ---------- Événements ----------
document.addEventListener('click', e => {
  const g = e.target.closest('[data-goto]');
  if (g) { aller(g.dataset.goto); return; }
  const el = e.target.closest('[data-act]');
  if (el && el.type !== 'checkbox') executer(el);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.act && t.type === 'checkbox') executer(t);
  else if (t.dataset.repas) {
    const k = t.dataset.repas;
    etat.repas[k] = { ...etat.repas[k], [t.dataset.slot]: t.value.trim() };
    sauver();
  } else if (t.dataset.plafond) { etat.plafonds[t.dataset.plafond] = Number(t.value) || 0; sauver(); rendre(); }
  else if (t.dataset.pfcfg) changePf(t);
  else if (t.dataset.pretcfg) changePret(t);
  else if (t.dataset.treso || t.dataset.pat) changeFin(t);
  else if (t.id === 'importCsv') importerCsv(t.files[0]);
  else if (t.id === 'import') importer(t.files[0]);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.modal:not(:has(form.boite))')) fermerFeuille(); });
document.addEventListener('input', e => { if (e.target.id === 'q') afficherResultats(e.target.value); });
document.addEventListener('submit', e => {
  const f = e.target;
  if (!f.dataset.form) return;
  e.preventDefault();
  FORMS[f.dataset.form](f);
  sauver();
  if (f.closest('.modal')) fermerFeuille();
  rendre();
  if (f.dataset.form === 'course') document.querySelector('[data-form=course] [name=nom]')?.focus();
});

async function executer(el) {
  const nom = el.dataset.act;
  const avant = UNDO.has(nom) ? JSON.stringify(etat) : null;
  const r = await ACTIONS[nom](el);
  if (r !== false && r !== 'vue') sauver();
  if (avant && r !== false) fermerFeuille();
  rendre();
  if (avant && r !== false) info('Supprimé', { label: 'Annuler', fn: () => { etat = { ...defaut(), ...JSON.parse(avant) }; sauver(); rendre(); } });
}

async function restaurer(texte) {
  try {
    const d = JSON.parse(texte);
    if (typeof d !== 'object' || !Array.isArray(d.membres)) throw new Error();
    if (!await confirmer('Remplacer toutes les données actuelles ?')) return;
    etat = { ...defaut(), ...d };
    sauver();
    rendre();
    info('Données importées.');
  } catch { info('Texte ou fichier invalide.'); }
}
function importer(fichier) {
  if (!fichier) return;
  const lecteur = new FileReader();
  lecteur.onload = () => restaurer(lecteur.result);
  lecteur.readAsText(fichier);
}

// ---------- Notifications et dialogues (alert/confirm/prompt indisponibles dans certains contextes) ----------
function info(msg, action) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  t.querySelector('button')?.addEventListener('click', () => { action.fn(); t.remove(); });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), action ? 6500 : 4000);
}
function dialogue({ titre = '', texte = '', champs = [], ok = 'Valider', annuler = true, copie = false }) {
  return new Promise(resolve => {
    fermerFeuille();
    const fond = document.createElement('div');
    fond.className = 'modal';
    fond.innerHTML = `<form class="boite" role="dialog" aria-modal="true">
      ${titre ? `<h2>${esc(titre)}</h2>` : ''}${texte ? `<p>${esc(texte)}</p>` : ''}
      ${champs.map((c, i) => c.zone
        ? `<textarea id="dlg${i}" name="${c.nom}" rows="8" ${c.lecture ? 'readonly' : 'required'} aria-label="${esc(c.nom)}">${esc(c.valeur)}</textarea>`
        : fld(esc(c.label), `<input id="dlg${i}" name="${c.nom}" type="${c.type || 'number'}" ${c.type ? '' : 'step="any" inputmode="decimal"'} value="${esc(c.valeur ?? '')}"${c.facultatif ? '' : ' required'}>`)).join('')}
      <div class="actions">${copie ? '<button type="button" class="btn sec" data-copie>Copier</button>' : ''}${annuler ? '<button type="button" class="btn sec" data-non>Annuler</button>' : ''}<button class="btn">${esc(ok)}</button></div></form>`;
    document.body.appendChild(fond);
    const f = fond.firstElementChild;
    const fin = v => { fond.remove(); resolve(v); };
    f.addEventListener('submit', e => { e.preventDefault(); fin(Object.fromEntries(new FormData(f))); });
    f.querySelector('[data-non]')?.addEventListener('click', () => fin(null));
    fond.addEventListener('click', e => { if (e.target === fond && annuler) fin(null); });
    f.addEventListener('keydown', e => { if (e.key === 'Escape' && annuler) fin(null); });
    f.querySelector('[data-copie]')?.addEventListener('click', () => {
      const z = f.querySelector('textarea');
      navigator.clipboard.writeText(z.value).then(() => info('Copié.'), () => { z.select(); info('Sélectionné : copiez manuellement.'); });
    });
    (f.querySelector('input,textarea') || f.querySelector('.btn:last-child')).focus();
  });
}
const confirmer = async texte => !!(await dialogue({ texte, ok: 'Confirmer' }));

// ---------- Catégories de budget ----------
const CATS = {
  'Revenus': ['salaire', 'virement recu', 'caf', 'remboursement'],
  'Courses': ['carrefour', 'leclerc', 'auchan', 'lidl', 'intermarche', 'monoprix', 'franprix', 'aldi', 'picard'],
  'Logement': ['loyer', 'edf', 'engie', 'eau', 'assurance hab', 'internet', 'free', 'orange', 'sfr', 'bouygues'],
  'Transport': ['sncf', 'ratp', 'navigo', 'essence', 'total', 'esso', 'uber', 'peage', 'parking'],
  'Santé': ['pharmacie', 'docteur', 'medecin', 'mutuelle', 'dentiste'],
  'Loisirs': ['netflix', 'spotify', 'cinema', 'restaurant', 'resto', 'amazon', 'fnac', 'decathlon'],
  'Enfants': ['ecole', 'cantine', 'creche', 'peri', 'jouet'],
  'Autre': [],
};
const NOMS_CATS = Object.keys(CATS);
const devine = lib => {
  const l = lib.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return NOMS_CATS.find(c => CATS[c].some(k => l.includes(k))) || 'Autre';
};
const eur = n => (Math.abs(n) < 0.005 ? 0 : n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

// ---------- Import CSV ----------
function decoupe(ligne, sep) {
  const out = []; let cur = '', q = false;
  for (const ch of ligne) {
    if (ch === '"') q = !q;
    else if (ch === sep && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map(x => x.trim());
}
const nombre = s => { const v = parseFloat(String(s).replace(/[\s\u00a0€]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')); return isNaN(v) ? null : v; };
function dateCsv(s) {
  let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (m) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${pad(m[2])}-${pad(m[1])}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[0] : null;
}
function importerCsv(fichier) {
  if (!fichier) return;
  const lecteur = new FileReader();
  lecteur.onload = () => {
    const lignes = lecteur.result.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
    const sep = [';', '\t', ','].find(s => (lignes[0] || '').includes(s)) || ';';
    const norm = x => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let idx = lignes.findIndex(l => decoupe(l, sep).some(c => /date/.test(norm(c))));
    if (idx < 0) idx = 0;
    const ent = decoupe(lignes[idx], sep).map(norm);
    const col = re => ent.findIndex(c => re.test(c));
    const cD = Math.max(col(/date/), 0);
    let cL = col(/libelle|label|description|intitule|detail|nom/); if (cL < 0) cL = 1;
    const cM = col(/^montant|amount|somme/), cDeb = col(/debit/), cCre = col(/credit/);
    const existants = new Set(etat.tx.map(t => `${t.date}|${t.libelle}|${t.montant}`));
    let ajoutes = 0, ignores = 0;
    for (const l of lignes.slice(idx + 1)) {
      const c = decoupe(l, sep);
      const date = dateCsv(c[cD] || '');
      let montant = cM >= 0 ? nombre(c[cM] || '') : null;
      if (montant === null && (cDeb >= 0 || cCre >= 0)) {
        const d = nombre(c[cDeb] || ''), cr = nombre(c[cCre] || '');
        montant = (cr || 0) - Math.abs(d || 0);
        if (!d && !cr) montant = null;
      }
      const libelle = c[cL] || '';
      if (!date || montant === null || !libelle) { ignores++; continue; }
      const cle = `${date}|${libelle}|${montant}`;
      if (existants.has(cle)) { ignores++; continue; }
      existants.add(cle);
      etat.tx.push({ id: uid(), date, libelle, montant, cat: montant > 0 ? 'Revenus' : devine(libelle) });
      ajoutes++;
    }
    sauver(); rendre();
    info(`${ajoutes} opération(s) importée(s), ${ignores} ignorée(s) (doublons ou lignes illisibles).`);
  };
  lecteur.readAsText(fichier);
}


restaurerNav();
appliquerRecurrents();
rendre();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
