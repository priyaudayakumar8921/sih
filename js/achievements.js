import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        await loadAchievements(profileData);
    });
});

async function loadAchievements(profileData) {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    try {
        const studentSkills = profileData.skills || {};
        const skillValues = Object.values(studentSkills);
        const readiness = profileData.readiness || 0;
        
        container.innerHTML = '';
        
        let hasAchievements = false;

        // Auto-generate achievements based on stats
        if (readiness >= 80) {
            hasAchievements = true;
            addAchievementCard(container, "Elite Readiness", "Achieved 80%+ Overall Readiness Score", "fa-solid fa-crown", "var(--accent-gold, #d4af37)");
        }
        
        if (skillValues.some(v => v >= 90)) {
            hasAchievements = true;
            addAchievementCard(container, "Mastery", "Achieved 90%+ in at least one technical skill", "fa-solid fa-star", "var(--success)");
        }

        // Fetch from portfolio as well
        const q = query(collection(db, "students", currentUser.uid, "portfolio"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            hasAchievements = true;
            
            const dateStr = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString() : 'Unknown';
            addAchievementCard(container, data.title, `Uploaded to portfolio on ${dateStr}`, "fa-solid fa-medal", "var(--accent-blue)");
        });

        if (!hasAchievements) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fa-solid fa-trophy text-secondary" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p class="text-secondary">Keep learning and completing assessments to unlock achievements!</p>
                </div>
            `;
        }
    } catch (e) {
        console.error("Error loading achievements:", e);
        container.innerHTML = '<p class="text-danger p-4">Error loading achievements.</p>';
    }
}

function addAchievementCard(container, title, desc, icon, color) {
    const card = document.createElement('div');
    card.className = 'cert-card'; 
    
    card.innerHTML = `
        <div class="cert-icon"><i class="${icon}" style="color: ${color}; font-size: 1.5rem;"></i></div>
        <div class="cert-info">
            <h3>${title}</h3>
            <p>${desc}</p>
        </div>
        <div class="verified-badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">
            <i class="fa-solid fa-check"></i> Unlocked
        </div>
    `;
    
    container.appendChild(card);
}
