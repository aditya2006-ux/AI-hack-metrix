#!/usr/bin/env python3
import requests
import json
import sys
from datetime import datetime
import time

class PharmaAITester:
    def __init__(self):
        self.base_url = "https://cheminformatics-lab.preview.emergentagent.com/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.analysis_id = None

    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=60):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        self.log(f"Testing {name}...")
        self.log(f"  URL: {method} {url}")
        
        try:
            start_time = time.time()
            
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            
            elapsed = time.time() - start_time
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"  ✅ PASSED - Status: {response.status_code} (took {elapsed:.1f}s)")
                
                # Try to parse response
                try:
                    response_data = response.json()
                    if endpoint == "/analyze" and "id" in response_data:
                        self.analysis_id = response_data["id"]
                        self.log(f"  📝 Analysis ID saved: {self.analysis_id}")
                    return True, response_data
                except:
                    return True, {"status": "success", "raw_response": response.text}
            else:
                self.log(f"  ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"  📄 Error response: {json.dumps(error_data, indent=2)[:500]}")
                except:
                    self.log(f"  📄 Raw error: {response.text[:200]}")
                return False, {}

        except requests.exceptions.Timeout:
            self.log(f"  ⏱️ TIMEOUT - Request took longer than {timeout}s")
            return False, {}
        except Exception as e:
            self.log(f"  ❌ EXCEPTION - {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test GET / for version info"""
        return self.run_test("Root API Endpoint", "GET", "/", 200)

    def test_get_drugs(self):
        """Test GET /drugs for 30 drugs"""
        success, response = self.run_test("Get All Drugs", "GET", "/drugs", 200)
        
        if success and isinstance(response, dict):
            drug_count = len(response.get("drugs", []))
            total_reported = response.get("total", 0)
            
            if drug_count == 30 and total_reported == 30:
                self.log(f"  ✅ Correct drug count: {drug_count} drugs found")
                return True
            else:
                self.log(f"  ❌ Expected 30 drugs, got {drug_count} (total: {total_reported})")
                return False
        
        return success

    def test_get_single_drug(self):
        """Test GET /drugs/{drug_name} for specific drug"""
        return self.run_test("Get Single Drug (Aspirin)", "GET", "/drugs/Aspirin", 200)

    def test_analyze_aspirin_with_smiles(self):
        """Test POST /analyze with Aspirin SMILES (should return is_experimental=false)"""
        analysis_data = {
            "smiles": "CC(=O)Oc1ccccc1C(=O)O",  # Aspirin SMILES
            "drug_name": "Aspirin",
            "dose_mg": 500
        }
        
        success, response = self.run_test(
            "AI Analysis (Aspirin with SMILES)", 
            "POST", 
            "/analyze", 
            200, 
            analysis_data, 
            timeout=60
        )
        
        if success and isinstance(response, dict):
            # Verify required analysis fields are present
            required_fields = ["id", "drug_name", "smiles", "solubility", "excipients", "stability", "pk_compatibility", "is_experimental"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log(f"  ❌ Missing analysis fields: {missing_fields}")
                return False
                
            # Check that it's NOT experimental (known drug)
            if response.get("is_experimental", True):
                self.log(f"  ❌ Expected is_experimental=false for known drug Aspirin")
                return False
                
            # Check drug name matches
            if response.get("drug_name") != "Aspirin":
                self.log(f"  ❌ Expected drug_name=Aspirin, got {response.get('drug_name')}")
                return False
                
            self.log(f"  ✅ All analysis panels present, is_experimental=false, drug_name=Aspirin")
            return True
        
        return success

    def test_analyze_experimental_smiles_only(self):
        """Test POST /analyze with ONLY experimental SMILES (no drug_name) - should return is_experimental=true"""
        analysis_data = {
            "smiles": "c1ccc2c(c1)cc(=O)n2Cc1ccc(cc1)C(=O)N1CCCC1"  # Experimental compound
        }
        
        success, response = self.run_test(
            "Experimental SMILES Analysis (no name)", 
            "POST", 
            "/analyze", 
            200, 
            analysis_data, 
            timeout=60
        )
        
        if success and isinstance(response, dict):
            # Check that it IS experimental (unknown SMILES)
            if not response.get("is_experimental", False):
                self.log(f"  ❌ Expected is_experimental=true for unknown SMILES")
                return False
                
            # Check drug name defaults to "Experimental Compound"
            drug_name = response.get("drug_name", "")
            if "Experimental" not in drug_name:
                self.log(f"  ❌ Expected experimental compound name, got: {drug_name}")
                return False
                
            self.log(f"  ✅ is_experimental=true, drug_name='{drug_name}'")
            return True
        
        return success

    def test_get_analyses(self):
        """Test GET /analyses to retrieve saved analyses"""
        return self.run_test("Get All Analyses", "GET", "/analyses", 200)

    def test_get_specific_analysis(self):
        """Test GET /analyses/{id} to retrieve specific analysis"""
        if not self.analysis_id:
            self.log("  ⚠️ Skipping - No analysis ID available from previous test")
            return True
            
        return self.run_test(
            f"Get Specific Analysis ({self.analysis_id[:8]}...)", 
            "GET", 
            f"/analyses/{self.analysis_id}", 
            200
        )

    def test_analyze_smiles_missing(self):
        """Test POST /analyze with missing SMILES - should return 422 validation error"""
        analysis_data = {
            "drug_name": "Test Drug",
            "dose_mg": 100
        }
        
        success, response = self.run_test(
            "Missing SMILES Test", 
            "POST", 
            "/analyze", 
            422,  # FastAPI returns 422 for validation errors
            analysis_data
        )
        
        return success

    def test_natural_language_summaries(self):
        """Test that analysis results contain natural_language_summary in all 4 panels"""
        analysis_data = {
            "smiles": "CC(=O)Oc1ccccc1C(=O)O",  # Aspirin SMILES
            "drug_name": "Aspirin",
            "dose_mg": 500
        }
        
        success, response = self.run_test(
            "Natural Language Summaries Test", 
            "POST", 
            "/analyze", 
            200, 
            analysis_data, 
            timeout=60
        )
        
        if success and isinstance(response, dict):
            # Check each panel has natural_language_summary
            panels = ["solubility", "excipients", "stability", "pk_compatibility"]
            missing_summaries = []
            
            for panel in panels:
                panel_data = response.get(panel, {})
                if not panel_data.get("natural_language_summary"):
                    missing_summaries.append(panel)
            
            if missing_summaries:
                self.log(f"  ❌ Missing natural_language_summary in: {missing_summaries}")
                return False
            else:
                self.log(f"  ✅ All 4 panels have natural_language_summary")
                return True
        
        return success

    def test_molecule_overview(self):
        """Test that analysis results contain molecule_overview section"""
        analysis_data = {
            "smiles": "c1ccc2c(c1)cc(=O)n2Cc1ccc(cc1)C(=O)N1CCCC1",  # Experimental
            "dose_mg": 100
        }
        
        success, response = self.run_test(
            "Molecule Overview Test", 
            "POST", 
            "/analyze", 
            200, 
            analysis_data, 
            timeout=60
        )
        
        if success and isinstance(response, dict):
            molecule_overview = response.get("molecule_overview", {})
            
            if not molecule_overview:
                self.log(f"  ❌ Missing molecule_overview section")
                return False
                
            required_keys = ["inferred_class", "key_features", "drug_likeness"]
            missing_keys = [key for key in required_keys if key not in molecule_overview]
            
            if missing_keys:
                self.log(f"  ❌ Missing molecule_overview keys: {missing_keys}")
                return False
            else:
                self.log(f"  ✅ molecule_overview section complete")
                return True
        
        return success

    def test_molecule3d_endpoint(self):
        """Test GET /molecule3d with Aspirin SMILES - should return CID and SDF data"""
        aspirin_smiles = "CC(=O)Oc1ccccc1C(=O)O"
        
        success, response = self.run_test(
            "3D Molecule Data (Aspirin)", 
            "GET", 
            f"/molecule3d?smiles={aspirin_smiles}", 
            200,
            timeout=30
        )
        
        if success and isinstance(response, dict):
            required_keys = ["sdf", "cid", "source"]
            missing_keys = [key for key in required_keys if key not in response]
            
            if missing_keys:
                self.log(f"  ❌ Missing molecule3d response keys: {missing_keys}")
                return False
                
            # Check that SDF data is present and looks valid
            sdf_data = response.get("sdf", "")
            if not sdf_data or len(sdf_data) < 100:
                self.log(f"  ❌ SDF data is empty or too short: {len(sdf_data)} chars")
                return False
                
            # Check CID is present and numeric
            cid = response.get("cid", "")
            if not cid or not str(cid).isdigit():
                self.log(f"  ❌ Invalid CID: {cid}")
                return False
                
            # Check source is PubChem
            source = response.get("source", "")
            if source != "PubChem":
                self.log(f"  ❌ Expected source=PubChem, got: {source}")
                return False
                
            self.log(f"  ✅ Valid 3D data: CID={cid}, SDF={len(sdf_data)} chars, source={source}")
            return True
        
        return success

    def test_molecule3d_experimental_compound(self):
        """Test GET /molecule3d with experimental SMILES - should return 404"""
        experimental_smiles = "c1ccc2c(c1)cc(=O)n2Cc1ccc(cc1)C(=O)N1CCCC1"
        
        success, response = self.run_test(
            "3D Molecule Data (Experimental - expect 404)", 
            "GET", 
            f"/molecule3d?smiles={experimental_smiles}", 
            404,
            timeout=20
        )
        
        # This test expects 404, so success means the API correctly returned 404
        return success

    def run_all_tests(self):
        """Run the complete test suite"""
        self.log("🧪 Starting PHARMA-AI Backend API Test Suite")
        self.log("=" * 60)
        
        test_methods = [
            self.test_root_endpoint,
            self.test_get_drugs,
            self.test_get_single_drug,
            self.test_molecule3d_endpoint,
            self.test_molecule3d_experimental_compound,
            self.test_analyze_aspirin_with_smiles,
            self.test_analyze_experimental_smiles_only,
            self.test_analyze_smiles_missing,
            self.test_natural_language_summaries,
            self.test_molecule_overview,
            self.test_get_analyses,
            self.test_get_specific_analysis
        ]
        
        for test_method in test_methods:
            try:
                test_method()
                # Brief pause between tests
                time.sleep(0.5)
            except Exception as e:
                self.log(f"Test {test_method.__name__} failed with exception: {e}", "ERROR")
        
        # Print summary
        self.log("=" * 60)
        self.log(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 ALL TESTS PASSED!")
            return 0
        else:
            self.log(f"❌ {self.tests_run - self.tests_passed} test(s) failed")
            return 1

def main():
    tester = PharmaAITester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()