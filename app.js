import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs
} from './firebase-config.js';

const ADMIN_EMAIL = 'admin@arcanix.com';

const VECTOR_ICONS = {
  cart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  user: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  gear: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
};

window.cart = JSON.parse(localStorage.getItem('arcanix_cart')) || [];
let currentUser = null;
let productsData = [];

const appContainer = document.getElementById('app');
const cartBadge = document.getElementById('cart-badge');
const authLink = document.getElementById('auth-link');

function saveCart() {
  localStorage.setItem('arcanix_cart', JSON.stringify(window.cart));
  updateCartBadge();
}

function updateCartBadge() {
  const count = window.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartBadge) {
    cartBadge.textContent = count;
    cartBadge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (authLink) {
    authLink.innerHTML = user 
      ? `<span style="display:flex;align-items:center;gap:4px;">${VECTOR_ICONS.user} Account</span>` 
      : 'Login';
    authLink.href = user ? '#dashboard' : '#auth';
  }
  handleRouting();
});

window.addEventListener('hashchange', handleRouting);

function handleRouting() {
  const hash = location.hash || '#home';
  if (hash === '#home') renderHomePage();
  else if (hash === '#cart') renderCartPage();
  else if (hash === '#checkout') renderCheckoutPage();
  else if (hash === '#auth') renderAuthPage();
  else if (hash === '#dashboard') renderUserDashboardPage();
  else if (hash.startsWith('#product-')) {
    const productId = hash.replace('#product-', '');
    renderProductDetailPage(productId);
  }
}

