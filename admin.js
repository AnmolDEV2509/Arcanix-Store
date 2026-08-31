import { db, auth, onAuthStateChanged, ADMIN_EMAIL } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let adminUpiConfig = { upiId: 'merchant@upi', merchantName: 'ArcanixPlus' };
let editingProductId = null;

const adminContainer = document.getElementById('admin-view');

// Auth Guard Check
onAuthStateChanged(auth, async (user) => {
  if (user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    await loadAdminPaymentSettings();
    await renderAdminUI();
  } else {
    adminContainer.innerHTML = `
      <div class="card" style="text-align:center; padding: 40px;">
        <h2 style="color: #d32f2f; margin-bottom: 8px;">Access Denied</h2>
        <p style="color: #666; margin-bottom: 16px;">Only authorized admin (${ADMIN_EMAIL}) can access this CMS Panel.</p>
        <a href="index.html#auth" style="color: #2874f0; font-weight: 700; text-decoration: none;">Login with Admin Account</a>
      </div>
    `;
  }
});

// Load UPI Settings
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

// Render Admin Panel Interface
async function renderAdminUI() {
  adminContainer.innerHTML = `
    <!-- 1. UPI Payment Config -->
    <div class="card">
      <div class="card-title">1. Payment QR & UPI Settings</div>
      <form id="admin-payment-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Admin UPI ID (e.g. name@upi)</label>
            <input type="text" id="qr-upi-id" required value="${adminUpiConfig.upiId}" placeholder="yourname@upi"/>
          </div>
          <div class="form-group">
            <label>Merchant / Business Name</label>
            <input type="text" id="qr-merchant-name" required value="${adminUpiConfig.merchantName}" placeholder="Arcanix Store"/>
          </div>
        </div>
        <button type="submit" id="qr-save-btn" class="btn btn-primary" style="margin-top:8px;">Save Payment Settings</button>
      </form>
    </div>

    <!-- 2. Banner & Category Forms -->
    <div style="display: flex; flex-wrap: wrap; gap: 16px;">
      <div class="card" style="flex: 1 1 300px;">
        <div class="card-title">2. Add Hero Banner</div>
        <form id="admin-banner-form">
          <div class="form-group"><label>Title</label><input type="text" id="b-title" required placeholder="FESTIVE SALE"/></div>
          <div class="form-group"><label>Subtitle</label><input type="text" id="b-subtitle" placeholder="Up to 80% OFF"/></div>
          <div class="form-group"><label>Image URL</label><input type="url" id="b-image" required placeholder="https://..."/></div>
          <button type="submit" class="btn btn-orange" style="width: 100%; margin-top:6px;">Save Banner</button>
        </form>
      </div>

      <div class="card" style="flex: 1 1 300px;">
        <div class="card-title">3. Add New Category</div>
        <form id="admin-cat-form">
          <div class="form-group"><label>Category Name</label><input type="text" id="c-name" required placeholder="Electronics"/></div>
          <button type="submit" id="c-submit-btn" class="btn btn-primary" style="width: 100%; margin-top:6px;">Save Category</button>
        </form>
      </div>
    </div>

    <!-- 3. Product Manager Form (S to 7XL Checkboxes) -->
    <div class="card">
      <div class="card-title" id="prod-form-heading">4. Publish / Edit Product</div>
      <form id="seller-add-form">
        <div class="form-grid">
          <div class="form-group"><label>Title</label><input type="text" id="p-title" required placeholder="T-Shirt / Shoes"/></div>
          <div class="form-group">
            <label>Select Category</label>
            <select id="p-category">
              <option value="General">General</option>
            </select>
          </div>
          <div class="form-group"><label>Price (₹)</label><input type="number" step="0.01" id="p-price" required placeholder="499"/></div>
          <div class="form-group"><label>Offer Tag</label><input type="text" id="p-tag" placeholder="Hot Deal"/></div>
          
          <!-- MULTI SIZE SELECTION BOX (S to 7XL) -->
          <div class="form-group full" style="background: #f8f9fa; padding: 12px; border-radius: 6px; border: 1px solid #e0e0e0;">
            <label style="color:#2874f0; font-weight:700; margin-bottom:8px; display:block;">Select Available Sizes (S to 7XL):</label>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;" id="size-checkbox-group">
              <label style="cursor:pointer; font-weight:600;"><input type="checkbox" name="p-size-opt" value="S"> S</label>
              <label style="cursor:pointer; font-weight:600;"><input type="checkbox" name="p-size-opt" value="M"> M</label>
              <label style="cursor:pointer; font-weight:600;"><input type="checkbox" name="p-size-opt" value="L"> L</label>
              <label style="cursor:pointer; font-weight:600;"><input type="checkbox" name="p-size-opt" value="XL"> XL</label>
              <label style="cursor:pointer; font-weight:600;"><input type="checkbox" name="p-size-opt" value="2XL"> 2XL</label>
              <label style="cursor:pointer; font-weight:600;"><input type="checkbox" name="p-size-opt" value="3XL"> 3XL</label>
              <label style="cursor:pointer; font-weight:600;"><input type="checkbox" name="p-size-opt" value="4XL"> 4XL</label>
              <label style="cursor:pointer; font-weight:600;"><input type="checkbox" name="p-size-opt" value="5XL"> 5XL</label>
              <label style="cursor:pointer; font-weight:600;"><input type="checkbox" name="p-size-opt" value="6XL"> 6XL</label>
              <label style="cursor:pointer; font-weight:600;"><input type="checkbox" name="p-size-opt" value="7XL"> 7XL</label>
            </div>
          </div>

          <div class="form-group full"><label>Image URL</label><input type="url" id="p-image" required placeholder="https://..."/></div>
          <div class="form-group full"><label>Description</label><textarea id="p-desc" rows="3" required placeholder="Product details..."></textarea></div>
        </div>
        <div style="display:flex; gap:10px; margin-top:12px;">
          <button type="submit" id="prod-submit-btn" class="btn btn-orange" style="flex:1;">PUBLISH PRODUCT</button>
          <button type="button" id="cancel-edit-btn" class="btn btn-secondary" style="display:none;" onclick="resetProductForm()">CANCEL EDIT</button>
        </div>
      </form>
    </div>

    <!-- 4. Live Customer Orders -->
    <div class="card">
      <div class="card-title">5. Live Customer Orders</div>
      <div id="admin-orders-list" style="overflow-x: auto;">Loading Orders...</div>
    </div>

    <!-- 5. Sub-Admin / Seller Customer Reports -->
    <div class="card">
      <div class="card-title" style="color:#2e7d32;">6. Sub-Admin / Seller Customer Reports & Commission Approval</div>
      <div id="admin-seller-reports-list" style="overflow-x: auto;">Loading Seller Reports...</div>
    </div>

    <!-- 6. Categories & Banners Table -->
    <div style="display: flex; flex-wrap: wrap; gap: 16px;">
      <div class="card" style="flex: 1 1 300px;">
        <div class="card-title">Manage Categories</div>
        <div id="admin-categories-list" style="overflow-x: auto;"></div>
      </div>
      <div class="card" style="flex: 1 1 400px;">
        <div class="card-title">Manage Live Banners</div>
        <div id="admin-banners-list" style="overflow-x: auto;"></div>
      </div>
    </div>

    <!-- 7. Live Products Table -->
    <div class="card">
      <div class="card-title">Manage Live Products</div>
      <div id="admin-items-list" style="overflow-x: auto;"></div>
    </div>
  `;

  bindEvents();
  await loadCategoryDropdown();
  loadOrders();
  loadSellerReportsForAdmin();
  loadCategoriesTable();
  loadBannersTable();
  loadProductsTable();
}

