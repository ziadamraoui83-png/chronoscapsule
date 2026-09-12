/* ═════════ CHRONOS CAPSULE — طبقة التعريب v3 (عربي / English) ═════════ */
(function () {
  "use strict";

  const DICT = {
    ar: {
      title: 'كبسولة الزمن | Chronos Capsule',
      tagline: 'كبسولة الزمن الكونية · 🛰️ كبسولاتي',
      title_html: 'أرسل رسالتك إلى <span class="highlight">الفضاء</span>',
      desc: 'اكتب رسالتك السرية أو اعترافك، اختر دولتك، ودعها تطير لتستقر على كبسولة الزمن الكونية ليقرأها الغرباء بسلام.',
      new_msg: 'اكتب رسالة جديدة',
      counter: 'كبسولة تسبح في الفضاء',
      footer: 'جميع الرسائل تُنشر بسرية تامة ومحمية عبر الفضاء الرقمي',
      modal_title: 'إرسال كبسولة جديدة',
      msg_label: 'نص الرسالة',
      msg_ph: 'اكتب ما يدور في ذهنك بحرية...',
      mood_label: 'شعور رسالتك',
      mood_hope: 'أمل', mood_nostalgia: 'حنين', mood_secret: 'سر', mood_confession: 'اعتراف', mood_bold: 'جرأة',
      mode_label: 'نمط الكبسولة',
      mode_public: 'عامة يقرأها الجميع الآن',
      mode_private: 'سفر عبر الزمن — لنفسي فقط',
      arrival_label: 'متى تريد أن تصل؟',
      chip_tomorrow: 'غدًا', chip_week: 'بعد أسبوع', chip_month: 'بعد شهر', chip_year: 'بعد سنة', chip_custom: 'تاريخ مخصص',
      arrives_on: 'ستصل في',
      pick_date: 'اختر تاريخ الوصول أولاً',
      privacy_note: 'كبسولتك تسبح خفيةً في المدار حتى موعد وصولها — لا يستطيع أحد قراءتها قبله، حتى أنت.',
      privacy_note_pub: 'عامة الآن: تُنشر فورًا ويقرؤها الغرباء في أي لحظة.',
      name_label: 'اسمك أو اللقب',
      name_ph: 'اكتب اسمك هنا...',
      name_optional: 'اختياري — بدونه تُنشر كبسولتك باسم «مجهول»',
      send_anon: 'إرسال كمجهول',
      country_label: 'الدولة',
      choose_country: 'اختر دولتك لتحديد نقطة الانطلاق',
      launch_btn: 'إطلاق الكبسولة نحو الفضاء',
      by: 'بواسطة',
      preparing: 'جاري تجهيز الكبسولة...',
      launched: 'انطلقت كبسولتك نحو الكوكب! 🚀',
      launched_code: 'انطلقت كبسولتك! 🚀 مفتاحها: ',
      pick_warn: 'اختر دولتك أولاً لتحديد نقطة الانطلاق',
      anon_name: 'مجهول',
      lang_btn: 'EN',
      other_space: 'فضاء آخر 🌍',
      e_RATE_LIMITED: 'أطلقتَ كبسولة خلال 24 ساعة مضت… عُد غدًا ودَع الكون يتنفس ✨',
      e_BAD_WORDS: 'رسالتك تحوي كلمات غير لائقة للفضاء — راجعها من فضلك 🙏',
      e_ARRIVAL_MUST_BE_FUTURE: 'كبسولة المستقبل تحتاج تاريخ وصول في المستقبل',
      e_ARRIVAL_TOO_FAR: 'أقصى مدة للسفر عبر الزمن: 5 سنوات',
      e_REPLY_RATE_LIMITED: 'ردّك السابق ما زال يطير… انتظر دقيقة 💫',
      e_CAPSULE_NOT_OPEN: 'هذه الكبسولة لم تصل بعد أو غير متاحة',
      deep_btn: 'كبسولة من الأعماق',
      deep_title: 'من أعماق المحيط',
      deep_again: 'غَوْصة أخرى',
      deep_empty: 'المحيط هادئ الآن… لا توجد كبسولات قديمة كفاية بعد. عُد بعد يومين 🌊',
      deep_reads: 'قراءة',
      e_FAIL: 'تعذر الإطلاق، حاول من جديد',
      foot_about: 'من نحن',
      foot_privacy: 'سياسة الخصوصية',
      foot_terms: 'شروط الاستخدام',
      foot_archive: 'الأرشيف',
      foot_how: 'كيف يعمل',
      foot_blog: 'المدونة',
      nav_my_capsules: 'كبسولاتي',
      foot_faq: 'الأسئلة الشائعة',
      golden_title: 'الكبسولة الذهبية اليوم',
      golden_hint: 'تتغير كل يوم عند منتصف الليل'
    },
    en: {
      title: 'Chronos Capsule | Send a message to space',
      tagline: 'Cosmic Time Capsule · 🛰️ My Capsules',
      title_html: 'Send your message to <span class="highlight">space</span>',
      desc: 'Write your secret or confession, pick your country, and let it fly to rest upon the cosmic time capsule — for strangers to read in peace.',
      new_msg: 'Write a new message',
      counter: 'capsules adrift in space',
      footer: 'All messages are published anonymously, protected across the digital cosmos',
      modal_title: 'Launch a new capsule',
      msg_label: 'Your message',
      msg_ph: "Write freely what's on your mind...",
      mood_label: 'Message mood',
      mood_hope: 'Hope', mood_nostalgia: 'Nostalgia', mood_secret: 'Secret', mood_confession: 'Confession', mood_bold: 'Bold',
      mode_label: 'Capsule mode',
      mode_public: 'Public — everyone reads it now',
      mode_private: 'Time travel — for my eyes only',
      arrival_label: 'When should it arrive?',
      chip_tomorrow: 'Tomorrow', chip_week: 'In a week', chip_month: 'In a month', chip_year: 'In a year', chip_custom: 'Custom date',
      arrives_on: 'Arrives on',
      pick_date: 'Pick an arrival date first',
      privacy_note: 'Your capsule orbits silently until arrival day — no one can read it before, not even you.',
      privacy_note_pub: 'Public now: published instantly for strangers to read.',
      name_label: 'Your name or alias',
      name_ph: 'Type your name here...',
      name_optional: 'Optional — without it your capsule is signed "Anonymous"',
      send_anon: 'Send anonymously',
      country_label: 'Country',
      choose_country: 'Choose your country as the launch point',
      launch_btn: 'Launch capsule into space',
      by: 'By',
      preparing: 'Preparing your capsule...',
      launched: 'Your capsule is on its way! 🚀',
      launched_code: 'Capsule launched! 🚀 Key: ',
      pick_warn: 'Pick your country first to set the launch point',
      anon_name: 'Anonymous',
      lang_btn: 'عربي',
      other_space: 'Deep space 🌍',
      e_RATE_LIMITED: 'You already launched a capsule within 24 hours… come back tomorrow ✨',
      e_BAD_WORDS: 'Your message contains words unworthy of space — please review it 🙏',
      e_ARRIVAL_MUST_BE_FUTURE: 'A future capsule needs an arrival date ahead of now',
      e_ARRIVAL_TOO_FAR: 'Maximum time travel: 5 years',
      e_REPLY_RATE_LIMITED: 'Your previous reply is still in flight… wait a minute 💫',
      e_CAPSULE_NOT_OPEN: 'This capsule has not arrived yet, or is unavailable',
      deep_btn: 'Capsule from the deep',
      deep_title: 'From the ocean depths',
      deep_again: 'Dive again',
      deep_empty: 'The ocean is calm… no old-enough capsules yet. Come back in two days 🌊',
      deep_reads: 'reads',
      e_FAIL: 'Launch failed, please try again',
      foot_about: 'About',
      foot_privacy: 'Privacy Policy',
      foot_terms: 'Terms of Use',
      foot_archive: 'Archive',
      foot_how: 'How It Works',
      foot_blog: 'Blog',
      nav_my_capsules: 'My Capsules',
      foot_faq: 'FAQ',
      golden_title: 'Golden Capsule of the Day',
      golden_hint: 'Changes daily at midnight'
    }
  };

  const SELS = [
    ['.tagline a', 'tagline'],
    ['.main-title', 'title_html', 'html'],
    ['.main-desc', 'desc'],
    ['.capsule-counter span:last-child', 'counter'],
    ['.site-footer p', 'footer'],
    ['.modal-header h3', 'modal_title'],
    ['label[for="messageText"]', 'msg_label'],
    ['#messageText', 'msg_ph', 'ph'],
    ['label[for="authorName"]', 'name_label'],
    ['#authorName', 'name_ph', 'ph'],
    ['label[for="userCountry"]', 'country_label'],
    ['.btn-submit', 'launch_btn']
  ];

  let lang = 'ar';
  let toggleBtn = null;
  const dnCache = {};

  const t = (key) => (DICT[lang] && DICT[lang][key]) || key;
  const err = (code) => (DICT[lang]['e_' + code]) || DICT[lang].e_FAIL;

  function regionName(code, lg) {
    try {
      dnCache[lg] = dnCache[lg] || new Intl.DisplayNames([lg], { type: 'region' });
      const n = dnCache[lg].of(code);
      return (n && n !== code) ? n : null;
    } catch (e) { return null; }
  }

  function flagOf(code) {
    return /^[A-Z]{2}$/.test(code)
      ? code.replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)))
      : '🌍';
  }

  function countryLabel(code) {
    if (!code) return '';
    if (code === 'OTHER') return t('other_space');
    const info = (window.COUNTRY_INFO || {})[code];
    const name = regionName(code, lang) || (info && info.name) || code;
    return name + ' ' + flagOf(code);
  }

  function applyCountries() {
    const sel = document.getElementById('userCountry');
    const CI = window.COUNTRY_INFO || {};
    if (!sel) return;

    const cur = sel.value;
    sel.innerHTML = '';
    const ph = new Option(t('choose_country'), '');
    ph.disabled = true; ph.selected = true;
    sel.add(ph);

    if (Object.keys(CI).length > 0) {
      Object.keys(CI).forEach(c => { if (c !== 'OTHER') sel.add(new Option(countryLabel(c), c)); });
    }
    sel.add(new Option(countryLabel('OTHER'), 'OTHER'));
    if (cur && (CI[cur] || cur === 'OTHER')) sel.value = cur;
  }

  function setTextNode(el, txt) {
    const node = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (node) node.textContent = txt;
    else el.appendChild(document.createTextNode(' ' + txt));
  }

  function applyDataI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll('[data-i18n-chip]').forEach(el => { el.textContent = t('chip_' + el.dataset.i18nChip); });
  }

  function applyTexts() {
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    document.title = t('title');
    for (const [sel, key, mode] of SELS) {
      const el = document.querySelector(sel);
      if (!el) continue;
      if (mode === 'ph') el.placeholder = t(key);
      else if (mode === 'html') el.innerHTML = t(key);
      else if (mode === 'node') setTextNode(el, t(key));
      else el.textContent = t(key);
    }
    applyDataI18n();
    if (toggleBtn) toggleBtn.textContent = t('lang_btn');
  }

  function setLang(l, save) {
    lang = l;
    if (save !== false) { try { localStorage.setItem('cc_lang', l); } catch (e) {} }
    applyTexts();
    applyCountries();
    window.dispatchEvent(new CustomEvent('cc:lang'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    let saved = null;
    try { saved = localStorage.getItem('cc_lang'); } catch (e) {}

    let urlLang = null;
    try {
      const p = new URLSearchParams(location.search).get('lang');
      if (p === 'ar' || p === 'en') urlLang = p;
    } catch (e) {}

    lang = urlLang
        || saved
        || ((navigator.language || 'ar').toLowerCase().startsWith('ar') ? 'ar' : 'en');

    toggleBtn = document.createElement('button');
    toggleBtn.className = 'lang-toggle';
    toggleBtn.type = 'button';
    toggleBtn.addEventListener('click', () => setLang(lang === 'ar' ? 'en' : 'ar'));

    const header = document.querySelector('.site-header');
    if (header) {
      const innerAction = header.querySelector(':scope > div:not(.logo)');
      if (innerAction && innerAction.tagName === 'DIV') {
        innerAction.appendChild(toggleBtn);
      } else {
        header.appendChild(toggleBtn);
      }
    }

    setLang(lang, false);
  });

  window.CCI18N = {
    get lang() { return lang; },
    t,
    err,
    countryLabel,
    applyCountries,
    setLang
  };
})();
