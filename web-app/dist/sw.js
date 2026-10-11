const CACHE = 'famille-3b9e7cc4c6fe';
const FICHIERS = [
 "./",
 "accueil.js",
 "app.js",
 "bourse.js",
 "cours.js",
 "fin-ui.js",
 "fin-vues.js",
 "finances.js",
 "fonts.css",
 "fonts/figtree-latin-wght-normal.woff2",
 "fonts/fraunces-latin-wght-normal.woff2",
 "graphes.js",
 "icons/icon-180.png",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/icon.svg",
 "illustrations.js",
 "index.html",
 "manifest.json",
 "menus.js",
 "meteo.js",
 "partage.js",
 "prets.js",
 "shim.js",
 "sport.js",
 "style.css",
 "sync.js",
 "verrou.css",
 "verrou.js",
 "vie.js"
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(l => Promise.all(l.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return; // API externes : réseau direct, jamais mises en cache
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(c => c || fetch(r)));
});
