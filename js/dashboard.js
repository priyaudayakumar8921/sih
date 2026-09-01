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
    document.getElementById('greeting-name').textContent = `Good morning, ${profileData.name || 'Student'} 👋`;
    
    const avatarImg = document.getElementById('avatar-img');
    if (avatarImg) {
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'Student')}&background=C9A227&color=fff`;
    }

    // Sidebar Profile Completion
    let completion = 20; // base
    if (profileData.onboardingComplete) completion += 30;
    if (profileData.skills && Object.keys(profileData.skills).length > 0) completion += 30;
    if (profileData.breakdown && profileData.breakdown.length > 0) completion += 20;
    
    const sidebarCompEl = document.getElementById('sidebar-completion');
    const sidebarCompFill = document.getElementById('sidebar-completion-fill');
    if (sidebarCompEl) sidebarCompEl.textContent = `${completion}%`;
    if (sidebarCompFill) sidebarCompFill.style.width = `${completion}%`;

    // Update Target Role dynamically if exists in DB
    if (profileData.targetRole) {
        try {
            const benchmarkRef = doc(db, "benchmarks", profileData.targetRole);
            const benchmarkSnap = await getDoc(benchmarkRef);
            if (benchmarkSnap.exists()) {
                const targetTitleEl = document.querySelector('.target-title');
                if (targetTitleEl) targetTitleEl.textContent = benchmarkSnap.data().name;
                
                const targetReadinessVal = document.getElementById('target-readiness-val');
                if (targetReadinessVal) targetReadinessVal.textContent = `${profileData.readiness || 0}%`;
                
                const targetTimeVal = document.getElementById('target-time-val');
                if (targetTimeVal) {
                    const r = profileData.readiness || 0;
                    if (r >= 90) targetTimeVal.textContent = "Ready now!";
                    else if (r >= 70) targetTimeVal.textContent = "2-4 weeks";
                    else targetTimeVal.textContent = "2-3 months";
                }
            }
        } catch (err) {
            console.error("Could not load benchmark data", err);
        }
    } else {
        const targetTitleEl = document.querySelector('.target-title');
        if (targetTitleEl) targetTitleEl.textContent = "No Target Role Set";
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

    // Animate Circular Progress & Sidebar Readiness
    const readinessCircle = document.getElementById('readiness-circle');
    const readinessValueDisplay = document.getElementById('readiness-value-display');
    const sidebarReadiness = document.getElementById('sidebar-readiness');
    const sidebarReadinessFill = document.getElementById('sidebar-readiness-fill');
    const readinessBadge = document.getElementById('readiness-badge');
    const readinessTrend = document.getElementById('readiness-trend');
    
    if (readinessCircle) {
        let currentProgress = 0;
        const targetProgress = profileData.readiness || 0;
        const speed = 15; // ms per 1%
        
        if (sidebarReadiness) sidebarReadiness.textContent = `${targetProgress}%`;
        if (sidebarReadinessFill) sidebarReadinessFill.style.width = `${targetProgress}%`;
        
        if (readinessBadge) {
            if (targetProgress >= 90) readinessBadge.textContent = "Industry Ready";
            else if (targetProgress >= 70) readinessBadge.textContent = "Nearly Ready";
            else readinessBadge.textContent = "Needs Development";
        }
        
        if (readinessTrend) {
            // Simulated trend calculation
            if (targetProgress > 50) readinessTrend.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> Trending Up`;
            else readinessTrend.innerHTML = `<i class="fa-solid fa-minus"></i> Stable`;
        }

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

    // Populate Career Brief
    const careerBriefItems = document.getElementById('career-brief-items');
    if (careerBriefItems) {
        careerBriefItems.innerHTML = `
            <div class="b-item"><span class="emoji">🎯</span> You have set ${profileData.targetRole ? 'a target role' : 'no target role yet'}.</div>
            <div class="b-item"><span class="emoji">💼</span> You have ${Object.keys(profileData.skills || {}).length} documented skills.</div>
            <div class="b-item"><span class="emoji">🔥</span> Your industry readiness is ${profileData.readiness || 0}%.</div>
        `;
    }
}
