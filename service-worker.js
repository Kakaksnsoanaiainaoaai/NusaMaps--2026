const CACHE_NAME = 'nusamaps-cache-v1';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/map.js',
    './js/search.js',
    './js/routing.js',
    './js/utils.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.hostname.includes('tile.openstreetmap.org')) return; // Jangan cache seluruh dunia
    event.respondWith(
        caches.match(event.request).then(res => res || fetch(event.request))
    );
});
