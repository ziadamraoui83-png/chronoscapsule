(function(){
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
    const cSelect = $('filterCountry');
    Object.keys(COUNTRY_INFO).forEach(c => {
        if(c !== 'OTHER') cSelect.add(new Option(COUNTRY_INFO[c].name, c));
    });
    cSelect.add(new Option(COUNTRY_INFO.OTHER.name, 'OTHER'));

    const CC_SB_URL = localStorage.getItem('cc_sb_url') || 'YOUR_SUPABASE_URL';
    const CC_SB_KEY = localStorage.getItem('cc_sb_key') || 'YOUR_SUPABASE_KEY';
    let sb = null;
    if (CC_SB_URL.startsWith('http')) sb = supabase.createClient(CC_SB_URL, CC_SB_KEY);

    let currentPage = 0; const LIMIT = 15; let isLoading = false;
    
    async function fetchArchive(reset = false) {
        if (!sb) {
            $('archiveList').innerHTML = '<div style="text-align:center;color:#f87171;padding:20px">لم يتم ربط قاعدة البيانات بعد.</div>';
            return;
        }
        if (isLoading) return;
        isLoading = true;
        $('loader').style.display = 'block';
        if (reset) { currentPage = 0; $('archiveList').innerHTML = ''; $('loadMoreBtn').style.display = 'none'; }
        
        const country = $('filterCountry').value, mood = $('filterMood').value, lang = $('filterLang').value, sort = $('filterSort').value;
        let q = sb.from('capsules').select('*', { count: 'exact' }).eq('mode', 'public').neq('is_hidden', true);
        
        if (country) q = q.eq('country', country);
        if (mood) q = q.eq('mood', mood);
        if (lang) q = q.eq('lang', lang);
        
        if (sort === 'newest') q = q.order('created_at', { ascending: false });
        else if (sort === 'oldest') q = q.order('created_at', { ascending: true });
        else if (sort === 'reads') q = q.order('reads_count', { ascending: false });
        
        q = q.range(currentPage * LIMIT, (currentPage + 1) * LIMIT - 1);
        const { data, error, count } = await q;
        $('loader').style.display = 'none'; 
        isLoading = false;
        
        if (error) {
            if (reset) $('archiveList').innerHTML = `<div style="text-align:center;color:#f87171">حدث خطأ: ${error.message}</div>`;
            return;
        } // تم إغلاق شرط الخطأ

        if (reset && (!data || data.length === 0)) {
            $('archiveList').innerHTML = '<div style="text-align:center;color:#94a3b8;padding:30px;">لم يُعثر على أي رسالة بهذا الفلتر.</div>';
            return;
        }
        
        data.forEach(r => $('archiveList').appendChild(createCard(r)));
        $('loadMoreBtn').style.display = (data.length === LIMIT && (currentPage + 1) * LIMIT < count) ? 'inline-block' : 'none';
        currentPage++;
    } // تم إغلاق دالة fetchArchive بالكامل هنا

    // الآن نفتح دالة createCard بشكل منفصل ونظيف
    function createCard(r) {
        const el = document.createElement('article');
        el.className = `cap-item mood-${r.mood || 'hope'}`;
        const ci = COUNTRY_INFO[r.country] || COUNTRY_INFO.OTHER;
        const when = new Intl.DateTimeFormat(AppLang==='ar'?'ar-DZ':'en-GB', { day:'numeric', month:'long', year:'numeric' }).format(new Date(r.created_at || r.arrival_at));
        const transUrl = `https://translate.google.com/?sl=auto&tl=${AppLang==='ar'?'ar':'en'}&text=${encodeURIComponent(r.text)}&op=translate`;
        const translateBtn = `<a href="${transUrl}" target="_blank" class="action-btn translate-btn" title="${AppLang === 'ar' ? 'ترجم' : 'Translate'}">🔤</a>`;

        el.innerHTML = `
            <div class="cap-head">
                <div class="cap-country">${ci.name}</div>
                <div><span class="cap-badge public">${AppLang === 'ar' ? 'رسالة عامة' : 'Public'}</span></div>
            </div>
            <div class="cap-text">"${r.text.replace(/</g,'&lt;')}"</div>
            <div class="cap-meta">
                <div class="cap-author">${(AppLang==='ar'?'بقلم: ':'By: ')} <b>${(r.author||'—').replace(/</g,'&lt;')}</b></div>
                <div class="cap-stats"><span>📅 ${when}</span><span>👁️ ${r.reads_count ?? 0}</span>${translateBtn}</div>
            </div>
        `;
        return el;
    }

    ['filterCountry', 'filterMood', 'filterLang', 'filterSort'].forEach(id => $(id).addEventListener('change', () => fetchArchive(true)));
    $('loadMoreBtn').addEventListener('click', () => fetchArchive(false));

    /* ══ الترجمة والتوطين ══ */
    const LANGS = {
        ar:{toggle:'EN',back:'العودة للكوكب',title:'أرشيف الكوكب',subtitle:'اقرأ آلاف الرسائل التي تسبح في الفضـاء...',
            f_country:'🌍 جميع الدول', f_mood:'✨ كل المشاعر', f_lang:'🌐 كل اللغات', 
            s_new:'⏳ الأحدث أولاً', s_old:'🕰️ الأقدم أولاً', s_read:'👁️ الأكثر قراءة', loadMore:'تحميل المزيد'},
        en:{toggle:'AR',back:'← Back to Planet',title:'Cosmic Archive',subtitle:'Read thousands of messages adrift in space...',
            f_country:'🌍 All Countries', f_mood:'✨ All Moods', f_lang:'🌐 All Languages', 
            s_new:'⏳ Newest First', s_old:'🕰️ Oldest First', s_read:'👁️ Most Read', loadMore:'Load More'}
    };
    let AppLang = (()=>{ try{return localStorage.getItem('cc_lang')||'ar';}catch(e){return 'ar';} })();

    function applyLang(l){
        AppLang = l; try{localStorage.setItem('cc_lang',l);}catch(e){}
        const D = LANGS[l]||LANGS.ar;
        document.documentElement.lang = l; document.documentElement.dir = l==='ar'?'rtl':'ltr';
        $('langToggle').textContent = D.toggle; $('backLinkText').textContent = D.back;
        $('pageTitle').textContent = D.title; $('pageSubtitle').textContent = D.subtitle;
        $('loadMoreBtn').textContent = D.loadMore;
        $('filterCountry').options[0].text = D.f_country; $('filterMood').options[0].text = D.f_mood;
        $('filterLang').options[0].text = D.f_lang; $('filterSort').options[0].text = D.s_new;
        $('filterSort').options[1].text = D.s_old; $('filterSort').options[2].text = D.s_read;
        fetchArchive(true);
    }
    $('langToggle').addEventListener('click', () => applyLang(AppLang==='ar'?'en':'ar'));
    applyLang(AppLang);
})();
