import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        await loadProjects();
    });
});

async function loadProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    try {
        const q = query(collection(db, "students", currentUser.uid, "portfolio"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        let hasProjects = false;
        container.innerHTML = '';
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            // In a real app we might filter by data.type === 'project'
            // For now, we display all portfolio items here
            hasProjects = true;
            
            const card = document.createElement('div');
            card.className = 'cert-card'; // Reuse cert card styling from portfolio.css
            
            let imgHtml = data.imageUrl 
                ? `<img src="${data.imageUrl}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">`
                : `<i class="fa-solid fa-code"></i>`;

            const dateStr = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString() : 'Unknown';

            card.innerHTML = `
                <div class="cert-icon">${imgHtml}</div>
                <div class="cert-info">
                    <h3>${data.title}</h3>
                    <p>Added ${dateStr}</p>
                </div>
                <div class="verified-badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">
                    <i class="fa-solid fa-check"></i> Published
                </div>
            `;
            
            container.appendChild(card);
        });

        if (!hasProjects) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fa-solid fa-folder-open text-secondary" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p class="text-secondary">You haven't uploaded any projects yet.</p>
                </div>
            `;
        }
    } catch (e) {
        console.error("Error loading projects:", e);
        container.innerHTML = '<p class="text-danger p-4">Error loading projects.</p>';
    }
}
