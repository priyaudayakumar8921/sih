// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDKCs2W0KEcsPTiwdw1eHLdtq5zJQi4cmI",
    authDomain: "ansora-27fe4.firebaseapp.com",
    projectId: "ansora-27fe4",
    storageBucket: "ansora-27fe4.firebasestorage.app",
    messagingSenderId: "230795678686",
    appId: "1:230795678686:web:06f0ccd7b8717ac13ac34f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
