// Fabrique dist/ : application web autonome, verrouillée (code + chiffrement), prête à déposer sur un hébergeur statique.
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url)), racine = join(ici, '..'), dist = join(ici, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'fonts'), { recursive: true });

let html = readFileSync(join(racine, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of [...scripts, 'style.css']) cpSync(join(racine, f), join(dist, f));
cpSync(join(racine, 'standalone', 'shim.js'), join(dist, 'shim.js'));
cpSync(join(ici, 'verrou.js'), join(dist, 'verrou.js'));
cpSync(join(ici, 'verrou.css'), join(dist, 'verrou.css'));
cpSync(join(ici, 'icons'), join(dist, 'icons'), { recursive: true });
cpSync(join(racine, 'icons', 'icon.svg'), join(dist, 'icons', 'icon.svg'));

// Polices embarquées (aucun appel à Google Fonts)
const nm = join(ici, 'node_modules', '@fontsource-variable');
let css = '';
for (const [d, fam, f] of [['fraunces', 'Fraunces', 'fraunces-latin-wght-normal.woff2'], ['figtree', 'Figtree', 'figtree-latin-wght-normal.woff2']]) {
  const src = join(nm, d, 'files', f);
  if (!existsSync(src)) throw new Error('Police introuvable : ' + src + ' (lancez npm install)');
  cpSync(src, join(dist, 'fonts', f));
  css += `@font-face{font-family:'${fam}';font-style:normal;font-display:swap;font-weight:300 900;src:url(fonts/${f}) format('woff2')}\n`;
}
writeFileSync(join(dist, 'fonts.css'), css);

writeFileSync(join(dist, 'manifest.json'), JSON.stringify({
  name: 'App Famille', short_name: 'Famille', lang: 'fr', start_url: './', scope: './', display: 'standalone', orientation: 'portrait',
  background_color: '#f6efe4', theme_color: '#b4522f',
  icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }, { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
}, null, 2));

const CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://api.anthropic.com https://api.open-meteo.com https://geocoding-api.open-meteo.com https://*.workers.dev; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'";
html = html.replace(/<link rel="preconnect"[^>]*>\n?/g, '').replace(/<link[^>]+fonts\.googleapis[^>]*>/g, '<link rel="stylesheet" href="fonts.css">');
html = html.replace(/<link rel="icon"[^>]*>/, '<link rel="icon" href="icons/icon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="icons/icon-180.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="default">\n<meta name="apple-mobile-web-app-title" content="Famille">\n<meta name="referrer" content="no-referrer">');
html = html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${CSP}">`);
html = html.replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="style.css">\n<link rel="stylesheet" href="verrou.css">');
const liste = ['shim.js', ...scripts].join(',');
html = html.replace(/(<script src="[^"]+"><\/script>\n?)+/, `<script src="verrou.js" data-scripts="${liste}"></script>\n`);
writeFileSync(join(dist, 'index.html'), html);

// En-têtes de sécurité (Cloudflare Pages / Netlify)
writeFileSync(join(dist, '_headers'), `/*
  Content-Security-Policy: ${CSP}; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains
/sw.js
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
`);

// Fichiers à mettre en cache hors ligne + service worker versionné par le contenu
const tous = d => readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? tous(p) : [p]; });
const fichiers = tous(dist).map(p => relative(dist, p)).filter(f => !['sw.js', '_headers'].includes(f)).sort();
const h = createHash('sha256'); fichiers.forEach(f => h.update(f).update(readFileSync(join(dist, f))));
const version = h.digest('hex').slice(0, 12);
writeFileSync(join(dist, 'sw.js'), `const CACHE = 'famille-${version}';
const FICHIERS = ${JSON.stringify(['./', ...fichiers], null, 1)};
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(l => Promise.all(l.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return; // API externes : réseau direct, jamais mises en cache
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(c => c || fetch(r)));
});
`);
// enregistrement du service worker (fichier externe : la CSP interdit les scripts inline)
cpSync(join(ici, 'enregistrer-sw.js'), join(dist, 'enregistrer-sw.js'));
writeFileSync(join(dist, 'index.html'), readFileSync(join(dist, 'index.html'), 'utf8').replace('</body>', '<script src="enregistrer-sw.js"></script>\n</body>'));
console.log('dist/ prêt : version', version, '·', fichiers.length, 'fichiers');
