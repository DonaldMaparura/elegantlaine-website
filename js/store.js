// ============================================
// ElegantLaine — Store JS (ZAR)
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

// ---- PRODUCT DATA (prices in ZAR) — overridden when Firestore has listings ----
const DEFAULT_PRODUCTS = [
  { id: 1, name: "Silk Lace Front", category: "wigs", price: 2499, oldPrice: 3499, emoji: "👑", color: "#c9a87c", badge: "bestseller", stars: 5, reviews: 248 },
  { id: 2, name: "Body Wave Full Lace", category: "wigs", price: 3199, emoji: "✨", color: "#a07850", badge: "new", stars: 5, reviews: 89 },
  { id: 3, name: "Jet Black Bob Wig", category: "wigs", price: 1899, emoji: "🖤", color: "#2d2416", badge: null, stars: 4, reviews: 157 },
  { id: 4, name: "Honey Blonde Waves", category: "wigs", price: 2799, oldPrice: 3699, emoji: "🌟", color: "#d4a84b", badge: "sale", stars: 5, reviews: 203 },
  { id: 5, name: "Quilted Chain Bag", category: "bags", price: 1699, emoji: "👜", color: "#2d2d2d", badge: "new", stars: 5, reviews: 74 },
  { id: 6, name: "Suede Mini Tote", category: "bags", price: 1299, emoji: "🎀", color: "#c2185b", badge: null, stars: 4, reviews: 112 },
  { id: 7, name: "Croc Crossbody", category: "bags", price: 1499, oldPrice: 1899, emoji: "🐊", color: "#5a4a3a", badge: "sale", stars: 5, reviews: 88 },
  { id: 8, name: "Velvet Clutch", category: "bags", price: 899, emoji: "💎", color: "#7b1fa2", badge: null, stars: 4, reviews: 63 },
  { id: 9, name: "Silk Finish Foundation", category: "beauty", price: 749, emoji: "💄", color: "#c2185b", badge: "bestseller", stars: 5, reviews: 392 },
  { id: 10, name: "Matte Lip Set (6pc)", category: "beauty", price: 549, emoji: "💋", color: "#b71c1c", badge: "new", stars: 5, reviews: 167 },
  { id: 11, name: "Glam Eye Palette", category: "beauty", price: 799, oldPrice: 1049, emoji: "✨", color: "#4a148c", badge: "sale", stars: 4, reviews: 234 },
  { id: 12, name: "Glow Serum Drops", category: "beauty", price: 1049, emoji: "🌿", color: "#2e7d32", badge: "new", stars: 5, reviews: 98 },
];
let PRODUCTS = DEFAULT_PRODUCTS.map((p) => ({ ...p }));

window.elNormalizeFirestoreProduct = function elNormalizeFirestoreProduct(docId, d) {
  d = d || {};
  const id = /^\d+$/.test(String(docId)) ? parseInt(docId, 10) : docId;
  return {
    id,
    name: d.name || 'Product',
    category: d.category || 'wigs',
    price: Number(d.price) || 0,
    oldPrice: d.oldPrice != null ? Number(d.oldPrice) : null,
    emoji: d.emoji || '✦',
    color: d.color || '#c9a87c',
    badge: d.badge || null,
    stars: Math.min(5, Math.max(0, parseInt(d.stars, 10) || 5)),
    reviews: parseInt(d.reviews, 10) || 0,
    sortOrder: Number(d.sortOrder) || 0,
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
  const buildStrip = () =>
    PRODUCTS.map(
      (p) => `
    <a href="product.html?id=${encodeURIComponent(p.id)}" class="hero-marquee-item">
      <span class="hero-marquee-emoji" aria-hidden="true">${p.emoji}</span>
      <span class="hero-marquee-text">
        <span class="hero-marquee-name">${p.name}</span>
        <span class="hero-marquee-price">${formatZAR(p.price)}</span>
      </span>
    </a>
  `
    ).join('');
  track.innerHTML = `<div class="hero-marquee-strip">${buildStrip()}</div><div class="hero-marquee-strip" aria-hidden="true">${buildStrip()}</div>`;
  const duration = Math.max(32, Math.ceil(PRODUCTS.length * 2.6));
  track.style.setProperty('--hero-marquee-duration', `${duration}s`);
}

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
    card.innerHTML = `
      <div class="product-img" style="background: linear-gradient(145deg, ${p.color}22 0%, ${p.color}44 100%);">
        ${p.badge ? `<span class="product-badge ${p.badge === 'sale' ? 'sale' : p.badge === 'new' ? 'new' : ''}">${p.badge}</span>` : ''}
        <span style="font-size:3.2rem; position:relative; z-index:1">${p.emoji}</span>
        <div class="product-actions">
          <button class="product-action-btn" onclick="toggleWishlist(${JSON.stringify(p.id)}, this)" title="Wishlist">
            ${inWishlist ? '❤️' : '🤍'}
          </button>
          <button class="product-action-btn" onclick="quickView(${JSON.stringify(p.id)})" title="Quick View">👁</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price-row">
          <div>
            <span class="product-price">${formatZAR(p.price)}</span>
            ${p.oldPrice ? `<span class="product-price-old">${formatZAR(p.oldPrice)}</span>` : ''}
          </div>
          <div class="product-stars">${'★'.repeat(p.stars)}${'☆'.repeat(5 - p.stars)} <span style="color:var(--text-lighter);font-size:.7rem">(${p.reviews})</span></div>
        </div>
      </div>
      <button class="product-add-btn" onclick="addToCart(${JSON.stringify(p.id)})">Add to Bag +</button>
    `;
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
    cart.push({ id: productId, qty: 1, name: product.name, price: product.price, emoji: product.emoji });
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
        <div class="cart-item-img">${item.emoji}</div>
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
  modal.innerHTML = `
    <div class="qv-backdrop" onclick="this.parentElement.remove(); document.body.style.overflow=''"></div>
    <div class="qv-inner">
      <button class="qv-close" onclick="this.closest('.quick-view-modal').remove(); document.body.style.overflow=''">✕</button>
      <div class="qv-img" style="background: linear-gradient(145deg, ${p.color}22 0%, ${p.color}44 100%);">
        <span>${p.emoji}</span>
      </div>
      <div class="qv-content">
        <span class="eyebrow">${p.category}</span>
        <h2 style="font-family:var(--font-display);font-size:2rem;font-weight:300;margin-bottom:8px;color:var(--deep)">${p.name}</h2>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <span style="font-size:1.3rem;font-weight:500;color:var(--deep)">${formatZAR(p.price)}</span>
          ${p.oldPrice ? `<span style="color:var(--text-lighter);text-decoration:line-through;font-size:.9rem">${formatZAR(p.oldPrice)}</span>` : ''}
          <span style="color:var(--gold-dark)">${'★'.repeat(p.stars)} (${p.reviews})</span>
        </div>
        <p style="color:var(--text-light);line-height:1.7;font-size:.9rem;margin-bottom:24px">Premium quality ${p.name.toLowerCase()} — crafted for women who demand excellence. Ships within 2-3 business days.</p>
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
      .qv-img { aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:5rem; }
      .qv-content { padding:40px; }
      .qv-close { position:absolute;top:16px;right:16px;background:rgba(255,255,255,.8);border:1px solid var(--border);border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center; }
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
