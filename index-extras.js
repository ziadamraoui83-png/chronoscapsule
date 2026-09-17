/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — index-extras.js (v2.0)
   يحتوي على: Loader / CTA button / SW / PWA / Lenis + Reveal / Hamburger
   ⚠️ يُحمَّل قبل transitions.js
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    const __CC_DEBUG = location.hostname === 'localhost' ||
                       location.hostname === '127.0.0.1' ||
                       location.search.includes('debug');

    /* ═══════════════════════════════════════════════════════
       1) Loader — يختفي بعد التحميل
       ═══════════════════════════════════════════════════════ */
    window.addEventListener('load', () =>
        setTimeout(() => document.getElementById('ccLoader')?.classList.add('done'), 400)
    );
    setTimeout(() => document.getElementById('ccLoader')?.classList.add('done'), 6000);

    /* ═══════════════════════════════════════════════════════
       2) زر CTA السفلي → يفتح نفس Modal
       ═══════════════════════════════════════════════════════ */
    document.getElementById('openModalBtnBottom')?.addEventListener('click', () => {
        document.getElementById('openModalBtn')?.click();
    });

    /* ═══════════════════════════════════════════════════════
       3) Service Worker registration
       ═══════════════════════════════════════════════════════ */
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.getRegistration('/sw.js').then(existing => {
                if (existing) {
                    if (__CC_DEBUG) console.log('✅ SW already registered:', existing.scope);
                    return existing;
                }
                return navigator.serviceWorker.register('/sw.js')
                    .then(reg => {
                        if (__CC_DEBUG) console.log('✅ SW registered:', reg.scope);
                    })
                    .catch(err => {
                        if (__CC_DEBUG) console.log('❌ SW error:', err);
                    });
            });
        });
    }

    /* ═══════════════════════════════════════════════════════
       4) PWA Install Button
       ═══════════════════════════════════════════════════════ */
    let deferredPrompt = null;
    const installBtn = document.createElement('button');
    installBtn.id = 'ccInstallBtn';
    installBtn.type = 'button';
    installBtn.innerHTML = '📱 <span>ثبّت التطبيق</span>';
    installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(120%);
        background: linear-gradient(135deg, #6d28d9, #2563eb);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 12px 22px;
        font-family: 'Tajawal', sans-serif;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        z-index: 998;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 8px 32px rgba(99,102,241,.4);
        transition: transform .4s cubic-bezier(.34,1.56,.64,1);
        backdrop-filter: blur(10px);
    `;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.body.appendChild(installBtn);
        setTimeout(() => {
            installBtn.style.transform = 'translateX(-50%) translateY(0)';
        }, 1500);
    });

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (typeof gtag === 'function') {
            gtag('event', 'pwa_install_prompt', { outcome });
        }
        deferredPrompt = null;
        installBtn.style.transform = 'translateX(-50%) translateY(120%)';
        setTimeout(() => installBtn.remove(), 500);
    });

    window.addEventListener('appinstalled', () => {
        if (typeof gtag === 'function') gtag('event', 'pwa_installed');
        installBtn.remove();
    });

    /* ═══════════════════════════════════════════════════════
       5) Lenis Smooth Scroll + Reveal Animations
       ═══════════════════════════════════════════════════════ */
    (function(){
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        /* ═══ Lenis Smooth Scroll ═══ */
        if (!prefersReduced && typeof Lenis !== 'undefined') {
            const lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                wheelMultiplier: 1,
                touchMultiplier: 2,
            });

            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);

            /* ✅ دعم روابط الـ anchor — معالج واحد فقط (بدون تكرار) */
            document.querySelectorAll('a[href^="#"]').forEach(a => {
                a.addEventListener('click', (e) => {
                    const id = a.getAttribute('href');
                    if (id && id.length > 1) {
                        const el = document.querySelector(id);
                        if (el) {
                            e.preventDefault();
                            lenis.scrollTo(el, { offset: -80 });
                        }
                    }
                });
            });
        } else {
            /* ✅ Fallback: إذا Lenis غير متاح */
            document.querySelectorAll('a[href^="#"]').forEach(a => {
                a.addEventListener('click', (e) => {
                    const id = a.getAttribute('href');
                    if (id && id.length > 1) {
                        const el = document.querySelector(id);
                        if (el) {
                            e.preventDefault();
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                });
            });
        }

        /* ═══ Reveal Animations ═══ */
        const revealTargets = document.querySelectorAll(
            '.landing-section-title, .landing-section-sub, .feature-card, .blog-preview-card, .stat-card, .cta-title, .cta-desc, .btn-cta-big, .blog-preview-cta'
        );

        if (revealTargets.length > 0 && !prefersReduced) {
            revealTargets.forEach(el => el.classList.add('reveal'));

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const delay = Math.min(entry.target.dataset.delay || 0, 300);
                        setTimeout(() => {
                            entry.target.classList.add('visible');
                        }, delay);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -60px 0px'
            });

            /* تأخير متسلسل للـ grid items */
            document.querySelectorAll('.features-grid, .blog-preview-grid, .stats-grid').forEach(grid => {
                grid.querySelectorAll(':scope > *').forEach((child, i) => {
                    child.dataset.delay = i * 80;
                });
            });

            revealTargets.forEach(el => observer.observe(el));
        }
    })();

})();
