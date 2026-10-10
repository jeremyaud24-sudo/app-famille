'use strict';

const CLE = 'app-famille-v1';
const COULEURS = ['#0b6b5b', '#c2417c', '#b45309', '#2563eb', '#7c3aed', '#be123c', '#0e7490'];
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// ---------- Données ----------
const defaut = () => ({ membres: [], actif: null, courses: [], taches: [], events: [], repas: {}, tx: [], plafonds: {}, pf: [], pfCfg: {}, freq: {}, recurrents: [], objectifs: [], divs: [], pfHisto: [], prets: [], pretCfg: {} });
let etat = charger();

function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? { ...defaut(), ...JSON.parse(brut) } : defaut();
  } catch { return defaut(); }
}
function sauver() {
  if (typeof majHisto === 'function') majHisto();
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch { info('Impossible de sauvegarder les données.'); }
}
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
function ajouterCourse(nom, qte) {
  const k = cle(nom), ex = etat.courses.find(c => !c.fait && cle(c.nom) === k);
  const f = etat.freq[k] || { nom, n: 0 };
  etat.freq[k] = { nom: f.nom, n: f.n + 1 };
  if (ex) { ex.qte = (ex.qte || 1) + qte; return 'maj'; }
  etat.courses.unshift({ id: uid(), nom, qte, rayon: rayonDe(nom), fait: false });
  return 'new';
}

