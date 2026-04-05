/* global firebase */
(function initElegantlaineFirebase() {
  window.__EL_FB_OK__ = false;
  window.__EL_DB__ = null;
  window.__EL_AUTH__ = null;

  const c = window.__EL_FIREBASE_CONFIG__;
  const ok = c && c.apiKey && !String(c.apiKey).includes('REPLACE');

  if (!ok || typeof firebase === 'undefined') return;

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(c);
    }
    window.__EL_DB__ = firebase.firestore();
    if (typeof firebase.auth === 'function') {
      window.__EL_AUTH__ = firebase.auth();
    }
    window.__EL_FB_OK__ = true;
  } catch (e) {
    console.warn('[Firebase init]', e);
  }
})();
