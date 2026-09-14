/* ═══════════════════════════════════════════════════════════
   Chronos Capsule — Page Transitions
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    /* ═══ Fade-in عند تحميل الصفحة ═══ */
    document.documentElement.style.opacity = '0';
    document.documentElement.style.transition = 'opacity 0.35s ease';

    function fadeIn() {
        requestAnimationFrame(() => {
            document.documentElement.style.opacity = '1';
        });
    }

    if (document.readyState === 'complete') {
        fadeIn();
    } else {
        window.addEventListener('load', fadeIn);
        /* احتياط: إذا تأخر التحميل */
        setTimeout(fadeIn, 800);
    }

    /* ═══ Fade-out عند الضغط على رابط ═══ */
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        /* تجاهل: روابط خارجية، anchors، mailto، tel، _blank، تعديل مفاتيح */
        if (href.startsWith('#')) return;
        if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (link.target === '_blank') return;
        if (link.hasAttribute('download')) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        if (href.startsWith('http') && !href.includes(location.hostname)) return;

        e.preventDefault();
        document.documentElement.style.opacity = '0';

        setTimeout(function() {
            window.location.href = href;
        }, 300);
    });

    /* ═══ عند الرجوع بزر المتصفح ═══ */
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            document.documentElement.style.opacity = '1';
        }
    });
})();
