'use strict';
// Recettes, carnet de famille, voyages et cadeaux.

const val = (o, k, d = '') => (o && o[k] != null ? o[k] : d);
const optSel = (liste, sel) => liste.map(([k, n]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(n)}</option>`).join('');
const jourTag = (date, limite = 30) => {
  if (!date) return '';
  const d = diffJours(aujourdhui(), date);
  return d < 0 ? '<span class="pill bad">Dépassé</span>' : d <= limite ? `<span class="pill warn">${d === 0 ? 'Aujourd’hui' : d === 1 ? 'Demain' : 'Dans ' + d + ' j'}</span>` : `<small>${fmtDate(date)}</small>`;
};

// ---------- Recettes ----------
let recF = 'tous';
VUES.recettes = function () {
  const l = etat.recettes.filter(r => recF === 'tous' || r.fav).sort((a, b) => a.nom.localeCompare(b.nom));
  return `<div class="chips" role="group" aria-label="Filtrer les recettes">
      <button data-act="rec-filtre" data-v="tous" aria-pressed="${recF === 'tous'}">Toutes</button><button data-act="rec-filtre" data-v="fav" aria-pressed="${recF === 'fav'}">Favorites</button></div>
    <section class="carte"><ul class="liste">${l.map(r => `<li><button class="rang" data-act="ouvrir" data-sheet="recette" data-id="${r.id}"><span class="rang-txt"><b>${esc(r.nom)}</b><small>${r.portions} portion${pl(r.portions)} · ${r.ingredients.length} ingrédient${pl(r.ingredients.length)}</small></span>${r.fav ? '<span class="pill pri">Favorite</span>' : ''}</button></li>`).join('')
      || `<li class="vide">${etat.recettes.length ? 'Aucune recette favorite.' : 'Gardez vos recettes ici : leurs ingrédients partent en un geste dans la liste de courses et chaque plat peut être planifié.'}<br><button class="btn sec" data-act="ouvrir" data-sheet="recette-form">Ajouter une recette</button></li>`}</ul></section>`;
};
SHEETS['recette-form'] = d => {
  const r = d.id ? etat.recettes.find(x => x.id === d.id) : null;
  return { titre: r ? 'Modifier la recette' : 'Nouvelle recette', corps: `<form class="formulaire" data-form="recette-form"><input type="hidden" name="id" value="${r ? r.id : ''}">
    <div class="duo">${fld('Nom', `<input name="nom" required autocomplete="off" value="${esc(val(r, 'nom'))}">`)}${fld('Portions', `<input type="number" name="portions" min="1" step="1" value="${val(r, 'portions', 4)}" inputmode="numeric">`)}</div>
    ${fld('Ingrédients (un par ligne)', `<textarea name="ingredients" rows="6" placeholder="400 g de pâtes&#10;2 tomates&#10;1 oignon">${esc((r ? r.ingredients : []).join('\n'))}</textarea>`)}
    ${fld('Préparation (facultatif)', `<textarea name="etapes" rows="4">${esc(val(r, 'etapes'))}</textarea>`)}
    <button class="btn plein">Enregistrer</button></form>` };
};
SHEETS.recette = d => {
  const r = etat.recettes.find(x => x.id === d.id);
  if (!r) return { titre: 'Recette', corps: '<p>Recette introuvable.</p>' };
  return { titre: r.nom, corps: `<p class="mut">${r.portions} portion${pl(r.portions)}</p>
    <ul class="liste">${r.ingredients.map(i => `<li class="rang" style="min-height:40px"><span class="rang-txt">${esc(i)}</span></li>`).join('') || '<li class="vide">Aucun ingrédient.</li>'}</ul>
    ${r.etapes ? `<p style="white-space:pre-line">${esc(r.etapes)}</p>` : ''}
    <div class="rangee"><button class="btn" data-act="recette-courses" data-id="${r.id}">Ajouter aux courses</button><button class="btn sec" data-act="ouvrir" data-sheet="planifier" data-id="${r.id}">Planifier un repas</button></div>
    <div class="rangee"><button class="btn sec" data-act="recette-fav" data-id="${r.id}">${r.fav ? 'Retirer des favorites' : 'Mettre en favorite'}</button><button class="btn sec" data-act="ouvrir" data-sheet="recette-form" data-id="${r.id}">Modifier</button><button class="btn danger" data-act="recette-del" data-id="${r.id}">Supprimer</button></div>` };
};
SHEETS.planifier = d => {
  const r = etat.recettes.find(x => x.id === d.id);
  return { titre: 'Planifier ' + (r ? r.nom : ''), corps: `<form class="formulaire" data-form="planifier"><input type="hidden" name="id" value="${d.id}">
    <div class="duo">${fld('Date', `<input type="date" name="date" value="${aujourdhui()}" required>`)}${fld('Repas', '<select name="slot"><option value="midi">Midi</option><option value="soir" selected>Soir</option></select>')}</div>
    <button class="btn plein">Ajouter au planning des repas</button></form>` };
};
FORMS['recette-form'] = f => {
  const o = { nom: f.nom.value.trim(), portions: Number(f.portions.value) || 1, ingredients: f.ingredients.value.split('\n').map(x => x.trim()).filter(Boolean), etapes: f.etapes.value.trim() };
  const i = etat.recettes.findIndex(x => x.id === f.id.value);
  if (i >= 0) Object.assign(etat.recettes[i], o); else etat.recettes.push({ id: uid(), fav: false, ...o });
};
FORMS.planifier = f => {
  const r = etat.recettes.find(x => x.id === f.id.value);
  if (!r) return;
  etat.repas[f.date.value] = { ...etat.repas[f.date.value], [f.slot.value]: r.nom };
  semaineAff = lundi(parse(f.date.value));
  aller('repas');
  info(`« ${r.nom} » ajoutée au ${fmtDate(f.date.value)}.`);
};
ACTIONS['rec-filtre'] = el => { recF = el.dataset.v; return 'vue'; };
ACTIONS['recette-fav'] = el => { const r = etat.recettes.find(x => x.id === el.dataset.id); r.fav = !r.fav; ouvrirFeuille('recette', { id: r.id }); };
ACTIONS['recette-del'] = el => { etat.recettes = etat.recettes.filter(x => x.id !== el.dataset.id); };
ACTIONS['recette-courses'] = el => {
  const r = etat.recettes.find(x => x.id === el.dataset.id);
  r.ingredients.forEach(i => ajouterCourse(i, 1));
  fermerFeuille();
  info(`${r.ingredients.length} ingrédient${pl(r.ingredients.length)} ajouté${pl(r.ingredients.length)} aux courses.`);
};
// Les plats de la semaine qui correspondent à une recette ajoutent ses ingrédients, sinon le plat lui-même
ACTIONS['repas-courses'] = () => {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const r = etat.repas[iso(ajouteJours(semaineAff, i))] || {};
    [r.midi, r.soir].filter(Boolean).forEach(p => {
      const rec = etat.recettes.find(x => cle(x.nom) === cle(p));
      (rec ? rec.ingredients : [p.trim()]).forEach(nom => { if (nom && !etat.courses.some(c => !c.fait && cle(c.nom) === cle(nom))) { ajouterCourse(nom, 1); n++; } });
    });
  }
  info(n ? `${n} élément${pl(n)} ajouté${pl(n)} aux courses.` : 'Rien à ajouter.');
};

// ---------- Carnet de famille ----------
const CARNET_TYPES = [['contact', 'Contact'], ['sante', 'Santé'], ['garantie', 'Garantie ou contrat'], ['document', 'Document'], ['autre', 'Autre']];
const nomType = k => (CARNET_TYPES.find(t => t[0] === k) || [0, 'Autre'])[1];
let carF = '';
VUES.carnet = function () {
  const l = etat.carnet.filter(e => !carF || e.type === carF).sort((a, b) => (a.date || '9').localeCompare(b.date || '9') || a.titre.localeCompare(b.titre));
  return `<div class="chips" role="group" aria-label="Filtrer le carnet"><button data-act="car-filtre" data-v="" aria-pressed="${!carF}">Tout</button>${CARNET_TYPES.map(([k, n]) => `<button data-act="car-filtre" data-v="${k}" aria-pressed="${carF === k}">${n}</button>`).join('')}</div>
    <section class="carte"><ul class="liste">${l.map(e => `<li><button class="rang" data-act="ouvrir" data-sheet="carnet" data-id="${e.id}"><span class="rang-txt"><b>${esc(e.titre)}</b><small>${esc(nomType(e.type))}${e.tel ? ' · ' + esc(e.tel) : ''}${e.detail ? ' · ' + esc(e.detail.slice(0, 60)) : ''}</small></span>${jourTag(e.date)}${avatar(e.membre)}</button></li>`).join('')
      || `<li class="vide">Contacts utiles (école, médecin, plombier), vaccins, garanties, contrats : tout au même endroit, avec un rappel avant la date importante.<br><button class="btn sec" data-act="ouvrir" data-sheet="carnet">Ajouter une fiche</button></li>`}</ul></section>`;
};
SHEETS.carnet = d => {
  const e = d.id ? etat.carnet.find(x => x.id === d.id) : null;
  return { titre: e ? 'Modifier la fiche' : 'Nouvelle fiche', corps: `<form class="formulaire" data-form="carnet"><input type="hidden" name="id" value="${e ? e.id : ''}">
    <div class="duo">${fld('Type', `<select name="type">${optSel(CARNET_TYPES, val(e, 'type', 'contact'))}</select>`)}${fld('Pour', `<select name="membre">${optionsMembres(val(e, 'membre'), 'Toute la famille')}</select>`)}</div>
    ${fld('Titre', `<input name="titre" required autocomplete="off" value="${esc(val(e, 'titre'))}" placeholder="Dr Martin, pédiatre">`)}
    ${fld('Téléphone (facultatif)', `<input name="tel" inputmode="tel" value="${esc(val(e, 'tel'))}">`)}
    ${fld('Détails', `<textarea name="detail" rows="3">${esc(val(e, 'detail'))}</textarea>`)}
    ${fld('Date importante (échéance, rappel de vaccin…)', `<input type="date" name="date" value="${esc(val(e, 'date'))}">`)}
    <button class="btn plein">Enregistrer</button>
    ${e ? `<button type="button" class="btn danger plein" data-act="carnet-del" data-id="${e.id}">Supprimer</button>` : ''}</form>` };
};
FORMS.carnet = f => {
  const o = { type: f.type.value, membre: f.membre.value, titre: f.titre.value.trim(), tel: f.tel.value.trim(), detail: f.detail.value.trim(), date: f.date.value };
  const i = etat.carnet.findIndex(x => x.id === f.id.value);
  if (i >= 0) Object.assign(etat.carnet[i], o); else etat.carnet.push({ id: uid(), ...o });
};
ACTIONS['car-filtre'] = el => { carF = el.dataset.v; return 'vue'; };
ACTIONS['carnet-del'] = el => { etat.carnet = etat.carnet.filter(x => x.id !== el.dataset.id); };
function carnetAlertes() {
  return etat.carnet.filter(e => e.date && diffJours(aujourdhui(), e.date) <= 30 && diffJours(aujourdhui(), e.date) >= -30)
    .map(e => { const d = diffJours(aujourdhui(), e.date); return [`${e.titre} (${nomType(e.type).toLowerCase()})`, d < 0 ? 'Dépassé' : d === 0 ? 'Aujourd’hui' : `Dans ${d} j`, d < 0 ? 'bad' : 'warn', 'carnet']; });
}

// ---------- Voyages ----------
let voySel = '';
const VALISE = ['Pièces d’identité', 'Billets et réservations', 'Assurance voyage', 'Carte bancaire et espèces', 'Chargeurs et batteries', 'Adaptateur de prise', 'Médicaments et trousse de soins', 'Trousse de toilette', 'Vêtements', 'Maillots de bain', 'Instructions et clés pour la maison'];
const VOYAGEURS = [['solo', 'Seul'], ['couple', 'En couple'], ['famille', 'En famille']];
const RYTHMES = [['detente', 'Détente'], ['equilibre', 'Équilibré'], ['actif', 'Actif']];
const voyageProchain = () => etat.voyages.filter(v => v.fin >= aujourdhui()).sort((a, b) => a.debut.localeCompare(b.debut))[0];
VUES.voyages = function () {
  if (!etat.voyages.length) return `<section class="carte"><h2>Vos voyages</h2><p class="mut">Préparez un séjour : dates, checklist de valise, planning par jour et budget avec les dépenses.</p><button class="btn" data-act="ouvrir" data-sheet="voyage">Planifier un voyage</button></section>`;
  const tri = [...etat.voyages].sort((a, b) => a.debut.localeCompare(b.debut));
  const v = etat.voyages.find(x => x.id === voySel) || voyageProchain() || tri[tri.length - 1];
  voySel = v.id;
  const jours = diffJours(aujourdhui(), v.debut), fini = v.fin < aujourdhui();
  const dep = somme(v.depenses, d => d.montant), faits = v.checklist.filter(c => c.fait).length;
  const nuits = Math.max(0, diffJours(v.debut, v.fin));
  return `<div class="chips" role="group" aria-label="Choisir un voyage">${tri.map(x => `<button data-act="voy-sel" data-id="${x.id}" aria-pressed="${x.id === v.id}">${esc(x.nom)}</button>`).join('')}</div>
    <section class="hero hero-voy${v.photo ? ' hero-photo' : ''}" style="${v.photo ? `background-image:linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.68)),url('${v.photo}')` : `background:${illuFond(v.destination)}`}">${v.photo ? '' : illuSvg(v.destination)}<p class="hero-lbl">${esc(v.destination || 'Destination à préciser')}</p><p class="hero-val">${fini ? 'Terminé' : jours > 0 ? `J-${jours}` : 'En cours'}</p>
      <p class="hero-sub">${fmtDate(v.debut)} → ${fmtDate(v.fin)} · ${nuits} nuit${pl(nuits)}</p></section>
    ${carteProgramme(v)}${carteLieux(v)}
    <section class="carte"><div class="carte-tete"><h2>Checklist</h2><span class="pill pri">${faits}/${v.checklist.length}</span></div>
      <form class="ajout" data-form="voy-item"><input name="txt" placeholder="Ajouter un point" aria-label="Nouveau point" required autocomplete="off"><button class="btn" aria-label="Ajouter">${ico('plus', 20)}</button></form>
      <ul class="liste">${v.checklist.map(c => `<li class="rang ${c.fait ? 'fait' : ''}"><label class="rang-main"><input type="checkbox" class="coche" data-act="voy-coche" data-id="${c.id}"${c.fait ? ' checked' : ''}><span class="rang-txt">${esc(c.txt)}</span></label>
        <button class="icone" data-act="voy-item-del" data-id="${c.id}" aria-label="Supprimer ${esc(c.txt)}">${ico('x', 18)}</button></li>`).join('') || '<li class="vide">Checklist vide.</li>'}</ul>
      ${v.checklist.length ? '' : '<button class="btn sec" data-act="voy-valise">Ajouter une liste de départ</button>'}</section>
    <section class="carte"><div class="carte-tete"><h2>Planning</h2><button class="lien" data-act="ouvrir" data-sheet="voy-etape">Ajouter</button></div>
      <ul class="liste">${[...v.etapes].sort((a, b) => a.date.localeCompare(b.date)).map(e => `<li class="rang"><button class="rang-btn" data-act="ouvrir" data-sheet="voy-etape" data-id="${e.id}" aria-label="Modifier l’étape"><span class="heure" style="flex-basis:70px">${fmtDate(e.date)}</span><span class="rang-txt">${esc(e.txt)}</span></button>
        <button class="icone" data-act="voy-etape-del" data-id="${e.id}" aria-label="Supprimer">${ico('x', 18)}</button></li>`).join('') || '<li class="vide">Aucune étape. Ajoutez vols, hôtels, visites.</li>'}</ul></section>
    <section class="carte"><div class="carte-tete"><h2>Budget</h2><button class="lien" data-act="ouvrir" data-sheet="voy-dep">Dépense</button></div>
      <div class="bar"><b class="num">${eur(dep)}</b><span class="mut num">${v.budget ? 'sur ' + eur(v.budget) : 'pas de budget fixé'}</span></div>
      ${v.budget ? `<div class="jauge"><i style="width:${Math.min(100, dep / v.budget * 100)}%;background:${dep > v.budget ? 'var(--bad)' : 'var(--ok)'}"></i></div>` : ''}
      <ul class="liste">${v.depenses.map(d => `<li class="rang" style="min-height:44px"><button class="rang-btn" data-act="ouvrir" data-sheet="voy-dep" data-id="${d.id}" aria-label="Modifier la dépense"><span class="rang-txt">${esc(d.txt)}</span><b class="num">${eur(d.montant)}</b></button>
        <button class="icone" data-act="voy-dep-del" data-id="${d.id}" aria-label="Supprimer">${ico('x', 18)}</button></li>`).join('')}</ul></section>
    <div class="rangee"><button class="btn sec" data-act="voy-agenda">Ajouter à l’agenda</button><button class="btn sec" data-act="ouvrir" data-sheet="voyage" data-id="${v.id}">Modifier</button><button class="btn danger" data-act="voyage-del" data-id="${v.id}">Supprimer</button></div>`;
};
SHEETS.voyage = d => {
  const v = d.id ? etat.voyages.find(x => x.id === d.id) : null;
  return { titre: v ? 'Modifier le voyage' : 'Nouveau voyage', corps: `<form class="formulaire" data-form="voyage"><input type="hidden" name="id" value="${v ? v.id : ''}">
    ${fld('Nom', `<input name="nom" required autocomplete="off" value="${esc(val(v, 'nom'))}" placeholder="Vacances d’été">`)}
    ${fld('Destination', `<input name="destination" autocomplete="off" value="${esc(val(v, 'destination'))}">`)}
    <div class="duo">${fld('Départ', `<input type="date" name="debut" required value="${esc(val(v, 'debut'))}">`)}${fld('Nombre de jours', `<input type="number" name="jours" min="1" max="21" step="1" inputmode="numeric" value="${v ? nbJoursVoyage(v) : ''}" placeholder="ex. 5">`)}</div>
    ${fld('Retour (calculé si le nombre de jours est renseigné)', `<input type="date" name="fin" value="${esc(val(v, 'fin'))}">`)}
    <div class="duo">${fld('Voyageurs', `<select name="voyageurs">${optSel(VOYAGEURS, val(v, 'voyageurs', etat.membres.length >= 3 ? 'famille' : 'couple'))}</select>`)}${fld('Rythme', `<select name="rythme">${optSel(RYTHMES, val(v, 'rythme', 'equilibre'))}</select>`)}</div>
    ${fld('Budget (€, facultatif)', `<input type="number" name="budget" min="0" step="50" inputmode="decimal" value="${val(v, 'budget', '') || ''}">`)}
    <div class="champ"><span>Photo de la destination (facultatif)</span>
      <div class="photo-zone" id="photoZone">${v && v.photo ? `<img src="${esc(v.photo)}" alt="Photo actuelle de la destination">` : `<div class="illu-prev" style="background:${illuFond(val(v, 'destination'))}">${illuSvg(val(v, 'destination'))}</div>`}</div>
      <input type="hidden" name="photo" value="">
      <label class="btn sec">Choisir une photo<input type="file" id="photoFichier" accept="image/*" hidden></label>
      ${v && v.photo ? '<label class="rang-main"><input type="checkbox" class="coche" name="retirerPhoto"><span class="rang-txt">Retirer la photo</span></label>' : ''}
      <a class="lien" id="lienPhoto" target="_blank" rel="noopener" href="https://unsplash.com/s/photos/${encodeURIComponent(val(v, 'destination'))}">Chercher une photo libre de droits ↗</a>
      <small>Sans photo, une illustration de la destination est dessinée automatiquement. Une photo choisie ici est réduite pour rester légère.</small></div>
    <small>Avec une destination et des dates, l’application propose un programme d’activités adapté aux voyageurs.</small>
    <button class="btn plein">Enregistrer</button></form>` };
};
SHEETS['voy-etape'] = d => {
  const x = d.id ? (voyAct() || { etapes: [] }).etapes.find(i => i.id === d.id) : null;
  return { titre: x ? 'Modifier l’étape' : 'Nouvelle étape', corps: `<form class="formulaire" data-form="voy-etape"><input type="hidden" name="id" value="${x ? x.id : ''}">
  <div class="duo">${fld('Date', `<input type="date" name="date" value="${x ? x.date : (voyAct() || {}).debut || aujourdhui()}" required>`)}${fld('Étape', `<input name="txt" required autocomplete="off" placeholder="Vol Paris - Lisbonne" value="${esc(x ? x.txt : '')}">`)}</div>
  <button class="btn plein">${x ? 'Enregistrer' : 'Ajouter'}</button>${x ? `<button type="button" class="btn danger plein" data-act="voy-etape-del" data-id="${x.id}">Supprimer</button>` : ''}</form>` };
};
SHEETS['voy-dep'] = d => {
  const x = d.id ? (voyAct() || { depenses: [] }).depenses.find(i => i.id === d.id) : null;
  return { titre: x ? 'Modifier la dépense' : 'Nouvelle dépense', corps: `<form class="formulaire" data-form="voy-dep"><input type="hidden" name="id" value="${x ? x.id : ''}">
  <div class="duo">${fld('Libellé', `<input name="txt" required autocomplete="off" placeholder="Hôtel" value="${esc(x ? x.txt : '')}">`)}${fld('Montant (€)', `<input type="number" name="montant" min="0" step="0.01" required inputmode="decimal" value="${x ? x.montant : ''}">`)}</div>
  <button class="btn plein">${x ? 'Enregistrer' : 'Ajouter'}</button>${x ? `<button type="button" class="btn danger plein" data-act="voy-dep-del" data-id="${x.id}">Supprimer</button>` : ''}</form>` };
};
const voyAct = () => etat.voyages.find(x => x.id === voySel);
// Retour : la date saisie si elle a été modifiée, sinon départ + (jours - 1) quand le nombre de jours est saisi
const finVoyage = (f, ancien) => {
  const n = Math.round(Number(f.jours.value)), dateModifiee = ancien ? f.fin.value !== ancien.fin : !!f.fin.value;
  let fin = f.fin.value;
  if (n >= 1 && n <= 21 && !dateModifiee) fin = iso(ajouteJours(parse(f.debut.value), n - 1));
  return !fin || fin < f.debut.value ? f.debut.value : fin;
};
FORMS.voyage = f => {
  const o = { nom: f.nom.value.trim(), destination: f.destination.value.trim(), debut: f.debut.value, fin: finVoyage(f, etat.voyages.find(x => x.id === f.id.value)), budget: Number(f.budget.value) || 0, voyageurs: f.voyageurs.value, rythme: f.rythme.value };
  const i = etat.voyages.findIndex(x => x.id === f.id.value);
  let v;
  if (i >= 0) {
    v = etat.voyages[i];
    const change = v.destination !== o.destination || v.debut !== o.debut || v.fin !== o.fin || v.voyageurs !== o.voyageurs || v.rythme !== o.rythme;
    Object.assign(v, o);
    if (f.retirerPhoto && f.retirerPhoto.checked) v.photo = ''; else if (f.photo.value) v.photo = f.photo.value;
    if (change) v.programme = null;
  } else { v = { id: uid(), checklist: [], depenses: [], etapes: [], programme: null, photo: f.photo.value || '', ...o }; etat.voyages.push(v); voySel = v.id; }
  if (v.destination && !v.programme) setTimeout(() => lancerProg(v.id), 40);
};
FORMS['voy-item'] = f => { const v = voyAct(); if (v) v.checklist.push({ id: uid(), txt: f.txt.value.trim(), fait: false }); };
FORMS['voy-etape'] = f => { const v = voyAct(); if (!v) return; const o = { date: f.date.value, txt: f.txt.value.trim() }, x = f.id.value && v.etapes.find(i => i.id === f.id.value); if (x) Object.assign(x, o); else v.etapes.push({ id: uid(), ...o }); };
FORMS['voy-dep'] = f => { const v = voyAct(); if (!v) return; const o = { txt: f.txt.value.trim(), montant: Number(f.montant.value) || 0 }, x = f.id.value && v.depenses.find(i => i.id === f.id.value); if (x) Object.assign(x, o); else v.depenses.push({ id: uid(), ...o }); };
// ---------- Programme proposé (Claude via la capacité « sample », sinon modèle générique) ----------
const progEnCours = {};
const nbJoursVoyage = vy => Math.max(1, Math.min(21, diffJours(vy.debut, vy.fin) + 1));
function compositionVoyage(vy) {
  if (vy.voyageurs === 'solo') return 'une personne seule';
  if (vy.voyageurs === 'couple') return 'un couple (deux adultes, sans enfants)';
  const ad = etat.membres.filter(m => categorie(m) === 'adulte').length || 2;
  const enf = etat.membres.filter(m => categorie(m) !== 'adulte').map(m => {
    if (categorie(m) === 'bebe') { const d = m.naissance ? parse(m.naissance) : null, n = new Date(); return d ? `un bébé de ${Math.max(1, (n.getFullYear() - d.getFullYear()) * 12 + n.getMonth() - d.getMonth())} mois` : 'un bébé'; }
    const a = ageDe(m); return a != null ? `un enfant de ${a} ans` : 'un enfant';
  });
  return `une famille : ${ad} adultes${enf.length ? ', ' + enf.join(', ') : ''}`;
}
function promptProgramme(vy) {
  const n = nbJoursVoyage(vy), prof = { solo: 'seul : rythme libre, visites, rencontres, restaurants au comptoir, sécurité du soir', couple: 'en couple : balades, points de vue, bons restaurants, moments à deux, un peu de romantisme', famille: 'en famille avec des jeunes enfants : rythme doux, pauses et siestes, activités ludiques, accès poussette si bébé, repas tôt, peu de longs trajets' }[vy.voyageurs || 'famille'];
  const ry = { detente: 'détendu, peu d’activités par jour', equilibre: 'équilibré', actif: 'actif, beaucoup de visites' }[vy.rythme || 'equilibre'];
  return `Tu es un guide de voyage. Propose un programme de ${n} jour${n > 1 ? 's' : ''} à ${vy.destination} pour ${compositionVoyage(vy)}. Profil : ${prof}. Rythme : ${ry}.
Réponds uniquement avec un objet JSON de la forme : {"jours":[{"jour":1,"titre":"Arrivée et quartier historique","matin":"...","apresmidi":"...","soir":"..."}],"lieux":[{"jour":1,"moment":"matin","nom":"Nom du lieu","lat":0.0000,"lng":0.0000}],"conseils":["..."]}.
Règles : exactement ${n} entrées dans "jours" ; "lieux" liste 2 à 4 lieux précis par jour (monument, quartier, restaurant connu) dans l'ordre de visite, avec "moment" parmi matin, apresmidi, soir et des coordonnées GPS décimales les plus exactes possibles ; lieux et activités réels et connus ; regroupe par quartier pour limiter les trajets ; jour 1 allégé (arrivée) et dernier jour adapté au départ ; au plus 25 mots par créneau ; aucune information de prix précise ; 4 à 6 conseils pratiques (saison, transports, réservations à anticiper, vérifier les horaires et jours de fermeture). Écris en français.`;
}
const MOMENTS_V = { matin: 'Matin', apresmidi: 'Après-midi', soir: 'Soir' };
function lieuxValides(arr, nbJ) {
  const l = (Array.isArray(arr) ? arr : []).map(x => ({ jour: Math.max(1, Math.min(nbJ, Math.round(Number(x && x.jour)) || 1)), moment: MOMENTS_V[x && x.moment] ? x.moment : 'matin', nom: String(x && x.nom || '').slice(0, 80), lat: Number(x && x.lat), lng: Number(x && x.lng) }))
    .filter(x => x.nom && Math.abs(x.lat) <= 90 && Math.abs(x.lng) <= 180 && (x.lat || x.lng)).slice(0, 80);
  if (l.length < 3) return l;
  const med = k => { const v = l.map(x => x[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; }, mla = med('lat'), mlo = med('lng');
  return l.filter(x => Math.abs(x.lat - mla) < 1.2 && Math.abs(x.lng - mlo) < 1.8) // écarte les coordonnées aberrantes (≈ 130 km)
    .sort((a, b) => a.jour - b.jour || Object.keys(MOMENTS_V).indexOf(a.moment) - Object.keys(MOMENTS_V).indexOf(b.moment));
}
async function lancerProg(id) {
  const vy = etat.voyages.find(x => x.id === id);
  if (!vy || !vy.destination) return;
  let sample = null;
  try { sample = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch { sample = null; }
  if (!sample) { progEnCours[id] = { etat: 'erreur', code: 'indisponible' }; rendreSiPossible(); return; }
  const ctl = new AbortController();
  progEnCours[id] = { etat: 'cours', ctl };
  rendreSiPossible();
  try {
    const d = await sample.json(promptProgramme(vy), { signal: ctl.signal });
    const t = (x, n) => String(x == null ? '' : x).slice(0, n);
    const jours = (Array.isArray(d && d.jours) ? d.jours : []).slice(0, 21).map((j, i) => ({ jour: Math.max(1, Number(j.jour) || i + 1), titre: t(j.titre, 120), matin: t(j.matin, 300), apresmidi: t(j.apresmidi, 300), soir: t(j.soir, 300) }));
    if (!jours.length) throw { code: 'format' };
    const w = etat.voyages.find(x => x.id === id);
    if (w) { w.programme = { source: 'claude', date: aujourdhui(), jours, lieux: lieuxValides(d.lieux, nbJoursVoyage(w)), conseils: (Array.isArray(d.conseils) ? d.conseils : []).slice(0, 8).map(c => t(c, 300)) }; sauver(); }
    delete progEnCours[id];
  } catch (e) { progEnCours[id] = e && e.code === 'cancelled' ? null : { etat: 'erreur', code: (e && e.code) || 'inconnue' }; if (!progEnCours[id]) delete progEnCours[id]; }
  rendreSiPossible();
}
function progGenerique(vy) {
  const n = nbJoursVoyage(vy), G = {
    solo: [['Petit-déjeuner dans un café local puis balade dans le centre', 'Visite d’un musée ou d’un site majeur', 'Dîner dans un restaurant populaire, promenade du soir'], ['Marché ou quartier animé', 'Point de vue et photos', 'Rencontres : activité en groupe ou bar local']],
    couple: [['Petit-déjeuner tranquille et balade dans le quartier historique', 'Visite d’un musée ou d’un site emblématique', 'Dîner dans un bon restaurant local, balade au coucher du soleil'], ['Marché, café et boutiques', 'Point de vue ou jardin pour la fin d’après-midi', 'Soirée détente : bar à vue ou concert']],
    famille: [['Parc, jardin ou plage pour que les enfants se dépensent', 'Après la sieste : visite courte et ludique (aquarium, zoo, musée interactif)', 'Dîner tôt près du logement'], ['Balade douce en poussette dans un quartier agréable', 'Activité adaptée aux enfants (manège, jeux, petite excursion)', 'Dîner simple et coucher tôt']],
  }[vy.voyageurs || 'famille'];
  const jours = Array.from({ length: n }, (_, i) => {
    const g = G[i % G.length];
    return { jour: i + 1, titre: i === 0 ? 'Arrivée et premiers pas' : i === n - 1 && n > 1 ? 'Dernier jour et départ' : `Jour ${i + 1}`, matin: i === 0 ? 'Arrivée, installation, premier tour du quartier' : g[0], apresmidi: i === n - 1 && n > 1 ? 'Dernières courses et trajet retour selon l’horaire' : g[1], soir: i === n - 1 && n > 1 ? 'Retour à la maison' : g[2] };
  });
  return { source: 'generique', date: aujourdhui(), jours, conseils: ['Réservez à l’avance les visites très fréquentées.', 'Vérifiez les horaires et les jours de fermeture.', 'Gardez du temps libre : un programme léger se vit mieux.'] };
}
const ERR_PROG = { not_granted: 'Autorisation refusée : acceptez l’utilisation de Claude pour obtenir une proposition, ou prenez le programme générique.', rate_limited: 'Trop de demandes en peu de temps. Réessayez dans un moment.', indisponible: 'La génération n’est pas disponible ici. Prenez le programme générique ci-dessous.', format: 'La réponse n’a pas pu être lue. Réessayez.' };
const COUL_JOUR = ['#0b8f78', '#d9822b', '#4f6bd6', '#c2487a', '#7a5ac8', '#2f9bb5', '#8a9a2b'];
const coulJour = j => COUL_JOUR[(j - 1) % COUL_JOUR.length];
const carteSel = {};
async function lancerCarte(id) {
  const vy = etat.voyages.find(x => x.id === id);
  if (!vy || !vy.programme) return;
  let sample = null;
  try { sample = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch { sample = null; }
  if (!sample) { progEnCours[id] = { etat: 'erreur', code: 'indisponible' }; rendreSiPossible(); return; }
  progEnCours[id] = { etat: 'carte' }; rendreSiPossible();
  try {
    const txt = vy.programme.jours.map(j => `Jour ${j.jour} : ${j.titre}. Matin : ${j.matin} Après-midi : ${j.apresmidi} Soir : ${j.soir}`).join('\n');
    const d = await sample.json(`Voici un programme de voyage à ${vy.destination} :\n${txt}\nListe les lieux précis cités ou sous-entendus (2 à 4 par jour, dans l'ordre de visite) avec leurs coordonnées GPS décimales les plus exactes possibles. Réponds uniquement avec un objet JSON : {"lieux":[{"jour":1,"moment":"matin","nom":"Nom du lieu","lat":0.0000,"lng":0.0000}]} ; "moment" vaut matin, apresmidi ou soir.`);
    const lieux = lieuxValides(d && d.lieux, nbJoursVoyage(vy));
    if (!lieux.length) throw { code: 'format' };
    const w = etat.voyages.find(x => x.id === id);
    if (w && w.programme) { w.programme.lieux = lieux; sauver(); }
    delete progEnCours[id];
  } catch (e) { progEnCours[id] = { etat: 'erreur', code: (e && e.code) || 'inconnue' }; }
  rendreSiPossible();
}
function carteSvg(lieux, sel, dest, boucle) {
  const W = 360, H = 270, pad = 38, la = lieux.map(x => x.lat), lo = lieux.map(x => x.lng), cl = (Math.min(...la) + Math.max(...la)) / 2, kx = Math.cos(cl * Math.PI / 180);
  const x0 = Math.min(...lo) * kx, x1 = Math.max(...lo) * kx, y0 = Math.min(...la), y1 = Math.max(...la), sx = Math.max(x1 - x0, 0.012), sy = Math.max(y1 - y0, 0.012);
  const k = Math.min((W - 2 * pad) / sx, (H - 2 * pad) / sy), ox = (W - sx * k) / 2 - x0 * k, oy = (H + sy * k) / 2 + y0 * k;
  const P = x => [x.lng * kx * k + ox, oy - x.lat * k];
  let h = 11; for (const c of sansAccent(dest)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
  const rues = Array.from({ length: 9 }, () => `M${(rnd() * W) | 0} 0L${(rnd() * W) | 0} ${H}`).join('') + Array.from({ length: 6 }, () => `M0 ${(rnd() * H) | 0}L${W} ${(rnd() * H) | 0}`).join('');
  const parcs = Array.from({ length: 3 }, () => { const cx = rnd() * W, cy = rnd() * H, r = 26 + rnd() * 30; return `<ellipse cx="${cx | 0}" cy="${cy | 0}" rx="${r | 0}" ry="${(r * .6) | 0}" class="cv-parc"/>`; }).join('');
  const jours = [...new Set(lieux.map(x => x.jour))];
  const tracePts = lieux.map(P).map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1));
  const traitBoucle = boucle ? `<path d="M${tracePts.join('L')}Z" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round" opacity=".85"/><path d="M${tracePts.join('L')}Z" fill="none" stroke="var(--pri)" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>` : '';
  const traits = boucle ? traitBoucle : jours.filter(j => !sel || sel === j).map(j => { const pts = lieux.filter(x => x.jour === j).map(P); return pts.length > 1 ? `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}" fill="none" stroke="${coulJour(j)}" stroke-width="${sel ? 3 : 2}" stroke-dasharray="1 6" stroke-linecap="round" opacity=".9"/>` : ''; }).join('');
  const pins = lieux.map((x, i) => { const [px, py] = P(x), on = !sel || sel === x.jour, lab = sel === x.jour, gauche = px > W * .6;
    return `<g opacity="${on ? 1 : .28}"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="10.5" fill="${coulJour(x.jour)}" stroke="#fff" stroke-width="2.4"/><text x="${px.toFixed(1)}" y="${(py + 4).toFixed(1)}" text-anchor="middle" class="cv-n">${i + 1}</text>${lab ? `<text x="${(px + (gauche ? -17 : 17)).toFixed(1)}" y="${(py + 4).toFixed(1)}" text-anchor="${gauche ? 'end' : 'start'}" class="cv-nom">${esc(x.nom.length > 24 ? x.nom.slice(0, 23) + '…' : x.nom)}</text>` : ''}</g>`; }).join('');
  const kmPx = 111.2 / k, bar = [0.2, 0.5, 1, 2, 5, 10, 20].find(v => v / kmPx >= 44) || 20;
  return `<svg class="carte-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Carte schématique des lieux du programme"><rect width="${W}" height="${H}" class="cv-fond"/>${parcs}<path d="${rues}" class="cv-rues"/><path d="M0 ${(H * .92) | 0}Q${W * .3} ${(H * .84) | 0} ${W * .55} ${(H * .93) | 0}T${W} ${(H * .88) | 0}V${H}H0z" class="cv-eau"/>${traits}${pins}
    <g transform="translate(14 ${H - 16})"><path d="M0 0h${(bar / kmPx).toFixed(0)}M0 -4v8M${(bar / kmPx).toFixed(0)} -4v8" class="cv-echelle"/><text x="${(bar / kmPx + 8).toFixed(0)}" y="4" class="cv-km">${bar < 1 ? bar * 1000 + ' m' : bar + ' km'}</text></g></svg>`;
}
const gmLieu = (x, dest) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.nom + ', ' + dest)}`;
function gmJour(l, dest) { // itinéraire Google Maps : jusqu'à 11 arrêts (départ, 9 étapes, arrivée)
  const a = l.slice(0, 11).map(x => `${x.lat},${x.lng}`);
  return a.length < 2 ? `https://www.google.com/maps/search/?api=1&query=${a[0]}` : `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${a[0]}&destination=${a[a.length - 1]}${a.length > 2 ? '&waypoints=' + encodeURIComponent(a.slice(1, -1).join('|')) : ''}`;
}
function carteLieux(vy) {
  const p = vy.programme, e = progEnCours[vy.id];
  if (!p || p.source !== 'claude') return '';
  if (e && e.etat === 'carte') return `<section class="carte"><h2>Carte</h2><p class="mut">Placement des lieux sur la carte…</p></section>`;
  const lieux = p.lieux || [];
  if (!lieux.length) return `<section class="carte"><h2>Carte</h2>${e && e.etat === 'erreur' ? `<p class="mut">${esc(ERR_PROG[e.code] || 'Une erreur est survenue. Réessayez.')}</p>` : '<p class="mut">Placez les lieux du programme sur une carte, jour par jour.</p>'}<button class="btn" data-act="carte-gen" data-id="${vy.id}">Générer la carte</button></section>`;
  const jours = [...new Set(lieux.map(x => x.jour))], sel = jours.includes(carteSel[vy.id]) ? carteSel[vy.id] : 0;
  return `<section class="carte"><div class="carte-tete"><h2>Carte</h2><span class="pill pri">${lieux.length} lieux</span></div>
    <div class="chips" role="group" aria-label="Jour affiché"><button data-act="carte-jour" data-id="${vy.id}" data-j="0" aria-pressed="${!sel}">Tout</button>${jours.map(j => `<button data-act="carte-jour" data-id="${vy.id}" data-j="${j}" aria-pressed="${sel === j}"><i class="pt-j" style="background:${coulJour(j)}"></i>J${j}</button>`).join('')}</div>
    ${carteSvg(lieux, sel, vy.destination)}
    <ul class="liste">${lieux.map((x, i) => ({ x, i })).filter(({ x }) => !sel || x.jour === sel).map(({ x, i }) => `<li class="rang" style="min-height:48px"><span class="pt-n" style="background:${coulJour(x.jour)}">${i + 1}</span><span class="rang-txt"><b>${esc(x.nom)}</b><small>Jour ${x.jour} · ${MOMENTS_V[x.moment]}</small></span><a class="lien" target="_blank" rel="noopener" href="${esc(gmLieu(x, vy.destination))}" aria-label="Ouvrir ${esc(x.nom)} dans Google Maps">Google Maps ↗</a></li>`).join('')}</ul>
    <div class="rangee">${jours.filter(j => !sel || j === sel).map(j => `<a class="btn sec" target="_blank" rel="noopener" href="${esc(gmJour(lieux.filter(x => x.jour === j), vy.destination))}"><i class="pt-j" style="background:${coulJour(j)}"></i>Itinéraire J${j} dans Google Maps ↗</a>`).join('')}</div>
    <small>Carte schématique : positions approximatives données par Claude, sans fond de carte réel. Vérifiez les adresses avant de partir.</small></section>`;
}
ACTIONS['carte-gen'] = el => { setTimeout(() => lancerCarte(el.dataset.id), 20); };
ACTIONS['carte-jour'] = el => { carteSel[el.dataset.id] = Number(el.dataset.j); return 'vue'; };
function carteProgramme(vy) {
  const e = progEnCours[vy.id], p = vy.programme;
  if (e && e.etat === 'cours') return `<section class="carte"><h2>Programme proposé</h2><p class="mut">Génération du programme pour ${esc(vy.destination)}… (quelques dizaines de secondes)</p><button class="btn sec" data-act="prog-stop" data-id="${vy.id}">Arrêter</button></section>`;
  if (!p) return `<section class="carte"><h2>Programme proposé</h2>
    ${e && e.etat === 'erreur' ? `<p class="mut">${esc(ERR_PROG[e.code] || 'Une erreur est survenue. Réessayez.')}</p>` : `<p class="mut">${vy.destination ? 'Obtenez des idées d’activités jour par jour, adaptées à vos voyageurs.' : 'Indiquez une destination (bouton Modifier) pour obtenir un programme.'}</p>`}
    <div class="rangee">${vy.destination ? `<button class="btn" data-act="prog-gen" data-id="${vy.id}">Proposer un programme</button>` : ''}<button class="btn sec" data-act="prog-generique" data-id="${vy.id}">Programme générique</button></div></section>`;
  const lib = { solo: 'seul', couple: 'en couple', famille: 'en famille' }[vy.voyageurs || 'famille'];
  return `<section class="carte"><div class="carte-tete"><h2>Programme proposé</h2><span class="pill">${lib}</span></div>
    ${p.jours.map(j => `<details ${j.jour === 1 ? 'open' : ''}><summary>Jour ${j.jour} · ${esc(j.titre)}</summary>
      <ul class="liste"><li class="rang" style="min-height:0;align-items:flex-start"><span class="rang-txt"><small>Matin</small>${esc(j.matin)}</span></li><li class="rang" style="min-height:0;align-items:flex-start"><span class="rang-txt"><small>Après-midi</small>${esc(j.apresmidi)}</span></li><li class="rang" style="min-height:0;align-items:flex-start"><span class="rang-txt"><small>Soir</small>${esc(j.soir)}</span></li></ul></details>`).join('')}
    ${p.conseils.length ? `<h3>Conseils</h3><ul class="liste">${p.conseils.map(c => `<li class="rang" style="min-height:0"><span class="rang-txt">${esc(c)}</span></li>`).join('')}</ul>` : ''}
    <div class="rangee"><button class="btn" data-act="prog-planning" data-id="${vy.id}">Ajouter au planning</button><button class="btn sec" data-act="prog-gen" data-id="${vy.id}">Régénérer</button><button class="btn danger" data-act="prog-del-voy" data-id="${vy.id}">Retirer</button></div>
    <small>${p.source === 'claude' ? 'Proposition générée par Claude à partir de connaissances générales, sans accès à internet : vérifiez horaires, jours de fermeture, tarifs et réservations.' : 'Programme générique, sans lien avec les lieux de la destination.'}</small></section>`;
}
ACTIONS['prog-gen'] = el => { const w = etat.voyages.find(x => x.id === el.dataset.id); w.programme = null; setTimeout(() => lancerProg(w.id), 20); };
ACTIONS['prog-stop'] = el => { const e = progEnCours[el.dataset.id]; if (e && e.ctl) e.ctl.abort(); return 'vue'; };
ACTIONS['prog-generique'] = el => { const w = etat.voyages.find(x => x.id === el.dataset.id); w.programme = progGenerique(w); delete progEnCours[w.id]; };
ACTIONS['prog-del-voy'] = el => { const w = etat.voyages.find(x => x.id === el.dataset.id); w.programme = null; delete progEnCours[w.id]; };
ACTIONS['prog-planning'] = el => {
  const w = etat.voyages.find(x => x.id === el.dataset.id); let n = 0;
  w.programme.jours.forEach(j => [['Matin', j.matin], ['Après-midi', j.apresmidi], ['Soir', j.soir]].forEach(([k, t]) => {
    const date = iso(ajouteJours(parse(w.debut), j.jour - 1)), txt = `${k} · ${t}`;
    if (t && !w.etapes.some(x => x.date === date && x.txt === txt)) { w.etapes.push({ id: uid(), date, txt }); n++; }
  }));
  info(n ? `${n} étapes ajoutées au planning.` : 'Le planning contient déjà ces étapes.');
};
ACTIONS['voy-sel'] = el => { voySel = el.dataset.id; return 'vue'; };
ACTIONS['voy-coche'] = el => { const c = voyAct().checklist.find(x => x.id === el.dataset.id); c.fait = el.checked; };
ACTIONS['voy-item-del'] = el => { const v = voyAct(); v.checklist = v.checklist.filter(x => x.id !== el.dataset.id); };
ACTIONS['voy-etape-del'] = el => { const v = voyAct(); v.etapes = v.etapes.filter(x => x.id !== el.dataset.id); };
ACTIONS['voy-dep-del'] = el => { const v = voyAct(); v.depenses = v.depenses.filter(x => x.id !== el.dataset.id); };
ACTIONS['voyage-del'] = el => { etat.voyages = etat.voyages.filter(x => x.id !== el.dataset.id); voySel = ''; };
ACTIONS['voy-valise'] = () => { voyAct().checklist.push(...VALISE.map(txt => ({ id: uid(), txt, fait: false }))); };
ACTIONS['voy-agenda'] = () => {
  const v = voyAct();
  etat.events.push({ id: uid(), titre: `Départ : ${v.nom}`, date: v.debut, heure: '', membre: '', rec: '' }, { id: uid(), titre: `Retour : ${v.nom}`, date: v.fin, heure: '', membre: '', rec: '' });
  info('Départ et retour ajoutés à l’agenda.');
};
function voyageAlertes() {
  const v = voyageProchain();
  if (!v) return [];
  const d = diffJours(aujourdhui(), v.debut), reste = v.checklist.filter(c => !c.fait).length;
  return d >= 0 && d <= 14 && reste ? [[`${v.nom} : ${reste} point${pl(reste)} à préparer`, d === 0 ? 'Départ' : `J-${d}`, 'warn', 'voyages']] : [];
}

