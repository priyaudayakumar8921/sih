import { db } from './firebase-config.js';
import { collection, getDocs, doc, writeBatch, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

let currentUser = null;
let currentProfile = null;
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let score = 0;

// ==========================================
// AI ASSESSMENT ENGINE CONFIGURATION
// ==========================================
// Paste your Gemini/OpenAI API key here to enable dynamic generation
const AI_API_KEY = ""; 
// ==========================================

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
        const questionTextEl = document.getElementById('question-text');
        const optionsListEl = document.getElementById('options-list');
        
        questionTextEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-accent" style="margin-right: 10px;"></i> Generating personalized assessment...`;
        document.getElementById('question-counter').textContent = "AI Engine Connecting...";
        optionsListEl.innerHTML = '';
        
        if (!AI_API_KEY) {
            questionTextEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-warning" style="margin-right: 10px; color: var(--warning);"></i> AI API Key Required`;
            optionsListEl.innerHTML = `<p class="text-secondary">To generate dynamic assessment questions, please insert your AI API Key into <code>js/assessment.js</code> (line 12).</p>`;
            return;
        }

        // ==========================================
        // API FETCH LOGIC (Example for Gemini API)
        // ==========================================
        /*
        const prompt = `Generate 5 multiple-choice questions for a ${currentProfile.targetRole} role. Return ONLY a JSON array of objects with keys: id, category, text, options (array of {id: "A", text: "..."}), correct (A/B/C/D).`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${AI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        // Parse the JSON string returned by the AI
        const rawText = data.candidates[0].content.parts[0].text.replace(/```json\n|\n```/g, '');
        questions = JSON.parse(rawText);
        */
        
        // When your API is connected and 'questions' array is populated, call:
        // renderQuestion();

    } catch (e) {
        console.error("Error loading AI questions:", e);
        document.getElementById('question-text').textContent = "Failed to generate questions. Check console.";
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

        // Analyze best domain
        let bestDomain = "General";
        let highestScore = -1;
        for (const [domain, score] of Object.entries(newSkills)) {
            if (score > highestScore) {
                highestScore = score;
                bestDomain = domain;
            }
        }

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
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 1rem; max-width: 350px; margin: 0 auto 2rem;">
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">Overall Score: <strong class="text-accent">${percentage}%</strong></div>
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">New Readiness: <strong class="text-accent">${newReadiness}%</strong></div>
                    <div style="background: rgba(201,162,39,0.1); border: 1px solid var(--accent-blue); padding: 1rem; border-radius: 8px;">Strongest Domain: <strong class="text-accent">${bestDomain}</strong></div>
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
