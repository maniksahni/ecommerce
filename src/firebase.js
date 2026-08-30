import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIejOcangE6DzqzW0xrwHDFSMHwAboCt4",
  authDomain: "the-shivara-group-86c9c.firebaseapp.com",
  projectId: "the-shivara-group-86c9c",
  storageBucket: "the-shivara-group-86c9c.firebasestorage.app",
  messagingSenderId: "662735113847",
  appId: "1:662735113847:web:3130e23827f123fc0c4072",
  measurementId: "G-Z7X7HLK8JZ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