// ---------- Icônes ----------
const ICONES = {
  accueil: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  agenda: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  listes: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.3 1.3L7 5M3.5 12l1.3 1.3L7 11M3.5 18l1.3 1.3L7 17"/>',
  argent: '<path d="M4 19V5M4 19h16"/><path d="M8 15l4-4 3 3 5-6"/>',
  famille: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15.5 14.2c3 0 5.5 2 5.5 5.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  recherche: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
};
const ico = (n, t = 22) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n]}</svg>`;

// ---------- Navigation ----------
const SECTIONS = {
  accueil: { titre: 'Accueil', vues: ['accueil'] },
  agenda: { titre: 'Agenda', vues: ['agenda'] },
  listes: { titre: 'Listes', vues: ['courses', 'taches', 'repas'], noms: { courses: 'Courses', taches: 'Tâches', repas: 'Repas' } },
  argent: { titre: 'Argent', vues: ['bourse', 'budget', 'prets'], noms: { bourse: 'Bourse', budget: 'Budget', prets: 'Prêts' } },
  famille: { titre: 'Famille', vues: ['famille'] },
};
const NOMS_ONGLETS = { accueil: 'Accueil', agenda: 'Agenda', listes: 'Listes', argent: 'Argent', famille: 'Famille' };
const AJOUT = { // bouton « + » flottant par vue
  taches: ['tache', 'Tâche'], agenda: ['event', 'Événement'], bourse: ['pos', 'Ligne'], budget: ['tx', 'Opération'], prets: ['pret', 'Prêt'], famille: ['membre', 'Membre'],
};
let section = 'accueil';
const sous = { listes: 'courses', argent: 'bourse' };
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
  rendre();
  window.scrollTo(0, 0);
}

function rendre() {
  const S = SECTIONS[section], v = vueCourante(), actif = membre(etat.actif);
  document.getElementById('titre').textContent = section === 'accueil' ? `Bonjour${actif ? ', ' + actif.nom : ''}` : S.titre;
  document.getElementById('sousTitre').textContent = section === 'accueil' ? fmtLong(aujourdhui()) : '';
  document.getElementById('tabs').innerHTML = Object.keys(SECTIONS).map(s =>
    `<button data-goto="${s}"${s === section ? ' aria-current="page"' : ''}><span class="pastille">${ico(s)}</span>${NOMS_ONGLETS[s]}</button>`).join('');
  const nav = document.getElementById('sousNav');
  nav.hidden = S.vues.length < 2;
  nav.innerHTML = S.vues.length < 2 ? '' : `<div class="seg" role="tablist">${S.vues.map(x =>
    `<button role="tab" data-goto="${x}" aria-selected="${x === v}">${S.noms[x]}</button>`).join('')}</div>`;
  document.getElementById('btnRech').innerHTML = ico('recherche');
  const sel = document.getElementById('membreActif');
  sel.innerHTML = optionsMembres(etat.actif, 'Qui êtes-vous ?');
  sel.hidden = !etat.membres.length;
  document.getElementById('vue').innerHTML = VUES[v]();
  const a = AJOUT[v];
  document.getElementById('fabZone').innerHTML = a ? `<button class="fab" data-act="ouvrir" data-sheet="${a[0]}" aria-label="Ajouter : ${a[1]}">${ico('plus')}${a[1]}</button>` : '';
}

// ---------- Vues ----------
const VUES = {
  accueil() {
    const auj = aujourdhui(), demain = iso(ajouteJours(parse(auj), 1));
    const evs = evenementsDu(auj);
    const aFaire = etat.taches.filter(t => !t.fait), aAcheter = etat.courses.filter(c => !c.fait);
    const repas = etat.repas[auj] || {};
    const prochains = [];
    for (let i = 1; i <= 30 && prochains.length < 3; i++) { const d = iso(ajouteJours(parse(auj), i)); evenementsDu(d).forEach(e => { if (prochains.length < 3) prochains.push({ ...e, date: d }); }); }
    const anniv = etat.membres.filter(m => m.naissance && m.naissance.slice(5) === auj.slice(5));
    const pf = etat.pf.length && typeof pfCalc === 'function' ? pfCalc() : null;
    const rappels = [
      ...aFaire.filter(t => t.echeance && t.echeance <= auj).map(t => [t.titre, t.echeance < auj ? 'En retard' : 'Aujourd’hui', t.echeance < auj ? 'bad' : 'warn', 'taches']),
      ...evenementsDu(demain).map(e => [e.titre, 'Demain' + (e.heure ? ' ' + e.heure : ''), 'pri', 'agenda']),
      ...(typeof pretsAlertes === 'function' ? pretsAlertes() : []),
    ];
    return `
      ${etat.membres.length ? '' : `<section class="carte"><h2>Bienvenue</h2><p class="mut">Créez votre foyer pour partager courses, tâches et agenda. Chaque membre a sa couleur.</p><button class="btn" data-act="ouvrir" data-sheet="membre">Ajouter un premier membre</button></section>`}
      ${anniv.map(m => `<section class="carte"><p><b>Joyeux anniversaire ${esc(m.nom)} !</b></p></section>`).join('')}
      ${rappels.length ? `<section class="carte"><h2>À ne pas oublier</h2><ul class="liste">${rappels.map(([t, tag, cls, v]) => `<li><button class="rang" data-goto="${v}"><span class="rang-txt">${esc(t)}</span><span class="pill ${cls}">${esc(tag)}</span></button></li>`).join('')}</ul></section>` : ''}
      <section class="carte"><div class="carte-tete"><h2>Aujourd’hui</h2><button class="lien" data-goto="agenda">Agenda</button></div>
        ${evs.length ? `<ul class="liste">${evs.map(e => `<li class="rang"><span class="heure">${esc(e.heure || '—')}</span><span class="rang-txt">${esc(e.titre)}</span>${avatar(e.membre)}</li>`).join('')}</ul>`
          : `<p class="vide">Journée libre.<br><button class="btn sec" data-act="ouvrir" data-sheet="event">Ajouter un événement</button></p>`}
        ${prochains.length ? `<small>À venir : ${prochains.map(e => `${fmtDate(e.date)} · ${esc(e.titre)}`).join(' — ')}</small>` : ''}
      </section>
      <div class="tuiles">
        <button class="tuile" data-goto="courses"><span class="tuile-n">${aAcheter.length}</span><span>article${pl(aAcheter.length)} à acheter</span></button>
        <button class="tuile" data-goto="taches"><span class="tuile-n">${aFaire.length}</span><span>tâche${pl(aFaire.length)} à faire</span></button>
      </div>
      <button class="carte" data-goto="repas" style="text-align:left"><h2>Au menu aujourd’hui</h2>
        <p><span class="mut">Midi</span> · ${esc(repas.midi) || '<span class="mut">à définir</span>'}<br><span class="mut">Soir</span> · ${esc(repas.soir) || '<span class="mut">à définir</span>'}</p></button>
      ${pf ? `<button class="carte" data-goto="bourse" style="text-align:left"><h2>Portefeuille</h2><div class="bar"><b class="score">${eur(pf.total)}</b>${pillPl(pf.pl, pf.investi ? pf.pl / pf.investi * 100 : 0)}</div></button>` : ''}`;
  },

  courses() {
    const aAcheter = etat.courses.filter(c => !c.fait), panier = etat.courses.filter(c => c.fait);
    const dans = new Set(aAcheter.map(c => cle(c.nom)));
    const hab = Object.entries(etat.freq).filter(([k, v]) => v.n >= 2 && !dans.has(k)).sort((a, b) => b[1].n - a[1].n).slice(0, 8);
    const parRayon = RAYONS_ORDRE.map(r => [r, aAcheter.filter(c => (c.rayon || rayonDe(c.nom)) === r)]).filter(([, l]) => l.length);
    const ligne = c => `<li class="rang ${c.fait ? 'fait' : ''}"><label class="rang-main"><input type="checkbox" class="coche" data-act="course-fait" data-id="${c.id}"${c.fait ? ' checked' : ''}><span class="rang-txt">${esc(c.nom)}</span></label>
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
        ${liste.map(t => `<li class="rang ${t.fait ? 'fait' : ''}"><label class="rang-main"><input type="checkbox" class="coche" data-act="tache-fait" data-id="${t.id}"${t.fait ? ' checked' : ''}>
          <span class="rang-txt">${esc(t.titre)}<small>${[t.points ? `+${t.points} point${pl(t.points)}` : '', t.rec ? '↻ ' + REC_NOMS[t.rec].toLowerCase() : ''].filter(Boolean).join(' · ')}</small></span></label>${echeanceTag(t)}${avatar(t.membre)}
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
        <ul class="liste">${evs.map(e => `<li class="rang"><span class="heure">${esc(e.heure || '—')}</span><span class="rang-txt">${esc(e.titre)}${e.rec ? `<small>↻ ${REC_NOMS[e.rec].toLowerCase()}</small>` : ''}</span>${avatar(e.membre)}
          <button class="icone" data-act="event-del" data-id="${e.id}" aria-label="Supprimer ${esc(e.titre)}">${ico('x', 18)}</button></li>`).join('')
          || '<li class="vide">Aucun événement ce jour-là.</li>'}</ul></section>`;
  },

  repas() {
    const jours = Array.from({ length: 7 }, (_, i) => ajouteJours(semaineAff, i)), auj = aujourdhui();
    return `
      <div class="carte-tete"><button class="icone" data-act="semaine" data-n="-1" aria-label="Semaine précédente">‹</button>
        <b>${fmtDate(iso(semaineAff))} → ${fmtDate(iso(jours[6]))}</b>
        <button class="icone" data-act="semaine" data-n="1" aria-label="Semaine suivante">›</button></div>
      ${jours.map(d => { const k = iso(d), r = etat.repas[k] || {}; return `<div class="jr${k === auj ? ' auj' : ''}"><h3>${fmtLong(k)}${k === auj ? ' · aujourd’hui' : ''}</h3>
        ${fld('Midi', `<input data-repas="${k}" data-slot="midi" value="${esc(r.midi)}" placeholder="—">`)}
        ${fld('Soir', `<input data-repas="${k}" data-slot="soir" value="${esc(r.soir)}" placeholder="—">`)}</div>`; }).join('')}
      <button class="btn sec plein" data-act="repas-courses">Ajouter les plats de la semaine aux courses</button>`;
  },

  budget() {
    const [an, mo] = moisBudget.split('-').map(Number);
    const tx = etat.tx.filter(t => t.date.startsWith(moisBudget)).sort((a, b) => b.date.localeCompare(a.date));
    const bilan = ym => { const l = etat.tx.filter(t => t.date.startsWith(ym)); return [l.filter(t => t.montant > 0).reduce((s, t) => s + t.montant, 0), -l.filter(t => t.montant < 0).reduce((s, t) => s + t.montant, 0)]; };
    const [rev, dep] = bilan(moisBudget);
    const parCat = c => -tx.filter(t => t.cat === c && t.montant < 0).reduce((s, t) => s + t.montant, 0);
    const six = Array.from({ length: 6 }, (_, i) => { const d = new Date(an, mo - 1 - (5 - i), 1), ym = iso(d).slice(0, 7), [r, p] = bilan(ym); return { label: `${MOIS[d.getMonth()]} ${d.getFullYear()}`, court: MOIS[d.getMonth()].slice(0, 3), v: [r, p] }; });
    const pfS = etat.pf.length && typeof pfCalc === 'function' ? pfCalc() : null;
    const bourse = (pfS ? pfS.total : 0) + (typeof cfg === 'function' ? cfg().liquidites || 0 : 0);
    const epargne = somme(etat.objectifs, o => o.actuel || 0);
    return `
      <div class="carte-tete"><button class="icone" data-act="mois-budget" data-n="-1" aria-label="Mois précédent">‹</button><b class="cap">${MOIS[mo - 1]} ${an}</b><button class="icone" data-act="mois-budget" data-n="1" aria-label="Mois suivant">›</button></div>
      <section class="hero"><p class="hero-lbl">Solde du mois</p><p class="hero-val">${eur(rev - dep)}</p>
        <p class="hero-sub">Revenus ${eur(rev)} · Dépenses ${eur(dep)}</p></section>
      <section class="carte"><h2>Six derniers mois</h2>${grapheBarres('budget6', six, [{ nom: 'Revenus', c: '--c1' }, { nom: 'Dépenses', c: '--c2' }], 'Revenus et dépenses par mois')}</section>
      ${bourse + epargne > 0 ? `<section class="carte"><h2>Patrimoine suivi</h2>
        <div class="kv"><span>Bourse (titres et liquidités)</span><b>${eur(bourse)}</b></div>
        <div class="kv"><span>Épargne (objectifs)</span><b>${eur(epargne)}</b></div>
        <div class="kv"><span>Total</span><b class="score">${eur(bourse + epargne)}</b></div></section>` : ''}
      <section class="carte"><div class="carte-tete"><h2>Objectifs d’épargne</h2><button class="lien" data-act="ouvrir" data-sheet="objectif">Ajouter</button></div>
        ${etat.objectifs.map(o => {
          const reste = Math.max(0, o.cible - (o.actuel || 0)), pcOk = o.cible ? Math.min(100, (o.actuel || 0) / o.cible * 100) : 0;
          let mens = '';
          if (reste > 0 && o.date) { const n = Math.max(1, (parse(o.date).getFullYear() - new Date().getFullYear()) * 12 + parse(o.date).getMonth() - new Date().getMonth()); mens = ` · ${eur(reste / n)} par mois jusqu’en ${MOIS[parse(o.date).getMonth()]} ${parse(o.date).getFullYear()}`; }
          return `<div><div class="bar"><b>${esc(o.nom)}</b><span class="num">${eur(o.actuel || 0)} / ${eur(o.cible)}</span></div>
            <div class="jauge"><i style="width:${pcOk}%;background:var(--ok)"></i></div>
            <small>${reste > 0 ? `Il reste ${eur(reste)}${mens}` : 'Objectif atteint'}</small>
            <div class="rangee"><button class="btn sec" data-act="obj-versement" data-id="${o.id}">Ajouter un versement</button><button class="btn del" data-act="obj-del" data-id="${o.id}" aria-label="Supprimer ${esc(o.nom)}">Supprimer</button></div></div>`; }).join('')
          || '<p class="vide">Aucun objectif. Fixez un montant à atteindre (vacances, travaux…).</p>'}</section>
      <section class="carte"><h2>Par catégorie</h2>
        ${NOMS_CATS.filter(c => c !== 'Revenus').map(c => { const v = parCat(c), p = etat.plafonds[c] || 0, pc = p ? Math.min(100, v / p * 100) : 0;
          return `<div><div class="bar"><span>${c}</span><span class="num">${eur(v)}</span></div>
          ${p ? `<div class="jauge"><i style="width:${pc}%;background:${v > p ? 'var(--bad)' : 'var(--ok)'}"></i></div>` : ''}
          <div class="bar"><small>Plafond mensuel</small><input type="number" min="0" step="10" class="plaf" data-plafond="${c}" value="${p || ''}" placeholder="€" aria-label="Plafond ${c}"></div></div>`; }).join('')}</section>
      <section class="carte"><h2>Opérations</h2><ul class="liste">
        ${tx.map(t => `<li class="rang"><span class="rang-txt">${esc(t.libelle)}<small>${fmtDate(t.date)} · ${esc(t.cat)}${t.rec ? ' · récurrente' : ''}</small></span>
          <b class="num" style="color:var(--${t.montant < 0 ? 'bad' : 'ok'})">${eur(t.montant)}</b>
          <button class="icone" data-act="tx-del" data-id="${t.id}" aria-label="Supprimer ${esc(t.libelle)}">${ico('x', 18)}</button></li>`).join('') || '<li class="vide">Aucune opération ce mois-ci.</li>'}</ul></section>
      <section class="carte"><div class="carte-tete"><h2>Opérations récurrentes</h2><button class="lien" data-act="ouvrir" data-sheet="recurrent">Ajouter</button></div>
        <ul class="liste">${etat.recurrents.map(r => `<li class="rang"><span class="rang-txt">${esc(r.libelle)}<small>Le ${r.jour} de chaque mois · ${esc(r.cat)}</small></span>
          <b class="num" style="color:var(--${r.montant < 0 ? 'bad' : 'ok'})">${eur(r.montant)}</b>
          <button class="icone" data-act="rec-del" data-id="${r.id}" aria-label="Supprimer ${esc(r.libelle)}">${ico('x', 18)}</button></li>`).join('') || '<li class="vide">Loyer, salaire, abonnements : ajoutez-les une fois, ils s’inscrivent chaque mois.</li>'}</ul></section>
      <section class="carte"><h2>Importer un relevé bancaire (CSV)</h2>
        <p class="mut">Téléchargez le relevé CSV depuis le site de votre banque (date, libellé, montant ou débit/crédit). Catégories devinées, doublons ignorés.</p>
        <label class="btn sec">Choisir un fichier CSV<input type="file" id="importCsv" accept=".csv,text/csv,text/plain" hidden></label></section>`;
  },

  famille() {
    return `
      <section class="carte"><h2>Membres</h2><ul class="liste">
        ${etat.membres.map(m => `<li class="rang">${avatar(m.id, true)}<span class="rang-txt"><b>${esc(m.nom)}</b>${m.naissance ? `<small>Né(e) le ${fmtDate(m.naissance)}</small>` : ''}</span>
          <button class="icone" data-act="membre-del" data-id="${m.id}" aria-label="Supprimer ${esc(m.nom)}">${ico('x', 18)}</button></li>`).join('')
          || `<li class="vide">Ajoutez les membres de la famille.<br><button class="btn sec" data-act="ouvrir" data-sheet="membre">Ajouter un membre</button></li>`}</ul></section>
      <section class="carte"><h2>Sauvegarde</h2>
        <p class="mut">Les données restent sur cet appareil. Exportez-les pour les conserver ou les copier sur un autre appareil.</p>
        <div class="rangee"><button class="btn" data-act="export">Exporter</button><button class="btn sec" data-act="import-coller">Importer (coller)</button></div>
        <label class="btn sec">Importer un fichier<input type="file" id="import" accept="application/json" hidden></label></section>`;
  },
};

