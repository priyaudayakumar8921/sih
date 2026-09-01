import { db } from './firebase-config.js';
import { doc, setDoc, collection, writeBatch } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const btn = document.getElementById('seed-btn');
const status = document.getElementById('status');
const logs = document.getElementById('logs');

function log(msg) {
    console.log(msg);
    logs.innerHTML += `<div>${msg}</div>`;
    logs.scrollTop = logs.scrollHeight;
}

const priyaProfile = {
    name: "Priya",
    email: "priya@example.com",
    targetRole: "fullstack",
    readiness: 68, // Starting SIH demo state
    onboardingComplete: true,
    skills: {
        'JavaScript': 82,
        'React': 78,
        'Node.js': 61,
        'MongoDB': 68,
        'REST API': 49,
        'DSA': 38,
        'Communication': 76
    },
    breakdown: [
        { label: "Technical Skills", value: 82 },
        { label: "Aptitude", value: 71 },
        { label: "Communication", value: 76 },
        { label: "Projects", value: 88 },
        { label: "Certifications", value: 65 },
        { label: "Experience", value: 72 }
    ]
};

const benchmarks = {
    'fullstack': {
        name: "Full Stack Developer",
        requirements: {
            'JavaScript': 80,
            'React': 75,
            'Node.js': 80,
            'MongoDB': 75,
            'REST API': 80,
            'DSA': 60
        }
    },
    'frontend': {
        name: "Frontend Developer",
        requirements: {
            'JavaScript': 85,
            'React': 85,
            'Node.js': 40,
            'MongoDB': 30,
            'REST API': 60,
            'DSA': 50
        }
    }
};

const opportunities = [
    {
        id: "opp_1",
        role: "MERN Developer Intern",
        company: "TechNova Solutions",
        location: "Remote",
        duration: "6 Months",
        stipend: "₹15,000/mo",
        matchBase: 92,
        type: "Internship",
        deadline: "2 days",
        deadlineStatus: "urgent",
        skillsHave: ["React", "JavaScript", "MongoDB", "Node.js"],
        skillsMiss: ["REST API"],
        reason: "High alignment with your career goal and strong technical overlap. Missing REST API knowledge could be a minor hurdle."
    },
    {
        id: "opp_2",
        role: "Frontend Engineer Intern",
        company: "CreativeUI Inc.",
        location: "Bangalore",
        duration: "3 Months",
        stipend: "₹20,000/mo",
        matchBase: 86,
        type: "Internship",
        deadline: "5 days",
        deadlineStatus: "soon",
        skillsHave: ["React", "JavaScript", "HTML/CSS"],
        skillsMiss: ["TypeScript"],
        reason: "Perfect fit for your frontend capabilities. Consider brushing up on TypeScript basics before the interview."
    }
];

btn.addEventListener('click', async () => {
    try {
        btn.disabled = true;
        btn.textContent = "Seeding Database...";
        status.style.display = 'block';
        status.className = 'status';
        status.textContent = "Starting process...";
        logs.innerHTML = '';

        // 1. Seed Demo User (Hardcoded ID for demo purposes)
        log("Seeding Demo User 'Priya' (ID: demo_priya)...");
        await setDoc(doc(db, "students", "demo_priya"), priyaProfile);
        
        // 2. Seed Benchmarks
        log("Seeding Industry Benchmarks...");
        const batch = writeBatch(db);
        for (const [key, data] of Object.entries(benchmarks)) {
            const ref = doc(db, "benchmarks", key);
            batch.set(ref, data);
        }
        
        // 3. Seed Opportunities
        log("Seeding Opportunities...");
        opportunities.forEach(opp => {
            const ref = doc(db, "opportunities", opp.id);
            batch.set(ref, opp);
        });

        await batch.commit();

        log("🎉 All demo data successfully seeded!");
        status.className = 'success';
        status.textContent = "Database successfully seeded! You can now use the dashboard.";
        btn.textContent = "Seeding Complete";
        
    } catch (error) {
        console.error(error);
        log("❌ Error: " + error.message);
        status.className = 'error';
        status.textContent = "Error seeding database. See logs. Make sure your Firestore rules allow writes.";
        btn.disabled = false;
        btn.textContent = "Retry Seeding";
    }
});
