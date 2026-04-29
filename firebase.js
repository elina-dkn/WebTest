import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCMl45H7VSjCIF9rRpSsHJZQv27YRy-X4U",
  authDomain: "gymtracker-dd5f3.firebaseapp.com",
  projectId: "gymtracker-dd5f3",
  storageBucket: "gymtracker-dd5f3.firebasestorage.app",
  messagingSenderId: "275994294747",
  appId: "1:275994294747:web:a66e66ea27b9cda2b6cffe"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);