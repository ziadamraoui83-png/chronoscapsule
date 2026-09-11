/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — Service Worker (v1.1.0)
   يخزّن الملفات المحلية فقط — لا يعترض الطلبات الخارجية
   ═══════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'cc-v1.1.1';
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
            /* كل ملف على حدة — فشل واحد لا يكسر البقية */
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

    /* تجاهل الطلبات بدون URL صالح */
    if (!request.url || !request.url.startsWith('http')) {
        return;
    }

    let url;
    try {
        url = new URL(request.url);
    } catch (e) {
        return;
    }

    /* ⚠️ الأهم: تجاهل كل الطلبات الخارجية */
    if (url.origin !== self.location.origin) {
        return;
    }

    /* تجاهل طلبات غير GET */
    if (request.method !== 'GET') return;

    /* ═══ نفس الأصل: Cache First للـ assets، Network First للـ HTML ═══ */
    const isHTML = request.headers.get('accept')?.includes('text/html');

    if (isHTML) {
        /* HTML: Network First */
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
        /* CSS, JS, صور: Cache First */
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) {
                    /* تحديث خلفي في الخلفية */
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
                        /* دائماً أعد Response صالح */
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