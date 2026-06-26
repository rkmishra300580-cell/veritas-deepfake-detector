'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileImage, FileVideo, FileAudio, FileText, Download, AlertTriangle, ShieldAlert, ChevronRight, Lock, X, ZoomIn } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dfd-back-exc0.onrender.com';

const MOCK_RESULT = {
  job_id: 'a1b2c3d4e5f6',
  file_type: 'IMAGE',
  filename: 'sample_portrait.jpg',
  timestamp: new Date().toISOString(),
  final_score: 78.4,
  threat_level: 'HIGH',
  verdict: 'Multiple independent forensic and DL indicators strongly suggest synthetic or AI-generated content.',
  stage_scores: { frequency: 71.4, face_forensics: 66.7, deep_learning: 84.2 },
  indicators: [
    '[Frequency] Flattened high-frequency spectrum',
    '[Frequency] Weak high-frequency energy',
    '[Face] Face warping/smoothing artifacts',
    '[Face] Resolution mismatch: face vs surroundings',
    '[DL] Abnormally consistent patch variance',
    '[EXIF] No EXIF metadata — consistent with AI-generated image',
  ],
  metadata: {
    name: 'sample_portrait.jpg', size_bytes: 2147483, mime: 'image/jpeg',
    md5: '9f8e7d6c5b4a3210fedcba9876543210',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    analyzed_at: new Date().toISOString(),
  },
  stats: [
    { label: 'Low Band Energy', value: '0.8821' }, { label: 'Mid Band Energy', value: '0.3142' },
    { label: 'High Band Energy', value: '0.0512' }, { label: 'Spectral Entropy', value: '12.34' },
    { label: 'Faces Detected', value: '1' }, { label: 'Face Forensic Score', value: '66.7%' },
    { label: 'DL Model Score', value: '84.2%' }, { label: 'Final Fusion Score', value: '78.4%' },
  ],
  graphs: [
    { title: 'Frequency Spectrum', filename: null, description: 'Power and phase spectrum. Synthetic images show unnatural uniformity.' },
    { title: 'Frequency Decay Profile', filename: null, description: 'Real cameras decay smoothly. Flat regions suggest synthetic generation.' },
    { title: 'Face Detection', filename: null, description: '1 face detected. Analysed for warping, blending and resolution inconsistencies.' },
    { title: 'Deep Learning Analysis', filename: null, description: 'Attention heatmap and patch variance. DL confidence: 84.2%.' },
  ],
  pdf_ready: true,
};

const THREAT = {
  CRITICAL: { color: '#c0392b', label: 'CRITICAL' },
  HIGH:     { color: '#d97706', label: 'HIGH'     },
  MODERATE: { color: '#b7791f', label: 'MODERATE' },
  LOW:      { color: '#059669', label: 'LOW'      },
  MINIMAL:  { color: '#0891b2', label: 'MINIMAL'  },
};

function formatBytes(b) {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'], i = Math.floor(Math.log(b)/Math.log(k));
  return `${(b/Math.pow(k,i)).toFixed(2)} ${s[i]}`;
}

// ── Bubbles background ────────────────────────────────────────────────────────
function Bubbles() {
  const bubbles = [
    { size: 320, top: '-80px', left: '-60px',  delay: '0s',   dur: '18s', opacity: 0.55 },
    { size: 180, top: '10%',   left: '70%',    delay: '2s',   dur: '14s', opacity: 0.45 },
    { size: 240, top: '55%',   left: '-40px',  delay: '4s',   dur: '20s', opacity: 0.4  },
    { size: 130, top: '30%',   left: '55%',    delay: '1s',   dur: '16s', opacity: 0.35 },
    { size: 200, top: '75%',   left: '75%',    delay: '3s',   dur: '22s', opacity: 0.5  },
    { size: 90,  top: '20%',   left: '30%',    delay: '5s',   dur: '12s', opacity: 0.3  },
    { size: 160, top: '80%',   left: '20%',    delay: '6s',   dur: '17s', opacity: 0.38 },
    { size: 110, top: '45%',   left: '85%',    delay: '0.5s', dur: '15s', opacity: 0.32 },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {bubbles.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: b.top,
          left: b.left,
          width: b.size,
          height: b.size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, rgba(59,130,246,${b.opacity}) 0%, rgba(45,212,191,0.08) 55%, transparent 75%)`,
          border: '1px solid rgba(59,130,246,0.15)',
          backdropFilter: 'blur(2px)',
          animation: `floatBubble ${b.dur} ease-in-out infinite`,
          animationDelay: b.delay,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(45,212,191,0.06)`,
        }} />
      ))}
    </div>
  );
}

