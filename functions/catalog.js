/**
 * Server-side prices — keep aligned with storefront (js/store.js / Firestore).
 */
const CATALOG = new Map([
  [1, { price: 2499, name: 'Silk Lace Front 22″' }],
  [2, { price: 3199, name: 'Body Wave Full Lace' }],
  [3, { price: 1899, name: 'Jet Black Bob 12″' }],
  [4, { price: 2799, name: 'Honey Blonde Balayage' }],
  [5, { price: 2199, name: 'Curly Lace Front' }],
  [6, { price: 2999, name: 'Ombre Long Lace' }],
  [7, { price: 1699, name: 'Quilted Chain Crossbody' }],
  [8, { price: 1299, name: 'Suede Mini Tote' }],
  [9, { price: 1499, name: 'Croc Emboss Crossbody' }],
  [10, { price: 899, name: 'Evening Velvet Clutch' }],
  [11, { price: 1899, name: 'Leather Backpack Mini' }],
  [12, { price: 2199, name: 'Structured Work Tote' }],
  [13, { price: 749, name: 'Silk Finish Foundation' }],
  [14, { price: 549, name: 'Matte Lip Set (6pc)' }],
  [15, { price: 799, name: 'Glam Eye Palette' }],
  [16, { price: 1049, name: 'Glow Serum Drops' }],
  [17, { price: 429, name: 'Brow Sculpt Duo' }],
  [18, { price: 389, name: 'Hydrating Cleanser 200ml' }],
]);

function validateCartLines(lines) {
  if (!Array.isArray(lines) || !lines.length) {
    return { ok: false, error: 'Cart is empty' };
  }
  const desc = [];
  let subtotal = 0;
  for (const line of lines) {
    const id = Number(line.id);
    const qty = Math.min(99, Math.max(1, parseInt(line.qty, 10) || 0));
    const row = CATALOG.get(id);
    if (!row) return { ok: false, error: 'Invalid product in cart' };
    subtotal += row.price * qty;
    desc.push(`${row.name} x ${qty}`);
  }
  return {
    ok: true,
    amount: Number(subtotal.toFixed(2)),
    itemDescription: desc.join('; ').slice(0, 255),
  };
}

module.exports = { CATALOG, validateCartLines };
