/**
 * Sets PayFast API base URL (local Node server vs Firebase Cloud Function).
 */
(function setPayfastApiBase() {
  var h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') {
    window.EL_PAYFAST_API_BASE = 'http://localhost:8787';
    return;
  }
  if (h === 'elegantlaine.web.app' || h === 'elegantlaine.firebaseapp.com') {
    window.EL_PAYFAST_API_BASE = 'https://europe-west1-elegantlaine.cloudfunctions.net/payfastApi';
  }
})();