// ── Graph carousel — layout unchanged, visual restyled ────────────────────────
function OrbitCarousel({ graphs, jobId, isMock }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const total = graphs.length;

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % total), 4000);
    return () => clearInterval(t);
  }, [total]);

  const getOrbitPos = (index, total, radius) => {
    const angle = ((index - active) / total) * 2 * Math.PI - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  };

  const imgSrc = (g) => g.filename && jobId
    ? `${API_BASE_URL}/graph/${jobId}/${g.filename}`
    : null;

  return (
    <>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(10,15,25,0.88)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
        }}>
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }} />
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.12)',
            border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}><X size={18} /></button>
        </div>
      )}

      <div style={{ position: 'relative', width: '100%', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Orbit rings — now very subtle on light bg */}
        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(45,212,191,0.14)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(45,212,191,0.08)', pointerEvents: 'none' }} />

        {graphs.map((g, i) => {
          const isActive = i === active;
          const pos = getOrbitPos(i, total, 148);
          const src = imgSrc(g);
          return (
            <div key={i}
              onClick={() => { if (isActive) { if (src) setLightbox(src); } else setActive(i); }}
              style={{
                position: 'absolute',
                left: '50%', top: '50%',
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                width: isActive ? 72 : 52,
                height: isActive ? 54 : 39,
                borderRadius: 6,
                border: isActive ? '2px solid #2dd4bf' : '1px solid rgba(45,212,191,0.25)',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 20px rgba(45,212,191,0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
                zIndex: isActive ? 10 : 1,
                background: '#0d1c35',
              }}
            >
              {src
                ? <img src={src} alt={g.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#586069', textAlign: 'center', padding: 2 }}>DEMO</div>
              }
            </div>
          );
        })}

        {/* Centre: active graph large */}
        <div style={{
          position: 'relative', width: 340, height: 240, borderRadius: 10,
          border: '1px solid rgba(45,212,191,0.2)', overflow: 'hidden',
          background: '#0d1c35',
          boxShadow: '0 8px 40px rgba(45,212,191,0.08), 0 2px 12px rgba(0,0,0,0.06)',
        }}>
          {imgSrc(graphs[active])
            ? <>
                <img src={imgSrc(graphs[active])} alt={graphs[active].title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setLightbox(imgSrc(graphs[active]))} style={{
                  position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 4, padding: '4px 6px',
                  cursor: 'pointer', color: '#c9d1d9', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                }}>
                  <ZoomIn size={11} /> Full
                </button>
              </>
            : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 11, color: '#586069', fontFamily: 'monospace' }}>[ demo mode ]</div>
                <div style={{ fontSize: 12, color: '#586069', textAlign: 'center', padding: '0 16px' }}>{graphs[active].title}</div>
              </div>
          }
        </div>

        {/* Caption */}
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center', width: 340,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#2dd4bf', marginBottom: 2 }}>
            {graphs[active].title}
          </div>
          <div style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.4 }}>
            {graphs[active].description}
          </div>
        </div>

        {/* Dot nav */}
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
          {graphs.map((_, i) => (
            <div key={i} onClick={() => setActive(i)} style={{
              width: i === active ? 18 : 6, height: 6, borderRadius: 3,
              background: i === active ? '#2dd4bf' : '#1e2d4a',
              cursor: 'pointer', transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>
    </>
  );
}

// ── Score arc — same logic, light theme colours ───────────────────────────────
function ScoreArc({ score, threatLevel }) {
  const cfg = THREAT[threatLevel] || THREAT.MODERATE;
  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1e2d4a" strokeWidth="8" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={cfg.color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>
          {score.toFixed(0)}
        </div>
        <div style={{ fontSize: 9, color: '#586069', letterSpacing: 1, marginTop: 2 }}>% FAKE</div>
      </div>
    </div>
  );
}

// ── Scanning stage list — replaces spinning ring ──────────────────────────────
function ScanStages({ progress }) {
  const stages = [
    { label: 'Frequency domain analysis',    thresh: 20  },
    { label: 'Face forensic analysis',        thresh: 40  },
    { label: 'Manipulation analysis',         thresh: 62  },
    { label: 'Vehicle & object analysis',     thresh: 78  },
    { label: 'Deep learning classification',  thresh: 90  },
  ];
  return (
    <div style={{ maxWidth: 380, margin: '0 auto', width: '100%' }}>
      {stages.map((s, i) => {
        const done   = progress > s.thresh;
        const active = !done && (i === 0 ? progress > 0 : progress > stages[i-1].thresh);
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '11px 0',
            borderBottom: i < stages.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
          }}>
            {/* dot */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: done ? '#2dd4bf' : active ? '#2dd4bf' : '#1e2d4a',
              opacity: active ? 1 : done ? 1 : 0.5,
              animation: active ? 'pulseDot 1.2s ease-in-out infinite' : 'none',
            }} />
            {/* label */}
            <span style={{
              fontSize: 13, flex: 1,
              color: done ? '#e6edf3' : active ? '#e6edf3' : '#586069',
            }}>{s.label}</span>
            {/* status */}
            <span style={{
              fontSize: 11, letterSpacing: '0.06em',
              color: done ? '#2dd4bf' : active ? '#94a3b8' : '#cbd5e1',
              animation: active ? 'pulseDot 1.2s ease-in-out infinite' : 'none',
            }}>
              {done ? 'Complete' : active ? 'Running' : ''}
            </span>
          </div>
        );
      })}
      {/* thin progress bar */}
      <div style={{ marginTop: 20, height: 2, background: '#1e2d4a', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#2dd4bf,#0891b2)', transition: 'width 0.4s ease', borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#586069' }}>
        <span>Running forensic pipeline</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function VeritasApp() {
  const [stage, setStage] = useState('upload');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const fileInputRef = useRef(null);
  const progressRef = useRef(null);

  const handleFileSelect = useCallback((f) => { if (f) setFile(f); }, []);
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const startAnalysis = async () => {
    if (!file) return;
    setStage('scanning'); setProgress(0); setErrorMsg(''); setIsMock(false);
    progressRef.current = setInterval(() => setProgress(p => p < 90 ? p + Math.random() * 7 : p), 500);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: fd,
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      clearInterval(progressRef.current); setProgress(100);
      if (data.error) { setTimeout(() => { setErrorMsg(data.error); setStage('error'); }, 400); return; }
      setTimeout(() => { setResult(data); setStage('results'); }, 500);
    } catch {
      clearInterval(progressRef.current); setProgress(100); setIsMock(true);
      setTimeout(() => { setResult({ ...MOCK_RESULT, filename: file.name }); setStage('results'); }, 500);
    }
  };

  const reset = () => { setStage('upload'); setFile(null); setProgress(0); setResult(null); setErrorMsg(''); setIsMock(false); };
  const downloadPDF = () => {
    if (isMock) { alert('PDF requires a live server connection.'); return; }
    window.open(`${API_BASE_URL}/report/${result.job_id}`, '_blank');
  };

  const cfg = result ? (THREAT[result.threat_level] || THREAT.MODERATE) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', color: '#e6edf3', fontFamily: "'Inter',-apple-system,sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:#2dd4bf;color:#0a1628;}
        @keyframes floatBubble{
          0%,100%{transform:translateY(0) scale(1);}
          33%{transform:translateY(-18px) scale(1.02);}
          66%{transform:translateY(10px) scale(0.98);}
        }
        @keyframes pulseDot{0%,100%{opacity:1;}50%{opacity:0.3;}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes revealLine{from{width:0;}to{width:100%;}}
        .btn-primary{background:#2dd4bf;color:#fff;border:none;border-radius:6px;padding:11px 22px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:all 0.2s;letter-spacing:0.2px;}
        .btn-primary:hover{background:#14b8a6;box-shadow:0 4px 16px rgba(45,212,191,0.3);}
        .btn-ghost{background:transparent;color:#8b949e;border:1px solid #1e2d4a;border-radius:6px;padding:11px 18px;font-size:13px;cursor:pointer;transition:all 0.2s;}
        .btn-ghost:hover{border-color:#2dd4bf;color:#e6edf3;}
        .card{background:#0d1c35;border:1px solid #1e2d4a;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);}
        .mono{font-family:'JetBrains Mono',monospace;}
      `}</style>

      {/* Floating bubbles */}
      <Bubbles />

      {/* HEADER */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,22,40,0.88)', backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ShieldAlert size={20} color="#2dd4bf" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#2dd4bf', letterSpacing: 2, textTransform: 'uppercase', lineHeight: 1 }}>AlgorivX.AI</span>
            <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5, color: '#e6edf3', lineHeight: 1 }}>Darpan</span>
          </div>
          <span className="mono" style={{ fontSize: 10, color: '#586069', border: '1px solid #1e2d4a', padding: '2px 7px', borderRadius: 4, alignSelf: 'flex-end', marginBottom: 2 }}>FORENSIC ENGINE v5</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13, color: '#8b949e' }}>
          {result && <button onClick={reset} className="btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }}>New analysis</button>}
          {result && <button onClick={downloadPDF} className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}>
            <Download size={13} /> PDF Report
          </button>}
          <span style={{ fontSize: 12 }}>Pro Plan</span>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#2dd4bf,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>U</div>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 24px 48px' }}>

        {/* ── UPLOAD ── */}
        {stage === 'upload' && (
          <div style={{ animation: 'fadeIn 0.4s ease', paddingTop: 64 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="mono" style={{ fontSize: 11, color: '#2dd4bf', letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' }}>AlgorivX.AI · Darpan · Multi-stage forensic analysis</div>
              <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 16, color: '#e6edf3' }}>
                Is this real<span style={{ color: '#2dd4bf' }}>?</span>
              </h1>
              <p style={{ color: '#8b949e', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
                Upload an image, video, audio clip, or document. Our forensic engine runs frequency analysis, face forensics, and deep learning inference — all in one pass.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? '#2dd4bf' : file ? 'rgba(45,212,191,0.5)' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: 14, padding: file ? '32px 24px' : '64px 24px', textAlign: 'center', cursor: 'pointer',
                background: dragActive ? 'rgba(45,212,191,0.06)' : 'rgba(13,28,53,0.8)',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(8px)',
                boxShadow: dragActive ? '0 0 0 4px rgba(45,212,191,0.1)' : 'none',
              }}
            >
              <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files?.[0])}
                accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp,.mp4,.avi,.mov,.mkv,.webm,.mp3,.wav,.aac,.flac,.ogg,.m4a,.pdf,.docx,.txt"
              />
              {file
                ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(45,212,191,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <FileImage size={20} color="#2dd4bf" />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#e6edf3' }}>{file.name}</div>
                    <div className="mono" style={{ fontSize: 12, color: '#586069' }}>{formatBytes(file.size)}</div>
                  </div>
                : <>
                    <Upload size={28} color="rgba(45,212,191,0.6)" style={{ marginBottom: 14 }} />
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6, color: '#e6edf3' }}>Drop a file here, or click to browse</div>
                    <div style={{ fontSize: 13, color: '#586069' }}>JPG · PNG · MP4 · MOV · MP3 · WAV · PDF · DOCX — up to 500 MB</div>
                  </>
              }
            </div>

            {file && (
              <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
                <button className="btn-primary" onClick={startAnalysis}>Run analysis <ChevronRight size={15} /></button>
                <button className="btn-ghost" onClick={() => setFile(null)}>Clear</button>
              </div>
            )}

            {/* Capability pills */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
              {[
                { icon: FileImage, label: 'Images', desc: 'Frequency · Face · DL' },
                { icon: FileVideo, label: 'Video', desc: 'Frame · Temporal' },
                { icon: FileAudio, label: 'Audio', desc: 'Voice clone · TTS' },
                { icon: FileText, label: 'Documents', desc: 'AI text detection' },
              ].map(item => (
                <div key={item.label} className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
                  <item.icon size={16} color="#2dd4bf" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#586069', marginTop: 1 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SCANNING ── */}
        {stage === 'scanning' && (
          <div style={{ paddingTop: 80, animation: 'fadeIn 0.3s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div className="mono" style={{ fontSize: 11, color: '#2dd4bf', letterSpacing: 3, marginBottom: 10, textTransform: 'uppercase' }}>Analysing</div>
              <div style={{ fontSize: 15, color: '#e6edf3', fontWeight: 500 }}>{file?.name}</div>
            </div>
            <ScanStages progress={progress} />
          </div>
        )}

        {/* ── ERROR ── */}
        {stage === 'error' && (
          <div className="card" style={{ maxWidth: 480, margin: '80px auto', padding: 40, textAlign: 'center', borderColor: 'rgba(239,68,68,0.2)', animation: 'fadeIn 0.3s ease' }}>
            <AlertTriangle size={28} color="#ef4444" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#e6edf3' }}>Analysis failed</div>
            <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 24, lineHeight: 1.6 }}>
              {errorMsg || 'Could not reach the analysis server. The server may be waking up — please wait 60 seconds and try again.'}
            </div>
            <button className="btn-ghost" onClick={reset}>Try another file</button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {stage === 'results' && result && (
          <div style={{ animation: 'fadeIn 0.5s ease', paddingTop: 32 }}>

            {/* Reveal line */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #2dd4bf 40%, transparent)', animation: 'revealLine 0.9s ease forwards', width: 0, marginBottom: 24 }} />

            {isMock && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 16px', fontSize: 12, color: '#d97706', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={13} /> Demo mode — live server unreachable. Showing sample data.
              </div>
            )}

            {/* TOP ROW: score + verdict + stage bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, marginBottom: 16 }}>

              {/* Score card */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, borderColor: `${cfg.color}25` }}>
                <ScoreArc score={result.final_score} threatLevel={result.threat_level} />
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 4, padding: '3px 10px', textTransform: 'uppercase', background: `${cfg.color}08` }}>
                  {cfg.label}
                </div>
              </div>

              {/* Verdict + stage scores */}
              <div className="card" style={{ padding: 24, borderColor: `${cfg.color}15` }}>
                <p style={{ fontSize: 14, color: '#c9d1d9', lineHeight: 1.7, marginBottom: 20 }}>{result.verdict}</p>
                {result.stage_scores && (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(result.stage_scores).filter(k => result.stage_scores[k] !== null).length}, 1fr)`, gap: 10 }}>
                    {Object.entries(result.stage_scores).map(([k, v]) => v !== null && (
                      <div key={k} style={{ background: '#162040', borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${v >= 50 ? '#d97706' : '#059669'}` }}>
                        <div style={{ fontSize: 10, color: '#586069', textTransform: 'capitalize', marginBottom: 4, letterSpacing: 0.5 }}>{k.replace(/_/g,' ')}</div>
                        <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: v >= 50 ? '#d97706' : '#059669' }}>{v}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* MIDDLE ROW: graph carousel + indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>

              {/* Carousel */}
              <div className="card" style={{ padding: '16px 0 0', overflow: 'hidden' }}>
                <div style={{ padding: '0 20px 12px', fontSize: 11, color: '#586069', letterSpacing: 1, textTransform: 'uppercase' }}>Visual analysis</div>
                {result.graphs?.length > 0
                  ? <OrbitCarousel graphs={result.graphs} jobId={result.job_id} isMock={isMock} />
                  : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#586069', fontSize: 13 }}>No graphs available</div>
                }
              </div>

              {/* Indicators */}
              <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
                  Flagged indicators {result.indicators?.length > 0 && <span style={{ color: '#d97706' }}>({result.indicators.length})</span>}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {result.indicators?.length > 0
                    ? result.indicators.map((ind, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: 'rgba(217,119,6,0.04)', border: '1px solid rgba(217,119,6,0.12)', borderRadius: 6 }}>
                          <AlertTriangle size={12} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ fontSize: 12, color: '#c9d1d9', lineHeight: 1.5 }}>{ind}</span>
                        </div>
                      ))
                    : <div style={{ fontSize: 13, color: '#586069', textAlign: 'center', marginTop: 40 }}>No suspicious indicators detected</div>
                  }
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: metrics + file evidence */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {result.stats?.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 11, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Detailed metrics</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {result.stats.map((s, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: '#0d1c35', borderRadius: 6 }}>
                        <div style={{ fontSize: 10, color: '#586069', marginBottom: 3 }}>{s.label}</div>
                        <div className="mono" style={{ fontSize: 13, color: '#e6edf3' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File evidence */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 11, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={11} /> File evidence
                </div>
                <div className="mono" style={{ fontSize: 11, color: '#8b949e', lineHeight: 2.2 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#3d5070', minWidth: 56 }}>FILE</span>
                    <span style={{ color: '#e6edf3' }}>{result.filename}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#3d5070', minWidth: 56 }}>SIZE</span>
                    <span>{formatBytes(result.metadata?.size_bytes)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#3d5070', minWidth: 56 }}>MIME</span>
                    <span>{result.metadata?.mime}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#3d5070', minWidth: 56 }}>MD5</span>
                    <span style={{ wordBreak: 'break-all', fontSize: 10 }}>{result.metadata?.md5}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#3d5070', minWidth: 56 }}>JOB</span>
                    <span>{result.job_id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#3d5070', minWidth: 56 }}>TIME</span>
                    <span style={{ fontSize: 10 }}>{result.metadata?.analyzed_at ? new Date(result.metadata.analyzed_at).toLocaleString() : '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
