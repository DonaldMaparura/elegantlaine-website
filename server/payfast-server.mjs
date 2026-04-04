/**
 * PayFast signature + ITN verification. Run behind HTTPS in production.
 * Usage: node server/payfast-server.mjs  (loads ../.env via dotenv)
 */
import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import { validateCartLines } from './catalog.mjs';

const app = express();
app.use((req, res, next) => {
  const allow = process.env.STORE_URL || process.env.SITE_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true }));

const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '';
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || '';
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';
const STORE_URL = (process.env.STORE_URL || process.env.SITE_URL || 'http://localhost:5500').replace(/\/$/, '');
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || process.env.SITE_URL || `http://localhost:${Number(process.env.PORT) || 8787}`).replace(/\/$/, '');
const SANDBOX = String(process.env.PAYFAST_SANDBOX).toLowerCase() === 'true';
const PAYFAST_HOST = SANDBOX ? 'https://sandbox.payfast.co.za' : 'https://www.payfast.co.za';
const PROCESS_URL = `${PAYFAST_HOST}/eng/process`;

function pfEnc(val) {
  return encodeURIComponent(String(val).trim())
    .replace(/%20/g, '+')
    .replace(/%([0-9a-f]{2})/gi, (_, h) => `%${h.toUpperCase()}`);
}

function payfastSignature(data) {
  const pairs = Object.keys(data)
    .filter((k) => k !== 'signature' && data[k] !== '' && data[k] !== null && data[k] !== undefined)
    .sort()
    .map((k) => `${k}=${pfEnc(data[k])}`);
  let str = pairs.join('&');
  if (PASSPHRASE) str += `&passphrase=${pfEnc(PASSPHRASE)}`;
  return crypto.createHash('md5').update(str).digest('hex');
}

/** Build PayFast payload (values as strings per gateway rules). */
function buildPaymentPayload({ amount, itemName, itemDescription, email, firstName, lastName, paymentId }) {
  const data = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: `${STORE_URL}/order-complete.html`,
    cancel_url: `${STORE_URL}/checkout.html`,
    notify_url: `${API_PUBLIC_URL}/api/payfast/notify`,
    email_address: (email || '').slice(0, 255),
    m_payment_id: String(paymentId).slice(0, 100),
    amount: amount.toFixed(2),
    item_name: itemName.slice(0, 100),
    item_description: (itemDescription || '').slice(0, 255),
  };
  const fn = (firstName || '').trim();
  const ln = (lastName || '').trim();
  if (fn) data.name_first = fn.slice(0, 100);
  if (ln) data.name_last = ln.slice(0, 100);
  data.signature = payfastSignature(data);
  return data;
}

app.post('/api/payfast/prepare', (req, res) => {
  if (!MERCHANT_ID || !MERCHANT_KEY) {
    return res.status(503).json({ error: 'PayFast is not configured (missing merchant id/key in .env).' });
  }
  const { lines, email, firstName, lastName } = req.body || {};
  const v = validateCartLines(lines);
  if (!v.ok) return res.status(400).json({ error: v.error });
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required for PayFast.' });
  }
  const paymentId = `EL-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const payload = buildPaymentPayload({
    amount: v.amount,
    itemName: 'ElegantLaine order',
    itemDescription: v.itemDescription,
    email: email.trim(),
    firstName,
    lastName,
    paymentId,
  });
  res.json({ action: PROCESS_URL, fields: payload });
});

app.post('/api/payfast/notify', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).send('');
  }
  const received = body.signature;
  const calc = payfastSignature(body);
  if (!received || received !== calc) {
    console.warn('[PayFast ITN] Bad signature');
    return res.status(400).send('');
  }
  const status = (body.payment_status || '').toLowerCase();
  if (status === 'complete' || status === 'paid') {
    console.log('[PayFast ITN] Paid', body.m_payment_id, body.amount_gross);
  }
  res.status(200).send('');
});

app.get('/api/health', (_, res) => {
  res.json({ ok: true, payfast: !!(MERCHANT_ID && MERCHANT_KEY) });
});

const PORT = Number(process.env.PORT) || 8787;
app.listen(PORT, () => {
  console.log(`PayFast API http://localhost:${PORT}  STORE_URL=${STORE_URL}  ITN=${API_PUBLIC_URL}/api/payfast/notify`);
});
