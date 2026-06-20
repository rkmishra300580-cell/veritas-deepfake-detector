'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileImage, FileVideo, FileAudio, FileText, Download, AlertTriangle, CheckCircle2, ShieldAlert, X, Loader2, ChevronRight, Lock } from 'lucide-react';

// ============================================================
// CONFIG — set NEXT_PUBLIC_API_BASE_URL in your hosting provider's
// environment variables (e.g. Vercel project settings).
// Falls back to a placeholder so the app doesn't crash if unset.
// ============================================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://outskirts-remorse-railway.ngrok-free.dev';

// ============================================================
// MOCK DATA — used when API isn't reachable, so the UI is demoable
// ============================================================
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
    md5: '9f8e7d6c5b4a3210fedcba9876543210', sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    analyzed_at: new Date().toISOString(),
  },
  stats: [
    { label: 'Low Band Energy', value: '0.8821' }, { label: 'Mid Band Energy', value: '0.3142' },
    { label: 'High Band Energy', value: '0.0512' }, { label: 'Spectral Entropy', value: '12.34' },
    { label: 'Faces Detected', value: '1' }, { label: 'Face Forensic Score', value: '66.7%' },
    { label: 'DL Model Score', value: '84.2%' }, { label: 'Final Fusion Score', value: '78.4%' },
  ],
  graphs: [
    { title: 'Frequency Spectrum', description: 'Power spectrum (left) and phase spectrum (right). Synthetic images show unnatural uniformity.', image_b64: null },
    { title: 'Frequency Decay Profile', description: 'Real camera images show smooth exponential decay. Flat or irregular regions suggest synthetic generation.', image_b64: null },
    { title: 'Face Detection', description: '1 face(s) detected. Face regions are analysed for warping, blending and resolution inconsistencies.', image_b64: null },
    { title: 'Deep Learning Analysis', description: 'Attention heatmap and patch variance. DL model confidence: 84.2%.', image_b64: null },
  ],
  pdf_ready: true,
};

const THREAT_CONFIG = {
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Critical' },
  HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'High' },
  MODERATE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Moderate' },
  LOW:      { color: '#84cc16', bg: 'rgba(132,204,22,0.08)', label: 'Low' },
  MINIMAL:  { color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'Minimal' },
};

