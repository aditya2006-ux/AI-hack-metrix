# PHARMA-AI - Product Requirements Document

## Original Problem Statement
Build a full-stack application called "PHARMA-AI" serving as an "AI-Driven Optimization of Formulation Science and PK-Compatible Dosage Forms" platform. The system accepts a chemical's SMILES string as input and uses GPT-4o to perform comprehensive pharmaceutical analysis.

## Core Requirements
- Accept SMILES string as primary input
- AI-powered analysis: Solubility, Excipients, Stability, PK-Compatibility
- Interactive 3D molecule visualization (3Dmol.js)
- Pre-populated drug database (30+ drugs)
- Support for experimental/novel drugs
- Professional PDF report generation
- Glassmorphism UI design

## Technology Stack
- **Frontend**: React 18, Tailwind CSS, Recharts, 3Dmol.js, jsPDF
- **Backend**: FastAPI, Python 3.11, aiohttp
- **AI**: Llama-3.3-70B-Instruct (via Hugging Face Inference API)
- **External API**: PubChem (3D molecular structures)

## Architecture
```
/app/
├── backend/
│   ├── server.py       # FastAPI with /api/drugs, /api/analyze, /api/molecule3d
│   └── database.py     # Hardcoded 30-drug list
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.js   # Input form, drug selection
│       │   └── AnalysisPage.js  # Results, charts, PDF export
│       └── components/
│           └── MoleculeViewer.js # 3Dmol.js visualization
├── README.md
└── TECHNICAL_OVERVIEW.md
```

## Completed Features (as of Feb 2025)
- [x] Full-stack React + FastAPI application
- [x] GPT-4o AI analysis integration
- [x] 3D molecule viewer (3Dmol.js + PubChem)
- [x] PDF export with colorful reports
- [x] Drug database (30 compounds)
- [x] 3-section input form (DB dropdown, SMILES, name)
- [x] Natural language AI summaries
- [x] Bug fixes (3D viewer crash, PDF gibberish)
- [x] TECHNICAL_OVERVIEW.md documentation
- [x] Professional README.md
- [x] Platform branding removal (.emergent deleted)
- [x] Switched AI engine from GPT-4o to Llama-3.3-70B-Instruct (Hugging Face)

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Health check |
| GET | `/api/drugs` | List all drugs |
| POST | `/api/analyze` | Run formulation analysis |
| POST | `/api/molecule3d` | Get 3D structure |

## Future Roadmap

### P1 - Upcoming
- Create presentation slides (if requested)

### P2 - Future Enhancements
- Migrate drug database to MongoDB
- Modularize server.py into separate files
- RDKit WebAssembly for offline 3D generation
- Drug comparison tool (side-by-side)
- Analysis history with user accounts

### P3 - Long-term
- Lab Data Integration (LIMS APIs)
- Advanced PK/PD Simulation (SimCYP/GastroPlus)
- ICH M9 biowaiver assessment
- FDA/EMA regulatory pathway recommendations

## Notes
- Application uses hardcoded drug list (not MongoDB)
- AI powered by Hugging Face Llama-3.3-70B-Instruct (open-source)
- 3D viewer depends on PubChem API availability
