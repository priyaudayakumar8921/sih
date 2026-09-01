# SkillBridge 🚀

**Tagline:** Bridge Your Skills. Unlock Your Future.

SkillBridge is a futuristic, intelligent employability operating system built for the Smart India Hackathon (SIH). This repository currently contains the **Student Portal** module.

## Architecture

This project has been architected as a serverless Single Page Application (SPA) using:
- **Frontend:** Vanilla HTML, CSS (modular), and JavaScript (ES6 Modules)
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Storage:** Cloudinary (for profile and certificate image uploads)

## Features (Student Portal)
- 📊 **Dynamic Dashboard:** Real-time metrics, skill readiness score, and priorities.
- 🧠 **Skill Intelligence:** Radar charts (Chart.js) and skill gap analysis.
- 📝 **Skill Assessment:** Adaptive testing interface with mock progress.
- 🗺️ **My Roadmap:** Dynamic learning timeline with active and locked phases.
- 💼 **Opportunities:** Job and internship matching based on skill profiles.
- 🏆 **Digital Portfolio:** Certificate and project showcase with direct Cloudinary uploads.

## Running Locally

Because this project uses ES6 Modules (`type="module"`), it must be run via a local web server (opening the files directly via `file://` will cause CORS errors).

1. Install a local server (if you don't have one):
   ```bash
   npm install -g serve
   ```
2. Serve the directory:
   ```bash
   npx serve
   ```
3. Open `http://localhost:3000` in your browser.

## Seeding Data

To test the database functionality, you can run the seed script which populates your Firebase Firestore with demo data:
1. Navigate to `http://localhost:3000/seed.html`
2. Open your browser console.
3. Click "Seed Student Data".

## Environment Variables

While the current architecture uses static JS files for configuration, a `.env` file is provided as a reference for your API keys. **Never commit your `.env` file to version control.**

*Built for Smart India Hackathon*
