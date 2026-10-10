'use strict';

const CLE = 'app-famille-v1';
const COULEURS = ['#4f46e5', '#db2777', '#059669', '#d97706', '#0891b2', '#7c3aed', '#dc2626'];
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
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch { alert('Impossible de sauvegarder les données.'); }
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
const pastille = id => { const m = membre(id); return m ? `<span class="tag" style="background:${m.couleur}">${esc(m.nom)}</span>` : ''; };
const optionsMembres = (sel, vide) =>
  (vide ? `<option value="">${vide}</option>` : '') +
  etat.membres.map(m => `<option value="${m.id}"${m.id === sel ? ' selected' : ''}>${esc(m.nom)}</option>`).join('');

// ---------- Navigation ----------
const TITRES = { accueil: 'Accueil', courses: 'Courses', taches: 'Tâches', agenda: 'Agenda', repas: 'Repas', budget: 'Budget', famille: 'Famille' };
let vue = 'accueil';
let jourSel = aujourdhui();
let moisAff = new Date(); moisAff.setDate(1);
let semaineAff = lundi(new Date());
let moisBudget = iso(new Date()).slice(0, 7);

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
  const l = lib.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return NOMS_CATS.find(c => CATS[c].some(k => l.includes(k))) || 'Autre';
};
const eur = n => (Math.abs(n) < 0.005 ? 0 : n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

function aller(v) { vue = v; rendre(); window.scrollTo(0, 0); }

function rendre() {
  document.getElementById('titre').textContent = TITRES[vue];
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.vue === vue));
  const sel = document.getElementById('membreActif');
  sel.innerHTML = optionsMembres(etat.actif, 'Qui êtes-vous ?');
  sel.hidden = !etat.membres.length;
  document.getElementById('vue').innerHTML = VUES[vue]();
}

