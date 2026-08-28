import { db, auth, onAuthStateChanged, googleProvider, signInWithPopup, signOut, signInWithEmailAndPassword, ADMIN_EMAIL } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.cart = JSON.parse(localStorage.getItem('arcanix_cart')) || [];
let currentUser = null;
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
  party: `<svg class="v-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
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
    console.error("Error loading UPI settings:", e);
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
  'account': renderUserDashboardPage
};

const appContainer = document.getElementById('app-view');

// Responsive Stylesheet Injection
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
    
    .payment-option { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; transition: all 0.2s; margin-bottom: 10px; }
    .payment-option.active { border-color: #2874f0; background: #f0f7ff; }
  `;
  document.head.appendChild(style);
}

// Navigation Header Setup
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
      ${isAdmin ? `<a href="admin.html" onclick="toggleDrawer(false)" style="color:#2874f0; font-weight:700;"><span>${VECTOR_ICONS.gear}</span> Open Admin Panel</a>` : ''}
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

// HOME PAGE
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

// CATEGORY PRODUCTS PAGE
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

// PRODUCT DETAIL PAGE
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

// SEARCH PAGE
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

// CART PAGE
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

// Dynamic Admin UPI Link Builder & Dynamic App Intent
function getUpiPayLink(total) {
  const upiId = encodeURIComponent(adminUpiConfig.upiId || 'merchant@upi');
  const merchantName = encodeURIComponent(adminUpiConfig.merchantName || 'ArcanixPlus');
  return `upi://pay?pa=${upiId}&pn=${merchantName}&am=${total.toFixed(2)}&cu=INR`;
}

function getDynamicUpiQrUrl(total) {
  const upiPayload = getUpiPayLink(total);
  return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiPayload)}`;
}

// CHECKOUT PAGE
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
              UPI / Direct App (PhonePe, GPay, Paytm)
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
          <p style="font-size:0.85rem; font-weight:600; color:#333; margin-bottom:8px;">Scan or Tap to Pay ₹${total.toFixed(2)} (${adminUpiConfig.merchantName}):</p>
          <img src="${getDynamicUpiQrUrl(total)}" alt="UPI QR Code" style="border:2px solid #fff; border-radius:4px; box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:6px;" />
          <p style="font-size:0.78rem; font-weight:700; color:#2874f0; margin-bottom:2px;">UPI ID: ${adminUpiConfig.upiId}</p>
          <p style="font-size:0.75rem; color:#666;">Mobile users: Pressing PAY NOW will open your default UPI app directly.</p>
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
        <p style="font-size:0.85rem; font-weight:600; color:#333; margin-bottom:8px;">Scan or Tap to Pay ₹${total.toFixed(2)} (${adminUpiConfig.merchantName}):</p>
        <img src="${getDynamicUpiQrUrl(total)}" alt="UPI QR Code" style="border:2px solid #fff; border-radius:4px; box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:6px;" />
        <p style="font-size:0.78rem; font-weight:700; color:#2874f0; margin-bottom:2px;">UPI ID: ${adminUpiConfig.upiId}</p>
        <p style="font-size:0.75rem; color:#666;">Mobile users: Pressing PAY NOW will open your default UPI app directly.</p>
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

      // 1. Save Order to Database
      await addDoc(collection(db, "orders"), orderPayload);

      // 2. Direct user to UPI App if UPI mode was selected
      if (selectedPayOption.includes('UPI')) {
        const upiDeepLink = getUpiPayLink(total);
        window.location.href = upiDeepLink;
      }

      window.cart = [];
      localStorage.removeItem('arcanix_cart');
      updateCartBadge();
      
      // Delay navigation slightly so payment app intent triggers smoothly on mobile devices
      setTimeout(() => {
        location.hash = 'order-confirmation';
      }, 500);

    } catch (err) {
      alert("Error processing payment: " + err.message);
      btn.disabled = false;
      btn.innerText = `PAY NOW (₹${total.toFixed(2)})`;
    }
  };
}

// ORDER CONFIRMATION PAGE
function renderOrderConfirmationPage() {
  appContainer.innerHTML = `
    <div style="text-align: center; padding: 50px 16px; background:#fff; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      <h2 style="color: #388e3c; font-size: 1.4rem; margin-bottom:8px; display: flex; align-items: center; justify-content: center; gap: 8px;">
        ${VECTOR_ICONS.party} Order Received!
      </h2>
      <p style="margin-bottom: 24px; color:#666; font-size: 0.9rem;">Your order details have been saved successfully and are being processed.</p>
      <a href="#home" style="display:inline-block; padding:12px 28px; background:#2874f0; color:#fff; text-decoration:none; border-radius:2px; font-weight:700;">Continue Shopping</a>
    </div>
  `;
}

// AUTH PAGE
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

// USER DASHBOARD (PROFILE PAGE)
function renderUserDashboardPage() {
  if (!currentUser) { location.hash = 'auth'; return; }
  const isAdmin = currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  appContainer.innerHTML = `
    <div style="padding: 24px; background:#fff; text-align: center; max-width: 450px; margin: 0 auto; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      <h3 style="font-size: 1.15rem;">My Account</h3>
      <p style="color: #666; margin: 6px 0 20px 0; font-size: 0.88rem;">${currentUser.email}</p>
      
      <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; margin-bottom: 20px;">
        ${isAdmin ? `<a href="admin.html" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:11px; background:#2874f0; color:#fff; text-decoration:none; font-weight:700; border-radius:2px; font-size:0.9rem;"><span>${VECTOR_ICONS.gear}</span> Open Admin Panel</a>` : ''}
      </div>
      
      <button id="so-btn" style="width:100%; padding:11px; background:none; border:1px solid #ccc; border-radius:2px; cursor:pointer; font-weight:600; color:#d32f2f; font-size:0.9rem;">Logout Account</button>
    </div>
  `;
  document.getElementById('so-btn').onclick = () => signOut(auth).then(() => location.hash = 'auth');
}

// DATA FETCHING GRID
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
