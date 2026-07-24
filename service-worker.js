const CACHE_NAME = 'geomaps-core-v1';
const TILE_CACHE = 'geomaps-tiles-v1';

// Aset inti yang langsung di-cache saat install
const CORE_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/map.js',
    './js/search.js',
    './js/utils.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // LOGIKA 1: Jika request adalah gambar peta (Tile OSM)
    if (url.hostname.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.open(TILE_CACHE).then(async cache => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) return cachedResponse;

                try {
                    const networkResponse = await fetch(event.request);
                    // Simpan tile baru ke cache
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                } catch (err) {
                    return new Response('', { status: 404 });
                }
            })
        );
        return;
    }

    // LOGIKA 2: Request aset statis lainnya (Cache-First)
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request);
        })
    );
});
