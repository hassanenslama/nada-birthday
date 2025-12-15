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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export default app;
