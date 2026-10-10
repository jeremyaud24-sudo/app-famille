const CACHE = 'famille-v2';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'graphes.js', 'bourse.js', 'prets.js', 'finances.js', 'vie.js', 'sport.js', 'menus.js', 'accueil.js', 'sync.js', 'manifest.json', 'icons/icon.svg'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});
