# PHARMA-AI

## AI-Driven Optimization of Formulation Science and PK-Compatible Dosage Forms

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-green.svg)](https://python.org)
[![React 18](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)](https://fastapi.tiangolo.com)

**PHARMA-AI** transforms pharmaceutical formulation science by delivering comprehensive drug analysis in under 30 seconds. Simply input a molecular SMILES string, and receive AI-powered predictions for solubility, excipient selection, stability, and pharmacokinetics—complete with interactive 3D visualization.

---

## The Problem

Pharmaceutical formulation is one of the most expensive and time-consuming stages in drug development:

- **~90% of drug candidates fail** during development, many due to poor formulation decisions
- Formulation scientists manually cross-reference solubility databases, excipient charts, ICH guidelines, and PK literature—a process taking **days to weeks per compound**
- **Experimental drugs** have no existing formulation data; scientists are flying blind
- The gap between lab synthesis and clinical-grade dosage form costs **$2.6 billion per drug**

## The Solution

PHARMA-AI bridges this gap. Given only a SMILES string—the universal chemical language—it delivers a complete, AI-powered formulation analysis in seconds.

---

## Features

### Core Analysis Modules

| Module | What You Get |
|--------|-------------|
| **Solubility Prediction** | Solubility score (0-100), BCS classification, aqueous solubility, enhancement strategies |
| **Excipient Recommendation** | AI-selected binders, fillers, disintegrants, lubricants with concentrations and rationale |
| **Stability Forecasting** | Shelf-life prediction, ICH accelerated degradation data, storage conditions, packaging |
| **PK-Compatibility** | Bioavailability %, Tmax, T½, plasma concentration-time curve, metabolism, excretion |

### Key Capabilities

- **SMILES-First Input**: Works for any molecule—including unnamed experimental compounds
- **Interactive 3D Visualization**: Real-time WebGL molecular rendering via 3Dmol.js
- **Plain English Summaries**: AI-generated explanations for judges, investors, and clinical teams
- **Professional PDF Reports**: Colorful, multi-page exports with charts and data tables
- **30+ Drug Database**: Pre-loaded reference compounds with verified properties

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (optional, for analysis history)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pharma-ai.git
cd pharma-ai

# Backend setup
cd backend
pip install -r requirements.txt

# Frontend setup
cd ../frontend
yarn install
```

### Environment Variables

Create `backend/.env`:
```env
HF_API_KEY=your_huggingface_api_key
HF_MODEL=meta-llama/Llama-3.3-70B-Instruct
MONGO_URL=mongodb://localhost:27017  # Optional
DB_NAME=pharma_ai
```

Create `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Running the Application

```bash
# Terminal 1: Start backend
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2: Start frontend
cd frontend
yarn start
```

Visit `http://localhost:3000` to access PHARMA-AI.

---

## Usage

### Option 1: Select from Database
Choose from 30 pre-loaded drugs (Aspirin, Ibuprofen, Metformin, etc.) for instant analysis.

### Option 2: Enter SMILES String
Paste any valid SMILES notation:
```
Aspirin:     CC(=O)Oc1ccccc1C(=O)O
Ibuprofen:   CC(C)Cc1ccc(cc1)C(C)C(=O)O
Experimental: c1ccc2c(c1)cc(=O)n2Cc1ccc(cc1)C(=O)N1CCCC1
```

### Option 3: Experimental Compounds
For novel molecules with no name—just enter the SMILES. PHARMA-AI uses structural analysis to predict all formulation parameters.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PHARMA-AI Platform                          │
├───────────────────────┬─────────────────────────────────────────────┤
│     FRONTEND          │              BACKEND                        │
│   React 18 SPA        │         FastAPI (Python)                    │
│   ─────────────────   │         ────────────────                    │
│   • Landing Page      │         • REST API (/api/*)                 │
│     - DNA Helix Hero  │         • POST /api/analyze                 │
│     - 3-section form  │         • POST /api/molecule3d              │
│   • Analysis Dashboard│         • GET  /api/drugs                   │
│     - 4 glass panels  │                                             │
│     - Charts          │         ┌──────────────────┐               │
│   • 3D Mol Viewer     │         │   GPT-4o (OpenAI) │               │
│   • PDF Export        │         │  Formulation AI   │               │
│                       │         └──────────────────┘               │
│   Port: 3000          │                  │                          │
│                       │         ┌────────▼─────────┐               │
│                       │         │   PubChem API     │               │
│                       │         │  3D SDF Retrieval │               │
│                       │         └──────────────────┘               │
│                       │         Port: 8001                          │
└───────────────────────┴─────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | Single-page application framework |
| Recharts | Bioavailability and stability charts |
| 3Dmol.js | WebGL-based 3D molecular visualization |
| jsPDF | Professional PDF report generation |
| Tailwind CSS | Utility-first styling |

### Backend
| Technology | Purpose |
|-----------|---------|
| FastAPI | Async REST API framework |
| Python 3.11 | Runtime |
| aiohttp | Async HTTP client for external APIs |
| Llama-3.3-70B | Core AI formulation engine (Hugging Face) |

### External Services
| Service | Usage |
|--------|-------|
| Llama-3.3-70B-Instruct | AI formulation analysis (via Hugging Face) |
| PubChem REST API | 3D molecular structure retrieval |

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Health check |
| GET | `/api/drugs` | List all drugs in database |
| POST | `/api/analyze` | Run full formulation analysis |
| POST | `/api/molecule3d` | Get 3D structure from SMILES |

### Example: Analyze a Compound

```bash
curl -X POST http://localhost:8001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"smiles": "CC(=O)Oc1ccccc1C(=O)O", "drug_name": "Aspirin"}'
```

---

## Scientific Methodology

### Why SMILES?

SMILES (Simplified Molecular Input Line Entry System) was chosen because:

1. **Universal**: All chemistry databases and tools use SMILES
2. **Complete**: Encodes atoms, bonds, rings, chirality, aromaticity
3. **Works for unknowns**: Chemists always have the SMILES—even for unnamed compounds
4. **AI-compatible**: Llama-3.3 can reason about functional groups from SMILES

### BCS Classification System

| Class | Solubility | Permeability | Examples |
|-------|-----------|--------------|---------|
| I | High | High | Aspirin, Metoprolol |
| II | Low | High | Ibuprofen, Simvastatin |
| III | High | Low | Metformin, Gabapentin |
| IV | Low | Low | Furosemide, Ciprofloxacin |

---

## Use Cases

1. **Pre-formulation Screening**: Identify the best drug candidates before expensive formulation work
2. **Experimental Drug Development**: Get instant formulation guidance for novel compounds
3. **Generic Drug Reformulation**: Redesign patent-expired drugs for new delivery systems
4. **Investor Due Diligence**: Quickly assess manufacturability of startup compounds
5. **Academic Teaching**: Bridge chemistry courses and industrial formulation practice

---

## Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| AI-generated predictions | Not experimentally validated | Cross-validate with known drugs |
| PubChem 3D dependency | Some SMILES may not have 3D data | Graceful fallback in UI |
| Single conformer analysis | May miss bioactive conformations | Future: ensemble analysis |

---

## Future Roadmap

- **Phase 2**: RDKit WebAssembly for offline 3D generation, ADMET ML models
- **Phase 3**: Drug comparison tool, analysis history, team collaboration
- **Phase 4**: ICH M9 biowaiver assessment, FDA/EMA pathway recommendations

---

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Meta AI for Llama-3.3-70B formulation reasoning
- Hugging Face for inference infrastructure
- PubChem for molecular structure data
- 3Dmol.js for WebGL visualization
- The pharmaceutical science community

---

**PHARMA-AI — From Molecule to Medicine in Seconds**

*Bridging the gap between the lab and the clinic*
