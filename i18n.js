document.addEventListener('DOMContentLoaded', () => {
    let saved = null;
    try { saved = localStorage.getItem('cc_lang'); } catch (e) {}
    lang = saved || ((navigator.language || 'ar').toLowerCase().startsWith('ar') ? 'ar' : 'en');

    toggleBtn = document.createElement('button');
    toggleBtn.className = 'lang-toggle';
    toggleBtn.type = 'button';
    toggleBtn.addEventListener('click', () => setLang(lang === 'ar' ? 'en' : 'ar'));
    
    // إضافة الزر مباشرة لأسفل الـ Header بدون أي شروط معقدة أو insertBefore
    const header = document.querySelector('.site-header');
    if (header) {
      header.appendChild(toggleBtn);
    }

    setLang(lang, false);
  });
