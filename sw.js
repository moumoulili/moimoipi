// Service worker : met le jeu en cache pour qu'il marche hors ligne.
// Stratégie "réseau d'abord" : en ligne on a toujours la dernière version,
// hors ligne on utilise la copie en cache.
// Penser à changer VERSION à chaque mise à jour du jeu.
const VERSION = 'moimoipi-p1-2';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  'js/core/namespace.js', 'js/core/utils.js', 'js/core/rng.js', 'js/core/bus.js', 'js/core/save.js', 'js/core/loop.js',
  'js/data/balance.js', 'js/data/elements.js', 'js/data/classes.js', 'js/data/monsters.js', 'js/data/biomes.js', 'js/data/rooms.js', 'js/data/names.js', 'js/data/buildings.js',
  'js/render/pixelart.js', 'js/render/sprites.js', 'js/render/tiles.js', 'js/render/fx.js', 'js/render/font.js', 'js/render/renderer.js',
  'js/systems/path.js', 'js/systems/stats.js', 'js/systems/heroes.js', 'js/systems/dungeon.js', 'js/systems/combat.js', 'js/systems/town.js', 'js/systems/run.js',
  'js/ui/ui.js', 'js/ui/hud.js', 'js/ui/town.js', 'js/ui/settings.js', 'js/main.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