// ---------- Vues ----------
const VUES = {
  accueil() {
    const auj = aujourdhui();
    const evs = etat.events.filter(e => e.date === auj).sort((a, b) => (a.heure || '').localeCompare(b.heure || ''));
    const aFaire = etat.taches.filter(t => !t.fait);
    const aAcheter = etat.courses.filter(c => !c.fait);
    const repas = etat.repas[auj] || {};
    const prochains = etat.events.filter(e => e.date > auj).sort((a, b) => (a.date + (a.heure || '')).localeCompare(b.date + (b.heure || ''))).slice(0, 3);
    const anniv = etat.membres.filter(m => m.naissance && m.naissance.slice(5) === auj.slice(5));
    return `
      <div class="card"><h2>${fmtDate(auj)}</h2>
        ${etat.membres.length ? '' : '<p class="mut">Commencez par ajouter les membres dans l’onglet Famille.</p>'}
        ${anniv.map(m => `<p>🎂 Joyeux anniversaire <b>${esc(m.nom)}</b> !</p>`).join('')}
      </div>
      <div class="card"><h2>📅 Aujourd’hui</h2>
        ${evs.length ? `<ul class="list">${evs.map(e => `<li><div class="grow">${e.heure ? `<b>${esc(e.heure)}</b> ` : ''}${esc(e.titre)}</div>${pastille(e.membre)}</li>`).join('')}</ul>` : '<p class="vide">Rien de prévu</p>'}
        ${prochains.length ? `<p class="mut">À venir : ${prochains.map(e => `${fmtDate(e.date)} – ${esc(e.titre)}`).join(' · ')}</p>` : ''}
      </div>
      <div class="card"><h2>🍽️ Menu du jour</h2>
        <p>Midi : ${esc(repas.midi) || '<span class="mut">non défini</span>'}<br>Soir : ${esc(repas.soir) || '<span class="mut">non défini</span>'}</p>
      </div>
      <div class="card"><h2>✅ ${aFaire.length} tâche(s) à faire</h2>
        <ul class="list">${aFaire.slice(0, 5).map(t => `<li><div class="grow">${esc(t.titre)}</div>${pastille(t.membre)}</li>`).join('') || '<li class="vide">Tout est fait 🎉</li>'}</ul>
      </div>
      <div class="card"><h2>🛒 ${aAcheter.length} article(s) à acheter</h2>
        <p class="mut">${aAcheter.slice(0, 8).map(c => esc(c.nom)).join(', ') || 'Liste vide'}</p>
      </div>`;
  },

  courses() {
    const items = [...etat.courses].sort((a, b) => a.fait - b.fait);
    return `
      <form class="row" data-form="course"><input type="text" name="nom" placeholder="Ajouter un article…" required autocomplete="off"><button class="btn">Ajouter</button></form>
      <div class="card"><ul class="list">
        ${items.map(c => `<li class="${c.fait ? 'fait' : ''}">
          <input type="checkbox" data-act="course-fait" data-id="${c.id}"${c.fait ? ' checked' : ''}>
          <div class="grow">${esc(c.nom)}</div>
          <button class="btn del" data-act="course-del" data-id="${c.id}" aria-label="Supprimer">✕</button></li>`).join('') || '<li class="vide">La liste est vide</li>'}
      </ul></div>
      ${etat.courses.some(c => c.fait) ? '<button class="btn sec" data-act="course-vider">Retirer les articles cochés</button>' : ''}`;
  },

  taches() {
    const scores = etat.membres.map(m => ({ m, pts: etat.taches.filter(t => t.fait && t.par === m.id).reduce((s, t) => s + (t.points || 0), 0) }))
      .sort((a, b) => b.pts - a.pts);
    const items = [...etat.taches].sort((a, b) => a.fait - b.fait);
    return `
      <form class="row" data-form="tache">
        <input type="text" name="titre" placeholder="Nouvelle tâche…" required autocomplete="off">
        <select name="membre">${optionsMembres(etat.actif, 'Pour tous')}</select>
        <input type="number" name="points" min="0" max="100" value="1" style="width:70px" title="Points" aria-label="Points">
        <button class="btn">Ajouter</button>
      </form>
      <div class="card"><ul class="list">
        ${items.map(t => `<li class="${t.fait ? 'fait' : ''}">
          <input type="checkbox" data-act="tache-fait" data-id="${t.id}"${t.fait ? ' checked' : ''}>
          <div class="grow">${esc(t.titre)} <span class="mut">${t.points ? `+${t.points} pt` : ''}</span></div>
          ${pastille(t.membre)}
          <button class="btn del" data-act="tache-del" data-id="${t.id}" aria-label="Supprimer">✕</button></li>`).join('') || '<li class="vide">Aucune tâche</li>'}
      </ul></div>
      ${scores.length ? `<div class="card"><h2>🏆 Classement</h2><ul class="list">
        ${scores.map(s => `<li><div class="grow">${pastille(s.m.id)}</div><span class="score">${s.pts}</span></li>`).join('')}</ul>
        <p class="mut">Les points vont à la personne qui coche la tâche (membre actif).</p></div>` : ''}`;
  },

  agenda() {
    const an = moisAff.getFullYear(), mo = moisAff.getMonth();
    const decal = (new Date(an, mo, 1).getDay() + 6) % 7;
    const nbJ = new Date(an, mo + 1, 0).getDate();
    const cases = [];
    for (let i = 0; i < decal; i++) cases.push('<div></div>');
    for (let j = 1; j <= nbJ; j++) {
      const d = `${an}-${pad(mo + 1)}-${pad(j)}`;
      const cls = ['j', d === jourSel && 'sel', d === aujourdhui() && 'auj', etat.events.some(e => e.date === d) && 'ev'].filter(Boolean).join(' ');
      cases.push(`<div class="${cls}" data-act="jour" data-date="${d}">${j}</div>`);
    }
    const evs = etat.events.filter(e => e.date === jourSel).sort((a, b) => (a.heure || '').localeCompare(b.heure || ''));
    return `
      <div class="card">
        <div class="bar"><button class="btn sec" data-act="mois" data-n="-1">‹</button><b>${MOIS[mo]} ${an}</b><button class="btn sec" data-act="mois" data-n="1">›</button></div>
        <div class="grid7">${JOURS.map(j => `<div class="h">${j}</div>`).join('')}${cases.join('')}</div>
      </div>
      <div class="card"><h2>${fmtDate(jourSel)}</h2>
        <ul class="list">${evs.map(e => `<li><div class="grow">${e.heure ? `<b>${esc(e.heure)}</b> ` : ''}${esc(e.titre)}</div>${pastille(e.membre)}
          <button class="btn del" data-act="event-del" data-id="${e.id}" aria-label="Supprimer">✕</button></li>`).join('') || '<li class="vide">Aucun événement</li>'}</ul>
      </div>
      <form class="row" data-form="event">
        <input type="text" name="titre" placeholder="Nouvel événement…" required autocomplete="off">
        <input type="time" name="heure">
        <select name="membre">${optionsMembres('', 'Tous')}</select>
        <button class="btn">Ajouter</button>
      </form>`;
  },

  repas() {
    const jours = Array.from({ length: 7 }, (_, i) => ajouteJours(semaineAff, i));
    const fin = jours[6];
    return `
      <div class="bar"><button class="btn sec" data-act="semaine" data-n="-1">‹</button>
        <b>${fmtDate(iso(semaineAff))} → ${fmtDate(iso(fin))}</b>
        <button class="btn sec" data-act="semaine" data-n="1">›</button></div>
      <div class="card repas"><table>
        <tr><th>Jour</th><th>Midi</th><th>Soir</th></tr>
        ${jours.map(d => { const k = iso(d), r = etat.repas[k] || {}; return `<tr>
          <td>${JOURS[(d.getDay() + 6) % 7]} ${d.getDate()}</td>
          <td><input data-repas="${k}" data-slot="midi" value="${esc(r.midi)}" aria-label="Midi ${k}"></td>
          <td><input data-repas="${k}" data-slot="soir" value="${esc(r.soir)}" aria-label="Soir ${k}"></td></tr>`; }).join('')}
      </table></div>
      <button class="btn sec" data-act="repas-courses">Ajouter les plats de la semaine aux courses</button>`;
  },

  budget() {
    const [an, mo] = moisBudget.split('-').map(Number);
    const tx = etat.tx.filter(t => t.date.startsWith(moisBudget)).sort((a, b) => b.date.localeCompare(a.date));
    const rev = tx.filter(t => t.montant > 0).reduce((s, t) => s + t.montant, 0);
    const dep = -tx.filter(t => t.montant < 0).reduce((s, t) => s + t.montant, 0);
    const parCat = c => -tx.filter(t => t.cat === c && t.montant < 0).reduce((s, t) => s + t.montant, 0);
    return `
      <div class="bar"><button class="btn sec" data-act="mois-budget" data-n="-1">‹</button><b>${MOIS[mo - 1]} ${an}</b><button class="btn sec" data-act="mois-budget" data-n="1">›</button></div>
      <div class="card"><div class="bar"><span>Revenus</span><b style="color:var(--ok)">${eur(rev)}</b></div>
        <div class="bar"><span>Dépenses</span><b style="color:var(--ko)">${eur(dep)}</b></div>
        <div class="bar"><span>Solde</span><b class="score">${eur(rev - dep)}</b></div></div>
      <div class="card"><h2>Par catégorie</h2>
        ${NOMS_CATS.filter(c => c !== 'Revenus').map(c => { const v = parCat(c), p = etat.plafonds[c] || 0, pc = p ? Math.min(100, v / p * 100) : 0;
          return `<div style="margin-bottom:10px"><div class="bar" style="margin:0"><span>${c}</span><span>${eur(v)}${p ? ' / ' : ''}<input type="number" min="0" step="10" class="plaf" data-plafond="${c}" value="${p || ''}" placeholder="plafond €"></span></div>
          ${p ? `<div class="jauge"><i style="width:${pc}%;background:${v > p ? 'var(--ko)' : 'var(--ok)'}"></i></div>` : ''}</div>`; }).join('')}
      </div>
      <form class="row" data-form="tx">
        <input type="text" name="libelle" placeholder="Libellé…" required autocomplete="off">
        <input type="number" name="montant" step="0.01" placeholder="Montant €" required style="width:110px">
        <select name="type"><option value="-1">Dépense</option><option value="1">Revenu</option></select>
        <input type="date" name="date" value="${moisBudget === aujourdhui().slice(0, 7) ? aujourdhui() : moisBudget + '-01'}" required>
        <select name="cat">${NOMS_CATS.filter(c => c !== 'Revenus').map(c => `<option>${c}</option>`).join('')}</select>
        <button class="btn">Ajouter</button>
      </form>
      <div class="card"><ul class="list">
        ${tx.map(t => `<li><div class="grow">${esc(t.libelle)}<div class="mut">${fmtDate(t.date)} · ${esc(t.cat)}</div></div>
          <b style="color:${t.montant < 0 ? 'var(--ko)' : 'var(--ok)'}">${eur(t.montant)}</b>
          <button class="btn del" data-act="tx-del" data-id="${t.id}" aria-label="Supprimer">✕</button></li>`).join('') || '<li class="vide">Aucune opération ce mois-ci</li>'}
      </ul></div>
      <div class="card"><h2>📄 Importer un relevé bancaire (CSV)</h2>
        <p class="mut">Téléchargez le relevé CSV depuis le site de votre banque : colonnes date, libellé, montant (ou débit/crédit). Les catégories sont devinées, doublons ignorés.</p>
        <label class="btn" style="display:inline-block">Choisir un fichier CSV<input type="file" id="importCsv" accept=".csv,text/csv,text/plain" hidden></label>
      </div>`;
  },

  famille() {
    return `
      <form class="row" data-form="membre">
        <input type="text" name="nom" placeholder="Prénom…" required autocomplete="off">
        <input type="date" name="naissance" title="Date de naissance (optionnel)" aria-label="Date de naissance">
        <button class="btn">Ajouter</button>
      </form>
      <div class="card"><ul class="list">
        ${etat.membres.map(m => `<li>${pastille(m.id)}<div class="grow mut">${m.naissance ? '🎂 ' + fmtDate(m.naissance) : ''}</div>
          <button class="btn del" data-act="membre-del" data-id="${m.id}" aria-label="Supprimer">✕</button></li>`).join('') || '<li class="vide">Ajoutez les membres de la famille</li>'}
      </ul></div>
      <div class="card"><h2>💾 Données</h2>
        <p class="mut">Les données sont stockées sur cet appareil. Exportez-les pour les sauvegarder ou les copier sur un autre appareil.</p>
        <button class="btn" data-act="export">Exporter</button>
        <label class="btn sec" style="display:inline-block">Importer<input type="file" id="import" accept="application/json" hidden></label>
      </div>`;
  },
};

