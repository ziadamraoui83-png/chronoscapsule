/* ═══════════════════════════════════════════════════════════
   Chronos Capsule — Page Transitions (v2)
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        document.body.classList.add('cc-loaded');
        return;
    }

    /* ═══ Fade-in عند التحميل ═══ */
    function fadeIn() {
        document.body.classList.add('cc-loaded');
    }

    if (document.readyState === 'complete') {
        fadeIn();
    } else {
        window.addEventListener('load', fadeIn);
        /* احتياط */
        setTimeout(fadeIn, 800);
    }

    /* ═══ Fade-out عند الضغط على رابط ═══ */
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        if (href.startsWith('#')) return;
        if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (link.target === '_blank') return;
        if (link.hasAttribute('download')) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        if (href.startsWith('http') && !href.includes(location.hostname)) return;

        e.preventDefault();
        document.body.classList.remove('cc-loaded');

        setTimeout(function() {
            window.location.href = href;
        }, 300);
    });

    /* ═══ عند الرجوع بزر المتصفح ═══ */
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            document.body.classList.add('cc-loaded');
        }
    });
})();
