import { db } from './firebase-config.js';
import { collection, getDocs, doc, writeBatch, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

let currentUser = null;
let currentProfile = null;
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let score = 0;

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        currentProfile = profileData;
        await loadQuestions();
    });

    const btnNext = document.getElementById('btn-next');
    if (btnNext) {
        btnNext.addEventListener('click', handleNextQuestion);
    }
});

async function loadQuestions() {
    try {
        document.getElementById('question-text').textContent = "Connecting to AI Assessment Engine...";
        document.getElementById('question-counter').textContent = "Initializing...";
        
        // TODO: Replace this block with your actual AI API fetch call once connected with main app
        // Example:
        // const response = await fetch('https://your-main-app.com/api/generate-questions', {
        //     method: 'POST',
        //     body: JSON.stringify({ userId: currentUser.uid, targetRole: currentProfile.targetRole })
        // });
        // questions = await response.json();

        // Temporary placeholder to prevent app crash until API is connected
        questions = [
            {
                id: "ai-placeholder",
                category: "AI API Integration",
                text: "The AI Assessment Engine is ready to be connected. (Waiting for API integration)",
                options: [
                    { id: "A", text: "Connect API Endpoint" },
                    { id: "B", text: "Pass Context" }
                ],
                correct: "A"
            }
        ];

        renderQuestion();
    } catch (e) {
        console.error("Error loading AI questions:", e);
        document.getElementById('question-text').textContent = "Failed to connect to AI Assessment Engine.";
    }
}

function renderQuestion() {
    if (currentQuestionIndex >= questions.length) {
        finishAssessment();
        return;
    }

    const q = questions[currentQuestionIndex];
    document.getElementById('question-counter').textContent = `Question ${currentQuestionIndex + 1} / ${questions.length} • ${q.category}`;
    document.getElementById('question-text').textContent = q.text;

    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.onclick = () => selectOption(btn, opt.id);
        
        btn.innerHTML = `
            <div class="option-letter">${opt.id}</div>
            <div class="option-text">${opt.text}</div>
        `;
        optionsList.appendChild(btn);
    });
}

function selectOption(btn, selectedOptionId) {
    document.querySelectorAll('.option-btn').forEach(el => el.classList.remove('selected'));
    btn.classList.add('selected');
    userAnswers[questions[currentQuestionIndex].id] = selectedOptionId;
}

function handleNextQuestion() {
    const currentQ = questions[currentQuestionIndex];
    if (!userAnswers[currentQ.id]) {
        alert("Please select an answer.");
        return;
    }

    // Check if correct
    if (userAnswers[currentQ.id] === currentQ.correct) {
        score++;
    }

    currentQuestionIndex++;
    renderQuestion();
}

async function finishAssessment() {
    const percentage = Math.round((score / questions.length) * 100);
    
    document.querySelector('.assessment-container').innerHTML = `
        <div style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);">
            <i class="fa-solid fa-spinner fa-spin text-accent" style="font-size: 4rem; margin-bottom: 1rem;"></i>
            <h1>Saving Results...</h1>
        </div>
    `;

    try {
        // Update user profile in Firestore
        const newSkills = { ...currentProfile.skills };
        
        // Boost skills based on the categories tested (simplified logic)
        questions.forEach(q => {
            if (userAnswers[q.id] === q.correct) {
                newSkills[q.category] = Math.min((newSkills[q.category] || 40) + 10, 100);
            }
        });

        // Calculate new readiness (average of all skills)
        const skillValues = Object.values(newSkills);
        const newReadiness = skillValues.length > 0 ? Math.round(skillValues.reduce((a, b) => a + b, 0) / skillValues.length) : percentage;

        const docRef = doc(db, "students", currentUser.uid);
        await updateDoc(docRef, {
            skills: newSkills,
            readiness: newReadiness
        });

        document.querySelector('.assessment-container').innerHTML = `
            <div style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);">
                <i class="fa-solid fa-circle-check text-success" style="font-size: 4rem; color: var(--success); margin-bottom: 1rem;"></i>
                <h1>Assessment Complete!</h1>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">Your Skill DNA has been updated.</p>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 1rem; max-width: 300px; margin: 0 auto 2rem;">
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">Score: <strong class="text-accent">${percentage}%</strong></div>
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">New Readiness: <strong class="text-accent">${newReadiness}%</strong></div>
                </div>
                
                <button class="btn-primary-small" style="padding: 1rem 2rem; font-size: 1.1rem;" onclick="window.location.href='roadmap.html'">Build My Roadmap</button>
            </div>
        `;
    } catch (e) {
        console.error("Error saving assessment:", e);
        document.querySelector('.assessment-container').innerHTML = `
            <div style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color);">
                <i class="fa-solid fa-circle-exclamation text-danger" style="font-size: 4rem; color: var(--danger); margin-bottom: 1rem;"></i>
                <h1>Error Saving Results</h1>
                <p>${e.message}</p>
                <button class="btn-primary-small" style="padding: 1rem 2rem; margin-top: 1rem;" onclick="window.location.reload()">Try Again</button>
            </div>
        `;
    }
}
