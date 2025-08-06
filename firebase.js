// Import necessary functions from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- FIREBASE CONFIGURATION ---
// These global variables are provided by the environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let db, auth;

if (firebaseConfig) {
    try {
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        setLogLevel('debug'); // Enable detailed logging for debugging
    } catch (e) {
        console.error("Error initializing Firebase:", e);
        // The main app.js will handle showing an error to the user
    }
}

// Export the initialized services
export { db, auth, onAuthStateChanged, signInAnonymously, signInWithCustomToken };