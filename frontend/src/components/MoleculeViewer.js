import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Eye, Loader2, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STYLES = [
  { id: 'ballstick', label: 'Ball & Stick' },
  { id: 'stick', label: 'Stick' },
  { id: 'sphere', label: 'Sphere' },
  { id: 'surface', label: 'Surface' },
];

// Load 3Dmol.js once globally
let scriptPromise = null;
const load3Dmol = () => {
  if (window.$3Dmol) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('3dmol-script');
    if (existing) {
      existing.onload = resolve;
      existing.onerror = reject;
      return;
    }
    const script = document.createElement('script');
    script.id = '3dmol-script';
    script.src = 'https://3Dmol.org/build/3Dmol-min.js';
    script.async = true;
    script.onload = () => { scriptPromise = null; resolve(); };
    script.onerror = () => { scriptPromise = null; reject(new Error('Failed to load 3Dmol.js')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

const MoleculeViewer = ({ smiles }) => {
  const viewerRef = useRef(null);
  const glviewerRef = useRef(null);
  const abortRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState('');
  const [activeStyle, setActiveStyle] = useState('ballstick');

  const applyStyle = useCallback((viewer, styleName) => {
    if (!viewer) return;
    try {
      viewer.removeAllSurfaces();
      viewer.setStyle({}, {});
      if (styleName === 'stick') {
        viewer.setStyle({}, { stick: { colorscheme: 'Jmol', radius: 0.15 } });
      } else if (styleName === 'sphere') {
        viewer.setStyle({}, { sphere: { colorscheme: 'Jmol', scale: 0.4 } });
      } else if (styleName === 'ballstick') {
        viewer.setStyle({}, {
          stick: { colorscheme: 'Jmol', radius: 0.12 },
          sphere: { colorscheme: 'Jmol', scale: 0.28 }
        });
      } else if (styleName === 'surface') {
        viewer.setStyle({}, { stick: { colorscheme: 'Jmol', radius: 0.1 } });
        viewer.addSurface(window.$3Dmol.SurfaceType.VDW, {
          opacity: 0.65,
          colorscheme: { gradient: 'rwb' }
        });
      }
      viewer.render();
    } catch (e) {
      console.warn('Style apply error:', e);
    }
  }, []);

  const loadMolecule = useCallback(async (smilesStr) => {
    if (!smilesStr || smilesStr.trim().length < 4) return;

    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError('');

    try {
      // Ensure 3Dmol.js is loaded first
      await load3Dmol();

      // Wait a tick for 3Dmol to fully initialize
      await new Promise(r => setTimeout(r, 100));

      if (!window.$3Dmol) throw new Error('3Dmol library not available');
      if (controller.signal.aborted) return;

      // Fetch 3D SDF from backend
      const res = await fetch(
        `${BACKEND_URL}/api/molecule3d?smiles=${encodeURIComponent(smilesStr)}`,
        { signal: controller.signal }
      );

      // Always read as text first to avoid JSON parse errors on HTML error pages
      const rawText = await res.text();
      if (controller.signal.aborted) return;

      if (!res.ok) {
        let detail = '3D structure not available for this compound';
        try { detail = JSON.parse(rawText).detail || detail; } catch (_) {}
        throw new Error(detail);
      }

      let sdf = '';
      try {
        sdf = JSON.parse(rawText).sdf;
      } catch (_) {
        throw new Error('Invalid response from 3D structure service');
      }

      if (!sdf || (!sdf.includes('V2000') && !sdf.includes('V3000'))) {
        throw new Error('No valid 3D coordinates returned from PubChem');
      }

      if (!viewerRef.current) throw new Error('Viewer container not ready');

      // Clean up previous viewer
      if (glviewerRef.current) {
        try { glviewerRef.current.clear(); } catch (_) {}
        glviewerRef.current = null;
      }
      viewerRef.current.innerHTML = '';

      // Create new viewer
      const viewer = window.$3Dmol.createViewer(viewerRef.current, {
        backgroundColor: '0x0a0e14',
        antialias: true,
        id: `mol-viewer-${Date.now()}`,
      });

      if (!viewer) throw new Error('Failed to create 3D viewer');
      glviewerRef.current = viewer;

      viewer.addModel(sdf, 'sdf');
      applyStyle(viewer, activeStyle);
      viewer.zoomTo();
      viewer.zoom(0.82);
      viewer.render();
      viewer.spin('y', 0.5);

      setStatus('ready');
    } catch (err) {
      if (err.name === 'AbortError') return; // intentionally cancelled
      console.error('3D viewer error:', err);
      setError(err.message || '3D structure unavailable');
      setStatus('error');
    }
  }, [activeStyle, applyStyle]);

  // Trigger load when smiles changes (debounced)
  useEffect(() => {
    if (!smiles || smiles.trim().length < 4) {
      setStatus('idle');
      return;
    }
    const t = setTimeout(() => loadMolecule(smiles), 800);
    return () => clearTimeout(t);
  }, [smiles, loadMolecule]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (glviewerRef.current) {
        try { glviewerRef.current.clear(); } catch (_) {}
      }
    };
  }, []);

  const handleStyleChange = (style) => {
    setActiveStyle(style);
    if (glviewerRef.current && status === 'ready') {
      applyStyle(glviewerRef.current, style);
    }
  };

  return (
    <div style={{ marginTop: '16px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(0,242,255,0.15)', background: 'rgba(5,9,14,0.95)' }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,242,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={13} color="#00f2ff" />
          <span style={{ color: '#00f2ff', fontSize: '10px', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace' }}>3D MOLECULAR VIEWER</span>
          {status === 'ready' && <span style={{ color: '#00ff9d', fontSize: '9px', fontFamily: 'JetBrains Mono, monospace' }}>LIVE</span>}
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => handleStyleChange(s.id)}
              style={{
                padding: '4px 10px', borderRadius: '12px', fontSize: '10px',
                cursor: 'pointer', border: 'none',
                background: activeStyle === s.id ? 'rgba(0,242,255,0.2)' : 'rgba(255,255,255,0.04)',
                color: activeStyle === s.id ? '#00f2ff' : '#475569',
                fontWeight: activeStyle === s.id ? 700 : 400,
              }}
            >{s.label}</button>
          ))}
          {status === 'ready' && (
            <button
              onClick={() => glviewerRef.current?.spin('y', 0.5)}
              title="Resume spin"
              style={{ padding: '4px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
            ><RotateCcw size={11} /></button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', height: '280px', background: '#0a0e14' }}>
        <div
          ref={viewerRef}
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, display: status === 'ready' ? 'block' : 'none' }}
        />

        {status === 'idle' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '1px solid rgba(0,242,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Eye size={22} color="rgba(0,242,255,0.18)" />
            </div>
            <div style={{ color: '#334155', fontSize: '12px' }}>3D visualization will appear here</div>
            <div style={{ color: '#1e293b', fontSize: '11px', marginTop: '4px' }}>Enter a SMILES string above</div>
          </div>
        )}

        {status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,14,20,0.8)' }}>
            <Loader2 size={30} color="#00f2ff" style={{ marginBottom: '14px', animation: 'spin3d 1s linear infinite' }} />
            <div style={{ color: '#475569', fontSize: '12px' }}>Fetching 3D coordinates from PubChem...</div>
            <div style={{ color: '#1e293b', fontSize: '10px', marginTop: '4px' }}>This takes 2-5 seconds</div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px', textAlign: 'center' }}>
            <AlertCircle size={26} color="rgba(245,158,11,0.5)" style={{ marginBottom: '12px' }} />
            <div style={{ color: '#78350f', fontSize: '12px', lineHeight: 1.6, maxWidth: '300px' }}>{error}</div>
            <div style={{ color: '#292524', fontSize: '11px', marginTop: '10px', lineHeight: 1.5 }}>
              3D view requires a PubChem-registered compound.<br />
              The AI analysis still runs on <em>any</em> SMILES.
            </div>
          </div>
        )}
      </div>

      {status === 'ready' && (
        <div style={{ padding: '7px 14px', background: 'rgba(0,242,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#1e3a3a', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}>Drag to rotate &middot; Scroll to zoom &middot; Right-click to pan</span>
          <span style={{ color: '#1a2e2e', fontSize: '10px' }}>Source: PubChem 3D</span>
        </div>
      )}

      <style>{`
        @keyframes spin3d { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MoleculeViewer;
