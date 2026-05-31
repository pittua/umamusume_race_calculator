const CACHE = 'uma-race-calc-v9';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './calculator.js',
  './course_data.js',
  './manifest.json',
  './icons/uma_race_culicon.png',
  './screenshots/screenshot-narrow.png',
  './screenshots/screenshot-wide.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // http/https 以外のスキーム（chrome-extension等）はスキップ
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
        .then(res => {
          if (res && res.status === 200 && e.request.method === 'GET') {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
      )
      .catch(() => caches.match('./index.html'))
  );
});
