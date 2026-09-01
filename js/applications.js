import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        await loadApplications();
    });
});

async function loadApplications() {
    const grid = document.getElementById('apps-grid');
    if (!grid) return;
    
    grid.innerHTML = '<p class="text-secondary p-4">Fetching your applications...</p>';

    try {
        const q = query(collection(db, "students", currentUser.uid, "applications"), orderBy("appliedAt", "desc"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            grid.innerHTML = `
                <div class="card" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fa-solid fa-paper-plane text-secondary" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h2>No Applications Yet</h2>
                    <p class="text-secondary">Head over to the Opportunities page to start applying!</p>
                    <button class="btn-primary-small mt-2" onclick="window.location.href='opportunities.html'">Explore Opportunities</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        snapshot.forEach(docSnap => {
            const app = docSnap.data();
            const card = document.createElement('div');
            card.className = 'opp-card'; // Reuse opportunity card styling
            
            const dateStr = app.appliedAt ? new Date(app.appliedAt.toMillis()).toLocaleDateString() : 'Recently';

            // Status color
            let statusBadgeHtml = '';
            if (app.status === 'In Review') {
                statusBadgeHtml = `<div class="match-badge" style="background: var(--warning); color: #fff;"><i class="fa-regular fa-clock"></i> IN REVIEW</div>`;
            } else if (app.status === 'Interviewing') {
                statusBadgeHtml = `<div class="match-badge" style="background: var(--accent-cyan); color: #fff;"><i class="fa-solid fa-comments"></i> INTERVIEWING</div>`;
            } else if (app.status === 'Offered') {
                statusBadgeHtml = `<div class="match-badge" style="background: var(--success); color: #fff;"><i class="fa-solid fa-star"></i> OFFERED</div>`;
            } else if (app.status === 'Rejected') {
                statusBadgeHtml = `<div class="match-badge" style="background: var(--danger); color: #fff;"><i class="fa-solid fa-xmark"></i> NOT SELECTED</div>`;
            } else {
                statusBadgeHtml = `<div class="match-badge" style="background: var(--text-secondary); color: #fff;">${app.status}</div>`;
            }

            card.innerHTML = `
                ${statusBadgeHtml}
                <div class="opp-header" style="margin-top: 1rem;">
                    <h2 class="opp-role">${app.role}</h2>
                    <div class="opp-company">${app.company}</div>
                </div>
                
                <div class="opp-meta" style="margin-top: 1rem;">
                    <div><i class="fa-solid fa-location-dot"></i> ${app.location}</div>
                    <div><i class="fa-solid fa-calendar"></i> Applied: ${dateStr}</div>
                </div>
                
                <div class="opp-actions" style="margin-top: auto;">
                    <button class="btn-action btn-full" onclick="alert('Viewing application details for ${app.role}...')">View Status</button>
                </div>
            `;
            
            grid.appendChild(card);
        });

    } catch (e) {
        console.error("Error loading applications:", e);
        grid.innerHTML = '<p class="text-danger p-4">Error loading applications.</p>';
    }
}