// Bind Events Logic
function bindEvents() {
  const paymentForm = document.getElementById('admin-payment-form');
  if (paymentForm) {
    paymentForm.onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('qr-save-btn');
      btn.disabled = true;
      try {
        const upiId = document.getElementById('qr-upi-id').value.trim();
        const merchantName = document.getElementById('qr-merchant-name').value.trim();
        await setDoc(doc(db, "settings", "payment"), { upiId, merchantName, updatedAt: new Date() });
        adminUpiConfig = { upiId, merchantName };
        alert("UPI Settings Saved!");
      } catch(err) { alert("Error: " + err.message); }
      finally { btn.disabled = false; }
    };
  }

  const catForm = document.getElementById('admin-cat-form');
  if (catForm) {
    catForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const name = document.getElementById('c-name').value.trim();
        await addDoc(collection(db, "categories"), { name, createdAt: new Date() });
        alert(`Category "${name}" added!`);
        catForm.reset();
        await loadCategoryDropdown();
        loadCategoriesTable();
      } catch(err) { alert("Error: " + err.message); }
    };
  }

  const bannerForm = document.getElementById('admin-banner-form');
  if (bannerForm) {
    bannerForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        await addDoc(collection(db, "banners"), {
          title: document.getElementById('b-title').value,
          subtitle: document.getElementById('b-subtitle').value,
          imageUrl: document.getElementById('b-image').value,
          createdAt: new Date()
        });
        alert("Banner Added!");
        bannerForm.reset();
        loadBannersTable();
      } catch(err) { alert("Error: " + err.message); }
    };
  }

  // Product Add / Update Handler
  const prodForm = document.getElementById('seller-add-form');
  if (prodForm) {
    prodForm.onsubmit = async (e) => {
      e.preventDefault();
      
      // Selected Size Checkboxes Extraction
      const selectedSizes = Array.from(document.querySelectorAll('input[name="p-size-opt"]:checked'))
                                 .map(cb => cb.value)
                                 .join(',');

      const payload = {
        title: document.getElementById('p-title').value,
        category: document.getElementById('p-category').value,
        price: parseFloat(document.getElementById('p-price').value),
        tag: document.getElementById('p-tag').value || '',
        size: selectedSizes, // Stores comma-separated string e.g. "S,M,XL,7XL"
        imageUrl: document.getElementById('p-image').value,
        description: document.getElementById('p-desc').value,
        updatedAt: new Date()
      };

      try {
        if (editingProductId) {
          await updateDoc(doc(db, "products", editingProductId), payload);
          alert("Product Updated Successfully!");
        } else {
          payload.createdAt = new Date();
          await addDoc(collection(db, "products"), payload);
          alert("Product Published Successfully!");
        }
        window.resetProductForm();
        loadProductsTable();
      } catch(err) { 
        console.error("Firestore Error:", err);
        alert("Error: " + err.message); 
      }
    };
  }
}

