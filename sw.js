const CACHE = 'hardworkiq-v1';
const ASSETS = [
  './',
  './index.html',
  './login.html',
  './admin.html',
  './manifest.webmanifest',
  './js/config.js',
  './js/quotes.js',
  './js/profanity.js',
  './js/account.js',
  './icons/hardworkiq.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './brand/logo-vert.png',
  './brand/logo-horiz.png',
  './brand/logo-horiz-sm.png',
  './sprites/blue-front.png',
  './sprites/blue-back.png',
  './sprites/white-front.png',
  './sprites/white-back.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.hostname.indexOf('supabase.co') >= 0) {
    event.respondWith(fetch(event.request));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
