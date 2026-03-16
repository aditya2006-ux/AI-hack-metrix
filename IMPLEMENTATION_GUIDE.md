# 🛰️ PHARMA-AI Implementation Guide

> A detailed technical blueprint for building each stage of the PHARMA-AI platform.
> Inspired by Insilico Medicine's Pharma.AI stack, adapted for open, desktop-first deployment.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PHARMA-AI Platform                          │
├───────────┬───────────┬───────────┬───────────┬─────────┬──────────┤
│ Stage 1   │ Stage 2   │ Stage 3   │ Stage 4   │ Stage 5 │ Stage 6  │
│ Chemistry │ Target &  │ Drug      │ Clinical  │ Digital │ Enterprise│
│ Intel     │ Mechanism │ Discovery │ Intel     │ Lab     │ Platform  │
├───────────┴───────────┴───────────┴───────────┴─────────┴──────────┤
│                    Stage 7 — AI Research Agent                      │
│               (Orchestrates all modules via LLM)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1 — Chemistry Intelligence ✅ (Current State)

### What Exists
| Component | Status | File |
|-----------|--------|------|
| SMILES parser & molecular descriptors | ✅ Done | `backend/server.py` |
| AI formulation engine (Llama-3.3-70B) | ✅ Done | `backend/server.py` |
| Solubility / Excipient / Stability / PK panels | ✅ Done | `frontend/src/pages/AnalysisPage.js` |
| 3D Molecular Viewer (3Dmol.js) | ✅ Done | `frontend/src/components/MoleculeViewer.js` |
| PDF report export | ✅ Done | `AnalysisPage.js` |
| Mock AI mode for testing | ✅ Done | `backend/server.py` |