const FILE_ICONS = { IMAGE: FileImage, VIDEO: FileVideo, AUDIO: FileAudio, DOCUMENT: FileText };

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// ============================================================
// SCAN LINE ANIMATION — signature element
// ============================================================
function ScanningPanel({ fileName, fileTypeLabel, progress }) {
  return (
    <div style={{
      background: '#0d1117', border: '1px solid #1f2937', borderRadius: 4,
      padding: '48px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #00d4d4, transparent)',
        animation: 'scanline 2.2s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes scanline { 0% { transform: translateY(0); opacity: 0.3; } 50% { opacity: 1; } 100% { transform: translateY(280px); opacity: 0.3; } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(0,212,212,0.4); } 100% { box-shadow: 0 0 0 16px rgba(0,212,212,0); } }
      `}</style>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,212,212,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        animation: 'pulse-ring 1.8s ease-out infinite',
      }}>
        <Loader2 size={28} color="#00d4d4" style={{ animation: 'spin 1.2s linear infinite' }} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#00d4d4', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' }}>
        Running forensic analysis
      </div>
      <div style={{ color: '#8b949e', fontSize: 14, marginBottom: 24 }}>
        {fileTypeLabel} · {fileName}
      </div>
      <div style={{ maxWidth: 320, margin: '0 auto' }}>
        <div style={{ height: 3, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#00d4d4', transition: 'width 0.4s ease', borderRadius: 2 }} />
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#586069', marginTop: 8 }}>
          {progress < 30 ? 'Extracting features…' : progress < 65 ? 'Running frequency & forensic checks…' : progress < 90 ? 'Deep learning inference…' : 'Compiling report…'}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RADIAL SCORE GAUGE
// ============================================================
function ScoreGauge({ score, threatLevel }) {
  const config = THREAT_CONFIG[threatLevel] || THREAT_CONFIG.MODERATE;
  const radius = 80, circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
      <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#1f2937" strokeWidth="12" />
        <circle
          cx="100" cy="100" r={radius} fill="none" stroke={config.color} strokeWidth="12"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 700, color: config.color, lineHeight: 1 }}>
          {score.toFixed(1)}
        </div>
        <div style={{ fontSize: 11, color: '#586069', letterSpacing: 1, marginTop: 4 }}>% PROBABILITY</div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function DeepfakeDetectorApp() {
  const [stage, setStage] = useState('upload'); // upload | scanning | results | error
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
  }, []);

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
    setStage('scanning');
    setProgress(0);
    setErrorMsg('');
    setUsingMock(false);

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
      // API not reachable — fall back to demo data so the UI remains explorable
      clearInterval(progressIntervalRef.current);
      setProgress(100);
      setUsingMock(true);
      setTimeout(() => {
        setResult({ ...MOCK_RESULT, filename: file.name });
        setStage('results');
      }, 500);
    }
  };

  const reset = () => {
    setStage('upload'); setFile(null); setProgress(0); setResult(null); setErrorMsg('');
  };

  const downloadPDF = () => {
    if (usingMock) {
      alert('PDF download requires a live connection to the analysis server.');
      return;
    }
    window.open(`${API_BASE_URL}/report/${result.job_id}`, '_blank');
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0e14', color: '#e6edf3',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::selection { background: #00d4d4; color: #0a0e14; }
      `}</style>

      {/* HEADER */}
      <header style={{
        borderBottom: '1px solid #1f2937', padding: '18px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldAlert size={22} color="#00d4d4" />
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>VERITAS</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#586069', border: '1px solid #1f2937', padding: '2px 6px', borderRadius: 3 }}>
            FORENSIC ENGINE v5
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#8b949e' }}>
          <span>Pro Plan</span>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
            U
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '48px 24px' }}>

        {/* ============ UPLOAD STAGE ============ */}
        {stage === 'upload' && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Submit a file for analysis</h1>
              <p style={{ color: '#8b949e', fontSize: 15, marginTop: 8 }}>
                Supports images, video, audio, and documents. Each file is run through a multi-stage forensic pipeline.
              </p>
            </div>

            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? '#00d4d4' : '#1f2937'}`,
                borderRadius: 6, padding: '56px 24px', textAlign: 'center', cursor: 'pointer',
                background: dragActive ? 'rgba(0,212,212,0.04)' : '#0d1117',
                transition: 'all 0.15s ease',
              }}
            >
              <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp,.mp4,.avi,.mov,.mkv,.webm,.mp3,.wav,.aac,.flac,.ogg,.m4a,.pdf,.docx,.txt" />
              <Upload size={32} color="#00d4d4" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                {file ? file.name : 'Drop a file here, or click to browse'}
              </div>
              <div style={{ fontSize: 13, color: '#586069' }}>
                {file ? formatBytes(file.size) : 'JPG, PNG, MP4, MOV, MP3, WAV, PDF, DOCX — up to 500MB'}
              </div>
            </div>

            {file && (
              <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={startAnalysis} style={{
                  background: '#00d4d4', color: '#0a0e14', border: 'none', borderRadius: 5,
                  padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  Run analysis <ChevronRight size={16} />
                </button>
                <button onClick={() => setFile(null)} style={{
                  background: 'transparent', color: '#8b949e', border: '1px solid #1f2937', borderRadius: 5,
                  padding: '12px 18px', fontSize: 14, cursor: 'pointer',
                }}>
                  Clear
                </button>
              </div>
            )}

            <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { icon: FileImage, label: 'Images', desc: 'Frequency, face & DL analysis' },
                { icon: FileVideo, label: 'Video', desc: 'Frame & temporal consistency' },
                { icon: FileAudio, label: 'Audio', desc: 'Voice clone / TTS detection' },
                { icon: FileText, label: 'Documents', desc: 'AI-generated text detection' },
              ].map((item) => (
                <div key={item.label} style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 5, padding: 16 }}>
                  <item.icon size={18} color="#00d4d4" style={{ marginBottom: 10 }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#586069', marginTop: 4 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ SCANNING STAGE ============ */}
        {stage === 'scanning' && (
          <ScanningPanel fileName={file?.name} fileTypeLabel="Analyzing" progress={Math.min(progress, 100)} />
        )}

        {/* ============ ERROR STAGE ============ */}
        {stage === 'error' && (
          <div style={{ background: '#0d1117', border: '1px solid #ef4444', borderRadius: 6, padding: 32, textAlign: 'center' }}>
            <AlertTriangle size={28} color="#ef4444" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Analysis failed</div>
            <div style={{ fontSize: 14, color: '#8b949e', marginBottom: 24 }}>{errorMsg}</div>
            <button onClick={reset} style={{
              background: '#1f2937', color: '#e6edf3', border: 'none', borderRadius: 5,
              padding: '10px 20px', fontSize: 14, cursor: 'pointer',
            }}>
              Try another file
            </button>
          </div>
        )}

        {/* ============ RESULTS STAGE ============ */}
        {stage === 'results' && result && (
          <div>
            {usingMock && (
              <div style={{
                background: 'rgba(245,158,11,0.08)', border: '1px solid #f59e0b', borderRadius: 5,
                padding: '10px 16px', fontSize: 13, color: '#f59e0b', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertTriangle size={14} />
                Demo data — couldn't reach the analysis server at {API_BASE_URL}. Update API_BASE_URL with your live Colab ngrok URL.
              </div>
            )}

            {/* Verdict banner */}
            <div style={{
              background: THREAT_CONFIG[result.threat_level]?.bg, border: `1px solid ${THREAT_CONFIG[result.threat_level]?.color}`,
              borderRadius: 6, padding: 32, marginBottom: 24, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap',
            }}>
              <ScoreGauge score={result.final_score} threatLevel={result.threat_level} />
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 1,
                  color: THREAT_CONFIG[result.threat_level]?.color, border: `1px solid ${THREAT_CONFIG[result.threat_level]?.color}`,
                  borderRadius: 3, padding: '3px 10px', marginBottom: 12, textTransform: 'uppercase',
                }}>
                  {THREAT_CONFIG[result.threat_level]?.label} threat
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, color: '#e6edf3' }}>{result.verdict}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={downloadPDF} style={{
                    background: '#00d4d4', color: '#0a0e14', border: 'none', borderRadius: 5,
                    padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Download size={14} /> Download full PDF report
                  </button>
                  <button onClick={reset} style={{
                    background: 'transparent', color: '#8b949e', border: '1px solid #1f2937', borderRadius: 5,
                    padding: '9px 16px', fontSize: 13, cursor: 'pointer',
                  }}>
                    Analyze another file
                  </button>
                </div>
              </div>
            </div>

            {/* File info bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: '#0d1117', border: '1px solid #1f2937', borderRadius: 5, marginBottom: 24,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#8b949e',
            }}>
              {React.createElement(FILE_ICONS[result.file_type] || FileText, { size: 14, color: '#00d4d4' })}
              <span style={{ color: '#e6edf3' }}>{result.filename}</span>
              <span>·</span><span>{result.file_type}</span>
              <span>·</span><span>{formatBytes(result.metadata?.size_bytes)}</span>
              <span>·</span><span>Job {result.job_id}</span>
            </div>

            {/* Stage scores */}
            {result.stage_scores && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Stage breakdown</h3>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(result.stage_scores).length}, 1fr)`, gap: 10 }}>
                  {Object.entries(result.stage_scores).map(([key, val]) => val !== null && (
                    <div key={key} style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 5, padding: 14 }}>
                      <div style={{ fontSize: 11, color: '#586069', textTransform: 'capitalize', marginBottom: 6 }}>{key.replace(/_/g, ' ')}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: val >= 50 ? '#f97316' : '#10b981' }}>{val}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indicators */}
            {result.indicators?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                  Flagged indicators ({result.indicators.length})
                </h3>
                <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 5, overflow: 'hidden' }}>
                  {result.indicators.map((ind, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13,
                      borderBottom: i < result.indicators.length - 1 ? '1px solid #1f2937' : 'none',
                    }}>
                      <AlertTriangle size={13} color="#f97316" style={{ flexShrink: 0 }} />
                      <span style={{ color: '#c9d1d9' }}>{ind}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Graphs */}
            {result.graphs?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Visual analysis</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {result.graphs.map((g, i) => (
                    <div key={i} style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{
                        aspectRatio: '16/10', background: '#161b22', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {g.image_b64 ? (
                          <img src={`data:image/png;base64,${g.image_b64}`} alt={g.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 12, color: '#586069', fontFamily: "'JetBrains Mono', monospace" }}>[ chart renders here from API ]</span>
                        )}
                      </div>
                      <div style={{ padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{g.title}</div>
                        <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.5 }}>{g.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats grid */}
            {result.stats?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Detailed metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {result.stats.map((s, i) => (
                    <div key={i} style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 5, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: '#586069', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#e6edf3' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata / evidence block */}
            <div>
              <h3 style={{ fontSize: 13, color: '#586069', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                <Lock size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: -1 }} /> File evidence
              </h3>
              <div style={{
                background: '#0d1117', border: '1px solid #1f2937', borderRadius: 5, padding: 16,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#8b949e', lineHeight: 2,
              }}>
                <div><span style={{ color: '#586069' }}>MD5    </span> {result.metadata?.md5}</div>
                <div><span style={{ color: '#586069' }}>SHA256 </span> {result.metadata?.sha256}</div>
                <div><span style={{ color: '#586069' }}>MIME   </span> {result.metadata?.mime}</div>
                <div><span style={{ color: '#586069' }}>Time   </span> {result.metadata?.analyzed_at}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