// ---------- Cadeaux (restent sur l'appareil : pas de synchronisation) ----------
const CAD_STATUTS = [['idee', 'Idée'], ['achete', 'Acheté'], ['offert', 'Offert']];
let cadF = 'idee';
function anniversaires(jours = 60) {
  const n = new Date();
  return etat.membres.filter(m => m.naissance).map(m => {
    const [, mm, dd] = m.naissance.split('-').map(Number);
    let next = new Date(n.getFullYear(), mm - 1, dd);
    if (iso(next) < aujourdhui()) next = new Date(n.getFullYear() + 1, mm - 1, dd);
    return { m, date: iso(next), dans: diffJours(aujourdhui(), iso(next)) };
  }).filter(a => a.dans <= jours).sort((a, b) => a.dans - b.dans);
}
const cadeauxDe = nom => etat.cadeaux.filter(c => cle(c.pour) === cle(nom));
VUES.cadeaux = function () {
  const l = etat.cadeaux.filter(c => cadF === 'tous' || c.statut === cadF);
  const pers = [...new Set(l.map(c => c.pour))].sort();
  const bal = anniversaires();
  return `${bal.length ? `<section class="carte"><h2>Prochains anniversaires</h2><ul class="liste">${bal.map(a => { const g = cadeauxDe(a.m.nom), pret = g.some(c => c.statut !== 'idee');
      return `<li class="rang"><span class="rang-txt"><b>${esc(a.m.nom)}</b><small>${fmtDate(a.date)} · ${g.length ? g.length + ' idée' + pl(g.length) : 'aucune idée'}</small></span><span class="pill ${pret ? 'ok' : a.dans <= 14 ? 'warn' : ''}">${pret ? 'Prêt' : a.dans === 0 ? 'Aujourd’hui' : 'Dans ' + a.dans + ' j'}</span>
        <button class="lien" data-act="ouvrir" data-sheet="cadeau" data-pour="${esc(a.m.nom)}">Idée</button></li>`; }).join('')}</ul></section>` : ''}
    <p class="mut" style="margin:0"><small>Cette liste reste sur cet appareil : elle n’est pas partagée, pour préserver les surprises.</small></p>
    <div class="chips" role="group" aria-label="Statut">${[...CAD_STATUTS, ['tous', 'Tous']].map(([k, n]) => `<button data-act="cad-filtre" data-v="${k}" aria-pressed="${cadF === k}">${n}</button>`).join('')}</div>
    ${pers.map(p => { const g = l.filter(c => c.pour === p); return `<section class="carte"><div class="carte-tete"><h2>${esc(p)}</h2><span class="pill">${eur(somme(g, c => c.prix || 0))}</span></div>
      <ul class="liste">${g.map(c => `<li class="rang"><button class="rang-btn" data-act="ouvrir" data-sheet="cadeau" data-id="${c.id}"><span class="rang-txt"><b>${esc(c.idee)}</b><small>${[c.occasion, c.prix ? eur(c.prix) : ''].filter(Boolean).map(esc).join(' · ')}</small></span></button>
        <button class="pill ${c.statut === 'offert' ? 'ok' : c.statut === 'achete' ? 'pri' : ''}" data-act="cad-statut" data-id="${c.id}" aria-label="Changer le statut">${CAD_STATUTS.find(s => s[0] === c.statut)[1]}</button></li>`).join('')}</ul></section>`; }).join('')
      || '<section class="carte"><p class="vide">Aucune idée dans cette liste.<br><button class="btn sec" data-act="ouvrir" data-sheet="cadeau">Ajouter une idée</button></p></section>'}`;
};
SHEETS.cadeau = d => {
  const c = d.id ? etat.cadeaux.find(x => x.id === d.id) : null;
  return { titre: c ? 'Modifier l’idée' : 'Nouvelle idée', corps: `<form class="formulaire" data-form="cadeau"><input type="hidden" name="id" value="${c ? c.id : ''}">
    ${fld('Pour', `<input name="pour" required list="dlPour" autocomplete="off" value="${esc(c ? c.pour : (d.pour || ''))}"><datalist id="dlPour">${etat.membres.map(m => `<option value="${esc(m.nom)}">`).join('')}</datalist>`)}
    ${fld('Idée de cadeau', `<input name="idee" required autocomplete="off" value="${esc(val(c, 'idee'))}">`)}
    <div class="duo">${fld('Occasion', `<input name="occasion" autocomplete="off" value="${esc(val(c, 'occasion'))}" placeholder="Anniversaire">`)}${fld('Prix estimé (€)', `<input type="number" name="prix" min="0" step="1" inputmode="decimal" value="${val(c, 'prix', '') || ''}">`)}</div>
    ${fld('Statut', `<select name="statut">${optSel(CAD_STATUTS, val(c, 'statut', 'idee'))}</select>`)}
    <button class="btn plein">Enregistrer</button>${c ? `<button type="button" class="btn danger plein" data-act="cadeau-del" data-id="${c.id}">Supprimer</button>` : ''}</form>` };
};
FORMS.cadeau = f => {
  const o = { pour: f.pour.value.trim(), idee: f.idee.value.trim(), occasion: f.occasion.value.trim(), prix: Number(f.prix.value) || 0, statut: f.statut.value };
  const i = etat.cadeaux.findIndex(x => x.id === f.id.value);
  if (i >= 0) Object.assign(etat.cadeaux[i], o); else etat.cadeaux.push({ id: uid(), ...o });
};
ACTIONS['cad-filtre'] = el => { cadF = el.dataset.v; return 'vue'; };
ACTIONS['cad-statut'] = el => { const c = etat.cadeaux.find(x => x.id === el.dataset.id); c.statut = CAD_STATUTS[(CAD_STATUTS.findIndex(s => s[0] === c.statut) + 1) % 3][0]; };
ACTIONS['cadeau-del'] = el => { etat.cadeaux = etat.cadeaux.filter(x => x.id !== el.dataset.id); };
function cadeauxAlertes() {
  return anniversaires(14).filter(a => !cadeauxDe(a.m.nom).some(c => c.statut !== 'idee'))
    .map(a => [`Anniversaire de ${a.m.nom} le ${fmtDate(a.date)} : pas encore de cadeau acheté`, a.dans === 0 ? 'Aujourd’hui' : `Dans ${a.dans} j`, 'warn', 'cadeaux']);
}

