import { db, auth, onAuthStateChanged, googleProvider, signInWithPopup, signOut, signInWithEmailAndPassword, ADMIN_EMAIL } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.cart = JSON.parse(localStorage.getItem('arcanix_cart')) || [];
let currentUser = null;
let editingProductId = null;
let adminUpiConfig = { upiId: 'merchant@upi', merchantName: 'ArcanixPlus' };

// Standard Reusable Vector SVG Templates
const VECTOR_ICONS = {
  search: `<svg class="v-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  user: `<svg class="v-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  cart: `<svg class="v-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  home: `<svg class="v-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  gear: `<svg class="v-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  star: `<svg class="v-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  globe: `<svg class="v-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>`,
  box: `<svg class="v-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>`,
  party: `<svg class="v-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  check: `<svg class="v-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  cross: `<svg class="v-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  truck: `<svg class="v-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  clock: `<svg class="v-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
};

// Fetch Admin Payment Config
async function loadAdminPaymentSettings() {
  try {
    const snap = await getDoc(doc(db, "settings", "payment"));
    if (snap.exists()) {
      const data = snap.data();
      adminUpiConfig = {
        upiId: data.upiId || 'merchant@upi',
        merchantName: data.merchantName || 'ArcanixPlus'
      };
    }
  } catch(e) {
    console.error("Error loading admin UPI settings:", e);
  }
}
loadAdminPaymentSettings();

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateNavState();
});

const routes = {
  'home': renderHomePage,
  'plp': renderCategoryProductsPage,
  'pdp': renderProductDetailPage,
  'search': renderSearchResultsPage,
  'cart': renderCartPage,
  'checkout': renderCheckoutPage,
  'order-confirmation': renderOrderConfirmationPage,
  'auth': renderAuthPage,
  'account': renderUserDashboardPage,
  'seller-dashboard': renderSellerDashboardPage
};

const appContainer = document.getElementById('app-view');

