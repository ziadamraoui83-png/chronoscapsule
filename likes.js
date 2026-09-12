/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — likes.js
   نظام الإعجابات ❤️ (self-contained)
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    const CC_CONFIG = window.CC_CONFIG || {};
    const SUPABASE_URL = CC_CONFIG.SUPABASE_URL;
    const SUPABASE_ANON_KEY = CC_CONFIG.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !window.supabase) {
        console.warn('❤️ likes.js: Supabase not ready');
        return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    /* ═══ Device hash (للزوار المجهولين) ═══ */
    function getDeviceHash() {
        let h = localStorage.getItem('cc_device');
        if (!h) {
            const a = crypto.getRandomValues(new Uint8Array(16));
            h = [...a].map(b => b.toString(16).padStart(2, '0')).join('');
            localStorage.setItem('cc_device', h);
        }
        return h;
    }

    /* ═══ Toast ═══ */
    function showToastMsg(msg, ico = '❤️') {
        const t = document.getElementById('ccToast');
        if (!t) return;
        t.querySelector('.ico').textContent = ico;
        t.querySelector('.txt').textContent = msg;
        t.classList.add('show');
        clearTimeout(window.__likesToastTimer);
        window.__likesToastTimer = setTimeout(() => t.classList.remove('show'), 2600);
    }

    /* ═══ هل أنا مسجل؟ ═══ */
    async function getCurrentUser() {
        try {
            const { data } = await sb.auth.getSession();
            return (data && data.session) ? data.session.user : null;
        } catch (e) { return null; }
    }

    /* ═══ تحميل حالة الإعجاب لكبسولة ═══ */
    async function loadLikeState(capsuleId) {
        try {
            const user = await getCurrentUser();
            const deviceHash = getDeviceHash();

            const { data, error } = await sb.rpc('get_capsule_stats', {
                p_capsule_id: capsuleId
            });

            if (error) {
                // fallback: نجيب العداد مباشرة
                const { data: c } = await sb.from('capsules')
                    .select('likes_count').eq('id', capsuleId).single();
                return {
                    count: c?.likes_count || 0,
                    liked: false
                };
            }

            return {
                count: data?.likes_count || 0,
                liked: !!data?.liked
            };
        } catch (e) {
            console.warn('loadLikeState:', e);
            return { count: 0, liked: false };
        }
    }

    /* ═══ تبديل الإعجاب ═══ */
    async function toggleLike(capsuleId) {
        const deviceHash = getDeviceHash();
        const { data, error } = await sb.rpc('toggle_like', {
            p_capsule_id: capsuleId,
            p_device_hash: deviceHash
        });

        if (error) throw error;
        return {
            liked: !!data?.liked,
            count: data?.likes_count || 0
        };
    }

    /* ═══ إطلاق قلوب طائرة ═══ */
    function floatHearts(btn, n = 3) {
        const rect = btn.getBoundingClientRect();
        for (let i = 0; i < n; i++) {
            setTimeout(() => {
                const h = document.createElement('span');
                h.className = 'float-heart';
                h.textContent = '❤️';
                h.style.position = 'fixed';
                h.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 24) + 'px';
                h.style.top = (rect.top + rect.height / 2) + 'px';
                h.style.zIndex = '9999';
                h.style.pointerEvents = 'none';
                document.body.appendChild(h);
                setTimeout(() => h.remove(), 950);
            }, i * 90);
        }
    }

    /* ═══ ربط زر الإعجاب ═══ */
    async function bindLikeButton(btn) {
        const capsuleId = parseInt(btn.dataset.capsuleId, 10);
        if (!capsuleId) return;

        btn.disabled = true;
        const state = await loadLikeState(capsuleId);
        btn.disabled = false;

        btn.dataset.liked = state.liked ? '1' : '0';
        updateLikeUI(btn, state.liked, state.count);
    }

    function updateLikeUI(btn, liked, count) {
        const icon = btn.querySelector('.heart-icon');
        const countEl = btn.querySelector('.like-count');
        if (icon) icon.textContent = liked ? '❤️' : '🤍';
        if (countEl) countEl.textContent = count > 0 ? count : '';
        btn.classList.toggle('liked', !!liked);
    }

    /* ═══ Event Delegation على زر الإعجاب ═══ */
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.like-btn');
        if (!btn) return;
        e.stopPropagation();

        const capsuleId = parseInt(btn.dataset.capsuleId, 10);
        if (!capsuleId || btn.disabled) return;

        btn.disabled = true;
        const wasLiked = btn.dataset.liked === '1';
        const currentCount = parseInt(btn.querySelector('.like-count').textContent || '0', 10);

        // تحديث متفائل
        const newLiked = !wasLiked;
        const newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
        updateLikeUI(btn, newLiked, newCount);
        if (newLiked) floatHearts(btn, 3);

        // إرسال للسيرفر
        try {
            const res = await toggleLike(capsuleId);
            btn.dataset.liked = res.liked ? '1' : '0';
            updateLikeUI(btn, res.liked, res.count);
        } catch (err) {
            // رجوع للحالة السابقة عند الفشل
            updateLikeUI(btn, wasLiked, currentCount);
            console.error('toggleLike:', err);
            showToastMsg(
                (window.CCI18N && CCI18N.lang === 'en')
                    ? 'Could not save like'
                    : 'تعذّر حفظ الإعجاب',
                '⚠️'
            );
        } finally {
            btn.disabled = false;
        }
    });

    /* ═══ مراقبة ظهور أزرار جديدة (tooltips) ═══ */
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                const btns = node.querySelectorAll?.('.like-btn:not([data-bound])');
                btns?.forEach(btn => {
                    btn.dataset.bound = '1';
                    bindLikeButton(btn);
                });
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    /* ═══ ربط الأزرار الموجودة حالياً ═══ */
    document.querySelectorAll('.like-btn:not([data-bound])').forEach(btn => {
        btn.dataset.bound = '1';
        bindLikeButton(btn);
    });

    console.log('❤️ likes.js ready');
})();