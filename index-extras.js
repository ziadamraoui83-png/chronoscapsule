/* ═══ index-extras.js — كان سكربتات مضمنة في index.html ═══
   المحتوى: ccLoader / زر CTA السفلي / Service Worker / زر التثبيت PWA /
   Lenis Smooth Scroll + Reveal / قائمة Hamburger
   ⚠️ يُحمَّل في نفس الموضع السابق: بعد المكتبات وقبل transitions.js */

    window.addEventListener('load', () => setTimeout(() => document.getElementById('ccLoader')?.classList.add('done'), 400));
    setTimeout(() => document.getElementById('ccLoader')?.classList.add('done'), 6000);

    /* زر CTA السفلي → يفتح نفس Modal */
    document.getElementById('openModalBtnBottom')?.addEventListener('click', () => {
        document.getElementById('openModalBtn')?.click();
    });

    /* Scroll smooth */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            if (id && id.length > 1) {
                const el = document.querySelector(id);
                if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    /* ✅ Service Worker registration - فقط debug mode يطبع في console */
    if ('serviceWorker' in navigator) {
        const __ccDebug = location.hostname === 'localhost' ||
                          location.hostname === '127.0.0.1' ||
                          location.search.includes('debug');

        window.addEventListener('load', () => {
            /* ✅ التحقق من تسجيل سابق لتجنب التكرار */
            navigator.serviceWorker.getRegistration('/sw.js').then(existing => {
                if (existing) {
                    if (__ccDebug) console.log('✅ SW already registered:', existing.scope);
                    return existing;
                }
                return navigator.serviceWorker.register('/sw.js')
                    .then(reg => {
                        if (__ccDebug) console.log('✅ SW registered:', reg.scope);
                    })
                    .catch(err => {
                        if (__ccDebug) console.log('❌ SW error:', err);
                    });
            });
        });
    }

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

    (function(){
        'use strict';

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

            /* دعم روابط الـ anchor */
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
        }

        /* ═══ Reveal Animations (IntersectionObserver) ═══ */
        const revealTargets = document.querySelectorAll(
            '.landing-section-title, .landing-section-sub, .feature-card, .blog-preview-card, .stat-card, .cta-title, .cta-desc, .btn-cta-big, .blog-preview-cta'
        );

        if (revealTargets.length > 0 && !prefersReduced) {
            revealTargets.forEach(el => el.classList.add('reveal'));

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, i) => {
                    if (entry.isIntersecting) {
                        /* تأخير متسلسل للعناصر المتعددة */
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
    (function() {
        'use strict';

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
                /* تأخير قصير للسماح بالتنقل */
                setTimeout(closeMenu, 150);
            });
        });

        /* ✅ زر الإشعارات داخل القائمة */
        if (hamburgerNotifBtn) {
            hamburgerNotifBtn.addEventListener('click', function() {
                closeMenu();
                /* فتح لوحة الإشعارات بعد إغلاق القائمة */
                setTimeout(function() {
                    const bell = document.getElementById('notifBell');
                    if (bell) bell.click();
                }, 350);
            });
        }

        /* ✅ زر تبديل اللغة داخل القائمة */
        if (hamburgerLangBtn) {
            hamburgerLangBtn.addEventListener('click', function() {
                /* استعمال زر اللغة الرئيسي إن وجد */
                const langToggle = document.querySelector('.lang-toggle');
                if (langToggle) {
                    langToggle.click();
                    /* تحديث نص زر اللغة في القائمة */
                    setTimeout(function() {
                        const span = hamburgerLangBtn.querySelector('span:last-child');
                        if (span && window.CCI18N) {
                            span.textContent = window.CCI18N.t('lang_btn');
                        }
                    }, 100);
                }
            });
        }

        /* ✅ مزامنة شارة الإشعارات بين الجرس والقائمة */
        function syncNotifBadge() {
            const originalBadge = document.querySelector('.notifications-btn .notification-badge');
            const menuBadge = hamburgerNotifBtn?.querySelector('.notification-badge');
            if (originalBadge && menuBadge) {
                if (originalBadge.style.display !== 'none' && originalBadge.textContent) {
                    menuBadge.style.display = 'inline-block';
                    menuBadge.textContent = originalBadge.textContent;
                } else {
                    menuBadge.style.display = 'none';
                }
            }
        }

        /* تحديث كل 2 ثانية */
        setInterval(syncNotifBadge, 2000);
        syncNotifBadge();

        /* ✅ إغلاق عند تغيير حجم الشاشة لديسكتوب */
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && isOpen) {
                closeMenu();
            }
        });
    })();
