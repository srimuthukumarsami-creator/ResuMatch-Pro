import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Upload, Plus, X, Trophy, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ScoreRing from '../components/ScoreRing';
import ScoreBreakdown from '../components/ScoreBreakdown';
import { screenResume } from '../api/client';

const MAX_SLOTS = 4;

function ResumeSlot({ index, data, onChange, onRemove, isLoading }) {
  return (
    <div className="card" style={{ padding: 20, position: 'relative' }}>
      {index > 1 && (
        <button onClick={onRemove} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={16} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      )}
      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Resume {index}</h4>

      {/* File Upload */}
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20, border: '2px dashed var(--color-border)', borderRadius: 14, cursor: 'pointer',
        background: data.file ? '#E8F5E9' : 'var(--color-cream)', marginBottom: 12, transition: 'all 0.2s',
      }}>
        <input type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }}
          onChange={e => onChange({ ...data, file: e.target.files[0] })} />
        {data.file ? (
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-green)' }}>✓ {data.file.name}</span>
        ) : (
          <><Upload size={20} style={{ color: 'var(--color-text-muted)', marginBottom: 4 }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Upload PDF/DOCX</span></>
        )}
      </label>

      {/* JD Textarea */}
      <textarea
        className="input"
        value={data.jd}
        onChange={e => onChange({ ...data, jd: e.target.value })}
        placeholder="Paste job description for this resume..."
        style={{ minHeight: 100, fontSize: 13 }}
      />
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>{data.jd.length} chars</span>

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-orange)' }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Analyzing...</span>
        </div>
      )}
    </div>
  );
}

