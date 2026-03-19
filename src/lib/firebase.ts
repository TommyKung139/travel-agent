import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBX3EwvRMeIl89NedGt16Plni_Or95VGgw",
  authDomain: "travelagent-d5c61.firebaseapp.com",
  projectId: "travelagent-d5c61",
  storageBucket: "travelagent-d5c61.firebasestorage.app",
  messagingSenderId: "829494089725",
  appId: "1:829494089725:web:ec204ba306ce74c95fab94",
  measurementId: "G-ZEZG3D06RK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
