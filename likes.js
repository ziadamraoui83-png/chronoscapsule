(function(){
    'use strict';

    const CC_CONFIG = window.CC_CONFIG || {};
    const SUPABASE_URL = CC_CONFIG.SUPABASE_URL;
    const SUPABASE_ANON_KEY = CC_CONFIG.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !window.supabase) {
        console.warn('❤️ likes.js: Supabase not ready');
        return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);