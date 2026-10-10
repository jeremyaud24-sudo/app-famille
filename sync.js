'use strict';
// Synchronisation des données partagées de la famille entre appareils, via la capacité « db » de l'artifact.
// Partagé : membres, courses, tâches, événements, repas.
// Jamais envoyé : bourse, prêts, budget, patrimoine, membre actif (restent sur l'appareil).

const SYNC_COLLS = { membres: ['f_membres', 'asc'], taches: ['f_taches', 'asc'], events: ['f_events', 'asc'], courses: ['f_courses', 'desc'], repas: ['f_repas', 'asc'] };

const stable = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x)
  ? Object.fromEntries(Object.entries(x).filter(([, y]) => y !== undefined).sort(([a], [b]) => (a < b ? -1 : 1))) : x));

function creerSync({ db, etat, apres, ecrireLocal, statutChange }) {
  const connu = {}, premiers = new Set(), abos = [];
  let statut = 'connexion', code = '', ecriture = true, timer = null, enCours = false, rejouer = false, actif = true;
  Object.keys(SYNC_COLLS).forEach(k => { connu[k] = new Map(); });

  const liste = k => (k === 'repas'
    ? Object.entries(etat().repas || {}).filter(([, v]) => v && (v.midi || v.soir)).map(([d, v]) => ({ id: d, midi: v.midi || '', soir: v.soir || '' }))
    : (etat()[k] || []));
  const trier = (k, l) => [...l].sort((a, b) => (SYNC_COLLS[k][1] === 'desc' ? (a.id < b.id ? 1 : -1) : (a.id < b.id ? -1 : 1)));
  const maj = s => { if (s !== statut) { statut = s; statutChange && statutChange(); } };

  // Fusionne l'état distant d'une collection dans l'état local
  function appliquer(k, R) {
    const local = liste(k), locMap = new Map(local.map(x => [x.id, x])), out = [];
    for (const [id, d] of R) {
      const l = locMap.get(id), cs = connu[k].get(id), ds = stable(d);
      if (l) {
        if (cs !== undefined && stable(l) !== cs) out.push(l);            // modification locale en attente : on la garde
        else { out.push(JSON.parse(ds)); connu[k].set(id, ds); }
      } else if (cs === undefined) { out.push(JSON.parse(ds)); connu[k].set(id, ds); } // nouveau côté distant
      // sinon : supprimé localement, suppression en attente d'envoi
    }
    for (const l of local) {
      if (R.has(l.id)) continue;
      if (connu[k].has(l.id) && stable(l) === connu[k].get(l.id)) connu[k].delete(l.id); // supprimé à distance
      else { connu[k].delete(l.id); out.push(l); }                                        // nouveau ou modifié localement : sera envoyé
    }
    const nouveau = trier(k, out);
    if (stable(trier(k, local)) === stable(nouveau)) return false;
    if (k === 'repas') etat().repas = Object.fromEntries(nouveau.map(x => [x.id, { midi: x.midi, soir: x.soir }]));
    else etat()[k] = nouveau;
    ecrireLocal();
    return true;
  }

  async function pousser() {
    timer = null;
    if (!actif || !ecriture) return;
    if (enCours) { rejouer = true; return; }
    enCours = true;
    try {
      for (const [k, [c]] of Object.entries(SYNC_COLLS)) {
        if (!premiers.has(k)) continue;
        const items = liste(k), ids = new Set(items.map(x => x.id));
        for (const it of items) {
          const s = stable(it);
          if (connu[k].get(it.id) !== s) { await db.collection(c).doc(it.id).set(JSON.parse(s)); connu[k].set(it.id, s); }
        }
        for (const id of [...connu[k].keys()]) {
          if (!ids.has(id)) { await db.collection(c).doc(id).delete(); connu[k].delete(id); }
        }
      }
      code = ''; maj('ok');
    } catch (e) {
      if (e && e.code === 'invalid_argument') { ecriture = false; maj('lecture'); }
      else { code = (e && e.code) || 'inconnue'; maj('erreur'); rejouer = false; timer = setTimeout(pousser, 8000); }
    } finally { enCours = false; }
    if (rejouer) { rejouer = false; planifier(0); }
  }
  function planifier(ms = 400) {
    if (!actif || !ecriture) return;
    clearTimeout(timer);
    timer = setTimeout(pousser, ms);
  }

  Object.entries(SYNC_COLLS).forEach(([k, [c]]) => {
    abos.push(db.collection(c).onSnapshot(snap => {
      if (!actif) return;
      const R = new Map(snap.docs.map(d => [d.id, d.data()]));
      const change = appliquer(k, R);
      const premier = !premiers.has(k);
      premiers.add(k);
      if (premiers.size === Object.keys(SYNC_COLLS).length && premier) { maj(ecriture ? 'ok' : 'lecture'); planifier(0); }
      if (change) apres();
    }, e => { code = (e && e.code) || 'inconnue'; maj('erreur'); }));
  });

  return {
    planifier, pousser,
    statut: () => ({ statut, code, ecriture }),
    arreter() { actif = false; clearTimeout(timer); abos.forEach(u => { try { u(); } catch {} }); },
  };
}

