// ---------- Date, heure et météo du jour (Open-Meteo, lu via le connecteur Firecrawl ; ville et relevés restent sur l'appareil) ----------
const WMO = c => c === 0 ? ['Ciel dégagé', 'soleil'] : c === 1 ? ['Plutôt dégagé', 'soleil'] : c === 2 ? ['Éclaircies', 'eclaircie'] : c === 3 ? ['Couvert', 'nuage']
  : c === 45 || c === 48 ? ['Brouillard', 'brume'] : c >= 51 && c <= 57 ? ['Bruine', 'pluie'] : c >= 61 && c <= 67 ? ['Pluie', 'pluie'] : c >= 71 && c <= 77 || c === 85 || c === 86 ? ['Neige', 'neige']
  : c >= 80 && c <= 82 ? ['Averses', 'pluie'] : c >= 95 ? ['Orage', 'orage'] : ['Variable', 'nuage'];
const NUAGE = '<path d="M7 18h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.2 4.4 4.4 0 0 0 7 18z"/>';
const SOLEIL = (cx, cy, r, rayons = true) => `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="#d98a1d" fill="#f4c25a" fill-opacity=".55"/>${rayons ? [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path stroke="#d98a1d" d="M${cx + Math.cos(a * Math.PI / 180) * (r + 2.5)} ${cy + Math.sin(a * Math.PI / 180) * (r + 2.5)}L${cx + Math.cos(a * Math.PI / 180) * (r + 5)} ${cy + Math.sin(a * Math.PI / 180) * (r + 5)}"/>`).join('') : ''}`;
const ICO_METEO = {
  soleil: SOLEIL(12, 12, 4.5), eclaircie: SOLEIL(8, 8, 3.2, false) + '<g transform="translate(1 2)">' + NUAGE + '</g>', nuage: NUAGE,
  brume: NUAGE + '<path d="M5 20.5h14M8 22.5h8"/>', pluie: NUAGE + '<path stroke="#2878b5" d="M8 20l-1 2.5M12 20l-1 2.5M16 20l-1 2.5"/>', neige: NUAGE + '<path d="M8 21h.01M12 22h.01M16 21h.01"/>',
  orage: NUAGE + '<path stroke="#d98a1d" d="M12.5 17.5l-2 3h3l-2 3"/>',
};
const icoMeteo = (code, px = 44) => `<svg viewBox="0 0 24 24" width="${px}" height="${px}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO_METEO[WMO(code)[1]]}</svg>`;
const meteoCfg = () => etat.meteo || (etat.meteo = {});
let meteoEnCours = false, meteoErreur = null;
const ERR_METEO = {
  server_not_connected: 'Connecteur Firecrawl non connecté (claude.ai, Réglages, Connecteurs).', needs_reauth: 'Reconnectez Firecrawl dans claude.ai, Réglages, Connecteurs.',
  not_granted: 'Accès à Firecrawl refusé : autorisez-le pour afficher la météo.', approval_required: 'Autorisez l’accès à Firecrawl pour afficher la météo.', blocked_by_policy: 'Accès à Firecrawl bloqué par votre organisation.',
  tool_error: 'Firecrawl a refusé la demande (crédits épuisés ou service indisponible).', introuvable: 'Ville introuvable : essayez avec le nom seul (ex. Lyon).', format: 'Réponse météo illisible. Réessayez plus tard.',
};
function jsonDeMarkdown(res) {
  let p = res && res.payload;
  if (typeof p === 'string') { try { const o = JSON.parse(p); p = o; } catch { /* texte brut */ } }
  const md = typeof p === 'string' ? p : (p && (p.markdown || (p.data && p.data.markdown))) || '';
  const a = md.indexOf('{'), b = md.lastIndexOf('}');
  if (a < 0 || b < a) throw { code: 'format' };
  try { return JSON.parse(md.slice(a, b + 1)); } catch { throw { code: 'format' }; }
}
async function lireWeb(mcp, url) { return jsonDeMarkdown(await mcp.callTool('Firecrawl', 'firecrawl_scrape', { url, formats: ['markdown'], maxAge: 0 }, { cache: false })); }
async function majMeteo(manuel) {
  const c = meteoCfg();
  if (meteoEnCours || (!c.ville && !c.lat)) return;
  let mcp = null;
  try { mcp = window.claude && window.claude.use ? await window.claude.use('mcp') : null; } catch { mcp = null; }
  if (!mcp) { if (manuel) info('Météo indisponible ici : ouvrez l’application depuis votre compte Claude.'); return; }
  meteoEnCours = true; meteoErreur = null; rendreSiPossible();
  try {
    if (!c.lat) { // géocodage : une seule fois par ville
      const g = await lireWeb(mcp, `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(c.ville)}&count=1&language=fr&format=json`);
      const r = g.results && g.results[0];
      if (!r) throw { code: 'introuvable' };
      c.lat = r.latitude; c.lng = r.longitude; c.nom = r.name + (r.admin1 && r.admin1 !== r.name ? ', ' + r.admin1 : '');
    }
    const w = await lireWeb(mcp, `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`);
    if (!w.current || !w.daily || !Array.isArray(w.daily.time)) throw { code: 'format' };
    c.cur = { t: w.current.temperature_2m, app: w.current.apparent_temperature, code: w.current.weather_code, vent: w.current.wind_speed_10m, jour: w.current.is_day };
    c.jours = w.daily.time.map((d, i) => ({ date: d, code: w.daily.weather_code[i], max: w.daily.temperature_2m_max[i], min: w.daily.temperature_2m_min[i], pluie: w.daily.precipitation_probability_max[i] }));
    c.maj = Date.now();
    ecrireLocal();
    if (manuel) info('Météo actualisée.');
  } catch (e) { meteoErreur = (e && e.code) || 'inconnue'; if (manuel) info(ERR_METEO[meteoErreur] || 'Impossible de charger la météo.'); }
  meteoEnCours = false; rendreSiPossible();
}
const deg = n => (n == null ? '–' : Math.round(n) + '°');
function conseilMeteo(c) {
  const j = c.jours && c.jours[0]; if (!c.cur || !j) return '';
  const [lib] = WMO(c.cur.code), pluie = j.pluie >= 50 || ['pluie', 'orage'].includes(WMO(c.cur.code)[1]);
  const course = typeof prevuesLe === 'function' && membresSport && membresSport().some(m => prevuesLe(m.id, aujourdhui()).some(x => x.type === 'course'));
  if (pluie) return course ? 'Pluie probable : séance de course à décaler ou à abriter.' : 'Pluie probable : prévoyez un parapluie.';
  if (c.cur.t <= 5) return 'Il fait froid : couvrez bien les enfants.';
  if (j.max >= 28) return 'Forte chaleur : hydratez-vous, évitez le sport en milieu de journée.';
  return course && lib && j.max < 24 ? 'Bonnes conditions pour la séance de course.' : '';
}
function blocMeteo() {
  const c = meteoCfg(), now = new Date(), hh = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const tete = `<div class="mt-haut"><div class="mt-horloge"><b class="mt-heure" data-horloge>${hh}</b><span class="mt-date" data-datejour>${esc(fmtLong(aujourdhui()))}</span></div>`;
  if (!c.cur) {
    const msg = meteoEnCours ? 'Chargement de la météo…' : meteoErreur ? (ERR_METEO[meteoErreur] || 'Météo indisponible.') : c.ville || c.lat ? 'Météo en attente…' : 'Ajoutez votre ville pour voir la météo.';
    return `<section class="carte meteo">${tete}</div><p class="mut">${esc(msg)}</p><div class="rangee"><button class="btn sec" data-act="ouvrir" data-sheet="meteo-ville">${c.ville ? 'Changer de ville' : 'Choisir ma ville'}</button>${c.ville || c.lat ? '<button class="btn" data-act="meteo-maj">Réessayer</button>' : ''}</div></section>`;
  }
  const [lib] = WMO(c.cur.code), j0 = c.jours[0], suite = c.jours.slice(1, 3), tip = conseilMeteo(c);
  return `<section class="carte meteo">${tete}<div class="mt-now"><span class="mt-ico">${icoMeteo(c.cur.code, 52)}</span><b class="mt-temp">${deg(c.cur.t)}</b></div></div>
    <p class="mt-lib">${esc(lib)} · ressenti ${deg(c.cur.app)}</p>
    <div class="mt-puces"><span>↓ ${deg(j0.min)}</span><span>↑ ${deg(j0.max)}</span><span>Pluie ${j0.pluie == null ? '–' : j0.pluie + ' %'}</span><span>Vent ${Math.round(c.cur.vent || 0)} km/h</span></div>
    <ul class="mt-jours">${suite.map(j => `<li>${icoMeteo(j.code, 26)}<span>${esc(JOURS[(parse(j.date).getDay() + 6) % 7].slice(0, 3))}</span><b>${deg(j.max)}</b><small>${deg(j.min)}</small></li>`).join('')}</ul>
    ${tip ? `<p class="mt-conseil">${esc(tip)}</p>` : ''}
    <div class="mt-pied"><small>${esc(c.nom || c.ville || 'Ma position')} · ${meteoEnCours ? 'actualisation…' : 'actualisé à ' + heureCourte(c.maj)}${meteoErreur ? ' · ' + esc(ERR_METEO[meteoErreur] || 'échec') : ''}</small>
      <button class="icone" data-act="meteo-maj" aria-label="Actualiser la météo" title="Actualiser">↻</button><button class="icone" data-act="ouvrir" data-sheet="meteo-ville" aria-label="Changer de ville" title="Changer de ville">⚙</button></div></section>`;
}
SHEETS['meteo-ville'] = () => ({ titre: 'Ville pour la météo', corps: `<form class="formulaire" data-form="meteo-ville"><input type="hidden" name="pos" value="">
  ${fld('Ville', `<input name="ville" required autocomplete="address-level2" value="${esc(meteoCfg().ville || '')}" placeholder="Lyon">`)}
  <button type="button" class="btn sec" data-act="geoloc-meteo">Me localiser</button><small id="geoMeteo">La localisation automatique n’est pas toujours autorisée dans cette fenêtre : saisissez alors votre ville.</small>
  <small>La ville reste sur cet appareil. La météo est lue sur Open-Meteo (1 crédit Firecrawl par actualisation, toutes les 30 min environ).</small>
  <button class="btn plein">Enregistrer</button></form>` });
