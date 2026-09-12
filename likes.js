/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — likes.js v2
   نظام الإعجابات ❤️ (مضمون)
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    function getSB() {
        return window.__ccSupabase || window.__sbClient || null;
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

    function showToastMsg(msg, ico = '❤️') {
        const t = document.getElementById('ccToast');
        if (!t) { console.log(ico, msg); return; }
        t.querySelector('.ico').textContent = ico;
        t.querySelector('.txt').textContent = msg;
        t.classList.add('show');
        clearTimeout(window.__likesToastTimer);
        window.__likesToastTimer = setTimeout(() => t.classList.remove('show'), 2600);
    }

    /* ═══ تحميل حالة الإعجاب ═══ */
    async function loadLikeState(capsuleId) {
        const sb = getSB();
        if (!sb) return { count: 0, liked: false };

        try {
            const deviceHash = getDeviceHash();
            const { data, error } = await sb.rpc('get_capsule_stats', {
                p_capsule_id: capsuleId
            });
            if (error) {
                console.warn('get_capsule_stats error:', error);
                const { data: c } = await sb.from('capsules')
                    .select('likes_count').eq('id', capsuleId).single();
                return { count: c?.likes_count || 0, liked: false };
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
        const sb = getSB();
        if (!sb) throw new Error('No Supabase');
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

    /* ═══ تحديث شكل الزر ═══ */
    function updateLikeUI(btn, liked, count) {
        const icon = btn.querySelector('.heart-icon');
        const countEl = btn.querySelector('.like-count');
        if (icon) icon.textContent = liked ? '❤️' : '🤍';
        if (countEl) countEl.textContent = count > 0 ? count : '';
        btn.classList.toggle('liked', !!liked);
        btn.dataset.liked = liked ? '1' : '0';
    }

    /* ═══ قلوب طائرة ═══ */
    function floatHearts(btn, n = 3) {
        const rect = btn.getBoundingClientRect();
        for (let i = 0; i < n; i++) {
            setTimeout(() => {
                const h = document.createElement('span');
                h.textContent = '❤️';
                h.style.cssText = `
                    position: fixed;
                    left: ${rect.left + rect.width / 2 + (Math.random() - 0.5) * 24}px;
                    top: ${rect.top + rect.height / 2}px;
                    font-size: 22px;
                    pointer-events: none;
                    z-index: 99999;
                    transition: transform 1s ease-out, opacity 1s ease-out;
                `;
                document.body.appendChild(h);
                requestAnimationFrame(() => {
                    h.style.transform = `translateY(-60px) scale(1.6)`;
                    h.style.opacity = '0';
                });
                setTimeout(() => h.remove(), 1100);
            }, i * 80);
        }
    }

    /* ═══ ربط زر واحد ═══ */
    async function bindLikeButton(btn) {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';

        const capsuleId = parseInt(btn.dataset.capsuleId, 10);
        if (!capsuleId) {
            console.warn('❤️ Button has no capsule-id');
            return;
        }

        // ✅ نربط click مباشرة (ماشي delegation)
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();  // ← مهم: يمنع إغلاق tooltip

            if (btn.disabled) return;
            btn.disabled = true;

            const wasLiked = btn.dataset.liked === '1';
            const oldCount = parseInt(btn.querySelector('.like-count').textContent || '0', 10);
            const newLiked = !wasLiked;
            const newCount = wasLiked ? Math.max(0, oldCount - 1) : oldCount + 1;

            // تحديث متفائل
            updateLikeUI(btn, newLiked, newCount);
            if (newLiked) floatHearts(btn, 3);

            try {
                const res = await toggleLike(capsuleId);
                updateLikeUI(btn, res.liked, res.count);
            } catch (err) {
                console.error('toggleLike:', err);
                updateLikeUI(btn, wasLiked, oldCount);
                showToastMsg('تعذّر حفظ الإعجاب', '⚠️');
            } finally {
                btn.disabled = false;
            }
        });

        // تحميل الحالة الأولية
        try {
            const state = await loadLikeState(capsuleId);
            updateLikeUI(btn, state.liked, state.count);
        } catch (e) {
            console.warn('Initial state failed:', e);
        }
    }

    /* ═══ مسح دوري للأزرار الجديدة (بدل MutationObserver) ═══ */
    function scanButtons() {
        document.querySelectorAll('.like-btn:not([data-bound])').forEach(bindLikeButton);
    }

    setInterval(scanButtons, 500);
    document.addEventListener('DOMContentLoaded', scanButtons);
    setTimeout(scanButtons, 1000);

    console.log('❤️ likes.js v2 ready');
})();