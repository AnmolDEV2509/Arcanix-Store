import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc,
  doc,
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPIOo14SFduC4ePsgPv3NzWEIRTNUEH40",
  authDomain: "arcanix-store.firebaseapp.com",
  databaseURL: "https://arcanix-store-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "arcanix-store",
  storageBucket: "arcanix-store.firebasestorage.app",
  messagingSenderId: "863804947506",
  appId: "1:863804947506:web:8743d5d1a3f9086260102b"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentSeller = null;

// Auth State Monitor
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentSeller = user;
    document.getElementById("loginCard").classList.add("hidden");
    document.getElementById("dashboardSection").classList.remove("hidden");
    document.getElementById("userInfo").classList.remove("hidden");
    document.getElementById("sellerEmailDisplay").innerText = user.email;
    
    loadProducts();
    loadSellerReports(user.uid);
  } else {
    currentSeller = null;
    document.getElementById("loginCard").classList.remove("hidden");
    document.getElementById("dashboardSection").classList.add("hidden");
    document.getElementById("userInfo").classList.add("hidden");
  }
});

// 1. Seller Login Handler
document.getElementById("sellerLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("sellerEmail").value;
  const password = document.getElementById("sellerPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Seller Login Successful!");
  } catch (error) {
    alert("Login Failed: " + error.message);
  }
});

// 2. Seller Registration Handler
document.getElementById("sellerRegisterForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPassword").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "sellers", user.uid), {
      sellerId: user.uid,
      name: name,
      email: email,
      phone: phone,
      createdAt: serverTimestamp()
    });

    alert("Seller Account Created Successfully!");
  } catch (error) {
    alert("Registration Failed: " + error.message);
  }
});

// Logout Function
window.logoutSeller = () => {
  signOut(auth);
};

// 3. Fetch Active Products for Select Dropdown (Fixed Undefined Bug)
async function loadProducts() {
  const select = document.getElementById("productSelect");
  select.innerHTML = '<option value="">Select Product...</option>';

  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    
    if (querySnapshot.empty) {
      console.log("No products found in database.");
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const p = docSnap.data();
      
      // Multi-property check to prevent 'undefined'
      const productName = p.name || p.title || p.productName || p.product_name || "Unnamed Product";
      const productPrice = p.price !== undefined ? p.price : (p.productPrice || 0);

      const opt = document.createElement("option");
      opt.value = productName;
      opt.dataset.id = docSnap.id;
      opt.textContent = `${productName} - ₹${productPrice}`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// 4. Submit Customer Lead / Report to Admin
document.getElementById("customerReportForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentSeller) return;

  const leadData = {
    sellerId: currentSeller.uid,
    sellerEmail: currentSeller.email,
    customerName: document.getElementById("custName").value.trim(),
    customerPhone: document.getElementById("custPhone").value.trim(),
    customerEmail: document.getElementById("custEmail").value.trim(),
    productName: document.getElementById("productSelect").value,
    quantity: parseInt(document.getElementById("custQuantity").value),
    notes: document.getElementById("custNotes").value.trim(),
    status: "pending",
    commissionAmount: 0,
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "customer_reports"), leadData);
    alert("Customer report sent to Admin successfully!");
    document.getElementById("customerReportForm").reset();
    loadSellerReports(currentSeller.uid);
  } catch (error) {
    console.error("Error submitting report:", error);
    alert("Submission Failed: " + error.message);
  }
});

// 5. Load Reported Customers for Current Seller
async function loadSellerReports(sellerId) {
  const tbody = document.getElementById("reportsTableBody");
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading...</td></tr>';

  try {
    const q = query(
      collection(db, "customer_reports"),
      where("sellerId", "==", sellerId)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No reports submitted yet.</td></tr>';
      return;
    }

    tbody.innerHTML = "";
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const dateStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';
      
      let badgeClass = 'badge-pending';
      if (data.status === 'approved') badgeClass = 'badge-approved';
      if (data.status === 'rejected') badgeClass = 'badge-rejected';

      const row = `
        <tr>
          <td>${dateStr}</td>
          <td><strong>${data.customerName}</strong><br><small>${data.customerPhone}</small></td>
          <td>${data.productName} (x${data.quantity})</td>
          <td><span class="badge ${badgeClass}">${data.status.toUpperCase()}</span></td>
          <td>${data.commissionAmount ? '₹' + data.commissionAmount : 'Pending Verification'}</td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error("Error fetching seller reports:", err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Failed to load data.</td></tr>';
  }
}
