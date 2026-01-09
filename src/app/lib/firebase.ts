// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyALi_65ABX4PWDPiMsm10jqC8rNP1RQ7vI",
  authDomain: "cahmmal.firebaseapp.com",
  projectId: "cahmmal",
  storageBucket: "cahmmal.firebasestorage.app",
  messagingSenderId: "1021975684270",
  appId: "1:1021975684270:web:c606258d0f4c74c848793f",
  measurementId: "G-6VWJEDM1V3"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