// ---------- Actions ----------
const ACTIONS = {
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
    if (!confirm('Supprimer ce membre ?')) return false;
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
    alert(n ? `${n} élément(s) ajouté(s) aux courses.` : 'Rien à ajouter.');
  },
  'export': () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(etat, null, 2)], { type: 'application/json' }));
    a.download = `famille-${aujourdhui()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    return 'vue';
  },
};

const FORMS = {
  course: f => etat.courses.push({ id: uid(), nom: f.nom.value.trim(), fait: false }),
  tache: f => etat.taches.push({ id: uid(), titre: f.titre.value.trim(), membre: f.membre.value, points: Number(f.points.value) || 0, fait: false, par: null }),
  event: f => etat.events.push({ id: uid(), titre: f.titre.value.trim(), date: jourSel, heure: f.heure.value, membre: f.membre.value }),
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

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && !(el.type === 'checkbox')) executer(el);
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
  else if (t.dataset.pf || t.dataset.pfcfg) changePf(t);
  else if (t.id === 'importCsv') importerCsv(t.files[0]);
  else if (t.id === 'import') importer(t.files[0]);
});
document.addEventListener('submit', e => {
  const f = e.target;
  if (!f.dataset.form) return;
  e.preventDefault();
  FORMS[f.dataset.form](f);
  sauver();
  rendre();
});
document.getElementById('tabs').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) aller(b.dataset.vue);
});

function executer(el) {
  const r = ACTIONS[el.dataset.act](el);
  if (r !== false && r !== 'vue') sauver();
  rendre();
}

function importer(fichier) {
  if (!fichier) return;
  const lecteur = new FileReader();
  lecteur.onload = () => {
    try {
      const d = JSON.parse(lecteur.result);
      if (typeof d !== 'object' || !Array.isArray(d.membres)) throw new Error();
      if (!confirm('Remplacer toutes les données actuelles par ce fichier ?')) return;
      etat = { ...defaut(), ...d };
      sauver();
      rendre();
    } catch { alert('Fichier invalide.'); }
  };
  lecteur.readAsText(fichier);
}

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
    alert(`${ajoutes} opération(s) importée(s), ${ignores} ignorée(s) (doublons ou lignes illisibles).`);
  };
  lecteur.readAsText(fichier);
}

document.getElementById('membreActif').hidden = true;
rendre();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
