# ExamForge Progressive Web App (PWA) Architecture & Deployment Manual

> **ExamForge**: Production-Grade Installable Progressive Web Application (PWA) running on Next.js 16 App Router with Native Android WebAPK generation, Zero-Leak Service Worker caching, and Role-Aware Mobile Information Architecture.

---

## 🏛️ 1. Overview & Architecture Philosophy

ExamForge operates as an **installable Progressive Web Application** where the web codebase serves as the single source of truth across all devices:

```
               EXAMFORGE REPOSITORY
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
    Desktop Viewport              Mobile Viewport
  (Full Multi-Column           (Standalone PWA App
   Command Workspaces)          with Role-Aware Nav)
         │                             │
         └──────────────┬──────────────┘
                        ▼
               FASTAPI BACKEND
                        │
                POSTGRESQL DB
```

### Core PWA Capabilities:
1. **Native Android WebAPK Generation**: Google Chrome mints an official Android APK package on-the-fly, placing ExamForge in the Android App Drawer and Home Screen.
2. **Standalone Display Mode**: Zero browser URL bars, zero browser navigation controls, edge-to-edge hardware viewport.
3. **Role-Aware Adaptive Mobile Navigation**: Bottom navigation tabs and drawers tailored to the authenticated persona (Candidate, Vendor, Controller, Evaluator, Auditor).
4. **Zero-Leak Security Service Worker**: Precaches only the immutable UI shell and static assets. **Strictly forbids caching `/api/*` endpoints, authentication tokens, OTPs, Aadhaar proofs, answers, or payment data.**
5. **Real-Time Connectivity Strip**: Transparent online/offline status banner informing users when network is required for sensitive examination actions.

---

## 📱 2. How PWA Installation Works on Android

When a user visits ExamForge in Google Chrome on Android:
1. Chrome checks the **Web App Manifest** (`/manifest.json` & `/manifest.webmanifest`) and active **Service Worker** (`/sw.js`).
2. Chrome fires the `beforeinstallprompt` event.
3. Tapping **"Install Web App"** triggers `deferredPrompt.prompt()`.
4. Chrome's WebAPK Minting Service compiles an Android WebAPK with the **ExamForge teal emblem icon** (`/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png`).
5. The app installs into the **Android App Drawer** and **Home Screen**, launching full-screen in standalone mode without browser chrome.

---

## 🛡️ 3. Zero-Leak Caching & Security Policy

| Resource Type | Cache Strategy | Security Classification |
| :--- | :--- | :--- |
| **API Calls (`/api/*`)** | **Strict Network-Only** (No Cache) | Sensitive: Tokens, OTPs, Answers, Aadhaar data, and Payment states are **NEVER** stored in `CacheStorage`. If offline, returns a clean 503 JSON without leaking memory. |
| **Static JavaScript Chunks & CSS** | **Stale-While-Revalidate** | Public / Cacheable: Precached on install and revalidated in background. |
| **Application Icons & Logos** | **Cache-First** | Public / Cacheable: High-DPI icons (`192x192`, `512x512`, `maskable`). |
| **Google Geist Fonts** | **Cache-First** | Public / Cacheable: Offline font rendering. |
| **HTML Navigation Shell** | **Stale-While-Revalidate** with Offline Shell Fallback | Serves cached shell when offline. |

---

## 🧭 4. Role-Aware Mobile Navigation Layout

ExamForge automatically adapts its bottom navigation bar (`ForgeBottomNav.tsx`) to the active persona:

```
┌──────────────────────────────────────────────┐
│  ExamForge                      Profile (👤) │
├──────────────────────────────────────────────┤
│                                              │
│               PAGE CONTENT                   │
│                                              │
├──────────────────────────────────────────────┤
│  [Tab 1]   [Tab 2]   [Tab 3]   [Tab 4] [More]│
└──────────────────────────────────────────────┘
```

- **Candidate**: Home &bull; Examinations &bull; Scorecard Results &bull; Admit Card &bull; Verifier
- **Vendor**: Dashboard &bull; Exam Catalog &bull; Publish Exam &bull; SafeBatch &bull; More
- **Controller / Authority**: Mission Control &bull; War Room &bull; SafeBatch &bull; Security &bull; More
- **Evaluator**: Queue &bull; Grading Dashboard &bull; Analytics &bull; OMR Scanner &bull; More
- **Auditor / Security**: Security Command &bull; Audit Ledger &bull; Pentest &bull; Hardening &bull; More
- **Lockdown Exam Runner (`/student-exam`)**: Suppresses bottom navigation to ensure a distraction-free examination window.

---

## 🧪 5. Testing & Verification Guide

### A. Testing PWA Locally over Wi-Fi on Android Device
1. Find your computer's local IP (e.g. `192.168.1.15`).
2. Run Next.js bound to all interfaces:
   ```bash
   cd frontend
   npm run dev -- -H 0.0.0.0
   ```
3. Open `http://192.168.1.15:3000` in **Chrome for Android**.
4. Tap **"Install Web App"** or tap Chrome menu (⋮) &rarr; **"Install App"**.

### B. Testing on Production HTTPS Deployment
1. Visit: `https://exam-forge-jowdmmskg-na124441s-projects.vercel.app/`
2. Open Chrome DevTools &rarr; **Application Tab**:
   - **Manifest**: Verify `name`, `short_name`, `icons`, `display: standalone`, `start_url`.
   - **Service Workers**: Verify `/sw.js` status is `Activated and running`.
   - **Storage**: Verify `/api/` calls are never cached.
3. Run **Lighthouse &rarr; Progressive Web App** audit (verifies installability, splash screen, and maskable icons).

### C. Testing Network Loss & Restoration
1. Open DevTools &rarr; Network tab &rarr; Toggle **Offline**.
2. Notice the **NetworkStatusBanner** immediately turns amber:  
   `⚠️ Offline Mode — Transactional examination actions require active internet connection.`
3. Toggle back to **Online**.
4. Notice the green **Connection Restored** confirmation banner.

---

## 📦 6. App Icon Manifest Reference

```json
{
  "name": "ExamForge",
  "short_name": "ExamForge",
  "description": "Professional examination management and delivery platform",
  "start_url": "/",
  "id": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0B1A17",
  "theme_color": "#132D28",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" }
  ]
}
```