// Global Helper Functions
window.resetProductForm = () => {
  editingProductId = null;
  const form = document.getElementById('seller-add-form');
  if (form) form.reset();
  
  // Uncheck all size checkboxes
  document.querySelectorAll('input[name="p-size-opt"]').forEach(cb => cb.checked = false);

  document.getElementById('prod-form-heading').innerText = "4. Publish / Edit Product";
  document.getElementById('prod-submit-btn').innerText = "PUBLISH PRODUCT";
  document.getElementById('cancel-edit-btn').style.display = "none";
};

window.startEditProduct = async (id) => {
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) return;
    const data = snap.data();
    editingProductId = id;

    document.getElementById('prod-form-heading').innerText = "Edit Product";
    document.getElementById('prod-submit-btn').innerText = "UPDATE PRODUCT";
    document.getElementById('cancel-edit-btn').style.display = "inline-block";

    document.getElementById('p-title').value = data.title || '';
    document.getElementById('p-category').value = data.category || 'General';
    document.getElementById('p-price').value = data.price || 0;
    document.getElementById('p-tag').value = data.tag || '';
    document.getElementById('p-image').value = data.imageUrl || '';
    document.getElementById('p-desc').value = data.description || '';

    // Auto-check saved sizes
    const existingSizes = (data.size || '').split(',');
    document.querySelectorAll('input[name="p-size-opt"]').forEach(cb => {
      cb.checked = existingSizes.includes(cb.value);
    });

    window.scrollTo({ top: document.getElementById('seller-add-form').offsetTop - 20, behavior: 'smooth' });
  } catch(err) { alert("Error loading product: " + err.message); }
};