// 1. Responsive Stylesheet Injection
function injectResponsiveStyles() {
  if (document.getElementById('responsive-custom-styles')) return;
  const style = document.createElement('style');
  style.id = 'responsive-custom-styles';
  style.innerHTML = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, Roboto, sans-serif; }
    body { background-color: #f1f3f6; color: #212121; min-height: 100vh; }

    .v-icon { vertical-align: middle; display: inline-block; }

    .main-container { max-width: 1240px; margin: 0 auto; padding: 12px; }

    .app-header { position: sticky; top: 0; z-index: 1000; background: #2874f0; color: #ffffff; box-shadow: 0 2px 4px 0 rgba(0,0,0,.1); }
    .header-top { max-width: 1240px; margin: 0 auto; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .hamburger-btn { font-size: 1.4rem; cursor: pointer; background: none; border: none; color: #fff; display: flex; align-items: center; }
    .brand-logo { font-size: 1.35rem; font-weight: 800; color: #fff; text-decoration: none; font-style: italic; letter-spacing: -0.5px; }
    .brand-logo span { color: #ffe500; font-style: normal; }

    .header-search-box { flex: 1; max-width: 550px; position: relative; display: flex; align-items: center; }
    .header-search-box input { width: 100%; padding: 9px 40px 9px 14px; border: none; border-radius: 4px; outline: none; font-size: 0.9rem; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); }
    .header-search-box button { position: absolute; right: 4px; background: none; border: none; cursor: pointer; font-size: 1rem; padding: 6px 10px; color: #2874f0; display: flex; align-items: center; }

    .header-right { display: flex; align-items: center; gap: 20px; }
    .header-link { color: #fff; text-decoration: none; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
    .badge-count { background: #ffe500; color: #000; font-weight: 800; font-size: 0.75rem; padding: 1px 6px; border-radius: 10px; }

    .mobile-search-strip { display: none; background: #2874f0; padding: 0 12px 10px 12px; }

    @media (max-width: 767px) {
      .desktop-search { display: none !important; }
      .mobile-search-strip { display: block !important; }
      .main-container { padding: 8px; }
    }
    @media (min-width: 768px) {
      .hamburger-btn { display: none !important; }
    }

    .products-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    @media (min-width: 600px) { .products-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; } }
    @media (min-width: 900px) { .products-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; } }
    @media (min-width: 1100px) { .products-grid { grid-template-columns: repeat(5, 1fr); gap: 14px; } }

    .product-card { background: #fff; border-radius: 4px; padding: 12px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: box-shadow 0.2s ease, transform 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .product-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: translateY(-2px); }
    .product-card-img { width: 100%; height: 160px; object-fit: contain; margin-bottom: 10px; }
    .product-card-title { font-size: 0.85rem; font-weight: 500; color: #212121; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 6px; line-height: 1.3; }
    .rating-badge { background: #388e3c; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 3px; display: inline-flex; align-items: center; gap: 3px; width: fit-content; margin-bottom: 6px; }
    .price-row { display: flex; align-items: baseline; gap: 8px; }
    .main-price { font-size: 1rem; font-weight: 700; color: #212121; }
    .offer-tag { font-size: 0.75rem; font-weight: 700; color: #388e3c; }

    .side-drawer { position: fixed; top: 0; left: -280px; width: 270px; height: 100%; background: #fff; box-shadow: 2px 0 10px rgba(0,0,0,0.25); z-index: 10000; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .side-drawer.open { left: 0; }
    .drawer-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: none; }
    .drawer-overlay.active { display: block; }
    .drawer-header { background: #2874f0; color: #fff; padding: 16px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; }
    .drawer-links a { padding: 14px 16px; color: #333; text-decoration: none; font-size: 0.95rem; font-weight: 500; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f0f0f0; }
    
    .qty-btn { background: #f0f0f0; border: 1px solid #ccc; width: 28px; height: 28px; font-weight: bold; cursor: pointer; border-radius: 4px; }
    
    .status-badge { padding: 4px 8px; border-radius: 3px; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; }
    .status-Pending { background: #fff3cd; color: #856404; }
    .status-Processing { background: #cce5ff; color: #004085; }
    .status-Shipped { background: #e2e3e5; color: #383d41; }
    .status-Delivered { background: #d4edda; color: #155724; }
    .status-Cancelled { background: #f8d7da; color: #721c24; }

    .payment-option { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; transition: all 0.2s; margin-bottom: 10px; }
    .payment-option.active { border-color: #2874f0; background: #f0f7ff; }
  `;
  document.head.appendChild(style);
}

// 2. Navigation Header Setup
function setupResponsiveHeader() {
  const existingHeaders = document.querySelectorAll('header, .app-header');
  if (existingHeaders.length > 0) {
    existingHeaders.forEach((el, index) => {
      if (index > 0 || el.id !== 'main-header') el.remove();
    });
  }

  let header = document.getElementById('main-header');
  if (!header) {
    header = document.createElement('header');
    header.id = 'main-header';
    header.className = 'app-header';
    header.innerHTML = `
      <div class="header-top">
        <div class="header-left">
          <button class="hamburger-btn" onclick="toggleDrawer(true)" aria-label="Open Menu">☰</button>
          <a href="#home" class="brand-logo">Arcanix <span>Plus</span></a>
        </div>

        <div class="header-search-box desktop-search">
          <input type="text" id="desktop-search-input" placeholder="Search for products, brands and more..." onkeydown="handleSearch(event, 'desktop-search-input')"/>
          <button onclick="triggerSearch('desktop-search-input')">${VECTOR_ICONS.search}</button>
        </div>

        <div class="header-right">
          <a href="#account" id="account-nav-btn" class="header-link">
            <span>${VECTOR_ICONS.user}</span> <span id="auth-btn-text">Login</span>
          </a>
          <a href="#cart" class="header-link">
            <span>${VECTOR_ICONS.cart}</span> Cart <span class="badge-count" id="cart-count">0</span>
          </a>
        </div>
      </div>

      <div class="mobile-search-strip">
        <div class="header-search-box" style="max-width: 100%;">
          <input type="text" id="mobile-search-input" placeholder="Search products, brands and more..." onkeydown="handleSearch(event, 'mobile-search-input')"/>
          <button onclick="triggerSearch('mobile-search-input')">${VECTOR_ICONS.search}</button>
        </div>
      </div>
    `;
    document.body.prepend(header);
  }

  if (!document.getElementById('hamburger-drawer')) {
    const drawer = document.createElement('div');
    drawer.id = 'hamburger-drawer';
    drawer.className = 'side-drawer';
    drawer.innerHTML = `
      <div class="drawer-header">
        <span>Arcanix Menu</span>
        <span style="cursor:pointer;" onclick="toggleDrawer(false)">✕</span>
      </div>
      <div class="drawer-links" id="drawer-menu-links">
        <a href="#home" onclick="toggleDrawer(false)"><span>${VECTOR_ICONS.home}</span> Home</a>
        <a href="#cart" onclick="toggleDrawer(false)"><span>${VECTOR_ICONS.cart}</span> My Cart</a>
        <a href="#account" onclick="toggleDrawer(false)"><span>${VECTOR_ICONS.user}</span> My Account</a>
      </div>
    `;

    const overlay = document.createElement('div');
    overlay.id = 'drawer-overlay';
    overlay.className = 'drawer-overlay';
    overlay.onclick = () => toggleDrawer(false);

    document.body.appendChild(drawer);
    document.body.appendChild(overlay);
  }
}

window.handleSearch = function(e, inputId) {
  if (e.key === 'Enter') triggerSearch(inputId);
};

window.triggerSearch = function(inputId) {
  const query = document.getElementById(inputId).value.trim();
  if (query) {
    location.hash = `search?q=${encodeURIComponent(query)}`;
  }
};

window.toggleDrawer = function(open) {
  const drawer = document.getElementById('hamburger-drawer');
  const overlay = document.getElementById('drawer-overlay');
  if (!drawer || !overlay) return;
  if (open) {
    drawer.classList.add('open');
    overlay.classList.add('active');
  } else {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
  }
};

function navigate() {
  injectResponsiveStyles();
  setupResponsiveHeader();

  const fullHash = window.location.hash.replace('#', '') || 'home';
  const [route, queryString] = fullHash.split('?');
  const params = new URLSearchParams(queryString);
  
  const renderFn = routes[route] || renderHomePage;
  appContainer.className = 'main-container';
  appContainer.innerHTML = '';
  
  renderFn(params);
  updateCartBadge();
  updateNavState();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);

function updateNavState() {
  const authText = document.getElementById('auth-btn-text');
  const authBtn = document.getElementById('account-nav-btn');
  const drawerLinks = document.getElementById('drawer-menu-links');
  if (!authText || !authBtn) return;

  const isAdmin = currentUser && currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (currentUser) {
    authText.innerText = currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Account';
    authBtn.href = '#account';
  } else {
    authText.innerText = 'Login';
    authBtn.href = '#auth';
  }

  if (drawerLinks) {
    drawerLinks.innerHTML = `
      <a href="#home" onclick="toggleDrawer(false)"><span>${VECTOR_ICONS.home}</span> Home</a>
      <a href="#cart" onclick="toggleDrawer(false)"><span>${VECTOR_ICONS.cart}</span> My Cart</a>
      <a href="#account" onclick="toggleDrawer(false)"><span>${VECTOR_ICONS.user}</span> My Account</a>
      ${isAdmin ? `<a href="#seller-dashboard" onclick="toggleDrawer(false)" style="color:#2874f0; font-weight:700;"><span>${VECTOR_ICONS.gear}</span> CMS Admin Dashboard</a>` : ''}
    `;
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) {
    const totalCount = window.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    badge.innerText = totalCount;
  }
}

// Cart Handlers
window.addToCart = (id, title, price, image) => {
  const existingItem = window.cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    window.cart.push({ id, title, price, image, quantity: 1 });
  }
  localStorage.setItem('arcanix_cart', JSON.stringify(window.cart));
  updateCartBadge();
  alert(`"${title}" added to Cart!`);
};

window.changeCartQty = (index, delta) => {
  if (window.cart[index]) {
    window.cart[index].quantity = (window.cart[index].quantity || 1) + delta;
    if (window.cart[index].quantity <= 0) {
      window.cart.splice(index, 1);
    }
    localStorage.setItem('arcanix_cart', JSON.stringify(window.cart));
    renderCartPage();
    updateCartBadge();
  }
};

window.removeFromCart = (index) => {
  window.cart.splice(index, 1);
  localStorage.setItem('arcanix_cart', JSON.stringify(window.cart));
  renderCartPage();
  updateCartBadge();
};

window.deleteItemByAdmin = async (colName, id) => {
  if (confirm(`Delete this item from ${colName}?`)) {
    try {
      await deleteDoc(doc(db, colName, id));
      alert("Deleted successfully!");
      renderSellerDashboardPage();
    } catch(err) {
      alert("Error deleting: " + err.message);
    }
  }
};

// Update Order Status Handler for Admin
window.updateOrderStatus = async (orderId, newStatus) => {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status: newStatus,
      updatedAt: new Date()
    });
    alert(`Order status updated to "${newStatus}"!`);
    renderSellerDashboardPage();
  } catch(err) {
    alert("Error updating order status: " + err.message);
  }
};

// 3. HOME PAGE
async function renderHomePage() {
  appContainer.innerHTML = `
    <div id="home-slider-container" style="margin-bottom: 12px;"></div>

    <div style="background: #fff; padding: 14px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">
        <h2 style="font-size: 1.05rem; font-weight: 700; color:#212121;" id="grid-title">Deals of the Day</h2>
        
        <div style="display: flex; align-items: center; gap: 8px;">
          <label style="font-size: 0.85rem; font-weight: 600; color: #666;">Category:</label>
          <select id="homepage-cat-dropdown" onchange="handleHomeCategoryChange(this.value)" style="padding: 6px 10px; border: 1px solid #2874f0; border-radius: 4px; background: #fff; font-size: 0.85rem; font-weight: 600; color: #2874f0; outline: none; cursor: pointer;">
            <option value="">All Categories</option>
          </select>
        </div>
      </div>

      <div class="products-grid" id="home-products-grid"><p style="color: #666; font-size: 0.9rem;">Loading store items...</p></div>
    </div>
  `;

  fetchBanners();
  populateHomeCategoryDropdown();
  fetchProductsGrid(document.getElementById('home-products-grid'));
}

let bannerTimer = null;
let currentBannerIndex = 0;

async function fetchBanners() {
  const container = document.getElementById('home-slider-container');
  if (!container) return;
  if (bannerTimer) clearInterval(bannerTimer);

  try {
    const snap = await getDocs(collection(db, "banners"));
    if (snap.empty) {
      container.style.display = 'none';
      return;
    }
    
    const banners = snap.docs.map(doc => doc.data());
    const fallbackImage = 'https://placehold.co/1200x400/2874f0/ffffff?text=Arcanix+Special+Offer';
    
    container.style.display = 'block';
    container.innerHTML = `
      <div id="hero-slider" style="position: relative; width: 100%; min-height: 160px; max-height: 300px; overflow: hidden; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); background: #e0e0e0;">
        <div id="slider-track" style="display: flex; transition: transform 0.5s ease-in-out; width: 100%; height: 100%;">
          ${banners.map((b) => `
            <div style="min-width: 100%; position: relative; height: 220px;">
              <img src="${b.imageUrl ? b.imageUrl.trim() : fallbackImage}" 
                   alt="${b.title || 'Banner Image'}" 
                   onerror="this.onerror=null; this.src='${fallbackImage}';" 
                   style="width: 100%; height: 100%; object-fit: cover; display: block;" />
              <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0, 0, 0, 0.75)); padding: 16px 20px; color: #ffffff;">
                <h1 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${b.title || 'Special Offer'}</h1>
                <p style="font-size: 0.85rem; font-weight: 600; color: #ffe500; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">${b.subtitle || ''}</p>
              </div>
            </div>
          `).join('')}
        </div>
        <button onclick="changeSlide(-1, ${banners.length})" style="position: absolute; top: 50%; left: 10px; transform: translateY(-50%); background: rgba(0,0,0,0.4); color: #fff; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; z-index: 10;">❮</button>
        <button onclick="changeSlide(1, ${banners.length})" style="position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: rgba(0,0,0,0.4); color: #fff; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; z-index: 10;">❯</button>
        <div id="slider-dots" style="position: absolute; bottom: 10px; right: 16px; display: flex; gap: 6px; z-index: 10;">
          ${banners.map((_, i) => `
            <span onclick="goToSlide(${i})" class="slider-dot" style="width: 8px; height: 8px; border-radius: 50%; background: ${i === 0 ? '#fff' : 'rgba(255,255,255,0.5)'}; cursor: pointer;"></span>
          `).join('')}
        </div>
      </div>
    `;

    currentBannerIndex = 0;
    bannerTimer = setInterval(() => { changeSlide(1, banners.length); }, 3500);

  } catch(e) {
    console.error("Banner fetch error:", e);
    container.style.display = 'none';
  }
}

window.changeSlide = function(direction, totalBanners) {
  currentBannerIndex = (currentBannerIndex + direction + totalBanners) % totalBanners;
  updateSliderPosition();
};

window.goToSlide = function(index) {
  currentBannerIndex = index;
  updateSliderPosition();
};

function updateSliderPosition() {
  const track = document.getElementById('slider-track');
  const dots = document.querySelectorAll('.slider-dot');
  if (track) track.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
  dots.forEach((dot, idx) => {
    dot.style.background = idx === currentBannerIndex ? '#fff' : 'rgba(255,255,255,0.5)';
  });
}

async function populateHomeCategoryDropdown() {
  const catSelect = document.getElementById('homepage-cat-dropdown');
  if (!catSelect) return;
  try {
    const snap = await getDocs(collection(db, "categories"));
    if (!snap.empty) {
      snap.docs.forEach(docSnap => {
        const c = docSnap.data();
        const option = document.createElement('option');
        option.value = c.name;
        option.textContent = c.name;
        catSelect.appendChild(option);
      });
    }
  } catch(e) {
    console.error("Error loading categories dropdown:", e);
  }
}

window.handleHomeCategoryChange = function(selectedCat) {
  const gridTitle = document.getElementById('grid-title');
  if (gridTitle) gridTitle.innerText = selectedCat ? `Category: ${selectedCat}` : "Deals of the Day";
  fetchProductsGrid(document.getElementById('home-products-grid'), '', selectedCat);
};

// 4. CATEGORY PRODUCTS PAGE
async function renderCategoryProductsPage(params) {
  const categoryName = params.get('category') || '';
  appContainer.innerHTML = `
    <div style="background:#fff; padding: 16px; border-radius:4px;">
      <h2 style="font-size: 1.1rem; margin-bottom: 14px; color:#212121;">Showing results for: <b>${categoryName}</b></h2>
      <div class="products-grid" id="plp-grid"><p style="color: #666;">Loading products...</p></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('plp-grid'), '', categoryName);
}

// 5. PRODUCT DETAIL PAGE
async function renderProductDetailPage(params) {
  const id = params.get('id');
  if (!id) return;
  appContainer.innerHTML = `<p style="padding:20px; background:#fff;">Loading product details...</p>`;
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) return;
    const p = snap.data();
    const fallbackProductImg = 'https://placehold.co/400x400/e0e0e0/000000?text=No+Image';

    appContainer.innerHTML = `
      <div style="background: #fff; border-radius:4px; padding: 20px; display: flex; flex-wrap: wrap; gap: 32px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="flex: 1 1 300px; text-align: center;">
          <img src="${p.imageUrl || fallbackProductImg}" 
               onerror="this.onerror=null; this.src='${fallbackProductImg}';" 
               style="width: 100%; max-height: 340px; object-fit: contain; margin-bottom: 20px;"/>
          <div style="display: flex; gap: 12px;">
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}')" style="flex: 1; padding: 12px 8px; font-size: 0.9rem; font-weight:700; background:#ff9f00; color:#fff; border:none; border-radius:2px; cursor:pointer;">ADD TO CART</button>
            <button onclick="addToCart('${id}', '${p.title}', ${p.price}, '${p.imageUrl}'); location.hash='checkout';" style="flex: 1; padding: 12px 8px; font-size: 0.9rem; font-weight:700; background:#fb641b; color:#fff; border:none; border-radius:2px; cursor:pointer;">BUY NOW</button>
          </div>
        </div>
        <div style="flex: 1 1 300px;">
          <h1 style="font-size: 1.25rem; font-weight: 500; margin-bottom: 8px; color:#212121; line-height:1.4;">${p.title}</h1>
          <div class="rating-badge">4.5 ${VECTOR_ICONS.star}</div>
          <div style="font-size:0.85rem; color:#878787; font-weight:600; margin-bottom:14px; margin-top: 6px;">Category: ${p.category || 'General'}</div>
          <div style="margin-bottom: 20px; border-bottom:1px solid #f0f0f0; padding-bottom:14px;">
            <span style="font-size: 1.6rem; font-weight:800; color:#212121;">₹${p.price}</span>
            ${p.tag ? `<span style="color:#388e3c; font-size:0.85rem; font-weight:700; margin-left:12px;">${p.tag}</span>` : ''}
          </div>
          <h4 style="margin-bottom: 8px; font-size: 0.9rem; font-weight:700; color:#212121;">Product Details:</h4>
          <p style="color: #555; font-size: 0.88rem; line-height: 1.6; white-space: pre-line;">${p.description || 'No description provided.'}</p>
        </div>
      </div>
    `;
  } catch (err) {
    appContainer.innerHTML = `<p>Error loading product details.</p>`;
  }
}

// 6. SEARCH PAGE
function renderSearchResultsPage(params) {
  const query = params.get('q') || '';
  appContainer.innerHTML = `
    <div style="background:#fff; padding: 16px; border-radius:4px;">
      <h2 style="font-size: 1.05rem; margin-bottom: 12px; color:#212121;">Search Results for "${query}"</h2>
      <div class="products-grid" id="search-grid"></div>
    </div>
  `;
  fetchProductsGrid(document.getElementById('search-grid'), query);
}

// 7. CART PAGE
function renderCartPage() {
  if (window.cart.length === 0) {
    appContainer.innerHTML = `<div style="text-align: center; padding: 50px 16px; background:#fff; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);"><h2>Your Shopping Cart is Empty!</h2><br/><a href="#home" style="display:inline-block; padding:12px 28px; background:#2874f0; color:#fff; text-decoration:none; border-radius:2px; font-weight:700; font-size:0.9rem;">Shop Now</a></div>`;
    return;
  }
  let total = window.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  appContainer.innerHTML = `
    <div style="display: flex; flex-wrap: wrap; gap: 16px;">
      <div style="flex: 2 1 300px; background:#fff; padding: 16px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <h3 style="margin-bottom: 16px; font-size: 1.05rem; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">My Cart (${window.cart.length})</h3>
        ${window.cart.map((item, idx) => `
          <div style="display: flex; gap: 16px; padding: 14px 0; border-bottom: 1px solid #f0f0f0; align-items: center;">
            <img src="${item.image}" style="width: 65px; height: 65px; object-fit: contain;"/>
            <div style="flex: 1;">
              <h4 style="font-size: 0.88rem; font-weight:500; margin-bottom: 6px; color:#212121;">${item.title}</h4>
              <div><span style="font-weight:700; font-size: 1rem; color:#212121;">₹${item.price}</span></div>
              <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                <button class="qty-btn" onclick="changeCartQty(${idx}, -1)">-</button>
                <span style="font-weight:600; font-size:0.9rem;">${item.quantity || 1}</span>
                <button class="qty-btn" onclick="changeCartQty(${idx}, 1)">+</button>
              </div>
            </div>
            <button onclick="removeFromCart(${idx})" style="background:none; border:none; color: #d32f2f; font-size: 0.85rem; font-weight:700; cursor:pointer;">REMOVE</button>
          </div>
        `).join('')}
      </div>
      <div style="flex: 1 1 250px; background:#fff; padding: 16px; border-radius:4px; height: fit-content; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        <h4 style="color: #878787; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 14px; font-size: 0.85rem; font-weight:700;">PRICE DETAILS</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.88rem;">
          <span>Total Items</span>
          <span>${window.cart.reduce((s, i) => s + (i.quantity || 1), 0)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.88rem; color:#388e3c;">
          <span>Delivery Charges</span>
          <span>FREE</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 18px; font-weight: 800; border-top: 1px dashed #e0e0e0; padding-top: 14px; font-size: 1.05rem;">
          <span>Total Amount</span>
          <span>₹${total.toFixed(2)}</span>
        </div>
        <button onclick="location.hash='checkout'" style="width: 100%; padding: 12px; background:#fb641b; color:#fff; font-weight:700; border:none; border-radius:2px; cursor:pointer; font-size:0.9rem;">PLACE ORDER</button>
      </div>
    </div>
  `;
}

// Helper: Dynamic Admin UPI Link Builder
function getDynamicUpiQrUrl(total) {
  const upiId = encodeURIComponent(adminUpiConfig.upiId || 'merchant@upi');
  const merchantName = encodeURIComponent(adminUpiConfig.merchantName || 'ArcanixPlus');
  const upiPayload = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${total}&cu=INR`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiPayload)}`;
}

// 8. CHECKOUT PAGE (With Payment Options & Dynamic Interactive Admin QR UI)
async function renderCheckoutPage() {
  if (window.cart.length === 0) {
    location.hash = 'cart';
    return;
  }
  await loadAdminPaymentSettings();
  let total = window.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  
  appContainer.innerHTML = `
    <div style="padding: 24px; background:#fff; max-width: 580px; margin: 0 auto; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <h2 style="margin-bottom: 18px; font-size: 1.15rem; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">Order Summary (₹${total.toFixed(2)})</h2>
      
      <form id="checkout-form">
        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:0.85rem; margin-bottom:6px; font-weight:600;">Full Name</label>
          <input type="text" id="cust-name" required placeholder="John Doe" style="width:100%; padding:9px; border:1px solid #ccc; border-radius:4px; font-size:0.9rem;"/>
        </div>
        
        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:0.85rem; margin-bottom:6px; font-weight:600;">Delivery Address</label>
          <textarea id="cust-address" required placeholder="Enter complete delivery address..." style="width:100%; height:75px; padding:10px; border:1px solid #ccc; border-radius:4px; font-size:0.9rem;"></textarea>
        </div>

        <div style="margin-bottom:20px;">
          <label style="display:block; font-size:0.85rem; margin-bottom:8px; font-weight:600;">Select Payment Method</label>
          
          <div class="payment-option active" onclick="selectPaymentMode('UPI')">
            <input type="radio" name="pay-mode" id="pay-upi" value="UPI Instant QR" checked />
            <label for="pay-upi" style="font-weight:600; font-size:0.88rem; cursor:pointer; flex:1;">
              UPI / QR Code (PhonePe, GPay, Paytm)
            </label>
          </div>

          <div class="payment-option" onclick="selectPaymentMode('Card')">
            <input type="radio" name="pay-mode" id="pay-card" value="Credit / Debit Card" />
            <label for="pay-card" style="font-weight:600; font-size:0.88rem; cursor:pointer; flex:1;">
              Credit / Debit Card
            </label>
          </div>

          <div class="payment-option" onclick="selectPaymentMode('COD')">
            <input type="radio" name="pay-mode" id="pay-cod" value="Cash on Delivery" />
            <label for="pay-cod" style="font-weight:600; font-size:0.88rem; cursor:pointer; flex:1;">
              Cash on Delivery (COD)
            </label>
          </div>
        </div>

        <!-- Dynamic Payment Section with Admin QR -->
        <div id="payment-details-box" style="margin-bottom:20px; padding:14px; border:1px dashed #2874f0; background:#f4f8ff; border-radius:6px; text-align:center;">
          <p style="font-size:0.85rem; font-weight:600; color:#333; margin-bottom:8px;">Scan & Pay ₹${total.toFixed(2)} using any UPI App (${adminUpiConfig.merchantName}):</p>
          <img src="${getDynamicUpiQrUrl(total)}" alt="UPI QR Code" style="border:2px solid #fff; border-radius:4px; box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:6px;" />
          <p style="font-size:0.78rem; font-weight:700; color:#2874f0; margin-bottom:2px;">UPI ID: ${adminUpiConfig.upiId}</p>
          <p style="font-size:0.75rem; color:#666;">Scan QR code with GPay/PhonePe to complete instant payment.</p>
        </div>

        <button type="submit" id="confirm-pay-btn" style="width: 100%; padding: 13px; background:#fb641b; color:#fff; font-weight:700; border:none; border-radius:4px; cursor:pointer; font-size:0.95rem; box-shadow:0 2px 4px rgba(0,0,0,0.15);">
          PAY NOW (₹${total.toFixed(2)})
        </button>
      </form>
    </div>
  `;

  window.selectPaymentMode = (type) => {
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('active'));
    const payBox = document.getElementById('payment-details-box');
    const payBtn = document.getElementById('confirm-pay-btn');

    if (type === 'UPI') {
      document.getElementById('pay-upi').checked = true;
      document.getElementById('pay-upi').closest('.payment-option').classList.add('active');
      payBox.style.display = 'block';
      payBox.innerHTML = `
        <p style="font-size:0.85rem; font-weight:600; color:#333; margin-bottom:8px;">Scan & Pay ₹${total.toFixed(2)} using any UPI App (${adminUpiConfig.merchantName}):</p>
        <img src="${getDynamicUpiQrUrl(total)}" alt="UPI QR Code" style="border:2px solid #fff; border-radius:4px; box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:6px;" />
        <p style="font-size:0.78rem; font-weight:700; color:#2874f0; margin-bottom:2px;">UPI ID: ${adminUpiConfig.upiId}</p>
        <p style="font-size:0.75rem; color:#666;">Scan QR code with GPay/PhonePe to complete instant payment.</p>
      `;
      payBtn.innerText = `PAY NOW (₹${total.toFixed(2)})`;
    } else if (type === 'Card') {
      document.getElementById('pay-card').checked = true;
      document.getElementById('pay-card').closest('.payment-option').classList.add('active');
      payBox.style.display = 'block';
      payBox.innerHTML = `
        <div style="text-align:left;">
          <input type="text" placeholder="Card Number (16 digits)" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #ccc; border-radius:4px; font-size:0.85rem;" />
          <div style="display:flex; gap:8px;">
            <input type="text" placeholder="MM/YY" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px; font-size:0.85rem;" />
            <input type="password" placeholder="CVV" maxlength="3" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px; font-size:0.85rem;" />
          </div>
        </div>
      `;
      payBtn.innerText = `PAY NOW (₹${total.toFixed(2)})`;
    } else {
      document.getElementById('pay-cod').checked = true;
      document.getElementById('pay-cod').closest('.payment-option').classList.add('active');
      payBox.style.display = 'none';
      payBtn.innerText = `PLACE COD ORDER (₹${total.toFixed(2)})`;
    }
  };

  document.getElementById('checkout-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('confirm-pay-btn');
    const selectedPayOption = document.querySelector('input[name="pay-mode"]:checked').value;
    
    btn.disabled = true;
    btn.innerText = "Processing Payment & Order...";

    try {
      const orderPayload = {
        customerEmail: currentUser ? currentUser.email : 'Guest User',
        customerName: document.getElementById('cust-name').value,
        address: document.getElementById('cust-address').value,
        paymentMode: selectedPayOption,
        items: window.cart,
        totalAmount: total,
        status: 'Pending',
        createdAt: new Date()
      };

      await addDoc(collection(db, "orders"), orderPayload);

      window.cart = [];
      localStorage.removeItem('arcanix_cart');
      updateCartBadge();
      location.hash = 'order-confirmation';
    } catch (err) {
      alert("Error processing payment: " + err.message);
      btn.disabled = false;
      btn.innerText = `PAY NOW (₹${total.toFixed(2)})`;
    }
  };
}

// 9. ORDER CONFIRMATION PAGE
function renderOrderConfirmationPage() {
  appContainer.innerHTML = `
    <div style="text-align: center; padding: 50px 16px; background:#fff; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      <h2 style="color: #388e3c; font-size: 1.4rem; margin-bottom:8px; display: flex; align-items: center; justify-content: center; gap: 8px;">
        ${VECTOR_ICONS.party} Order & Payment Received!
      </h2>
      <p style="margin-bottom: 24px; color:#666; font-size: 0.9rem;">Your order details have been saved successfully and are being processed.</p>
      <a href="#home" style="display:inline-block; padding:12px 28px; background:#2874f0; color:#fff; text-decoration:none; border-radius:2px; font-weight:700;">Continue Shopping</a>
    </div>
  `;
}

// 10. AUTH PAGE
function renderAuthPage() {
  appContainer.innerHTML = `
    <div style="padding: 24px; background:#fff; max-width: 400px; margin: 20px auto; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">
      <h2 style="text-align: center; margin-bottom: 20px; font-size: 1.25rem; color:#2874f0; font-weight:800;">Login / Sign Up</h2>
      <button type="button" id="google-login-btn" style="width: 100%; margin-bottom: 16px; padding: 10px; background:#fff; border:1px solid #ccc; border-radius:2px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; font-size:0.9rem;">
        <span>${VECTOR_ICONS.globe}</span> Sign in with Google
      </button>
      <form id="email-form">
        <div style="margin-bottom:12px;"><label style="display:block; font-size:0.85rem; margin-bottom:4px;">Email</label><input type="email" id="a-email" required style="width:100%; padding:9px; border:1px solid #ccc; border-radius:2px;"/></div>
        <div style="margin-bottom:16px;"><label style="display:block; font-size:0.85rem; margin-bottom:4px;">Password</label><input type="password" id="a-pass" required style="width:100%; padding:9px; border:1px solid #ccc; border-radius:2px;"/></div>
        <button type="submit" style="width: 100%; padding: 11px; background:#fb641b; color:#fff; font-weight:700; border:none; border-radius:2px; cursor:pointer;">CONTINUE</button>
      </form>
    </div>
  `;

  document.getElementById('google-login-btn').onclick = async (e) => {
    e.preventDefault();
    try {
      await signInWithPopup(auth, googleProvider);
      window.location.hash = '#account';
    } catch(err) {
      alert("Google Login Error: " + err.message);
    }
  };

  document.getElementById('email-form').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, document.getElementById('a-email').value, document.getElementById('a-pass').value);
      window.location.hash = '#account';
    } catch(err) {
      alert("Login Error: " + err.message);
    }
  };
}

// 11. USER DASHBOARD
function renderUserDashboardPage() {
  if (!currentUser) { location.hash = 'auth'; return; }
  const isAdmin = currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  appContainer.innerHTML = `
    <div style="padding: 24px; background:#fff; text-align: center; max-width: 450px; margin: 0 auto; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      <h3 style="font-size: 1.15rem;">My Account</h3>
      <p style="color: #666; margin: 6px 0 20px 0; font-size: 0.88rem;">${currentUser.email}</p>
      <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; margin-bottom: 20px;">
        ${isAdmin ? `<a href="#seller-dashboard" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:11px; background:#2874f0; color:#fff; text-decoration:none; font-weight:700; border-radius:2px; font-size:0.9rem;"><span>${VECTOR_ICONS.gear}</span> Admin Control Panel (CMS)</a>` : ''}
      </div>
      <button id="so-btn" style="width:100%; padding:11px; background:none; border:1px solid #ccc; border-radius:2px; cursor:pointer; font-weight:600; color:#d32f2f; font-size:0.9rem;">Logout Account</button>
    </div>
  `;
  document.getElementById('so-btn').onclick = () => signOut(auth).then(() => location.hash = 'auth');
}

// 12. ADMIN DASHBOARD
async function renderSellerDashboardPage() {
  if (!currentUser || (currentUser.email && currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
    appContainer.innerHTML = `<div style="padding:20px; background:#fff;"><h2>Access Denied</h2><p>Only authorized admin can access this page.</p></div>`;
    return;
  }

  await loadAdminPaymentSettings();

  appContainer.innerHTML = `
    <div style="padding: 20px; background:#fff; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      <h2 style="font-size: 1.15rem; margin-bottom: 4px; display:flex; align-items:center; gap:8px;">
        <span>${VECTOR_ICONS.gear}</span> Admin Control Panel (E-Commerce CMS)
      </h2>
      <p style="color: #666; margin-bottom: 20px; font-size: 0.85rem;">Manage Payment QR, Banners, Categories, Live Products & Customer Orders.</p>

      <!-- ADMIN QR & PAYMENT SETTINGS SECTION -->
      <form id="admin-payment-form" style="background: #eef5ff; border: 1px dashed #2874f0; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
        <h4 style="margin-bottom: 12px; font-size:0.95rem; color:#2874f0;">Payment QR & UPI Settings</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          <div style="flex: 1 1 220px; margin-bottom:8px;">
            <label style="font-size:0.8rem; font-weight:600;">Admin UPI ID (e.g. name@upi)</label>
            <input type="text" id="qr-upi-id" required value="${adminUpiConfig.upiId}" placeholder="yourname@upi" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:3px; font-size:0.85rem;"/>
          </div>
          <div style="flex: 1 1 220px; margin-bottom:8px;">
            <label style="font-size:0.8rem; font-weight:600;">Business / Merchant Name</label>
            <input type="text" id="qr-merchant-name" required value="${adminUpiConfig.merchantName}" placeholder="Arcanix Store" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:3px; font-size:0.85rem;"/>
          </div>
        </div>
        <button type="submit" id="qr-save-btn" style="padding:8px 16px; background:#2874f0; color:#fff; border:none; border-radius:2px; font-weight:700; cursor:pointer; font-size:0.85rem;">Save UPI QR Settings</button>
      </form>

      <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
        <form id="admin-banner-form" style="flex: 1 1 280px; background: #fafafa; padding: 16px; border: 1px solid #eee; border-radius: 4px;">
          <h4 style="margin-bottom: 12px; font-size:0.95rem;">1. Add Hero Banner</h4>
          <div style="margin-bottom:8px;"><label style="font-size:0.8rem;">Title</label><input type="text" id="b-title" required placeholder="FESTIVE SALE" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="margin-bottom:8px;"><label style="font-size:0.8rem;">Subtitle</label><input type="text" id="b-subtitle" placeholder="Up to 80% OFF" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="margin-bottom:12px;"><label style="font-size:0.8rem;">Image URL</label><input type="url" id="b-image" required placeholder="https://..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <button type="submit" style="width:100%; padding:8px; background:#fb641b; color:#fff; border:none; border-radius:2px; font-weight:700; cursor:pointer;">Save Banner</button>
        </form>

        <form id="admin-cat-form" style="flex: 1 1 280px; background: #fafafa; padding: 16px; border: 1px solid #eee; border-radius: 4px;">
          <h4 style="margin-bottom: 12px; font-size:0.95rem;">2. Add New Category</h4>
          <div style="margin-bottom:8px;"><label style="font-size:0.8rem;">Category Name</label><input type="text" id="c-name" required placeholder="Electronics" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="margin-bottom:12px;"><label style="font-size:0.8rem;">Category Tag</label><input type="text" id="c-icon" placeholder="Featured" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <button type="submit" id="c-submit-btn" style="width:100%; padding:8px; background:#2874f0; color:#fff; border:none; border-radius:2px; font-weight:700; cursor:pointer;">Save Category</button>
        </form>
      </div>

      <form id="seller-add-form" style="background: #fafafa; padding: 16px; border: 1px solid #eee; border-radius: 4px; margin-bottom: 24px;">
        <h4 style="margin-bottom: 12px; font-size:0.95rem;" id="prod-form-heading">3. Publish New Product</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          <div style="flex: 1 1 180px; margin-bottom:8px;"><label style="font-size:0.8rem;">Title</label><input type="text" id="p-title" required placeholder="Headphones" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="flex: 1 1 180px; margin-bottom:8px;">
            <label style="font-size:0.8rem;">Select Category</label>
            <select id="p-category" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius:2px; background:#fff; font-size:0.85rem;">
              <option value="General">General</option>
            </select>
          </div>
          <div style="flex: 1 1 180px; margin-bottom:8px;"><label style="font-size:0.8rem;">Price (₹)</label><input type="number" step="0.01" id="p-price" required placeholder="499" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="flex: 1 1 180px; margin-bottom:8px;"><label style="font-size:0.8rem;">Offer Tag</label><input type="text" id="p-tag" placeholder="Hot Deal" style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="flex: 1 1 100%; margin-bottom:8px;"><label style="font-size:0.8rem;">Image URL</label><input type="url" id="p-image" required placeholder="https://..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"/></div>
          <div style="flex: 1 1 100%; margin-bottom:12px;"><label style="font-size:0.8rem;">Description</label><textarea id="p-desc" rows="2" required placeholder="Product specifications..." style="width:100%; padding:6px; border:1px solid #ccc; border-radius:2px;"></textarea></div>
        </div>
        <div style="display:flex; gap:10px;">
          <button type="submit" id="prod-submit-btn" style="flex:1; padding:10px; background:#fb641b; color:#fff; border:none; border-radius:2px; font-weight:700; cursor:pointer;">PUBLISH PRODUCT NOW</button>
          <button type="button" id="cancel-edit-btn" style="display:none; padding:10px; background:#666; color:#fff; border:none; border-radius:2px; font-weight:700; cursor:pointer;" onclick="resetProductForm()">CANCEL EDIT</button>
        </div>
      </form>

      <!-- ORDER MANAGEMENT MODULE -->
      <h4 style="margin-bottom: 12px; margin-top: 28px; font-size:1.05rem; color:#2874f0; display:flex; align-items:center; gap:6px;">
        <span>${VECTOR_ICONS.box}</span> Customer Order Management
      </h4>
      <div id="admin-orders-list" style="overflow-x: auto; margin-bottom: 30px;"></div>

      <h4 style="margin-bottom: 12px; font-size:0.95rem;">Manage Categories</h4>
      <div id="admin-categories-list" style="overflow-x: auto; margin-bottom: 24px;"></div>

      <h4 style="margin-bottom: 12px; font-size:0.95rem;">Manage Live Hero Banners</h4>
      <div id="admin-banners-list" style="overflow-x: auto; margin-bottom: 24px;"></div>

      <h4 style="margin-bottom: 12px; font-size:0.95rem;">Manage Live Products</h4>
      <div id="admin-items-list" style="overflow-x: auto;"></div>
    </div>
  `;

  // Submit Admin Payment Settings Form
  document.getElementById('admin-payment-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('qr-save-btn');
    const newUpiId = document.getElementById('qr-upi-id').value.trim();
    const newMerchantName = document.getElementById('qr-merchant-name').value.trim();

    try {
      btn.disabled = true;
      btn.innerText = "Saving Settings...";
      await setDoc(doc(db, "settings", "payment"), {
        upiId: newUpiId,
        merchantName: newMerchantName,
        updatedAt: new Date()
      });
      adminUpiConfig = { upiId: newUpiId, merchantName: newMerchantName };
      alert("Payment UPI QR Settings saved successfully!");
    } catch(err) {
      alert("Error saving payment settings: " + err.message);
    } finally {
      btn.disabled = false;
      btn.innerText = "Save UPI QR Settings";
    }
  };

  async function populateCategoryDropdown() {
    const catSelect = document.getElementById('p-category');
    if (!catSelect) return;
    try {
      const catSnap = await getDocs(collection(db, "categories"));
      catSelect.innerHTML = '<option value="General">General</option>';
      if (!catSnap.empty) {
        catSnap.docs.forEach(d => {
          const catName = d.data().name;
          const option = document.createElement('option');
          option.value = catName;
          option.textContent = catName;
          catSelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Categories Fetch Error:", err);
    }
  }

  await populateCategoryDropdown();

  // Render Categories Table in CMS
  const categoriesContainer = document.getElementById('admin-categories-list');
  try {
    const catSnap = await getDocs(collection(db, "categories"));
    if (catSnap.empty) {
      categoriesContainer.innerHTML = '<p style="color:#878787; font-size:0.85rem;">No custom categories created yet.</p>';
    } else {
      categoriesContainer.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
          <thead><tr style="border-bottom: 2px solid #e0e0e0; text-align:left;"><th style="padding:8px;">Icon</th><th style="padding:8px;">Category Name</th><th style="padding:8px;">Action</th></tr></thead>
          <tbody>
            ${catSnap.docs.map(docSnap => {
              const c = docSnap.data();
              return `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding:6px;">${VECTOR_ICONS.box}</td>
                  <td style="padding:6px;"><b>${c.name}</b></td>
                  <td style="padding:6px;"><button onclick="deleteItemByAdmin('categories', '${docSnap.id}')" style="background:#d32f2f; color:#fff; border:none; padding:4px 8px; border-radius:2px; cursor:pointer;">Delete</button></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  } catch(err) {
    categoriesContainer.innerHTML = '<p style="color:#d32f2f;">Error fetching categories.</p>';
  }

  // Load Customer Orders
  const ordersContainer = document.getElementById('admin-orders-list');
  try {
    const ordersSnap = await getDocs(collection(db, "orders"));
    if (ordersSnap.empty) {
      ordersContainer.innerHTML = '<p style="color:#878787; font-size:0.85rem; padding:10px; background:#f9f9f9; border-radius:4px;">No customer orders placed yet.</p>';
    } else {
      const getStatusBadgeIcon = (status) => {
        if (status === 'Delivered') return VECTOR_ICONS.check;
        if (status === 'Cancelled') return VECTOR_ICONS.cross;
        if (status === 'Shipped') return VECTOR_ICONS.truck;
        return VECTOR_ICONS.clock;
      };

      ordersContainer.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
          <thead>
            <tr style="background:#f1f3f6; text-align:left;">
              <th style="padding:10px; border-bottom:2px solid #ddd;">Order Details</th>
              <th style="padding:10px; border-bottom:2px solid #ddd;">Customer Info</th>
              <th style="padding:10px; border-bottom:2px solid #ddd;">Total</th>
              <th style="padding:10px; border-bottom:2px solid #ddd;">Status</th>
              <th style="padding:10px; border-bottom:2px solid #ddd;">Update Status</th>
            </tr>
          </thead>
          <tbody>
            ${ordersSnap.docs.map(docSnap => {
              const o = docSnap.data();
              const itemsStr = (o.items || []).map(i => `${i.title} (x${i.quantity || 1})`).join('<br/>');
              const currentStatus = o.status || 'Pending';

              return `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding:10px; vertical-align:top;">
                    <div style="font-weight:700; color:#2874f0; margin-bottom:4px;">#${docSnap.id.substring(0, 8).toUpperCase()}</div>
                    <div style="font-size:0.8rem; color:#555;">${itemsStr}</div>
                  </td>
                  <td style="padding:10px; vertical-align:top;">
                    <b>${o.customerName || 'N/A'}</b><br/>
                    <span style="font-size:0.78rem; color:#666;">${o.customerEmail || ''}</span><br/>
                    <span style="font-size:0.78rem; color:#444;">${o.address || 'No Address'}</span>
                  </td>
                  <td style="padding:10px; vertical-align:top;">
                    <b>₹${(o.totalAmount || 0).toFixed(2)}</b><br/>
                    <span style="font-size:0.75rem; color:#666;">${o.paymentMode || ''}</span>
                  </td>
                  <td style="padding:10px; vertical-align:top;">
                    <span class="status-badge status-${currentStatus}">${getStatusBadgeIcon(currentStatus)} ${currentStatus}</span>
                  </td>
                  <td style="padding:10px; vertical-align:top;">
                    <select onchange="updateOrderStatus('${docSnap.id}', this.value)" style="padding:5px; border-radius:3px; border:1px solid #ccc; font-size:0.8rem; outline:none; cursor:pointer;">
                      <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                      <option value="Processing" ${currentStatus === 'Processing' ? 'selected' : ''}>Processing</option>
                      <option value="Shipped" ${currentStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                      <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                      <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  } catch(err) {
    ordersContainer.innerHTML = '<p style="color:#d32f2f;">Error fetching orders.</p>';
  }

  window.startEditProduct = async (id) => {
    try {
      const snap = await getDoc(doc(db, "products", id));
      if (!snap.exists()) return;
      const data = snap.data();
      
      editingProductId = id;
      document.getElementById('prod-form-heading').innerText = "3. Edit Product Details";
      document.getElementById('prod-submit-btn').innerText = "UPDATE PRODUCT";
      document.getElementById('cancel-edit-btn').style.display = "block";

      document.getElementById('p-title').value = data.title || '';
      document.getElementById('p-category').value = data.category || 'General';
      document.getElementById('p-price').value = data.price || 0;
      document.getElementById('p-tag').value = data.tag || '';
      document.getElementById('p-image').value = data.imageUrl || '';
      document.getElementById('p-desc').value = data.description || '';

      window.scrollTo({ top: document.getElementById('seller-add-form').offsetTop - 20, behavior: 'smooth' });
    } catch (err) {
      alert("Error loading product for edit: " + err.message);
    }
  };

  window.resetProductForm = () => {
    editingProductId = null;
    document.getElementById('seller-add-form').reset();
    document.getElementById('prod-form-heading').innerText = "3. Publish New Product";
    document.getElementById('prod-submit-btn').innerText = "PUBLISH PRODUCT NOW";
    document.getElementById('cancel-edit-btn').style.display = "none";
  };

  document.getElementById('admin-cat-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('c-submit-btn');
    const catName = document.getElementById('c-name').value.trim();

    if (!catName) return;

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = "Saving...";

      await addDoc(collection(db, "categories"), {
        name: catName,
        createdAt: new Date()
      });

      alert(`Category "${catName}" added!`);
      document.getElementById('admin-cat-form').reset();
      renderSellerDashboardPage();
    } catch (err) {
      alert("Error adding category: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Save Category";
    }
  };

  document.getElementById('admin-banner-form').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "banners"), {
        title: document.getElementById('b-title').value,
        subtitle: document.getElementById('b-subtitle').value,
        imageUrl: document.getElementById('b-image').value,
        createdAt: new Date()
      });
      alert("Banner saved!");
      document.getElementById('admin-banner-form').reset();
      renderSellerDashboardPage();
    } catch(err) {
      alert("Error adding banner: " + err.message);
    }
  };

  document.getElementById('seller-add-form').onsubmit = async (e) => {
    e.preventDefault();
    const productPayload = {
      title: document.getElementById('p-title').value,
      category: document.getElementById('p-category').value,
      price: parseFloat(document.getElementById('p-price').value),
      tag: document.getElementById('p-tag').value || '',
      imageUrl: document.getElementById('p-image').value,
      description: document.getElementById('p-desc').value,
      updatedAt: new Date()
    };

    try {
      if (editingProductId) {
        await updateDoc(doc(db, "products", editingProductId), productPayload);
        alert("Product updated successfully!");
      } else {
        productPayload.createdAt = new Date();
        await addDoc(collection(db, "products"), productPayload);
        alert("Product published!");
      }
      resetProductForm();
      renderSellerDashboardPage();
    } catch(err) {
      alert("Error saving product: " + err.message);
    }
  };

  const bannersContainer = document.getElementById('admin-banners-list');
  try {
    const bannerSnap = await getDocs(collection(db, "banners"));
    if (bannerSnap.empty) {
      bannersContainer.innerHTML = '<p style="color:#878787; font-size:0.85rem;">No banners active.</p>';
    } else {
      bannersContainer.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
          <thead><tr style="border-bottom: 2px solid #e0e0e0; text-align:left;"><th style="padding:8px;">Preview</th><th style="padding:8px;">Title</th><th style="padding:8px;">Subtitle</th><th style="padding:8px;">Action</th></tr></thead>
          <tbody>
            ${bannerSnap.docs.map(docSnap => {
              const b = docSnap.data();
              return `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding:6px;"><img src="${b.imageUrl}" style="width: 70px; height: 40px; object-fit: cover; border-radius: 3px;"/></td>
                  <td style="padding:6px;"><b>${b.title || 'N/A'}</b></td>
                  <td style="padding:6px;">${b.subtitle || '-'}</td>
                  <td style="padding:6px;"><button onclick="deleteItemByAdmin('banners', '${docSnap.id}')" style="background:#d32f2f; color:#fff; border:none; padding:4px 8px; border-radius:2px; cursor:pointer;">Delete</button></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  } catch(err) {
    bannersContainer.innerHTML = '<p>Error loading banners list.</p>';
  }

  const itemsContainer = document.getElementById('admin-items-list');
  try {
    const prodSnap = await getDocs(collection(db, "products"));
    if (prodSnap.empty) {
      itemsContainer.innerHTML = '<p style="color:#878787; font-size:0.85rem;">No live products found.</p>';
      return;
    }

    itemsContainer.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead><tr style="border-bottom: 2px solid #e0e0e0; text-align:left;"><th style="padding:8px;">Item</th><th style="padding:8px;">Title</th><th style="padding:8px;">Price</th><th style="padding:8px;">Action</th></tr></thead>
        <tbody>
          ${prodSnap.docs.map(docSnap => {
            const data = docSnap.data();
            return `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding:6px;"><img src="${data.imageUrl}" style="width: 36px; height: 36px; object-fit: contain;"/></td>
                <td style="padding:6px;"><b>${data.title}</b></td>
                <td style="padding:6px;">₹${data.price}</td>
                <td style="padding:6px;">
                  <button onclick="startEditProduct('${docSnap.id}')" style="background:#2874f0; color:#fff; border:none; padding:4px 8px; border-radius:2px; cursor:pointer; margin-right:4px;">Edit</button>
                  <button onclick="deleteItemByAdmin('products', '${docSnap.id}')" style="background:#d32f2f; color:#fff; border:none; padding:4px 8px; border-radius:2px; cursor:pointer;">Delete</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    itemsContainer.innerHTML = '<p>Error loading items list.</p>';
  }
}

// 13. DATA FETCHING GRID
async function fetchProductsGrid(container, searchQuery = '', categoryFilter = '') {
  try {
    const snap = await getDocs(collection(db, "products"));
    container.innerHTML = '';
    
    if (snap.empty) {
      container.innerHTML = '<p style="grid-column: 1/-1; color:#878787; font-size:0.9rem;">No products found in store.</p>';
      return;
    }

    let matchFound = false;
    const fallbackProductImg = 'https://placehold.co/200x200/e0e0e0/000000?text=No+Image';

    snap.forEach((docSnap) => {
      const p = docSnap.data();
      
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return;
      if (categoryFilter && p.category !== categoryFilter) return;

      matchFound = true;
      container.innerHTML += `
        <div class="product-card" onclick="location.hash='pdp?id=${docSnap.id}'">
          <img src="${p.imageUrl || fallbackProductImg}" 
               onerror="this.onerror=null; this.src='${fallbackProductImg}';" 
               class="product-card-img"/>
          <div>
            <div class="product-card-title">${p.title}</div>
            <div class="rating-badge">4.5 ${VECTOR_ICONS.star}</div>
            <div class="price-row">
              <span class="main-price">₹${p.price}</span>
              ${p.tag ? `<span class="offer-tag">${p.tag}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    if (!matchFound) {
      container.innerHTML = '<p style="grid-column: 1/-1; color:#878787; font-size:0.9rem;">No products available for this selection.</p>';
    }
  } catch (err) {
    container.innerHTML = `<p style="grid-column: 1/-1;">Error loading store items.</p>`;
  }
}
