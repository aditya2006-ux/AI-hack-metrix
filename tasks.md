# 🧬 PHARMA-AI — Team Task Board

> **Last updated**: March 12, 2026
> **Sprint**: Sprint 1 (Week 1-2)

---

## 👥 Team Roster

| Member | Role | Focus Area |
|--------|------|------------|
| **Rishav** | Full-Stack Lead | Backend architecture, API security, daily vulnerability checks |
| **Shantanu** | Frontend Specialist | UI/UX, design polish, animations, responsiveness |
| **Aditya** | QA & Documentation Lead | Testing, docs, environment config, code quality |
| **Ani** | Product Engineer | Feature strategy, UX flows, integrations, product decisions |
| **Vaibhav** | Data Engineer | Data pipelines, analysis engine, data collection & processing |
| **Himanshu** | Database Engineer | Drug database expansion (+10 drugs/week from DrugBank) |

---

## 🔥 Rishav — Full-Stack Lead & Security

> *Owns backend, critical features, and daily vulnerability audits*

### Daily Responsibilities
- [ ] **Daily vulnerability check** — Scan backend for dependency CVEs, API key exposure, injection risks
- [ ] **Code review** — Review all PRs before merge (especially backend changes)

### Sprint 1 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| R-1 | **Refactor `server.py`** — Split the 673-line monolith into modular files: `routes/`, `models/`, `services/ai_engine.py`, `data/drug_database.py` | 🔴 High | Medium | 1.5 days | [ ] |
| R-2 | **SMILES Validation** — Add server-side SMILES format validation before hitting the AI API (reject invalid SMILES early, save API costs) | 🔴 High | Easy | 0.5 day | [ ] |
| R-3 | **API Rate Limiting** — Add rate limiting middleware to prevent abuse (`slowapi` or custom) | 🔴 High | Easy | 0.5 day | [ ] |
| R-4 | **Input Sanitization** — Ensure all `/api/analyze` inputs are sanitized against injection (SMILES, drug_name, dose) | 🔴 High | Easy | 0.5 day | [ ] |
| R-5 | **Error Handling & Retry** — Add AI API retry logic (max 2 retries on timeout/failure) with exponential backoff | 🟡 Medium | Medium | 1 day | [ ] |
| R-6 | **Environment Security Audit** — Ensure no API keys in code, rotate HF_API_KEY, validate `.env` files are gitignored | 🔴 High | Easy | 0.5 day | [ ] |

### Sprint 2 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| R-7 | **User Authentication** — JWT auth system (FastAPI + React) with signup/login/logout | 🔴 High | Hard | 3 days | [ ] |
| R-8 | **Drug Comparison API** — Build `POST /api/compare` endpoint for side-by-side analysis of 2+ drugs | 🔴 High | Hard | 2 days | [ ] |
| R-9 | **CORS Hardening** — Restrict CORS to specific frontend origins (replace wildcard `*`) | 🟡 Medium | Easy | 0.5 day | [ ] |
| R-10 | **HTTPS & Security Headers** — Add `X-Content-Type-Options`, `X-Frame-Options`, CSP headers | 🟡 Medium | Easy | 0.5 day | [ ] |

---

## ⚡ Shantanu — Frontend Specialist

> *Owns everything the user sees — design, UX polish, and visual wow factor*

### Sprint 1 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| S-1 | **Refactor `AnalysisPage.js`** — Break the 729-line monster into clean components: `SolubilityPanel.jsx`, `ExcipientPanel.jsx`, `StabilityPanel.jsx`, `PKPanel.jsx`, `MoleculeOverview.jsx`, `DrugInfoBar.jsx` | 🔴 High | Medium | 1.5 days | [ ] |
| S-2 | **Loading Experience Overhaul** — Replace the plain "please wait" text with a step-by-step progress indicator: *Parsing structure → Computing solubility → Selecting excipients → Forecasting stability → Modeling PK...* | 🔴 High | Medium | 1.5 days | [ ] |
| S-3 | **Mobile Responsive Design** — Make `LandingPage` + `AnalysisPage` fully responsive (breakpoints: 768px, 1024px). Key fixes: hero section stacking, 4-panel grid → single column, nav hamburger menu | 🟡 Medium | Medium | 2 days | [ ] |
| S-4 | **Hover & Micro-animations** — Add subtle scale/glow effects on GlassCards, smooth expand on NLSummary blocks, fade-in on scroll for feature cards | 🟢 Low | Easy | 1 day | [ ] |

### Sprint 2 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| S-5 | **Drug Comparison UI** — Build side-by-side comparison page with overlaid PK curves, parameter diff highlighting (pairs with Rishav's R-8) | 🔴 High | Hard | 2.5 days | [ ] |
| S-6 | **Analysis History Page** — Build the "My Analyses" list view with search, filter (Known/Experimental), and click-to-reopen | 🟡 Medium | Medium | 2 days | [ ] |
| S-7 | **Interactive Onboarding Tour** — First-time user tooltip walkthrough highlighting key features | 🟢 Low | Easy | 1 day | [ ] |
| S-8 | **Dark/Light Theme Toggle** — CSS variables swap for a light mode option | 🟢 Low | Medium | 1 day | [ ] |

