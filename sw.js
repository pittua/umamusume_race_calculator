const CACHE = 'uma-race-calc-v1';

const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './calculator.js',
  './course_data.js',
  './manifest.json',
  './icons/icon.svg',
];

// インストール時に全ファイルをキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// キャッシュ優先・オフライン対応
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached ?? fetch(e.request))
  );
});
