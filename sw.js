/* =========================================================
   SERVICE WORKER : garde l'app en mémoire sur l'appareil
   -> ouverture quasi instantanée, même sans réseau.

   Stratégie "stale-while-revalidate" :
   1. on affiche tout de suite la version gardée en mémoire ;
   2. en même temps, on télécharge la version en ligne pour la prochaine fois.
   => Quand je modifie l'app, tu vois la nouvelle version à la 2e ouverture.
   ========================================================= */
const CACHE = 'outil-v1';
const FICHIERS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

// Installation : on met les fichiers de l'app en mémoire
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});

// Activation : on supprime les anciennes versions en mémoire
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(cles =>
    Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Chaque fois que l'app demande un fichier
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const enMemoire = await cache.match(e.request, { ignoreSearch: true });
    const enLigne = fetch(e.request)
      .then(rep => { if (rep.ok) cache.put(e.request, rep.clone()); return rep; })
      .catch(() => enMemoire);
    return enMemoire || enLigne;
  }));
});
