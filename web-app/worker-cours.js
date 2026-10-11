// Relais minimal pour les cours de bourse (Cloudflare Workers, offre gratuite).
// Pourquoi : Yahoo Finance refuse les appels directs depuis un navigateur (pas de CORS).
// Déploiement : créez un Worker, collez ce fichier, ajoutez la variable ALLOWED_ORIGIN = l'adresse de votre application
// (ex. https://famille.exemple.pages.dev), puis saisissez l'adresse du Worker dans Famille › Application web.
export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Accept', 'Vary': 'Origin' };
    if (!env.ALLOWED_ORIGIN || origin !== env.ALLOWED_ORIGIN) return new Response('Forbidden', { status: 403 });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const m = new URL(req.url).pathname.match(/^\/chart\/([A-Za-z0-9.^=&-]{1,20})$/);
    if (!m) return new Response('Not found', { status: 404, headers: cors });
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(m[1])}?interval=1d&range=1d`, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }, cf: { cacheTtl: 60 } });
    return new Response(r.body, { status: r.status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' } });
  },
};
