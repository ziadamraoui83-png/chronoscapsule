/**
 * Chronos Capsule — Rating System (v3)
 * - يقرا avg/count من data-* attributes
 * - ما يديرش طلبات إذا ما كانش device_hash (للزوار و Google)
 * - صامت (بدون console errors)
 */
(function() {
  'use strict';

  /* ═══ Supabase client ═══ */
  function getSB() {
    if (window.__ccSupabase) return window.__ccSupabase;
    if (!window.CC_CONFIG || !window.supabase) return null;
    return window.supabase.createClient(
      window.CC_CONFIG.SUPABASE_URL,
      window.CC_CONFIG.SUPABASE_ANON_KEY
    );
  }

  /* ═══ Device Hash (نفس likes.js) ═══ */
  function getStoredDevice() {
    try { return localStorage.getItem('cc_device'); }
    catch (e) { return null; }
  }

  function ensureDeviceHash() {
    let h = getStoredDevice();
    if (!h) {
      try {
        const a = crypto.getRandomValues(new Uint8Array(16));
        h = [...a].map(b => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('cc_device', h);
      } catch (e) {
        h = 'dev_' + Date.now().toString(36);
      }
    }
    return h;
  }

  /* ═══ ترجمة ═══ */
  function t(key) {
    if (window.CCI18N && typeof window.CCI18N.t === 'function') {
      return window.CCI18N.t(key);
    }
    const lang = document.documentElement.lang || 'ar';
    const defaults = {
      ar: {
        rating_label: 'تقييمك',
        rating_count: 'مصوت',
        rating_thanks: 'شكراً لتقييمك!',
        rating_error: 'تعذّر حفظ التقييم'
      },
      en: {
        rating_label: 'Your Rating',
        rating_count: 'votes',
        rating_thanks: 'Thanks for rating!',
        rating_error: 'Could not save rating'
      }
    };
    return (defaults[lang] && defaults[lang][key]) || key;
  }

  /* ═══ Toast ═══ */
  function showToast(msg, ico) {
    const toast = document.getElementById('ccToast');
    if (!toast) return;
    toast.querySelector('.ico').textContent = ico || '⭐';
    toast.querySelector('.txt').textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__rtToastTimer);
    window.__rtToastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  /* ═══ بناء النجوم ═══ */
  function renderStars(avg, count, userStars) {
    const fullStars = Math.floor(avg || 0);
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const filled = (userStars && i <= userStars) || (!userStars && i <= fullStars);
      html += '<button class="star-btn ' + (filled ? 'filled' : '') + '" ' +
              'data-star="' + i + '" type="button" ' +
              'aria-label="' + i + ' ' + t('rating_label') + '">★</button>';
    }
    const countText = count === 1 ? t('rating_count').replace('s', '') : t('rating_count');
    const avgDisplay = avg > 0 ? Number(avg).toFixed(1) : '—';
    return '<div class="star-rating" role="group" aria-label="' + t('rating_label') + '">' +
           '<div class="stars-row">' + html + '</div>' +
           '<div class="rating-info">' +
           '<span class="rating-avg">' + avgDisplay + '</span> ' +
           '<span class="rating-count">(' + count + ' ' + countText + ')</span>' +
           '</div></div>';
  }

  /* ═══ ربط ═══ */
  function bind(container, capsuleId) {
    if (!container || !capsuleId) return;

    const sb = getSB();
    if (!sb) return;

    let avg = parseFloat(container.dataset.avg) || 0;
    let count = parseInt(container.dataset.count, 10) || 0;
    let userStars = 0;
    let currentUserId = null;

    /* ═══ تحميل تقييم المستخدم (فقط إذا كان device موجود) ═══ */
    async function loadUserRating() {
      const storedDevice = getStoredDevice();

      // إذا ما كانش device → ما نديروش طلبات (مثلاً Google Crawler)
      if (!storedDevice) {
        updateUI();
        return;
      }

      try {
        // جلب المستخدم إذا كان مسجل
        try {
          const authResult = await sb.auth.getUser();
          if (authResult && authResult.data && authResult.data.user) {
            currentUserId = authResult.data.user.id;
          }
        } catch (e) { /* صامت */ }

        // جلب التقييم
        let q = sb.from('ratings').select('stars').eq('capsule_id', capsuleId);
        if (currentUserId) {
          q = q.eq('user_id', currentUserId);
        } else {
          q = q.eq('device_hash', storedDevice);
        }

        const result = await q.maybeSingle();
        if (result && !result.error && result.data) {
          userStars = result.data.stars || 0;
        }
      } catch (e) {
        /* صامت — ما نسجلش أخطاء */
      }

      updateUI();
    }

    /* ═══ تحديث الواجهة ═══ */
    function updateUI() {
      container.innerHTML = renderStars(avg, count, userStars);
      attachEvents();
    }

    /* ═══ ربط الأحداث ═══ */
    function attachEvents() {
      const stars = container.querySelectorAll('.star-btn');

      stars.forEach(function(btn) {
        const val = parseInt(btn.dataset.star, 10);

        btn.addEventListener('mouseenter', function() {
          stars.forEach(function(b, idx) {
            b.classList.toggle('hover', idx < val);
          });
        });

        btn.addEventListener('mouseleave', function() {
          stars.forEach(function(b) { b.classList.remove('hover'); });
        });

        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (userStars === val) return;
          submitRating(val);
        });
      });
    }

    /* ═══ إرسال التقييم ═══ */
    async function submitRating(val) {
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
        const deviceHash = ensureDeviceHash();

        const rpcResult = await sb.rpc('rate_capsule', {
          p_capsule_id: capsuleId,
          p_stars: val,
          p_device_hash: currentUserId ? null : deviceHash
        });

        if (rpcResult.error) throw rpcResult.error;

        if (rpcResult.data) {
          avg = rpcResult.data.avg || 0;
          count = rpcResult.data.count || 0;
          userStars = rpcResult.data.your_stars || val;
          updateUI();
          showToast(t('rating_thanks'), '⭐');
        }
      } catch (err) {
        // Rollback
        avg = oldAvg;
        count = oldCount;
        userStars = oldUserStars;
        updateUI();
        showToast(t('rating_error'), '⚠️');
      }
    }

    // بدء التحميل
    loadUserRating();
  }

  /* ═══ Expose ═══ */
  window.CC_RATINGS = {
    bind: bind,
    renderStars: renderStars
  };
})();
