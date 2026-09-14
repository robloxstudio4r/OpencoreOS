// ============================================================
//  auth.js — Supabase Auth for OpencoreOS
//  Login / signup screen + restriction + warning enforcement
// ============================================================

(function () {
  'use strict';

  var currentUser = null;
  var currentProfile = null;
  var supabase = null;

  // ---------- Wait for the Supabase client ----------
  function waitForSupabase(cb) {
    if (window.supabaseClient) { cb(); return; }
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (window.supabaseClient) { clearInterval(iv); cb(); }
      else if (tries > 50) { clearInterval(iv); console.error('Supabase client never loaded'); }
    }, 100);
  }

  // ============================================================
  //  AUTH SCREEN
  // ============================================================
  function showAuthScreen() {
    var picker = document.getElementById('acctPicker');
    if (!picker) return;

    picker.innerHTML =
      '<div style="font-size:44px;font-weight:200;letter-spacing:2px;margin-bottom:6px;">OpencoreOS</div>'
      + '<div style="color:#888;font-size:13px;margin-bottom:36px;">Sign in or create an account</div>'
      + '<div id="auth-form" style="width:320px;">'
        + '<input id="auth-email" type="email" placeholder="Email" autocomplete="username" '
          + 'style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);'
          + 'color:#fff;padding:12px 14px;border-radius:8px;outline:none;font-size:14px;'
          + 'box-sizing:border-box;margin-bottom:10px;"/>'
        + '<input id="auth-password" type="password" placeholder="Password" autocomplete="current-password" '
          + 'style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);'
          + 'color:#fff;padding:12px 14px;border-radius:8px;outline:none;font-size:14px;'
          + 'box-sizing:border-box;margin-bottom:14px;"/>'
        + '<div id="auth-error" style="color:#ff6b6b;font-size:12px;min-height:18px;margin-bottom:10px;"></div>'
        + '<button id="auth-login" type="button" style="width:100%;background:#1db954;border:none;color:#fff;'
          + 'padding:12px;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;margin-bottom:8px;">Sign In</button>'
        + '<button id="auth-signup" type="button" style="width:100%;background:transparent;border:1px solid rgba(255,255,255,0.15);'
          + 'color:#fff;padding:12px;border-radius:8px;cursor:pointer;font-size:14px;">Create Account</button>'
      + '</div>'
      + '<div style="color:#666;font-size:11px;margin-top:20px;">Accounts are secured by Supabase</div>';

    picker.style.display = 'flex';

    var emailEl = picker.querySelector('#auth-email');
    var pwEl = picker.querySelector('#auth-password');
    var errEl = picker.querySelector('#auth-error');

    function setError(msg) { errEl.textContent = msg || ''; }

    function doSignIn() {
      var email = emailEl.value.trim();
      var pw = pwEl.value;
      if (!email || !pw) { setError('Enter email and password.'); return; }
      setError('');
      picker.querySelector('#auth-login').textContent = 'Signing in…';
      supabase.auth.signInWithPassword({ email: email, password: pw }).then(function (res) {
        picker.querySelector('#auth-login').textContent = 'Sign In';
        if (res.error) { setError(res.error.message); return; }
        onSignedIn(res.data.user);
      }).catch(function (e) {
        picker.querySelector('#auth-login').textContent = 'Sign In';
        setError('Network error: ' + e.message);
      });
    }

    function doSignUp() {
      var email = emailEl.value.trim();
      var pw = pwEl.value;
      if (!email || !pw) { setError('Enter email and password.'); return; }
      if (pw.length < 6) { setError('Password must be at least 6 characters.'); return; }
      setError('');
      picker.querySelector('#auth-signup').textContent = 'Creating account…';
      supabase.auth.signUp({ email: email, password: pw }).then(function (res) {
        picker.querySelector('#auth-signup').textContent = 'Create Account';
        if (res.error) { setError(res.error.message); return; }
        // Auto sign in (auto-confirm is on)
        supabase.auth.signInWithPassword({ email: email, password: pw }).then(function (r2) {
          if (r2.error) { setError(r2.error.message); return; }
          onSignedIn(r2.data.user);
        });
      }).catch(function (e) {
        picker.querySelector('#auth-signup').textContent = 'Create Account';
        setError('Network error: ' + e.message);
      });
    }

    picker.querySelector('#auth-login').onclick = doSignIn;
    picker.querySelector('#auth-signup').onclick = doSignUp;
    emailEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') pwEl.focus(); });
    pwEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSignIn(); });
    emailEl.focus();
  }

  // ============================================================
  //  ON SIGNED IN
  // ============================================================
  function onSignedIn(user) {
    currentUser = user;
    console.log('Signed in as:', user.email);

    loadProfile(user.id).then(function (profile) {
      currentProfile = profile;
      window.currentUser = user;
      window.currentProfile = profile;

      // Ensure the profile row exists (in case the trigger didn't fire)
      if (!profile) {
        console.warn('No profile row found — creating one');
        supabase.from('profiles').insert({ id: user.id, email: user.email })
          .then(function () { return loadProfile(user.id); })
          .then(function (p2) {
            currentProfile = p2;
            window.currentProfile = p2;
            routeAfterProfile(user, p2);
          });
        return;
      }

      routeAfterProfile(user, profile);
    });
  }

  function routeAfterProfile(user, profile) {
    if (profile && profile.restricted) {
      showRestrictionScreen(profile);
      return;
    }

    if (profile && profile.warning_message && !profile.warning_acknowledged) {
      showWarningScreen(profile);
      return;
    }

    // All clear — hide the auth screen and boot
    var picker = document.getElementById('acctPicker');
    if (picker) picker.style.display = 'none';

    if (typeof window.bootAfterAuth === 'function') {
      window.bootAfterAuth();
    } else if (typeof bootOpencore === 'function') {
      bootOpencore();
    }
  }

  function loadProfile(userId) {
    return supabase.from('profiles').select('*').eq('id', userId).single()
      .then(function (res) {
        if (res.error) { console.warn('Profile load error:', res.error); return null; }
        return res.data;
      });
  }

  // ============================================================
  //  RESTRICTION SCREEN
  // ============================================================
  function showRestrictionScreen(profile) {
    var picker = document.getElementById('acctPicker');
    if (!picker) return;
    picker.style.display = 'flex';
    picker.innerHTML =
      '<div style="text-align:center;padding:40px;">'
        + '<div style="font-size:64px;margin-bottom:20px;">🚫</div>'
        + '<div style="font-size:22px;font-weight:300;color:#fff;margin-bottom:12px;">Access Restricted</div>'
        + '<div style="color:#ff8a8a;font-size:14px;max-width:400px;margin:0 auto 20px;line-height:1.6;">'
          + 'Your access to Opencore has been restricted.'
        + '</div>'
        + (profile.restriction_reason
          ? '<div style="color:#888;font-size:12px;max-width:400px;margin:0 auto 20px;">Reason: ' + escapeHtml(profile.restriction_reason) + '</div>'
          : '')
        + '<button id="restrict-logout" style="background:transparent;border:1px solid rgba(255,255,255,0.15);'
          + 'color:#fff;padding:10px 22px;border-radius:8px;cursor:pointer;font-size:13px;">Sign Out</button>'
      + '</div>';
    picker.querySelector('#restrict-logout').onclick = function () {
      supabase.auth.signOut().then(function () { location.reload(); });
    };
  }

  // ============================================================
  //  WARNING SCREEN
  // ============================================================
  function showWarningScreen(profile) {
    var picker = document.getElementById('acctPicker');
    if (!picker) return;
    picker.style.display = 'flex';
    picker.innerHTML =
      '<div style="text-align:center;padding:40px;">'
        + '<div style="font-size:64px;margin-bottom:20px;">⚠️</div>'
        + '<div style="font-size:22px;font-weight:300;color:#fff;margin-bottom:12px;">Warning from Administration</div>'
        + '<div style="color:#ffd400;font-size:14px;max-width:400px;margin:0 auto 24px;line-height:1.6;">'
          + escapeHtml(profile.warning_message || '')
        + '</div>'
        + '<button id="warning-ack" style="background:#1db954;border:none;color:#fff;'
          + 'padding:12px 28px;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;">I Understand</button>'
      + '</div>';
    picker.querySelector('#warning-ack').onclick = function () {
      supabase.from('profiles').update({ warning_acknowledged: true }).eq('id', profile.id)
        .then(function () {
          profile.warning_acknowledged = true;
          currentProfile = profile;
          window.currentProfile = profile;
          routeAfterProfile(currentUser, profile);
        });
    };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ============================================================
  //  INIT — check existing session
  // ============================================================
  function init() {
    waitForSupabase(function () {
      supabase = window.supabaseClient;

      supabase.auth.getSession().then(function (res) {
        if (res.data && res.data.session && res.data.session.user) {
          onSignedIn(res.data.session.user);
        } else {
          showAuthScreen();
        }
      }).catch(function () {
        showAuthScreen();
      });

      // Listen for auth state changes (sign in from another tab, token refresh)
      supabase.auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_OUT') {
          showAuthScreen();
        }
      });
    });
  }

  // ============================================================
  //  PUBLIC API
  // ============================================================
  window.OpencoreAuth = {
    showAuthScreen: showAuthScreen,
    getCurrentUser: function () { return currentUser; },
    getCurrentProfile: function () { return currentProfile; },
    signOut: function () {
      if (!supabase) supabase = window.supabaseClient;
      supabase.auth.signOut().then(function () {
        location.reload();
      }).catch(function () {
        location.reload();
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
