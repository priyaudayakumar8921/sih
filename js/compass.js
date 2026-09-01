import { db } from './firebase-config.js';
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        await generateCompass(profileData);
    });
});

async function generateCompass(profileData) {
    const grid = document.getElementById('compass-grid');
    const summary = document.getElementById('trajectory-summary');
    if (!grid || !summary) return;

    try {
        const studentSkills = profileData.skills || {};
        const currentRole = profileData.targetRole || "fullstack";
        
        const querySnapshot = await getDocs(collection(db, "benchmarks"));
        let matches = [];
        let currentRoleMatch = 0;
        let currentRoleName = "";

        querySnapshot.forEach((docSnap) => {
            const b = docSnap.data();
            const reqs = b.requirements || {};
            
            // Simple match algorithm: average ratio of student skill vs required
            let totalRatio = 0;
            let reqCount = 0;
            
            for (const [skill, reqValue] of Object.entries(reqs)) {
                reqCount++;
                const studentVal = studentSkills[skill] || 0;
                totalRatio += Math.min(studentVal / reqValue, 1);
            }
            
            const matchPercentage = reqCount === 0 ? 0 : Math.round((totalRatio / reqCount) * 100);
            
            if (docSnap.id === currentRole) {
                currentRoleMatch = matchPercentage;
                currentRoleName = b.name;
            } else {
                matches.push({
                    id: docSnap.id,
                    name: b.name,
                    match: matchPercentage,
                    desc: `Requires strong skills in ${Object.keys(reqs).slice(0,3).join(', ')}.`
                });
            }
        });

        // Update Summary
        let trajectoryHtml = `<p>You are currently targeting <strong>${currentRoleName}</strong>. Based on your recent assessments and skill growth, you are a <strong>${currentRoleMatch}% match</strong> for this role.</p>`;
        if (currentRoleMatch >= 80) {
            trajectoryHtml += `<p class="text-success mt-2"><i class="fa-solid fa-circle-check"></i> You are highly competitive for this role! Keep up the great work.</p>`;
        } else {
            trajectoryHtml += `<p class="text-warning mt-2"><i class="fa-solid fa-triangle-exclamation"></i> You have some skill gaps to close before you are fully ready for this role. Check your Roadmap.</p>`;
        }
        summary.innerHTML = trajectoryHtml;

        // Sort matches by highest percentage
        matches.sort((a, b) => b.match - a.match);

        grid.innerHTML = '';
        matches.forEach(m => {
            const card = document.createElement('div');
            card.className = 'opp-card';
            
            let color = 'var(--text-secondary)';
            if (m.match >= 75) color = 'var(--success)';
            else if (m.match >= 50) color = 'var(--warning)';
            else color = 'var(--danger)';

            card.innerHTML = `
                <div class="match-badge" style="background: ${color}; color: white;">${m.match}% MATCH</div>
                <div class="opp-header" style="margin-top: 1rem;">
                    <h2 class="opp-role">${m.name}</h2>
                    <div class="opp-company">Alternative Path</div>
                </div>
                
                <div class="opp-match-reason mt-4">
                    <p style="font-size: 0.85rem; color: var(--text-primary);">${m.desc}</p>
                </div>
                
                <div class="opp-actions" style="margin-top: auto;">
                    <button class="btn-action btn-full btn-switch-role" data-roleid="${m.id}">Switch to this Track</button>
                </div>
            `;
            
            grid.appendChild(card);
        });

        // Add event listeners for switching roles
        document.querySelectorAll('.btn-switch-role').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const roleId = e.target.getAttribute('data-roleid');
                const confirmSwitch = confirm(`Are you sure you want to switch your target career track to ${roleId}? Your roadmap and opportunities will be recalculated.`);
                
                if (confirmSwitch) {
                    e.target.textContent = 'Switching...';
                    e.target.disabled = true;
                    
                    try {
                        const userRef = doc(db, "students", currentUser.uid);
                        await updateDoc(userRef, { targetRole: roleId });
                        alert("Career track updated successfully!");
                        window.location.reload();
                    } catch (err) {
                        console.error(err);
                        alert("Failed to update career track.");
                        e.target.textContent = 'Switch to this Track';
                        e.target.disabled = false;
                    }
                }
            });
        });

    } catch (e) {
        console.error("Error generating compass:", e);
        summary.innerHTML = '<p class="text-danger p-4">Error loading Career Compass.</p>';
    }
}
