/**
 * Chronos Capsule - Notification System
 * Handles local and Supabase-backed notifications
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'cc_notifications';
    const SUPABASE_NOTIFICATIONS_TABLE = 'notifications';
    let supabase = null;
    let userId = null;
    let deviceHash = null;

    // Initialize with Supabase client if available
    function init() {
        // تهيئة Supabase
        if (window.__ccSupabase) {
            supabase = window.__ccSupabase;
        } else if (window.CC_CONFIG && window.CC_CONFIG.SUPABASE_URL && window.CC_CONFIG.SUPABASE_ANON_KEY) {
            try {
                supabase = window.supabase.createClient(
                    window.CC_CONFIG.SUPABASE_URL,
                    window.CC_CONFIG.SUPABASE_ANON_KEY
                );
                console.log('✅ Supabase initialized successfully');
            } catch (error) {
                console.warn('❌ Failed to initialize Supabase:', error);
            }
        }
        
        // Get user ID or device hash
        const user = localStorage.getItem('cc_user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                userId = userData.id;
                console.log('✅ User ID:', userId);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        if (!userId) {
            deviceHash = localStorage.getItem('cc_device') || generateDeviceHash();
            if (!localStorage.getItem('cc_device')) {
                localStorage.setItem('cc_device', deviceHash);
            }
            console.log('✅ Device hash:', deviceHash);
        }
        
        // Load notifications from storage
        loadNotifications();
        
        // Setup realtime listener if Supabase is available
        if (supabase) {
            setupRealtimeListener();
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

    // دالة لإنشاء إشعارة جديدة
    async function createNotification(notificationData) {
        const notification = {
            id: Date.now().toString(),
            ...notificationData,
            created_at: new Date().toISOString(),
            is_read: false
        };

        // حفظ في التخزين المحلي أولاً
        const stored = localStorage.getItem(STORAGE_KEY);
        const notifications = stored ? JSON.parse(stored) : [];
        notifications.unshift(notification);
        
        if (notifications.length > 50) {
            notifications.splice(50);
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        updateNotificationBadge(notifications.filter(n => !n.is_read).length);

        // محاولة حفظ في Supabase
        if (supabase) {
            try {
                notification.user_id = userId;
                notification.device_hash = deviceHash;
                
                const { data, error } = await supabase
                    .from(SUPABASE_NOTIFICATIONS_TABLE)
                    .insert([notification])
                    .select();

                if (error) throw error;
            } catch (err) {
                console.warn('Failed to save notification to Supabase:', err);
            }
        }
        
        return notification;
    }

    // Public API for showing notifications
    function show(type, title, message, duration = 5000) {
        const notification = {
            type,
            title,
            message,
            duration
        };

        createNotification(notification);
        showNotificationUI(notification);
    }

    // Show temporary notification UI
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

    // دالة لتحميل الإشعارات
    async function loadNotifications() {
        const stored = localStorage.getItem(STORAGE_KEY);
        const localNotifications = stored ? JSON.parse(stored) : [];
        updateNotificationBadge(localNotifications.filter(n => !n.is_read).length);

        if (!supabase) {
            return localNotifications;
        }

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
            console.warn('Failed to fetch notifications from Supabase:', err);
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
            } catch (err) {
                console.warn('Failed to mark notification as read in Supabase:', err);
            }
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
            } catch (err) {
                console.warn('Failed to mark all notifications as read in Supabase:', err);
            }
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
                (payload) => {
                    console.log('Notification change:', payload);
                    loadNotifications();
                }
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

    function renderNotificationList(container) {
        fetchNotifications().then(notifications => {
            container.innerHTML = '';
            
            if (notifications.length === 0) {
                container.innerHTML = '<div class="no-notifications">لا توجد إشعارات جديدة</div>';
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
            markAllBtn.textContent = 'تحديد الكل كمقروء';
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

    function getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        
        return date.toLocaleDateString('ar-EG');
    }

    // Expose public API
    window.CC_NOTIFICATIONS = {
        init,
        show,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        renderNotificationList
    };

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
