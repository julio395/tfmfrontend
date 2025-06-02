import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, getBytes } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, where, setDoc, deleteDoc } from "firebase/firestore";

// Configuración directa (rellena con tus datos reales de Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyA-iH7DL6zz_k2KtQO3xHdiTvpYQqbPc6U",
    authDomain: "main-ba97c.firebaseapp.com",
    databaseURL: "https://main-ba97c-default-rtdb.firebaseio.com",
    projectId: "main-ba97c",
    storageBucket: "main-ba97c.appspot.com",
    messagingSenderId: "467593473696",
    appId: "1:467593473696:web:a0aa3cfbcd1a80741ca3c5",
    measurementId: "G-K2MWFCQWEZ"
  };

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);


