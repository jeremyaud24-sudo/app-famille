// ---------- Mise à jour automatique des cours (Yahoo Finance via le connecteur Firecrawl du propriétaire) ----------
// Une seule requête groupée par actualisation : 5 crédits Firecrawl par ligne, plus 5 pour le taux de change.
const SYMBOLES_CONNUS = { HMI: 'RMS.PA' }; // ticker du courtier → symbole Yahoo Finance
const symYahoo = p => String(p.sym || SYMBOLES_CONNUS[p.ticker] || p.ticker).trim().toUpperCase();
let coursEnCours = false, coursErreur = null, coursDernier = null;
const autoCoursActif = () => cfg().autoCours !== false;
const ERR_COURS = {
  server_not_connected: 'Le connecteur Firecrawl n’est pas connecté : ajoutez-le dans claude.ai, Réglages, Connecteurs.',
  needs_reauth: 'Le connecteur Firecrawl demande une nouvelle connexion (claude.ai, Réglages, Connecteurs).',
  not_granted: 'Autorisation refusée : acceptez l’accès à Firecrawl pour actualiser les cours.',
  blocked_by_policy: 'L’accès à Firecrawl est bloqué par la politique de votre organisation.',
  approval_required: 'Autorisez l’accès à Firecrawl pour actualiser les cours.',
  rate_limited: 'Trop de demandes en peu de temps. Réessayez dans quelques minutes.',
  tool_error: 'Firecrawl a refusé la demande (crédits épuisés ou service indisponible).',
};
const heureCourte = ms => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
function lireCotations(payload) {
  let p = payload;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch { return null; } }
  const a = p && ((p.data && p.data.alexandria) || p.alexandria);
  return Array.isArray(a) ? a : null;
}
async function majCours(manuel) {
  if (coursEnCours || !etat.pf || !etat.pf.length) return;
  let mcp = null;
  try { mcp = window.claude && window.claude.use ? await window.claude.use('mcp') : null; } catch { mcp = null; }
  if (!mcp) { if (manuel) info('Actualisation indisponible ici : ouvrez l’application depuis votre compte Claude.'); return; }
  coursEnCours = true; coursErreur = null; rendreSiPossible();
  try {
    const syms = [...new Set(etat.pf.map(symYahoo))], liste = [...syms, 'EURUSD=X'];
    const res = await mcp.callTool('Firecrawl', 'firecrawl_scrape', { alexandria: liste.map(s => ({ provider: 'finance-yahoo-com', capability: 'equities/quote', options: { symbol: s } })) }, { cache: false });
    const arr = lireCotations(res && res.payload);
    if (!arr) throw { code: 'format' };
    const Q = {};
    liste.forEach((s, i) => { const d = arr[i] && arr[i].data; if (d && typeof d.price === 'number' && d.price > 0) Q[s] = d; });
    const fx = Q['EURUSD=X'] && Q['EURUSD=X'].price > 0.5 && Q['EURUSD=X'].price < 2 ? Q['EURUSD=X'].price : null; // dollars pour 1 €
    if (fx) cfg().eurusd = Math.round(fx * 10000) / 10000;
    const taux = cfg().eurusd || 1, ok = [], ko = [], suspects = [];
    etat.pf.forEach(p => {
      const q = Q[symYahoo(p)], dev = p.devise === 'USD' ? 'USD' : 'EUR';
      if (!q) { ko.push(p.ticker); return; }
      let v;
      if (q.currency === dev) v = q.price; else if (q.currency === 'USD' && dev === 'EUR') v = q.price / taux; else if (q.currency === 'EUR' && dev === 'USD') v = q.price * taux; else { ko.push(p.ticker); return; }
      v = Math.round(v * 10000) / 10000;
      if (p.cours > 0 && Math.abs(v / p.cours - 1) > 0.35) { suspects.push(`${p.ticker} (${q.name || symYahoo(p)})`); return; }
      p.cours = v; p.maj = aujourdhui(); p.nomY = q.name || ''; p.jourPc = typeof q.change_percent === 'number' ? q.change_percent * 100 : null;
      ok.push(p.ticker);
    });
    const c = cfg();
    c.majAuto = Date.now(); c.majFerme = Object.values(Q).every(q => q.market_state === 'CLOSED');
    coursDernier = { ok, ko, suspects };
    sauver();
    if (manuel) info(ok.length ? `${ok.length} cours mis à jour.` : 'Aucun cours n’a pu être mis à jour.');
  } catch (e) { coursErreur = (e && e.code) || 'inconnue'; if (manuel) info(ERR_COURS[coursErreur] || 'L’actualisation a échoué. Réessayez plus tard.'); }
  coursEnCours = false; rendreSiPossible();
}
// Déclenchement automatique : toutes les 30 min marché ouvert, toutes les 6 h marché fermé (week-end, nuit)
function autoCours() {
  if (document.hidden || !autoCoursActif() || coursEnCours || (coursErreur && coursErreur !== 'format')) return;
  const c = cfg(), age = Date.now() - (c.majAuto || 0);
  if (age > (c.majFerme ? 6 : 0.5) * 36e5) majCours(false);
}
function tuileCours(vieux) {
  const c = cfg();
  if (!autoCoursActif()) return `<section class="fin-tuile"><span class="t-lbl">Cours</span><span class="t-ligne"><b class="t-nom">${vieux ? vieux + ' ligne' + pl(vieux) + ' à mettre à jour' : 'À jour'}</b></span><button class="btn plein" data-act="cours-maj">Actualiser les cours maintenant</button><button class="btn sec plein" data-act="ouvrir" data-sheet="cours">Saisir à la main</button></section>`;
  const R = coursDernier;
  const etatTxt = coursEnCours ? 'Actualisation…' : coursErreur ? 'Échec de l’actualisation' : c.majAuto ? `Actualisé à ${heureCourte(c.majAuto)}${new Date(c.majAuto).toDateString() === new Date().toDateString() ? '' : ' · ' + fmtDate(iso(new Date(c.majAuto)))}` : 'Pas encore actualisé';
  const det = coursErreur ? (ERR_COURS[coursErreur] || 'Une erreur est survenue. Touchez pour réessayer.') : R && (R.suspects.length || R.ko.length)
    ? `${R.suspects.length ? 'Écart suspect, non appliqué : ' + R.suspects.map(esc).join(', ') + '. Vérifiez le symbole de la ligne. ' : ''}${R.ko.length ? 'Introuvable : ' + R.ko.map(esc).join(', ') + '.' : ''}`
    : `Cours Yahoo Finance, différés d’environ 15 min${c.majFerme ? ' · marchés fermés' : ''}. Touchez pour actualiser.`;
  return `<section class="fin-tuile"><span class="t-lbl">Cours · mise à jour automatique</span><span class="t-ligne"><b class="t-nom">${etatTxt}</b></span><span class="t-bas">${det}</span>
    <button class="btn plein" data-act="cours-maj"${coursEnCours ? ' disabled aria-busy="true"' : ''}>${coursEnCours ? 'Actualisation…' : 'Actualiser les cours maintenant'}</button></section>`;
}
ACTIONS['cours-maj'] = () => { coursErreur = null; majCours(true); return 'vue'; };
ACTIONS['cours-auto'] = el => { cfg().autoCours = el.checked; if (el.checked) { coursErreur = null; setTimeout(autoCours, 50); } };
function reglageCours() {
  const c = cfg();
  return `<section class="carte"><h2>Cours automatiques</h2>
    <label class="rang-main"><input type="checkbox" class="coche" data-act="cours-auto"${autoCoursActif() ? ' checked' : ''}><span class="rang-txt">Actualiser les cours automatiquement<small>Toutes les 30 min marché ouvert, 6 h marché fermé, à l’ouverture de l’app</small></span></label>
    <div class="kv"><span>Dernière actualisation</span><b>${c.majAuto ? `${fmtDate(iso(new Date(c.majAuto)))} ${heureCourte(c.majAuto)}` : 'jamais'}</b></div>
    <div class="kv"><span>Coût par actualisation</span><b>${5 * (new Set(etat.pf.map(symYahoo)).size + 1)} crédits Firecrawl</b></div>
    <button class="btn sec plein" data-act="cours-maj">Actualiser maintenant</button>
    <small>Source : Yahoo Finance via votre connecteur Firecrawl (5 crédits par ligne et 5 pour le taux de change). Les cours en dollars sont convertis en euros. Un écart de plus de 35 % avec l’ancien cours n’est pas appliqué : vérifiez alors le symbole de la ligne.</small></section>`;
}
setTimeout(autoCours, 3500);
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(autoCours, 800); });
setInterval(autoCours, 10 * 60 * 1000);
