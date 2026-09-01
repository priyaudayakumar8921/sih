import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';

document.addEventListener('DOMContentLoaded', () => {

    requireAuth(async (user, profileData) => {
        await initSkillIntelligence(profileData);
    });

});

async function initSkillIntelligence(profileData) {
    let benchmarks = {};
    let currentRole = profileData.targetRole || 'fullstack';
    let radarChart;

    const studentSkills = profileData.skills || {};
    
    // Fetch all benchmarks for the dropdown
    try {
        const querySnapshot = await getDocs(collection(db, "benchmarks"));
        const roleSelect = document.getElementById('role-select');
        roleSelect.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            benchmarks[doc.id] = data;
            
            // Populate select
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = data.name;
            if (doc.id === currentRole) option.selected = true;
            roleSelect.appendChild(option);
        });
        
        // Fallback if targetRole is not in benchmarks
        if (!benchmarks[currentRole] && Object.keys(benchmarks).length > 0) {
            currentRole = Object.keys(benchmarks)[0];
        }
        
    } catch (e) {
        console.error("Error fetching benchmarks", e);
        return;
    }

    const ctx = document.getElementById('skillRadarChart');
    if (!ctx) return;
    
    const chartContext = ctx.getContext('2d');
    
    function renderChart(role) {
        if (!benchmarks[role] || !benchmarks[role].requirements) return;
        
        const reqs = benchmarks[role].requirements;
        // Merge keys from student skills and benchmark requirements
        const allSkills = new Set([...Object.keys(studentSkills), ...Object.keys(reqs)]);
        const labels = Array.from(allSkills);
        
        const studentData = labels.map(label => studentSkills[label] || 0);
        const benchmarkData = labels.map(label => reqs[label] || 0);

        if (radarChart) {
            radarChart.destroy();
        }

        radarChart = new Chart(chartContext, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'You',
                        data: studentData,
                        backgroundColor: 'rgba(212, 175, 55, 0.2)', /* Gold */
                        borderColor: '#d4af37',
                        pointBackgroundColor: '#d4af37',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#d4af37'
                    },
                    {
                        label: 'Industry Benchmark',
                        data: benchmarkData,
                        backgroundColor: 'rgba(148, 163, 184, 0.1)',
                        borderColor: '#94a3b8',
                        borderDash: [5, 5],
                        pointBackgroundColor: '#94a3b8',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#94a3b8'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                        grid: { color: 'rgba(0, 0, 0, 0.1)' },
                        pointLabels: { color: '#111827', font: { size: 12, family: "'Inter', sans-serif" } },
                        ticks: { display: false, min: 0, max: 100 }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#111827', font: { family: "'Inter', sans-serif" } } }
                }
            }
        });
    }

    renderChart(currentRole);

    document.getElementById('role-select').addEventListener('change', (e) => {
        currentRole = e.target.value;
        if(benchmarks[currentRole]) {
            renderChart(currentRole);
            renderGaps(currentRole);
        }
    });

    // Render Gaps
    function renderGaps(role) {
        const gapList = document.getElementById('gap-list');
        if (!gapList) return;
        gapList.innerHTML = '';
        
        if (!benchmarks[role] || !benchmarks[role].requirements) return;
        const reqs = benchmarks[role].requirements;
        
        let gaps = [];
        for (const [skill, req] of Object.entries(reqs)) {
            const val = studentSkills[skill] || 0;
            if (val < req) {
                gaps.push({ skill, gap: req - val, current: val, required: req });
            }
        }
        
        gaps.sort((a, b) => b.gap - a.gap);

        if (gaps.length === 0) {
            gapList.innerHTML = '<p class="text-secondary p-4">You meet all requirements for this role!</p>';
            return;
        }

        gaps.forEach((g, index) => {
            let severity = 'high';
            if (g.gap >= 30) severity = 'critical';

            const item = document.createElement('div');
            item.className = `gap-item ${severity}`;
            item.innerHTML = `
                <div class="gap-meta">
                    <span class="gap-status ${severity}">${severity.toUpperCase()}</span>
                    <span class="gap-value">-${g.gap}%</span>
                </div>
                <div class="gap-details">
                    <h3>${index + 1}. ${g.skill}</h3>
                    <p>Current: ${g.current}% | Required: ${g.required}%</p>
                    <button class="btn-primary-small mt-2" onclick="window.location.href='learning.html'">Start Learning</button>
                </div>
            `;
            gapList.appendChild(item);
        });
    }
    
    renderGaps(currentRole);

    // Render Skill DNA from profileData.breakdown
    const dnaGrid = document.getElementById('dna-grid');
    if (dnaGrid && profileData.breakdown) {
        dnaGrid.innerHTML = '';
        
        const iconMap = {
            "Technical Skills": "fa-solid fa-code",
            "Aptitude": "fa-solid fa-brain",
            "Communication": "fa-regular fa-comments",
            "Projects": "fa-solid fa-laptop-code",
            "Certifications": "fa-solid fa-certificate",
            "Experience": "fa-solid fa-briefcase"
        };
        
        profileData.breakdown.forEach(b => {
            let color = 'var(--text-primary)';
            if(b.value >= 80) color = 'var(--accent-blue)';
            else if(b.value >= 70) color = 'var(--success)';
            else color = 'var(--warning)';
            
            const icon = iconMap[b.label] || "fa-solid fa-star";

            const cell = document.createElement('div');
            cell.className = 'dna-cell';
            cell.innerHTML = `
                <i class="${icon}" style="color: ${color}"></i>
                <h4>${b.label}</h4>
                <div class="dna-strength">
                    <div class="dna-strength-fill" style="width: ${b.value}%; background: ${color}"></div>
                </div>
            `;
            dnaGrid.appendChild(cell);
        });
    } else if (dnaGrid) {
        dnaGrid.innerHTML = '<p class="text-secondary p-4">Complete an assessment to generate your Skill DNA.</p>';
    }

    // Render Progression Chart (Line Chart)
    const progCtx = document.getElementById('progressionChart');
    if (progCtx) {
        const progContext = progCtx.getContext('2d');
        
        // Generate dynamic mock history based on current readiness for presentation impact
        const currentR = profileData.readiness || 10; 
        const historyData = [
            Math.max(0, currentR - 35),
            Math.max(0, currentR - 25),
            Math.max(0, currentR - 15),
            Math.max(0, currentR - 8),
            Math.max(0, currentR - 2),
            currentR
        ];

        new Chart(progContext, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Overall Industry Readiness',
                    data: historyData,
                    borderColor: '#C9A227', // ANSORA Gold
                    backgroundColor: 'rgba(201, 162, 39, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4, // smooth curves
                    pointBackgroundColor: '#FAFAF8',
                    pointBorderColor: '#C9A227',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0,0,0,0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: { family: "'Inter', sans-serif" }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#6b7280',
                            font: { family: "'Inter', sans-serif" }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0B0B0D',
                        titleFont: { family: "'Inter', sans-serif", size: 13 },
                        bodyFont: { family: "'Inter', sans-serif", size: 14 },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false
                    }
                }
            }
        });
    }
}
