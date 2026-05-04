import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBkZo0vGCI_M1U-38gjrFFW3eBIKdocCmk",
    authDomain: "bistro-bliss-eb78e.firebaseapp.com",
    projectId: "bistro-bliss-eb78e",
    storageBucket: "bistro-bliss-eb78e.firebasestorage.app",
    messagingSenderId: "79608306796",
    appId: "1:79608306796:web:78570a314ee67012698c49",
    measurementId: "G-SEQVT1LBXR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
