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

const defaultQuestions = [
    {
        id: "q1",
        category: "JavaScript",
        text: "Which method is used to serialize an object into a JSON string in JavaScript?",
        options: [
            { id: "A", text: "JSON.parse()" },
            { id: "B", text: "JSON.stringify()" },
            { id: "C", text: "Object.toJSON()" },
            { id: "D", text: "String.toJSON()" }
        ],
        correct: "B"
    },
    {
        id: "q2",
        category: "React",
        text: "What hook should be used to perform side effects in a functional component?",
        options: [
            { id: "A", text: "useState" },
            { id: "B", text: "useEffect" },
            { id: "C", text: "useContext" },
            { id: "D", text: "useReducer" }
        ],
        correct: "B"
    },
    {
        id: "q3",
        category: "Node.js",
        text: "In Express.js, what is the primary purpose of middleware functions?",
        options: [
            { id: "A", text: "To connect directly to MongoDB" },
            { id: "B", text: "To execute code, modify requests, and end the cycle" },
            { id: "C", text: "To render HTML templates on the client" },
            { id: "D", text: "To manage frontend state" }
        ],
        correct: "B"
    },
    {
        id: "q4",
        category: "MongoDB",
        text: "Which of the following is NOT a valid MongoDB data type?",
        options: [
            { id: "A", text: "ObjectId" },
            { id: "B", text: "Double" },
            { id: "C", text: "Varchar" },
            { id: "D", text: "Boolean" }
        ],
        correct: "C"
    },
    {
        id: "q5",
        category: "REST API",
        text: "Which HTTP method is typically used to partially update a resource?",
        options: [
            { id: "A", text: "GET" },
            { id: "B", text: "POST" },
            { id: "C", text: "PUT" },
            { id: "D", text: "PATCH" }
        ],
        correct: "D"
    }
];

async function loadQuestions() {
    try {
        const qRef = collection(db, "assessments");
        const snapshot = await getDocs(qRef);
        
        if (snapshot.empty) {
            console.log("No questions found, seeding database...");
            const batch = writeBatch(db);
            defaultQuestions.forEach(q => {
                const docRef = doc(db, "assessments", q.id);
                batch.set(docRef, q);
            });
            await batch.commit();
            questions = defaultQuestions;
        } else {
            snapshot.forEach(doc => {
                questions.push({ id: doc.id, ...doc.data() });
            });
        }
        
        // Shuffle and pick 5
        questions = questions.sort(() => 0.5 - Math.random()).slice(0, 5);
        renderQuestion();
    } catch (e) {
        console.error("Error loading questions:", e);
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