window.deleteItem = async (colName, id) => {
  if (confirm(`Delete item from ${colName}?`)) {
    try {
      await deleteDoc(doc(db, colName, id));
      alert("Deleted!");
      if (colName === 'categories') { loadCategoriesTable(); await loadCategoryDropdown(); }
      if (colName === 'banners') loadBannersTable();
      if (colName === 'products') loadProductsTable();
      if (colName === 'customer_reports') loadSellerReportsForAdmin();
    } catch(err) { alert("Error deleting: " + err.message); }
  }
};

window.updateOrderStatus = async (orderId, newStatus) => {
  try {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus, updatedAt: new Date() });
    alert(`Status updated to "${newStatus}"!`);
    loadOrders();
  } catch(err) { alert("Error updating status: " + err.message); }
};

window.updateSellerReport = async (reportId) => {
  const statusSelect = document.getElementById(`report-status-${reportId}`);
  const commissionInput = document.getElementById(`report-comm-${reportId}`);

  const newStatus = statusSelect.value;
  const commissionAmount = parseFloat(commissionInput.value) || 0;

  try {
    await updateDoc(doc(db, "customer_reports", reportId), {
      status: newStatus,
      commissionAmount: commissionAmount,
      updatedAt: new Date()
    });
    alert(`Seller Lead Status set to "${newStatus}" with Commission ₹${commissionAmount}!`);
    loadSellerReportsForAdmin();
  } catch (err) {
    alert("Error updating report: " + err.message);
  }
};