// ---------- Feuilles de saisie (bottom sheets) ----------
const SHEETS = {
  tache: () => ({ titre: 'Nouvelle tâche', corps: `<form class="formulaire" data-form="tache">
    ${fld('Tâche', '<input name="titre" required autocomplete="off" placeholder="Sortir les poubelles">')}
    <div class="duo">${fld('Pour', `<select name="membre">${optionsMembres(etat.actif, 'Tout le monde')}</select>`)}
    ${fld('Points', '<input type="number" name="points" min="0" max="100" value="1" inputmode="numeric">')}</div>
    <div class="duo">${fld('Échéance (facultatif)', '<input type="date" name="echeance">')}${fld('Répéter', `<select name="rec"><option value="">Jamais</option>${Object.entries(REC_NOMS).map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select>`)}</div>
    <button class="btn plein">Ajouter la tâche</button></form>` }),
  event: () => ({ titre: 'Nouvel événement', corps: `<form class="formulaire" data-form="event">
    ${fld('Titre', '<input name="titre" required autocomplete="off" placeholder="Rendez-vous dentiste">')}
    <div class="duo">${fld('Date', `<input type="date" name="date" value="${jourSel}" required>`)}${fld('Heure', '<input type="time" name="heure">')}</div>
    <div class="duo">${fld('Pour', `<select name="membre">${optionsMembres('', 'Toute la famille')}</select>`)}
    ${fld('Répéter', `<select name="rec"><option value="">Jamais</option>${Object.entries(REC_NOMS).map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select>`)}</div>
    <button class="btn plein">Ajouter l’événement</button></form>` }),
  membre: () => ({ titre: 'Nouveau membre', corps: `<form class="formulaire" data-form="membre">
    ${fld('Prénom', '<input name="nom" required autocomplete="off">')}
    ${fld('Date de naissance (facultatif)', '<input type="date" name="naissance">')}
    <button class="btn plein">Ajouter</button></form>` }),
  tx: () => ({ titre: 'Nouvelle opération', corps: `<form class="formulaire" data-form="tx">
    <div class="choix" role="radiogroup" aria-label="Type"><label><input type="radio" name="type" value="-1" checked>Dépense</label><label><input type="radio" name="type" value="1">Revenu</label></div>
    ${fld('Libellé', '<input name="libelle" required autocomplete="off">')}
    <div class="duo">${fld('Montant (€)', '<input type="number" name="montant" step="0.01" min="0" required inputmode="decimal">')}
    ${fld('Date', `<input type="date" name="date" value="${moisBudget === aujourdhui().slice(0, 7) ? aujourdhui() : moisBudget + '-01'}" required>`)}</div>
    ${fld('Catégorie', `<select name="cat"><option value="">Automatique</option>${NOMS_CATS.filter(c => c !== 'Revenus').map(c => `<option>${c}</option>`).join('')}</select>`)}
    <button class="btn plein">Ajouter</button></form>` }),
};
SHEETS.recurrent = () => ({ titre: 'Opération récurrente', corps: `<form class="formulaire" data-form="recurrent">
  <div class="choix" role="radiogroup" aria-label="Type"><label><input type="radio" name="type" value="-1" checked>Dépense</label><label><input type="radio" name="type" value="1">Revenu</label></div>
  ${fld('Libellé', '<input name="libelle" required autocomplete="off" placeholder="Loyer">')}
  <div class="duo">${fld('Montant (€)', '<input type="number" name="montant" step="0.01" min="0" required inputmode="decimal">')}${fld('Jour du mois (1-28)', '<input type="number" name="jour" min="1" max="28" value="1" required inputmode="numeric">')}</div>
  ${fld('Catégorie', `<select name="cat"><option value="">Automatique</option>${NOMS_CATS.filter(c => c !== 'Revenus').map(c => `<option>${c}</option>`).join('')}</select>`)}
  <button class="btn plein">Ajouter</button></form>` });
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
  etat.membres.filter(x => m(x.nom)).forEach(x => add('Famille', x.nom, 'Membre', { vue: 'famille' }));
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
const UNDO = new Set(['course-del', 'course-vider', 'tache-del', 'event-del', 'tx-del', 'membre-del', 'pf-del', 'rec-del', 'obj-del', 'div-del', 'pret-del']);
const ACTIONS = {
  'ouvrir': el => { ouvrirFeuille(el.dataset.sheet, el.dataset); return 'vue'; },
  'filtre': el => { filtreT = el.dataset.v; return 'vue'; },
  'course-fait': el => { const c = etat.courses.find(x => x.id === el.dataset.id); c.fait = el.checked; },
  'course-hab': el => { const v = etat.freq[el.dataset.k]; if (v) ajouterCourse(v.nom, 1); },
  'res': el => {
    const r = RESULTATS[Number(el.dataset.i)];
    if (!r) return 'vue';
    if (r.date) { jourSel = r.date; moisAff = new Date(parse(r.date).getFullYear(), parse(r.date).getMonth(), 1); semaineAff = lundi(parse(r.date)); }
    if (r.mois) moisBudget = r.mois;
    if (r.onglet) bTab = r.onglet;
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
  course: f => { const [nom, qte] = parseCourse(f.nom.value); if (nom && ajouterCourse(nom, qte) === 'maj') info('Quantité mise à jour.'); },
  tache: f => etat.taches.push({ id: uid(), titre: f.titre.value.trim(), membre: f.membre.value, points: Number(f.points.value) || 0, echeance: f.echeance.value, rec: f.rec.value, fait: false, par: null }),
  event: f => { etat.events.push({ id: uid(), titre: f.titre.value.trim(), date: f.date.value, heure: f.heure.value, membre: f.membre.value, rec: f.rec.value }); jourSel = f.date.value; moisAff = new Date(parse(jourSel).getFullYear(), parse(jourSel).getMonth(), 1); },
  tx: f => {
    const m = Math.abs(Number(f.montant.value)) * Number(f.type.value);
    etat.tx.push({ id: uid(), date: f.date.value, libelle: f.libelle.value.trim(), montant: m, cat: m > 0 ? 'Revenus' : (f.cat.value || devine(f.libelle.value)) });
  },
  recurrent: f => { etat.recurrents.push({ id: uid(), libelle: f.libelle.value.trim(), montant: Math.abs(Number(f.montant.value)) * Number(f.type.value), jour: Number(f.jour.value) || 1, cat: Number(f.type.value) > 0 ? 'Revenus' : (f.cat.value || devine(f.libelle.value)), dernier: '' }); appliquerRecurrents(); },
  objectif: f => etat.objectifs.push({ id: uid(), nom: f.nom.value.trim(), cible: Number(f.cible.value), actuel: Number(f.actuel.value) || 0, date: f.date.value }),
  membre: f => {
    const m = { id: uid(), nom: f.nom.value.trim(), couleur: COULEURS[etat.membres.length % COULEURS.length], naissance: f.naissance.value };
    etat.membres.push(m);
    if (!etat.actif) etat.actif = m.id;
  },
};

// ---------- Opérations récurrentes (générées à l'ouverture et à la création) ----------
const moisSuivant = ym => { const [y, m] = ym.split('-').map(Number); return iso(new Date(y, m, 1)).slice(0, 7); };
function appliquerRecurrents() {
  const auj = aujourdhui(), cur = auj.slice(0, 7);
  let change = false;
  etat.recurrents.forEach(r => {
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
  if (t.id === 'membreActif') { etat.actif = t.value || null; sauver(); rendre(); }
  else if (t.dataset.act && t.type === 'checkbox') executer(t);
  else if (t.dataset.repas) {
    const k = t.dataset.repas;
    etat.repas[k] = { ...etat.repas[k], [t.dataset.slot]: t.value.trim() };
    sauver();
  } else if (t.dataset.plafond) { etat.plafonds[t.dataset.plafond] = Number(t.value) || 0; sauver(); rendre(); }
  else if (t.dataset.pfcfg) changePf(t);
  else if (t.dataset.pretcfg) changePret(t);
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
        : fld(esc(c.label), `<input id="dlg${i}" name="${c.nom}" type="${c.type || 'number'}" ${c.type ? '' : 'step="any" inputmode="decimal"'} value="${esc(c.valeur ?? '')}" required>`)).join('')}
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


appliquerRecurrents();
rendre();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
