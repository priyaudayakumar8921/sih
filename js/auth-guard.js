import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

/**
 * Ensures the user is logged in and their profile exists in Firestore.
 * If the user logs in from an external site but doesn't have a profile yet, it creates a default one.
 * @param {Function} callback - Called with (user, profileData) when authenticated
 */
export function requireAuth(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.log("No authenticated user, displaying empty state or redirecting...");
            // Optionally redirect here if you want strict enforcement:
            // window.location.href = 'https://your-main-site.com/login';
            alert("You must be logged in via the main website to view this data.");
            return;
        }

        try {
            const docRef = doc(db, "students", user.uid);
            let docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                console.log("New user detected, creating default profile in Firestore...");
                const defaultProfile = {
                    name: user.displayName || "Student",
                    email: user.email,
                    targetRole: "fullstack",
                    readiness: 0,
                    onboardingComplete: false,
                    skills: {},
                    breakdown: []
                };
                await setDoc(docRef, defaultProfile);
                callback(user, defaultProfile);
            } else {
                callback(user, docSnap.data());
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    });
}
