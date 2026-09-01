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
            console.log("No authenticated user. Bypassing auth and loading Demo Profile for Hackathon...");
            // Bypass Auth and load the seeded demo profile
            try {
                const docRef = doc(db, "students", "demo-user-123");
                let docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // Create a mock 'user' object so the rest of the app doesn't break
                    const mockUser = { uid: "demo-user-123", email: "demo@example.com", displayName: "Priya" };
                    callback(mockUser, docSnap.data());
                } else {
                    console.error("Demo profile not found in database! Please run seed.html first.");
                }
            } catch (err) {
                console.error("Error loading demo profile:", err);
            }
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
