import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyD7XNvDm6HMZAbkcx3tI4oeWoX1GAE33aU",
    authDomain: "nada-pirthday.firebaseapp.com",
    projectId: "nada-pirthday",
    storageBucket: "nada-pirthday.firebasestorage.app",
    messagingSenderId: "247523373748",
    appId: "1:247523373748:web:2597e85896b4fa05ce5de1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
// Safely initialize messaging handling potential errors in environments without SW support
let messaging = null;
try {
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
        messaging = getMessaging(app);
    }
} catch (error) {
    console.warn("Firebase Messaging failed to initialize (likely due to insecure context or missing SW support):", error);
}

export { messaging };
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
