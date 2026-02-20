import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DNAHelix from '../components/DNAHelix';
import MoleculeViewer from '../components/MoleculeViewer';
import { DRUG_DATABASE } from '../data/drugDatabase';
import { Dna, FlaskConical, Activity, Brain, ChevronDown, Microscope, Search, Beaker, Database, Tag, ChevronRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const stats = [
  { label: 'Solubility Accuracy', value: '98.2%', color: '#00f2ff' },
  { label: 'Stability Models', value: '500+', color: '#7000ff' },
  { label: 'Drug Database', value: '30 APIs', color: '#00ff9d' },
  { label: 'PK Predictions', value: 'Real-time', color: '#f59e0b' },
];

const features = [
  { icon: FlaskConical, title: 'Solubility Prediction', desc: 'BCS-class AI prediction with aqueous solubility scoring and enhancement strategies.', color: '#00f2ff' },
  { icon: Microscope, title: 'Excipient Engine', desc: 'Smart binder, filler, disintegrant, and lubricant recommendations.', color: '#7000ff' },
  { icon: Activity, title: 'Stability Forecast', desc: 'Shelf-life prediction with ICH accelerated degradation charts.', color: '#00ff9d' },
  { icon: Brain, title: 'PK-Compatibility', desc: 'Bioavailability curves, T½, Tmax, protein binding, metabolism analysis.', color: '#f59e0b' },
];

const EXPERIMENTAL_EXAMPLES = [
  { label: 'Kinase Inhibitor scaffold', smiles: 'c1ccc2c(c1)cc(=O)n2Cc1ccc(cc1)C(=O)N1CCCC1', name: 'Experimental Kinase Inhibitor' },
  { label: 'Anticancer candidate (Drug X)', smiles: 'O=C(Nc1ccc(N2CCN(c3ncnc4ccccc34)CC2)cc1)c1ccc(Cl)cc1', name: 'Anticancer Drug X' },
  { label: 'CNS-penetrant compound', smiles: 'COc1ccc(CCN(C)CCC2=CN=CC=C2)cc1OC', name: 'CNS Compound Y' },
];

const SectionLabel = ({ num, label, sublabel, color = '#00f2ff' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ color, fontSize: '12px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{num}</span>
    </div>
    <div>
      <div style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>{label}</div>
      {sublabel && <div style={{ color: '#334155', fontSize: '10px', marginTop: '1px' }}>{sublabel}</div>}
    </div>
  </div>
);

const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '22px 0' }}>
    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
    <span style={{ color: '#334155', fontSize: '10px', letterSpacing: '2px', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
  </div>
);

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [smiles, setSmiles] = useState('');
  const [drugName, setDrugName] = useState('');
  const [dose, setDose] = useState('');
  const [dbSearch, setDbSearch] = useState('');
  const [showDbDropdown, setShowDbDropdown] = useState(false);
  const [selectedDbDrug, setSelectedDbDrug] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const drugEntries = Object.entries(DRUG_DATABASE);
  const filteredDrugs = drugEntries.filter(([name]) =>
    name.toLowerCase().includes(dbSearch.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOut = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDbDropdown(false);
    };
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, []);

  const handleSelectDbDrug = (name, info) => {
    setSelectedDbDrug({ name, ...info });
    setSmiles(info.smiles);
    setDrugName(name);
    setDbSearch(name);
    setShowDbDropdown(false);
  };

  const handleLoadExample = (ex) => {
    setSmiles(ex.smiles);
    setDrugName(ex.name);
    setSelectedDbDrug(null);
    setDbSearch('');
    document.getElementById('analyze-section').scrollIntoView({ behavior: 'smooth' });
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!smiles.trim()) { setError('SMILES is required — enter manually or pick from database.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smiles: smiles.trim(),
          drug_name: drugName.trim() || undefined,
          dose_mg: dose ? parseFloat(dose) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analysis failed');
      navigate('/analysis', { state: { result: data } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#02060a', minHeight: '100vh', overflowX: 'hidden', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Tech Grid */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(0,242,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.035) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(2,6,10,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,242,255,0.08)', padding: '0 52px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Dna size={22} color="#00f2ff" />
          <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '17px', letterSpacing: '2px', color: '#f8fafc' }}>PHARMA<span style={{ color: '#00f2ff' }}>-AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {['Platform', 'Science', 'Database'].map(item => (
            <span key={item} style={{ color: '#475569', fontSize: '13px', cursor: 'pointer' }}>{item}</span>
          ))}
          <button data-testid="nav-analyze-btn" onClick={() => document.getElementById('analyze-section').scrollIntoView({ behavior: 'smooth' })} style={{ background: 'linear-gradient(135deg, #00f2ff, #0070ff)', border: 'none', borderRadius: '20px', padding: '8px 22px', color: '#02060a', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Start Analysis</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '100px 80px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '540px', flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,242,255,0.07)', border: '1px solid rgba(0,242,255,0.18)', borderRadius: '20px', padding: '6px 16px', marginBottom: '30px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff9d', boxShadow: '0 0 8px #00ff9d', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#00f2ff', fontSize: '10px', letterSpacing: '2px', fontFamily: 'JetBrains Mono, monospace' }}>AI-POWERED FORMULATION SCIENCE</span>
          </div>
          <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(36px, 4.5vw, 62px)', fontWeight: 800, lineHeight: 1.08, color: '#f8fafc', margin: '0 0 22px 0', letterSpacing: '-2px' }}>
            From Molecule
            <span style={{ display: 'block', background: 'linear-gradient(90deg, #00f2ff, #7000ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>to Medicine</span>
            in Seconds
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.75, marginBottom: '36px', maxWidth: '460px' }}>
            Paste any SMILES — known drug or experimental compound — and get a complete AI formulation analysis with interactive 3D visualization. <strong style={{ color: '#cbd5e1' }}>Bridging the gap between lab synthesis and clinical formulation.</strong>
          </p>
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', marginBottom: '40px' }}>
            {stats.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'Manrope, sans-serif', letterSpacing: '-1px' }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '1px', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button data-testid="hero-cta-btn" onClick={() => document.getElementById('analyze-section').scrollIntoView({ behavior: 'smooth' })} style={{ background: 'linear-gradient(135deg, #00f2ff, #7000ff)', border: 'none', borderRadius: '28px', padding: '13px 30px', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '9px', boxShadow: '0 0 28px rgba(0,242,255,0.18)' }}>
              <FlaskConical size={16} /> Analyze a Molecule
            </button>
            <button onClick={() => handleLoadExample(EXPERIMENTAL_EXAMPLES[1])} style={{ background: 'rgba(112,0,255,0.08)', border: '1px solid rgba(112,0,255,0.25)', borderRadius: '28px', padding: '13px 24px', color: '#a78bfa', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Beaker size={15} /> Try Experimental Drug
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <DNAHelix scrollRotation={scrollY * 0.35} />
        </div>
      </section>

      {/* Scroll indicator */}
      <div style={{ textAlign: 'center', paddingBottom: '16px', zIndex: 1, position: 'relative' }}>
        <ChevronDown size={20} color="rgba(0,242,255,0.3)" style={{ animation: 'bounce 2s infinite' }} />
      </div>

      {/* Feature cards */}
      <section style={{ padding: '60px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '36px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-1px', margin: 0 }}>Core Platform Modules</h2>
          <p style={{ color: '#334155', marginTop: '10px', fontSize: '14px' }}>AI-driven analysis across every critical formulation parameter</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} style={{ background: 'rgba(10,14,20,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '24px 20px', transition: 'border-color 0.3s, transform 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color + '45'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Icon size={19} color={color} />
              </div>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 600, color: '#f8fafc', margin: '0 0 7px 0' }}>{title}</h3>
              <p style={{ color: '#475569', fontSize: '11px', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ ANALYSIS FORM ═══════════════════════════════ */}
      <section id="analyze-section" style={{ padding: '40px 80px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '34px', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0', letterSpacing: '-1px' }}>Start Molecular Analysis</h2>
            <p style={{ color: '#475569', fontSize: '13px' }}>Works for known drugs AND experimental compounds — just provide the SMILES structure</p>
          </div>

          <form onSubmit={handleAnalyze}>
            <div style={{ background: 'rgba(10,14,20,0.93)', backdropFilter: 'blur(24px)', border: '1px solid rgba(0,242,255,0.1)', borderRadius: '22px', overflow: 'hidden' }}>

              {/* ── SECTION 1: DATABASE ─────────────────────────────── */}
              <div style={{ padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <SectionLabel num="01" label="Select from Drug Database" sublabel="Choose a known compound — SMILES auto-fills" color="#00f2ff" />
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <Search size={14} color="#334155" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                  <input
                    data-testid="db-search-input"
                    type="text"
                    value={dbSearch}
                    onChange={e => { setDbSearch(e.target.value); setShowDbDropdown(true); setSelectedDbDrug(null); }}
                    onFocus={() => setShowDbDropdown(true)}
                    placeholder="Search 30 compounds — Aspirin, Ibuprofen, Atorvastatin, Metformin..."
                    style={{ width: '100%', padding: '12px 14px 12px 40px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,242,255,0.15)', borderRadius: '10px', color: '#f8fafc', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                  {showDbDropdown && filteredDrugs.length > 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200, background: 'rgba(8,12,18,0.99)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,242,255,0.15)', borderRadius: '12px', overflow: 'hidden', maxHeight: '260px', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                      {filteredDrugs.map(([name, info]) => (
                        <div key={name} data-testid={`db-drug-${name}`} onClick={() => handleSelectDbDrug(name, info)}
                          style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,242,255,0.07)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div>
                            <div style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 500 }}>{name}</div>
                            <div style={{ color: '#334155', fontSize: '10px', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>{info.therapeutic_class} · MW {info.molecular_weight}</div>
                          </div>
                          <span style={{ background: `rgba(0,242,255,0.1)`, color: '#00f2ff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontFamily: 'JetBrains Mono, monospace' }}>BCS {info.bcs_class}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedDbDrug && (
                  <div style={{ marginTop: '12px', background: 'rgba(0,242,255,0.04)', border: '1px solid rgba(0,242,255,0.14)', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <Database size={14} color="#00f2ff" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#00f2ff', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{selectedDbDrug.name}</div>
                      <code style={{ color: '#475569', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>{selectedDbDrug.smiles}</code>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
                      {[{ l: 'BCS', v: selectedDbDrug.bcs_class }, { l: 'LogP', v: selectedDbDrug.logp }, { l: 'MW', v: selectedDbDrug.molecular_weight }].map(({ l, v }) => (
                        <div key={l} style={{ textAlign: 'right' }}><span style={{ color: '#334155', fontSize: '9px' }}>{l} </span><span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>{v}</span></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── SECTION 2: SMILES ──────────────────────────────── */}
              <div style={{ padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <SectionLabel num="02" label={<>Enter SMILES String <span style={{ color: '#ef4444', fontSize: '11px' }}>*required</span></>} sublabel="Primary input — works for any compound including experimental drugs" color="#7000ff" />
                <textarea
                  data-testid="smiles-input"
                  value={smiles}
                  onChange={e => setSmiles(e.target.value)}
                  placeholder={`Paste SMILES here — e.g. CC(=O)Oc1ccccc1C(=O)O\n\nFor experimental compounds: c1ccc2c(c1)cc(=O)n2Cc1ccc(cc1)C(=O)N1CCCC1`}
                  rows={3}
                  style={{ width: '100%', padding: '13px 14px', background: 'rgba(0,0,0,0.5)', border: smiles ? '1px solid rgba(112,0,255,0.4)' : '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: '#e2e8f0', fontSize: '12px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.65 }}
                />

                {/* Quick experimental examples */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ color: '#1e293b', fontSize: '9px', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>EXPERIMENTAL EXAMPLES — CLICK TO LOAD</div>
                  <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                    {EXPERIMENTAL_EXAMPLES.map((ex, i) => (
                      <button key={i} type="button" data-testid={`example-${i}-btn`} onClick={() => handleLoadExample(ex)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', cursor: 'pointer', border: '1px solid rgba(112,0,255,0.2)', background: 'rgba(112,0,255,0.06)', color: '#7c3aed', fontFamily: 'inherit' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(112,0,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(112,0,255,0.35)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(112,0,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(112,0,255,0.2)'; }}
                      >
                        <Beaker size={11} /> {ex.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3D Molecule Viewer */}
                <MoleculeViewer smiles={smiles} />
              </div>

              {/* ── SECTION 3: NAME + DOSE ─────────────────────────── */}
              <div style={{ padding: '28px 32px' }}>
                <SectionLabel num="03" label="Compound Name & Dose" sublabel="Both optional — leave blank for unknown/experimental compounds" color="#00ff9d" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#334155', fontSize: '9px', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '7px' }}>COMPOUND / DRUG NAME</label>
                    <input data-testid="drug-name-input" type="text" value={drugName} onChange={e => setDrugName(e.target.value)} placeholder="e.g. Drug X, Compound 7A..." style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', color: '#f8fafc', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#334155', fontSize: '9px', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '7px' }}>TARGET DOSE (mg)</label>
                    <input data-testid="dose-input" type="number" value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 500" style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', color: '#f8fafc', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                </div>

                {error && (
                  <div data-testid="analysis-error" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: '8px', padding: '11px 15px', marginTop: '16px', color: '#fca5a5', fontSize: '13px' }}>{error}</div>
                )}

                <button data-testid="analyze-submit-btn" type="submit" disabled={loading}
                  style={{ width: '100%', marginTop: '20px', padding: '15px', background: loading ? 'rgba(0,242,255,0.12)' : 'linear-gradient(135deg, #00f2ff 0%, #7000ff 100%)', border: 'none', borderRadius: '12px', color: loading ? '#64748b' : 'white', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.3px', boxShadow: loading ? 'none' : '0 0 24px rgba(0,242,255,0.15)' }}
                >
                  {loading ? '⟳ Running AI Analysis — please wait ~20s...' : 'Run Full Formulation Analysis'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(0,242,255,0.06)', padding: '32px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Dna size={17} color="#00f2ff" />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: '#1e293b', fontSize: '13px', letterSpacing: '1px' }}>PHARMA-AI</span>
        </div>
        <span style={{ color: '#0f172a', fontSize: '12px' }}>Bridging the gap between the lab and the clinic · AI-Powered Formulation Science</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #02060a; } ::-webkit-scrollbar-thumb { background: #00f2ff1a; border-radius: 2px; }
        input::placeholder, textarea::placeholder { color: #1e293b; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
};

export default LandingPage;
