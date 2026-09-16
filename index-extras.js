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

    /* ═══════════════════════════════════════════════════════
       6) Hamburger Menu
       ═══════════════════════════════════════════════════════ */
    (function(){
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const hamburgerClose = document.getElementById('hamburgerClose');
        const hamburgerBackdrop = document.getElementById('hamburgerBackdrop');
        const hamburgerNotifBtn = document.getElementById('hamburgerNotifBtn');
        const hamburgerLangBtn = document.getElementById('hamburgerLangBtn');

        if (!hamburgerBtn || !hamburgerMenu) return;

        let isOpen = false;

        /* ✅ فتح القائمة */
        function openMenu() {
            isOpen = true;
            hamburgerBtn.classList.add('active');
            hamburgerBtn.setAttribute('aria-expanded', 'true');
            hamburgerMenu.classList.add('open');
            hamburgerMenu.setAttribute('aria-hidden', 'false');
            if (hamburgerBackdrop) {
                hamburgerBackdrop.classList.add('show');
                hamburgerBackdrop.setAttribute('aria-hidden', 'false');
            }
            document.body.classList.add('hamburger-open');
        }

        /* ✅ إغلاق القائمة */
        function closeMenu() {
            isOpen = false;
            hamburgerBtn.classList.remove('active');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            hamburgerMenu.classList.remove('open');
            hamburgerMenu.setAttribute('aria-hidden', 'true');
            if (hamburgerBackdrop) {
                hamburgerBackdrop.classList.remove('show');
                hamburgerBackdrop.setAttribute('aria-hidden', 'true');
            }
            document.body.classList.remove('hamburger-open');
        }

        /* ✅ تبديل الحالة */
        function toggleMenu() {
            if (isOpen) closeMenu();
            else openMenu();
        }

        /* ✅ ربط الأحداث */
        hamburgerBtn.addEventListener('click', toggleMenu);
        if (hamburgerClose) hamburgerClose.addEventListener('click', closeMenu);
        if (hamburgerBackdrop) hamburgerBackdrop.addEventListener('click', closeMenu);

        /* ✅ إغلاق بمفتاح Escape */
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isOpen) closeMenu();
        });

        /* ✅ إغلاق عند النقر على أي رابط داخل القائمة */
        hamburgerMenu.querySelectorAll('a.hamburger-link').forEach(function(link) {
            link.addEventListener('click', function() {
                setTimeout(closeMenu, 150);
            });
        });

        /* ✅ زر الإشعارات داخل القائمة */
        if (hamburgerNotifBtn) {
            hamburgerNotifBtn.addEventListener('click', function() {
                closeMenu();
                setTimeout(function() {
                    const bell = document.getElementById('notifBell');
                    if (bell) bell.click();
                }, 350);
            });
        }

        /* ✅ زر تبديل اللغة داخل القائمة */
        if (hamburgerLangBtn) {
            hamburgerLangBtn.addEventListener('click', function() {
                const langToggle = document.querySelector('.lang-toggle');
                if (langToggle) {
                    langToggle.click();
                    setTimeout(function() {
                        const span = hamburgerLangBtn.querySelector('span:last-child');
                        if (span && window.CCI18N) {
                            span.textContent = window.CCI18N.t('lang_btn');
                        }
                    }, 100);
                }
            });
        }

        /* ✅ مزامنة شارة الإشعارات — MutationObserver بدل setInterval */
        const menuBadge = hamburgerNotifBtn?.querySelector('.notification-badge');
        const originalBadge = document.querySelector('.notifications-btn .notification-badge');

        function syncNotifBadge() {
            if (!originalBadge || !menuBadge) return;
            if (originalBadge.style.display !== 'none' && originalBadge.textContent) {
                menuBadge.style.display = 'inline-block';
                menuBadge.textContent = originalBadge.textContent;
            } else {
                menuBadge.style.display = 'none';
            }
        }

        /* ✅ مراقبة التغييرات على شارة الإشعارات الأصلية بدل setInterval */
        if (originalBadge && menuBadge && 'MutationObserver' in window) {
            const badgeObserver = new MutationObserver(syncNotifBadge);
            badgeObserver.observe(originalBadge, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            });

            /* ✅ تنظيف عند مغادرة الصفحة */
            window.addEventListener('pagehide', () => {
                badgeObserver.disconnect();
            }, { once: true });
        }

        /* مزامنة أولية */
        syncNotifBadge();

        /* ✅ إغلاق عند تغيير حجم الشاشة لديسكتوب */
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && isOpen) {
                closeMenu();
            }
        });
    })();

})();
