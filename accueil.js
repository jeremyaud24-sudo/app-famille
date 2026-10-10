'use strict';
// Accueil personnalisable : chaque bloc peut être masqué ou déplacé (réglage propre à l'appareil).

const BLOCS = {
  rappels: ['À ne pas oublier', () => {
    const auj = aujourdhui(), demain = iso(ajouteJours(parse(auj), 1));
    const L = [
      ...etat.taches.filter(t => !t.fait && t.echeance && t.echeance <= auj).map(t => [t.titre, t.echeance < auj ? 'En retard' : 'Aujourd’hui', t.echeance < auj ? 'bad' : 'warn', 'taches']),
      ...evenementsDu(demain).map(e => [e.titre, 'Demain' + (e.heure ? ' ' + e.heure : ''), 'pri', 'agenda']),
      ...(typeof pretsAlertes === 'function' ? pretsAlertes() : []),
      ...(typeof alertesBudget === 'function' ? alertesBudget() : []),
      ...carnetAlertes(), ...cadeauxAlertes(), ...voyageAlertes(),
      ...(typeof planAlertes === 'function' ? planAlertes() : []),
    ];
    return L.length ? `<section class="carte"><h2>À ne pas oublier</h2><ul class="liste">${L.map(([t, tag, cls, v]) => `<li><button class="rang" data-goto="${v}"><span class="rang-txt">${esc(t)}</span><span class="pill ${cls}">${esc(tag)}</span></button></li>`).join('')}</ul></section>` : '';
  }],
  aujourdhui: ['Aujourd’hui', () => {
    const auj = aujourdhui(), evs = evenementsDu(auj), prochains = [];
    for (let i = 1; i <= 30 && prochains.length < 3; i++) { const d = iso(ajouteJours(parse(auj), i)); evenementsDu(d).forEach(e => { if (prochains.length < 3) prochains.push({ ...e, date: d }); }); }
    return `<section class="carte"><div class="carte-tete"><h2>Aujourd’hui</h2><button class="lien" data-goto="agenda">Agenda</button></div>
      ${evs.length ? `<ul class="liste">${evs.map(e => `<li class="rang"><span class="heure">${esc(e.heure || '—')}</span><span class="rang-txt">${esc(e.titre)}</span>${avatar(e.membre)}</li>`).join('')}</ul>`
        : `<p class="vide">Journée libre.<br><button class="btn sec" data-act="ouvrir" data-sheet="event">Ajouter un événement</button></p>`}
      ${prochains.length ? `<small>À venir : ${prochains.map(e => `${fmtDate(e.date)} · ${esc(e.titre)}`).join(' — ')}</small>` : ''}</section>`;
  }],
  tuiles: ['Courses et tâches', () => {
    const f = etat.taches.filter(t => !t.fait).length, a = etat.courses.filter(c => !c.fait).length;
    return `<div class="tuiles"><button class="tuile" data-goto="courses"><span class="tuile-n">${a}</span><span>article${pl(a)} à acheter</span></button>
      <button class="tuile" data-goto="taches"><span class="tuile-n">${f}</span><span>tâche${pl(f)} à faire</span></button></div>`;
  }],
  menu: ['Menu du jour', () => { const r = etat.repas[aujourdhui()] || {};
    return `<button class="carte" data-goto="repas" style="text-align:left"><h2>Au menu aujourd’hui</h2><p><span class="mut">Midi</span> · ${esc(r.midi) || '<span class="mut">à définir</span>'}<br><span class="mut">Soir</span> · ${esc(r.soir) || '<span class="mut">à définir</span>'}</p></button>`; }],
  tresorerie: ['Trésorerie', () => {
    const c = cfgTreso();
    if (c.solde == null) return '';
    const a = alertesTreso()[0], P = projectionTreso();
    return `<button class="carte" data-goto="budget" style="text-align:left"><h2>Trésorerie</h2><div class="bar"><b class="score">${eur(c.solde)}</b>${a ? `<span class="pill ${a[0]}">${a[0] === 'ok' ? 'Sans découvert' : a[0] === 'warn' ? 'Solde bas prévu' : 'Découvert prévu'}</span>` : ''}</div>
      ${P ? `<small>Point le plus bas sur 45 jours : ${eur(P.bas.v[0])} le ${fmtDate(P.bas.label)}</small>` : ''}</button>`;
  }],
  prets: ['Prêts', () => {
    if (!etat.prets.length) return '';
    return `<button class="carte" data-goto="prets" style="text-align:left"><h2>Prêts</h2>${etat.prets.map(p => { const E = etatPret(p); return E.ok ? `<div class="kv"><span>${esc(p.nom)}</span><b>${eur(E.crd)}</b></div><small>Fin ${fmtMois(E.fin)} · ${E.restant.length} échéances</small>` : ''; }).join('')}</button>`;
  }],
  portefeuille: ['Portefeuille', () => {
    if (!etat.pf.length) return '';
    const pf = pfCalc();
    return `<button class="carte" data-goto="bourse" style="text-align:left"><h2>Portefeuille</h2><div class="bar"><b class="score">${eur(pf.total)}</b>${pillPl(pf.pl, pf.investi ? pf.pl / pf.investi * 100 : 0)}</div></button>`;
  }],
  patrimoine: ['Patrimoine net', () => {
    const P = patrimoineCalc();
    return P.totalA || P.dettes ? `<button class="carte" data-goto="patrimoine" style="text-align:left"><h2>Patrimoine net</h2><div class="bar"><b class="score">${eur(P.net)}</b><small>Actifs ${eur(P.totalA)}</small></div></button>` : '';
  }],
  voyage: ['Prochain voyage', () => {
    const v = voyageProchain();
    if (!v) return '';
    const d = diffJours(aujourdhui(), v.debut), n = v.checklist.filter(c => c.fait).length;
    return `<button class="carte" data-goto="voyages" style="text-align:left"><h2>${esc(v.nom)}</h2><div class="bar"><b class="score">${d > 0 ? 'J-' + d : 'En cours'}</b><small>Checklist ${n}/${v.checklist.length}</small></div></button>`;
  }],
  anniv: ['Anniversaires', () => {
    const a = anniversaires(30);
    return a.length ? `<button class="carte" data-goto="cadeaux" style="text-align:left"><h2>Anniversaires</h2>${a.map(x => `<div class="kv"><span>${esc(x.m.nom)}</span><b>${x.dans === 0 ? 'Aujourd’hui' : 'Dans ' + x.dans + ' j'}</b></div>`).join('')}</button>` : '';
  }],
  objectifs: ['Objectifs d’épargne', () => etat.objectifs.length ? `<button class="carte" data-goto="budget" style="text-align:left"><h2>Objectifs d’épargne</h2>${etat.objectifs.slice(0, 3).map(o => `<div><div class="bar"><span>${esc(o.nom)}</span><span class="num">${eur(o.actuel || 0)} / ${eur(o.cible)}</span></div><div class="jauge"><i style="width:${o.cible ? Math.min(100, (o.actuel || 0) / o.cible * 100) : 0}%;background:var(--ok)"></i></div></div>`).join('')}</button>` : ''],
};
const BLOCS_ORDRE = Object.keys(BLOCS);
function accueilCfg() {
  const c = etat.accueil = { ordre: [], masques: [], ...(etat.accueil || {}) };
  c.ordre = [...c.ordre.filter(i => BLOCS_ORDRE.includes(i)), ...BLOCS_ORDRE.filter(i => !c.ordre.includes(i))];
  return c;
}
VUES.accueil = function () {
  const c = accueilCfg();
  return `${etat.membres.length ? '' : `<section class="carte"><h2>Bienvenue</h2><p class="mut">Créez votre foyer pour partager courses, tâches et agenda. Chaque membre a sa couleur.</p><button class="btn" data-act="ouvrir" data-sheet="membre">Ajouter un premier membre</button></section>`}
    ${etat.membres.filter(m => m.naissance && m.naissance.slice(5) === aujourdhui().slice(5)).map(m => `<section class="carte"><p><b>Joyeux anniversaire ${esc(m.nom)} !</b></p></section>`).join('')}
    ${c.ordre.filter(i => !c.masques.includes(i)).map(i => { try { return BLOCS[i][1](); } catch { return ''; } }).join('')}
    <button class="lien" data-act="ouvrir" data-sheet="accueil-perso" style="align-self:center">Personnaliser l’accueil</button>`;
};
SHEETS['accueil-perso'] = () => {
  const c = accueilCfg();
  return { titre: 'Personnaliser l’accueil', corps: `<p class="mut">Choisissez les blocs affichés et leur ordre. Ce réglage reste sur cet appareil.</p>
    <ul class="liste">${c.ordre.map((i, k) => `<li class="rang"><label class="rang-main"><input type="checkbox" class="coche" data-act="bloc-toggle" data-id="${i}"${c.masques.includes(i) ? '' : ' checked'}><span class="rang-txt">${esc(BLOCS[i][0])}</span></label>
      <button class="icone" data-act="bloc-haut" data-id="${i}" aria-label="Monter ${esc(BLOCS[i][0])}"${k === 0 ? ' disabled' : ''}>↑</button><button class="icone" data-act="bloc-bas" data-id="${i}" aria-label="Descendre ${esc(BLOCS[i][0])}"${k === c.ordre.length - 1 ? ' disabled' : ''}>↓</button></li>`).join('')}</ul>
    <button class="btn sec plein" data-act="bloc-reset">Rétablir l’ordre d’origine</button>` };
};
const deplacer = (id, s) => { const c = accueilCfg(), i = c.ordre.indexOf(id), j = i + s; if (j >= 0 && j < c.ordre.length) [c.ordre[i], c.ordre[j]] = [c.ordre[j], c.ordre[i]]; };
ACTIONS['bloc-toggle'] = el => { const c = accueilCfg(); c.masques = el.checked ? c.masques.filter(x => x !== el.dataset.id) : [...c.masques, el.dataset.id]; ouvrirFeuille('accueil-perso'); };
ACTIONS['bloc-haut'] = el => { deplacer(el.dataset.id, -1); ouvrirFeuille('accueil-perso'); };
ACTIONS['bloc-bas'] = el => { deplacer(el.dataset.id, 1); ouvrirFeuille('accueil-perso'); };
ACTIONS['bloc-reset'] = () => { etat.accueil = { ordre: [], masques: [] }; ouvrirFeuille('accueil-perso'); };
rendre();
