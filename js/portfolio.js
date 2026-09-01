import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { requireAuth } from './auth-guard.js';
import { uploadImageToCloudinary } from './cloudinary.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    requireAuth(async (user, profileData) => {
        currentUser = user;
        
        // Update header details
        document.getElementById('profile-name').textContent = profileData.name || "Student";
        const emailEl = document.querySelector('.profile-meta div:nth-child(1)');
        if (emailEl) emailEl.innerHTML = `<i class="fa-regular fa-envelope"></i> ${profileData.email}`;
        
        await loadPortfolio();
    });

    const certUploadInput = document.getElementById('cert-upload');
    if (certUploadInput) {
        certUploadInput.addEventListener('change', handleUpload);
    }
});

async function loadPortfolio() {
    const certsContainer = document.getElementById('certs-container');
    if (!certsContainer) return;
    
    certsContainer.innerHTML = '<p class="text-secondary p-4">Loading portfolio items...</p>';

    try {
        const q = query(collection(db, "students", currentUser.uid, "portfolio"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            certsContainer.innerHTML = '<p class="text-secondary p-4">No certifications or projects uploaded yet.</p>';
            return;
        }

        certsContainer.innerHTML = '';
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            renderPortfolioItem(certsContainer, data);
        });
    } catch (e) {
        console.error("Error loading portfolio:", e);
        certsContainer.innerHTML = '<p class="text-danger p-4">Error loading portfolio items.</p>';
    }
}

function renderPortfolioItem(container, data) {
    const card = document.createElement('div');
    card.className = 'cert-card';
    
    let imgHtml = data.imageUrl 
        ? `<img src="${data.imageUrl}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">`
        : `<i class="fa-solid fa-certificate"></i>`;

    const dateStr = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString() : 'Just now';

    card.innerHTML = `
        <div class="cert-icon">${imgHtml}</div>
        <div class="cert-info">
            <h3>${data.title}</h3>
            <p>Uploaded ${dateStr}</p>
        </div>
        <div class="verified-badge" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">
            <i class="fa-regular fa-clock"></i> Pending Review
        </div>
    `;
    
    container.appendChild(card);
}

async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const uploadStatus = document.getElementById('upload-status');
    const certsContainer = document.getElementById('certs-container');

    try {
        uploadStatus.style.display = 'block';
        uploadStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading to Cloudinary...';
        
        // 1. Upload to Cloudinary
        const imageUrl = await uploadImageToCloudinary(file);
        
        uploadStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving to Database...';

        // 2. Save metadata to Firestore
        const title = prompt("Enter a title for this certificate/project:", file.name) || "Untitled Certificate";
        
        const docData = {
            title: title,
            imageUrl: imageUrl,
            type: "certification",
            createdAt: new Date()
        };

        const docRef = await addDoc(collection(db, "students", currentUser.uid, "portfolio"), docData);

        uploadStatus.innerHTML = '<i class="fa-solid fa-check" style="color: var(--success);"></i> Upload Successful!';
        
        // 3. Render it locally to avoid needing a full reload
        if (certsContainer.querySelector('p')) {
            certsContainer.innerHTML = ''; // Clear empty text
        }
        
        // We prepend so it appears at the top
        const card = document.createElement('div');
        card.className = 'cert-card';
        card.innerHTML = `
            <div class="cert-icon"><img src="${imageUrl}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"></div>
            <div class="cert-info">
                <h3>${title}</h3>
                <p>Uploaded Just now</p>
            </div>
            <div class="verified-badge" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);"><i class="fa-regular fa-clock"></i> Pending Review</div>
        `;
        certsContainer.prepend(card);
        
        setTimeout(() => uploadStatus.style.display = 'none', 3000);
    } catch (err) {
        console.error("Upload error:", err);
        uploadStatus.innerHTML = '<i class="fa-solid fa-xmark" style="color: var(--danger);"></i> Upload failed: ' + err.message;
    } finally {
        e.target.value = ''; // Reset input
    }
}
