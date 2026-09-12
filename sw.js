/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — Service Worker (v1.3.0)
   يخزّن الملفات المحلية فقط — لا يعترض الطلبات الخارجية
   ═══════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'cc-v1.4.0';
const CACHE_STATIC = 'cc-static-' + CACHE_VERSION;
const CACHE_DYNAMIC = 'cc-dynamic-' + CACHE_VERSION;

/* ═══ الملفات المحلية فقط ═══ */
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/archive.html',
    '/capsules.html',
    '/profile.html',
    '/about.html',
    '/privacy.html',
    '/terms.html',
    '/style.css',
    '/archive.css',
    '/config.js',
    '/i18n.js',
    '/script.js',
    '/archive.js',
    '/card-generator.js',
    '/manifest.json',
    '/icon-192.svg',
    '/icon-512.svg',
    '/icon-maskable.svg',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
];

/* ═══ التثبيت ═══ */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_STATIC).then((cache) => {
            return Promise.all(
                STATIC_ASSETS.map((url) =>
                    cache.add(url).catch(() => null)
                )
            );
        }).then(() => self.skipWaiting())
    );
});

/* ═══ التفعيل — حذف cache القديم ═══ */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_STATIC && key !== CACHE_DYNAMIC)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

/* ═══ الجلب ═══ */
self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (!request.url || !request.url.startsWith('http')) {
        return;
    }

    let url;
    try {
        url = new URL(request.url);
    } catch (e) {
        return;
    }

    /* ⚠️ تجاهل كل الطلبات الخارجية */
    if (url.origin !== self.location.origin) {
        return;
    }

    if (request.method !== 'GET') return;

    const isHTML = request.headers.get('accept')?.includes('text/html');

    if (isHTML) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_DYNAMIC)
                            .then((cache) => cache.put(request, clone))
                            .catch(() => {});
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then((cached) => cached || caches.match('/index.html'))
                        .then((fallback) => fallback || new Response('Offline', {
                            status: 503,
                            headers: { 'Content-Type': 'text/plain' }
                        }));
                })
        );
    } else {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) {
                    fetch(request)
                        .then((response) => {
                            if (response && response.ok) {
                                caches.open(CACHE_DYNAMIC)
                                    .then((cache) => cache.put(request, response))
                                    .catch(() => {});
                            }
                        })
                        .catch(() => {});
                    return cached;
                }
                return fetch(request)
                    .then((response) => {
                        if (response && response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_DYNAMIC)
                                .then((cache) => cache.put(request, clone))
                                .catch(() => {});
                        }
                        return response;
                    })
                    .catch(() => {
                        if (request.destination === 'image') {
                            return new Response(
                                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🚀</text></svg>',
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }
                        return new Response('', {
                            status: 503,
                            statusText: 'Offline',
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
        );
    }
});

/* ═══ رسائل من الصفحة ═══ */
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data === 'CLEAR_CACHE') {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
    }
});