---

## 📝 Aditya — QA & Documentation Lead

> *Ensures the product works, is well-documented, and properly configured*

### Sprint 1 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| A-1 | **Backend Unit Tests** — Write pytest tests for all API routes: `GET /api/drugs`, `GET /api/drugs/{name}`, `POST /api/analyze` (mock AI), `GET /api/molecule3d`, `GET /api/analyses` | 🔴 High | Easy | 1.5 days | [ ] |
| A-2 | **Frontend Component Tests** — Add React Testing Library tests for `LandingPage` form submission, `MoleculeViewer` states (idle/loading/ready/error), DB search dropdown | 🟡 Medium | Medium | 1.5 days | [ ] |
| A-3 | **Update README.md** — Fix outdated info (says GPT-4o but uses Llama-3.3), add setup troubleshooting, screenshots, contribution guide | 🔴 High | Easy | 0.5 day | [ ] |
| A-4 | **Environment Setup** — Create proper `.env.example` files for both frontend and backend, add a `docker-compose.yml` for one-command local setup | 🟡 Medium | Easy | 1 day | [ ] |
| A-5 | **SEO & Meta Tags** — Add `<title>`, `<meta description>`, Open Graph tags for social sharing previews in `public/index.html` | 🟢 Low | Easy | 0.5 day | [ ] |
| A-6 | **Error Boundary Components** — Wrap each analysis panel in React error boundaries so one panel failure doesn't crash the whole page | 🟡 Medium | Easy | 0.5 day | [ ] |

### Sprint 2 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| A-7 | **Integration Tests** — End-to-end tests: submit SMILES → verify analysis response structure → check MongoDB write | 🟡 Medium | Medium | 1.5 days | [ ] |
| A-8 | **API Documentation** — Auto-generate OpenAPI/Swagger docs from FastAPI (already built-in, just polish descriptions) | 🟡 Medium | Easy | 0.5 day | [ ] |
| A-9 | **Test Coverage Report** — Set up pytest-cov, target 80%+ backend coverage | 🟡 Medium | Easy | 0.5 day | [ ] |
| A-10 | **Accessibility Audit** — Add aria-labels, keyboard navigation, screen reader support for key flows | 🟢 Low | Medium | 1 day | [ ] |

---

## 🎯 Ani — Product Engineer

> *Thinks in user journeys — designs features that transform a prototype into a product*

### Sprint 1 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| N-1 | **Analysis Dashboard Redesign** — Design UX flow for "My Analyses" dashboard: card layout, favoriting, notes, sorting (by date/drug/score) | 🔴 High | Medium | 2 days | [ ] |
| N-2 | **Shareable Report Links** — Design + implement unique URL generation for each analysis (`/analysis/:id`), copy-to-clipboard, social sharing | 🔴 High | Medium | 1.5 days | [ ] |
| N-3 | **User Journey Mapping** — Create user flow diagrams for: new user → first analysis → comparison → share report | 🟡 Medium | Easy | 1 day | [ ] |
| N-4 | **Feature Prioritization Doc** — Write a prioritized feature backlog with impact/effort scoring (use RICE framework) | 🟡 Medium | Easy | 0.5 day | [ ] |

### Sprint 2 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| N-5 | **Drug Interaction Checker** — Design UX for checking drug-drug interactions: input 2+ SMILES → show interaction risks | 🔴 High | Hard | 3 days | [ ] |
| N-6 | **Feedback & Rating System** — Users rate AI prediction accuracy (👍/👎 + optional comment per panel). Store in MongoDB for training signal | 🟡 Medium | Medium | 1.5 days | [ ] |
| N-7 | **Analytics Dashboard** — Track usage stats: total analyses, most popular drugs, avg latency, user retention. Simple admin view | 🟡 Medium | Medium | 2 days | [ ] |
| N-8 | **Batch Analysis Flow** — Design UX for uploading CSV of SMILES → progress bar → downloadable batch report | 🟡 Medium | Medium | 1.5 days | [ ] |

---

## 📊 Vaibhav — Data Engineer

> *Owns data pipelines, analysis collection, and scaling the data infrastructure*

### Sprint 1 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| V-1 | **MongoDB Schema Design** — Design proper collections: `users`, `analyses`, `comparisons`, `feedback`. Add indexes on `smiles`, `drug_name`, `timestamp` | 🔴 High | Medium | 1.5 days | [ ] |
| V-2 | **Analysis Data Pipeline** — Build a pipeline to enrich analysis results: auto-tag BCS class, flag outlier predictions, compute confidence scores | 🔴 High | Hard | 2.5 days | [ ] |
| V-3 | **PubChem Data Scraper** — Script to bulk-fetch drug properties from PubChem API (MW, LogP, pKa, SMILES) and populate the database | 🟡 Medium | Medium | 1.5 days | [ ] |
| V-4 | **Data Validation Layer** — Add validation that AI-returned JSON matches expected schema before saving to MongoDB (reject malformed responses) | 🔴 High | Easy | 1 day | [ ] |

