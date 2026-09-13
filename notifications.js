/**
 * Chronos Capsule - Notification System
 * Handles local and Supabase-backed notifications
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'cc_notifications';
    let supabase = null;
    let userId = null;
    let deviceHash = null;

    // Initialize with Supabase client if available
    function init() {
        if (window.__ccSupabase) {
            supabase = window.__ccSupabase;
        }
        
        // Get user ID or device hash
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

    function loadNotifications() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const notifications = JSON.parse(stored);
                updateNotificationBadge(notifications.filter(n => !n.is_read).length);
            } catch (e) {}
        }
    }

    function saveNotifications(notifications) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        updateNotificationBadge(notifications.filter(n => !n.is_read).length);
    }

    function updateNotificationBadge(count) {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    function show(message, type = 'info', title = '') {
        const notification = {
            id: Date.now().toString(),
            title: title,
            message: message,
            type: type, // 'success', 'error', 'warning', 'info'
            is_read: false,
            created_at: new Date().toISOString()
        };

        // Save to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        const notifications = stored ? JSON.parse(stored) : [];
        notifications.unshift(notification);
        
        // Keep only last 50 notifications
        if (notifications.length > 50) {
            notifications.splice(50);
        }
        
        saveNotifications(notifications);

        // Send to Supabase if available
        if (supabase) {
            sendToSupabase(notification);
        }

        // Show toast notification
        showToast(notification);
        
        return notification;
    }

    function showToast(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast toast-${notification.type}`;
        toast.innerHTML = `
            <div class="toast-icon">${getIconForType(notification.type)}</div>
            <div class="toast-content">
                ${notification.title ? `<div class="toast-title">${notification.title}</div>` : ''}
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove after 5 seconds
        const timeout = setTimeout(() => removeToast(toast), 5000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeout);
            removeToast(toast);
        });
    }

    function removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }

    function getIconForType(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    async function sendToSupabase(notification) {
        if (!supabase) return;

        const payload = {
            user_id: userId,
            device_hash: deviceHash,
            message: notification.title ? `${notification.title}: ${notification.message}` : notification.message,
            type: notification.type,
            is_read: false
        };

        try {
            const { error } = await supabase
                .from('notifications')
                .insert([payload]);
            
            if (error) {
                console.warn('Failed to send notification to Supabase:', error);
            }
        } catch (err) {
            console.warn('Notification sync error:', err);
        }
    }

    async function fetchNotifications() {
        if (!supabase) {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
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
            
            // Also save to localStorage as backup
            if (data) {
                saveNotifications(data);
            }
            
            return data || [];
        } catch (err) {
            console.warn('Failed to fetch notifications:', err);
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        }
    }

    async function markAsRead(notificationId) {
        const stored = localStorage.getItem(STORAGE_KEY);
        let notifications = stored ? JSON.parse(stored) : [];
        
        notifications = notifications.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
        );
        
        saveNotifications(notifications);

        if (supabase && notificationId) {
            try {
                await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('id', notificationId);
            } catch (err) {
                console.warn('Failed to mark notification as read:', err);
            }
        }
    }

    async function markAllAsRead() {
        const stored = localStorage.getItem(STORAGE_KEY);
        let notifications = stored ? JSON.parse(stored) : [];
        
        notifications = notifications.map(n => ({ ...n, is_read: true }));
        
        saveNotifications(notifications);

        if (supabase) {
            try {
                let query = supabase
                    .from('notifications')
                    .update({ is_read: true });

                if (userId) {
                    query = query.eq('user_id', userId);
                } else if (deviceHash) {
                    query = query.eq('device_hash', deviceHash);
                }

                await query;
            } catch (err) {
                console.warn('Failed to mark all notifications as read:', err);
            }
        }
    }

    function setupRealtimeListener() {
        if (!supabase) return;

        let channel = supabase.channel('notifications');

        if (userId) {
            channel = channel.filter('user_id', 'eq', userId);
        } else if (deviceHash) {
            channel = channel.filter('device_hash', 'eq', deviceHash);
        }

        channel
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const newNotification = payload.new;
                    showToast(newNotification);
                    
                    const stored = localStorage.getItem(STORAGE_KEY);
                    const notifications = stored ? JSON.parse(stored) : [];
                    notifications.unshift(newNotification);
                    if (notifications.length > 50) notifications.splice(50);
                    saveNotifications(notifications);
                }
            )
            .subscribe();
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

                item.innerHTML = `
                    <div class="notification-icon">${getIconForType(notification.type)}</div>
                    <div class="notification-content">
                        ${notification.title ? `<div class="notification-title">${notification.title}</div>` : ''}
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                `;

                item.addEventListener('click', () => {
                    markAsRead(notification.id);
                    item.classList.add('read');
                    item.classList.remove('unread');
                });

                list.appendChild(item);
            });

            // Mark all as read button
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
