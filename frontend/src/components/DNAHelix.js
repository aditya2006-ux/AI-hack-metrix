import React, { useEffect, useRef } from 'react';

const DNAHelix = ({ scrollRotation = 0 }) => {
  const helixRef = useRef(null);
  const NUM_RUNGS = 60;
  const HELIX_HEIGHT = 600;
  const features = ['Solubility Engine', 'Excipient AI', 'Stability Tools', 'PK Modeling'];

  const rungs = Array.from({ length: NUM_RUNGS }, (_, i) => {
    const topPercent = (i / NUM_RUNGS) * 100;
    const rotateY = i * 12;
    const isLabeled = i % 15 === 0;
    const featureLabel = isLabeled ? features[Math.floor(i / 15) % features.length] : null;
    const opacity = 0.4 + (Math.sin(i * 0.3) + 1) * 0.3;

    return { i, topPercent, rotateY, featureLabel, opacity };
  });

  return (
    <div
      style={{
        perspective: '1200px',
        width: '220px',
        height: `${HELIX_HEIGHT}px`,
        position: 'relative',
      }}
    >
      <div
        ref={helixRef}
        style={{
          position: 'relative',
          width: '220px',
          height: `${HELIX_HEIGHT}px`,
          transformStyle: 'preserve-3d',
          transform: `rotateY(${scrollRotation}deg) rotateX(8deg)`,
          transition: 'transform 0.08s linear',
        }}
      >
        {rungs.map(({ i, topPercent, rotateY, featureLabel, opacity }) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '100%',
              top: `${topPercent}%`,
              transformStyle: 'preserve-3d',
              transform: `rotateY(${rotateY}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity,
            }}
          >
            {/* Left Node */}
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#00f2ff',
                boxShadow: '0 0 12px #00f2ff, 0 0 24px rgba(0,242,255,0.4)',
                flexShrink: 0,
              }}
            />
            {/* Bond */}
            <div
              style={{
                flex: 1,
                height: '1.5px',
                background: 'linear-gradient(90deg, #00f2ff, #7000ff)',
                opacity: 0.5,
                margin: '0 4px',
              }}
            />
            {/* Right Node */}
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#7000ff',
                boxShadow: '0 0 12px #7000ff, 0 0 24px rgba(112,0,255,0.4)',
                flexShrink: 0,
              }}
            />
            {/* Label */}
            {featureLabel && (
              <span
                style={{
                  position: 'absolute',
                  left: '110%',
                  fontSize: '9px',
                  color: '#00f2ff',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  opacity: 0.7,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {featureLabel}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DNAHelix;
