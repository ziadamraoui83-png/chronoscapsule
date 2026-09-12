/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — archive.js (نسخة نهائية + Skeleton + Empty)
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    const COUNTRY_INFO = {
        DZ:{name:'الجزائر 🇩🇿'}, SA:{name:'السعودية 🇸🇦'}, EG:{name:'مصر 🇪🇬'}, MA:{name:'المغرب 🇲🇦'},
        TN:{name:'تونس 🇹🇳'}, AE:{name:'الإمارات 🇦🇪'}, QA:{name:'قطر 🇶🇦'}, KW:{name:'الكويت 🇰🇼'},
        LY:{name:'ليبيا 🇱🇾'}, MR:{name:'موريتانيا 🇲🇷'}, IQ:{name:'العراق 🇮🇶'}, JO:{name:'الأردن 🇯🇴'},
        PS:{name:'فلسطين 🇵🇸'}, LB:{name:'لبنان 🇱🇧'}, SY:{name:'سوريا 🇸🇾'}, SD:{name:'السودان 🇸🇩'},
        YE:{name:'اليمن 🇾🇪'}, OM:{name:'عُمان 🇴🇲'}, BH:{name:'البحرين 🇧🇭'}, TR:{name:'تركيا 🇹🇷'},
        US:{name:'الولايات المتحدة 🇺🇸'}, CA:{name:'كندا 🇨🇦'}, MX:{name:'المكسيك 🇲🇽'}, BR:{name:'البرازيل 🇧🇷'},
        AR:{name:'الأرجنتين 🇦🇷'}, GB:{name:'المملكة المتحدة 🇬🇧'}, FR:{name:'فرنسا 🇫🇷'}, DE:{name:'ألمانيا 🇩🇪'},
        ES:{name:'إسبانيا 🇪🇸'}, IT:{name:'إيطاليا 🇮🇹'}, CH:{name:'سويسرا 🇨🇭'}, BE:{name:'بلجيكا 🇧🇪'},
        NL:{name:'هولندا 🇳🇱'}, PT:{name:'البرتغال 🇵🇹'}, SE:{name:'السويد 🇸🇪'}, NO:{name:'النرويج 🇳🇴'},
        RU:{name:'روسيا 🇷🇺'}, IN:{name:'الهند 🇮🇳'}, PK:{name:'باكستان 🇵🇰'}, ID:{name:'إندونيسيا 🇮🇩'},
        MY:{name:'ماليزيا 🇲🇾'}, CN:{name:'الصين 🇨🇳'}, JP:{name:'اليابان 🇯🇵'}, KR:{name:'كوريا الجنوبية 🇰🇷'},
        AU:{name:'أستراليا 🇦🇺'}, NG:{name:'نيجيريا 🇳🇬'}, ZA:{name:'جنوب أفريقيا 🇿🇦'}, SN:{name:'السنغال 🇸🇳'},
        OTHER:{name:'فضاء آخر 🌍'}
    };

    const $ = id => document.getElementById(id);

    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));

    function trackEvent(eventName, params = {}) {
        try { if (typeof gtag === 'function') gtag('event', eventName, params); } catch (e) {}
    }

    const flagOf = code => /^[A-Z]{2}$/.test(code)
        ? code.replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)))
        : '🌍';

    const _dnCache = {};
    function countryLabel(code, lang) {
        if (!code) return '';
        if (code === 'OTHER') return lang === 'ar' ? 'فضاء آخر 🌍' : 'Deep space 🌍';
        try {
            _dnCache[lang] = _dnCache[lang] || new Intl.DisplayNames([lang === 'ar' ? 'ar' : 'en'], { type: 'region' });
            const n = _dnCache[lang].of(code);
            if (n && n !== code) return n + ' ' + flagOf(code);
        } catch (e) {}
        return (COUNTRY_INFO[code] && COUNTRY_INFO[code].name) || code;
    }

    let AppLang = (() => { try { return localStorage.getItem('cc_lang') || 'ar'; } catch (e) { return 'ar'; } })();
    try {
        const urlLang = new URLSearchParams(location.search).get('lang');
        if (urlLang === 'en' || urlLang === 'ar') AppLang = urlLang;
    } catch (e) {}

    const cSelect = $('filterCountry');
    function populateCountries() {
        const cur = cSelect.value;
        cSelect.innerHTML = '';
        cSelect.add(new Option(AppLang === 'ar' ? '🌍 جميع الدول' : '🌍 All Countries', ''));
        Object.keys(COUNTRY_INFO).forEach(c => {
            if (c !== 'OTHER') cSelect.add(new Option(countryLabel(c, AppLang), c));
        });
        cSelect.add(new Option(countryLabel('OTHER', AppLang), 'OTHER'));
        if (cur) cSelect.value = cur;
    }
    populateCountries();

    /* ═══ الإعدادات المركزية ═══ */
    const cfg = window.CC_CONFIG || { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
    const sb = (cfg.SUPABASE_URL && window.supabase)
        ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

    let currentPage = 0;
    const LIMIT = 15;
    let isLoading = false;
    const SESSION_READS = new Set();

    /* ═══════════════════════════════════════════════════════════
       🦴 Skeleton Loading
       ═══════════════════════════════════════════════════════════ */
    function getSkeletonHTML() {
        const label = AppLang === 'ar' ? 'جاري التحميل...' : 'Loading...';
        const item = `
            <div class="skeleton-item" aria-hidden="true">
                <div class="skeleton-head">
                    <div class="skeleton-line title"></div>
                    <div class="skeleton-line badge"></div>
                </div>
                <div class="skeleton-lines-group">
                    <div class="skeleton-line text-1"></div>
                    <div class="skeleton-line text-2"></div>
                    <div class="skeleton-line text-3"></div>
                </div>
                <div class="skeleton-head">
                    <div class="skeleton-line meta"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>`;
        return `
            <div class="skeleton-list" role="status" aria-label="${label}">
                ${item.repeat(4)}
            </div>`;
    }

    function showSkeleton(container) {
        container.innerHTML = getSkeletonHTML();
    }

    /* ═══════════════════════════════════════════════════════════
       📭 Empty State — HTML جميل
       ═══════════════════════════════════════════════════════════ */
    function getEmptyStateHTML(type) {
        const isAr = AppLang === 'ar';

        /* type = 'no-results' | 'no-capsules' | 'error' */
        const config = {
            'no-results': {
                icon: '🔍',
                title: isAr ? 'لا توجد نتائج' : 'No Results Found',
                desc: isAr
                    ? 'لم يُعثر على أي رسالة تطابق الفلاتر التي اخترتها. جرّب تغيير الفلاتر أو البحث بكلمات أخرى.'
                    : 'No messages match the filters you selected. Try changing the filters or searching with different keywords.',
                cta: null,
                hint: isAr ? 'نصيحة: جرّب البحث بشعور مختلف أو دولة أخرى' : 'Tip: Try a different mood or country'
            },
            'no-capsules': {
                icon: '🛸',
                title: isAr ? 'لم تُطلق كبسولة بعد' : 'No Capsules Yet',
                desc: isAr
                    ? 'الفضاء ينتظر رسالتك. ابدأ رحلتك عبر الزمن الآن — اكتب كبسولة، واختر متى تصل.'
                    : 'Space awaits your message. Start your time travel now — write a capsule and choose when it arrives.',
                cta: {
                    href: 'index.html',
                    label: isAr ? '🚀 إطلاق أول كبسولة' : '🚀 Launch First Capsule'
                },
                hint: isAr ? 'كل كبسولة تبقى في الفضاء حتى موعدها — ستحصل على مفتاح سري لمتابعتها' : 'Every capsule stays in space until its time — you\'ll get a secret key to track it'
            },
            'error': {
                icon: '⚠️',
                title: isAr ? 'حدث خطأ' : 'Something Went Wrong',
                desc: isAr
                    ? 'تعذّر تحميل الرسائل من الفضاء. تحقق من اتصالك بالإنترنت وحاول مجددًا.'
                    : 'Failed to load messages from space. Check your internet connection and try again.',
                cta: {
                    href: 'javascript:location.reload()',
                    label: isAr ? '🔄 حاول مجددًا' : '🔄 Try Again'
                },
                hint: null
            }
        };

        const c = config[type] || config['no-results'];

        const ctaHTML = c.cta ? `
            <div class="empty-state-actions">
                <a href="${c.cta.href}" class="empty-state-cta">
                    ${c.cta.label}
                </a>
            </div>` : '';

        const hintHTML = c.hint ? `
            <div class="empty-state-hint">
                <span class="empty-state-hint-icon">💡</span>
                <span>${c.hint}</span>
            </div>` : '';

        return `
            <div class="empty-state" role="status">
                <div class="empty-state-icon">${c.icon}</div>
                <h2 class="empty-state-title">${c.title}</h2>
                <p class="empty-state-desc">${c.desc}</p>
                ${ctaHTML}
                ${hintHTML}
            </div>`;
    }

    function showEmpty(container, type) {
        container.innerHTML = getEmptyStateHTML(type);
    }

    /* ═══ الجلب ═══ */
    async function fetchArchive(reset) {
        reset = !!reset;
        if (!sb) {
            showEmpty($('archiveList'), 'error');
            return;
        }
        if (isLoading) return;
        isLoading = true;

        const list = $('archiveList');

        if (reset) {
            currentPage = 0;
            $('loadMoreBtn').style.display = 'none';
            showSkeleton(list);
        } else {
            $('loader').style.display = 'block';
        }

        const country = $('filterCountry').value;
        const mood    = $('filterMood').value;
        const lang    = $('filterLang').value;
        const sort    = $('filterSort').value;

        let q = sb.from('capsules').select('*', { count: 'exact' })
            .eq('mode', 'public').eq('status', 'visible');

        if (country) q = q.eq('country', country);
        if (mood)    q = q.eq('mood', mood);
        if (lang)    q = q.eq('lang', lang);

        if (sort === 'newest')      q = q.order('created_at', { ascending: false });
        else if (sort === 'oldest') q = q.order('created_at', { ascending: true });
        else if (sort === 'reads')  q = q.order('reads_count', { ascending: false });

        q = q.range(currentPage * LIMIT, (currentPage + 1) * LIMIT - 1);

        const { data, error, count } = await q;
        $('loader').style.display = 'none';
        isLoading = false;

        if (error) {
            if (reset) showEmpty(list, 'error');
            return;
        }

        if (reset) list.innerHTML = '';

        if (reset && (!data || data.length === 0)) {
            /* ✅ إذا كانت الفلاتر افتراضية → "no-capsules" */
            const hasFilters = country || mood || lang;
            showEmpty(list, hasFilters ? 'no-results' : 'no-capsules');
            return;
        }

        data.forEach(r => list.appendChild(createCard(r)));
        $('loadMoreBtn').style.display =
            (data.length === LIMIT && (currentPage + 1) * LIMIT < count) ? 'inline-block' : 'none';
        currentPage++;
    }

    /* ═══ روابط المشاركة ═══ */
    function buildSocialRow(code, text) {
        const url = `${location.origin}${location.pathname}?capsule=${encodeURIComponent(code)}`;
        const shortText = text.slice(0, 100);
        const waText = encodeURIComponent(`${shortText}\n${url}`);
        const twText = encodeURIComponent(shortText);
        const twUrl  = encodeURIComponent(url);
        const fbUrl  = encodeURIComponent(url);
        const tgUrl  = encodeURIComponent(url);
        const tgText = encodeURIComponent(shortText);
        const label = AppLang === 'ar' ? 'شارك:' : 'Share:';

        return `
            <div class="social-row">
                <span class="social-label">${label}</span>
                <a href="https://wa.me/?text=${waText}" target="_blank" rel="noopener" class="social-btn whatsapp" title="WhatsApp" data-social="whatsapp">📱</a>
                <a href="https://twitter.com/intent/tweet?text=${twText}&url=${twUrl}" target="_blank" rel="noopener" class="social-btn twitter" title="X / Twitter" data-social="twitter">𝕏</a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${fbUrl}" target="_blank" rel="noopener" class="social-btn facebook" title="Facebook" data-social="facebook">f</a>
                <a href="https://t.me/share/url?url=${tgUrl}&text=${tgText}" target="_blank" rel="noopener" class="social-btn telegram" title="Telegram" data-social="telegram">✈️</a>
                <button class="social-btn copy-link" title="${AppLang === 'ar' ? 'نسخ الرابط' : 'Copy link'}" data-copy-url="${esc(url)}">🔗</button>
            </div>`;
    }

    /* ═══ زر إنشاء البطاقة ═══ */
    function buildCardButton(code, text, author, country, mood, arrivalAt) {
        const label = AppLang === 'ar' ? '🎨 أنشئ بطاقة' : '🎨 Create Card';
        const dataAttrs = [
            `data-card-code="${esc(code || '')}"`,
            `data-card-text="${esc((text || '').slice(0, 200))}"`,
            `data-card-author="${esc(author || '')}"`,
            `data-card-country="${esc(country || '')}"`,
            `data-card-mood="${esc(mood || 'hope')}"`,
            `data-card-arrival="${esc(arrivalAt || '')}"`
        ].join(' ');
        return `<div class="card-actions-row"><button class="btn-create-card" ${dataAttrs} type="button">${label}</button></div>`;
    }

    /* ═══ بطاقة كبسولة ═══ */
    function createCard(r) {
        const el = document.createElement('article');
        el.className = `cap-item mood-${r.mood || 'hope'}`;

        const when = new Intl.DateTimeFormat(AppLang === 'ar' ? 'ar-DZ' : 'en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date(r.created_at || r.arrival_at));

        const transUrl = `https://translate.google.com/?sl=auto&tl=${AppLang === 'ar' ? 'ar' : 'en'}&text=${encodeURIComponent(r.text)}&op=translate`;
        const translateBtn = `<a href="${transUrl}" target="_blank" rel="noopener" class="action-btn translate-btn" data-translate title="${AppLang === 'ar' ? 'ترجم' : 'Translate'}">🔤</a>`;

        const codeVal = r.code || '';
        const hasCode = !!codeVal;

        el.innerHTML = `
            <div class="cap-head">
                <div class="cap-country">${esc(countryLabel(r.country, AppLang))}</div>
                <div><span class="cap-badge public">${AppLang === 'ar' ? 'رسالة عامة' : 'Public'}</span></div>
            </div>
            <div class="cap-text">"${esc(r.text)}"</div>
            <div class="cap-meta">
                <div class="cap-author">${AppLang === 'ar' ? 'بقلم: ' : 'By: '}<b>${esc(r.author || '—')}</b></div>
                <div class="cap-stats">
                    <span>📅 ${esc(when)}</span>
                    <span>👁️ ${r.reads_count != null ? r.reads_count : 0}</span>
                    ${translateBtn}
                </div>
            </div>
            ${hasCode ? buildSocialRow(codeVal, r.text) : ''}
            ${buildCardButton(codeVal, r.text, r.author, r.country, r.mood, r.arrival_at)}`;

        el.querySelector('[data-translate]')?.addEventListener('click', () => {
            trackEvent('capsule_translated', {
                country: r.country,
                target_lang: AppLang === 'ar' ? 'ar' : 'en'
            });
        });

        el.querySelectorAll('[data-social]').forEach(btn => {
            btn.addEventListener('click', () => {
                trackEvent('capsule_shared', {
                    method: btn.dataset.social,
                    country: r.country,
                    lang: AppLang
                });
            });
        });

        const copyBtn = el.querySelector('[data-copy-url]');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const url = copyBtn.dataset.copyUrl;
                navigator.clipboard.writeText(url)
                    .then(() => {
                        copyBtn.textContent = '✅';
                        setTimeout(() => { copyBtn.textContent = '🔗'; }, 1200);
                    })
                    .catch(() => {});
                trackEvent('capsule_link_copied', { lang: AppLang });
            });
        }

        const cardBtn = el.querySelector('.btn-create-card');
        if (cardBtn) {
            cardBtn.addEventListener('click', () => {
                const opts = {
                    text: cardBtn.dataset.cardText,
                    author: cardBtn.dataset.cardAuthor,
                    country: cardBtn.dataset.cardCountry,
                    mood: cardBtn.dataset.cardMood,
                    arrivalAt: cardBtn.dataset.cardArrival || null,
                    lang: AppLang
                };
                if (window.CardGenerator && typeof window.CardGenerator.open === 'function') {
                    window.CardGenerator.open(opts);
                } else {
                    alert(AppLang === 'ar' ? 'ميزة البطاقة غير جاهزة بعد' : 'Card feature not ready yet');
                }
                trackEvent('card_generate_clicked', { mood: opts.mood, lang: AppLang });
            });
        }

        return el;
    }

    ['filterCountry', 'filterMood', 'filterLang', 'filterSort'].forEach(id =>
        $(id).addEventListener('change', () => {
            trackEvent('archive_filter_changed', {
                filter: id.replace('filter', '').toLowerCase(),
                value: $(id).value || 'all',
                lang: AppLang
            });
            fetchArchive(true);
        })
    );

    $('loadMoreBtn').addEventListener('click', () => {
        trackEvent('archive_load_more', { page: currentPage + 1, lang: AppLang });
        fetchArchive(false);
    });

    const LANGS = {
        ar: {
            toggle: 'EN', back: 'العودة للكوكب', title: 'أرشيف الكوكب',
            subtitle: 'اقرأ آلاف الرسائل التي تسبح في الفضـاء...',
            f_country: '🌍 جميع الدول', f_mood: '✨ كل المشاعر', f_lang: '🌐 كل اللغات',
            s_new: '⏳ الأحدث أولاً', s_old: '🕰️ الأقدم أولاً', s_read: '👁️ الأكثر قراءة',
            loadMore: 'تحميل المزيد',
            moods: { hope: 'أمل (Hope)', nostalgia: 'حنين (Nostalgia)', secret: 'سر (Secret)', confession: 'اعتراف (Confession)', bold: 'جرأة (Bold)' }
        },
        en: {
            toggle: 'AR', back: '← Back to Planet', title: 'Cosmic Archive',
            subtitle: 'Read thousands of messages adrift in space...',
            f_country: '🌍 All Countries', f_mood: '✨ All Moods', f_lang: '🌐 All Languages',
            s_new: '⏳ Newest First', s_old: '🕰️ Oldest First', s_read: '👁️ Most Read',
            loadMore: 'Load More',
            moods: { hope: 'Hope', nostalgia: 'Nostalgia', secret: 'Secret', confession: 'Confession', bold: 'Bold' }
        }
    };

    function applyLang(l) {
        const wasChanging = (AppLang !== l);
        AppLang = l;
        try { localStorage.setItem('cc_lang', l); } catch (e) {}

        if (wasChanging) {
            trackEvent('language_toggle', { lang: l, page: 'archive' });
        }

        const D = LANGS[l] || LANGS.ar;
        document.documentElement.lang = l;
        document.documentElement.dir  = (l === 'ar') ? 'rtl' : 'ltr';

        $('langToggle').textContent    = D.toggle;
        $('backLinkText').textContent  = D.back;
        $('pageTitle').textContent     = D.title;
        $('pageSubtitle').textContent  = D.subtitle;
        $('loadMoreBtn').textContent   = D.loadMore;

        const fMood = $('filterMood');
        fMood.options[0].text = D.f_mood;
        const moodKeys = ['hope', 'nostalgia', 'secret', 'confession', 'bold'];
        moodKeys.forEach((k, i) => {
            if (fMood.options[i + 1]) fMood.options[i + 1].text = D.moods[k];
        });

        const fSort = $('filterSort');
        fSort.options[0].text = D.s_new;
        fSort.options[1].text = D.s_old;
        fSort.options[2].text = D.s_read;

        $('filterLang').options[0].text = D.f_lang;

        populateCountries();
        fetchArchive(true);
    }

    $('langToggle').addEventListener('click', () => applyLang(AppLang === 'ar' ? 'en' : 'ar'));

    applyLang(AppLang);
})();
