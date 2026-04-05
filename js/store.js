// ============================================
// Elegantlaine — Store JS (ZAR)
// ============================================

const FREE_SHIPPING_MIN = 600;

/** South African Rand — narrow no-break space after R */
function formatZAR(amount, decimals) {
  const n = Number(amount);
  const d = decimals !== undefined ? decimals : 0;
  return 'R\u202f' + n.toLocaleString('en-ZA', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Match shop nav / ?cat=… filters (wigs, lace-front, sale, new, …). */
window.elProductMatchesNavCat = function elProductMatchesNavCat(p, cat) {
  if (!cat) return true;
  const c = String(cat).toLowerCase().trim();
  if (['wigs', 'bags', 'beauty'].includes(c)) return p.category === c;
  if (c === 'new') return p.badge === 'new';
  if (c === 'sale') return p.badge === 'sale';
  if (c === 'bestseller') return p.badge === 'bestseller';
  if (c === 'makeup') return p.category === 'beauty' || (p.tags || []).includes('makeup');
  const tags = p.tags || [];
  return tags.includes(c) || p.category === c;
};

// ---- PRODUCT DATA (ZAR) — replaced when Firestore `products` has active docs ----
const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Silk Lace Front 22″', category: 'wigs', tags: ['lace-front', 'human-hair'], price: 2499, oldPrice: 3299, emoji: '👑', color: '#c9a87c', badge: 'bestseller', stars: 5, reviews: 248, inStock: true, image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=800&q=80', description: 'Hand-tied lace front, natural density, heat-friendly. Includes adjustable straps and combs.' },
  { id: 2, name: 'Body Wave Full Lace', category: 'wigs', tags: ['full-lace', 'human-hair'], price: 3199, emoji: '✨', color: '#a07850', badge: 'new', stars: 5, reviews: 89, inStock: true, image: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=800&q=80', description: 'Full lace cap for versatile parting. Premium body wave texture, natural movement.' },
  { id: 3, name: 'Jet Black Bob 12″', category: 'wigs', tags: ['bob-wigs', 'synthetic'], price: 1899, emoji: '🖤', color: '#2d2416', badge: null, stars: 4, reviews: 157, inStock: true, image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80', description: 'Sharp bob cut, lightweight cap, ready-to-wear silhouette.' },
  { id: 4, name: 'Honey Blonde Balayage', category: 'wigs', tags: ['lace-front', 'human-hair', 'sale'], price: 2799, oldPrice: 3699, emoji: '🌟', color: '#d4a84b', badge: 'sale', stars: 5, reviews: 203, inStock: true, image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80', description: 'Rooted honey blonde with soft face-framing layers. Lace front hairline.' },
  { id: 5, name: 'Curly Lace Front', category: 'wigs', tags: ['lace-front', 'synthetic'], price: 2199, emoji: '💫', color: '#6d4c41', badge: null, stars: 5, reviews: 131, inStock: true, image: 'https://images.unsplash.com/photo-1605497788044-5a32c7077a6d?auto=format&fit=crop&w=800&q=80', description: 'Bouncy curls with breathable cap. Easy daily styling.' },
  { id: 6, name: 'Ombre Long Lace', category: 'wigs', tags: ['lace-front', 'human-hair'], price: 2999, emoji: '✦', color: '#5d4037', badge: 'new', stars: 5, reviews: 76, inStock: true, image: 'https://images.unsplash.com/photo-1560869713-da86a43ec457?auto=format&fit=crop&w=800&q=80', description: 'Long layered ombre, natural part, heat-safe fibres where noted on pack.' },
  { id: 7, name: 'Quilted Chain Crossbody', category: 'bags', tags: ['crossbody'], price: 1699, emoji: '👜', color: '#2d2d2d', badge: 'new', stars: 5, reviews: 74, inStock: true, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80', description: 'Quilted leather-look body, chain strap, interior zip pocket.' },
  { id: 8, name: 'Suede Mini Tote', category: 'bags', tags: ['tote-bags'], price: 1299, emoji: '🎀', color: '#c2185b', badge: null, stars: 4, reviews: 112, inStock: true, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80', description: 'Soft structured tote, fits daily essentials, top handles + shoulder option.' },
  { id: 9, name: 'Croc Emboss Crossbody', category: 'bags', tags: ['crossbody', 'sale'], price: 1499, oldPrice: 1899, emoji: '🐊', color: '#5a4a3a', badge: 'sale', stars: 5, reviews: 88, inStock: true, image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=800&q=80', description: 'Croc texture, adjustable strap, gold-tone hardware.' },
  { id: 10, name: 'Evening Velvet Clutch', category: 'bags', tags: ['clutch'], price: 899, emoji: '💎', color: '#7b1fa2', badge: null, stars: 4, reviews: 63, inStock: true, image: 'https://images.unsplash.com/photo-1566150905458-1e1a113b9898?auto=format&fit=crop&w=800&q=80', description: 'Velvet shell, magnetic closure, fits phone & cards.' },
  { id: 11, name: 'Leather Backpack Mini', category: 'bags', tags: ['backpack'], price: 1899, emoji: '🎒', color: '#3e2723', badge: 'bestseller', stars: 5, reviews: 201, inStock: true, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80', description: 'Compact backpack, padded laptop sleeve, travel-ready.' },
  { id: 12, name: 'Structured Work Tote', category: 'bags', tags: ['tote-bags'], price: 2199, emoji: '👜', color: '#212121', badge: null, stars: 5, reviews: 94, inStock: true, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', description: 'Clean lines, reinforced base, fits laptop up to 15″.' },
  { id: 13, name: 'Silk Finish Foundation', category: 'beauty', tags: ['foundation'], price: 749, emoji: '💄', color: '#c2185b', badge: 'bestseller', stars: 5, reviews: 392, inStock: true, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80', description: 'Buildable medium coverage, natural satin finish. Wide shade range.' },
  { id: 14, name: 'Matte Lip Set (6pc)', category: 'beauty', tags: ['lipstick'], price: 549, emoji: '💋', color: '#b71c1c', badge: 'new', stars: 5, reviews: 167, inStock: true, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80', description: 'Six transfer-resistant mattes in warm and neutral undertones.' },
  { id: 15, name: 'Glam Eye Palette', category: 'beauty', tags: ['eyeshadow', 'sale'], price: 799, oldPrice: 1049, emoji: '✨', color: '#4a148c', badge: 'sale', stars: 4, reviews: 234, inStock: true, image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80', description: '12 rich shimmers and mattes, minimal fallout, blendable formula.' },
  { id: 16, name: 'Glow Serum Drops', category: 'beauty', tags: ['skincare'], price: 1049, emoji: '🌿', color: '#2e7d32', badge: 'new', stars: 5, reviews: 98, inStock: true, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', description: 'Hyaluronic + botanicals for dewy skin under makeup or alone.' },
  { id: 17, name: 'Brow Sculpt Duo', category: 'beauty', tags: ['makeup'], price: 429, emoji: '✦', color: '#5d4037', badge: null, stars: 4, reviews: 156, inStock: true, image: 'https://images.unsplash.com/photo-1631214524023-7f392bb3dae4?auto=format&fit=crop&w=800&q=80', description: 'Wax + powder kit for defined, natural brows.' },
  { id: 18, name: 'Hydrating Cleanser 200ml', category: 'beauty', tags: ['skincare'], price: 389, emoji: '🧴', color: '#0277bd', badge: null, stars: 5, reviews: 312, inStock: true, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', description: 'Gentle gel cleanser, removes SPF and makeup without stripping.' },
];
let PRODUCTS = DEFAULT_PRODUCTS.map((p) => ({ ...p }));

window.elNormalizeFirestoreProduct = function elNormalizeFirestoreProduct(docId, d) {
  d = d || {};
  const id = /^\d+$/.test(String(docId)) ? parseInt(docId, 10) : docId;
  const tags = Array.isArray(d.tags) ? d.tags : typeof d.tag === 'string' ? [d.tag] : [];
  return {
    id,
    name: d.name || 'Product',
    category: d.category || 'wigs',
    tags,
    price: Number(d.price) || 0,
    oldPrice: d.oldPrice != null ? Number(d.oldPrice) : null,
    emoji: d.emoji || '✦',
    color: d.color || '#c9a87c',
    badge: d.badge || null,
    stars: Math.min(5, Math.max(0, parseInt(d.stars, 10) || 5)),
    reviews: parseInt(d.reviews, 10) || 0,
    sortOrder: Number(d.sortOrder) || 0,
    image: d.image || '',
    images: Array.isArray(d.images) ? d.images : [],
    description: d.description || '',
    inStock:
      d.stock != null ? (parseInt(d.stock, 10) || 0) > 0 : d.inStock !== false,
  };
};

window.elLoadProductsFromFirestore = async function elLoadProductsFromFirestore() {
  if (!window.__EL_DB__ || typeof window.elNormalizeFirestoreProduct !== 'function') return false;
  try {
    const snap = await window.__EL_DB__.collection('products').get();
    if (snap.empty) return false;
    const list = [];
    snap.forEach((doc) => {
      const d = doc.data();
      if ((d.status || 'active') !== 'active') return;
      list.push(window.elNormalizeFirestoreProduct(doc.id, d));
    });
    if (!list.length) return false;
    list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    PRODUCTS.length = 0;
    list.forEach((p) => PRODUCTS.push(p));
    return true;
  } catch (e) {
    console.warn('[Firestore products]', e);
    return false;
  }
};

// ---- STATE ----
let cart = JSON.parse(localStorage.getItem('el_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('el_wishlist') || '[]');
let currentFilter = 'all';

function finishStoreInit() {
  window.EL_PRODUCTS = PRODUCTS;
  window.dispatchEvent(new CustomEvent('el-products-ready'));

  renderProducts();
  updateCartUI();
  setupTabPills();
  setupNav();
  setupSearch();
  setupCart();
  setupCarousel();
  showCookieBanner();
  setupStickyNav();
  renderHeroTrending();
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.__EL_FB_OK__ && typeof window.elLoadProductsFromFirestore === 'function') {
    window.elLoadProductsFromFirestore().finally(finishStoreInit);
  } else {
    finishStoreInit();
  }
});

function renderHeroTrending() {
  const track = document.getElementById('heroTrendingTrack');
  if (!track || !PRODUCTS.length) return;
  const thumb = (p) =>
    p.image
      ? `<span class="hero-marquee-thumb"><img src="${escapeHtml(p.image)}" alt="" width="44" height="44" loading="lazy" /></span>`
      : `<span class="hero-marquee-emoji" aria-hidden="true">${p.emoji}</span>`;
  const buildStrip = () =>
    PRODUCTS.map(
      (p) => `
    <a href="product.html?id=${encodeURIComponent(p.id)}" class="hero-marquee-item">
      ${thumb(p)}
      <span class="hero-marquee-text">
        <span class="hero-marquee-name">${escapeHtml(p.name)}</span>
        <span class="hero-marquee-price">${formatZAR(p.price)}</span>
      </span>
    </a>
  `
    ).join('');
  track.innerHTML = `<div class="hero-marquee-strip">${buildStrip()}</div><div class="hero-marquee-strip" aria-hidden="true">${buildStrip()}</div>`;
  const duration = Math.max(32, Math.ceil(PRODUCTS.length * 2.6));
  track.style.setProperty('--hero-marquee-duration', `${duration}s`);
}

function buildProductCardHTML(p, inWishlist) {
  const id = JSON.stringify(p.id);
  const badgeClass = p.badge === 'sale' ? 'sale' : p.badge === 'new' ? 'new' : '';
  const badgeHtml = p.badge
    ? `<span class="product-badge ${badgeClass}">${escapeHtml(String(p.badge))}</span>`
    : '';
  const imgBlock = p.image
    ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="product-img-photo" loading="lazy" width="600" height="800" />`
    : `<span class="product-img-emoji" aria-hidden="true">${p.emoji}</span>`;
  return `
      <div class="product-img" style="background: linear-gradient(145deg, ${p.color}18 0%, ${p.color}33 100%);">
        ${badgeHtml}
        ${imgBlock}
        <div class="product-actions">
          <button type="button" class="product-action-btn" onclick="toggleWishlist(${id},this)" title="Wishlist">${inWishlist ? '❤️' : '🤍'}</button>
          <button type="button" class="product-action-btn" onclick="quickView(${id})" title="Quick View">👁</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-category">${escapeHtml(p.category)}</div>
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="product-price-row">
          <div>
            <span class="product-price">${formatZAR(p.price)}</span>
            ${p.oldPrice ? `<span class="product-price-old">${formatZAR(p.oldPrice)}</span>` : ''}
          </div>
          <div class="product-stars">${'★'.repeat(p.stars)}${'☆'.repeat(5 - p.stars)} <span style="color:var(--text-lighter);font-size:.7rem">(${p.reviews})</span></div>
        </div>
      </div>
      <button type="button" class="product-add-btn" onclick="addToCart(${id})">Add to Bag +</button>
    `;
}
window.elBuildProductCardHTML = buildProductCardHTML;

// ---- PRODUCTS ----
function renderProducts(filter = 'all') {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const filtered = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
  grid.innerHTML = '';
  filtered.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${i * 60}ms`;
    card.style.animation = 'fadeSlideUp .5s ease forwards';
    const inWishlist = wishlist.some((id) => String(id) === String(p.id));
    card.innerHTML = buildProductCardHTML(p, inWishlist);
    grid.appendChild(card);
  });
}

// Add CSS animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(style);

function setupTabPills() {
  document.querySelectorAll('.tab-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.tab-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderProducts(currentFilter);
    });
  });
}

// ---- CART ----
function addToCart(productId) {
  const product = PRODUCTS.find((p) => String(p.id) === String(productId));
  if (!product) return;
  const existing = cart.find((i) => String(i.id) === String(productId));
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: productId,
      qty: 1,
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      image: product.image || '',
    });
  }
  saveCart();
  updateCartUI();
  openCart();
  showToast(`"${product.name}" added to your bag ✓`);
}

function removeFromCart(productId) {
  cart = cart.filter((i) => String(i.id) !== String(productId));
  saveCart();
  updateCartUI();
}

function changeQty(productId, delta) {
  const item = cart.find((i) => String(i.id) === String(productId));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else { saveCart(); updateCartUI(); }
}

function saveCart() {
  localStorage.setItem('el_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCountEl = document.getElementById('cartCount');
  if (cartCountEl) {
    cartCountEl.textContent = count;
    cartCountEl.style.display = count ? 'flex' : 'none';
  }

  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  const subtotalEl = document.getElementById('cartSubtotal');

  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty"><span>🛍️</span><p>Your bag is empty</p><a href="shop.html" class="btn-primary">Start Shopping</a></div>`;
    if (footerEl) footerEl.style.display = 'none';
  } else {
    itemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        ${item.image ? `<div class="cart-item-img cart-item-img--photo"><img src="${escapeHtml(item.image)}" alt="" width="72" height="72" loading="lazy" /></div>` : `<div class="cart-item-img">${item.emoji}</div>`}
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatZAR(item.price)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty(${JSON.stringify(item.id)}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${JSON.stringify(item.id)}, 1)">+</button>
            <span class="cart-item-remove" onclick="removeFromCart(${JSON.stringify(item.id)})">Remove</span>
          </div>
        </div>
      </div>
    `).join('');
    if (footerEl) footerEl.style.display = 'block';
    if (subtotalEl) subtotalEl.textContent = formatZAR(total, 2);
  }
}

function openCart() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function setupCart() {
  const cartToggle = document.getElementById('cartToggle');
  if (cartToggle) cartToggle.addEventListener('click', openCart);
}

// ---- WISHLIST ----
function toggleWishlist(productId, btn) {
  if (wishlist.some((id) => String(id) === String(productId))) {
    wishlist = wishlist.filter((id) => String(id) !== String(productId));
    btn.textContent = '🤍';
    showToast('Removed from wishlist');
  } else {
    wishlist.push(productId);
    btn.textContent = '❤️';
    showToast('Added to wishlist ♡');
  }
  localStorage.setItem('el_wishlist', JSON.stringify(wishlist));
}

// ---- QUICK VIEW ----
function quickView(productId) {
  const p = PRODUCTS.find((x) => String(x.id) === String(productId));
  if (!p) return;
  const modal = document.createElement('div');
  modal.className = 'quick-view-modal';
  const qvImg = p.image
    ? `<img src="${escapeHtml(p.image)}" alt="" class="qv-img-photo" />`
    : `<span class="qv-emoji">${p.emoji}</span>`;
  const desc = p.description || `Premium ${p.name} — ships nationwide in SA.`;
  modal.innerHTML = `
    <div class="qv-backdrop" onclick="this.parentElement.remove(); document.body.style.overflow=''"></div>
    <div class="qv-inner">
      <button class="qv-close" onclick="this.closest('.quick-view-modal').remove(); document.body.style.overflow=''">✕</button>
      <div class="qv-img" style="background: linear-gradient(145deg, ${p.color}22 0%, ${p.color}44 100%);">
        ${qvImg}
      </div>
      <div class="qv-content">
        <span class="eyebrow">${escapeHtml(p.category)}</span>
        <h2 style="font-family:var(--font-display);font-size:2rem;font-weight:300;margin-bottom:8px;color:var(--deep)">${escapeHtml(p.name)}</h2>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <span style="font-size:1.3rem;font-weight:500;color:var(--deep)">${formatZAR(p.price)}</span>
          ${p.oldPrice ? `<span style="color:var(--text-lighter);text-decoration:line-through;font-size:.9rem">${formatZAR(p.oldPrice)}</span>` : ''}
          <span style="color:var(--gold-dark)">${'★'.repeat(p.stars)} (${p.reviews})</span>
        </div>
        <p style="color:var(--text-light);line-height:1.7;font-size:.9rem;margin-bottom:24px">${escapeHtml(desc)}</p>
        <button class="btn-primary full-width" onclick="addToCart(${JSON.stringify(p.id)}); this.closest('.quick-view-modal').remove(); document.body.style.overflow=''">Add to bag — ${formatZAR(p.price)}</button>
        <a href="product.html?id=${encodeURIComponent(p.id)}" style="display:block;text-align:center;margin-top:12px;font-size:.8rem;color:var(--text-light)">View full details →</a>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  setTimeout(() => modal.classList.add('open'), 10);

  if (!document.getElementById('qvStyle')) {
    const s = document.createElement('style');
    s.id = 'qvStyle';
    s.textContent = `
      .quick-view-modal { position:fixed;inset:0;z-index:800;display:flex;align-items:center;justify-content:center;padding:20px; }
      .qv-backdrop { position:absolute;inset:0;background:rgba(26,18,8,.5);opacity:0;transition:.3s; }
      .quick-view-modal.open .qv-backdrop { opacity:1; }
      .qv-inner { background:#fff;border-radius:16px;display:grid;grid-template-columns:1fr 1fr;max-width:800px;width:100%;position:relative;overflow:hidden;transform:translateY(20px);opacity:0;transition:.3s; }
      .quick-view-modal.open .qv-inner { transform:none;opacity:1; }
      .qv-img { aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:5rem;overflow:hidden;position:relative; }
      .qv-img-photo { width:100%;height:100%;object-fit:cover;display:block; }
      .qv-emoji { position:relative; z-index:1; }
      .qv-content { padding:40px; }
      .qv-close { position:absolute;top:16px;right:16px;background:rgba(255,255,255,.8);border:1px solid var(--border);border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center; z-index:2; }
      @media (max-width: 720px) { .qv-inner { grid-template-columns: 1fr !important; max-height: 90vh; overflow-y: auto; } .qv-content { padding: 28px 24px; } }
    `;
    document.head.appendChild(s);
  }
}

// ---- SEARCH ----
function setupSearch() {
  const overlay = document.getElementById('searchOverlay');
  const toggle = document.getElementById('searchToggle');
  const close = document.getElementById('searchClose');
  const input = document.getElementById('searchInput');
  if (!overlay) return;
  toggle?.addEventListener('click', () => { overlay.classList.add('open'); input?.focus(); });
  close?.addEventListener('click', () => overlay.classList.remove('open'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') overlay.classList.remove('open'); });
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') { const q = input.value.trim(); if (q) window.location.href = `shop.html?q=${encodeURIComponent(q)}`; } });
}

function searchFor(term) {
  window.location.href = `shop.html?q=${encodeURIComponent(term)}`;
}

// ---- NAV ----
function setupNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.querySelector('.nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => { nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex'; nav.style.flexDirection = 'column'; nav.style.position = 'absolute'; nav.style.top = '68px'; nav.style.left = '0'; nav.style.width = '100%'; nav.style.background = '#fff'; nav.style.padding = '16px 24px'; nav.style.borderTop = '1px solid var(--border)'; nav.style.zIndex = '99'; });
  }
}

function setupStickyNav() {
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ---- CAROUSEL ----
function setupCarousel() {
  const dotsEl = document.getElementById('carouselDots');
  const cards = document.querySelectorAll('.review-card');
  if (!dotsEl || !cards.length) return;
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => { document.querySelectorAll('.carousel-dot').forEach(d => d.classList.remove('active')); dot.classList.add('active'); };
    dotsEl.appendChild(dot);
  });
}

// ---- NEWSLETTER ----
function subscribeNewsletter(e) {
  e.preventDefault();
  const name = document.getElementById('nlName')?.value;
  const email = document.getElementById('nlEmail')?.value;
  if (!name || !email) return;
  const success = document.getElementById('nlSuccess');
  if (success) { success.classList.add('show'); }
  // In production: POST to Mailchimp/Klaviyo/ConvertKit API
  console.log('Newsletter signup:', { name, email });
  e.target.style.opacity = '0.5';
  e.target.style.pointerEvents = 'none';
}

// ---- COOKIE BANNER ----
function showCookieBanner() {
  if (localStorage.getItem('el_cookies_accepted')) return;
  setTimeout(() => {
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.classList.add('show');
  }, 2000);
}

function acceptCookies() {
  localStorage.setItem('el_cookies_accepted', '1');
  document.getElementById('cookieBanner')?.classList.remove('show');
}

function declineCookies() {
  document.getElementById('cookieBanner')?.classList.remove('show');
}

// ---- TOAST ----
function showToast(msg) {
  const existing = document.querySelector('.el-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'el-toast';
  toast.textContent = msg;
  if (!document.getElementById('toastStyle')) {
    const s = document.createElement('style');
    s.id = 'toastStyle';
    s.textContent = `.el-toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(10px);background:var(--deep);color:#fff;padding:12px 24px;border-radius:24px;font-size:.85rem;z-index:1000;opacity:0;transition:.3s;white-space:nowrap} .el-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}`;
    document.head.appendChild(s);
  }
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
}

window.formatZAR = formatZAR;
window.FREE_SHIPPING_MIN = FREE_SHIPPING_MIN;
window.escapeHtml = escapeHtml;
