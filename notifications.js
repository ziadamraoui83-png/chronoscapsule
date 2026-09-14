/**
 * Chronos Capsule - Notification System (i18n v2)
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'cc_notifications';
    const SUPABASE_NOTIFICATIONS_TABLE = 'notifications';
    let supabase = null;
    let userId = null;
    let deviceHash = null;

    /* ═══ ترجمة ═══ */
    function t(key) {
        if (window.CCI18N && typeof window.CCI18N.t === 'function') {
            return window.CCI18N.t(key);
        }
        // احتياطي
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

    /* ═══ Detect اللغة ═══ */
    function getLang() {
        try {
            const urlLang = new URLSearchParams(location.search).get('lang');
            if (urlLang === 'ar' || urlLang === 'en') return urlLang;
            return localStorage.getItem('cc_lang') || 'ar';
        } catch (e) { return 'ar'; }
    }

    /* ═══ Init ═══ */
    function init() {
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

        /* ✅ إعادة الترجمة لما تبدل اللغة */
        window.addEventListener('cc:lang', function() {
            updateNotificationUI();
        });
    }

    /* ═══ إعادة بناء كل شيء عند تغيير اللغة ═══ */
    function updateNotificationUI() {
        // عاود جيب الإشعارات
        loadNotifications();
        
        // عاود ارسم القائمة إذا كانت مفتوحة
        const dropdown = document.querySelector('.notification-dropdown');
        if (dropdown && dropdown.classList.contains('open')) {
            renderNotificationList(dropdown);
        }
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

    async function createNotification(notificationData) {
        const notification = {
            id: Date.now().toString(),
            ...notificationData,
            created_at: new Date().toISOString(),
            is_read: false
        };

        const stored = localStorage.getItem(STORAGE_KEY);
        const notifications = stored ? JSON.parse(stored) : [];
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

    function show(type, title, message, duration = 5000) {
        const notification = { type, title, message, duration };
        createNotification(notification);
        showNotificationUI(notification);
    }

    function showNotificationUI(notification) {
        const container = document.createElement('div');
        container.className = `notification notification-${notification.type}`;
        container.innerHTML = 
            '<div class="notification-icon">' + getIconForType(notification.type) + '</div>' +
            '<div class="notification-content">' +
                (notification.title ? '<div class="notification-title">' + notification.title + '</div>' : '') +
                '<div class="notification-message">' + notification.message + '</div>' +
            '</div>' +
            '<div class="notification-close">×</div>';

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
            
            if (data) {
                saveNotifications(data);
                return data;
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
            badge.style.display = count > 0 ? 'block' : 'none';
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

        supabase
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

    /* ═══ رسم القائمة — مع ترجمة ═══ */
    function renderNotificationList(container) {
        fetchNotifications().then(notifications => {
            container.innerHTML = '';
            
            if (notifications.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'no-notifications';
                empty.textContent = t('notif_empty');   /* ✅ مترجم */
                container.appendChild(empty);
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
                    '<div class="notification-icon">' + getIconForType(notification.type) + '</div>' +
                    '<div class="notification-content">' +
                        (notification.title ? '<div class="notification-title">' + notification.title + '</div>' : '') +
                        '<div class="notification-message">' + notification.message + '</div>' +
                        '<div class="notification-time">' + timeAgo + '</div>' +
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
            markAllBtn.textContent = t('notif_mark_all');   /* ✅ مترجم */
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

    /* ═══ Public API ═══ */
    window.CC_NOTIFICATIONS = {
        init,
        show,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        renderNotificationList
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