async function loadSellerReportsForAdmin() {
  const container = document.getElementById('admin-seller-reports-list');
  if (!container) return;
  try {
    const q = query(collection(db, "customer_reports"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = '<p style="color:#666;">No seller customer leads submitted yet.</p>';
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Seller Info</th>
            <th>Customer Request</th>
            <th>Product & Qty</th>
            <th>Notes</th>
            <th>Status & Commission</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${snap.docs.map(d => {
            const r = d.data();
            const status = r.status || 'pending';
            const comm = r.commissionAmount || 0;

            return `
              <tr>
                <td>
                  <small style="color:#2874f0; font-weight:bold;">${r.sellerEmail || 'N/A'}</small><br/>
                  <small style="color:#777;">ID: ${r.sellerId ? r.sellerId.substring(0, 6) : ''}...</small>
                </td>
                <td>
                  <b>${r.customerName || 'N/A'}</b><br/>
                  <small style="color:#333;">📞 ${r.customerPhone || 'N/A'}</small><br/>
                  <small style="color:#777;">${r.customerEmail || ''}</small>
                </td>
                <td>
                  <b>${r.productName || 'N/A'}</b><br/>
                  <small>Qty: <b>${r.quantity || 1}</b></small>
                </td>
                <td><small style="color:#555;">${r.notes || 'No notes'}</small></td>
                <td>
                  <select id="report-status-${d.id}" style="padding: 4px; margin-bottom: 4px;">
                    <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="approved" ${status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="rejected" ${status === 'rejected' ? 'selected' : ''}>Rejected</option>
                  </select>
                  <div style="display:flex; align-items:center; gap:2px;">
                    <span style="font-size:12px;">₹</span>
                    <input type="number" id="report-comm-${d.id}" value="${comm}" placeholder="Commission" style="width: 80px; padding: 3px; font-size: 12px;"/>
                  </div>
                </td>
                <td>
                  <button class="btn btn-success" style="padding: 4px 8px; font-size: 11px; margin-bottom: 4px; width: 100%;" onclick="updateSellerReport('${d.id}')">Save</button>
                  <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px; width: 100%;" onclick="deleteItem('customer_reports', '${d.id}')">Delete</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<p style="color:#d32f2f;">Failed to load seller reports: ${err.message}</p>`;
  }
}

window.sendWhatsAppNotice = (encodedOrderData) => {
  try {
    const orderData = JSON.parse(decodeURIComponent(encodedOrderData));

    const phone = orderData.customerPhone;
    if (!phone || phone === 'N/A' || phone === 'undefined') {
      alert("Customer phone number not available!");
      return;
    }

    let formattedPhone = phone.toString().replace(/\D/g, '');
    if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;

    const itemsFormatted = (orderData.items || []).map((item, idx) => {
      const qty = item.quantity || 1;
      const price = item.price || 0;
      const itemTotal = price * qty;
      return `  ${idx + 1}. *${item.title}*\n     └ Qty: ${qty} x ₹${price} = ₹${itemTotal.toFixed(2)}`;
    }).join('\n');

    const formattedDate = orderData.createdAt 
      ? new Date(orderData.createdAt).toLocaleString('en-IN') 
      : new Date().toLocaleString('en-IN');

    const statusBadge = orderData.status === 'Accepted' ? '✅ ACCEPTED & CONFIRMED' : `⏳ ${orderData.status || 'Pending'}`;

    const message = `🎉 *ORDER UPDATE - ARCANIX PLUS* 🎉
=================================
📌 *Order Status:* ${statusBadge}
🆔 *Order ID:* #${orderData.id.substring(0, 8).toUpperCase()}
📅 *Date & Time:* ${formattedDate}

👤 *CUSTOMER DETAILS:*
• *Name:* ${orderData.customerName || 'N/A'}
• *Phone:* ${orderData.customerPhone || 'N/A'}
• *Email:* ${orderData.customerEmail || 'N/A'}
🏠 *Delivery Address:*
${orderData.address || 'N/A'}

=================================
🛒 *ORDERED ITEMS (${orderData.items ? orderData.items.length : 0}):*
${itemsFormatted}

=================================
💰 *PAYMENT & BILLING SUMMARY:*
• *Payment Mode:* ${orderData.paymentMode || 'UPI'}
• *Delivery Charges:* FREE
💳 *TOTAL AMOUNT:* *₹${Number(orderData.totalAmount || 0).toFixed(2)}*

=================================
✨ *Note:* Thank you for shopping with us! Aapka order accept kar liya gaya hai aur delivery process start kar di gayi hai.

📞 *Customer Support:* Direct reply to this message for assistance.`;

    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMsg}`, '_blank');
  } catch (err) {
    console.error("WhatsApp Message Error:", err);
    alert("WhatsApp message error: " + err.message);
  }
};

async function loadCategoryDropdown() {
  const select = document.getElementById('p-category');
  if (!select) return;
  try {
    const snap = await getDocs(collection(db, "categories"));
    select.innerHTML = '<option value="General">General</option>';
    snap.docs.forEach(d => {
      const option = document.createElement('option');
      option.value = d.data().name;
      option.textContent = d.data().name;
      select.appendChild(option);
    });
  } catch(e) {}
}

async function loadOrders() {
  const container = document.getElementById('admin-orders-list');
  if (!container) return;
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) { container.innerHTML = '<p style="color:#666;">No orders found.</p>'; return; }
    container.innerHTML = `
      <table>
        <thead><tr><th>Order Details</th><th>Customer</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          ${snap.docs.map(doc => {
            const o = doc.data();
            const items = (o.items || []).map(i => `${i.title} (x${i.quantity || 1})`).join('<br/>');
            const status = o.status || 'Pending';
            const customerPhone = o.customerPhone || o.phone || 'N/A';

            const orderPayload = {
              id: doc.id,
              customerName: o.customerName || 'N/A',
              customerPhone: customerPhone,
              customerEmail: o.customerEmail || 'N/A',
              address: o.address || 'N/A',
              paymentMode: o.paymentMode || 'UPI',
              items: o.items || [],
              totalAmount: o.totalAmount || 0,
              status: status,
              createdAt: o.createdAt ? (o.createdAt.seconds ? o.createdAt.seconds * 1000 : o.createdAt) : null
            };

            const encodedOrderPayload = encodeURIComponent(JSON.stringify(orderPayload));

            return `
              <tr>
                <td><b>#${doc.id.substring(0,8).toUpperCase()}</b><br/><small style="color:#555;">${items}</small></td>
                <td>
                  <b>${o.customerName || 'N/A'}</b><br/>
                  <small>${o.customerEmail || ''}</small><br/>
                  <small style="color:#2874f0; font-weight:600;">${customerPhone}</small><br/>
                  <small style="color:#777;">${o.address || ''}</small>
                </td>
                <td><b>₹${(o.totalAmount || 0).toFixed(2)}</b><br/><small>${o.paymentMode || ''}</small></td>
                <td><span class="status-badge status-${status}">${status}</span></td>
                <td>
                  <select onchange="updateOrderStatus('${doc.id}', this.value)" style="width: 100%; margin-bottom: 6px; padding: 4px;">
                    <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Accepted" ${status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                    <option value="Processing" ${status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                  </select>
                  
                  ${status === 'Accepted' ? `
                    <button class="btn btn-orange" style="width: 100%; font-size: 11px; padding: 6px 8px; cursor: pointer; border: none; border-radius: 4px; background: #25D366; color: white; font-weight: bold;" 
                      onclick="sendWhatsAppNotice('${encodedOrderPayload}')">
                      📲 Send WhatsApp
                    </button>
                  ` : ''}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch(e) { container.innerHTML = '<p style="color:#d32f2f;">Failed to load orders.</p>'; }
}

async function loadCategoriesTable() {
  const container = document.getElementById('admin-categories-list');
  if (!container) return;
  try {
    const snap = await getDocs(collection(db, "categories"));
    if (snap.empty) { container.innerHTML = '<p style="color:#888;">No categories.</p>'; return; }
    container.innerHTML = `
      <table>
        <thead><tr><th>Category</th><th>Action</th></tr></thead>
        <tbody>
          ${snap.docs.map(d => `<tr><td><b>${d.data().name}</b></td><td><button class="btn btn-danger" onclick="deleteItem('categories', '${d.id}')">Delete</button></td></tr>`).join('')}
        </tbody>
      </table>
    `;
  } catch(e) {}
}

async function loadBannersTable() {
  const container = document.getElementById('admin-banners-list');
  if (!container) return;
  try {
    const snap = await getDocs(collection(db, "banners"));
    if (snap.empty) { container.innerHTML = '<p style="color:#888;">No banners.</p>'; return; }
    container.innerHTML = `
      <table>
        <thead><tr><th>Preview</th><th>Title</th><th>Action</th></tr></thead>
        <tbody>
          ${snap.docs.map(d => `<tr><td><img src="${d.data().imageUrl}" style="width:60px; height:35px; object-fit:cover; border-radius:2px;"/></td><td><b>${d.data().title}</b></td><td><button class="btn btn-danger" onclick="deleteItem('banners', '${d.id}')">Delete</button></td></tr>`).join('')}
        </tbody>
      </table>
    `;
  } catch(e) {}
}

// Live Products Table
async function loadProductsTable() {
  const container = document.getElementById('admin-items-list');
  if (!container) return;
  try {
    const snap = await getDocs(collection(db, "products"));
    if (snap.empty) { container.innerHTML = '<p style="color:#888;">No products available.</p>'; return; }
    container.innerHTML = `
      <table>
        <thead><tr><th>Image</th><th>Title</th><th>Selected Sizes</th><th>Price</th><th>Actions</th></tr></thead>
        <tbody>
          ${snap.docs.map(d => {
            const p = d.data();
            return `
              <tr>
                <td><img src="${p.imageUrl}" style="width:36px; height:36px; object-fit:contain;"/></td>
                <td><b>${p.title}</b></td>
                <td><span style="background:#e8f0fe; color:#1a73e8; padding:2px 6px; border-radius:3px; font-weight:600; font-size:12px;">${p.size || 'No Size'}</span></td>
                <td>₹${p.price}</td>
                <td>
                  <button class="btn btn-primary" onclick="startEditProduct('${d.id}')">Edit</button>
                  <button class="btn btn-danger" onclick="deleteItem('products', '${d.id}')">Delete</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch(e) {}
}
