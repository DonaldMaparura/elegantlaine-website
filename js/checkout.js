/**
 * PayFast checkout — calls API that signs with your passphrase (never in the browser).
 * Set window.EL_PAYFAST_API_BASE if the API is on another origin (e.g. 'https://api.yoursite.co.za').
 */
async function startPayFast() {
  const errEl = document.getElementById('coPayError');
  if (errEl) {
    errEl.textContent = '';
    errEl.style.display = 'none';
  }

  const cart = JSON.parse(localStorage.getItem('el_cart') || '[]');
  if (!cart.length) return;

  const email = (document.getElementById('coEmail')?.value || '').trim();
  const firstName = (document.getElementById('coFirst')?.value || '').trim();
  const lastName = (document.getElementById('coLast')?.value || '').trim();

  if (!email || !email.includes('@')) {
    if (errEl) {
      errEl.textContent = 'Enter a valid email — PayFast needs it for your receipt.';
      errEl.style.display = 'block';
    }
    return;
  }

  const lines = cart.map((i) => ({ id: i.id, qty: i.qty }));
  const apiBase = typeof window.EL_PAYFAST_API_BASE === 'string' ? window.EL_PAYFAST_API_BASE.replace(/\/$/, '') : '';

  const btn = document.getElementById('coPayBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Redirecting to PayFast…';
  }

  try {
    const res = await fetch(`${apiBase}/api/payfast/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines, email, firstName, lastName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Could not start payment');
    }
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = data.action;
    form.acceptCharset = 'UTF-8';
    for (const [k, v] of Object.entries(data.fields || {})) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = String(v);
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  } catch (e) {
    if (errEl) {
      errEl.textContent = e.message || 'Payment setup failed. Is the PayFast API running?';
      errEl.style.display = 'block';
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Pay with PayFast';
    }
  }
}
