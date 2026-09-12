(function(){
    'use strict';

    /* ✅ نستعمل نفس Supabase client من script.js */
    const sb = window.__ccSupabase || null;

    if (!sb) {
        console.warn('❤️ likes.js: Supabase client not available yet');
        // نحاول نستنى script.js يخلص
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => window.dispatchEvent(new Event('cc:likes-ready')), 100);
            });
        }
        return;
    }