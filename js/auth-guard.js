import { db } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

/**
 * Bypasses Firebase Auth and relies on a URL parameter (?uid=xxx) passed from the main project.
 * If no uid is provided, it gracefully falls back to the demo user.
 * @param {Function} callback - Called with (user, profileData) when data is loaded
 */
export async function requireAuth(callback) {
    try {
        // 1. Check URL for passed user ID and name (e.g., student-home.html?uid=12345&name=Aman)
        const urlParams = new URLSearchParams(window.location.search);
        let targetUid = urlParams.get('uid');
        let targetName = urlParams.get('name');
        let isDemo = false;

        // 2. If no ID is passed, default to the demo user so the portal doesn't break during the presentation
        if (!targetUid) {
            console.log("No uid passed in URL. Falling back to Demo User for seamless entry.");
            targetUid = "demo-user-123";
            targetName = "Student";
            isDemo = true;
        }

        // 3. Fetch the user profile from Firestore
        const docRef = doc(db, "students", targetUid);
        let docSnap = await getDoc(docRef);
        
        // 4. Create a mock user object to satisfy the rest of the application's JS
        const mockUser = { 
            uid: targetUid, 
            email: isDemo ? "demo@example.com" : "student@ansora.com", 
            displayName: targetName || "Student" 
        };

        if (!docSnap.exists()) {
            console.log("New user detected, creating default profile in Firestore...");
            const defaultProfile = {
                name: mockUser.displayName,
                email: mockUser.email,
                targetRole: "fullstack",
                readiness: 0,
                onboardingComplete: false,
                skills: {},
                breakdown: []
            };
            await setDoc(docRef, defaultProfile);
            callback(mockUser, defaultProfile);
        } else {
            callback(mockUser, docSnap.data());
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        alert("Failed to load user profile. Check console for details.");
    }
}
