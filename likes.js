/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — likes.js v4
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    /* ✅ نستعمل نفس Supabase client من script.js */
    function getSB() {
        if (window.__ccSupabase) return window.__ccSupabase;
        if (!window.CC_CONFIG || !window.supabase) return null;
        return window.supabase.createClient(
            window.CC_CONFIG.SUPABASE_URL,
            window.CC_CONFIG.SUPABASE_ANON_KEY
        );
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
        if (!t) { console.log(ico, msg); return; }
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

    setInterval(() => scan(document), 400);
    document.addEventListener('DOMContentLoaded', () => scan(document));
    setTimeout(() => scan(document), 500);
    setTimeout(() => scan(document), 1500);

    console.log('❤️ likes.js v4 ready');
})();
