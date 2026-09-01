import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

let currentUser = null;
let currentProfile = null;
let benchmarkReqs = {};

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        currentProfile = profileData;
        await loadRoadmap();
    });
});

async function loadRoadmap() {
    try {
        const role = currentProfile.targetRole || 'fullstack';
        const benchmarkRef = doc(db, "benchmarks", role);
        const benchmarkSnap = await getDoc(benchmarkRef);
        
        if (benchmarkSnap.exists()) {
            benchmarkReqs = benchmarkSnap.data().requirements || {};
        }

        renderRoadmap();
    } catch (e) {
        console.error("Error loading roadmap data", e);
    }
}

function renderRoadmap() {
    const container = document.getElementById('roadmap-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const studentSkills = currentProfile.skills || {};
    
    // Determine completed skills (Phase 1) and gaps (Phase 2)
    let completedSkills = [];
    let skillGaps = [];
    
    for (const [skill, req] of Object.entries(benchmarkReqs)) {
        const val = studentSkills[skill] || 0;
        if (val >= req) {
            completedSkills.push({ title: `${skill} Mastery`, type: "Skill", status: "completed", skillName: skill });
        } else {
            skillGaps.push({ title: `Master ${skill}`, type: "Course", status: "pending", skillName: skill, gap: req - val, req: req });
        }
    }
    
    skillGaps.sort((a, b) => b.gap - a.gap);
    
    // Make the first gap 'active'
    if (skillGaps.length > 0) {
        skillGaps[0].status = 'active';
    }

    // Update Top Progress Bar Text
    const totalSkills = completedSkills.length + skillGaps.length;
    const progressPercent = totalSkills === 0 ? 0 : Math.round((completedSkills.length / totalSkills) * 100);
    const progressTitleEl = document.getElementById('roadmap-progress-title');
    const progressDescEl = document.getElementById('roadmap-progress-desc');
    
    if (progressTitleEl) progressTitleEl.textContent = `${progressPercent}% Completed`;
    if (progressDescEl) {
        if (progressPercent === 100) progressDescEl.textContent = "Incredible! You've mastered all target skills.";
        else if (progressPercent > 50) progressDescEl.textContent = "You are making excellent progress towards your goal.";
        else progressDescEl.textContent = "You're just getting started on your journey.";
    }

    const phases = [
        {
            id: 1,
            title: "Phase 1: Foundation",
            subtitle: "Core skills you have already mastered.",
            status: "completed",
            tasks: completedSkills.length > 0 ? completedSkills : [{ title: "Take an assessment to identify your baseline", type: "Assessment", status: "pending" }]
        },
        {
            id: 2,
            title: "Phase 2: Skill Gaps",
            subtitle: "Focusing on your most critical missing skills.",
            status: skillGaps.length > 0 ? "active" : "completed",
            tasks: skillGaps.length > 0 ? skillGaps : [{ title: "All required skills mastered!", type: "Status", status: "completed" }]
        },
        {
            id: 3,
            title: "Phase 3: Industry Experience",
            subtitle: "Apply your skills in real-world scenarios.",
            status: skillGaps.length === 0 ? "active" : "pending",
            tasks: [
                { title: "Build an Industry Project", type: "Project", status: skillGaps.length === 0 ? "active" : "locked" },
                { title: "Complete Live Internship", type: "Experience", status: "locked" }
            ]
        }
    ];

    phases.forEach(phase => {
        const phaseEl = document.createElement('div');
        phaseEl.className = `phase-block ${phase.status}`;
        
        let markerIcon = '<i class="fa-solid fa-lock"></i>';
        if (phase.status === 'completed') markerIcon = '<i class="fa-solid fa-check"></i>';
        if (phase.status === 'active') markerIcon = '<i class="fa-solid fa-play"></i>';

        let tasksHtml = '';
        
        phase.tasks.forEach((task, idx) => {
            let icon = '<i class="fa-regular fa-circle"></i>';
            let btnClass = 'btn-locked';
            let btnText = 'Locked';

            if (task.status === 'completed') {
                icon = '<i class="fa-solid fa-circle-check"></i>';
                btnClass = 'btn-done';
                btnText = 'Completed';
            } else if (task.status === 'active') {
                icon = '<i class="fa-solid fa-circle-play"></i>';
                btnClass = 'btn-continue';
                btnText = 'Continue';
            } else if (task.status === 'pending') {
                btnClass = 'btn-continue';
                btnText = 'Start';
            }
            
            // Add unique ID to button to attach listener
            const btnId = `btn-task-${phase.id}-${idx}`;

            tasksHtml += `
                <div class="task-card ${task.status}">
                    <div class="task-status">${icon}</div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <span class="task-type">${task.type}</span>
                    </div>
                    <button id="${btnId}" class="task-action ${btnClass}" ${task.status === 'locked' || task.status === 'completed' ? 'disabled' : ''}>
                        ${btnText}
                    </button>
                </div>
            `;
        });

        phaseEl.innerHTML = `
            <div class="phase-marker">${markerIcon}</div>
            <div class="phase-header">
                <h3 class="phase-title">${phase.title}</h3>
                <p class="phase-subtitle">${phase.subtitle}</p>
            </div>
            <div class="task-list">
                ${tasksHtml}
            </div>
        `;
        
        container.appendChild(phaseEl);

        // Attach event listeners after appending
        phase.tasks.forEach((task, idx) => {
            if (task.status === 'active' || task.status === 'pending') {
                const btn = document.getElementById(`btn-task-${phase.id}-${idx}`);
                if (btn) {
                    btn.addEventListener('click', () => handleTaskClick(task));
                }
            }
        });
    });
}

async function handleTaskClick(task) {
    if (task.type === "Assessment") {
        window.location.href = 'assessment.html';
        return;
    }

    if (task.skillName && task.req) {
        // Complete a skill gap
        try {
            const btn = event.target;
            btn.textContent = 'Completing...';
            btn.disabled = true;

            const newSkills = { ...currentProfile.skills };
            newSkills[task.skillName] = task.req; // Master it

            const docRef = doc(db, "students", currentUser.uid);
            await updateDoc(docRef, { skills: newSkills });
            
            // Update local profile and re-render
            currentProfile.skills = newSkills;
            
            alert(`Awesome! You have mastered ${task.skillName}!`);
            renderRoadmap();
        } catch (e) {
            console.error("Error updating skill", e);
            alert("Error completing task.");
        }
    } else {
        alert("Action starting...");
    }
}
