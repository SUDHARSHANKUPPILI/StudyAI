import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBYACaPnDmTS4WyqdZquul_axlbhK21F3I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "study-ai-d6ec8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "study-ai-d6ec8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "study-ai-d6ec8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "135432428133",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:135432428133:web:8705f15f80a2a63740448c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VQKHSEKM3E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
