// Verrouillage par code + chiffrement des données locales (AES-GCM, clé dérivée du code par PBKDF2).
// Charge ensuite l'application (liste dans data-scripts). Aucune donnée ne quitte l'appareil.
(function () {
  'use strict';
  const SCRIPTS = (document.currentScript.dataset.scripts || '').split(',').filter(Boolean);
  const PROT = ['app-famille-v1', 'app-famille-natif'];           // clés localStorage chiffrées
  const META = 'app-famille-verrou', ESSAIS = 'app-famille-verrou-essais';
  const ITER = 310000, DELAI_VERROU = 2 * 60 * 1000;               // verrouillage auto : 2 min en arrière-plan
  const get = Storage.prototype.getItem, set = Storage.prototype.setItem, del = Storage.prototype.removeItem;
  const mem = Object.create(null);
  let cle = null, meta = null, attente = null;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = u => btoa(String.fromCharCode(...new Uint8Array(u))), deb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const lsGet = k => { try { return get.call(localStorage, k); } catch { return null; } };
  const lsSet = (k, v) => { try { set.call(localStorage, k, v); } catch { /* quota */ } };

  async function deriver(code, sel, iter) {
    const base = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sel, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function chiffrer(k, texte) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    return 'v1:' + b64(iv) + ':' + b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(texte)));
  }
  async function dechiffrer(k, blob) {
    const [, iv, ct] = blob.split(':');
    return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deb64(iv) }, k, deb64(ct)));
  }
  const estChiffre = v => typeof v === 'string' && v.startsWith('v1:');

  // Les clés protégées vivent en mémoire ; chaque écriture est chiffrée puis stockée.
  function persister(k) {
    clearTimeout(persister.t[k]);
    persister.t[k] = setTimeout(async () => { if (cle && k in mem) lsSet(k, await chiffrer(cle, mem[k])); }, 120);
  }
  persister.t = {};
  async function vider() { await Promise.all(Object.keys(persister.t).map(k => (k in mem && cle ? chiffrer(cle, mem[k]).then(v => lsSet(k, v)) : null))); }
  Object.defineProperty(Storage.prototype, 'getItem', { configurable: true, writable: true, value: function (k) { return this === localStorage && PROT.includes(k) ? (k in mem ? mem[k] : null) : get.call(this, k); } });
  Object.defineProperty(Storage.prototype, 'setItem', { configurable: true, writable: true, value: function (k, v) { if (this === localStorage && PROT.includes(k)) { mem[k] = String(v); persister(k); } else set.call(this, k, v); } });
  Object.defineProperty(Storage.prototype, 'removeItem', { configurable: true, writable: true, value: function (k) { if (this === localStorage && PROT.includes(k)) { delete mem[k]; del.call(this, k); } else del.call(this, k); } });

  const nbEssais = () => Number(lsGet(ESSAIS) || 0);
  const delaiRestant = () => { const n = nbEssais(), t = Number(lsGet(ESSAIS + '-t') || 0); return n < 3 ? 0 : Math.max(0, t + Math.min(15 * 60, 5 * 2 ** (n - 3)) * 1000 - Date.now()); };

  function ecran(corps) {
    let o = document.getElementById('verrou');
    if (!o) { o = document.createElement('div'); o.id = 'verrou'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); document.body.appendChild(o); }
    o.innerHTML = `<div class="verrou-boite"><svg viewBox="0 0 100 100" width="64" height="64" aria-hidden="true"><rect width="100" height="100" rx="22" fill="#b4522f"/><path d="M22 50L50 26l28 24" fill="none" stroke="#fffaf1" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 46v28h40V46" fill="none" stroke="#fffaf1" stroke-width="7" stroke-linejoin="round"/></svg>${corps}</div>`;
    return o;
  }
  const html = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function ouvrirAvec(code) {
    const k = await deriver(code, deb64(meta.sel), meta.iter);
    if ((await dechiffrer(k, meta.test).catch(() => null)) !== 'ok') return false;
    cle = k;
    for (const p of PROT) { const v = lsGet(p); if (estChiffre(v)) mem[p] = await dechiffrer(cle, v); else if (v != null) { mem[p] = v; persister(p); } }
    return true;
  }
  async function creerCode(code) {
    const sel = crypto.getRandomValues(new Uint8Array(16)), k = await deriver(code, sel, ITER);
    meta = { v: 1, sel: b64(sel), iter: ITER, test: await chiffrer(k, 'ok') };
    lsSet(META, JSON.stringify(meta)); cle = k;
    for (const p of PROT) { const v = lsGet(p); if (v != null && !estChiffre(v)) { mem[p] = v; persister(p); } } // chiffre les données existantes
  }

  function afficherSaisie() {
    const reste = delaiRestant();
    const o = ecran(`<h1>App Famille</h1><p>Entrez votre code pour déverrouiller.</p>
      <form id="vf" autocomplete="off"><input id="vc" type="password" autocomplete="current-password" aria-label="Code" placeholder="Code" ${reste ? 'disabled' : ''} required><button class="btn" ${reste ? 'disabled' : ''}>Déverrouiller</button></form>
      <p id="vm" class="verrou-msg" role="alert">${reste ? 'Trop d’essais : patientez ' + Math.ceil(reste / 1000) + ' s.' : ''}</p>
      <button type="button" class="lien" id="vo">Code oublié ?</button>`);
    const f = o.querySelector('#vf'), m = o.querySelector('#vm');
    if (reste) setTimeout(afficherSaisie, 1000); else o.querySelector('#vc').focus();
    f.addEventListener('submit', async e => {
      e.preventDefault(); m.textContent = 'Vérification…';
      if (await ouvrirAvec(f.vc.value)) { lsSet(ESSAIS, '0'); demarrer(); return; }
      const n = nbEssais() + 1; lsSet(ESSAIS, String(n)); lsSet(ESSAIS + '-t', String(Date.now()));
      afficherSaisie(); document.getElementById('vm').textContent = 'Code incorrect.';
    });
    o.querySelector('#vo').addEventListener('click', () => {
      o.querySelector('.verrou-boite').insertAdjacentHTML('beforeend', `<div class="verrou-oubli"><p><b>Effacer les données de cet appareil ?</b> Elles sont chiffrées avec votre code : sans lui, elles sont irrécupérables. Si vous avez une sauvegarde (Famille › Exporter), vous pourrez l’importer ensuite.</p><button type="button" class="btn danger" id="vx">Tout effacer</button></div>`);
      o.querySelector('#vx').addEventListener('click', () => { [META, ESSAIS, ESSAIS + '-t', ...PROT].forEach(k => del.call(localStorage, k)); location.reload(); });
    });
  }
  function afficherCreation() {
    const aDeja = PROT.some(k => lsGet(k) != null);
    const o = ecran(`<h1>Protéger l’application</h1><p>${aDeja ? 'Vos données actuelles seront chiffrées avec ce code.' : 'Choisissez un code : vos données seront chiffrées avec lui sur cet appareil.'} Préférez une phrase de passe d’au moins 8 caractères. <b>Si vous l’oubliez, les données sont irrécupérables.</b></p>
      <form id="vf" autocomplete="off"><input name="a" type="password" autocomplete="new-password" aria-label="Code" placeholder="Code (6 caractères minimum)" required minlength="6"><input name="b" type="password" autocomplete="new-password" aria-label="Confirmer le code" placeholder="Confirmer le code" required minlength="6"><button class="btn">Activer la protection</button></form><p id="vm" class="verrou-msg" role="alert"></p>`);
    const f = o.querySelector('#vf'), m = o.querySelector('#vm');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (f.a.value !== f.b.value) { m.textContent = 'Les deux codes ne correspondent pas.'; return; }
      if (f.a.value.length < 6) { m.textContent = '6 caractères minimum.'; return; }
      m.textContent = 'Chiffrement…'; await creerCode(f.a.value); demarrer();
    });
    f.a.focus();
  }

  let charge = false;
  async function demarrer() {
    document.getElementById('verrou')?.remove();
    if (charge) return; charge = true;
    for (const src of SCRIPTS) await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.async = false; s.onload = ok; s.onerror = () => ko(new Error(src)); document.body.appendChild(s); });
    window.dispatchEvent(new Event('app-scripts-charges'));
  }
  async function verrouiller() { await vider(); location.reload(); } // la mémoire (clé, données) disparaît avec la page
  async function changer(ancien, nouveau) {
    if (!(await dechiffrer(await deriver(ancien, deb64(meta.sel), meta.iter), meta.test).catch(() => null) === 'ok')) throw new Error('Code actuel incorrect.');
    if (String(nouveau).length < 6) throw new Error('6 caractères minimum.');
    await creerCode(nouveau); await vider();
  }
  window.__verrou = { verrouiller, changer };

  let cache = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cache = Date.now(); vider(); } else if (cle && cache && Date.now() - cache > DELAI_VERROU) location.reload();
  });
  window.addEventListener('pagehide', () => { vider(); });

  if (!crypto || !crypto.subtle) { ecran('<h1>Navigateur non compatible</h1><p>Le chiffrement n’est pas disponible. Ouvrez l’application via une adresse https.</p>'); return; }
  try { meta = JSON.parse(lsGet(META) || 'null'); } catch { meta = null; }
  if (meta && meta.test) afficherSaisie(); else afficherCreation();
})();
