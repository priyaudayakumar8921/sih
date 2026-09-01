import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

document.addEventListener('DOMContentLoaded', () => {

    requireAuth(async (user, profileData) => {
        await initOpportunities(profileData);
    });

});

async function initOpportunities(profileData) {
    const oppGrid = document.getElementById('opp-grid');
    if (!oppGrid) return;
    
    let opportunities = [];

    try {
        const querySnapshot = await getDocs(collection(db, "opportunities"));
        querySnapshot.forEach((doc) => {
            opportunities.push({ id: doc.id, ...doc.data() });
        });
    } catch (e) {
        console.error("Error fetching opportunities from Firebase:", e);
    }

    // Fallback if DB is empty
    if (opportunities.length === 0) {
        opportunities = [
            {
                id: "opp_mock_1",
                role: "Please Run Seed Script",
                company: "Your Database is Empty",
                location: "Localhost",
                duration: "Forever",
                stipend: "Unpaid",
                matchBase: 0,
                type: "Error",
                deadline: "Now",
                deadlineStatus: "urgent",
                skillsHave: [],
                skillsMiss: ["Run seed.html"],
                reason: "You need to open seed.html in your browser and click 'Seed Database' to populate Firebase."
            }
        ];
    }

    // Optional: Calculate match dynamically based on profileData.skills
    // For this demo, we are using the pre-calculated match data from the database
    // to simulate a complex ML matching backend.

    function renderOpportunities() {
        oppGrid.innerHTML = '';
        
        opportunities.forEach(opp => {
            const card = document.createElement('div');
            card.className = 'opp-card';
            
            // Build Skills HTML
            const haveHtml = (opp.skillsHave || []).map(s => `<span class="skill-tag have"><i class="fa-solid fa-check"></i> ${s}</span>`).join('');
            const missHtml = (opp.skillsMiss || []).map(s => `<span class="skill-tag miss"><i class="fa-solid fa-triangle-exclamation"></i> ${s}</span>`).join('');
            
            // Deadline Alert HTML
            let deadlineHtml = '';
            if (opp.deadlineStatus === 'urgent') {
                deadlineHtml = `<div class="deadline-alert urgent"><i class="fa-solid fa-circle-exclamation"></i> 🔴 Apply today - ${opp.deadline} left</div>`;
            } else if (opp.deadlineStatus === 'soon') {
                deadlineHtml = `<div class="deadline-alert soon"><i class="fa-solid fa-clock"></i> 🟠 ${opp.deadline} left</div>`;
            }

            card.innerHTML = `
                <div class="match-badge">${opp.matchBase}% MATCH</div>
                <div class="opp-header">
                    <h2 class="opp-role">${opp.role}</h2>
                    <div class="opp-company">${opp.company}</div>
                </div>
                
                ${deadlineHtml}
                
                <div class="opp-meta">
                    <div><i class="fa-solid fa-location-dot"></i> ${opp.location}</div>
                    <div><i class="fa-regular fa-clock"></i> ${opp.duration}</div>
                    <div><i class="fa-solid fa-money-bill"></i> ${opp.stipend}</div>
                    <div><i class="fa-solid fa-layer-group"></i> ${opp.type}</div>
                </div>
                
                <div class="opp-match-reason">
                    <div class="reason-title">Why this match?</div>
                    <p style="font-size: 0.85rem; margin-bottom: 0.8rem; color: var(--text-primary);">${opp.reason}</p>
                    <div class="skills-list">
                        ${haveHtml}
                        ${missHtml}
                    </div>
                </div>
                
                <div class="opp-actions">
                    <button class="btn-action btn-full">View Details</button>
                    <button class="btn-primary-small btn-full btn-apply" data-opp='${JSON.stringify(opp).replace(/'/g, "&#39;")}'>Apply Now</button>
                </div>
            `;
            
            oppGrid.appendChild(card);
        });
    renderOpportunities();

    // Attach click listeners to Apply buttons
    document.querySelectorAll('.btn-apply').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnEl = e.target;
            const oppData = JSON.parse(btnEl.getAttribute('data-opp'));
            
            btnEl.textContent = 'Applying...';
            btnEl.disabled = true;

            try {
                // We need to import addDoc for this to work. Since we can't easily change the top import,
                // we'll just dynamically import it or use a global if available.
                // Wait, I should add addDoc to the import at the top of the file!
                // I will do that in the next replace chunk.
                const { addDoc, collection } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
                
                // Assuming currentUser is available or we just use auth.currentUser
                const { auth } = await import('./firebase-config.js');
                const user = auth.currentUser;
                
                if (user) {
                    await addDoc(collection(db, "students", user.uid, "applications"), {
                        oppId: oppData.id,
                        role: oppData.role,
                        company: oppData.company,
                        location: oppData.location,
                        status: "In Review",
                        appliedAt: new Date()
                    });
                    btnEl.textContent = 'Applied';
                    btnEl.classList.remove('btn-primary-small');
                    btnEl.classList.add('btn-done');
                    alert(`Successfully applied for ${oppData.role} at ${oppData.company}!`);
                } else {
                    alert('You must be logged in to apply.');
                    btnEl.textContent = 'Apply Now';
                    btnEl.disabled = false;
                }
            } catch (err) {
                console.error("Error applying:", err);
                alert("Failed to apply. Please try again.");
                btnEl.textContent = 'Apply Now';
                btnEl.disabled = false;
            }
        });
    });
}
