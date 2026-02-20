from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import uuid
import io
import urllib.parse
import aiohttp
from datetime import datetime, timezone
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="PHARMA-AI Formulation Optimizer")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Drug Database (SMILES + properties) ────────────────────────────────────────
DRUG_DATABASE = {
    "Aspirin": {
        "smiles": "CC(=O)Oc1ccccc1C(=O)O",
        "molecular_weight": 180.16,
        "molecular_formula": "C9H8O4",
        "logp": 1.19,
        "pka": 3.5,
        "bcs_class": "I",
        "therapeutic_class": "NSAID / Antiplatelet",
        "route": "Oral"
    },
    "Ibuprofen": {
        "smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
        "molecular_weight": 206.28,
        "molecular_formula": "C13H18O2",
        "logp": 3.97,
        "pka": 4.91,
        "bcs_class": "II",
        "therapeutic_class": "NSAID",
        "route": "Oral"
    },
    "Acetaminophen": {
        "smiles": "CC(=O)Nc1ccc(O)cc1",
        "molecular_weight": 151.16,
        "molecular_formula": "C8H9NO2",
        "logp": 0.46,
        "pka": 9.5,
        "bcs_class": "I",
        "therapeutic_class": "Analgesic / Antipyretic",
        "route": "Oral"
    },
    "Metformin": {
        "smiles": "CN(C)C(=N)NC(=N)N",
        "molecular_weight": 129.16,
        "molecular_formula": "C4H11N5",
        "logp": -1.43,
        "pka": 2.8,
        "bcs_class": "III",
        "therapeutic_class": "Antidiabetic (Biguanide)",
        "route": "Oral"
    },
    "Atorvastatin": {
        "smiles": "CC(C)c1c(C(=O)Nc2ccccc2F)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CC[C@@H](O)C[C@@H](O)CC(=O)O",
        "molecular_weight": 558.64,
        "molecular_formula": "C33H35FN2O5",
        "logp": 6.36,
        "pka": 4.46,
        "bcs_class": "II",
        "therapeutic_class": "Statin / Antilipidemic",
        "route": "Oral"
    },
    "Lisinopril": {
        "smiles": "OC(=O)[C@@H](CCc1ccccc1)N[C@@H](CC(=O)O)C(=O)N1CCC[C@H]1C(=O)O",
        "molecular_weight": 405.49,
        "molecular_formula": "C21H31N3O5",
        "logp": -1.54,
        "pka": 2.5,
        "bcs_class": "III",
        "therapeutic_class": "ACE Inhibitor / Antihypertensive",
        "route": "Oral"
    },
    "Omeprazole": {
        "smiles": "CC1=CN=C(C)C(CC2=NC3=CC=CC=C3N2)=C1",
        "molecular_weight": 345.42,
        "molecular_formula": "C17H19N3O3S",
        "logp": 2.23,
        "pka": 4.77,
        "bcs_class": "II",
        "therapeutic_class": "Proton Pump Inhibitor",
        "route": "Oral"
    },
    "Amoxicillin": {
        "smiles": "CC1(C)S[C@@H]2[C@H](NC(=O)[C@@H](N)c3ccc(O)cc3)C(=O)N2[C@H]1C(=O)O",
        "molecular_weight": 365.40,
        "molecular_formula": "C16H19N3O5S",
        "logp": 0.87,
        "pka": 2.4,
        "bcs_class": "I",
        "therapeutic_class": "Antibiotic (Penicillin)",
        "route": "Oral"
    },
    "Metoprolol": {
        "smiles": "CC(C)NCC(O)COc1ccc(CCOC)cc1",
        "molecular_weight": 267.36,
        "molecular_formula": "C15H25NO3",
        "logp": 1.88,
        "pka": 9.7,
        "bcs_class": "I",
        "therapeutic_class": "Beta-blocker / Antihypertensive",
        "route": "Oral"
    },
    "Simvastatin": {
        "smiles": "CCC(C)(C)C(=O)O[C@@H]1C[C@@H](C)C=C2C=C[C@H](C)[C@H](CC[C@@H]3C[C@@H](O)CC(=O)O3)[C@@H]12",
        "molecular_weight": 418.57,
        "molecular_formula": "C25H38O5",
        "logp": 4.68,
        "pka": 13.5,
        "bcs_class": "II",
        "therapeutic_class": "Statin / Antilipidemic",
        "route": "Oral"
    },
    "Amlodipine": {
        "smiles": "CCOC(=O)C1=C(COCCN)NC(C)=C(C(=O)OCC)C1c1ccccc1Cl",
        "molecular_weight": 408.88,
        "molecular_formula": "C20H25ClN2O5",
        "logp": 3.0,
        "pka": 8.6,
        "bcs_class": "I",
        "therapeutic_class": "Calcium Channel Blocker",
        "route": "Oral"
    },
    "Losartan": {
        "smiles": "CCCc1nc(-c2ccccc2Cl)c(-c2ccc(CN3C(=O)N(Cc4ccc(-c5ccccc5-c5nnn[nH]5)cc4)C3=S)cc2)o1",
        "molecular_weight": 422.91,
        "molecular_formula": "C22H23ClN6O",
        "logp": 4.01,
        "pka": 5.0,
        "bcs_class": "II",
        "therapeutic_class": "ARB / Antihypertensive",
        "route": "Oral"
    },
    "Warfarin": {
        "smiles": "OC(=O)CCCC1CC(=O)c2ccccc2O1",
        "molecular_weight": 308.33,
        "molecular_formula": "C19H16O4",
        "logp": 2.7,
        "pka": 5.05,
        "bcs_class": "I",
        "therapeutic_class": "Anticoagulant",
        "route": "Oral"
    },
    "Metronidazole": {
        "smiles": "Cc1ncc([N+](=O)[O-])n1CCO",
        "molecular_weight": 171.15,
        "molecular_formula": "C6H9N3O3",
        "logp": -0.02,
        "pka": 2.62,
        "bcs_class": "I",
        "therapeutic_class": "Antibiotic / Antiprotozoal",
        "route": "Oral"
    },
    "Ciprofloxacin": {
        "smiles": "OC(=O)c1cn(C2CC2)c2cc(N3CCNCC3)c(F)cc2c1=O",
        "molecular_weight": 331.34,
        "molecular_formula": "C17H18FN3O3",
        "logp": 0.28,
        "pka": 6.09,
        "bcs_class": "IV",
        "therapeutic_class": "Fluoroquinolone Antibiotic",
        "route": "Oral"
    },
    "Doxycycline": {
        "smiles": "OC1=C(C(=O)[C@H]2C[C@@H]3CC4=C(O)c5c(O)cccc5C(=O)[C@@]4(O)[C@H]3[C@H]2[C@@H]1C(N)=O)c(O)c1c(=C2)c(O)cccc1=O",
        "molecular_weight": 444.43,
        "molecular_formula": "C22H24N2O8",
        "logp": -0.02,
        "pka": 3.4,
        "bcs_class": "I",
        "therapeutic_class": "Tetracycline Antibiotic",
        "route": "Oral"
    },
    "Fluoxetine": {
        "smiles": "CNCCC(Oc1ccc(C(F)(F)F)cc1)c1ccccc1",
        "molecular_weight": 309.33,
        "molecular_formula": "C17H18F3NO",
        "logp": 4.05,
        "pka": 9.8,
        "bcs_class": "I",
        "therapeutic_class": "SSRI Antidepressant",
        "route": "Oral"
    },
    "Sertraline": {
        "smiles": "CNC1CCC(c2ccc(Cl)c(Cl)c2)c2ccccc21",
        "molecular_weight": 306.23,
        "molecular_formula": "C17H17Cl2N",
        "logp": 5.06,
        "pka": 9.47,
        "bcs_class": "II",
        "therapeutic_class": "SSRI Antidepressant",
        "route": "Oral"
    },
    "Alprazolam": {
        "smiles": "Cc1nnc2n1-c1ccc(Cl)cc1C(=Nc1ccccc1)CC2",
        "molecular_weight": 308.76,
        "molecular_formula": "C17H13ClN4",
        "logp": 2.12,
        "pka": 2.48,
        "bcs_class": "I",
        "therapeutic_class": "Benzodiazepine / Anxiolytic",
        "route": "Oral"
    },
    "Clopidogrel": {
        "smiles": "COC(=O)[C@@H](c1ccccc1Cl)N1CCc2sccc2C1",
        "molecular_weight": 321.82,
        "molecular_formula": "C16H16ClNO2S",
        "logp": 2.64,
        "pka": 4.55,
        "bcs_class": "I",
        "therapeutic_class": "Antiplatelet",
        "route": "Oral"
    },
    "Tamoxifen": {
        "smiles": "CCN(CC)/C=C/C(=C(\\c1ccccc1)/c1ccc(OCCN(CC)CC)cc1)c1ccccc1",
        "molecular_weight": 371.51,
        "molecular_formula": "C26H29NO",
        "logp": 6.3,
        "pka": 8.85,
        "bcs_class": "II",
        "therapeutic_class": "SERM / Anticancer",
        "route": "Oral"
    },
    "Morphine": {
        "smiles": "[C@@H]12[C@H]3CC4=CC(=C(O)C=C4[C@H]1[C@H](O)CC2)NC3",
        "molecular_weight": 285.34,
        "molecular_formula": "C17H19NO3",
        "logp": 0.9,
        "pka": 8.0,
        "bcs_class": "I",
        "therapeutic_class": "Opioid Analgesic",
        "route": "Oral / Parenteral"
    },
    "Gabapentin": {
        "smiles": "NCC1(CC(=O)O)CCCCC1",
        "molecular_weight": 171.24,
        "molecular_formula": "C9H17NO2",
        "logp": -1.1,
        "pka": 3.68,
        "bcs_class": "III",
        "therapeutic_class": "Anticonvulsant / Neuropathic Pain",
        "route": "Oral"
    },
    "Prednisolone": {
        "smiles": "[C@@]12(O)CC[C@H]3[C@@H](CCC4=CC(=O)C=C[C@@]34C)[C@@H]1CC[C@@H]2C(=O)CO",
        "molecular_weight": 360.44,
        "molecular_formula": "C21H28O5",
        "logp": 1.62,
        "pka": 12.6,
        "bcs_class": "I",
        "therapeutic_class": "Corticosteroid",
        "route": "Oral"
    },
    "Methotrexate": {
        "smiles": "CN(Cc1cnc2nc(N)nc(N)c2n1)c1ccc(CC(=O)O)cc1",
        "molecular_weight": 454.44,
        "molecular_formula": "C20H22N8O5",
        "logp": -1.85,
        "pka": 3.36,
        "bcs_class": "III",
        "therapeutic_class": "Antifolate / Anticancer",
        "route": "Oral / Parenteral"
    },
    "Furosemide": {
        "smiles": "NS(=O)(=O)c1cc(C(=O)O)c(NCc2ccco2)cc1Cl",
        "molecular_weight": 330.74,
        "molecular_formula": "C12H11ClN2O5S",
        "logp": 2.03,
        "pka": 3.9,
        "bcs_class": "IV",
        "therapeutic_class": "Loop Diuretic",
        "route": "Oral / IV"
    },
    "Hydrochlorothiazide": {
        "smiles": "NS(=O)(=O)c1cc2c(cc1Cl)NCNS2(=O)=O",
        "molecular_weight": 297.74,
        "molecular_formula": "C7H8ClN3O4S2",
        "logp": -0.07,
        "pka": 7.9,
        "bcs_class": "IV",
        "therapeutic_class": "Thiazide Diuretic",
        "route": "Oral"
    },
    "Levothyroxine": {
        "smiles": "NC(Cc1cc(I)c(Oc2cc(I)c(O)c(I)c2)c(I)c1)C(=O)O",
        "molecular_weight": 776.87,
        "molecular_formula": "C15H11I4NO4",
        "logp": 3.16,
        "pka": 2.2,
        "bcs_class": "II",
        "therapeutic_class": "Thyroid Hormone",
        "route": "Oral"
    },
    "Enalapril": {
        "smiles": "CCOC(=O)[C@@H](CCc1ccccc1)NC(C)C(=O)N1CCC[C@H]1C(=O)O",
        "molecular_weight": 376.45,
        "molecular_formula": "C20H28N2O5",
        "logp": 0.11,
        "pka": 3.0,
        "bcs_class": "III",
        "therapeutic_class": "ACE Inhibitor",
        "route": "Oral"
    },
    "Sildenafil": {
        "smiles": "CCCc1nn(C)c2c1nc(C)nc2N1CCN(Cc2ccc(S(=O)(=O)N3CCOCC3)cc2)CC1",
        "molecular_weight": 474.58,
        "molecular_formula": "C22H30N6O4S",
        "logp": 1.9,
        "pka": 5.97,
        "bcs_class": "II",
        "therapeutic_class": "PDE5 Inhibitor / Vasodilator",
        "route": "Oral"
    }
}

