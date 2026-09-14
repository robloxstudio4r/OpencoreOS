// ============================================================
//  supabase-client.js — Supabase client for OpencoreOS
// ============================================================

// ---- REPLACE THESE WITH YOUR PROJECT VALUES ----
var SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
var SUPABASE_ANON_KEY = 'YOUR-ANON-KEY-HERE';
// ------------------------------------------------

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
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabaseClient = supabase;
      console.log('Supabase client initialized');
    } catch (e) {
      console.error('Supabase init failed:', e);
    }
  });
})();