async function renderHomePage() {
  if (!appContainer) return;
  appContainer.innerHTML = '<div style="text-align:center; padding:40px; font-family:sans-serif;">Loading Products...</div>';
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    productsData = [];
    querySnapshot.forEach((doc) => {
      productsData.push({ id: doc.id, ...doc.data() });
    });

    if (productsData.length === 0) {
      appContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#666; font-family:sans-serif;">No products available right now.</div>';
      return;
    }

    appContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; padding: 16px 0; font-family:sans-serif;">
        ${productsData.map(p => `
          <div style="background:#fff; border-radius:4px; padding:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1); display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <img src="${p.imageUrl || 'https://via.placeholder.com/200'}" alt="${p.title}" style="width:100%; height:180px; object-fit:contain; border-radius:2px; margin-bottom:8px;"/>
              <h4 style="font-size:0.95rem; margin:0 0 4px 0; color:#212121;">${p.title}</h4>
              <p style="font-weight:700; color:#111; font-size:1.1rem; margin:0 0 8px 0;">₹${p.price}</p>
            </div>
            <div style="display:flex; gap:8px;">
              <a href="#product-${p.id}" style="flex:1; text-align:center; padding:8px; border:1px solid #2874f0; color:#2874f0; text-decoration:none; font-weight:600; font-size:0.85rem; border-radius:2px;">View Details</a>
              <button onclick="addToCart('${p.id}')" style="padding:8px 12px; background:#ff9f00; color:#fff; border:none; border-radius:2px; cursor:pointer; font-weight:600; font-size:0.85rem;">Add</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch(e) {
    appContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#d32f2f; font-family:sans-serif;">Failed to load products.</div>';
  }
}

window.addToCart = function(productId) {
  const prod = productsData.find(p => p.id === productId);
  if (!prod) return;
  const existing = window.cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    window.cart.push({ id: prod.id, title: prod.title, price: prod.price, imageUrl: prod.imageUrl, quantity: 1 });
  }
  saveCart();
  alert(`${prod.title} added to cart!`);
};

async function renderProductDetailPage(productId) {
  if (!appContainer) return;
  appContainer.innerHTML = '<div style="text-align:center; padding:40px; font-family:sans-serif;">Loading...</div>';
  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      appContainer.innerHTML = '<div style="text-align:center; padding:40px; font-family:sans-serif;">Product not found.</div>';
      return;
    }
    const p = { id: docSnap.id, ...docSnap.data() };
    appContainer.innerHTML = `
      <div style="background:#fff; padding:20px; border-radius:4px; max-width:800px; margin:20px auto; display:grid; grid-template-columns: 1fr 1fr; gap:20px; font-family:sans-serif;">
        <div>
          <img src="${p.imageUrl || 'https://via.placeholder.com/300'}" style="width:100%; max-height:350px; object-fit:contain;" />
        </div>
        <div>
          <h2 style="margin:0 0 10px 0;">${p.title}</h2>
          <h3 style="color:#2874f0; margin:0 0 15px 0;">₹${p.price}</h3>
          <p style="color:#555; line-height:1.5; margin:0 0 20px 0;">${p.description || 'No description available.'}</p>
          <button onclick="addToCart('${p.id}')" style="padding:12px 24px; background:#ff9f00; color:#fff; border:none; border-radius:2px; cursor:pointer; font-weight:700;">Add To Cart</button>
        </div>
      </div>
    `;
  } catch(e) {
    appContainer.innerHTML = '<div style="text-align:center; padding:40px; font-family:sans-serif;">Error loading product details.</div>';
  }
}

function renderCartPage() {
  if (!appContainer) return;
  if (window.cart.length === 0) {
    appContainer.innerHTML = `
      <div style="text-align:center; padding:60px 20px; background:#fff; margin-top:20px; border-radius:4px; font-family:sans-serif;">
        <h3>Your Cart is Empty</h3>
        <p style="color:#777; margin:10px 0 20px 0;">Add items to it now.</p>
        <a href="#home" style="padding:10px 20px; background:#2874f0; color:#fff; text-decoration:none; font-weight:600; border-radius:2px;">Shop Now</a>
      </div>
    `;
    return;
  }

  const total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  appContainer.innerHTML = `
    <div style="max-width:800px; margin:20px auto; background:#fff; padding:20px; border-radius:4px; font-family:sans-serif;">
      <h2 style="margin:0 0 20px 0; border-bottom:1px solid #eee; padding-bottom:10px;">Shopping Cart</h2>
      ${window.cart.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f0f0f0; padding:12px 0;">
          <div style="display:flex; gap:12px; align-items:center;">
            <img src="${item.imageUrl || 'https://via.placeholder.com/60'}" style="width:50px; height:50px; object-fit:contain;" />
            <div>
              <h4 style="margin:0 0 4px 0;">${item.title}</h4>
              <p style="color:#666; font-size:0.9rem; margin:0;">₹${item.price} x ${item.quantity}</p>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button onclick="changeQty('${item.id}', -1)" style="padding:2px 8px; font-weight:bold; cursor:pointer;">-</button>
            <span>${item.quantity}</span>
            <button onclick="changeQty('${item.id}', 1)" style="padding:2px 8px; font-weight:bold; cursor:pointer;">+</button>
            <button onclick="removeItem('${item.id}')" style="margin-left:12px; color:#d32f2f; background:none; border:none; cursor:pointer;">Remove</button>
          </div>
        </div>
      `).join('')}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; font-size:1.2rem; font-weight:bold;">
        <span>Total:</span>
        <span>₹${total.toFixed(2)}</span>
      </div>
      <div style="text-align:right; margin-top:20px;">
        <a href="#checkout" style="display:inline-block; padding:12px 30px; background:#fb641b; color:#fff; text-decoration:none; font-weight:700; border-radius:2px;">Proceed to Checkout</a>
      </div>
    </div>
  `;
}

window.changeQty = function(id, delta) {
  const item = window.cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    window.cart = window.cart.filter(i => i.id !== id);
  }
  saveCart();
  renderCartPage();
};

window.removeItem = function(id) {
  window.cart = window.cart.filter(i => i.id !== id);
  saveCart();
  renderCartPage();
};

async function renderCheckoutPage() {
  if (!appContainer) return;
  if (!currentUser) {
    location.hash = 'auth';
    return;
  }
  if (window.cart.length === 0) {
    location.hash = 'cart';
    return;
  }

  let defaultPhone = '';
  try {
    const uSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (uSnap.exists()) defaultPhone = uSnap.data().phone || '';
  } catch(e){}

  const total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  appContainer.innerHTML = `
    <div style="max-width:500px; margin:20px auto; background:#fff; padding:24px; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.1); font-family:sans-serif;">
      <h3 style="margin:0 0 16px 0;">Order Checkout</h3>
      <p style="margin:0 0 12px 0; font-size:0.9rem; color:#666;">Account: <b>${currentUser.email}</b></p>
      
      <form id="checkout-form">
        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:0.85rem; margin-bottom:6px; font-weight:600;">Full Name *</label>
          <input type="text" id="cust-name" required placeholder="Enter full name" style="width:100%; padding:9px; border:1px solid #ccc; border-radius:4px; font-size:0.9rem; box-sizing:border-box;"/>
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:0.85rem; margin-bottom:6px; font-weight:600;">Mobile / WhatsApp Number *</label>
          <input type="tel" id="cust-phone" pattern="[0-9]{10}" value="${defaultPhone}" required placeholder="10-digit mobile number" style="width:100%; padding:9px; border:1px solid #ccc; border-radius:4px; font-size:0.9rem; box-sizing:border-box;"/>
        </div>
        
        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:0.85rem; margin-bottom:6px; font-weight:600;">Delivery Address *</label>
          <textarea id="cust-address" required placeholder="Enter complete delivery address..." style="width:100%; height:75px; padding:10px; border:1px solid #ccc; border-radius:4px; font-size:0.9rem; box-sizing:border-box;"></textarea>
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:0.85rem; margin-bottom:6px; font-weight:600;">Payment Option</label>
          <select id="cust-pay-mode" style="width:100%; padding:9px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;">
            <option value="Cash on Delivery">Cash on Delivery (COD)</option>
            <option value="UPI / Online">UPI / Online Transfer</option>
          </select>
        </div>

        <div style="font-size:1.1rem; font-weight:700; margin-bottom:16px;">
          Total Payable: ₹${total.toFixed(2)}
        </div>

        <button type="submit" style="width:100%; padding:12px; background:#fb641b; color:#fff; font-weight:700; border:none; border-radius:2px; cursor:pointer;">Confirm & Place Order</button>
      </form>
    </div>
  `;

  document.getElementById('checkout-form').onsubmit = async (e) => {
    e.preventDefault();
    const orderPayload = {
      customerUid: currentUser.uid,
      customerEmail: currentUser.email,
      customerName: document.getElementById('cust-name').value.trim(),
      customerPhone: document.getElementById('cust-phone').value.trim(),
      address: document.getElementById('cust-address').value.trim(),
      paymentMode: document.getElementById('cust-pay-mode').value,
      items: window.cart,
      totalAmount: total,
      status: 'Pending',
      createdAt: new Date()
    };

    try {
      await addDoc(collection(db, "orders"), orderPayload);
      window.cart = [];
      saveCart();
      alert("Order placed successfully!");
      location.hash = 'dashboard';
    } catch(err) {
      alert("Failed to place order: " + err.message);
    }
  };
}

async function renderUserDashboardPage() {
  if (!appContainer) return;
  if (!currentUser) { location.hash = 'auth'; return; }
  const isAdmin = currentUser.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  let existingPhone = '';
  try {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      existingPhone = userDoc.data().phone || '';
    }
  } catch(e) { console.error(e); }
  
  appContainer.innerHTML = `
    <div style="padding: 24px; background:#fff; text-align: center; max-width: 450px; margin: 20px auto; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.1); font-family:sans-serif;">
      <h3 style="font-size: 1.15rem; margin:0 0 6px 0;">My Account</h3>
      <p style="color: #666; margin: 0 0 16px 0; font-size: 0.88rem;">${currentUser.email}</p>
      
      <form id="profile-phone-form" style="margin-bottom: 20px; text-align: left; background: #f9f9f9; padding: 14px; border-radius: 4px;">
        <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:6px;">WhatsApp / Mobile Number *</label>
        <input type="tel" id="user-phone-input" pattern="[0-9]{10}" required placeholder="Enter 10-digit number" value="${existingPhone}" style="width:100%; padding:9px; border:1px solid #ccc; border-radius:4px; font-size:0.9rem; margin-bottom:10px; box-sizing:border-box;"/>
        <button type="submit" style="width:100%; padding:9px; background:#2874f0; color:#fff; font-weight:700; border:none; border-radius:2px; cursor:pointer;">Save Phone Number</button>
      </form>

      <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; margin-bottom: 20px;">
        ${isAdmin ? `<a href="admin.html" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:11px; background:#2874f0; color:#fff; text-decoration:none; font-weight:700; border-radius:2px; font-size:0.9rem; box-sizing:border-box;"><span>${VECTOR_ICONS.gear}</span> Open Admin Panel</a>` : ''}
      </div>
      
      <button id="so-btn" style="width:100%; padding:11px; background:none; border:1px solid #ccc; border-radius:2px; cursor:pointer; font-weight:600; color:#d32f2f; font-size:0.9rem; box-sizing:border-box;">Logout Account</button>
    </div>
  `;

  document.getElementById('profile-phone-form').onsubmit = async (e) => {
    e.preventDefault();
    const phoneVal = document.getElementById('user-phone-input').value.trim();
    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        email: currentUser.email,
        phone: phoneVal,
        updatedAt: new Date()
      }, { merge: true });
      alert("WhatsApp Number Saved Successfully!");
    } catch(err) {
      alert("Error saving profile: " + err.message);
    }
  };

  document.getElementById('so-btn').onclick = () => signOut(auth).then(() => location.hash = 'auth');
}

function renderAuthPage() {
  if (!appContainer) return;
  if (currentUser) {
    location.hash = 'dashboard';
    return;
  }
  let isLoginMode = true;

  function updateAuthUI() {
    appContainer.innerHTML = `
      <div style="max-width:380px; margin:40px auto; background:#fff; padding:24px; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.1); font-family:sans-serif;">
        <h3 style="margin:0 0 16px 0; text-align:center;">${isLoginMode ? 'Login' : 'Create Account'}</h3>
        <form id="auth-form">
          <input type="email" id="auth-email" placeholder="Email Address" required style="width:100%; padding:10px; margin-bottom:12px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;"/>
          <input type="password" id="auth-password" placeholder="Password" required style="width:100%; padding:10px; margin-bottom:16px; border:1px solid #ccc; border-radius:4px; box-sizing:border-box;"/>
          <button type="submit" style="width:100%; padding:10px; background:#2874f0; color:#fff; font-weight:700; border:none; border-radius:2px; cursor:pointer;">${isLoginMode ? 'Login' : 'Register'}</button>
        </form>
        <p style="text-align:center; margin:16px 0 0 0; font-size:0.85rem; color:#666;">
          ${isLoginMode ? "Don't have an account?" : "Already registered?"}
          <a href="#" id="auth-toggle" style="color:#2874f0; text-decoration:none; font-weight:600;">${isLoginMode ? 'Sign Up' : 'Log In'}</a>
        </p>
      </div>
    `;

    document.getElementById('auth-toggle').onclick = (e) => {
      e.preventDefault();
      isLoginMode = !isLoginMode;
      updateAuthUI();
    };

    document.getElementById('auth-form').onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      try {
        if (isLoginMode) {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
        location.hash = 'dashboard';
      } catch(err) {
        alert(err.message);
      }
    };
  }

  updateAuthUI();
}

updateCartBadge();