# ─── Pydantic Models ─────────────────────────────────────────────────────────────
class AnalysisRequest(BaseModel):
    smiles: str                              # SMILES is now the PRIMARY required field
    drug_name: Optional[str] = None         # Name is optional (for experimental drugs)
    molecular_weight: Optional[float] = None
    dose_mg: Optional[float] = None

class AnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    drug_name: str
    smiles: str
    molecular_weight: float
    dose_mg: float
    timestamp: str
    solubility: Dict[str, Any]
    excipients: Dict[str, Any]
    stability: Dict[str, Any]
    pk_compatibility: Dict[str, Any]
    drug_info: Dict[str, Any]

# ─── Routes ──────────────────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "PHARMA-AI Formulation Optimizer API", "version": "1.0.0"}

@api_router.get("/drugs")
async def get_drugs():
    drugs = []
    for name, info in DRUG_DATABASE.items():
        drugs.append({"name": name, **info})
    return {"drugs": drugs, "total": len(drugs)}

@api_router.get("/drugs/{drug_name}")
async def get_drug(drug_name: str):
    # Case-insensitive search
    for name, info in DRUG_DATABASE.items():
        if name.lower() == drug_name.lower():
            return {"name": name, **info}
    raise HTTPException(status_code=404, detail=f"Drug '{drug_name}' not found in database")

