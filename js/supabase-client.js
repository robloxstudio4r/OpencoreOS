// ============================================================
//  supabase-client.js — Supabase client for OpencoreOS
// ============================================================

var SUPABASE_URL = 'https://korsbxildopwzdwrdeed.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_qBisY8Xwnkb1-EctdcWT7g_ib6QT0Mt';

var supabase = null;

(function () {
  'use strict';

  // Load the Supabase JS library from CDN if not already loaded
  function ensureSupabaseLibrary(callback) {
    if (window.supabase && window.supabase.createClient) {
      callback();
      return;
    }
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = callback;
    script.onerror = function () {
      console.error('Failed to load Supabase JS library');
    };
    document.head.appendChild(script);
  }

  ensureSupabaseLibrary(function () {
    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      });
      window.supabaseClient = supabase;
      console.log('Supabase client initialized with', SUPABASE_URL);
    } catch (e) {
      console.error('Supabase init failed:', e);
    }
  });
})();
