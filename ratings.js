/**
 * Chronos Capsule - Rating System
 * Vanilla JS Rating Module with Supabase Integration
 */
(function() {
  'use strict';

  // Device Hash for anonymous identification
  function getDeviceHash() {
    let hash = localStorage.getItem('cc_device');
    if (!hash) {
      hash = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      localStorage.setItem('cc_device', hash);
    }
    return hash;
  }

  // Get translation key
  function t(key) {
    if (window.CC_I18N && window.CC_I18N.t) {
      return window.CC_I18N.t(key);
    }
    const lang = document.documentElement.lang || 'ar';
    const defaults = {
      ar: {
        rating_label: 'تقييمك',
        rating_count: 'مصوت',
        rating_your: 'تقييمك:',
        rating_thanks: 'شكراً لتقييمك!'
      },
      en: {
        rating_label: 'Your Rating',
        rating_count: 'votes',
        rating_your: 'Your rating:',
        rating_thanks: 'Thanks for rating!'
      }
    };
    return defaults[lang]?.[key] || key;
  }

  // Render stars HTML
  function renderStars(avg, count, userStars) {
    const fullStars = Math.floor(avg || 0);
    const hasHalf = (avg || 0) % 1 >= 0.5;
    
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      const filled = i <= fullStars || (i === fullStars + 1 && hasHalf && !userStars);
      const userFilled = userStars && i <= userStars;
      const isFilled = userFilled || filled;
      
      starsHtml += `<button class="star-btn ${isFilled ? 'filled' : ''}" data-star="${i}" aria-label="${i} ${t('rating_label')}">★</button>`;
    }

    const countText = count === 1 ? t('rating_count').replace('s', '') : t('rating_count');
    const avgDisplay = avg ? avg.toFixed(1) : '---';
    
    return `
      <div class="star-rating" role="group" aria-label="${t('rating_label')}">
        ${starsHtml}
        <div class="rating-info">
          <span class="rating-avg">${avgDisplay}</span>
          <span class="rating-count">(${count} ${countText})</span>
        </div>
      </div>
    `;
  }

  // Bind rating functionality to container
  function bind(container, capsuleId) {
    if (!container || !capsuleId) return;

    const deviceHash = getDeviceHash();
    const supabase = window.__ccSupabase;

    // Local state
    let avg = 0;
    let count = 0;
    let userStars = 0;
    let currentUserId = null;

    if (!supabase) {
      console.warn('Supabase client not found');
      container.innerHTML = '<span class="rating-error">Rating unavailable</span>';
      return;
    }

    // Initial load
    loadRating();

    async function loadRating() {
      try {
        // 1. Check if user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!authError && user) {
          currentUserId = user.id;
          console.log('[Rating] Logged in user:', user.id);
        }

        // 2. Get capsule data
        const { data: capsule, error: capsuleError } = await supabase
          .from('capsules')
          .select('ratings_avg, ratings_count')
          .eq('id', capsuleId)
          .single();

        if (capsuleError) throw capsuleError;

        avg = capsule?.ratings_avg || 0;
        count = capsule?.ratings_count || 0;

        // 3. Get user's rating (check by user_id first, then device_hash)
        let userQuery = supabase
          .from('ratings')
          .select('stars')
          .eq('capsule_id', capsuleId);

        if (currentUserId) {
          userQuery = userQuery.eq('user_id', currentUserId);
        } else {
          userQuery = userQuery.eq('device_hash', deviceHash);
        }

        const { data: userRating, error: userError } = await userQuery.single();

        if (userError && userError.code !== 'PGRST116') {
          console.warn('Error fetching user rating:', userError);
        }

        userStars = userRating?.stars || 0;

        updateUI();
      } catch (err) {
        console.error('Error loading rating:', err);
        updateUI();
      }
    }

    function updateUI() {
      container.innerHTML = renderStars(avg, count, userStars);
      attachStarEvents();
    }

    function attachStarEvents() {
      const starBtns = container.querySelectorAll('.star-btn');
      
      starBtns.forEach(btn => {
        const starValue = parseInt(btn.dataset.star);

        // Hover effect
        btn.addEventListener('mouseenter', () => {
          starBtns.forEach((b, idx) => {
            b.classList.toggle('hover', idx < starValue);
          });
        });

        btn.addEventListener('mouseleave', () => {
          starBtns.forEach(b => b.classList.remove('hover'));
        });

        // Click to rate
        btn.addEventListener('click', async () => {
          if (userStars === starValue) return; // Already rated this

          // Optimistic update
          const oldAvg = avg;
          const oldCount = count;
          const oldUserStars = userStars;
          
          if (oldUserStars === 0) {
            // New rating
            avg = ((oldAvg * oldCount) + starValue) / (oldCount + 1);
            count = oldCount + 1;
          } else {
            // Update existing rating
            avg = ((oldAvg * oldCount) - oldUserStars + starValue) / oldCount;
          }
          userStars = starValue;
          
          updateUI();

          try {
            // Prepare parameters for RPC
            const rpcParams = {
              p_capsule_id: capsuleId,
              p_stars: starValue,
              p_device_hash: currentUserId ? null : deviceHash
            };
            
            // Add user_id if logged in (if your RPC supports it)
            if (currentUserId) {
              rpcParams.p_user_id = currentUserId;
            }

            const { data, error } = await supabase.rpc('rate_capsule', rpcParams);

            if (error) throw error;

            if (data && data.length > 0) {
              const result = data[0];
              avg = result.avg || 0;
              count = result.count || 0;
              userStars = result.your_stars || 0;
              updateUI();
              
              // Show thanks message briefly
              showThanksMessage();
            }
          } catch (err) {
            console.error('Error submitting rating:', err);
            // Revert on error
            avg = oldAvg;
            count = oldCount;
            userStars = oldUserStars;
            updateUI();
            alert('فشل التسجيل، حاول مرة أخرى');
          }
        });
      });
    }

    function showThanksMessage() {
      const info = container.querySelector('.rating-info');
      if (info) {
        const originalText = info.innerHTML;
        info.innerHTML = `<span class="rating-thanks">✓ ${t('rating_thanks')}</span>`;
        setTimeout(() => {
          info.innerHTML = originalText;
        }, 2000);
      }
    }
  }

  // Expose to global scope
  window.CC_RATINGS = {
    bind: bind,
    renderStars: renderStars
  };

})();