@api_router.get("/molecule3d")
async def get_molecule_3d(smiles: str = Query(..., description="SMILES string")):
    """Fetch 3D SDF from PubChem for a given SMILES string."""
    headers = {
        "User-Agent": "PHARMA-AI/1.0",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    try:
        async with aiohttp.ClientSession() as session:
            # Step 1: POST smiles to PubChem (avoids URL-path encoding issues)
            cid_url = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/cids/TXT"
            post_data = f"smiles={urllib.parse.quote(smiles, safe='')}"
            async with session.post(
                cid_url,
                data=post_data,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=20)
            ) as resp:
                resp_text = (await resp.text()).strip()
                if resp.status != 200 or not resp_text.isdigit() or resp_text == '0':
                    raise HTTPException(
                        status_code=404,
                        detail="Compound not found in PubChem. 3D visualization unavailable for this experimental structure."
                    )
                cid = resp_text.split("\n")[0].strip()

            # Step 2: Fetch 3D SDF by CID
            sdf_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/record/SDF?record_type=3d"
            async with session.get(
                sdf_url,
                headers={"User-Agent": "PHARMA-AI/1.0"},
                timeout=aiohttp.ClientTimeout(total=20)
            ) as resp:
                if resp.status != 200:
                    raise HTTPException(
                        status_code=404,
                        detail="3D conformer not available in PubChem for this compound."
                    )
                sdf_data = await resp.text()

            # Validate the SDF has actual 3D coordinate content
            if "V2000" not in sdf_data and "V3000" not in sdf_data:
                raise HTTPException(status_code=404, detail="Invalid SDF data returned from PubChem.")

        return {"sdf": sdf_data, "cid": cid, "source": "PubChem"}

    except aiohttp.ClientError as e:
        raise HTTPException(status_code=503, detail=f"PubChem service unavailable: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/analyze")