FORMS['meteo-ville'] = f => {
  const c = meteoCfg(), v = f.ville.value.trim(), pos = f.pos.value;
  Object.keys(c).forEach(k => delete c[k]);
  c.ville = v;
  if (pos) { const [la, lo] = pos.split(',').map(Number); c.lat = la; c.lng = lo; c.nom = 'Ma position'; }
  meteoErreur = null; setTimeout(() => majMeteo(true), 30);
};
ACTIONS['geoloc-meteo'] = el => {
  const f = el.closest('form'), i = document.getElementById('geoMeteo');
  if (!navigator.geolocation) { if (i) i.textContent = 'Localisation indisponible : saisissez votre ville.'; return false; }
  if (i) i.textContent = 'Localisation en cours…';
  navigator.geolocation.getCurrentPosition(
    pos => { if (!f) return; f.elements.pos.value = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`; f.elements.ville.value = 'Ma position'; if (i) i.textContent = 'Position détectée.'; },
    () => { if (i) i.textContent = 'Localisation refusée ou indisponible ici : saisissez votre ville.'; }, { timeout: 8000, maximumAge: 300000 });
  return false;
};
ACTIONS['meteo-maj'] = () => { meteoErreur = null; majMeteo(true); return 'vue'; };
function autoMeteo() { const c = meteoCfg(); if (document.hidden || meteoEnCours || (!c.ville && !c.lat) || (meteoErreur && meteoErreur !== 'format')) return; if (Date.now() - (c.maj || 0) > 30 * 60 * 1000) majMeteo(false); }
function tickHorloge() {
  const n = new Date(), hh = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  document.querySelectorAll('[data-horloge]').forEach(e => { if (e.textContent !== hh) e.textContent = hh; });
  const d = fmtLong(aujourdhui()); document.querySelectorAll('[data-datejour]').forEach(e => { if (e.textContent !== d) e.textContent = d; });
}
setInterval(tickHorloge, 15000);
setTimeout(autoMeteo, 2500);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { tickHorloge(); setTimeout(autoMeteo, 600); } });
setInterval(autoMeteo, 10 * 60 * 1000);
