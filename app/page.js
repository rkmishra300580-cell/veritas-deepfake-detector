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
  CRITICAL: { color: '#ff3b3b', glow: 'rgba(255,59,59,0.35)', label: 'CRITICAL', ring: '#ff3b3b' },
  HIGH:     { color: '#ff8c00', glow: 'rgba(255,140,0,0.35)',  label: 'HIGH',     ring: '#ff8c00' },
  MODERATE: { color: '#f5c518', glow: 'rgba(245,197,24,0.35)', label: 'MODERATE', ring: '#f5c518' },
  LOW:      { color: '#00e5a0', glow: 'rgba(0,229,160,0.35)',  label: 'LOW',      ring: '#00e5a0' },
  MINIMAL:  { color: '#00d4d4', glow: 'rgba(0,212,212,0.35)', label: 'MINIMAL',  ring: '#00d4d4' },
};

function formatBytes(b) {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'], i = Math.floor(Math.log(b)/Math.log(k));
  return `${(b/Math.pow(k,i)).toFixed(2)} ${s[i]}`;
}

// Orbiting graph carousel — the signature element
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
      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
        }}>
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 0 60px rgba(0,212,212,0.3)' }} />
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.1)',
            border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}><X size={18} /></button>
        </div>
      )}

      <div style={{ position: 'relative', width: '100%', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Orbit rings */}
        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(0,212,212,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(0,212,212,0.07)', pointerEvents: 'none' }} />

        {/* Orbiting thumbnails */}
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
                border: isActive ? '2px solid #00d4d4' : '1px solid rgba(0,212,212,0.3)',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: isActive ? '0 0 20px rgba(0,212,212,0.5)' : 'none',
                zIndex: isActive ? 10 : 1,
                background: '#0d1117',
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
          border: '1px solid rgba(0,212,212,0.25)', overflow: 'hidden',
          background: '#0d1117',
          boxShadow: '0 0 60px rgba(0,212,212,0.08), inset 0 0 30px rgba(0,0,0,0.5)',
        }}>
          {imgSrc(graphs[active])
            ? <>
                <img src={imgSrc(graphs[active])} alt={graphs[active].title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setLightbox(imgSrc(graphs[active]))} style={{
                  position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '4px 6px',
                  cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                }}>
                  <ZoomIn size={11} /> Full
                </button>
              </>
            : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 11, color: '#586069', fontFamily: 'monospace' }}>[ demo mode ]</div>
                <div style={{ fontSize: 12, color: '#30363d', textAlign: 'center', padding: '0 16px' }}>{graphs[active].title}</div>
              </div>
          }
          {/* Scan line overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,212,212,0.03) 50%, transparent 100%)',
            animation: 'scanline 3s ease-in-out infinite',
          }} />
        </div>

        {/* Caption below centre */}
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center', width: 340,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#00d4d4', marginBottom: 2 }}>
            {graphs[active].title}
          </div>
          <div style={{ fontSize: 11, color: '#586069', lineHeight: 1.4 }}>
            {graphs[active].description}
          </div>
        </div>

        {/* Dot nav */}
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
          {graphs.map((_, i) => (
            <div key={i} onClick={() => setActive(i)} style={{
              width: i === active ? 18 : 6, height: 6, borderRadius: 3,
              background: i === active ? '#00d4d4' : '#30363d',
              cursor: 'pointer', transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>
    </>
  );
}

function ScoreArc({ score, threatLevel }) {
  const cfg = THREAT[threatLevel] || THREAT.MODERATE;
  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={cfg.color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${cfg.color})` }}
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
    <div style={{ minHeight: '100vh', background: '#080c12', color: '#e6edf3', fontFamily: "'Inter',-apple-system,sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:#00d4d4;color:#080c12;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes scanline{0%,100%{opacity:0.3;transform:translateY(0);}50%{opacity:0.8;transform:translateY(100%)}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,212,212,0.2);}50%{box-shadow:0 0 40px rgba(0,212,212,0.5);}}
        .btn-primary{background:#00d4d4;color:#080c12;border:none;border-radius:6px;padding:11px 22px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:all 0.2s;letter-spacing:0.3px;}
        .btn-primary:hover{background:#00f0f0;box-shadow:0 0 20px rgba(0,212,212,0.4);}
        .btn-ghost{background:transparent;color:#8b949e;border:1px solid #1f2937;border-radius:6px;padding:11px 18px;font-size:13px;cursor:pointer;transition:all 0.2s;}
        .btn-ghost:hover{border-color:#00d4d4;color:#e6edf3;}
        .card{background:rgba(13,17,23,0.8);border:1px solid rgba(255,255,255,0.06);border-radius:10px;backdrop-filter:blur(12px);}
        .mono{font-family:'JetBrains Mono',monospace;}
      `}</style>

      {/* Ambient background blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,212,0.04) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -200, right: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,100,255,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(8,12,18,0.85)', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ShieldAlert size={20} color="#00d4d4" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#00d4d4', letterSpacing: 2, textTransform: 'uppercase', lineHeight: 1 }}>AlgorivX.AI</span>
            <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5, color: '#e6edf3', lineHeight: 1 }}>Darpan</span>
          </div>
          <span className="mono" style={{ fontSize: 10, color: '#30363d', border: '1px solid #1f2937', padding: '2px 7px', borderRadius: 4, alignSelf: 'flex-end', marginBottom: 2 }}>FORENSIC ENGINE v5</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13, color: '#586069' }}>
          {result && <button onClick={reset} className="btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }}>New analysis</button>}
          {result && <button onClick={downloadPDF} className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}>
            <Download size={13} /> PDF Report
          </button>}
          <span style={{ fontSize: 12 }}>Pro Plan</span>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#00d4d4,#0066ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#080c12' }}>U</div>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 24px 48px' }}>

        {/* ── UPLOAD ── */}
        {stage === 'upload' && (
          <div style={{ animation: 'fadeIn 0.4s ease', paddingTop: 64 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="mono" style={{ fontSize: 11, color: '#00d4d4', letterSpacing: 3, marginBottom: 16, textTransform: 'uppercase' }}>AlgorivX.AI · Darpan · Multi-stage forensic analysis</div>
              <h1 style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 16 }}>
                Is this real<span style={{ color: '#00d4d4' }}>?</span>
              </h1>
              <p style={{ color: '#586069', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
                Upload an image, video, audio clip, or document. Our forensic engine runs frequency analysis, face forensics, and deep learning inference — all in one pass.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? '#00d4d4' : file ? 'rgba(0,212,212,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 14, padding: file ? '32px 24px' : '64px 24px', textAlign: 'center', cursor: 'pointer',
                background: dragActive ? 'rgba(0,212,212,0.04)' : 'rgba(13,17,23,0.6)',
                transition: 'all 0.2s ease', animation: dragActive ? 'glow 1s infinite' : 'none',
                backdropFilter: 'blur(8px)',
              }}
            >
              <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files?.[0])}
                accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp,.mp4,.avi,.mov,.mkv,.webm,.mp3,.wav,.aac,.flac,.ogg,.m4a,.pdf,.docx,.txt"
              />
              {file
                ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,212,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <FileImage size={20} color="#00d4d4" />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{file.name}</div>
                    <div className="mono" style={{ fontSize: 12, color: '#586069' }}>{formatBytes(file.size)}</div>
                  </div>
                : <>
                    <Upload size={28} color="rgba(0,212,212,0.5)" style={{ marginBottom: 14 }} />
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>Drop a file here, or click to browse</div>
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
                  <item.icon size={16} color="#00d4d4" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#586069', marginTop: 1 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SCANNING ── */}
        {stage === 'scanning' && (
          <div style={{ paddingTop: 100, textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 32px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(0,212,212,0.15)' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#00d4d4', animation: 'spin 1s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px solid rgba(0,212,212,0.08)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={28} color="#00d4d4" />
              </div>
            </div>
            <div className="mono" style={{ fontSize: 13, color: '#00d4d4', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
              {progress < 30 ? 'Extracting features' : progress < 65 ? 'Running forensic checks' : progress < 88 ? 'Deep learning inference' : 'Compiling report'}
            </div>
            <div style={{ color: '#586069', fontSize: 13, marginBottom: 32 }}>{file?.name}</div>
            <div style={{ maxWidth: 280, margin: '0 auto', height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#00d4d4,#0066ff)', transition: 'width 0.4s ease', borderRadius: 2 }} />
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {stage === 'error' && (
          <div className="card" style={{ maxWidth: 480, margin: '80px auto', padding: 40, textAlign: 'center', borderColor: 'rgba(239,68,68,0.3)', animation: 'fadeIn 0.3s ease' }}>
            <AlertTriangle size={28} color="#ef4444" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Analysis failed</div>
            <div style={{ fontSize: 13, color: '#586069', marginBottom: 24, lineHeight: 1.6 }}>
              {errorMsg || 'Could not reach the analysis server. The server may be waking up — please wait 60 seconds and try again.'}
            </div>
            <button className="btn-ghost" onClick={reset}>Try another file</button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {stage === 'results' && result && (
          <div style={{ animation: 'fadeIn 0.5s ease', paddingTop: 32 }}>

            {isMock && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 16px', fontSize: 12, color: '#f59e0b', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={13} /> Demo mode — live server unreachable. Showing sample data.
              </div>
            )}

            {/* TOP ROW: score + verdict + stage bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, marginBottom: 16 }}>

              {/* Score card */}
              <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, borderColor: `${cfg.color}30` }}>
                <ScoreArc score={result.final_score} threatLevel={result.threat_level} />
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: cfg.color, border: `1px solid ${cfg.color}50`, borderRadius: 4, padding: '3px 10px', textTransform: 'uppercase' }}>
                  {cfg.label}
                </div>
              </div>

              {/* Verdict + stage scores */}
              <div className="card" style={{ padding: 24, borderColor: `${cfg.color}20` }}>
                <p style={{ fontSize: 14, color: '#c9d1d9', lineHeight: 1.7, marginBottom: 20 }}>{result.verdict}</p>
                {result.stage_scores && (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(result.stage_scores).filter(k => result.stage_scores[k] !== null).length}, 1fr)`, gap: 10 }}>
                    {Object.entries(result.stage_scores).map(([k, v]) => v !== null && (
                      <div key={k} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${v >= 50 ? '#ff8c00' : '#00e5a0'}` }}>
                        <div style={{ fontSize: 10, color: '#586069', textTransform: 'capitalize', marginBottom: 4, letterSpacing: 0.5 }}>{k.replace(/_/g,' ')}</div>
                        <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: v >= 50 ? '#ff8c00' : '#00e5a0' }}>{v}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* MIDDLE ROW: orbit carousel + indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>

              {/* Orbit carousel */}
              <div className="card" style={{ padding: '16px 0 0', overflow: 'hidden' }}>
                <div style={{ padding: '0 20px 12px', fontSize: 11, color: '#586069', letterSpacing: 1, textTransform: 'uppercase' }}>Visual analysis</div>
                {result.graphs?.length > 0
                  ? <OrbitCarousel graphs={result.graphs} jobId={result.job_id} isMock={isMock} />
                  : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#30363d', fontSize: 13 }}>No graphs available</div>
                }
              </div>

              {/* Indicators */}
              <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
                  Flagged indicators {result.indicators?.length > 0 && <span style={{ color: '#ff8c00' }}>({result.indicators.length})</span>}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {result.indicators?.length > 0
                    ? result.indicators.map((ind, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: 'rgba(255,140,0,0.04)', border: '1px solid rgba(255,140,0,0.1)', borderRadius: 6 }}>
                          <AlertTriangle size={12} color="#ff8c00" style={{ flexShrink: 0, marginTop: 1 }} />
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

              {/* Stats */}
              {result.stats?.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 11, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Detailed metrics</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {result.stats.map((s, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
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
                    <span style={{ color: '#30363d', minWidth: 56 }}>FILE</span>
                    <span style={{ color: '#e6edf3' }}>{result.filename}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#30363d', minWidth: 56 }}>SIZE</span>
                    <span>{formatBytes(result.metadata?.size_bytes)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#30363d', minWidth: 56 }}>MIME</span>
                    <span>{result.metadata?.mime}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#30363d', minWidth: 56 }}>MD5</span>
                    <span style={{ wordBreak: 'break-all', fontSize: 10 }}>{result.metadata?.md5}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#30363d', minWidth: 56 }}>JOB</span>
                    <span>{result.job_id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#30363d', minWidth: 56 }}>TIME</span>
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
