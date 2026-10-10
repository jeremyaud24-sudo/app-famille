'use strict';

const CLE = 'app-famille-v1';
const COULEURS = ['#0b6b5b', '#c2417c', '#b45309', '#2563eb', '#7c3aed', '#be123c', '#0e7490'];
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// ---------- Données ----------
const defaut = () => ({ membres: [], actif: null, courses: [], taches: [], events: [], repas: {}, tx: [], plafonds: {}, pf: [], pfCfg: {} });
let etat = charger();

function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? { ...defaut(), ...JSON.parse(brut) } : defaut();
  } catch { return defaut(); }
}
function sauver() {
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

// ---------- Icônes ----------
const ICONES = {
  accueil: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  agenda: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  listes: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.3 1.3L7 5M3.5 12l1.3 1.3L7 11M3.5 18l1.3 1.3L7 17"/>',
  argent: '<path d="M4 19V5M4 19h16"/><path d="M8 15l4-4 3 3 5-6"/>',
  famille: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15.5 14.2c3 0 5.5 2 5.5 5.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const ico = (n, t = 22) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n]}</svg>`;

// ---------- Navigation ----------
const SECTIONS = {
  accueil: { titre: 'Accueil', vues: ['accueil'] },
  agenda: { titre: 'Agenda', vues: ['agenda'] },
  listes: { titre: 'Listes', vues: ['courses', 'taches', 'repas'], noms: { courses: 'Courses', taches: 'Tâches', repas: 'Repas' } },
  argent: { titre: 'Argent', vues: ['bourse', 'budget'], noms: { bourse: 'Bourse', budget: 'Budget' } },
  famille: { titre: 'Famille', vues: ['famille'] },
};
const NOMS_ONGLETS = { accueil: 'Accueil', agenda: 'Agenda', listes: 'Listes', argent: 'Argent', famille: 'Famille' };
const AJOUT = { // bouton « + » flottant par vue
  taches: ['tache', 'Tâche'], agenda: ['event', 'Événement'], bourse: ['pos', 'Ligne'], budget: ['tx', 'Opération'], famille: ['membre', 'Membre'],
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
    const auj = aujourdhui();
    const evs = etat.events.filter(e => e.date === auj).sort((a, b) => (a.heure || '').localeCompare(b.heure || ''));
    const aFaire = etat.taches.filter(t => !t.fait), aAcheter = etat.courses.filter(c => !c.fait);
    const repas = etat.repas[auj] || {};
    const prochains = etat.events.filter(e => e.date > auj).sort((a, b) => (a.date + (a.heure || '')).localeCompare(b.date + (b.heure || ''))).slice(0, 3);
    const anniv = etat.membres.filter(m => m.naissance && m.naissance.slice(5) === auj.slice(5));
    const pf = etat.pf.length && typeof pfCalc === 'function' ? pfCalc() : null;
    return `
      ${etat.membres.length ? '' : `<section class="carte"><h2>Bienvenue</h2><p class="mut">Créez votre foyer pour partager courses, tâches et agenda. Chaque membre a sa couleur.</p><button class="btn" data-act="ouvrir" data-sheet="membre">Ajouter un premier membre</button></section>`}
      ${anniv.map(m => `<section class="carte"><p><b>Joyeux anniversaire ${esc(m.nom)} !</b></p></section>`).join('')}
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
    const ligne = c => `<li class="rang ${c.fait ? 'fait' : ''}"><label class="rang-main"><input type="checkbox" class="coche" data-act="course-fait" data-id="${c.id}"${c.fait ? ' checked' : ''}><span class="rang-txt">${esc(c.nom)}</span></label>
      <button class="icone" data-act="course-del" data-id="${c.id}" aria-label="Supprimer ${esc(c.nom)}">${ico('x', 18)}</button></li>`;
    return `
      <form class="ajout" data-form="course"><input type="text" name="nom" placeholder="Ajouter un article" aria-label="Nouvel article" required autocomplete="off" enterkeyhint="done"><button class="btn" aria-label="Ajouter">${ico('plus', 20)}</button></form>
      <section class="carte"><div class="carte-tete"><h2>À acheter</h2><span class="pill pri">${aAcheter.length}</span></div>
        <ul class="liste">${aAcheter.map(ligne).join('') || '<li class="vide">Rien à acheter. Ajoutez un article ci-dessus.</li>'}</ul></section>
      ${panier.length ? `<section class="carte"><div class="carte-tete"><h2>Dans le panier</h2><button class="lien" data-act="course-vider">Vider</button></div>
        <ul class="liste">${panier.map(ligne).join('')}</ul></section>` : ''}`;
  },

  taches() {
    const scores = etat.membres.map(m => ({ m, pts: etat.taches.filter(t => t.fait && t.par === m.id).reduce((s, t) => s + (t.points || 0), 0) })).sort((a, b) => b.pts - a.pts);
    const liste = etat.taches.filter(t => !filtreT || t.membre === filtreT || (!t.membre && filtreT === '*')).sort((a, b) => a.fait - b.fait);
    return `
      ${etat.membres.length ? `<div class="chips" role="group" aria-label="Filtrer par personne">
        <button data-act="filtre" data-v="" aria-pressed="${!filtreT}">Tout le monde</button>
        ${etat.membres.map(m => `<button data-act="filtre" data-v="${m.id}" aria-pressed="${filtreT === m.id}">${esc(m.nom)}</button>`).join('')}</div>` : ''}
      <section class="carte"><ul class="liste">
        ${liste.map(t => `<li class="rang ${t.fait ? 'fait' : ''}"><label class="rang-main"><input type="checkbox" class="coche" data-act="tache-fait" data-id="${t.id}"${t.fait ? ' checked' : ''}>
          <span class="rang-txt">${esc(t.titre)}${t.points ? `<small>+${t.points} point${pl(t.points)}</small>` : ''}</span></label>${avatar(t.membre)}
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
      const d = `${an}-${pad(mo + 1)}-${pad(j)}`, evs = etat.events.filter(e => e.date === d);
      cases.push(`<button class="jour${d === jourSel ? ' sel' : ''}${d === aujourdhui() ? ' auj' : ''}" data-act="jour" data-date="${d}" aria-label="${fmtDate(d)}${evs.length ? ', ' + evs.length + ' événement' + pl(evs.length) : ''}" aria-pressed="${d === jourSel}">${j}
        <span class="pts">${evs.slice(0, 3).map(e => `<b style="background:${membre(e.membre)?.couleur || 'var(--pri)'}"></b>`).join('')}</span></button>`);
    }
    const evs = etat.events.filter(e => e.date === jourSel).sort((a, b) => (a.heure || '').localeCompare(b.heure || ''));
    return `
      <section class="carte">
        <div class="carte-tete"><button class="icone" data-act="mois" data-n="-1" aria-label="Mois précédent">‹</button><h2 class="cap">${MOIS[mo]} ${an}</h2><button class="icone" data-act="mois" data-n="1" aria-label="Mois suivant">›</button></div>
        <div class="mois">${JOURS.map(j => `<div class="h">${j}</div>`).join('')}${cases.join('')}</div>
        <button class="lien" data-act="aujourdhui" style="align-self:center">Revenir à aujourd’hui</button>
      </section>
      <section class="carte"><h2 class="cap">${fmtLong(jourSel)}</h2>
        <ul class="liste">${evs.map(e => `<li class="rang"><span class="heure">${esc(e.heure || '—')}</span><span class="rang-txt">${esc(e.titre)}</span>${avatar(e.membre)}
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
    const rev = tx.filter(t => t.montant > 0).reduce((s, t) => s + t.montant, 0);
    const dep = -tx.filter(t => t.montant < 0).reduce((s, t) => s + t.montant, 0);
    const parCat = c => -tx.filter(t => t.cat === c && t.montant < 0).reduce((s, t) => s + t.montant, 0);
    return `
      <div class="carte-tete"><button class="icone" data-act="mois-budget" data-n="-1" aria-label="Mois précédent">‹</button><b class="cap">${MOIS[mo - 1]} ${an}</b><button class="icone" data-act="mois-budget" data-n="1" aria-label="Mois suivant">›</button></div>
      <section class="hero"><p class="hero-lbl">Solde du mois</p><p class="hero-val">${eur(rev - dep)}</p>
        <p class="hero-sub">Revenus ${eur(rev)} · Dépenses ${eur(dep)}</p></section>
      <section class="carte"><h2>Par catégorie</h2>
        ${NOMS_CATS.filter(c => c !== 'Revenus').map(c => { const v = parCat(c), p = etat.plafonds[c] || 0, pc = p ? Math.min(100, v / p * 100) : 0;
          return `<div><div class="bar"><span>${c}</span><span class="num">${eur(v)}</span></div>
          ${p ? `<div class="jauge"><i style="width:${pc}%;background:${v > p ? 'var(--bad)' : 'var(--ok)'}"></i></div>` : ''}
          <div class="bar"><small>Plafond mensuel</small><input type="number" min="0" step="10" class="plaf" data-plafond="${c}" value="${p || ''}" placeholder="€" aria-label="Plafond ${c}"></div></div>`; }).join('')}</section>
      <section class="carte"><h2>Opérations</h2><ul class="liste">
        ${tx.map(t => `<li class="rang"><span class="rang-txt">${esc(t.libelle)}<small>${fmtDate(t.date)} · ${esc(t.cat)}</small></span>
          <b class="num" style="color:var(--${t.montant < 0 ? 'bad' : 'ok'})">${eur(t.montant)}</b>
          <button class="icone" data-act="tx-del" data-id="${t.id}" aria-label="Supprimer ${esc(t.libelle)}">${ico('x', 18)}</button></li>`).join('') || '<li class="vide">Aucune opération ce mois-ci.</li>'}</ul></section>
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
    <button class="btn plein">Ajouter la tâche</button></form>` }),
  event: () => ({ titre: 'Nouvel événement', corps: `<form class="formulaire" data-form="event">
    ${fld('Titre', '<input name="titre" required autocomplete="off" placeholder="Rendez-vous dentiste">')}
    <div class="duo">${fld('Date', `<input type="date" name="date" value="${jourSel}" required>`)}${fld('Heure', '<input type="time" name="heure">')}</div>
    ${fld('Pour', `<select name="membre">${optionsMembres('', 'Toute la famille')}</select>`)}
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
    ${fld('Catégorie', `<select name="cat">${NOMS_CATS.filter(c => c !== 'Revenus').map(c => `<option>${c}</option>`).join('')}</select>`)}
    <button class="btn plein">Ajouter</button></form>` }),
};
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
const UNDO = new Set(['course-del', 'course-vider', 'tache-del', 'event-del', 'tx-del', 'membre-del', 'pf-del']);
const ACTIONS = {
  'ouvrir': el => { ouvrirFeuille(el.dataset.sheet, el.dataset); return 'vue'; },
  'filtre': el => { filtreT = el.dataset.v; return 'vue'; },
  'course-fait': el => { const c = etat.courses.find(x => x.id === el.dataset.id); c.fait = el.checked; },
  'course-del': el => { etat.courses = etat.courses.filter(x => x.id !== el.dataset.id); },
  'course-vider': () => { etat.courses = etat.courses.filter(c => !c.fait); },
  'tache-fait': el => {
    const t = etat.taches.find(x => x.id === el.dataset.id);
    t.fait = el.checked;
    t.par = el.checked ? (etat.actif || t.membre || null) : null;
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
        if (nom && !noms.has(nom.toLowerCase())) { etat.courses.push({ id: uid(), nom, fait: false }); noms.add(nom.toLowerCase()); n++; }
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
  course: f => etat.courses.unshift({ id: uid(), nom: f.nom.value.trim(), fait: false }),
  tache: f => etat.taches.push({ id: uid(), titre: f.titre.value.trim(), membre: f.membre.value, points: Number(f.points.value) || 0, fait: false, par: null }),
  event: f => { etat.events.push({ id: uid(), titre: f.titre.value.trim(), date: f.date.value, heure: f.heure.value, membre: f.membre.value }); jourSel = f.date.value; moisAff = new Date(parse(jourSel).getFullYear(), parse(jourSel).getMonth(), 1); },
  tx: f => {
    const m = Math.abs(Number(f.montant.value)) * Number(f.type.value);
    etat.tx.push({ id: uid(), date: f.date.value, libelle: f.libelle.value.trim(), montant: m, cat: m > 0 ? 'Revenus' : f.cat.value });
  },
  membre: f => {
    const m = { id: uid(), nom: f.nom.value.trim(), couleur: COULEURS[etat.membres.length % COULEURS.length], naissance: f.naissance.value };
    etat.membres.push(m);
    if (!etat.actif) etat.actif = m.id;
  },
};

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
  else if (t.id === 'importCsv') importerCsv(t.files[0]);
  else if (t.id === 'import') importer(t.files[0]);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.modal:not(:has(form.boite))')) fermerFeuille(); });
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
        : fld(esc(c.label), `<input id="dlg${i}" name="${c.nom}" type="number" step="any" inputmode="decimal" value="${esc(c.valeur ?? '')}" required>`)).join('')}
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


rendre();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
