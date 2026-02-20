import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Dna, FlaskConical, ArrowLeft, Download, Activity, Brain, Microscope, CheckCircle2, AlertTriangle, Clock, Package, Thermometer, Droplets, Atom, MessageSquare, Beaker, Eye } from 'lucide-react';
import MoleculeViewer from '../components/MoleculeViewer';
import jsPDF from 'jspdf';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ─ Shared Components ──────────────────────────────────────────────────────────────

const GlassCard = ({ children, style = {}, accentColor = '#00f2ff' }) => (
  <div style={{
    background: 'rgba(10,14,20,0.88)', backdropFilter: 'blur(24px)',
    border: `1px solid ${accentColor}1a`,
    borderRadius: '18px', padding: '28px',
    boxShadow: `0 0 40px ${accentColor}06`,
    ...style
  }}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={16} color={color} />
    </div>
    <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>{title}</h3>
  </div>
);

const Tag = ({ children, color }) => (
  <span style={{ display: 'inline-block', background: color + '12', border: `1px solid ${color}28`, color, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 500, margin: '3px' }}>
    {children}
  </span>
);

// ─ Natural Language Summary Block ─────────────────────────────────────────────────
const NLSummary = ({ text, color = '#00f2ff' }) => {
  if (!text) return null;
  return (
    <div style={{
      marginTop: '22px',
      background: `linear-gradient(135deg, ${color}09, transparent)`,
      border: `1px solid ${color}20`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '10px',
      padding: '16px 18px',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start'
    }}>
      <MessageSquare size={14} color={color} style={{ marginTop: '2px', flexShrink: 0 }} />
      <div>
        <div style={{ color, fontSize: '9px', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '6px' }}>PLAIN ENGLISH SUMMARY</div>
        <p style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.72, margin: 0, fontStyle: 'italic' }}>{text}</p>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, color = '#00f2ff' }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(10,14,20,0.96)', border: `1px solid ${color}25`, borderRadius: '8px', padding: '10px 14px' }}>
        <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || color, fontSize: '13px', fontWeight: 600, margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─ Molecule Overview Banner ──────────────────────────────────────────────────────
const MoleculeOverview = ({ data, isExperimental }) => {
  if (!data) return null;
  return (
    <div style={{ padding: '0 32px 20px', position: 'relative', zIndex: 1 }}>
      <div style={{
        background: isExperimental ? 'rgba(112,0,255,0.06)' : 'rgba(0,242,255,0.05)',
        border: `1px solid ${isExperimental ? 'rgba(112,0,255,0.2)' : 'rgba(0,242,255,0.15)'}`,
        borderRadius: '14px', padding: '20px 24px',
        display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: isExperimental ? 'rgba(112,0,255,0.15)' : 'rgba(0,242,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Atom size={18} color={isExperimental ? '#7000ff' : '#00f2ff'} />
          </div>
          <div>
            <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace' }}>
              {isExperimental ? 'EXPERIMENTAL COMPOUND' : 'MOLECULE OVERVIEW'}
            </div>
            <div style={{ color: isExperimental ? '#7000ff' : '#00f2ff', fontWeight: 700, fontSize: '14px', fontFamily: 'Manrope, sans-serif' }}>{data.inferred_class || 'Small Molecule Drug'}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>DRUG-LIKENESS & KEY STRUCTURAL FEATURES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
            {(data.key_features || []).map((f, i) => <Tag key={i} color={isExperimental ? '#7000ff' : '#00f2ff'}>{f}</Tag>)}
          </div>
          {data.drug_likeness && <div style={{ color: '#64748b', fontSize: '12px' }}>{data.drug_likeness}</div>}
        </div>
      </div>
    </div>
  );
};

// ─ Solubility Panel ────────────────────────────────────────────────────────────────
const SolubilityPanel = ({ data }) => {
  if (!data) return null;
  const score = parseFloat(data.prediction) || 0;
  const accuracy = parseFloat(data.accuracy) || 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <GlassCard accentColor="#00f2ff">
      <SectionTitle icon={FlaskConical} title="Solubility Prediction" color="#00f2ff" />
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(0,242,255,0.1)" strokeWidth="8" />
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#00f2ff" strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 60 60)"
              style={{ filter: 'drop-shadow(0 0 6px #00f2ff)' }}
            />
            <text x="60" y="56" textAnchor="middle" fill="#f8fafc" fontSize="20" fontWeight="700" fontFamily="Manrope, sans-serif">{score.toFixed(0)}</text>
            <text x="60" y="72" textAnchor="middle" fill="#00f2ff" fontSize="8" fontFamily="JetBrains Mono" letterSpacing="1">SCORE</text>
          </svg>
          <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '-4px' }}>Accuracy: <span style={{ color: '#00f2ff', fontWeight: 600 }}>{accuracy}%</span></div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: 'rgba(0,242,255,0.06)', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
            <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px', marginBottom: '4px' }}>CLASSIFICATION</div>
            <div style={{ color: '#00f2ff', fontWeight: 700, fontSize: '15px' }}>{data.classification}</div>
            {data.aqueous_solubility_mg_ml && <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Aqueous: {data.aqueous_solubility_mg_ml} mg/mL - Optimal pH: {data.ph_optimal}</div>}
          </div>
          {(data.mechanisms || []).map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '7px' }}>
              <CheckCircle2 size={11} color="#00f2ff" style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ color: '#94a3b8', fontSize: '11px', lineHeight: 1.5 }}>{m}</span>
            </div>
          ))}
          {data.enhancement_strategies?.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px', marginBottom: '6px' }}>ENHANCEMENT STRATEGIES</div>
              {data.enhancement_strategies.map((s, i) => <Tag key={i} color="#00f2ff">{s}</Tag>)}
            </div>
          )}
        </div>
      </div>
      <NLSummary text={data.natural_language_summary} color="#00f2ff" />
    </GlassCard>
  );
};