async def analyze_drug(request: AnalysisRequest):
    smiles = request.smiles.strip()
    if not smiles:
        raise HTTPException(status_code=400, detail="SMILES string is required.")

    # Try to match with database by name (optional) or by SMILES
    drug_info = None
    drug_name = request.drug_name or "Experimental Compound"

    if request.drug_name:
        for name, info in DRUG_DATABASE.items():
            if name.lower() == request.drug_name.lower():
                drug_info = info
                drug_name = name
                # If no custom SMILES override, use DB smiles
                if not request.smiles or request.smiles == info["smiles"]:
                    smiles = info["smiles"]
                break

    # If SMILES matches a known drug, auto-detect info
    if not drug_info:
        for name, info in DRUG_DATABASE.items():
            if info["smiles"].strip() == smiles.strip():
                drug_info = info
                if drug_name == "Experimental Compound":
                    drug_name = name
                break

    # is_experimental only when no DB entry was matched AND no name was provided by user
    is_experimental = (drug_info is None) and not bool(request.drug_name)

    mw = request.molecular_weight or (drug_info["molecular_weight"] if drug_info else 300.0)
    dose = request.dose_mg or 100.0
    bcs_class = drug_info.get("bcs_class", "Unknown") if drug_info else "Unknown"
    logp = drug_info.get("logp", "Unknown") if drug_info else "Unknown"
    pka = drug_info.get("pka", "Unknown") if drug_info else "Unknown"
    therapeutic_class = drug_info.get("therapeutic_class", "Unknown") if drug_info else "Unknown"
    route = drug_info.get("route", "Oral") if drug_info else "Oral"

    # AI Analysis using Hugging Face Llama-3.3-70B-Instruct
    hf_api_key = os.environ.get("HF_API_KEY")
    hf_model = os.environ.get("HF_MODEL", "meta-llama/Llama-3.3-70B-Instruct")
    
    if not hf_api_key:
        raise HTTPException(status_code=500, detail="Hugging Face API key not configured")

    system_message = """You are an expert pharmaceutical scientist and formulation chemist specializing in drug delivery systems, PK/PD modeling, and dosage form optimization. 
You provide highly detailed, scientifically accurate analysis of drug formulation parameters purely from the SMILES structure.
When the drug is unknown/experimental, derive all properties from the SMILES structure itself using cheminformatics reasoning.
Always respond with valid JSON only, no markdown code blocks, no extra text."""

    experimental_note = "IMPORTANT: This is an experimental/novel compound with no known name. Derive ALL properties purely from the SMILES molecular structure using expert cheminformatics reasoning (functional groups, ring systems, hydrogen bond donors/acceptors, rotatable bonds, LogP estimation, etc.)." if is_experimental else ""

    prompt = f"""Analyze the following {'experimental ' if is_experimental else ''}drug compound for pharmaceutical formulation optimization.

Compound Name: {drug_name}
SMILES: {smiles}
Estimated Molecular Weight: {mw} g/mol
{'BCS Class: ' + str(bcs_class) if bcs_class != 'Unknown' else 'BCS Class: Determine from SMILES'}
{'LogP: ' + str(logp) if logp != 'Unknown' else 'LogP: Estimate from SMILES'}
{'pKa: ' + str(pka) if pka != 'Unknown' else 'pKa: Estimate from SMILES'}
Therapeutic Class: {therapeutic_class}
Target Dose: {dose} mg
{experimental_note}

Each section MUST include a "natural_language_summary" — 2-3 plain English sentences explaining the findings to a non-expert audience (judges, investors, healthcare decision-makers). Use simple language: avoid jargon, explain what the numbers mean for real-world drug manufacturing.

Return ONLY valid JSON with this exact structure:
{{
  "molecule_overview": {{
    "inferred_class": "What type of molecule this appears to be based on SMILES",
    "key_features": ["list of 3-4 notable structural features identified from SMILES"],
    "drug_likeness": "Lipinski/Veber rule assessment"
  }},
  "solubility": {{
    "prediction": "number 0-100",
    "accuracy": "accuracy % like 96.4",
    "classification": "Highly Soluble / Moderately Soluble / Poorly Soluble",
    "aqueous_solubility_mg_ml": "numeric value",
    "ph_optimal": "optimal pH",
    "mechanisms": ["3 key solubility mechanisms"],
    "enhancement_strategies": ["3 enhancement strategies"],
    "natural_language_summary": "2-3 plain English sentences for non-experts explaining what this solubility result means for making this into a real medicine. E.g. how easy/hard it is to dissolve and what that means for patients."
  }},
  "excipients": {{
    "binders": [{{"name": "name", "grade": "grade", "recommended_conc": "% w/w", "rationale": "reason"}}],
    "fillers": [{{"name": "name", "grade": "grade", "recommended_conc": "% w/w", "rationale": "reason"}}],
    "disintegrants": [{{"name": "name", "grade": "grade", "recommended_conc": "% w/w", "rationale": "reason"}}],
    "lubricants": [{{"name": "name", "grade": "grade", "recommended_conc": "% w/w", "rationale": "reason"}}],
    "coating": {{"recommended": true/false, "type": "coating type", "rationale": "reason"}},
    "incompatibilities": ["2-3 incompatibilities to avoid"],
    "optimal_dosage_form": "Tablet / Capsule / etc.",
    "natural_language_summary": "2-3 plain English sentences explaining what excipients are and why these specific ones were chosen — like explaining to a non-chemist what 'ingredients' go into the pill and why."
  }},
  "stability": {{
    "shelf_life_years": "number",
    "shelf_life_score": "0-100",
    "primary_degradation": "main degradation pathway",
    "degradation_mechanisms": ["3 degradation mechanisms"],
    "storage_conditions": {{"temperature": "temp", "humidity": "% RH", "light": "protection needed", "container": "container type"}},
    "accelerated_data": [
      {{"condition": "25C/60%RH", "months": 0, "potency": 100}},
      {{"condition": "25C/60%RH", "months": 3, "potency": 98}},
      {{"condition": "25C/60%RH", "months": 6, "potency": 97}},
      {{"condition": "25C/60%RH", "months": 12, "potency": 95}},
      {{"condition": "40C/75%RH", "months": 0, "potency": 100}},
      {{"condition": "40C/75%RH", "months": 1, "potency": 97}},
      {{"condition": "40C/75%RH", "months": 3, "potency": 94}},
      {{"condition": "40C/75%RH", "months": 6, "potency": 90}}
    ],
    "packaging_recommendation": "packaging type",
    "natural_language_summary": "2-3 plain English sentences about how long this drug will last on the shelf and what conditions are needed to keep it safe and effective — frame it from a patient safety perspective."
  }},
  "pk_compatibility": {{
    "bioavailability_percent": "number 0-100",
    "bioavailability_score": "number 0-100",
    "tmax_hours": "hours to peak",
    "t_half_hours": "half-life hours",
    "absorption_rate": "Fast / Moderate / Slow",
    "absorption_mechanism": "mechanism",
    "distribution_vd": "L/kg",
    "protein_binding_percent": "% binding",
    "metabolism": {{"primary_enzyme": "enzyme", "metabolites": ["metabolites"], "first_pass": "% effect"}},
    "excretion": {{"route": "route", "percent_unchanged": "%"}},
    "bioavailability_curve": [
      {{"time": 0, "concentration": 0}},
      {{"time": 0.5, "concentration": 45}},
      {{"time": 1, "concentration": 85}},
      {{"time": 2, "concentration": 100}},
      {{"time": 4, "concentration": 75}},
      {{"time": 6, "concentration": 55}},
      {{"time": 8, "concentration": 38}},
      {{"time": 12, "concentration": 18}},
      {{"time": 24, "concentration": 4}}
    ],
    "recommended_dosage_form": "specific recommendation",
    "dosing_frequency": "frequency",
    "natural_language_summary": "2-3 plain English sentences about how the drug gets absorbed into the body, how quickly it works, and how long it stays active — written for patients or investors, not scientists."
  }}
}}"""

    try:
        # Hugging Face Inference API via novita router
        hf_url = "https://router.huggingface.co/novita/v3/openai/chat/completions"
        headers = {
            "Authorization": f"Bearer {hf_api_key}",
            "Content-Type": "application/json"
        }
        
        # Use lowercase model name for novita
        model_name = hf_model.lower()
        
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 4096,
            "temperature": 0.7,
            "top_p": 0.95
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                hf_url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    logger.error(f"Hugging Face API error: {resp.status} - {error_text}")
                    raise HTTPException(status_code=resp.status, detail=f"AI service error: {error_text}")
                
                result_json = await resp.json()
                response = result_json["choices"][0]["message"]["content"]
        
        # Clean and parse JSON response (handle markdown code blocks)
        clean_response = response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]  # Remove ```json
        if clean_response.startswith('```'):
            clean_response = clean_response[3:]   # Remove ```
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]  # Remove ending ```
        clean_response = clean_response.strip()
        
        analysis_data = json.loads(clean_response)
        
        result = {
            "id": str(uuid.uuid4()),
            "drug_name": drug_name,
            "smiles": smiles,
            "molecular_weight": mw,
            "dose_mg": dose,
            "is_experimental": is_experimental,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "drug_info": drug_info or {"smiles": smiles, "molecular_weight": mw, "therapeutic_class": "Experimental Compound"},
            **analysis_data
        }
        
        # Save to MongoDB
        doc = result.copy()
        await db.analyses.insert_one(doc)
        doc.pop("_id", None)
        
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}, response: {response[:500]}")
        raise HTTPException(status_code=500, detail="AI returned invalid JSON. Please retry.")
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analyses")
async def get_analyses():
    analyses = await db.analyses.find({}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    return {"analyses": analyses, "total": len(analyses)}

@api_router.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str):
    analysis = await db.analyses.find_one({"id": analysis_id}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
