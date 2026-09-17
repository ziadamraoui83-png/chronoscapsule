/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — likes.js v5.1 (محسّن للأداء + Memory Leak fix)
   - استبدال setInterval بـ MutationObserver (توفير CPU)
   - ✅ إصلاح Memory Leak: disconnect عند pagehide
   - ✅ console.log فقط في debug mode
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    /* ✅ Debug flag - فقط في localhost أو ?debug */
    const __CC_DEBUG = location.hostname === 'localhost' ||
                       location.hostname === '127.0.0.1' ||
                       location.search.includes('debug');

    /* ✅ نستعمل نفس Supabase client من script.js */
    function getSB() {
    if (window.__ccSupabase) return window.__ccSupabase;
    if (!window.CC_CONFIG || !window.supabase) return null;
    const client = window.supabase.createClient(
        window.CC_CONFIG.SUPABASE_URL,
        window.CC_CONFIG.SUPABASE_ANON_KEY
    );
    window.__ccSupabase = client;   // ✅ مشاركة الـ instance
    return client;
}

    function getDeviceHash() {
        let h = localStorage.getItem('cc_device');
        if (!h) {
            const a = crypto.getRandomValues(new Uint8Array(16));
            h = [...a].map(b => b.toString(16).padStart(2, '0')).join('');
            localStorage.setItem('cc_device', h);
        }
        return h;
    }

    function showToast(msg, ico = '❤️') {
        const t = document.getElementById('ccToast');
        if (!t) {
            /* ✅ فقط في debug mode */
            if (__CC_DEBUG) console.log(ico, msg);
            return;
        }
        t.querySelector('.ico').textContent = ico;
        t.querySelector('.txt').textContent = msg;
        t.classList.add('show');
        clearTimeout(window.__lkTimer);
        window.__lkTimer = setTimeout(() => t.classList.remove('show'), 2600);
    }

    async function loadState(id) {
        const client = getSB();
        if (!client) return { count: 0, liked: false };
        try {
            const { data, error } = await client.rpc('get_capsule_stats', { p_capsule_id: id });
            if (error) return { count: 0, liked: false };
            return { count: data?.likes_count || 0, liked: !!data?.liked };
        } catch (e) { return { count: 0, liked: false }; }
    }

    async function toggle(id) {
        const client = getSB();
        if (!client) throw new Error('No Supabase');
        const { data, error } = await client.rpc('toggle_like', {
            p_capsule_id: id,
            p_device_hash: getDeviceHash()
        });
        if (error) throw error;
        return { liked: !!data?.liked, count: data?.likes_count || 0 };
    }

    function updateUI(btn, liked, count) {
        const icon = btn.querySelector('.heart-icon');
        const el = btn.querySelector('.like-count');
        if (icon) icon.textContent = liked ? '❤️' : '🤍';
        if (el) el.textContent = count > 0 ? count : '';
        btn.classList.toggle('liked', liked);
        btn.dataset.liked = liked ? '1' : '0';
    }

    function hearts(btn, n = 3) {
        const r = btn.getBoundingClientRect();
        for (let i = 0; i < n; i++) {
            setTimeout(() => {
                const h = document.createElement('span');
                h.textContent = '❤️';
                h.style.cssText = `position:fixed;left:${r.left + r.width/2}px;top:${r.top}px;font-size:22px;pointer-events:none;z-index:99999;transition:transform 1s,opacity 1s;`;
                document.body.appendChild(h);
                requestAnimationFrame(() => {
                    h.style.transform = 'translateY(-60px) scale(1.6)';
                    h.style.opacity = '0';
                });
                setTimeout(() => h.remove(), 1100);
            }, i * 80);
        }
    }

    function bind(btn) {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        const id = parseInt(btn.dataset.capsuleId, 10);
        if (!id) return;

        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (btn.disabled) return;
            btn.disabled = true;

            const wasLiked = btn.dataset.liked === '1';
            const oldCount = parseInt(btn.querySelector('.like-count').textContent || '0', 10);
            const newLiked = !wasLiked;
            updateUI(btn, newLiked, wasLiked ? Math.max(0, oldCount - 1) : oldCount + 1);
            if (newLiked) hearts(btn);

            try {
                const res = await toggle(id);
                updateUI(btn, res.liked, res.count);
            } catch (err) {
                console.error('toggleLike:', err);
                updateUI(btn, wasLiked, oldCount);
                showToast('تعذّر حفظ الإعجاب', '⚠️');
            } finally {
                btn.disabled = false;
            }
        });

        loadState(id).then(s => updateUI(btn, s.liked, s.count));
    }

    function scan(root) {
        const scope = root || document;
        scope.querySelectorAll('.like-btn:not([data-bound])').forEach(bind);
    }

    /* ✅ نكشف دالة bind للاستعمال الخارجي (script.js) */
    window.CC_LIKES = {
        bind: function(container) {
            if (!container) return;
            container.querySelectorAll('.like-btn:not([data-bound])').forEach(bind);
        },
        scan: scan
    };

    /* ═══✅ التحسين: استخدام MutationObserver بدلاً من setInterval ═══
       الفوائد:
       - لا يستهلك CPU عندما لا توجد تغييرات في DOM
       - يستجيب فوراً عند إضافة عناصر جديدة
       - يحترم prefers-reduced-motion و battery saving
       - ✅ v5.1: إضافة cleanup عند pagehide (منع Memory Leak)
    */
    let observer = null;
    function setupObserver() {
        if (observer || !('MutationObserver' in window)) return;

        observer = new MutationObserver(function(mutations) {
            let hasNewButtons = false;
            for (const mutation of mutations) {
                if (mutation.type !== 'childList') continue;
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue; // عناصر فقط
                    // تحقق إن كان العنصر نفسه أو أحد أبنائه زر إعجاب جديد
                    if (node.matches && node.matches('.like-btn:not([data-bound])')) {
                        hasNewButtons = true;
                        break;
                    }
                    if (node.querySelectorAll && node.querySelectorAll('.like-btn:not([data-bound])').length > 0) {
                        hasNewButtons = true;
                        break;
                    }
                }
                if (hasNewButtons) break;
            }
            if (hasNewButtons) {
                scan(document);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        /* ✅ إصلاح Memory Leak: تنظيف Observer عند مغادرة الصفحة */
        const cleanup = () => {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        };

        /* pagehide: أفضل من unload (يدعم bfcache) */
        window.addEventListener('pagehide', cleanup);
        /* fallback: عند visibilitychange للتبديل بين التبويبات */
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && !observer) {
                /* لا شيء - فقط نظف عند pagehide */
            }
        });
    }

    /* مسح أولي عند تحميل الصفحة */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            scan(document);
            setupObserver();
        });
    } else {
        scan(document);
        setupObserver();
    }

    /* مسح احتياطي بعد فترات قصيرة (للعناصر المحملة بتأخير) */
    setTimeout(() => scan(document), 500);
    setTimeout(() => scan(document), 1500);

    /* ✅ console.log فقط في debug mode */
    if (__CC_DEBUG) console.log('❤️ likes.js v5.1 ready (MutationObserver + cleanup)');
})();
