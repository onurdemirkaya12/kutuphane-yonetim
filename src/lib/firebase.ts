import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVPxIB-_dA2agEq4NAceH3v3TBKKNKWZ4",
  authDomain: "kutuphane-yonetim-3470c.firebaseapp.com",
  projectId: "kutuphane-yonetim-3470c",
  storageBucket: "kutuphane-yonetim-3470c.firebasestorage.app",
  messagingSenderId: "160406416748",
  appId: "1:160406416748:web:db0b9153ff3a0420341749",
  measurementId: "G-XJLF680ZB1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
