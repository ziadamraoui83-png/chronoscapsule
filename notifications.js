/**
 * Chronos Capsule - Notification System (i18n v3.1)
 * - مترجم بالكامل
 * - يتزامن مع تغيير اللغة
 * - يعمل مع panel + bell
 * - 🔒 الإصدار v3.1: إصلاح ثغرة XSS عبر دالة escapeHtml
 * - ✅ v3.2: إصلاح Race Condition (init guard) + Realtime unsubscribe
 */
(function() {
    'use strict';

    /* ✅ Debug flag */
    const __CC_DEBUG = location.hostname === 'localhost' ||
                       location.hostname === '127.0.0.1' ||
                       location.search.includes('debug');

    /* ✅ Guard ضد تكرار init (Race Condition fix) */
    let _initStarted = false;
    let _realtimeChannel = null;

    const STORAGE_KEY = 'cc_notifications';
    const SUPABASE_NOTIFICATIONS_TABLE = 'notifications';
    let supabase = null;
    let userId = null;
    let deviceHash = null;

    /* ═══ 🔒 دالة تطهير HTML لمنع هجمات XSS ═══ */
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* ═══ ترجمة ═══ */
    function t(key) {
        if (window.CCI18N && typeof window.CCI18N.t === 'function') {
            return window.CCI18N.t(key);
        }
        const fallback = {
            ar: {
                notif_empty: 'لا توجد إشعارات جديدة',
                notif_mark_all: 'تحديد الكل كمقروء',
                notif_just_now: 'الآن',
                notif_mins_ago: 'منذ {n} دقيقة',
                notif_hours_ago: 'منذ {n} ساعة',
                notif_days_ago: 'منذ {n} يوم',
                notif_new: 'جديد'
            },
            en: {
                notif_empty: 'No new notifications',
                notif_mark_all: 'Mark all as read',
                notif_just_now: 'just now',
                notif_mins_ago: '{n} min ago',
                notif_hours_ago: '{n} h ago',
                notif_days_ago: '{n} d ago',
                notif_new: 'New'
            }
        };
        const lang = document.documentElement.lang || 'ar';
        return (fallback[lang] && fallback[lang][key]) || key;
    }

    function getLang() {
        try {
            const urlLang = new URLSearchParams(location.search).get('lang');
            if (urlLang === 'ar' || urlLang === 'en') return urlLang;
            return localStorage.getItem('cc_lang') || 'ar';
        } catch (e) { return 'ar'; }
    }

    /* ═══ Init ═══ */
    function init() {
        /* ✅ Guard ضد تكرار init (Race Condition fix) */
        if (_initStarted) {
            if (__CC_DEBUG) console.log('ℹ️ notifications.js: init skipped (already started)');
            return;
        }
        _initStarted = true;

        if (window.__ccSupabase) {
            supabase = window.__ccSupabase;
        } else if (window.CC_CONFIG && window.CC_CONFIG.SUPABASE_URL && window.CC_CONFIG.SUPABASE_ANON_KEY) {
            try {
                supabase = window.supabase.createClient(
                    window.CC_CONFIG.SUPABASE_URL,
                    window.CC_CONFIG.SUPABASE_ANON_KEY
                );
            } catch (error) {
                console.warn('❌ Supabase init failed:', error);
            }
        }

        const user = localStorage.getItem('cc_user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                userId = userData.id;
            } catch (e) {}
        }

        if (!userId) {
            deviceHash = localStorage.getItem('cc_device') || generateDeviceHash();
            if (!localStorage.getItem('cc_device')) {
                localStorage.setItem('cc_device', deviceHash);
            }
        }

        loadNotifications();

        if (supabase) {
            setupRealtimeListener();
        }

        setupBell();

        /* ✅ إعادة الترجمة عند تغيير اللغة */
        window.addEventListener('cc:lang', function() {
            const panel = document.getElementById('notifPanel');
            const content = document.getElementById('notifContent');
            if (panel && panel.classList.contains('show') && content) {
                renderNotificationList(content);
            }
        });
    }

    function generateDeviceHash() {
        const ua = navigator.userAgent;
        const lang = navigator.language;
        const platform = navigator.platform;
        const cores = navigator.hardwareConcurrency || 'unknown';
        const memory = navigator.deviceMemory || 'unknown';
        const str = `${ua}${lang}${platform}${cores}${memory}${Date.now()}`;

        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'dev_' + Math.abs(hash).toString(36);
    }

    /* ═══ إنشاء إشعار (مع منع التكرار) ═══ */
    async function createNotification(notificationData) {
        /* ✅ توليد ID ثابت بناءً على المحتوى لمنع التكرار */
        const contentHash = (notificationData.title || '') + '|' +
                           (notificationData.message || '') + '|' +
                           (notificationData.type || '');

        const notification = {
            id: Date.now().toString() + '_' + contentHash.length,
            ...notificationData,
            created_at: new Date().toISOString(),
            is_read: false
        };

        const stored = localStorage.getItem(STORAGE_KEY);
        const notifications = stored ? JSON.parse(stored) : [];

        /* ✅ منع التكرار: تحقق إن كان إشعار بنفس المحتوى موجود خلال آخر 5 دقائق */
        const fiveMinAgo = Date.now() - (5 * 60 * 1000);
        const isDuplicate = notifications.some(n => {
            const nHash = (n.title || '') + '|' + (n.message || '') + '|' + (n.type || '');
            const nTime = n.created_at ? new Date(n.created_at).getTime() : 0;
            return nHash === contentHash && nTime > fiveMinAgo;
        });

        if (isDuplicate) {
            /* ✅ إشعار مكرر - لا تضفه */
            return null;
        }

        notifications.unshift(notification);

        if (notifications.length > 50) {
            notifications.splice(50);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        updateNotificationBadge(notifications.filter(n => !n.is_read).length);

        if (supabase) {
            try {
                notification.user_id = userId;
                notification.device_hash = deviceHash;

                await supabase
                    .from(SUPABASE_NOTIFICATIONS_TABLE)
                    .insert([notification])
                    .select();
            } catch (err) {
                console.warn('Failed to save notification:', err);
            }
        }

        return notification;
    }

    /* ═══ إظهار إشعار منبثق ═══ */
    function show(type, title, message, duration = 5000) {
        const notification = { type, title, message, duration };
        createNotification(notification);
        showNotificationUI(notification);
    }

    function showNotificationUI(notification) {
        const container = document.createElement('div');
        container.className = `notification notification-${notification.type}`;
        /* 🔒 تطهير كل المحتوى قبل حقنه في innerHTML لمنع XSS */
        container.innerHTML =
            '<div class="notification-icon ' + (notification.type || 'info') + '">' + getIconForType(notification.type) + '</div>' +
            '<div class="notification-content-inner">' +
                (notification.title ? '<div class="notification-title">' + escapeHtml(notification.title) + '</div>' : '') +
                '<div class="notification-message">' + escapeHtml(notification.message) + '</div>' +
            '</div>' +
            '<button class="notification-close" type="button">×</button>';

        document.body.appendChild(container);

        container.querySelector('.notification-close').addEventListener('click', () => {
            container.remove();
        });

        setTimeout(() => {
            container.remove();
        }, notification.duration);

        setTimeout(() => {
            container.classList.add('show');
        }, 10);
    }

    /* ═══ تحميل الإشعارات (مع إزالة التكرار) ═══ */
    async function loadNotifications() {
        const stored = localStorage.getItem(STORAGE_KEY);
        const localNotifications = stored ? JSON.parse(stored) : [];
        updateNotificationBadge(localNotifications.filter(n => !n.is_read).length);

        if (!supabase) return localNotifications;

        try {
            let query = supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (userId) {
                query = query.eq('user_id', userId);
            } else if (deviceHash) {
                query = query.eq('device_hash', deviceHash);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (data && data.length) {
                /* ✅ إزالة الإشعارات المكررة من قاعدة البيانات */
                const unique = [];
                const seen = new Set();
                for (const n of data) {
                    const key = (n.title || '') + '|' + (n.message || '') + '|' + (n.type || '');
                    if (!seen.has(key)) {
                        seen.add(key);
                        unique.push(n);
                    }
                }
                saveNotifications(unique);
                return unique;
            }

            return localNotifications;
        } catch (err) {
            console.warn('Failed to fetch notifications:', err);
            return localNotifications;
        }
    }

    function saveNotifications(notifications) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        updateNotificationBadge(notifications.filter(n => !n.is_read).length);
    }

    function updateNotificationBadge(count) {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = count > 0 ? count : '';
            badge.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    }

    async function markAsRead(notificationId) {
        const stored = localStorage.getItem(STORAGE_KEY);
        const notifications = stored ? JSON.parse(stored) : [];
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.is_read = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
            updateNotificationBadge(notifications.filter(n => !n.is_read).length);
        }

        if (supabase) {
            try {
                await supabase
                    .from(SUPABASE_NOTIFICATIONS_TABLE)
                    .update({ is_read: true })
                    .eq('id', notificationId);
            } catch (err) {}
        }
    }

    async function markAllAsRead() {
        const stored = localStorage.getItem(STORAGE_KEY);
        const notifications = stored ? JSON.parse(stored) : [];
        notifications.forEach(n => n.is_read = true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        updateNotificationBadge(0);

        if (supabase) {
            try {
                let query = supabase
                    .from(SUPABASE_NOTIFICATIONS_TABLE)
                    .update({ is_read: true });

                if (userId) {
                    query = query.eq('user_id', userId);
                } else if (deviceHash) {
                    query = query.eq('device_hash', deviceHash);
                }

                await query;
            } catch (err) {}
        }
    }

    async function fetchNotifications() {
        return await loadNotifications();
    }

    function setupRealtimeListener() {
        if (!supabase) return;

        /* ✅ إصلاح Memory Leak: إنهاء أي channel سابق */
        if (_realtimeChannel) {
            try {
                supabase.removeChannel(_realtimeChannel);
                _realtimeChannel = null;
            } catch (e) {
                if (__CC_DEBUG) console.warn('Failed to remove old channel:', e);
            }
        }

        _realtimeChannel = supabase
            .channel('notification-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: SUPABASE_NOTIFICATIONS_TABLE,
                    filter: userId ? `user_id=eq.${userId}` : `device_hash=eq.${deviceHash}`
                },
                () => { loadNotifications(); }
            )
            .subscribe();

        /* ✅ تنظيف عند مغادرة الصفحة (منع WebSocket leak) */
        window.addEventListener('pagehide', () => {
            if (_realtimeChannel && supabase) {
                try {
                    supabase.removeChannel(_realtimeChannel);
                    _realtimeChannel = null;
                    if (__CC_DEBUG) console.log('✅ Realtime channel closed');
                } catch (e) {
                    if (__CC_DEBUG) console.warn('Failed to close channel:', e);
                }
            }
        }, { once: true });
    }

    function getIconForType(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || '📢';
    }

    /* ═══ رسم القائمة ═══ */
    function renderNotificationList(container) {
        fetchNotifications().then(notifications => {
            container.innerHTML = '';

            if (!notifications || notifications.length === 0) {
                container.innerHTML = '<div class="no-notifications">' + t('notif_empty') + '</div>';
                return;
            }

            const list = document.createElement('div');
            list.className = 'notification-list';

            notifications.forEach(notification => {
                const item = document.createElement('div');
                item.className = `notification-item ${notification.is_read ? 'read' : 'unread'}`;
                item.dataset.id = notification.id;

                const date = new Date(notification.created_at);
                const timeAgo = getTimeAgo(date);

                item.innerHTML =
                    '<div class="notification-icon ' + (notification.type || 'info') + '">' + getIconForType(notification.type) + '</div>' +
                    '<div class="notification-content-inner">' +
                        (notification.title ? '<div class="notification-title">' + escapeHtml(notification.title) + '</div>' : '') +
                        '<div class="notification-message">' + escapeHtml(notification.message) + '</div>' +
                        '<div class="notification-time">' + escapeHtml(timeAgo) + '</div>' +
                    '</div>';

                item.addEventListener('click', () => {
                    markAsRead(notification.id);
                    item.classList.add('read');
                    item.classList.remove('unread');
                });

                list.appendChild(item);
            });

            const markAllBtn = document.createElement('button');
            markAllBtn.className = 'mark-all-read-btn';
            markAllBtn.textContent = t('notif_mark_all');
            markAllBtn.addEventListener('click', () => {
                markAllAsRead();
                const items = list.querySelectorAll('.notification-item.unread');
                items.forEach(item => {
                    item.classList.add('read');
                    item.classList.remove('unread');
                });
                updateNotificationBadge(0);
            });

            container.appendChild(list);
            container.appendChild(markAllBtn);
        });
    }

    /* ═══ الوقت النسبي — مترجم ═══ */
    function getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        const lang = getLang();

        if (diffMins < 1)  return t('notif_just_now');
        if (diffMins < 60) return t('notif_mins_ago').replace('{n}', diffMins);
        if (diffHours < 24) return t('notif_hours_ago').replace('{n}', diffHours);
        if (diffDays < 7)  return t('notif_days_ago').replace('{n}', diffDays);

        return date.toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'en-GB');
    }

    /* ═══ ربط الجرس بـ Panel ═══ */
    function setupBell() {
        const bell = document.getElementById('notifBell');
        const panel = document.getElementById('notifPanel');
        const closeBtn = document.getElementById('notifClose');
        const content = document.getElementById('notifContent');

        if (!bell || !panel) return;

        /* ✅ ضبط موضع اللوحة تحت الجرس مباشرة */
        function positionPanel() {
            const bellRect = bell.getBoundingClientRect();
            const panelWidth = 340;
            const viewportW = window.innerWidth;
            const isRTL = document.documentElement.dir === 'rtl';

            /* الموضع العمودي: تحت الجرس بـ 8px */
            panel.style.top = (bellRect.bottom + 8) + 'px';

            /* الموضع الأفقي: محاذاة مع الجرس */
            if (viewportW < 600) {
                /* موبايل: اللوحة تأخذ عرض الشاشة مع هامش بسيط */
                panel.style.left = '12px';
                panel.style.right = '12px';
                panel.style.width = 'auto';
            } else {
                /* ديسكتوب: محاذاة مع الجرس */
                if (isRTL) {
                    /* RTL (عربي): الجرس على اليسار، اللوحة تظهر تحته */
                    panel.style.left = Math.max(12, bellRect.left) + 'px';
                    panel.style.right = 'auto';
                } else {
                    /* LTR (إنجليزي): الجرس على اليمين، اللوحة تظهر تحته */
                    const rightOffset = viewportW - bellRect.right;
                    panel.style.right = Math.max(12, rightOffset) + 'px';
                    panel.style.left = 'auto';
                }
                panel.style.width = panelWidth + 'px';
            }
        }

        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = panel.classList.contains('show');

            if (isOpen) {
                panel.classList.remove('show');
            } else {
                positionPanel();
                panel.classList.add('show');
                if (content) renderNotificationList(content);
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                panel.classList.remove('show');
            });
        }

        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !bell.contains(e.target)) {
                panel.classList.remove('show');
            }
        });

        /* ✅ إعادة ضبط الموضع عند resize */
        window.addEventListener('resize', () => {
            if (panel.classList.contains('show')) {
                positionPanel();
            }
        });
    }

    /* ═══ Public API ═══ */
    window.CC_NOTIFICATIONS = {
        init,
        show,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        renderNotificationList,
        setupBell
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            /* ✅ Guard مزدوج ضد Race Condition */
            if (!_initStarted) init();
        });
    } else {
        if (!_initStarted) init();
    }
})();