// ─ Excipient Panel ────────────────────────────────────────────────────────────────
const ExcipientPanel = ({ data }) => {
  if (!data) return null;
  const categories = [
    { key: 'binders', label: 'Binders', color: '#7000ff' },
    { key: 'fillers', label: 'Fillers', color: '#00f2ff' },
    { key: 'disintegrants', label: 'Disintegrants', color: '#00ff9d' },
    { key: 'lubricants', label: 'Lubricants', color: '#f59e0b' },
  ];
  return (
    <GlassCard accentColor="#7000ff">
      <SectionTitle icon={Microscope} title="Excipient Recommendations" color="#7000ff" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(112,0,255,0.1)', border: '1px solid rgba(112,0,255,0.22)', borderRadius: '8px', padding: '8px 14px' }}>
          <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px' }}>OPTIMAL FORM</div>
          <div style={{ color: '#7000ff', fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{data.optimal_dosage_form || 'Tablet'}</div>
        </div>
        {data.coating?.recommended && (
          <div style={{ background: 'rgba(0,242,255,0.07)', borderRadius: '8px', padding: '8px 14px' }}>
            <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px' }}>COATING</div>
            <div style={{ color: '#00f2ff', fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>{data.coating.type}</div>
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {categories.map(({ key, label, color }) => (
          <div key={key} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ color, fontSize: '9px', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}>{label.toUpperCase()}</div>
            {(data[key] || []).slice(0, 2).map((item, i) => (
              <div key={i} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: i < (data[key]?.length - 1) ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#e2e8f0', fontSize: '11px', fontWeight: 500 }}>{item.name}</span>
                  <span style={{ color, fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}>{item.recommended_conc}</span>
                </div>
                {item.grade && <div style={{ color: '#475569', fontSize: '9px', marginTop: '2px' }}>{item.grade}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {data.incompatibilities?.length > 0 && (
        <div style={{ marginTop: '14px', background: 'rgba(239,68,68,0.05)', borderRadius: '9px', padding: '11px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
            <AlertTriangle size={11} color="#ef4444" />
            <span style={{ color: '#ef4444', fontSize: '9px', letterSpacing: '1px' }}>INCOMPATIBILITIES TO AVOID</span>
          </div>
          {data.incompatibilities.map((inc, i) => (
            <div key={i} style={{ color: '#fca5a5', fontSize: '11px', marginBottom: '3px' }}>- {inc}</div>
          ))}
        </div>
      )}
      <NLSummary text={data.natural_language_summary} color="#7000ff" />
    </GlassCard>
  );
};

// ─ Stability Panel ─────────────────────────────────────────────────────────────────
const StabilityPanel = ({ data }) => {
  if (!data) return null;
  const longTerm = (data.accelerated_data || []).filter(d => d.condition === '25C/60%RH');
  const accel = (data.accelerated_data || []).filter(d => d.condition === '40C/75%RH');
  const chartData = longTerm.map(lt => {
    const acc = accel.find(a => a.months === lt.months);
    return { month: `M${lt.months}`, longTerm: parseFloat(lt.potency) || 100, accelerated: acc ? parseFloat(acc.potency) || 100 : undefined };
  });
  return (
    <GlassCard accentColor="#00ff9d">
      <SectionTitle icon={Activity} title="Stability Forecast" color="#00ff9d" />
      <div style={{ display: 'flex', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(0,255,157,0.07)', borderRadius: '11px', padding: '12px 18px', flex: 1, minWidth: '110px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
            <Clock size={12} color="#00ff9d" />
            <span style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px' }}>SHELF LIFE</span>
          </div>
          <div style={{ color: '#00ff9d', fontFamily: 'Manrope, sans-serif', fontSize: '26px', fontWeight: 800 }}>{data.shelf_life_years}<span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '4px' }}>yrs</span></div>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '11px', padding: '12px 18px', flex: 2, minWidth: '170px' }}>
          <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px', marginBottom: '8px' }}>STORAGE CONDITIONS</div>
          {data.storage_conditions && (
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Thermometer size={11} color="#f59e0b" /><span style={{ color: '#e2e8f0', fontSize: '11px' }}>{data.storage_conditions.temperature}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Droplets size={11} color="#3b82f6" /><span style={{ color: '#e2e8f0', fontSize: '11px' }}>{data.storage_conditions.humidity}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={11} color="#94a3b8" /><span style={{ color: '#e2e8f0', fontSize: '11px' }}>{data.storage_conditions.container}</span></div>
            </div>
          )}
        </div>
      </div>
      {data.degradation_mechanisms?.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px', marginBottom: '7px' }}>DEGRADATION MECHANISMS</div>
          {data.degradation_mechanisms.map((m, i) => <Tag key={i} color="#00ff9d">{m}</Tag>)}
        </div>
      )}
      {chartData.length > 0 && (
        <div>
          <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px', marginBottom: '10px' }}>DEGRADATION PROFILE (% Potency over Time)</div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -22, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[85, 101]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip color="#00ff9d" />} />
              <Line type="monotone" dataKey="longTerm" name="25°C/60%RH" stroke="#00ff9d" strokeWidth={2} dot={{ fill: '#00ff9d', r: 3 }} />
              <Line type="monotone" dataKey="accelerated" name="40°C/75%RH" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <NLSummary text={data.natural_language_summary} color="#00ff9d" />
    </GlassCard>
  );
};

// ─ PK Panel ────────────────────────────────────────────────────────────────────────
const PKPanel = ({ data }) => {
  if (!data) return null;
  const curveData = (data.bioavailability_curve || []).map(pt => ({
    time: parseFloat(pt.time) || 0,
    concentration: parseFloat(pt.concentration) || 0
  }));
  return (
    <GlassCard accentColor="#f59e0b">
      <SectionTitle icon={Brain} title="PK-Compatibility & Bioavailability" color="#f59e0b" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
        {[
          { label: 'Bioavailability', value: `${data.bioavailability_percent}%`, color: '#f59e0b' },
          { label: 'Tmax', value: `${data.tmax_hours}h`, color: '#00f2ff' },
          { label: 'T½', value: `${data.t_half_hours}h`, color: '#7000ff' },
          { label: 'Protein Binding', value: `${data.protein_binding_percent}%`, color: '#00ff9d' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '10px', padding: '11px', textAlign: 'center' }}>
            <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>
            <div style={{ color, fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '17px' }}>{value}</div>
          </div>
        ))}
      </div>
      {curveData.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px', marginBottom: '10px' }}>PLASMA CONCENTRATION-TIME CURVE</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={curveData} margin={{ top: 5, right: 10, left: -22, bottom: 5 }}>
              <defs>
                <linearGradient id="pkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Time (h)', position: 'insideBottomRight', fill: '#334155', fontSize: 10 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip color="#f59e0b" />} />
              <Area type="monotone" dataKey="concentration" name="Conc (ng/mL)" stroke="#f59e0b" strokeWidth={2.5} fill="url(#pkGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px' }}>
          <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px', marginBottom: '7px' }}>METABOLISM</div>
          {data.metabolism && (
            <>
              <div style={{ color: '#e2e8f0', fontSize: '12px', marginBottom: '3px' }}>{data.metabolism.primary_enzyme}</div>
              <div style={{ color: '#475569', fontSize: '10px', marginBottom: '6px' }}>1st Pass: {data.metabolism.first_pass}</div>
              {data.metabolism.metabolites?.slice(0, 2).map((m, i) => <Tag key={i} color="#f59e0b">{m}</Tag>)}
            </>
          )}
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px' }}>
          <div style={{ color: '#475569', fontSize: '9px', letterSpacing: '1px', marginBottom: '7px' }}>DOSING RECOMMENDATION</div>
          <div style={{ color: '#e2e8f0', fontSize: '11px', lineHeight: 1.5, marginBottom: '6px' }}>{data.recommended_dosage_form}</div>
          <div style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 600 }}>{data.dosing_frequency}</div>
        </div>
      </div>
      <NLSummary text={data.natural_language_summary} color="#f59e0b" />
    </GlassCard>
  );
};

// ─ Main Analysis Page ───────────────────────────────────────────────────────────
const AnalysisPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result || null;
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!result) return;
    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const M = 14;
      let y = 0;

      // ── COVER HEADER ─────────────────────────────────────────────
      // Teal-to-purple gradient effect via filled rects
      pdf.setFillColor(0, 18, 28);
      pdf.rect(0, 0, W, 46, 'F');
      pdf.setFillColor(0, 40, 60);
      pdf.rect(0, 0, 80, 46, 'F');
      // Cyan accent bar on left
      pdf.setFillColor(0, 242, 255);
      pdf.rect(0, 0, 4, 46, 'F');
      // Title
      pdf.setFontSize(20); pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 242, 255);
      pdf.text('PHARMA-AI', M + 2, 16);
      pdf.setFontSize(9); pdf.setTextColor(148, 180, 200);
      pdf.text('AI-Driven Formulation Science Platform', M + 2, 23);
      pdf.setFontSize(8); pdf.setTextColor(80, 120, 140);
      pdf.text(`Report generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, M + 2, 30);
      pdf.text(`Analysis ID: ${result.id || 'N/A'}${result.is_experimental ? '  |  EXPERIMENTAL COMPOUND' : ''}`, M + 2, 37);
      // Status badge (right side)
      pdf.setFillColor(result.is_experimental ? 112 : 0, result.is_experimental ? 0 : 190, result.is_experimental ? 255 : 100);
      pdf.roundedRect(W - 52, 12, 38, 12, 2, 2, 'F');
      pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
      pdf.text(result.is_experimental ? 'EXPERIMENTAL' : 'KNOWN DRUG', W - 33, 20, { align: 'center' });
      y = 54;

      // ── DRUG INFO BOX ────────────────────────────────────────────
      pdf.setFillColor(8, 16, 24);
      pdf.roundedRect(M, y, W - M * 2, 36, 3, 3, 'F');
      pdf.setDrawColor(0, 120, 160); pdf.setLineWidth(0.4);
      pdf.roundedRect(M, y, W - M * 2, 36, 3, 3, 'S');
      // Left accent
      pdf.setFillColor(0, 242, 255);
      pdf.rect(M, y, 3, 36, 'F');

      pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(240, 248, 255);
      pdf.text(result.drug_name, M + 8, y + 12);
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 140, 170);
      const smilesText = `SMILES: ${(result.smiles || '').substring(0, 68)}${(result.smiles || '').length > 68 ? '...' : ''}`;
      pdf.text(smilesText, M + 8, y + 21);
      pdf.setTextColor(150, 180, 200);
      pdf.text(`MW: ${result.molecular_weight} g/mol   Dose: ${result.dose_mg} mg   BCS: ${result.drug_info?.bcs_class || 'N/A'}   LogP: ${result.drug_info?.logp || 'N/A'}   Class: ${result.drug_info?.therapeutic_class || 'Unknown'}`, M + 8, y + 29);
      y += 44;

      // helper: add new page if needed
      const ensureSpace = (needed) => {
        if (y + needed > H - 16) { pdf.addPage(); y = M; }
      };

      // helper: colored section header
      const addSectionHeader = (title, bgRGB, textRGB) => {
        ensureSpace(18);
        pdf.setFillColor(...bgRGB);
        pdf.roundedRect(M, y, W - M * 2, 13, 2, 2, 'F');
        pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...textRGB);
        pdf.text(title, M + 6, y + 9);
        y += 18;
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(200, 218, 230);
      };

      // helper: colored metric row with bar
      const addMetricBar = (label, value, pct, barRGB) => {
        ensureSpace(12);
        pdf.setFontSize(8); pdf.setTextColor(140, 165, 185);
        pdf.text(label, M + 4, y + 5);
        pdf.setTextColor(...barRGB); pdf.setFont('helvetica', 'bold');
        pdf.text(String(value), W - M - 4, y + 5, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        // Track
        pdf.setFillColor(20, 30, 40); pdf.roundedRect(M + 4, y + 7, W - M * 2 - 8, 3, 1, 1, 'F');
        // Fill
        const fillW = Math.max(2, Math.min(pct / 100, 1) * (W - M * 2 - 8));
        pdf.setFillColor(...barRGB); pdf.roundedRect(M + 4, y + 7, fillW, 3, 1, 1, 'F');
        y += 14;
      };

      const addLine = (text, indent = 0, colorRGB = [190, 210, 225]) => {
        ensureSpace(7);
        const lines = pdf.splitTextToSize(text, W - M * 2 - indent - 4);
        pdf.setTextColor(...colorRGB); pdf.setFontSize(8.5);
        pdf.text(lines, M + 4 + indent, y);
        y += lines.length * 5;
      };

      const addNLBox = (text, borderRGB) => {
        if (!text) return;
        ensureSpace(20);
        const lines = pdf.splitTextToSize(`"${text}"`, W - M * 2 - 16);
        const boxH = lines.length * 4.8 + 10;
        pdf.setFillColor(10, 18, 28);
        pdf.roundedRect(M, y, W - M * 2, boxH, 2, 2, 'F');
        pdf.setDrawColor(...borderRGB); pdf.setLineWidth(0.5);
        pdf.line(M + 1, y + 1, M + 1, y + boxH - 1); // left accent line
        pdf.setFontSize(7); pdf.setTextColor(...borderRGB); pdf.setFont('helvetica', 'bold');
        pdf.text('PLAIN ENGLISH', M + 5, y + 5.5);
        pdf.setFont('helvetica', 'italic'); pdf.setTextColor(180, 200, 220);
        pdf.text(lines, M + 8, y + 10);
        y += boxH + 5;
        pdf.setFont('helvetica', 'normal');
      };

      const addKeyValues = (pairs) => {
        const colW = (W - M * 2 - 8) / 2;
        pairs.forEach(([label, value], i) => {
          if (i % 2 === 0) {
            ensureSpace(10);
          }
          const col = i % 2;
          const cx = M + 4 + col * (colW + 4);
          if (i % 2 === 0) {
            // Light row bg
            pdf.setFillColor(8, 16, 24);
            pdf.roundedRect(M, y, W - M * 2, 8, 1, 1, 'F');
          }
          pdf.setFontSize(8); pdf.setTextColor(100, 130, 150);
          pdf.text(label + ':', cx, y + 5.5);
          pdf.setTextColor(200, 220, 235); pdf.setFont('helvetica', 'bold');
          const labelW = pdf.getTextWidth(label + ': ');
          pdf.text(String(value || 'N/A'), cx + labelW, y + 5.5);
          pdf.setFont('helvetica', 'normal');
          if (col === 1) y += 10;
        });
        if (pairs.length % 2 !== 0) y += 10;
        y += 2;
      };

      // ── 1. MOLECULE OVERVIEW ─────────────────────────────────────
      if (result.molecule_overview) {
        addSectionHeader('MOLECULE OVERVIEW', [0, 35, 55], [0, 210, 240]);
        addLine(`Inferred Class: ${result.molecule_overview.inferred_class}`);
        addLine(`Drug-Likeness: ${result.molecule_overview.drug_likeness}`);
        if (result.molecule_overview.key_features?.length) {
          result.molecule_overview.key_features.forEach(f => addLine(`- ${f}`, 4));
        }
        y += 4;
      }

      // ── 2. SOLUBILITY ────────────────────────────────────────────
      if (result.solubility) {
        addSectionHeader('SOLUBILITY PREDICTION', [0, 30, 45], [0, 220, 255]);
        const sol = result.solubility;
        addMetricBar('Solubility Score', `${parseFloat(sol.prediction).toFixed(0)}/100`, parseFloat(sol.prediction), [0, 200, 240]);
        addMetricBar('Prediction Accuracy', `${sol.accuracy}%`, parseFloat(sol.accuracy), [0, 180, 210]);
        addKeyValues([
          ['Classification', sol.classification],
          ['Aqueous Solubility', `${sol.aqueous_solubility_mg_ml} mg/mL`],
          ['Optimal pH', sol.ph_optimal],
          ['Enhancement Needed', (parseFloat(sol.prediction) < 60) ? 'Yes' : 'No'],
        ]);
        if (sol.mechanisms?.length) {
          addLine('Mechanisms:', 0, [0, 180, 210]);
          sol.mechanisms.forEach(m => addLine(`- ${m}`, 4));
        }
        if (sol.enhancement_strategies?.length) {
          addLine('Enhancement Strategies:', 0, [0, 200, 200]);
          sol.enhancement_strategies.forEach(s => addLine(`>> ${s}`, 4));
        }
        addNLBox(sol.natural_language_summary, [0, 180, 210]);
      }

      // ── 3. EXCIPIENTS ────────────────────────────────────────────
      if (result.excipients) {
        addSectionHeader('EXCIPIENT RECOMMENDATIONS', [22, 0, 44], [180, 120, 255]);
        const exc = result.excipients;
        addKeyValues([
          ['Optimal Dosage Form', exc.optimal_dosage_form],
          ['Coating', exc.coating?.recommended ? exc.coating.type : 'Not required'],
        ]);
        ['binders', 'fillers', 'disintegrants', 'lubricants'].forEach(cat => {
          if (exc[cat]?.length) {
            addLine(`${cat.charAt(0).toUpperCase() + cat.slice(1)}:`, 0, [160, 100, 255]);
            exc[cat].forEach(e => addLine(`- ${e.name} (${e.grade || ''}) - ${e.recommended_conc}`, 4));
          }
        });
        if (exc.incompatibilities?.length) {
          addLine('! Incompatibilities to Avoid:', 0, [255, 120, 120]);
          exc.incompatibilities.forEach(i => addLine(`- ${i}`, 4, [220, 150, 150]));
        }
        addNLBox(exc.natural_language_summary, [150, 80, 255]);
      }

      // ── 4. STABILITY ─────────────────────────────────────────────
      if (result.stability) {
        addSectionHeader('STABILITY FORECAST', [0, 36, 22], [0, 220, 140]);
        const sta = result.stability;
        addMetricBar('Shelf-Life Score', `${sta.shelf_life_years} years`, (parseFloat(sta.shelf_life_years) / 5) * 100, [0, 200, 130]);
        addMetricBar('Stability Score', `${sta.shelf_life_score || 80}/100`, parseFloat(sta.shelf_life_score || 80), [0, 180, 110]);
        addKeyValues([
          ['Primary Degradation', sta.primary_degradation],
          ['Packaging', sta.packaging_recommendation],
          ['Temperature', sta.storage_conditions?.temperature],
          ['Humidity', sta.storage_conditions?.humidity],
          ['Light Protection', sta.storage_conditions?.light],
          ['Container', sta.storage_conditions?.container],
        ]);
        if (sta.degradation_mechanisms?.length) {
          addLine('Degradation Mechanisms:', 0, [0, 180, 110]);
          sta.degradation_mechanisms.forEach(m => addLine(`- ${m}`, 4));
        }
        // Stability table
        if (sta.accelerated_data?.length) {
          ensureSpace(30);
          addLine('ICH Stability Data:', 0, [0, 200, 130]);
          const tblX = M + 4; const colWs = [40, 30, 30];
          pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
          pdf.setFillColor(0, 40, 28);
          pdf.rect(tblX, y, colWs[0] + colWs[1] + colWs[2], 6, 'F');
          pdf.setTextColor(0, 210, 140);
          pdf.text('Condition', tblX + 2, y + 4.5);
          pdf.text('Month', tblX + colWs[0] + 2, y + 4.5);
          pdf.text('Potency (%)', tblX + colWs[0] + colWs[1] + 2, y + 4.5);
          y += 7; pdf.setFont('helvetica', 'normal');
          sta.accelerated_data.slice(0, 6).forEach((row, ri) => {
            ensureSpace(6);
            pdf.setFillColor(ri % 2 === 0 ? 8 : 12, ri % 2 === 0 ? 16 : 20, ri % 2 === 0 ? 12 : 18);
            pdf.rect(tblX, y, colWs[0] + colWs[1] + colWs[2], 5.5, 'F');
            pdf.setTextColor(160, 200, 180);
            pdf.text(row.condition, tblX + 2, y + 4);
            pdf.text(String(row.months), tblX + colWs[0] + 2, y + 4);
            const pot = parseFloat(row.potency);
            pdf.setTextColor(pot > 97 ? 0 : pot > 93 ? 200 : 220, pot > 97 ? 200 : pot > 93 ? 180 : 100, pot > 97 ? 130 : 60);
            pdf.text(String(row.potency), tblX + colWs[0] + colWs[1] + 2, y + 4);
            y += 5.5;
          });
          y += 5;
        }
        addNLBox(sta.natural_language_summary, [0, 190, 120]);
      }

      // ── 5. PK COMPATIBILITY ──────────────────────────────────────
      if (result.pk_compatibility) {
        addSectionHeader('PK-COMPATIBILITY & BIOAVAILABILITY', [36, 26, 0], [255, 190, 60]);
        const pk = result.pk_compatibility;
        addMetricBar('Bioavailability', `${pk.bioavailability_percent}%`, parseFloat(pk.bioavailability_percent), [240, 165, 30]);
        addMetricBar('Protein Binding', `${pk.protein_binding_percent}%`, parseFloat(pk.protein_binding_percent), [200, 140, 20]);
        addKeyValues([
          ['Tmax', `${pk.tmax_hours} h`],
          ['T1/2 (Half-life)', `${pk.t_half_hours} h`],
          ['Absorption', pk.absorption_rate],
          ['Volume of Distribution', `${pk.distribution_vd} L/kg`],
          ['Primary Enzyme', pk.metabolism?.primary_enzyme],
          ['First-Pass Effect', pk.metabolism?.first_pass],
          ['Excretion Route', pk.excretion?.route],
          ['Dosing Frequency', pk.dosing_frequency],
        ]);
        addLine(`Recommended: ${pk.recommended_dosage_form}`, 0, [220, 170, 50]);
        if (pk.metabolism?.metabolites?.length) {
          addLine('Major Metabolites:', 0, [200, 150, 40]);
          pk.metabolism.metabolites.forEach(m => addLine(`- ${m}`, 4));
        }
        addNLBox(pk.natural_language_summary, [230, 160, 40]);
      }

      // ── FOOTER ───────────────────────────────────────────────────
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFillColor(4, 8, 14);
        pdf.rect(0, H - 10, W, 10, 'F');
        pdf.setFontSize(7); pdf.setTextColor(60, 90, 110); pdf.setFont('helvetica', 'normal');
        pdf.text(`PHARMA-AI Formulation Optimizer  |  Page ${i} of ${totalPages}`, M, H - 4);
        pdf.text('For research use only. Consult a qualified pharmaceutical scientist before manufacturing.', W - M, H - 4, { align: 'right' });
      }

      pdf.save(`PHARMAI_${(result.drug_name || 'Compound').replace(/[\s/]/g, '_')}_Report.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setExporting(false);
    }
  };

  if (!result) {
    return (
      <div style={{ background: '#02060a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '24px' }}>No analysis data. Please run an analysis first.</div>
        <button data-testid="go-home-btn" onClick={() => navigate('/')} style={{ background: 'linear-gradient(135deg, #00f2ff, #7000ff)', border: 'none', borderRadius: '24px', padding: '12px 28px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Back to Home</button>
      </div>
    );
  }

  return (
    <div style={{ background: '#02060a', minHeight: '100vh', fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(0,242,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(2,6,10,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,242,255,0.08)', padding: '0 32px', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button data-testid="back-btn" onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '7px 13px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <ArrowLeft size={13} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            {result.is_experimental ? <Beaker size={18} color="#7000ff" /> : <Dna size={18} color="#00f2ff" />}
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '15px', color: '#f8fafc' }}>
              {result.drug_name}
              {result.is_experimental && <span style={{ marginLeft: '8px', background: 'rgba(112,0,255,0.15)', color: '#7000ff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600, letterSpacing: '0.5px' }}>EXPERIMENTAL</span>}
            </span>
          </div>
        </div>
        <button
          data-testid="export-pdf-btn"
          onClick={handleExportPDF}
          disabled={exporting}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.28)', borderRadius: '8px', padding: '7px 16px', color: '#f59e0b', cursor: exporting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          <Download size={14} /> {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      {/* Drug Info Bar */}
      <div style={{ padding: '20px 32px 0', position: 'relative', zIndex: 1 }}>
        <div data-testid="drug-info-bar" style={{ background: 'rgba(10,14,20,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '13px', padding: '18px 22px', display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto', maxWidth: '280px' }}>
            <div style={{ color: '#334155', fontSize: '9px', letterSpacing: '1px', marginBottom: '3px', fontFamily: 'JetBrains Mono, monospace' }}>SMILES</div>
            <code style={{ color: '#00f2ff', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>{result.smiles?.substring(0, 70)}{result.smiles?.length > 70 ? '...' : ''}</code>
          </div>
          {[
            { label: 'MW', value: `${result.molecular_weight} g/mol` },
            { label: 'Dose', value: `${result.dose_mg} mg` },
            { label: 'BCS', value: result.drug_info?.bcs_class },
            { label: 'LogP', value: result.drug_info?.logp },
            { label: 'Class', value: result.drug_info?.therapeutic_class },
          ].map(({ label, value }) => value && (
            <div key={label}>
              <div style={{ color: '#334155', fontSize: '9px', letterSpacing: '1px', marginBottom: '3px' }}>{label}</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '13px', fontFamily: 'Manrope, sans-serif' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Molecule Overview */}
      <div style={{ paddingTop: '16px' }}>
        <MoleculeOverview data={result.molecule_overview} isExperimental={result.is_experimental} />
      </div>

      {/* 3D Viewer on Analysis Page */}
      <div style={{ padding: '0 32px 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'rgba(10,14,20,0.8)', border: '1px solid rgba(0,242,255,0.1)', borderRadius: '16px', padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Eye size={14} color="#00f2ff" />
            <span style={{ color: '#00f2ff', fontSize: '11px', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>3D MOLECULAR STRUCTURE</span>
            <span style={{ color: '#334155', fontSize: '10px', marginLeft: '8px' }}>Interactive \u00b7 Rotate \u00b7 Zoom \u00b7 Change Style</span>
          </div>
          <MoleculeViewer smiles={result.smiles} />
        </div>
      </div>

      {/* 4-panel Grid */}
      <div style={{ padding: '0 32px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', position: 'relative', zIndex: 1 }}>
        <SolubilityPanel data={result.solubility} />
        <ExcipientPanel data={result.excipients} />
        <StabilityPanel data={result.stability} />
        <PKPanel data={result.pk_compatibility} />
      </div>

      <div style={{ padding: '0 32px 36px', position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#1e293b', fontSize: '11px', textAlign: 'center' }}>
          Analysis generated by PHARMA-AI - For research purposes only - {new Date().toLocaleDateString()}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>
    </div>
  );
};

export default AnalysisPage;