// ---------- Recherche étendue ----------
const rechercherBase = rechercher;
rechercher = function (q) {
  const R = rechercherBase(q), k = cle(q);
  if (k.length < 2) return R;
  const m = s => cle(s || '').includes(k);
  etat.recettes.filter(r => m(r.nom) || r.ingredients.some(m)).slice(0, 6).forEach(r => R.push({ g: 'Recettes', t: r.nom, s: `${r.ingredients.length} ingrédients`, vue: 'recettes' }));
  etat.carnet.filter(e => m(e.titre) || m(e.detail) || m(e.tel)).slice(0, 6).forEach(e => R.push({ g: 'Carnet', t: e.titre, s: nomType(e.type), vue: 'carnet' }));
  etat.voyages.filter(v => m(v.nom) || m(v.destination)).forEach(v => R.push({ g: 'Voyages', t: v.nom, s: fmtDate(v.debut), vue: 'voyages', voy: v.id }));
  etat.cadeaux.filter(c => m(c.idee) || m(c.pour)).slice(0, 6).forEach(c => R.push({ g: 'Cadeaux', t: c.idee, s: 'Pour ' + c.pour, vue: 'cadeaux' }));
  return R;
};

// ---------- Photo de la destination : image réduite et compressée (stockée dans le voyage) ----------
async function reduirePhoto(fichier, largeurMax = 1000, tailleMax = 150000) {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
    let l = Math.min(1, largeurMax / img.naturalWidth);
    for (let essai = 0; essai < 6; essai++) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * l)); c.height = Math.max(1, Math.round(img.naturalHeight * l));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      for (let q = 0.8; q >= 0.4; q -= 0.1) { const d = c.toDataURL('image/jpeg', q); if (d.length <= tailleMax) return d; }
      l *= 0.8;
    }
    throw new Error('trop lourde');
  } finally { URL.revokeObjectURL(url); }
}
document.addEventListener('change', async e => {
  if (e.target.id !== 'photoFichier' || !e.target.files[0]) return;
  const form = e.target.closest('form'), zone = document.getElementById('photoZone'), bouton = form.querySelector('.btn.plein');
  zone.textContent = 'Traitement de la photo…'; bouton.disabled = true;
  try {
    const d = await reduirePhoto(e.target.files[0]);
    form.elements.photo.value = d;
    zone.innerHTML = `<img src="${d}" alt="Aperçu de la photo">`;
  } catch { zone.textContent = 'Photo illisible. Essayez une image JPEG ou PNG.'; form.elements.photo.value = ''; }
  bouton.disabled = false;
});
document.addEventListener('input', e => {
  if (e.target.name !== 'destination') return;
  const ip = document.querySelector('#photoZone .illu-prev');
  if (ip) { ip.style.background = illuFond(e.target.value); ip.innerHTML = illuSvg(e.target.value); }
  const l = document.getElementById('lienPhoto');
  if (l) l.href = 'https://unsplash.com/s/photos/' + encodeURIComponent(e.target.value);
});
