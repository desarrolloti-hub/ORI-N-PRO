// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDK-Fy3Q9o0S3B80nsS8giLGVIkwEDSweY",
  authDomain: "orienpro.firebaseapp.com",
  projectId: "orienpro",
  storageBucket: "orienpro.firebasestorage.app",
  messagingSenderId: "531203897612",
  appId: "1:531203897612:web:351af87b4a6b727c183129",
  measurementId: "G-S2E31E3Z96"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);