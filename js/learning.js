import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        await renderLearningHub(profileData);
    });
});

async function renderLearningHub(profileData) {
    const grid = document.getElementById('learning-grid');
    if (!grid) return;
    
    try {
        const role = profileData.targetRole || 'fullstack';
        const benchmarkRef = doc(db, "benchmarks", role);
        const benchmarkSnap = await getDoc(benchmarkRef);
        
        let reqs = {};
        if (benchmarkSnap.exists()) {
            reqs = benchmarkSnap.data().requirements || {};
        }

        const studentSkills = profileData.skills || {};
        let gaps = [];
        
        for (const [skill, req] of Object.entries(reqs)) {
            const val = studentSkills[skill] || 0;
            if (val < req) {
                gaps.push({ skill, gap: req - val });
            }
        }
        
        gaps.sort((a, b) => b.gap - a.gap);

        if (gaps.length === 0) {
            grid.innerHTML = `
                <div class="card" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fa-solid fa-graduation-cap text-success" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h2>You're all caught up!</h2>
                    <p class="text-secondary">You have mastered all skills required for ${role}.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        gaps.forEach(g => {
            const card = document.createElement('div');
            card.className = 'opp-card'; // Reuse opportunity card styling
            
            card.innerHTML = `
                <div class="match-badge" style="background: var(--danger); color: white;">PRIORITY GAP</div>
                <div class="opp-header" style="margin-top: 1rem;">
                    <h2 class="opp-role">Master ${g.skill}</h2>
                    <div class="opp-company">SkillBridge Premium Course</div>
                </div>
                
                <div class="opp-meta" style="margin-top: 1rem;">
                    <div><i class="fa-solid fa-video"></i> 12 Hours</div>
                    <div><i class="fa-solid fa-star text-accent"></i> 4.8 Rating</div>
                </div>
                
                <div class="opp-match-reason">
                    <div class="reason-title">Why this course?</div>
                    <p style="font-size: 0.85rem; color: var(--text-primary);">You have a ${g.gap}% proficiency gap in ${g.skill}. Completing this course will fulfill the requirement for your target role.</p>
                </div>
                
                <div class="opp-actions" style="margin-top: auto;">
                    <button class="btn-primary-small btn-full" onclick="window.location.href='roadmap.html'">Start Learning</button>
                </div>
            `;
            
            grid.appendChild(card);
        });

    } catch (e) {
        console.error("Error loading learning hub", e);
        grid.innerHTML = '<p class="text-danger p-4">Error loading learning materials.</p>';
    }
}
