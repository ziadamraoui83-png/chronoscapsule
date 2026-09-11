/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — Service Worker
   يخزّن الملفات + يجعل الموقع يعمل offline
   ═══════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'cc-v1.0.0';
const CACHE_STATIC = 'cc-static-' + CACHE_VERSION;
const CACHE_DYNAMIC = 'cc-dynamic-' + CACHE_VERSION;

/* ═══ الملفات الأساسية التي تُخزَّن دائمًا ═══ */
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/archive.html',
    '/capsules.html',
    '/profile.html',
    '/style.css',
    '/archive.css',
    '/i18n.js',
    '/script.js',
    '/archive.js',
    '/card-generator.js',
    '/manifest.json',
    '/icon-192.svg',
    '/icon-512.svg',
    '/icon-maskable.svg',
    '/robots.txt',
    '/sitemap.xml'
];

/* ═══ مصادر خارجية (CDN) ═══ */
const CDN_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=Space+Grotesk:wght@400;500;700&display=swap',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'
];

/* ═══ التثبيت — تخزين الملفات الأساسية ═══ */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_STATIC).then((cache) => {
            /* تخزين الملفات المحلية */
            const localPromise = cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] بعض الملفات المحلية فشلت:', err);
            });
            /* تخزين CDN بشكل منفصل (لا يفشل التثبيت إن فشل) */
            const cdnPromise = caches.open(CACHE_DYNAMIC).then((cdnCache) => {
                return Promise.allSettled(
                    CDN_ASSETS.map((url) =>
                        fetch(url, { mode: 'cors' })
                            .then((res) => res.ok ? cdnCache.put(url, res) : null)
                            .catch(() => null)
                    )
                );
            });
            return Promise.all([localPromise, cdnPromise]);
        }).then(() => self.skipWaiting())
    );
});

/* ═══ التفعيل — حذف الـ cache القديم ═══ */
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

/* ═══ جلب الملفات ═══ */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    /* تجاهل الطلبات غير GET */
    if (request.method !== 'GET') return;

    /* تجاهل Supabase (تحتاج اتصال دائم) */
    if (url.hostname.includes('supabase.co')) return;

    /* تجاهل Google Analytics */
    if (url.hostname.includes('google-analytics.com')) return;
    if (url.hostname.includes('googletagmanager.com')) return;

    /* تجاهل صفحات googleusercontent */
    if (url.hostname.includes('googleusercontent.com')) return;

    /* ═══ استراتيجية: Cache First للـ Assets، Network First للـ HTML ═══ */
    const isHTML = request.headers.get('accept')?.includes('text/html');

    if (isHTML) {
        /* HTML: Network First (لتحصل على آخر تحديثات) */
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_DYNAMIC).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
        );
    } else {
        /* CSS, JS, صور: Cache First (أسرع) */
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) {
                    /* تحديث في الخلفية */
                    fetch(request)
                        .then((response) => {
                            if (response.ok) {
                                caches.open(CACHE_DYNAMIC).then((cache) => cache.put(request, response));
                            }
                        })
                        .catch(() => {});
                    return cached;
                }
                return fetch(request)
                    .then((response) => {
                        if (response.ok && response.type === 'basic') {
                            const clone = response.clone();
                            caches.open(CACHE_DYNAMIC).then((cache) => cache.put(request, clone));
                        }
                        return response;
                    })
                    .catch(() => {
                        /* fallback للصور */
                        if (request.destination === 'image') {
                            return new Response(
                                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🚀</text></svg>',
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }
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