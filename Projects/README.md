# 🌾 GramaGlow: Digital Panchayat Governance & Citizen Services Portal

> **Domain:** Government, NGO & Services | **Theme:** Smart Village Portal  
> **Hackathon Track:** DigitalPanchayat Hack – Pipri Gram Panchayat Edition  
> **Location Focus:** Pipri Gram Panchayat, Block Chunar, District Mirzapur, Uttar Pradesh (PIN: 231304)  
> **Demographics:** Population: 3,420 • 680 Households • 8 Elected Wards • 78.4% Literacy Rate

---

## 📌 Problem Context & Motivation

India's 250,000+ rural Gram Panchayats govern over 800 million citizens. However, village administration frequently remains crippled by:
- **Manual paper registers & opaque budgets:** Villagers have no easy way to verify approved 15th Finance Commission or State Finance grant disbursements for concrete roads or drainage works.
- **Cumbersome grievance mechanisms:** Villagers often travel miles on foot only to find the Panchayat Secretary or Ward Member unavailable.
- **Missing announcement broadcasts:** Agricultural subsidies, PM-Kisan e-KYC deadlines, animal foot-and-mouth vaccination drives, and quarterly Gram Sabha summons fail to reach elderly or low-literacy residents.

**GramaGlow** solves this by providing a bilingual, accessible, mobile-first digital panchayat governance platform that unites elected Sarpanches, Ward Members, and rural citizens with end-to-end transparency.

---

## 🏗️ Technical Architecture & Modules

The project is structured in two cohesive phases complying with curriculum Modules 1 through 4:

### 1. Static Phase (HTML5/CSS3 — Modules 1–2)
- **Showcase File:** [`public/static.html`](file:///c:/Users/ameen/OneDrive/Desktop/Projects/public/static.html)
- **CSS Custom Properties Design System:** Rural Civic Palette (`--primary-green: #1E5631`, `--terracotta: #C85A32`, `--khaki-gold: #C28E46`, `--bg-primary`, etc.).
- **Pure CSS Dark Mode & High Contrast:** Supports light, dark (`[data-theme="dark"]`), and WCAG AAA high-contrast (`[data-contrast="high"]`) themes.
- **CSS Animations:** `@keyframes pulse-glow`, `@keyframes sound-wave`, `@keyframes beacon-pulse`, card lift transitions.
- **Static Pages:** Village demographic overview, citizen services directory, and official notices broadcast.

### 2. Dynamic Phase (JavaScript SPA & Node.js/SQLite — Modules 3–4)
- **Main Application:** [`public/index.html`](file:///c:/Users/ameen/OneDrive/Desktop/Projects/public/index.html)
- **Client Runtime:** `public/js/app.js` uses a custom reactive state store, shared application state (Context-style), event-driven rendering and a hash-based client-side router. The current frontend is vanilla JavaScript, not React or actual React hooks.
- **Backend Server:** `server.js` — Native Node.js REST API, with authentication service/repository modules, structured JSON logging and a global request error boundary.
- **Database:** SQLite (`node:sqlite` in [`gramaglow.db`](file:///c:/Users/ameen/OneDrive/Desktop/Projects/gramaglow.db)) seeded with Pipri Gram Panchayat data.
- **Offline / Standalone Resilience:** [`public/js/data.js`](file:///c:/Users/ameen/OneDrive/Desktop/Projects/public/js/data.js) provides automatic LocalStorage fallback if opened as a standalone static file.

---

## 🌟 Core Features (Must-Have)

| Feature | Description | Implementation Details |
|---|---|---|
| 🏛️ **Gram Panchayat Profile & Governance Board** | Overview of Pipri village leadership (Sarpanch Smt. Savita Devi, Secretary Rajesh Kumar Sharma) and an interactive roster of all 8 elected Ward Members with contact phone and designated focus areas. | Route: `#profile`<br>Shows demographics: 3,420 population, 680 households, 14.2 sq km area, 78.4% literacy. |
| 📢 **Official Notice & Announcement Feed** | Real-time broadcast feed for Gram Sabha assembly meetings, veterinary vaccination drives, PM-Kisan e-KYC camps, and solar subsidies. Filter by category with urgent broadcast priority badges. | Route: `#notices`<br>Includes Web Speech API audio broadcaster. |
| 🏗️ **Village Development & Budget Tracker** | Transparent public expenditure tracker for 6 infrastructure works (Paved CC Road, Solar Streetlights, School Sanitation Block, Drainage Canal, Jal Jeevan RO Water ATM, Anganwadi repair). | Route: `#projects`<br>Displays Sanctioned Budget, Amount Spent, Remaining Balance, and Milestone checklist. |
| ✍️ **Citizen Grievance & Service Request Portal** | Multi-category complaint filing system (Drinking Water, Sanitation, Streetlights, Roads, Ration, Health) with large touch-friendly category cards, landmark address, and photo proof preview. | Route: `#grievance-new`<br>Generates unique token: `GP-PIPRI-2026-XXXX`. |
| 📋 **Grievance Resolution & Ward Status Board** | Public tracking board filtering complaints across stages: `Submitted` ➔ `Assigned to Ward Member` ➔ `In Progress` ➔ `Resolved`. | Route: `#grievance-track`<br>Search by Token, Citizen Name, or Ward. |
| 🌐 **Bilingual Regional Language & Accessible UI** | Instant 1-click toggle between English and Hindi (हिन्दी) across every single component. Dynamic font size scaler (`A-`, `A`, `A+`, `A++`) and High-Contrast mode for elderly citizens. | Controls in top header strip. Full translations in `translations.js`. |
| 🛡️ **Panchayat Admin / Sarpanch Dashboard** | One-click role-switch toggle in header (`Citizen View` vs `Panchayat Admin`). Allows Sarpanch to review tickets, assign Ward Members, update milestones, broadcast notices, and print public audit reports. | Route: `#admin`<br>Header pill toggle. |

---

## 🚀 Stretch Features (Good-to-Have)

| Stretch Feature | Description | Implementation |
|---|---|---|
| 🗳️ **Gram Sabha Digital Voting & Agenda Suggestion** | Villagers can submit proposed agenda items and upvote community priorities prior to the quarterly Gram Sabha meeting. Real-time supporter tally and percentage progress bars. | Route: `#voting`<br>API: `POST /api/agenda-votes/:id/vote` |
| 🗺️ **Village Assets Geo-Inventory Interactive Map** | Scalable 2D village topology map showing public assets (Primary Health Centre, Composite School, Anganwadi #1, Community Borewell #4, Solar Micro-grid, Panchayat Bhavan) with operational status markers and GPS coordinates. | Route: `#map`<br>Interactive SVG vector canvas with modal inspection. |
| 🔊 **Audio Notice Broadcaster** | Integrated Web Speech API (`SpeechSynthesis`) speaking notices aloud in natural Hindi (`hi-IN`) and Indian English (`en-IN`) for non-literate community elders, accompanied by real-time animated equalizer sound bars. | Available on Home Banner and Announcement Feed. |

---

## ⚡ Grievance SLA Escalation Heuristics

To prevent citizen complaints from languishing unresolved, GramaGlow implements automated Service Level Agreement (SLA) escalation heuristics:

| Category | Guaranteed SLA | Auto-Escalation Rule |
|---|---|---|
| 💧 Drinking Water | 2 Days | If unresolved after 48 hrs, flagged with a pulsing red badge and escalated to the Block Development Officer (BDO). |
| 💡 Streetlights | 3 Days | Auto-escalates after 72 hrs. |
| 🏥 Health / Anganwadi | 3 Days | Auto-escalates after 72 hrs. |
| 🧹 Sanitation & Drainage | 4 Days | Auto-escalates after 96 hrs. |
| 🌾 Ration / PDS Shop | 5 Days | Auto-escalates after 120 hrs. |
| 🛣️ Roads & Pathways | 7 Days | Auto-escalates after 168 hrs. |

---

## 💻 Quick Start & Running the Project

### Prerequisites
- **Node.js 22.5 or newer** (required for the built-in `node:sqlite` API)

### 1. Initialize SQLite Database
```bash
node data/seed.js
```
*Creates `gramaglow.db` with complete seed data for Pipri Gram Panchayat.*

### 2. Configure administrator sign-in

Set these environment variables before starting the server. The default username is `admin`; choose a long, unique password. Passwords are stored as salted `scrypt` hashes in SQLite.

PowerShell:
```powershell
$env:GRAMAGLOW_ADMIN_USERNAME="admin"
$env:GRAMAGLOW_ADMIN_PASSWORD="your-long-unique-password"
```

macOS/Linux:
```bash
export GRAMAGLOW_ADMIN_USERNAME="admin"
export GRAMAGLOW_ADMIN_PASSWORD="your-long-unique-password"
```

### 3. Start the Server
```bash
npm start
```
The server will start on port `3000`:
- **Main Dynamic Portal:** [http://localhost:3000](http://localhost:3000)
- **Static Phase Showcase (Modules 1–2):** [http://localhost:3000/static.html](http://localhost:3000/static.html)

### 4. Run Self-Checking Test Suite
```bash
npm test
```
*Runs database/business-logic checks, salted-password authentication tests, health endpoint checks and HTTP integration tests.*

---

## 🎬 What a Good Demo Looks Like (Evaluation Script)

1. **Step 1: Villager opens portal in Hindi:**  
   Click the **🌐 हिन्दी** button in the top bar. The entire interface smoothly transitions into authentic Devanagari Hindi. Notice the urgent broadcast: *"ग्राम सभा की आम बैठक - आगामी मंगलवार प्रातः 10:00 बजे"*.
2. **Step 2: Audio Notice Broadcaster:**  
   Click the **"सूचना सुनें"** button. The browser reads the notice aloud in spoken Hindi with an animated audio equalizer bar.
3. **Step 3: Development Budget Transparency:**  
   Navigate to **"विकास कार्य व बजट"** (`#projects`). Check the *"पक्की सीसी सड़क निर्माण कार्य (वार्ड 3 से नहर पुल तक)"* project. Review that ₹3.6 Lakhs has been spent out of ₹4.5 Lakhs sanctioned (80% completion) with itemized milestones.
4. **Step 4: Citizen Lodges a Grievance:**  
   Click **"शिकायत दर्ज करें"** (`#grievance-new`). Select the **💡 स्ट्रीट लाइट** category card. Enter Name *"Santosh Maurya"*, Phone *"9838044122"*, select **Ward 4**, enter Landmark *"Bazaar Chowk"*, and click *"Sample: Broken Lamp"*. Hit **"शिकायत दर्ज करें व टोकन प्राप्त करें"**. A unique token is instantly generated (e.g. `GP-PIPRI-2026-XXXX`).
5. **Step 5: Track Grievance on Public Board:**  
   Click **"शिकायत की स्थिति ट्रैक करें"**. The tracking board opens with the 4-step status timeline stepper highlighting step 1: *"Submitted"*.
6. **Step 6: Sarpanch Admin Triage:**  
   Toggle the header role pill to **🛡️ पंचायत व्यवस्थापक (सरपंच)**. The Sarpanch dashboard opens. Under the Grievance Action Hub, find the newly lodged complaint. Assign it to **Ward Member #4 (Shri Dayaram Yadav)**, change status to **"In Progress"**, add remarks *"Lineman dispatched with replacement LED driver"*, and click **"सुरक्षित करें"**.
7. **Step 7: Community Priority Voting & Asset Map:**  
   Visit **"ग्राम सभा एजेंडा वोटिंग"** (`#voting`) and click **"👍 Vote (+1)"** on the Solar Irrigation proposal. Switch to **"ग्राम संपदा मानचित्र"** (`#map`) and tap on the **PHSC Health Centre** or **Solar RO Water ATM** pin to inspect GPS coordinates and operational status.

---

## 📂 Repository File Structure

```
c:\Users\ameen\OneDrive\Desktop\Projects\
├── server.js               # Node.js native REST API & static file server
├── package.json            # Project manifest & metadata
├── gramaglow.db            # Persistent SQLite database
├── test_logic.js           # Automated test suite (9/9 passing tests)
├── README.md               # Documentation & Hackathon Brief
├── data/
│   └── seed.js             # Database seeding script for Pipri Gram Panchayat
└── public/
    ├── index.html          # Main dynamic application shell
    ├── static.html         # Modules 1–2 Static Phase Showcase
    ├── css/
    │   ├── style.css       # Rural Civic Design System, custom properties, animations
    │   └── accessibility.css # High contrast (WCAG AAA) & 48px touch targets
    └── js/
        ├── app.js          # Reactive JavaScript SPA: state store, hash router, view renderers
        ├── data.js         # API client & offline LocalStorage fallback store
        └── translations.js # Bilingual Hindi & English dictionary
```

---
*Built with ❤️ for rural empowerment and digital panchayat governance under the Digital India initiative.*


---

## GramaGlow 1.1 — Improvement Notes

This revision preserves the existing Pipri Gram Panchayat portal and adds hardening based on the Attempt #1 evaluation report.

### What changed
- **Real server-verified admin sign-in:** the role toggle now asks for the administrator password; the server issues an HttpOnly, SameSite=Strict session cookie. A saved browser role flag alone can no longer authorize administration.
- **Protected admin operations:** notice publishing, project updates, and grievance status changes require a valid server session.
- **Login resilience:** five failed attempts from one client address trigger a 15-minute cooldown.
- **Server-side validation:** JSON bodies, citizen details, grievance categories/statuses, project spending and completion percentages are validated before database writes. Text inputs are length-limited and control characters are removed.
- **Safer defaults:** removed permissive wildcard CORS, added same-origin write checks, request-size limits and browser security headers.
- **Data access improvements:** added indexes for common grievance, notice and project lookups, plus limit/offset pagination for the grievance board API.
- **Operational visibility:** server-side failures are logged while API clients receive a generic error instead of internal exception text.
- **Developer workflow:** added npm test scripts and a sample environment file.

### Run locally
Prerequisite: Node.js 22.5+ (the project uses the built-in `node:sqlite` module).

```bash
# 1. Install/configure the admin password (PowerShell)
$env:GRAMAGLOW_ADMIN_PASSWORD = "choose-a-long-unique-password"

# macOS / Linux
export GRAMAGLOW_ADMIN_PASSWORD="choose-a-long-unique-password"

# 2. Start the application
npm start
```

Open:
- Dynamic portal: http://localhost:3000
- Static Modules 1–2 showcase: http://localhost:3000/static.html

The existing SQLite database is included. To recreate it from the seed data, stop the server and run `npm run seed`.

### Test
```bash
npm test
```

The API test uses a temporary test password set inside the test process. It verifies that an unauthenticated administrator write is rejected and then exercises the existing portal endpoints.

### Important deployment notes
- Admin sign-in is disabled until `GRAMAGLOW_ADMIN_PASSWORD` is configured. Do not put this value in frontend code, source control, or a public `.env` file.
- This is a single-admin password gate, not a multi-user identity system. For production deployment, use HTTPS, a managed identity provider or individually salted password hashes, persistent/revocable sessions, CSRF tokens, audit logging, database backups and a proper secret manager.
- Sessions are held in server memory and expire after eight hours; restarting the server signs everyone out.
- Public citizen submission and community voting remain public by design. Apply rate limiting and abuse monitoring before exposing the portal to the public internet.
- The project retains its existing vanilla JavaScript reactive SPA architecture. The evaluator's React recommendation is an architectural next step, not a claim that this revision has migrated the UI to React.


## GramaGlow 1.3 update

The Attempt #5 evaluation report awarded 88/100 (A) and recommended a React component architecture, stronger service/repository separation, database transactions and formal API documentation. Version 1.3 adds a React + React Router migration track in `frontend-react/`, extracts grievance domain logic into service/repository modules, wraps grievance writes and audit events in SQLite transactions, adds a protected audit feed, and publishes an OpenAPI 3.1 contract at `/api/docs/openapi.json`.

The original full-featured portal remains available at `/` during the staged React migration. To run the React version, start the API with `npm start`, then in another terminal run `npm run react:install` followed by `npm run react:dev`. For a production bundle use `npm run react:build` and open `/react`. See `IMPROVEMENTS.md` for details and current migration scope.
