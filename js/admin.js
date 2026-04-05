// ============================================
// ElegantLaine Admin — Firebase Auth + Firestore
// ============================================

/* global firebase */

let adminProducts = [];
let adminOrders = [];
let adminCustomers = [];
let adminDiscounts = [];

let editingProductId = null;

const unsubs = { products: null, orders: null, customers: null, discounts: null };

function formatZAR(amount, decimals) {
  const n = Number(amount);
  const d = decimals !== undefined ? decimals : 0;
  return 'R\u202f' + n.toLocaleString('en-ZA', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function firestoreToAdminProduct(docId, d) {
  d = d || {};
  const id = /^\d+$/.test(String(docId)) ? parseInt(docId, 10) : docId;
  return {
    id,
    name: d.name || '',
    category: d.category || 'wigs',
    price: Number(d.price) || 0,
    oldPrice: d.oldPrice != null ? Number(d.oldPrice) : null,
    stock: parseInt(d.stock, 10) || 0,
    sku: d.sku || '',
    badge: d.badge || null,
    status: d.status || 'active',
    emoji: d.emoji || '✨',
    sortOrder: Number(d.sortOrder) || 0,
    image: d.image || '',
    description: d.description || '',
  };
}

function stopListeners() {
  Object.keys(unsubs).forEach((k) => {
    if (unsubs[k]) {
      unsubs[k]();
      unsubs[k] = null;
    }
  });
}

function startListeners() {
  if (!window.__EL_DB__) return;
  stopListeners();

  unsubs.products = window.__EL_DB__.collection('products').onSnapshot((snap) => {
    adminProducts = [];
    snap.forEach((doc) => adminProducts.push(firestoreToAdminProduct(doc.id, doc.data())));
    adminProducts.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    renderProducts();
    renderDashboardStats();
    renderDashboard();
  });

  unsubs.orders = window.__EL_DB__.collection('orders').onSnapshot((snap) => {
    adminOrders = [];
    snap.forEach((doc) => {
      const d = doc.data();
      adminOrders.push({
        id: d.orderId || doc.id,
        customer: d.customer || '',
        items: d.items != null ? d.items : 0,
        total: d.total != null ? d.total : 0,
        date: d.date || '',
        status: d.status || 'pending',
      });
    });
    adminOrders.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    renderOrders();
    renderDashboardStats();
    renderDashboard();
  });

  unsubs.customers = window.__EL_DB__.collection('customers').onSnapshot((snap) => {
    adminCustomers = [];
    snap.forEach((doc) => {
      const d = doc.data();
      adminCustomers.push({
        name: d.name || '',
        email: d.email || '',
        orders: d.orders != null ? d.orders : 0,
        spent: d.spent != null ? d.spent : 0,
        joined: d.joined || '',
      });
    });
    renderCustomers();
    renderDashboardStats();
  });

  unsubs.discounts = window.__EL_DB__.collection('discounts').onSnapshot((snap) => {
    adminDiscounts = [];
    snap.forEach((doc) => {
      const d = doc.data();
      adminDiscounts.push({
        id: doc.id,
        code: d.code || '',
        type: d.type || '',
        uses: d.uses != null ? d.uses : 0,
        status: d.status || 'active',
      });
    });
    renderDiscounts();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupSidebarNav();

  const errEl = document.getElementById('loginError');
  if (!window.__EL_FB_OK__ || !window.__EL_AUTH__) {
    if (errEl) {
      errEl.textContent = 'Add your Firebase web config in js/firebase-config.js, then refresh.';
      errEl.classList.add('show');
    }
    return;
  }

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('adminShell').style.display = 'grid';
      startListeners();
      renderDashboardStats();
      renderDashboard();
      renderProducts();
      renderOrders();
      renderCustomers();
      renderDiscounts();
    } else {
      stopListeners();
      adminProducts = [];
      adminOrders = [];
      adminCustomers = [];
      adminDiscounts = [];
      document.getElementById('adminShell').style.display = 'none';
      document.getElementById('loginScreen').style.display = 'flex';
    }
  });
});

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  errEl.classList.remove('show');
  try {
    await firebase.auth().signInWithEmailAndPassword(email, pass);
  } catch (err) {
    errEl.textContent = err.message || 'Could not sign in.';
    errEl.classList.add('show');
  }
}

function handleLogout() {
  if (window.__EL_AUTH__) firebase.auth().signOut();
}

