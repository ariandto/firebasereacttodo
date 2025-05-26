// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";



const firebaseConfig = {
  apiKey: "AIzaSyCtEIrS_G5FccJh1KSWHCdqOhqZTkvuimc",
  authDomain: "tdproject-b005c.firebaseapp.com",
  projectId: "tdproject-b005c",
  storageBucket: "tdproject-b005c.firebasestorage.app",
  messagingSenderId: "680502796100",
  appId: "1:680502796100:web:0cb2686976c4fb05698111",
  measurementId: "G-KSPHJE07FH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const storage = getStorage(app);