import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBIejOcangE6DzqzW0xrwHDFSMHwAboCt4",
  authDomain: "the-shivara-group-86c9c.firebaseapp.com",
  projectId: "the-shivara-group-86c9c",
  storageBucket: "the-shivara-group-86c9c.firebasestorage.app",
  messagingSenderId: "662735113847",
  appId: "1:662735113847:web:3130e23827f123fc0c4072",
  measurementId: "G-Z7X7HLK8JZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export database & storage
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