### What to Enhance (Sprint 1–2 priority)
1. **Expanded molecular property predictions** — add pKa, permeability (Caco-2), and explicit toxicity flags using RDKit descriptors.
2. **RDKit integration** — compute Lipinski violations, TPSA, rotatable bonds, HBD/HBA server-side.
3. **ADMET transformers** — integrate open-source ADMET prediction models (e.g., [ADMETlab 3.0](https://admetlab3.scbdd.com/), [TDC benchmarks](https://tdcommons.ai/)).

### Implementation Details

#### RDKit Descriptor Engine
```
File: backend/services/rdkit_engine.py (NEW)

Dependencies: rdkit-pypi >= 2024.03

Functions:
  compute_descriptors(smiles: str) -> dict
    Returns: MW, LogP, TPSA, HBD, HBA, rotatable bonds, Lipinski violations,
             aromatic rings, fraction Csp3, molar refractivity

  check_drug_likeness(smiles: str) -> dict
    Returns: lipinski_pass, veber_pass, ghose_pass, lead_likeness

  predict_solubility_esol(smiles: str) -> float
    ESOL model using RDKit descriptors

  get_structural_alerts(smiles: str) -> list
    PAINS filters, Brenk filters for toxicophores
```

#### ADMET Prediction Service
```
File: backend/services/admet_service.py (NEW)

Models (download from Hugging Face or TDC):
  - Caco-2 permeability classifier
  - hERG toxicity predictor
  - CYP inhibition predictor (3A4, 2D6, 2C9)
  - Clearance predictor
  - BBB penetration classifier

Input: SMILES string
Output: {
  absorption: { caco2_permeability, intestinal_absorption, pgp_substrate },
  distribution: { bbb_penetration, vdss, plasma_protein_binding },
  metabolism: { cyp3a4_inhibitor, cyp2d6_inhibitor, cyp2c9_inhibitor },
  excretion: { clearance, half_life },
  toxicity: { herg_blocker, ames_mutagenicity, hepatotoxicity, ld50 }
}
```

---

## Stage 2 — Target & Mechanism Layer

### Goal
Given a SMILES string, predict which **protein targets** the molecule likely binds to, and map those targets to **biological pathways** and **diseases**.

### Data Sources
| Dataset | What It Provides | Access |
|---------|-----------------|--------|
| ChEMBL | Bioactivity data (IC50, Ki, EC50) for millions of compounds | Free REST API |
| BindingDB | Measured binding affinities for drug-target pairs | Free download |
| UniProt | Protein sequences, structures, functions | Free REST API |
| KEGG Pathway | Biological pathway maps | Free API |
| DisGeNET | Gene-disease associations | Free academic |

### Implementation Details

#### Target Prediction Engine
```
File: backend/services/target_predictor.py (NEW)

Approach 1 — Similarity-based:
  1. Compute Morgan fingerprints (radius=2, 2048 bits) for input SMILES
  2. Search ChEMBL for compounds with Tanimoto similarity > 0.7
  3. Retrieve protein targets of similar compounds
  4. Rank by frequency and binding affinity

Approach 2 — ML-based:
  1. Train a multi-label classifier on ChEMBL bioactivity data
  2. Input: Morgan fingerprints → Output: target probability vector
  3. Model: Graph Neural Network or Random Forest ensemble

Output schema:
  {
    targets: [
      { protein: "EGFR", uniprot_id: "P00533", probability: 0.92,
        pathways: ["MAPK signaling", "ErbB signaling"],
        diseases: ["Non-small cell lung cancer", "Glioblastoma"] }
    ]
  }
```

#### Network Pharmacology Visualizer
```
File: frontend/src/components/DrugTargetNetwork.js (NEW)

Library: vis-network or cytoscape.js

Graph structure:
  Nodes: Drug (center), Targets (ring 1), Pathways (ring 2), Diseases (ring 3)
  Edges: weighted by binding probability or pathway involvement

User interactions:
  - Click target node → show binding details
  - Click pathway → show pathway diagram
  - Click disease → show related drugs
```

#### API Endpoints
```
POST /api/predict-targets
  Input: { smiles: str }
  Output: { targets: [...], pathways: [...], diseases: [...] }

GET /api/target/{uniprot_id}
  Output: { protein_name, function, pdb_structures, known_drugs }

GET /api/pathway/{pathway_id}
  Output: { name, description, genes, drugs_in_pathway }
```

---

## Stage 3 — Drug Discovery Engine

### Goal
Generate **new optimized molecules** for a given protein target and predict **binding affinity** via docking simulation.

### Molecule Generation

#### Approach: Reinforcement Learning + SELFIES
```
File: backend/services/molecule_generator.py (NEW)

Pipeline:
  1. User specifies target protein + desired properties
  2. Generator creates candidate SELFIES strings (robust molecular representation)
  3. Each candidate scored by:
     - Drug-likeness (Lipinski)
     - Predicted binding affinity
     - Synthetic accessibility score (SA score)
     - ADMET profile
  4. Top candidates returned with SMILES + scores

Models (pick one):
  - REINVENT 4 (open-source, AstraZeneca): RL-based molecule optimization
  - MolGPT: Transformer-based SMILES generation
  - FREED: Fragment-based drug design

Output:
  {
    candidates: [
      { smiles: "CC(=O)Oc1ccccc1C(=O)O", sa_score: 2.1,
        drug_likeness: 0.89, predicted_affinity: -8.2,
        properties: { MW: 180.16, LogP: 1.2, ... } }
    ]
  }
```

### Docking Simulation

#### Integration with AutoDock Vina
```
File: backend/services/docking_engine.py (NEW)

Dependencies:
  - AutoDock Vina (pip install vina)
  - Open Babel (for format conversion)
  - RDKit (for 3D conformer generation)

Pipeline:
  1. Fetch target protein structure from PDB/AlphaFold
  2. Prepare receptor (remove water, add hydrogens)
  3. Generate 3D conformer of ligand from SMILES
  4. Define binding box (use known active site or fpocket prediction)
  5. Run Vina docking
  6. Return binding affinity (kcal/mol) and binding pose

Output:
  {
    binding_affinity: -8.5,
    pose_pdb: "...",  // 3D coordinates of docked ligand
    interactions: [
      { type: "hydrogen_bond", residue: "ASP381", distance: 2.1 },
      { type: "hydrophobic", residue: "LEU384", distance: 3.5 }
    ]
  }
```

#### Docking Visualization
```
File: frontend/src/components/DockingViewer.js (NEW)

Library: 3Dmol.js (already in project)

Features:
  - Show protein surface + ligand in binding pocket
  - Highlight hydrogen bonds and hydrophobic contacts
  - Toggle surface/cartoon/stick representations
  - Animation: ligand entering binding pocket
```

---

## Stage 4 — Clinical Intelligence

### Goal
Predict **clinical trial success probability** and assist in **trial design**.

### Trial Success Predictor
```
File: backend/services/clinical_predictor.py (NEW)

Input:
  {
    drug_smiles: str,
    target: str,
    disease: str,
    phase: "I" | "II" | "III",
    trial_design: { sample_size, duration, endpoints }
  }

Model architecture:
  - Multi-modal: drug features (fingerprints) + target features (protein embeddings)
                  + disease features (MeSH embeddings) + trial features
  - Trained on ClinicalTrials.gov outcome data
  - Baseline: gradient boosting on engineered features
  - Advanced: transformer on clinical trial text + molecular features

Output:
  {
    success_probability: { phase_1: 0.78, phase_2: 0.45, phase_3: 0.32 },
    risk_factors: ["Low oral bioavailability", "Narrow therapeutic index"],
    comparable_trials: [{ nct_id, drug, outcome, similarity }]
  }
```

### Trial Design Assistant
```
File: backend/services/trial_designer.py (NEW)

Input: { drug, target, disease, indication }

Output:
  {
    suggested_sample_size: 120,
    suggested_duration_months: 18,
    primary_endpoint: "Overall Response Rate",
    secondary_endpoints: ["Progression-Free Survival", "Safety"],
    inclusion_criteria: [...],
    exclusion_criteria: [...],
    suggested_biomarkers: ["EGFR mutation status", "PD-L1 expression"],
    comparator_arms: ["Standard of care", "Placebo"]
  }

Data sources:
  - ClinicalTrials.gov API (free)
  - FDA Orange Book
  - PubMed (via Entrez API)
```

---

## Stage 5 — Digital Lab

### Goal
Run **virtual experiments** simulating drug behavior in silico.

### Components
```
1. Virtual Metabolism Simulator
   - Predict CYP450 metabolism sites
   - Generate metabolite structures
   - Model: SmartCyp or GLORYx (open-source)

2. Toxicity Simulator
   - Organ-specific toxicity (liver, kidney, heart)
   - Model: ProTox-3 or pkCSM

3. Virtual Patient Population
   - Generate synthetic patient cohorts with varying:
     - Age, weight, organ function
     - Genetic polymorphisms (CYP2D6 poor/extensive metabolizers)
   - Run PK simulations per cohort
   - Model: Population PK (compartmental models)
```

---

## Stage 6 — Enterprise Platform

### Goal
Transform PHARMA-AI into a **SaaS platform** for pharma companies.

### Architecture Changes
```
Current:  Single-user local → 
Future:   Multi-tenant cloud with local deployment option

Components:
  1. Authentication & RBAC (role-based access control)
  2. Team workspaces with project folders
  3. API key management for programmatic access
  4. Data isolation per organization
  5. Audit logging for regulatory compliance
  6. Usage-based billing

Tech stack additions:
  - Auth: Clerk or Auth0
  - Database: PostgreSQL (multi-tenant) + MongoDB (analysis data)
  - Queue: Redis + Celery for async analysis jobs
  - Storage: S3-compatible for reports and exports
  - Deployment: Docker + Kubernetes
```

---

## Stage 7 — AI Research Agent

### Goal
Build a **conversational AI agent** that orchestrates all platform tools from natural language.

### Agent Architecture
```
┌──────────────────────────┐
│     User Prompt          │
│  "Analyze aspirin for    │
│   oral formulation"      │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│     LLM Brain            │
│  (Claude / GPT-4 /       │
│   Llama 3.3)             │
│  Decides which tools     │
│  to call and in what     │
│  order                   │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│     Tool Orchestrator    │
│  (LangChain / CrewAI)   │
├──────────────────────────┤
│  Tools:                  │
│  - molecule_analyzer     │
│  - admet_predictor       │
│  - target_predictor      │
│  - docking_engine        │
│  - clinical_predictor    │
│  - formulation_advisor   │
│  - pubmed_search         │
│  - pathway_lookup        │
└────────┬─────────────────┘
         ↓
┌──────────────────────────┐
│   Synthesized Response   │
│   with citations and     │
│   interactive panels     │
└──────────────────────────┘
```

### Agent Capabilities

| Capability | Example Prompt | Tools Used |
|-----------|---------------|------------|
| Molecule Analysis | "Analyze this SMILES for oral drug formulation" | molecule_analyzer, admet_predictor, formulation_advisor |
| Drug Discovery | "Design molecules for EGFR inhibition" | target_predictor, molecule_generator, docking_engine |
| Formulation | "Suggest excipients for this molecule" | molecule_analyzer, formulation_advisor |
| Research Copilot | "What diseases are linked to BRAF?" | pathway_lookup, pubmed_search |
| Clinical Planning | "Estimate trial success for this compound in lung cancer" | clinical_predictor, trial_designer |

### Implementation
```
File: backend/services/agent.py (NEW)

Framework: LangChain (Python)

Components:
  1. Tool definitions — wrap each service as a LangChain Tool
  2. Agent prompt — system prompt with tool descriptions and reasoning chain
  3. Memory — ConversationBufferMemory for multi-turn sessions
  4. Streaming — stream agent reasoning + tool outputs to frontend via WebSocket

Frontend:
  File: frontend/src/pages/AgentPage.js (NEW)
  - Chat interface with message bubbles
  - Inline tool execution cards (show which tool ran and result)
  - Suggested prompts sidebar
```

---

## The Feature Pyramid (Build Order)

```
         ╱╲
        ╱  ╲         Level 7: AI Research Agent
       ╱    ╲
      ╱──────╲       Level 6: Enterprise Platform
     ╱        ╲
    ╱──────────╲     Level 5: Digital Lab
   ╱            ╲
  ╱──────────────╲   Level 4: Clinical Prediction
 ╱                ╲
╱──────────────────╲  Level 3: Drug Discovery + Docking
╱                    ╲
╱────────────────────╲ Level 2: ADMET + Target Prediction
╱                      ╲
╱════════════════════════╲ Level 1: SMILES Analysis ✅ (YOU ARE HERE)
```

---

## Technology Stack Per Stage

| Stage | Backend | Frontend | Models / Data |
|-------|---------|----------|---------------|
| 1 ✅ | FastAPI, RDKit | React, 3Dmol.js, Recharts | Llama-3.3-70B |
| 2 | + ChEMBL API, BindingDB | + cytoscape.js | + Morgan FP similarity, GNN |
| 3 | + AutoDock Vina, Open Babel | + DockingViewer | + REINVENT, MolGPT |
| 4 | + ClinicalTrials.gov API | + Trial dashboard | + GBM / Transformer |
| 5 | + population PK solver | + Simulation viz | + SmartCyp, ProTox |
| 6 | + PostgreSQL, Redis, Celery | + Auth UI, Workspaces | + Multi-tenant infra |
| 7 | + LangChain, WebSocket | + Chat UI | + Claude / GPT-4 agent |

---

## Getting Started: Next Sprint Priority

**For immediate implementation (Sprint 3–4), focus on Stage 1 enhancement + Stage 2 foundations:**

1. **Add RDKit descriptor engine** (`backend/services/rdkit_engine.py`)
2. **Add ADMET prediction service** (`backend/services/admet_service.py`)
3. **Integrate ChEMBL similarity search** for basic target prediction
4. **Build drug-target network visualization** component
5. **Add new frontend panels** for ADMET results and target predictions

This keeps the platform grounded in chemistry excellence while opening the door to biology-layer features.

---

> *"Most AI drug discovery startups fail because they try to build everything at once. The smarter strategy is: become the best SMILES-analysis engine first. Then expand."*
