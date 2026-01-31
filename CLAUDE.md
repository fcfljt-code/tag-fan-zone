# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TSG 1899 Hoffenheim Fan-Zone - A personal fan website for Jean-Pierre Fürderer featuring live Bundesliga data, blog, gallery, and player management. Built with vanilla HTML/CSS/JavaScript (no frameworks), hosted on GitHub Pages with Firebase Firestore for cloud storage.

## Commands

```bash
# Start local development server (port 3000)
npm start

# Generate app icons (requires sharp)
node generate-icons.js

# Generate PDF documentation (requires puppeteer)
node generate-pdf.js
```

For local testing without the Node server, use Python:
```bash
python3 -m http.server 8080
```

## Architecture

### Data Flow
- **Firebase Firestore** (primary): Cloud storage for blog posts, gallery, settings, quotes, applications
- **localStorage** (fallback): Used when Firebase is unavailable or for local-only data
- All data functions in `js/firebase-config.js` have dual implementations with Firebase-first, localStorage-fallback pattern

### Realtime Synchronization
Firebase Realtime Listeners are implemented for automatic cross-device sync:
- `listenToBlogPosts()`, `listenToGalerie()`, `listenToSprueche()`, `listenToTop11()`, `listenToSpielerBilder()`
- Each module has a `renderWithData()` function that receives data directly from listeners
- Fallback mechanisms: Initial sync after 2s, auto-sync on visibility change, periodic sync every 60s
- Debug: Call `checkFirebaseListeners()` in browser console to check listener status

### Key JavaScript Modules

| File | Purpose |
|------|---------|
| `firebase-config.js` | Firebase initialization + all database CRUD functions |
| `auth.js` | Simple localStorage-based admin authentication |
| `blog.js` | Blog posts with comments, images, categories |
| `main.js` | Navigation, player roster, fan quotes carousel |
| `tabelle.js` | Live Bundesliga table from OpenLigaDB API |
| `spielplan.js` | Match schedule and results from OpenLigaDB |
| `galerie.js` | Photo gallery with lightbox |
| `top11.js` | "Top 11 of the matchday" feature |
| `fangruppe.js` | Fan group application form |

### Sync UI Components
- **Navigation Sync Button** (green): Visible in header, calls `refreshAllData()`
- **Floating Refresh Button** (blue): Fixed bottom-right, always accessible
- Both trigger manual data refresh for all sections with loading animation

### External APIs
- **OpenLigaDB** (no auth required): `https://api.openligadb.de/getbltable/bl1/2024` for Bundesliga data
- **Firebase Firestore**: Cloud database for persistent storage

### PWA Configuration
- `manifest.json`: App metadata, icons, shortcuts (uses relative paths `./` for GitHub Pages subdirectory)
- `service-worker.js`: Network-first caching strategy to prevent 404 caching issues

### Authentication
Default admin credentials stored in `auth.js`:
- Username: `jean-pierre`
- Password: `hoffe1899` (changeable via settings)

### Deployment
- **GitHub Pages**: https://fcfljt-code.github.io/tag-fan-zone/
- **Repository**: https://github.com/fcfljt-code/tag-fan-zone

### Firebase Setup
Firebase project: `jean-pierre-hoffenheim`
- Firestore rules allow public read, authenticated write
- Configuration in `js/firebase-config.js`
- Setup instructions in `FIREBASE_SETUP.md`

## Corporate Identity
- Primary: `#1a55ab` (Hoffenheim Blue)
- Secondary: `#ffffff` (White)
- Accent: `#003366` (Dark Blue)
