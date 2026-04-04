/**
 * Authoritative prices for checkout validation (keep aligned with js/store.js PRODUCTS).
 */
export const CATALOG = new Map([
  [1, { price: 2499, name: 'Silk Lace Front' }],
  [2, { price: 3199, name: 'Body Wave Full Lace' }],
  [3, { price: 1899, name: 'Jet Black Bob Wig' }],
  [4, { price: 2799, name: 'Honey Blonde Waves' }],
  [5, { price: 1699, name: 'Quilted Chain Bag' }],
  [6, { price: 1299, name: 'Suede Mini Tote' }],
  [7, { price: 1499, name: 'Croc Crossbody' }],
  [8, { price: 899, name: 'Velvet Clutch' }],
  [9, { price: 749, name: 'Silk Finish Foundation' }],
  [10, { price: 549, name: 'Matte Lip Set (6pc)' }],
  [11, { price: 799, name: 'Glam Eye Palette' }],
  [12, { price: 1049, name: 'Glow Serum Drops' }],
]);

export function validateCartLines(lines) {
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