### Sprint 2 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| V-5 | **Analytics Collection** — Instrument the backend to log: analysis count per drug, avg latency, error rates, most-searched SMILES | 🟡 Medium | Medium | 1.5 days | [ ] |
| V-6 | **Data Export API** — `GET /api/export` endpoint to download analysis data as CSV/JSON for research use | 🟡 Medium | Easy | 1 day | [ ] |
| V-7 | **Redis Caching Layer** — Cache AI analysis results by SMILES hash (avoid re-running identical queries) | 🔴 High | Medium | 2 days | [ ] |
| V-8 | **Backup & Recovery** — Set up MongoDB backup strategy (daily snapshots, point-in-time recovery) | 🟡 Medium | Medium | 1 day | [ ] |

---

## 💊 Himanshu — Database Expansion

> *Grows the drug database by 10+ drugs every week from DrugBank/PubChem*

### Weekly Recurring Task
- [ ] **Add 10 new drugs to `DRUG_DATABASE` in `server.py`** each week — copy from DrugBank with verified SMILES, MW, LogP, pKa, BCS class, therapeutic class, route

### Sprint 1 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| H-1 | **Week 1 Expansion: Cardiovascular Drugs** — Add 10 drugs: Diltiazem, Verapamil, Digoxin, Spironolactone, Propranolol, Nifedipine, Carvedilol, Ramipril, Candesartan, Bisoprolol | 🟡 Medium | Easy | 1 day | [ ] |
| H-2 | **Week 2 Expansion: Anti-infective Drugs** — Add 10 drugs: Azithromycin, Levofloxacin, Fluconazole, Acyclovir, Oseltamivir, Rifampicin, Trimethoprim, Nitrofurantoin, Clindamycin, Vancomycin | 🟡 Medium | Easy | 1 day | [ ] |
| H-3 | **Data Verification Script** — Create a simple Python script to validate all SMILES in the database are valid (length check, bracket matching, allowed characters) | 🟡 Medium | Easy | 0.5 day | [ ] |
| H-4 | **Drug Category Tags** — Add `category` field to each drug entry (Cardiovascular, CNS, Anti-infective, Oncology, etc.) for frontend filtering | 🟢 Low | Easy | 0.5 day | [ ] |

### Sprint 2 Tasks

| # | Task | Priority | Difficulty | Est. Time | Status |
|---|------|----------|-----------|-----------|--------|
| H-5 | **Week 3 Expansion: CNS Drugs** — Add 10 drugs: Levetiracetam, Carbamazepine, Valproic Acid, Lithium, Risperidone, Quetiapine, Duloxetine, Venlafaxine, Bupropion, Escitalopram | 🟡 Medium | Easy | 1 day | [ ] |
| H-6 | **Week 4 Expansion: Oncology Drugs** — Add 10 drugs: Imatinib, Erlotinib, Sorafenib, Sunitinib, Capecitabine, Cyclophosphamide, Doxorubicin, Paclitaxel, Cisplatin, Rituximab | 🟡 Medium | Easy | 1 day | [ ] |
| H-7 | **DrugBank Integration** — Research DrugBank API access for automated drug property fetching (coordinate with Vaibhav) | 🟢 Low | Easy | 1 day | [ ] |
| H-8 | **Database README** — Document the drug database format, required fields, and how to add new entries | 🟢 Low | Easy | 0.5 day | [ ] |

---

## 📋 Cross-Team Milestones

| Milestone | Date | Owner(s) | Dependencies |
|-----------|------|----------|-------------|
| Backend refactored into modules | End of Week 1 | Rishav | None |
| Frontend components split | End of Week 1 | Shantanu | None |
| 80%+ test coverage | End of Week 2 | Aditya | Rishav (R-1) |
| Drug database at 50 drugs | End of Week 2 | Himanshu | None |
| MongoDB schema finalized | End of Week 1 | Vaibhav | None |
| Comparison feature live | End of Week 4 | Rishav + Shantanu | R-8, S-5 |
| Shareable links working | End of Week 3 | Ani | R-1 |
| Auth system deployed | End of Week 6 | Rishav | R-1 |
| Drug database at 70 drugs | End of Week 4 | Himanshu | None |
| Demo-ready product | End of Week 6 | All | All above |

---

## 🔄 Daily Standup Format

Each team member posts in group chat daily:
```
🟢 Yesterday: [what you finished]
🔵 Today: [what you're working on]
🔴 Blockers: [anything blocking you]
```

---

> *6 minds, 1 mission: From Molecule to Medicine in Seconds 🧬*
