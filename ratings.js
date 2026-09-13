/**
 * Chronos Capsule — Rating System (v2)
 * نظام التقييم بالنجوم — نسخة مصححة
 */
(function() {
  'use strict';

  /* ═══ Supabase client (مع fallback) ═══ */
  function getSB() {
    if (window.__ccSupabase) return window.__ccSupabase;
    if (!window.CC_CONFIG || !window.supabase) return null;
    return window.supabase.createClient(
      window.CC_CONFIG.SUPABASE_URL,
      window.CC_CONFIG.SUPABASE_ANON_KEY
    );
  }

  /* ═══ Device Hash الموحدة (نفس likes.js) ═══ */
  function getDeviceHash() {
    let h = localStorage.getItem('cc_device');
    if (!h) {
      const a = crypto.getRandomValues(new Uint8Array(16));
      h = [...a].map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('cc_device', h);
    }
    return h;
  }

  /* ═══ الترجمة ═══ */
  function t(key) {
    if (window.CCI18N && typeof window.CCI18N.t === 'function') {
      return window.CCI18N.t(key);
    }
    const lang = document.documentElement.lang || 'ar';
    const defaults = {
      ar: {
        rating_label: 'تقييمك',
        rating_count: 'مصوت',
        rating_your: 'تقييمك:',
        rating_thanks: 'شكراً لتقييمك!',
        rating_error: 'تعذّر حفظ التقييم'
      },
      en: {
        rating_label: 'Your Rating',
        rating_count: 'votes',
        rating_your: 'Your rating:',
        rating_thanks: 'Thanks for rating!',
        rating_error: 'Could not save rating'
      }
    };
    return (defaults[lang] && defaults[lang][key]) || key;
  }

  /* ═══ Toast ═══ */
  function showToast(msg, ico = '⭐') {
    const toast = document.getElementById('ccToast');
    if (!toast) { return; }
    toast.querySelector('.ico').textContent = ico;
    toast.querySelector('.txt').textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__rtToastTimer);
    window.__rtToastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  /* ═══ بناء HTML النجوم ═══ */
  function renderStars(avg, count, userStars) {
    const fullStars = Math.floor(avg || 0);
    const hasHalf = (avg || 0) % 1 >= 0.5;

    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      const filledByAvg = i <= fullStars || (i === fullStars + 1 && hasHalf && !userStars);
      const filledByUser = userStars && i <= userStars;
      const isFilled = filledByUser || filledByAvg;

      starsHtml += `<button class="star-btn ${isFilled ? 'filled' : ''}" data-star="${i}" type="button" aria-label="${i} ${t('rating_label')}">★</button>`;
    }

    const countText = count === 1
      ? t('rating_count').replace('s', '')
      : t('rating_count');
    const avgDisplay = avg ? avg.toFixed(1) : '—';

    return `
      <div class="star-rating" role="group" aria-label="${t('rating_label')}" aria-live="polite">
        <div class="stars-row">${starsHtml}</div>
        <div class="rating-info">
          <span class="rating-avg">${avgDisplay}</span>
          <span class="rating-count">(${count} ${countText})</span>
        </div>
      </div>
    `;
  }

  /* ═══ ربط النظام بحاوية ═══ */
  function bind(container, capsuleId) {
    if (!container || !capsuleId) return;

    const sb = getSB();
    if (!sb) {
      console.warn('⭐ ratings.js: Supabase not ready');
      return;
    }

    const deviceHash = getDeviceHash();

    let avg = 0;
    let count = 0;
    let userStars = 0;
    let currentUserId = null;

    loadRating();

    /* ═══ تحميل الحالة الأولية ═══ */
    async function loadRating() {
    try {
        // ✅ 1. استخدام البيانات من الأب (ماشي طلب جديد)
        if (container.dataset.avg) avg = parseFloat(container.dataset.avg) || 0;
        if (container.dataset.count) count = parseInt(container.dataset.count, 10) || 0;

        // ✅ 2. جلب تقييم المستخدم فقط (وإذا فشل، نتجاهلو)
        // نتجاهل تماماً إذا ما كانش device_hash في localStorage
        const storedDevice = localStorage.getItem('cc_device');
        if (!storedDevice && !currentUserId) {
            // Google Crawler: ما عندوش device → نتجاهل الطلب
            updateUI();
            return;
        }

        // جلب المستخدم
        try {
            const { data: { user } } = await sb.auth.getUser();
            if (user) currentUserId = user.id;
        } catch (e) {}

        // جلب تقييم المستخدم
        let q = sb.from('ratings').select('stars').eq('capsule_id', capsuleId);
        if (currentUserId) {
            q = q.eq('user_id', currentUserId);
        } else {
            q = q.eq('device_hash', storedDevice);
        }

        const { data: userRating, error } = await q.maybeSingle();
        if (!error && userRating) {
            userStars = userRating.stars || 0;
        }

        updateUI();
    } catch (err) {
        // صامت — ما نسجلش أخطاء
        updateUI();
    }
}
    }

    /* ═══ تحديث الواجهة ═══ */
    function updateUI() {
      container.innerHTML = renderStars(avg, count, userStars);
      attachEvents();
    }

    /* ═══ ربط الأحداث ═══ */
    function attachEvents() {
      const stars = container.querySelectorAll('.star-btn');

      stars.forEach(btn => {
        const val = parseInt(btn.dataset.star, 10);

        btn.addEventListener('mouseenter', () => {
          stars.forEach((b, idx) => b.classList.toggle('hover', idx < val));
        });

        btn.addEventListener('mouseleave', () => {
          stars.forEach(b => b.classList.remove('hover'));
        });

        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (userStars === val) return;

          await submitRating(val, stars);
        });
      });
    }

    /* ═══ إرسال التقييم ═══ */
    async function submitRating(val, stars) {
      const oldAvg = avg;
      const oldCount = count;
      const oldUserStars = userStars;

      // Optimistic update
      if (oldUserStars === 0) {
        avg = ((oldAvg * oldCount) + val) / (oldCount + 1);
        count = oldCount + 1;
      } else {
        avg = ((oldAvg * oldCount) - oldUserStars + val) / oldCount;
      }
      userStars = val;
      updateUI();

      try {
        // ✅ بدون p_user_id (الـ RPC كتاخد auth.uid() تلقائياً)
        const { data, error } = await sb.rpc('rate_capsule', {
          p_capsule_id: capsuleId,
          p_stars: val,
          p_device_hash: currentUserId ? null : deviceHash
        });

        if (error) throw error;

        // ✅ data = JSON object مباشرة
        if (data) {
          avg = data.avg || 0;
          count = data.count || 0;
          userStars = data.your_stars || val;
          updateUI();
          showToast(t('rating_thanks'), '⭐');
        }
      } catch (err) {
        console.error('⭐ submitRating error:', err);
        // Rollback
        avg = oldAvg;
        count = oldCount;
        userStars = oldUserStars;
        updateUI();
        showToast(t('rating_error'), '⚠️');
      }
    }
  }

  /* ═══ Expose ═══ */
  window.CC_RATINGS = {
    bind: bind,
    renderStars: renderStars
  };

 })();
