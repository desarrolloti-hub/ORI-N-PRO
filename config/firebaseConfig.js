// src/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDK-Fy3Q9o0S3B80nsS8giLGVIkwEDSweY",
  authDomain: "orienpro.firebaseapp.com",
  projectId: "orienpro",
  storageBucket: "orienpro.firebasestorage.app",
  messagingSenderId: "531203897612",
  appId: "1:531203897612:web:351af87b4a6b727c183129",
  measurementId: "G-S2E31E3Z96"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);

export { db, auth, app, analytics, storage };