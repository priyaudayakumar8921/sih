import { db, auth } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { requireAuth } from './auth-guard.js';

document.addEventListener('DOMContentLoaded', () => {

    // 1. Wait for authentication and fetch profile
    requireAuth(async (user, profileData) => {
        await renderDashboard(profileData);
    });

    // 2. Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                alert("Logged out successfully.");
                window.location.reload();
            } catch (error) {
                console.error("Logout Error:", error);
            }
        });
    }

    // 3. Priorities Interactive Buttons
    const priorityBtns = document.querySelectorAll('.priority-item button');
    priorityBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.textContent;
            if (action === 'Start') window.location.href = 'assessment.html';
            else if (action === 'Continue') window.location.href = 'roadmap.html';
            else if (action === 'Apply Now') window.location.href = 'opportunities.html';
            else if (action === 'Update') window.location.href = 'portfolio.html';
        });
    });
    
    // FAB Interaction
    const copilotFab = document.querySelector('.copilot-fab');
    if (copilotFab) {
        copilotFab.addEventListener('click', () => {
            alert('SkillBridge AI Copilot is analyzing your profile...');
        });
    }
});

async function renderDashboard(profileData) {
    document.getElementById('greeting-name').textContent = `Good morning, ${profileData.name} 👋`;

    // Update Target Role dynamically if exists in DB
    if (profileData.targetRole) {
        try {
            const benchmarkRef = doc(db, "benchmarks", profileData.targetRole);
            const benchmarkSnap = await getDoc(benchmarkRef);
            if (benchmarkSnap.exists()) {
                const targetTitleEl = document.querySelector('.target-title');
                if (targetTitleEl) targetTitleEl.textContent = benchmarkSnap.data().name;
            }
        } catch (err) {
            console.error("Could not load benchmark data", err);
        }
    }

    // Render Breakdown Cards
    const breakdownContainer = document.querySelector('.breakdown-grid');
    if (breakdownContainer && profileData.breakdown && profileData.breakdown.length > 0) {
        breakdownContainer.innerHTML = '';
        profileData.breakdown.forEach(item => {
            const card = document.createElement('div');
            card.className = 'b-card';
            
            // Assign color based on value for a premium feel
            let valColor = 'var(--text-primary)';
            if(item.value >= 80) valColor = 'var(--accent-blue)';
            else if(item.value >= 70) valColor = 'var(--success)';
            else valColor = 'var(--warning)';

            card.innerHTML = `
                <span class="b-title">${item.label}</span>
                <span class="b-val" style="color: ${valColor}">${item.value}%</span>
            `;
            
            card.addEventListener('click', () => {
                window.location.href = 'skill-intelligence.html';
            });
            
            breakdownContainer.appendChild(card);
        });
    } else if (breakdownContainer) {
        breakdownContainer.innerHTML = '<p class="text-secondary" style="grid-column: 1/-1;">No breakdown data available. Take an assessment to generate your profile.</p>';
    }

    // Animate Circular Progress
    const readinessCircle = document.getElementById('readiness-circle');
    const readinessValueDisplay = document.getElementById('readiness-value-display');
    const sidebarReadiness = document.getElementById('sidebar-readiness');
    
    if (readinessCircle) {
        let currentProgress = 0;
        const targetProgress = profileData.readiness || 0;
        const speed = 15; // ms per 1%
        
        if (sidebarReadiness) sidebarReadiness.textContent = `${targetProgress}%`;

        if (targetProgress > 0) {
            const progressInterval = setInterval(() => {
                currentProgress++;
                readinessCircle.style.background = `conic-gradient(var(--accent-blue) ${currentProgress * 3.6}deg, var(--border-color) 0deg)`;
                readinessValueDisplay.textContent = `${currentProgress}%`;

                if (currentProgress >= targetProgress) {
                    clearInterval(progressInterval);
                }
            }, speed);
        } else {
            readinessValueDisplay.textContent = `0%`;
            readinessCircle.style.background = `conic-gradient(var(--accent-blue) 0deg, var(--border-color) 0deg)`;
        }
    }
}
