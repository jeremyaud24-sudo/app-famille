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
    <section class="hero"><p class="hero-lbl">${esc(v.destination || 'Destination à préciser')}</p><p class="hero-val">${fini ? 'Terminé' : jours > 0 ? `J-${jours}` : 'En cours'}</p>
      <p class="hero-sub">${fmtDate(v.debut)} → ${fmtDate(v.fin)} · ${nuits} nuit${pl(nuits)}</p></section>
    <section class="carte"><div class="carte-tete"><h2>Checklist</h2><span class="pill pri">${faits}/${v.checklist.length}</span></div>
      <form class="ajout" data-form="voy-item"><input name="txt" placeholder="Ajouter un point" aria-label="Nouveau point" required autocomplete="off"><button class="btn" aria-label="Ajouter">${ico('plus', 20)}</button></form>
      <ul class="liste">${v.checklist.map(c => `<li class="rang ${c.fait ? 'fait' : ''}"><label class="rang-main"><input type="checkbox" class="coche" data-act="voy-coche" data-id="${c.id}"${c.fait ? ' checked' : ''}><span class="rang-txt">${esc(c.txt)}</span></label>
        <button class="icone" data-act="voy-item-del" data-id="${c.id}" aria-label="Supprimer ${esc(c.txt)}">${ico('x', 18)}</button></li>`).join('') || '<li class="vide">Checklist vide.</li>'}</ul>
      ${v.checklist.length ? '' : '<button class="btn sec" data-act="voy-valise">Ajouter une liste de départ</button>'}</section>
    <section class="carte"><div class="carte-tete"><h2>Planning</h2><button class="lien" data-act="ouvrir" data-sheet="voy-etape">Ajouter</button></div>
      <ul class="liste">${[...v.etapes].sort((a, b) => a.date.localeCompare(b.date)).map(e => `<li class="rang"><span class="heure" style="flex-basis:70px">${fmtDate(e.date).slice(0, -0)}</span><span class="rang-txt">${esc(e.txt)}</span>
        <button class="icone" data-act="voy-etape-del" data-id="${e.id}" aria-label="Supprimer">${ico('x', 18)}</button></li>`).join('') || '<li class="vide">Aucune étape. Ajoutez vols, hôtels, visites.</li>'}</ul></section>
    <section class="carte"><div class="carte-tete"><h2>Budget</h2><button class="lien" data-act="ouvrir" data-sheet="voy-dep">Dépense</button></div>
      <div class="bar"><b class="num">${eur(dep)}</b><span class="mut num">${v.budget ? 'sur ' + eur(v.budget) : 'pas de budget fixé'}</span></div>
      ${v.budget ? `<div class="jauge"><i style="width:${Math.min(100, dep / v.budget * 100)}%;background:${dep > v.budget ? 'var(--bad)' : 'var(--ok)'}"></i></div>` : ''}
      <ul class="liste">${v.depenses.map(d => `<li class="rang" style="min-height:44px"><span class="rang-txt">${esc(d.txt)}</span><b class="num">${eur(d.montant)}</b>
        <button class="icone" data-act="voy-dep-del" data-id="${d.id}" aria-label="Supprimer">${ico('x', 18)}</button></li>`).join('')}</ul></section>
    <div class="rangee"><button class="btn sec" data-act="voy-agenda">Ajouter à l’agenda</button><button class="btn sec" data-act="ouvrir" data-sheet="voyage" data-id="${v.id}">Modifier</button><button class="btn danger" data-act="voyage-del" data-id="${v.id}">Supprimer</button></div>`;
};
SHEETS.voyage = d => {
  const v = d.id ? etat.voyages.find(x => x.id === d.id) : null;
  return { titre: v ? 'Modifier le voyage' : 'Nouveau voyage', corps: `<form class="formulaire" data-form="voyage"><input type="hidden" name="id" value="${v ? v.id : ''}">
    ${fld('Nom', `<input name="nom" required autocomplete="off" value="${esc(val(v, 'nom'))}" placeholder="Vacances d’été">`)}
    ${fld('Destination', `<input name="destination" autocomplete="off" value="${esc(val(v, 'destination'))}">`)}
    <div class="duo">${fld('Départ', `<input type="date" name="debut" required value="${esc(val(v, 'debut'))}">`)}${fld('Retour', `<input type="date" name="fin" required value="${esc(val(v, 'fin'))}">`)}</div>
    ${fld('Budget (€, facultatif)', `<input type="number" name="budget" min="0" step="50" inputmode="decimal" value="${val(v, 'budget', '') || ''}">`)}
    <button class="btn plein">Enregistrer</button></form>` };
};
SHEETS['voy-etape'] = () => ({ titre: 'Nouvelle étape', corps: `<form class="formulaire" data-form="voy-etape">
  <div class="duo">${fld('Date', `<input type="date" name="date" value="${(etat.voyages.find(x => x.id === voySel) || {}).debut || aujourdhui()}" required>`)}${fld('Étape', '<input name="txt" required autocomplete="off" placeholder="Vol Paris - Lisbonne">')}</div>
  <button class="btn plein">Ajouter</button></form>` });
SHEETS['voy-dep'] = () => ({ titre: 'Nouvelle dépense', corps: `<form class="formulaire" data-form="voy-dep">
  <div class="duo">${fld('Libellé', '<input name="txt" required autocomplete="off" placeholder="Hôtel">')}${fld('Montant (€)', '<input type="number" name="montant" min="0" step="0.01" required inputmode="decimal">')}</div>
  <button class="btn plein">Ajouter</button></form>` });
const voyAct = () => etat.voyages.find(x => x.id === voySel);
FORMS.voyage = f => {
  const o = { nom: f.nom.value.trim(), destination: f.destination.value.trim(), debut: f.debut.value, fin: f.fin.value < f.debut.value ? f.debut.value : f.fin.value, budget: Number(f.budget.value) || 0 };
  const i = etat.voyages.findIndex(x => x.id === f.id.value);
  if (i >= 0) Object.assign(etat.voyages[i], o); else { const v = { id: uid(), checklist: [], depenses: [], etapes: [], ...o }; etat.voyages.push(v); voySel = v.id; }
};
FORMS['voy-item'] = f => { const v = voyAct(); if (v) v.checklist.push({ id: uid(), txt: f.txt.value.trim(), fait: false }); };
FORMS['voy-etape'] = f => { const v = voyAct(); if (v) v.etapes.push({ id: uid(), date: f.date.value, txt: f.txt.value.trim() }); };
FORMS['voy-dep'] = f => { const v = voyAct(); if (v) v.depenses.push({ id: uid(), txt: f.txt.value.trim(), montant: Number(f.montant.value) || 0 }); };
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