// ---------- Branchement navigateur ----------
let SYNC = null, syncStatut = 'absent', syncCode = '';
const syncPousser = () => { if (SYNC) SYNC.planifier(); };
const syncDesactive = () => { try { return localStorage.getItem('app-famille-sync') === 'off'; } catch { return false; } };

async function demarrerSync() {
  if (!(window.claude && window.claude.use)) { syncStatut = 'absent'; return; }
  let ns = null;
  try { ns = await window.claude.use('db'); } catch { ns = null; }
  if (!ns) { syncStatut = 'indisponible'; rendreSiPossible(); return; }
  if (syncDesactive()) { syncStatut = 'pause'; SYNC = null; rendreSiPossible(); return; }
  syncStatut = 'connexion';
  SYNC = creerSync({
    db: ns, etat: () => etat, apres: rendreSiPossible, ecrireLocal,
    statutChange: () => { const s = SYNC && SYNC.statut(); if (s) { syncStatut = s.statut; syncCode = s.code; } rendreSiPossible(); },
  });
}
function syncCarte() {
  if (syncStatut === 'absent') return '';
  const T = {
    connexion: 'Connexion en cours…', ok: 'Actif : les modifications apparaissent sur les autres appareils.',
    lecture: 'Lecture seule : votre accès ne permet pas de modifier les données partagées. Demandez un accès Contributeur ou Éditeur au propriétaire.',
    erreur: `Problème de synchronisation (${esc(syncCode)}). Nouvel essai automatique.`, pause: 'Désactivée sur cet appareil.',
    indisponible: 'Non disponible avec ce compte ou cet affichage.',
  };
  return `<section class="carte"><div class="carte-tete"><h2>Synchronisation</h2><span class="pill ${syncStatut === 'ok' ? 'ok' : syncStatut === 'erreur' ? 'bad' : ''}">${syncStatut === 'ok' ? 'Active' : syncStatut === 'pause' ? 'Pause' : syncStatut === 'lecture' ? 'Lecture' : syncStatut === 'erreur' ? 'Erreur' : '…'}</span></div>
    <p class="mut">${T[syncStatut] || ''}</p>
    <small>Partagé entre appareils : membres, courses, tâches, agenda, repas. Reste sur chaque appareil : bourse, prêts, budget, patrimoine et choix du membre actif.</small>
    ${syncStatut === 'ok' || syncStatut === 'erreur' || syncStatut === 'lecture' ? '<button class="btn sec" data-act="sync-toggle">Désactiver sur cet appareil</button>' : syncStatut === 'pause' ? '<button class="btn" data-act="sync-toggle">Activer</button>' : ''}</section>`;
}
if (typeof ACTIONS !== 'undefined') {
  ACTIONS['sync-toggle'] = () => {
    if (SYNC) { SYNC.arreter(); SYNC = null; try { localStorage.setItem('app-famille-sync', 'off'); } catch {} syncStatut = 'pause'; }
    else { try { localStorage.removeItem('app-famille-sync'); } catch {} demarrerSync(); }
    return 'vue';
  };
  demarrerSync();
}