function showAdmin() {}

function setupSidebarNav() {
  document.querySelectorAll('.nav-item[data-page]').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage(item.dataset.page);
    });
  });
}

function switchPage(page) {
  document.querySelectorAll('.admin-page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');
  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  const titles = {
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    customers: 'Customers',
    marketing: 'Marketing',
    settings: 'Settings',
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;
}

function renderDashboardStats() {
  const paidStatuses = new Set(['delivered', 'complete', 'paid', 'shipped', 'processing']);
  let revenue = 0;
  adminOrders.forEach((o) => {
    if (paidStatuses.has(String(o.status || '').toLowerCase())) revenue += Number(o.total) || 0;
  });
  const lowStock = adminProducts.filter((p) => p.stock > 0 && p.stock < 10).length;

  const elRev = document.getElementById('statRevenue');
  const elRevSub = document.getElementById('statRevenueSub');
  if (elRev) elRev.textContent = formatZAR(revenue, 0);
  if (elRevSub) {
    elRevSub.textContent = adminOrders.length ? 'From recorded orders' : 'No orders recorded yet';
    elRevSub.className = 'neutral';
  }

  const elOrd = document.getElementById('statOrders');
  const elOrdSub = document.getElementById('statOrdersSub');
  if (elOrd) elOrd.textContent = String(adminOrders.length);
  if (elOrdSub) elOrdSub.textContent = adminOrders.length ? 'All time' : '—';

  const elCust = document.getElementById('statCustomers');
  const elCustSub = document.getElementById('statCustomersSub');
  if (elCust) elCust.textContent = String(adminCustomers.length);
  if (elCustSub) elCustSub.textContent = adminCustomers.length ? 'In your list' : '—';

  const elProd = document.getElementById('statProducts');
  const elProdSub = document.getElementById('statProductsSub');
  if (elProd) elProd.textContent = String(adminProducts.length);
  if (elProdSub) {
    elProdSub.textContent = lowStock
      ? `${lowStock} low stock`
      : adminProducts.length
        ? 'All stocked'
        : 'Add listings to get started';
    elProdSub.className = 'neutral';
  }
}

function renderDashboard() {
  const body = document.getElementById('recentOrdersBody');
  if (body) {
    if (!adminOrders.length) {
      body.innerHTML = `<tr><td colspan="5" style="padding:32px;text-align:center;color:var(--text-light)">No orders yet.</td></tr>`;
    } else {
      body.innerHTML = adminOrders
        .slice(0, 5)
        .map(
          (o) => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.customer}</td>
        <td>${o.items} item${o.items > 1 ? 's' : ''}</td>
        <td>${formatZAR(o.total)}</td>
        <td><span class="status status-${o.status}">${o.status}</span></td>
      </tr>
    `
        )
        .join('');
    }
  }

  const tp = document.getElementById('topProducts');
  if (tp) {
    const active = adminProducts.filter((p) => p.status === 'active');
    const pool = active.length ? active : adminProducts;
    if (!pool.length) {
      tp.innerHTML = `<p style="padding:24px;color:var(--text-light);font-size:.88rem;text-align:center">Add products in Firestore to see a random spotlight here.</p>`;
    } else {
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      tp.innerHTML = shuffled.slice(0, Math.min(5, shuffled.length)).map(
        (p) => `
      <div class="top-product-item">
        <div class="top-product-emoji">${p.emoji || '✦'}</div>
        <div class="top-product-info">
          <strong>${p.name}</strong>
          <span>${p.category}</span>
        </div>
        <div class="top-product-rev">${formatZAR(p.price)}</div>
      </div>
    `
      ).join('');
    }
  }
}

function renderProducts(filter = 'all', search = '') {
  const body = document.getElementById('productsTableBody');
  if (!body) return;
  let list = adminProducts;
  if (filter !== 'all') list = list.filter((p) => p.category === filter);
  if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  if (!list.length) {
    const empty =
      !adminProducts.length && filter === 'all' && !search
        ? 'No products yet. Use <strong>Add Product</strong> to create your first listing.'
        : 'Nothing matches this filter. Try another category or search.';
    body.innerHTML = `<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--text-light)">${empty}</td></tr>`;
    return;
  }
  body.innerHTML = list
    .map(
      (p) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:1.4rem">${p.emoji || '✦'}</span>
          <div>
            <div style="font-weight:500;font-size:.85rem">${p.name}</div>
            <div style="font-size:.72rem;color:var(--text-lighter)">${p.sku || ''}</div>
          </div>
        </div>
      </td>
      <td style="text-transform:capitalize">${p.category}</td>
      <td>
        ${formatZAR(p.price)}
        ${p.oldPrice ? `<span style="color:var(--text-lighter);text-decoration:line-through;font-size:.78rem;margin-left:4px">${formatZAR(p.oldPrice)}</span>` : ''}
      </td>
      <td>
        <span class="${p.stock === 0 ? 'status status-low' : p.stock < 10 ? 'status status-pending' : ''}">${p.stock === 0 ? 'Out of stock' : p.stock < 10 ? `${p.stock} (low)` : p.stock}</span>
      </td>
      <td><span class="status status-${p.status}">${p.status}</span></td>
      <td>
        <div class="table-actions">
          <button class="tbl-btn" onclick='editProduct(${JSON.stringify(p.id)})'>Edit</button>
          <button class="tbl-btn danger" onclick='deleteProduct(${JSON.stringify(p.id)})'>Delete</button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

function filterAdminProducts() {
  const filter = document.getElementById('catFilter')?.value || 'all';
  const search = document.getElementById('prodSearch')?.value || '';
  renderProducts(filter, search);
}

function openAddProduct() {
  editingProductId = null;
  document.getElementById('modalTitle').textContent = 'Add New Product';
  clearProductForm();
  openModal();
}

function editProduct(id) {
  const p = adminProducts.find((x) => String(x.id) === String(id));
  if (!p) return;
  editingProductId = p.id;
  document.getElementById('modalTitle').textContent = 'Edit Product';
  document.getElementById('pName').value = p.name;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pOldPrice').value = p.oldPrice || '';
  document.getElementById('pStock').value = p.stock;
  document.getElementById('pSku').value = p.sku || '';
  document.getElementById('pBadge').value = p.badge || '';
  document.getElementById('pStatus').value = p.status;
  const imgEl = document.getElementById('pImage');
  if (imgEl) imgEl.value = p.image || '';
  const descEl = document.getElementById('pDescription');
  if (descEl) descEl.value = p.description || '';
  openModal();
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  if (!window.__EL_DB__) return;
  try {
    await window.__EL_DB__.collection('products').doc(String(id)).delete();
    showAdminToast('Product removed.');
  } catch (e) {
    alert(e.message || 'Delete failed');
  }
}

async function saveProduct() {
  const name = document.getElementById('pName').value.trim();
  const category = document.getElementById('pCategory').value;
  const price = parseFloat(document.getElementById('pPrice').value);
  const oldPrice = parseFloat(document.getElementById('pOldPrice').value) || null;
  const stock = parseInt(document.getElementById('pStock').value) || 0;
  const sku = document.getElementById('pSku').value.trim();
  const badge = document.getElementById('pBadge').value || null;
  const status = document.getElementById('pStatus').value;
  const image = (document.getElementById('pImage')?.value || '').trim();
  const description = (document.getElementById('pDescription')?.value || '').trim();

  if (!name || !category || !price) {
    alert('Please fill in all required fields.');
    return;
  }

  const emojis = { wigs: '👑', bags: '👜', beauty: '💄', accessories: '💍' };
  const emoji = emojis[category] || '✨';

  if (!window.__EL_DB__) return;

  const ref =
    editingProductId != null
      ? window.__EL_DB__.collection('products').doc(String(editingProductId))
      : window.__EL_DB__.collection('products').doc();

  const payload = {
    name,
    category,
    price,
    oldPrice: oldPrice || null,
    stock,
    sku,
    badge: badge || null,
    status,
    emoji,
    color: '#c9a87c',
    stars: 5,
    reviews: 0,
    sortOrder: Date.now(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    image: image || null,
    description: description || null,
  };

  try {
    await ref.set(payload, { merge: true });
    closeModal();
    showAdminToast(editingProductId != null ? 'Product updated.' : 'Product added.');
    editingProductId = null;
  } catch (e) {
    alert(e.message || 'Save failed');
  }
}

function clearProductForm() {
  ['pName', 'pPrice', 'pOldPrice', 'pStock', 'pSku', 'pDescription', 'pSeo', 'pImage'].forEach((fid) => {
    const el = document.getElementById(fid);
    if (el) el.value = '';
  });
  const cat = document.getElementById('pCategory');
  if (cat) cat.value = '';
  const badge = document.getElementById('pBadge');
  if (badge) badge.value = '';
  const status = document.getElementById('pStatus');
  if (status) status.value = 'active';
  const imgs = document.getElementById('uploadedImages');
  if (imgs) imgs.innerHTML = '';
}

function handleImageUpload(e) {
  const files = Array.from(e.target.files);
  const container = document.getElementById('uploadedImages');
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.className = 'uploaded-img';
      img.title = file.name;
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

function renderOrders(statusFilter = 'all') {
  const body = document.getElementById('ordersTableBody');
  if (!body) return;
  let list = statusFilter === 'all' ? adminOrders : adminOrders.filter((o) => o.status === statusFilter);
  if (!list.length) {
    body.innerHTML = `<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--text-light)">No orders in this view.</td></tr>`;
    return;
  }
  body.innerHTML = list
    .map(
      (o) => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer}</td>
      <td>${o.items} item${o.items > 1 ? 's' : ''}</td>
      <td>${formatZAR(o.total)}</td>
      <td>${o.date}</td>
      <td><span class="status status-${o.status}">${o.status}</span></td>
      <td>
        <div class="table-actions">
          <button class="tbl-btn" onclick="viewOrder('${String(o.id).replace(/'/g, "\\'")}')">View</button>
          <button class="tbl-btn" onclick="updateOrderStatus('${String(o.id).replace(/'/g, "\\'")}')">Update</button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

function filterOrders() {
  const filter = document.getElementById('orderStatusFilter')?.value || 'all';
  renderOrders(filter);
}

function viewOrder(id) {
  showAdminToast(`Order ${id}`);
}

function updateOrderStatus(id) {
  showAdminToast(`Update order ${id} when your workflow is connected.`);
}

function renderCustomers() {
  const body = document.getElementById('customersTableBody');
  if (!body) return;
  if (!adminCustomers.length) {
    body.innerHTML = `<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--text-light)">No customers recorded yet.</td></tr>`;
    return;
  }
  body.innerHTML = adminCustomers
    .map(
      (c) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold) 0%,var(--gold-dark) 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:.8rem;flex-shrink:0">${(c.name || '?').charAt(0)}</div>
          ${c.name}
        </div>
      </td>
      <td style="color:var(--text-light)">${c.email}</td>
      <td>${c.orders}</td>
      <td>${formatZAR(c.spent)}</td>
      <td style="color:var(--text-light)">${c.joined}</td>
    </tr>
  `
    )
    .join('');
}

function renderDiscounts() {
  const el = document.getElementById('discountList');
  if (!el) return;
  if (!adminDiscounts.length) {
    el.innerHTML = `<p style="color:var(--text-light);font-size:.85rem;padding:12px 0">No discount codes yet.</p>`;
    return;
  }
  el.innerHTML = adminDiscounts
    .map(
      (d) => `
    <div class="discount-item">
      <span class="discount-code">${d.code}</span>
      <span style="color:var(--text-light);font-size:.78rem">${d.type} · ${d.uses} uses</span>
      <span class="${d.status === 'active' ? 'badge-green' : 'status status-draft'}">${d.status}</span>
    </div>
  `
    )
    .join('');
}

async function addDiscount() {
  const code = prompt('Enter discount code:');
  if (!code || !window.__EL_DB__) return;
  try {
    await window.__EL_DB__.collection('discounts').add({
      code: code.toUpperCase(),
      type: 'Custom',
      uses: 0,
      status: 'active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    showAdminToast(`Code ${code.toUpperCase()} saved.`);
  } catch (e) {
    alert(e.message || 'Could not save code');
  }
}

function openModal() {
  document.getElementById('productModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('productModal').classList.remove('open');
  document.body.style.overflow = '';
}

function showAdminToast(msg) {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'admin-toast';
  t.textContent = msg;
  if (!document.getElementById('adminToastStyle')) {
    const s = document.createElement('style');
    s.id = 'adminToastStyle';
    s.textContent =
      '.admin-toast{position:fixed;bottom:24px;right:24px;background:var(--deep);color:#fff;padding:12px 20px;border-radius:8px;font-size:.85rem;z-index:1000;opacity:0;transition:.3s;transform:translateY(8px)} .admin-toast.show{opacity:1;transform:none}';
    document.head.appendChild(s);
  }
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2800);
}
