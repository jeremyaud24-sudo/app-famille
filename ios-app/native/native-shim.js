// Pont « app iOS » : remplace les capacités de l'artefact Claude (window.claude) par des appels directs.
//  - user    : l'appareil est toujours « propriétaire »
//  - sample  : API Claude (clé personnelle saisie dans Famille › App iOS)
//  - mcp     : lecture directe d'Open-Meteo (météo) et de Yahoo Finance (cours), sans connecteur
//  - db      : absent → l'app reste locale à l'appareil (pas de synchronisation famille)
// Les requêtes passent par CapacitorHttp (HTTP natif, sans restriction CORS).
(function () {
  'use strict';
  window.__NATIVE = true;
  const CLE = 'app-famille-natif';
  const lire = () => { try { return JSON.parse(localStorage.getItem(CLE) || '{}'); } catch { return {}; } };
  const ecrire = o => { try { localStorage.setItem(CLE, JSON.stringify(o)); } catch { /* stockage indisponible */ } };
  const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  async function http(url, init) {
    const r = await fetch(url, init);
    return { status: r.status, text: await r.text() };
  }

  // ----- sample : Claude -----
  function extraireJson(t) {
    const s = String(t || '').replace(/```(?:json)?/gi, ''), a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b < a) throw { code: 'format', message: 'Réponse non JSON' };
    try { return JSON.parse(s.slice(a, b + 1)); } catch { throw { code: 'format', message: 'JSON illisible' }; }
  }
  async function appelClaude(input, opts) {
    const cfg = lire();
    if (!cfg.cle) throw { code: 'not_granted', message: 'Ajoutez votre clé Claude dans Famille › App iOS.' };
    const messages = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
    let r;
    try {
      r = await http('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: opts && opts.signal,
        headers: { 'content-type': 'application/json', 'x-api-key': cfg.cle, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: cfg.modele || 'claude-sonnet-5-5', max_tokens: 4096, messages }),
      });
    } catch (e) { throw { code: e && e.name === 'AbortError' ? 'cancelled' : 'upstream_error', message: String(e && e.message || e) }; }
    if (r.status === 401 || r.status === 403) throw { code: 'not_granted', message: 'Clé Claude refusée : vérifiez-la dans Famille › App iOS.' };
    if (r.status === 429) throw { code: 'rate_limited', message: 'Trop de demandes.' };
    if (r.status >= 400) throw { code: 'upstream_error', message: 'Erreur ' + r.status };
    let d; try { d = JSON.parse(r.text); } catch { throw { code: 'format', message: 'Réponse illisible' }; }
    return (d.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  }
  const sample = async (input, opts) => ({ text: await appelClaude(input, opts), truncated: false });
  sample.json = async (input, opts) => extraireJson(await appelClaude(input, opts));
  sample.limits = async () => ({ images: false });

  // ----- mcp : mêmes appels que le connecteur Firecrawl de l'artefact -----
  async function cotation(sym) {
    const chemin = `/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
    for (const hote of ['query1', 'query2']) {
      try {
        const r = await http(`https://${hote}.finance.yahoo.com${chemin}`, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
        if (r.status !== 200) continue;
        const m = JSON.parse(r.text).chart.result[0].meta, p = m.currentTradingPeriod && m.currentTradingPeriod.regular, n = Date.now() / 1000;
        if (!(m.regularMarketPrice > 0)) continue;
        return { data: { symbol: m.symbol, price: m.regularMarketPrice, currency: m.currency, name: m.longName || m.shortName || sym, change_percent: typeof m.regularMarketChangePercent === 'number' ? m.regularMarketChangePercent / 100 : null, market_state: p && n >= p.start && n <= p.end ? 'REGULAR' : 'CLOSED' } };
      } catch { /* essai suivant */ }
    }
    return { error: { code: 'not_found' } };
  }
  const mcp = {
    async callTool(serveur, outil, input) {
      if (serveur !== 'Firecrawl' || outil !== 'firecrawl_scrape') throw { code: 'server_not_connected', message: 'Connecteur indisponible dans l’app iOS.' };
      if (input && Array.isArray(input.alexandria)) {
        const items = await Promise.all(input.alexandria.map(a => cotation(a.options && a.options.symbol)));
        return { content: [], payload: { success: true, data: { alexandria: items } } };
      }
      if (input && /^https:\/\/(api|geocoding-api)\.open-meteo\.com\//.test(input.url || '')) {
        const r = await http(input.url, { headers: { Accept: 'application/json' } });
        if (r.status >= 400) throw { code: 'upstream_error', message: 'Erreur ' + r.status };
        return { content: [], payload: { markdown: '```json\n' + r.text + '\n```' } };
      }
      throw { code: 'bad_request', message: 'Adresse non prise en charge' };
    },
    async listTools() { return { servers: [] }; },
  };

  const utilisateur = { isOwner: () => true, canEdit: () => true, can: () => true, id: async () => 'local', me: async () => ({ id: 'local', name: '' }), profiles: async () => ({}) };
  window.claude = { use: async nom => (nom === 'user' ? utilisateur : nom === 'sample' ? sample : nom === 'mcp' ? mcp : null) };

  // ----- Réglage de la clé Claude (bloc affiché dans Famille) -----
  window.blocNatif = function () {
    const ok = !!lire().cle;
    return `<section class="carte"><h2>App iOS</h2>
      <div class="kv"><span>Clé Claude</span><b>${ok ? 'configurée' : 'non configurée'}</b></div>
      <p class="mut"><small>Elle sert aux programmes de voyage et aux parcours sportifs. Elle reste dans cet iPhone. Créez-la sur console.anthropic.com. Météo et cours de bourse n’ont pas besoin de clé.</small></p>
      <div class="rangee"><button class="btn sec" data-act="natif-cle">${ok ? 'Changer la clé' : 'Saisir la clé'}</button>${ok ? '<button class="btn danger" data-act="natif-cle-del">Retirer</button>' : ''}</div></section>`;
  };
  document.addEventListener('DOMContentLoaded', () => {
    ACTIONS['natif-cle'] = async () => {
      const r = await dialogue({ titre: 'Clé API Claude', texte: 'Collez votre clé (commence par sk-ant-).', champs: [{ nom: 'cle', label: 'Clé', valeur: '' }], ok: 'Enregistrer' });
      const cle = r && String(r.cle || '').trim();
      if (!cle) return false;
      ecrire({ ...lire(), cle }); info('Clé enregistrée.'); return 'vue';
    };
    ACTIONS['natif-cle-del'] = () => { const o = lire(); delete o.cle; ecrire(o); info('Clé retirée.'); return 'vue'; };
  });
})();
