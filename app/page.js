'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileImage, FileVideo, FileAudio, FileText, Download, AlertTriangle, ShieldAlert, Loader2, ChevronRight, Lock } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dfd-back-exc0.onrender.com';

const THREAT_CONFIG = {
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   label: 'Critical' },
  HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)',  label: 'High'     },
  MODERATE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  label: 'Moderate' },
  LOW:      { color: '#84cc16', bg: 'rgba(132,204,22,0.08)',  label: 'Low'      },
  MINIMAL:  { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  label: 'Minimal'  },
};

const FILE_ICONS = { IMAGE: FileImage, VIDEO: FileVideo, AUDIO: FileAudio, DOCUMENT: FileText };

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// ── Floating bubbles background ───────────────────────────────────────────────
function Bubbles() {
  const list = [
    { size: 340, top: '-90px',  left: '-70px', delay: '0s',    dur: '20s', op: 0.45 },
    { size: 180, top: '8%',    left: '72%',   delay: '2.5s',  dur: '15s', op: 0.35 },
    { size: 260, top: '52%',   left: '-50px', delay: '4s',    dur: '22s', op: 0.3  },
    { size: 120, top: '28%',   left: '58%',   delay: '1s',    dur: '17s', op: 0.28 },
    { size: 210, top: '78%',   left: '78%',   delay: '3s',    dur: '24s', op: 0.4  },
    { size: 90,  top: '18%',   left: '32%',   delay: '5s',    dur: '13s', op: 0.22 },
    { size: 150, top: '82%',   left: '18%',   delay: '6s',    dur: '18s', op: 0.3  },
    { size: 100, top: '44%',   left: '88%',   delay: '0.8s',  dur: '16s', op: 0.25 },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {list.map((b, i) => (
        <div key={i} style={{
          position: 'absolute', top: b.top, left: b.left,
          width: b.size, height: b.size, borderRadius: '50%',
          background: `radial-gradient(circle at 32% 32%, rgba(96,165,250,${b.op}) 0%, rgba(45,212,191,0.06) 55%, transparent 75%)`,
          border: '1px solid rgba(96,165,250,0.15)',
          backdropFilter: 'blur(1px)',
          animation: `floatBubble ${b.dur} ease-in-out infinite`,
          animationDelay: b.delay,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 32px rgba(59,130,246,0.06)`,
        }} />
      ))}
    </div>
  );
}

// ── Scanning panel: scanline + stage checklist ────────────────────────────────
function ScanningPanel({ fileName, progress }) {
  const stages = [
    { label: 'Frequency domain analysis',   thresh: 18 },
    { label: 'Face forensic analysis',       thresh: 38 },
    { label: 'Manipulation analysis',        thresh: 60 },
    { label: 'Vehicle & object analysis',    thresh: 76 },
    { label: 'Deep learning classification', thresh: 90 },
  ];

  return (
    <div style={{
      background: '#0d1c35', border: '1px solid #1e2d4a', borderRadius: 4,
      padding: '48px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      {/* Scanline — original moving horizontal line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #00d4d4, transparent)',
        animation: 'scanline 2.2s ease-in-out infinite',
      }} />

      <style>{`
        @keyframes scanline   { 0% { transform: translateY(0); opacity: 0.3; } 50% { opacity: 1; } 100% { transform: translateY(420px); opacity: 0.3; } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(0,212,212,0.4); } 100% { box-shadow: 0 0 0 16px rgba(0,212,212,0); } }
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes pulseDot   { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
      `}</style>

      {/* Spinner */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,212,212,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        animation: 'pulse-ring 1.8s ease-out infinite',
      }}>
        <Loader2 size={28} color="#00d4d4" style={{ animation: 'spin 1.2s linear infinite' }} />
      </div>

      <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#00d4d4', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>
        Running forensic analysis
      </div>
      <div style={{ color: '#8b949e', fontSize: 14, marginBottom: 28 }}>{fileName}</div>

      {/* Stage checklist */}
      <div style={{ maxWidth: 340, margin: '0 auto 24px', textAlign: 'left' }}>
        {stages.map((s, i) => {
          const done   = progress > s.thresh;
          const active = !done && (i === 0 ? progress > 0 : progress > stages[i - 1].thresh);
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 0',
              borderBottom: i < stages.length - 1 ? '1px solid #161b22' : 'none',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: done ? '#00d4d4' : active ? '#00d4d4' : '#1e2d4a',
                animation: active ? 'pulseDot 1.2s ease-in-out infinite' : 'none',
              }} />
              <span style={{ fontSize: 12, flex: 1, color: done ? '#c9d1d9' : active ? '#e6edf3' : '#586069' }}>
                {s.label}
              </span>
              <span style={{
                fontSize: 11, fontFamily: 'monospace',
                color: done ? '#00d4d4' : active ? '#586069' : 'transparent',
                animation: active ? 'pulseDot 1.2s ease-in-out infinite' : 'none',
              }}>
                {done ? 'done' : active ? 'running' : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: 340, margin: '0 auto' }}>
        <div style={{ height: 2, background: '#1e2d4a', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#00d4d4,#0891b2)', transition: 'width 0.4s ease', borderRadius: 2 }} />
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#586069', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>{progress < 30 ? 'Extracting features…' : progress < 65 ? 'Running frequency & forensic checks…' : progress < 90 ? 'Deep learning inference…' : 'Compiling report…'}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}

// ── Score gauge — unchanged from original ─────────────────────────────────────
function ScoreGauge({ score, threatLevel }) {
  const config = THREAT_CONFIG[threatLevel] || THREAT_CONFIG.MODERATE;
  const radius = 80, circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
      <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#1e2d4a" strokeWidth="12" />
        <circle cx="100" cy="100" r={radius} fill="none" stroke={config.color} strokeWidth="12"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 36, fontWeight: 700, color: config.color, lineHeight: 1 }}>{score.toFixed(1)}</div>
        <div style={{ fontSize: 11, color: '#586069', letterSpacing: 1, marginTop: 4 }}>% PROBABILITY</div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Returns true if the result is a face/human image (not vehicle/object mode)
function isFaceMode(result) {
  const fm = (result.fusion_mode || '').toUpperCase();
  // fusion_mode set by backend: "FACE IMAGE — ..." or "VEHICLE/OBJECT — ..."
  if (fm.includes('FACE'))    return true;
  if (fm.includes('VEHICLE')) return false;
  // Fallback: if has_human_face flag present
  if (result.has_human_face === true)  return true;
  if (result.has_human_face === false) return false;
  // Default: treat as face mode (safer — don't show vehicle tab for unknowns)
  return true;
}

// Filter stage_scores: hide vehicle score when no vehicle detected
function filteredStageScores(result) {
  if (!result.stage_scores) return null;
  const faceMode = isFaceMode(result);
  const entries = Object.entries(result.stage_scores).filter(([key, val]) => {
    if (val === null || val === undefined) return false;
    if (faceMode && key.toLowerCase().includes('vehicle')) return false;
    return true;
  });
  if (!entries.length) return null;
  return Object.fromEntries(entries);
}

// Graph image src: prefer URL-served graph over base64
function graphSrc(g, jobId) {
  if (g.filename && jobId) return `${API_BASE_URL}/graph/${jobId}/${g.filename}`;
  if (g.image_b64)         return `data:image/png;base64,${g.image_b64}`;
  return null;
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function DeepfakeDetectorApp() {
  const [stage, setStage]       = useState('upload');
  const [file, setFile]         = useState(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult]     = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef      = useRef(null);
  const progressIntervalRef = useRef(null);

  const handleFileSelect = useCallback((selectedFile) => { if (selectedFile) setFile(selectedFile); }, []);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const startAnalysis = async () => {
    if (!file) return;
    setStage('scanning'); setProgress(0); setErrorMsg('');
    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => (p < 92 ? p + Math.random() * 8 : p));
    }, 400);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      clearInterval(progressIntervalRef.current);
      setProgress(100);
      if (data.error) {
        setTimeout(() => { setErrorMsg(data.error); setStage('error'); }, 400);
        return;
      }
      setTimeout(() => { setResult(data); setStage('results'); }, 500);
    } catch (err) {
      clearInterval(progressIntervalRef.current);
      setErrorMsg(`Could not reach the analysis server. The server may be waking up — please wait 60 seconds and try again. (${err.message})`);
      setStage('error');
    }
  };

  const reset = () => { setStage('upload'); setFile(null); setProgress(0); setResult(null); setErrorMsg(''); };

  const downloadPDF = () => { window.open(`${API_BASE_URL}/report/${result.job_id}`, '_blank'); };

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', color: '#e6edf3', fontFamily: "'Inter', -apple-system, sans-serif", position: 'relative' }}>
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #00d4d4; color: #0a1628; }
        @keyframes floatBubble { 0%,100%{transform:translateY(0) scale(1);} 33%{transform:translateY(-20px) scale(1.02);} 66%{transform:translateY(12px) scale(0.98);} }
      `}</style>

      <Bubbles />

      {/* HEADER */}
      <header style={{ borderBottom: '1px solid #1e2d4a', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldAlert size={22} color="#00d4d4" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: '#00d4d4', letterSpacing: 2, textTransform: 'uppercase', lineHeight: 1 }}>AlgorivX.AI</span>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5, color: '#e6edf3', lineHeight: 1 }}>Darpan</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#586069', border: '1px solid #1e2d4a', padding: '2px 6px', borderRadius: 3, alignSelf: 'flex-end', marginBottom: 1 }}>
            FORENSIC ENGINE v5
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#8b949e' }}>
          {result && (
            <>
              <button onClick={downloadPDF} style={{ background: '#00d4d4', color: '#0a1628', border: 'none', borderRadius: 5, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={13} /> PDF Report
              </button>
              <button onClick={reset} style={{ background: 'transparent', color: '#8b949e', border: '1px solid #1e2d4a', borderRadius: 5, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
                New analysis
              </button>
            </>
          )}
          <span>Pro Plan</span>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#162040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>U</div>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>

        {/* ── UPLOAD ── */}
        {stage === 'upload' && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Submit a file for analysis</h1>
              <p style={{ color: '#8b949e', fontSize: 15, marginTop: 8 }}>Supports images, video, audio, and documents. Each file is run through a multi-stage forensic pipeline.</p>
            </div>

            <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragActive ? '#00d4d4' : '#1e2d4a'}`, borderRadius: 6, padding: '56px 24px', textAlign: 'center', cursor: 'pointer', background: dragActive ? 'rgba(0,212,212,0.04)' : '#0d1c35', transition: 'all 0.15s ease' }}>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp,.mp4,.avi,.mov,.mkv,.webm,.mp3,.wav,.aac,.flac,.ogg,.m4a,.pdf,.docx,.txt" />
              <Upload size={32} color="#00d4d4" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{file ? file.name : 'Drop a file here, or click to browse'}</div>
              <div style={{ fontSize: 13, color: '#586069' }}>{file ? formatBytes(file.size) : 'JPG, PNG, MP4, MOV, MP3, WAV, PDF, DOCX — up to 500MB'}</div>
            </div>

            {file && (
              <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={startAnalysis} style={{ background: '#00d4d4', color: '#0a1628', border: 'none', borderRadius: 5, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Run analysis <ChevronRight size={16} />
                </button>
                <button onClick={() => setFile(null)} style={{ background: 'transparent', color: '#8b949e', border: '1px solid #1e2d4a', borderRadius: 5, padding: '12px 18px', fontSize: 14, cursor: 'pointer' }}>Clear</button>
              </div>
            )}

            <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { icon: FileImage, label: 'Images',    desc: 'Frequency, face & DL analysis'   },
                { icon: FileVideo, label: 'Video',     desc: 'Frame & temporal consistency'     },
                { icon: FileAudio, label: 'Audio',     desc: 'Voice clone / TTS detection'      },
                { icon: FileText,  label: 'Documents', desc: 'AI-generated text detection'      },
              ].map((item) => (
                <div key={item.label} style={{ background: '#0d1c35', border: '1px solid #1e2d4a', borderRadius: 5, padding: 16 }}>
                  <item.icon size={18} color="#00d4d4" style={{ marginBottom: 10 }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#586069', marginTop: 4 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SCANNING ── */}
        {stage === 'scanning' && <ScanningPanel fileName={file?.name} progress={Math.min(progress, 100)} />}

        {/* ── ERROR ── */}
        {stage === 'error' && (
          <div style={{ background: '#0d1c35', border: '1px solid #ef4444', borderRadius: 6, padding: 32, textAlign: 'center' }}>
            <AlertTriangle size={28} color="#ef4444" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Analysis failed</div>
            <div style={{ fontSize: 14, color: '#8b949e', marginBottom: 24 }}>{errorMsg}</div>
            <button onClick={reset} style={{ background: '#162040', color: '#e6edf3', border: 'none', borderRadius: 5, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Try another file</button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {stage === 'results' && result && (() => {
          const cfg          = THREAT_CONFIG[result.threat_level] || THREAT_CONFIG.MODERATE;
          const stageScores  = filteredStageScores(result);
          const faceMode     = isFaceMode(result);

          return (
            <div>
              {/* Score + verdict */}
              <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}`, borderRadius: 6, padding: 32, marginBottom: 24, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                <ScoreGauge score={result.final_score} threatLevel={result.threat_level} />
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: cfg.color, border: `1px solid ${cfg.color}`, borderRadius: 3, padding: '3px 10px', marginBottom: 12, textTransform: 'uppercase' }}>
                    {cfg.label} threat
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, color: '#e6edf3' }}>{result.verdict}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button onClick={downloadPDF} style={{ background: '#00d4d4', color: '#0a1628', border: 'none', borderRadius: 5, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Download size={14} /> Download full PDF report
                    </button>
                    <button onClick={reset} style={{ background: 'transparent', color: '#8b949e', border: '1px solid #1e2d4a', borderRadius: 5, padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}>Analyse another file</button>
                  </div>
                </div>
              </div>

              {/* File info bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#0d1c35', border: '1px solid #1e2d4a', borderRadius: 5, marginBottom: 24, fontFamily: 'monospace', fontSize: 12, color: '#8b949e', flexWrap: 'wrap' }}>
                {React.createElement(FILE_ICONS[result.file_type] || FileText, { size: 14, color: '#00d4d4' })}
                <span style={{ color: '#e6edf3' }}>{result.filename}</span>
                <span>·</span><span>{result.file_type}</span>
                <span>·</span><span>{formatBytes(result.metadata?.size_bytes)}</span>
                <span>·</span><span>Job {result.job_id}</span>
                {result.fusion_mode && <><span>·</span><span style={{ color: '#586069' }}>{result.fusion_mode}</span></>}
              </div>

              {/* Stage breakdown — vehicle hidden for face images */}
              {stageScores && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Stage breakdown</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(stageScores).length}, 1fr)`, gap: 10 }}>
                    {Object.entries(stageScores).map(([key, val]) => (
                      <div key={key} style={{ background: '#0d1c35', border: '1px solid #1e2d4a', borderRadius: 5, padding: 14 }}>
                        <div style={{ fontSize: 11, color: '#586069', textTransform: 'capitalize', marginBottom: 6 }}>{key.replace(/_/g, ' ')}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: val >= 50 ? '#f97316' : '#10b981' }}>{val}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flagged indicators */}
              {result.indicators?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Flagged indicators ({result.indicators.length})</h3>
                  <div style={{ background: '#0d1c35', border: '1px solid #1e2d4a', borderRadius: 5, overflow: 'hidden' }}>
                    {result.indicators.map((ind, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, borderBottom: i < result.indicators.length - 1 ? '1px solid #1e2d4a' : 'none' }}>
                        <AlertTriangle size={13} color="#f97316" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#c9d1d9' }}>{ind}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Graphs — plain 2-col grid, original style */}
              {result.graphs?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Visual analysis</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {result.graphs.map((g, i) => {
                      const src = graphSrc(g, result.job_id);
                      return (
                        <div key={i} style={{ background: '#0d1c35', border: '1px solid #1e2d4a', borderRadius: 5, overflow: 'hidden' }}>
                          <div style={{ aspectRatio: '16/10', background: '#0d1c35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {src
                              ? <img src={src} alt={g.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ fontSize: 12, color: '#586069', fontFamily: 'monospace' }}>[ graph loading ]</span>
                            }
                          </div>
                          <div style={{ padding: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{g.title}</div>
                            <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.5 }}>{g.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detailed metrics */}
              {result.stats?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Detailed metrics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {result.stats.map((s, i) => (
                      <div key={i} style={{ background: '#0d1c35', border: '1px solid #1e2d4a', borderRadius: 5, padding: '12px 14px' }}>
                        <div style={{ fontSize: 11, color: '#586069', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#e6edf3' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File evidence */}
              <div>
                <h3 style={{ fontSize: 13, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                  <Lock size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: -1 }} /> File evidence
                </h3>
                <div style={{ background: '#0d1c35', border: '1px solid #1e2d4a', borderRadius: 5, padding: 16, fontFamily: 'monospace', fontSize: 12, color: '#8b949e', lineHeight: 2 }}>
                  <div><span style={{ color: '#586069' }}>MD5    </span> {result.metadata?.md5}</div>
                  <div><span style={{ color: '#586069' }}>SHA256 </span> {result.metadata?.sha256}</div>
                  <div><span style={{ color: '#586069' }}>MIME   </span> {result.metadata?.mime}</div>
                  <div><span style={{ color: '#586069' }}>Time   </span> {result.metadata?.analyzed_at}</div>
                </div>
              </div>
            </div>
          );
        })()}

      </main>
    </div>
  );
}