function ResultColumn({ result, rank, isBest }) {
  if (!result) return null;
  const name = result.candidate_name || result.entities?.name || 'Candidate';
  const breakdown = result.composite?.breakdown || {};

  return (
    <div className="card" style={{ padding: 24, position: 'relative', border: isBest ? '2px solid var(--color-green)' : undefined }}>
      {isBest && (
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-green)', color: 'white', padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Trophy size={12} /> Best Candidate
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <ScoreRing score={result.match_score || 0} size={100} />
        <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 10 }}>{name}</h3>
        <span className="pill" style={{ background: 'rgba(232,93,38,0.1)', color: 'var(--color-orange)', fontSize: 12, marginTop: 6 }}>
          {result.category || '—'}
        </span>
      </div>

      <ScoreBreakdown breakdown={breakdown} />

      <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border-light)', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Skills Match</span>
          <span style={{ fontWeight: 600 }}>{result.skills_score?.match_percentage || result.skills_match?.match_percentage || 0}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Missing Skills</span>
          <span style={{ fontWeight: 600, color: 'var(--color-red)' }}>{(result.skills_score?.missing_hard || result.skills_match?.missing || []).length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>ATS Score</span>
          <span style={{ fontWeight: 600 }}>{result.ats_score || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Confidence</span>
          <span style={{ fontWeight: 600 }}>{result.confidence || 0}%</span>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [slots, setSlots] = useState([
    { file: null, jd: '' },
    { file: null, jd: '' },
  ]);
  const [results, setResults] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(new Set());
  const [comparing, setComparing] = useState(false);

  const addSlot = () => {
    if (slots.length < MAX_SLOTS) setSlots([...slots, { file: null, jd: '' }]);
  };

  const removeSlot = (i) => {
    if (slots.length <= 2) return;
    setSlots(slots.filter((_, idx) => idx !== i));
  };

  const updateSlot = (i, data) => {
    const updated = [...slots];
    updated[i] = data;
    setSlots(updated);
  };

  const canCompare = slots.filter(s => s.file && s.jd.length >= 30).length >= 2;

  const handleCompare = async () => {
    setComparing(true);
    setResults([]);
    const newResults = [];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot.file || slot.jd.length < 30) {
        newResults.push(null);
        continue;
      }

      setLoadingSlots(prev => new Set([...prev, i]));
      try {
        const fd = new FormData();
        fd.append('file', slot.file);
        fd.append('job_description', slot.jd);
        const res = await screenResume(fd);
        newResults.push(res.data);
      } catch (err) {
        toast.error(`Resume ${i + 1} failed: ${err.response?.data?.detail || err.message}`);
        newResults.push(null);
      }
      setLoadingSlots(prev => { const s = new Set(prev); s.delete(i); return s; });
    }

    setResults(newResults);
    setComparing(false);
    const successCount = newResults.filter(Boolean).length;
    if (successCount >= 2) toast.success(`${successCount} resumes compared!`);
    else toast.error('Need at least 2 successful screenings to compare');
  };

  const validResults = results.filter(Boolean);
  const bestIdx = validResults.length > 0
    ? results.indexOf(validResults.reduce((a, b) => (a?.match_score || 0) >= (b?.match_score || 0) ? a : b))
    : -1;

  // Comparison metrics
  const METRICS = [
    { label: 'Match Score', key: r => r?.match_score || 0 },
    { label: 'Content', key: r => r?.composite?.breakdown?.content || 0 },
    { label: 'Skills', key: r => r?.composite?.breakdown?.skills || 0 },
    { label: 'Format', key: r => r?.composite?.breakdown?.format || 0 },
    { label: 'Sections', key: r => r?.composite?.breakdown?.sections || 0 },
    { label: 'Style', key: r => r?.composite?.breakdown?.style || 0 },
    { label: 'ATS Score', key: r => r?.ats_score || 0 },
    { label: 'Skills Match %', key: r => r?.skills_score?.match_percentage || 0 },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="page-header">
          <h1><GitCompare size={24} /> Compare Resumes</h1>
        </div>

        {results.length === 0 ? (
          <>
            <div className={`grid md:grid-cols-${slots.length}`} style={{ gap: 16, gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
              {slots.map((slot, i) => (
                <ResumeSlot key={i} index={i + 1} data={slot}
                  onChange={d => updateSlot(i, d)}
                  onRemove={() => removeSlot(i)}
                  isLoading={loadingSlots.has(i)} />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
              {slots.length < MAX_SLOTS && (
                <button onClick={addSlot} className="btn btn-outline" style={{ padding: '10px 20px' }}>
                  <Plus size={16} /> Add Resume
                </button>
              )}
              <button onClick={handleCompare} disabled={!canCompare || comparing}
                className="btn btn-primary" style={{ padding: '14px 36px', opacity: canCompare ? 1 : 0.5 }}>
                {comparing ? <><Loader2 size={16} className="animate-spin" /> Comparing...</> : <><GitCompare size={16} /> Compare All</>}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results columns */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${validResults.length}, 1fr)`, gap: 16, marginBottom: 32 }}>
              {results.map((r, i) => r && (
                <ResultColumn key={i} result={r} rank={i + 1} isBest={i === bestIdx} />
              ))}
            </div>

            {/* Comparison Table */}
            {validResults.length >= 2 && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-cream)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700 }}>Metric</th>
                      {results.map((r, i) => r && (
                        <th key={i} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
                          {r.candidate_name || r.entities?.name || `Resume ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METRICS.map((m, mi) => {
                      const vals = results.filter(Boolean).map(r => m.key(r));
                      const maxVal = Math.max(...vals);
                      return (
                        <tr key={mi} style={{ borderTop: '1px solid var(--color-border-light)' }}>
                          <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500 }}>{m.label}</td>
                          {results.map((r, i) => {
                            if (!r) return null;
                            const val = m.key(r);
                            const isWinner = val === maxVal && vals.filter(v => v === maxVal).length === 1;
                            return (
                              <td key={i} style={{ padding: '10px 16px', textAlign: 'center', fontSize: 14, fontWeight: 600, background: isWinner ? '#E8F5E9' : undefined, color: isWinner ? 'var(--color-green)' : undefined }}>
                                {typeof val === 'number' ? val.toFixed(0) : val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <button onClick={() => { setResults([]); setSlots([{ file: null, jd: '' }, { file: null, jd: '' }]); }}
                className="btn btn-outline" style={{ padding: '12px 28px' }}>
                ↩ Compare New Resumes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
