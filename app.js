// Dynamic Admin UPI Link Builder with Specific App Protocols
function getUpiPayLink(total, appTarget = 'generic') {
  const upiId = encodeURIComponent(adminUpiConfig.upiId || 'merchant@upi');
  const merchantName = encodeURIComponent(adminUpiConfig.merchantName || 'ArcanixPlus');
  const amount = total.toFixed(2);
  const baseParams = `pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR`;

  switch(appTarget) {
    case 'gpay':
      return `tez://upi/pay?${baseParams}`;
    case 'phonepe':
      return `phonepe://pay?${baseParams}`;
    case 'paytm':
      return `paytmmp://pay?${baseParams}`;
    default:
      return `upi://pay?${baseParams}`;
  }
}

// CHECKOUT PAGE
async function renderCheckoutPage() {
  if (window.cart.length === 0) {
    location.hash = 'cart';
    return;
  }
  await loadAdminPaymentSettings();
  let total = window.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  let selectedApp = 'generic';
  
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
            <input type="radio" name="pay-mode" id="pay-upi" value="UPI Payment App" checked />
            <label for="pay-upi" style="font-weight:600; font-size:0.88rem; cursor:pointer; flex:1;">
              UPI App Direct (GPay, PhonePe, Paytm, etc.)
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

        <!-- Dynamic Payment Info & Direct Launch Buttons -->
        <div id="payment-details-box" style="margin-bottom:20px; padding:14px; border:1px solid #2874f0; background:#f4f8ff; border-radius:6px; text-align:center;">
          <p style="font-size:0.88rem; font-weight:600; color:#333; margin-bottom:8px;">Choose App to Open Directly:</p>
          <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-bottom:10px;">
            <button type="button" onclick="setUpiTarget('gpay')" style="padding:6px 12px; border:1px solid #2874f0; background:#fff; border-radius:4px; font-weight:600; cursor:pointer;">Google Pay</button>
            <button type="button" onclick="setUpiTarget('phonepe')" style="padding:6px 12px; border:1px solid #2874f0; background:#fff; border-radius:4px; font-weight:600; cursor:pointer;">PhonePe</button>
            <button type="button" onclick="setUpiTarget('paytm')" style="padding:6px 12px; border:1px solid #2874f0; background:#fff; border-radius:4px; font-weight:600; cursor:pointer;">Paytm</button>
            <button type="button" onclick="setUpiTarget('generic')" style="padding:6px 12px; border:1px solid #2874f0; background:#fff; border-radius:4px; font-weight:600; cursor:pointer;">Any App</button>
          </div>
          <p style="font-size:0.80rem; color:#555;">Clicking <b>PAY NOW</b> will automatically redirect to your selected UPI App with ₹${total.toFixed(2)}.</p>
        </div>

        <button type="submit" id="confirm-pay-btn" style="width: 100%; padding: 13px; background:#fb641b; color:#fff; font-weight:700; border:none; border-radius:4px; cursor:pointer; font-size:0.95rem; box-shadow:0 2px 4px rgba(0,0,0,0.15);">
          PAY NOW (₹${total.toFixed(2)})
        </button>
      </form>
    </div>
  `;

  window.setUpiTarget = (target) => {
    selectedApp = target;
    alert(`Selected App: ${target.toUpperCase()}`);
  };

  window.selectPaymentMode = (type) => {
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('active'));
    const payBox = document.getElementById('payment-details-box');
    const payBtn = document.getElementById('confirm-pay-btn');

    if (type === 'UPI') {
      document.getElementById('pay-upi').checked = true;
      document.getElementById('pay-upi').closest('.payment-option').classList.add('active');
      payBox.style.display = 'block';
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

    if (selectedPayOption.includes('UPI')) {
      // Direct Navigation for Instant App Launch
      const upiDeepLink = getUpiPayLink(total, selectedApp);
      window.location.href = upiDeepLink;
    }

    btn.disabled = true;
    btn.innerText = "Processing Order...";

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
      
      setTimeout(() => {
        location.hash = 'order-confirmation';
      }, 1000);

    } catch (err) {
      alert("Error saving order: " + err.message);
      btn.disabled = false;
      btn.innerText = `PAY NOW (₹${total.toFixed(2)})`;
    }
  };
}
