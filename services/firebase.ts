import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCI_25xkuiioPjpoZardY0g4r7wKuj-sh4",
  authDomain: "storyspark-b313.firebaseapp.com",
  projectId: "storyspark-b313",
  storageBucket: "storyspark-b313.firebasestorage.app",
  messagingSenderId: "601709247570",
  appId: "1:601709247570:web:1c5a4ab13c990120aff38b",
  measurementId: "G-PG06JNRC38",
  databaseURL: "https://storyspark-b313-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);