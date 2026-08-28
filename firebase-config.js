import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc,
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Admin Email Define
const ADMIN_EMAIL = "admin@arcanix.com"; 

// Helper Function: Check Admin Status
const isUserAdmin = (user) => {
  return user && user.email === ADMIN_EMAIL;
};

// Exports
export { 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  ADMIN_EMAIL,
  isUserAdmin,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc
};
