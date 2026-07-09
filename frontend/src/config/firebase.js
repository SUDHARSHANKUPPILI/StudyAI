import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// List of required client environment variables (Requirement 3)
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_API_BASE_URL'
];

const missingVars = REQUIRED_ENV_VARS.filter(key => {
  const val = import.meta.env[key];
  return !val || val.trim() === '' || val.startsWith('your-') || val.startsWith('replace-');
});

export const isFirebaseConfigValid = missingVars.length === 0;

let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigValid) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase Web Client initialization failed:", error);
  }
} else {
  console.warn("Firebase configuration is incomplete. Missing client variables:", missingVars);
}

export { app, auth, googleProvider };
export default app;
