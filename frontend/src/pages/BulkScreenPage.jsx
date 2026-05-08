import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Files, Upload, Loader2, Trophy, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { bulkScreen } from '../api/client';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function BulkScreenPage() {
  const [files, setFiles] = useState([]);
  const [jd, setJd] = useState('');
  const [reqSkills, setReqSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles].slice(0, 50));
  };

  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx));

  const handleScreen = async () => {
    if (!files.length) return toast.error('Upload at least one resume');
    if (!jd || jd.length < 50) return toast.error('Job description required (min 50 chars)');
    setLoading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      fd.append('job_description', jd);
      if (reqSkills) fd.append('required_skills', JSON.stringify(reqSkills.split(',').map(s => s.trim()).filter(Boolean)));
      const res = await bulkScreen(fd);
      setResults(res.data);
      toast.success(`${res.data.candidates.length} resumes screened!`);
    } catch (err) { toast.error(err.response?.data?.detail || 'Bulk screening failed'); }
    finally { setLoading(false); }
  };

  const scoreColor = (s) => s >= 70 ? 'var(--color-green)' : s >= 40 ? 'var(--color-amber)' : 'var(--color-red)';

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: 32 }}>
        <div className="page-header">
          <h1><Files size={24} /> Bulk Resume Screener</h1>
        </div>

        {!results ? (
          <div className="grid lg:grid-cols-2" style={{ gap: 24 }}>
            <div className="card" style={{ padding: 32 }}>
              <h3 className="section-title">Upload Resumes (up to 50)</h3>
              <div onClick={() => inputRef.current?.click()} style={{ border: '2px dashed var(--color-border)', borderRadius: 16, padding: 36, textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.txt" onChange={handleFiles} hidden />
                <Upload size={32} style={{ color: 'var(--color-orange)', margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontWeight: 600, fontSize: 15 }}>Click or drop files here</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>PDF, DOCX, TXT</p>
              </div>
              {files.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflow: 'auto' }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 12, background: 'var(--color-cream)' }}>
                      <FileText size={16} style={{ color: 'var(--color-orange)', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{files.length} file(s) selected</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="card" style={{ padding: 24 }}>
                <h3 className="section-title">Job Description *</h3>
                <textarea className="input" value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the job description..." style={{ minHeight: 150 }} />
              </div>
              <div className="card" style={{ padding: 24 }}>
                <h3 className="section-title">Required Skills (comma-separated)</h3>
                <input className="input" value={reqSkills} onChange={e => setReqSkills(e.target.value)} placeholder="Python, React, SQL..." />
              </div>
              <button onClick={handleScreen} disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', padding: 16 }}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Screening {files.length} resumes...</> : <><Files size={18} /> Screen All Resumes</>}
              </button>
            </div>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
            {/* Summary */}
            <motion.div variants={fadeUp} className="card" style={{ padding: 28, marginBottom: 24 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around', gap: 24, textAlign: 'center' }}>
                <div><div className="stat-value" style={{ color: 'var(--color-navy)' }}>{results.summary.total}</div><div className="stat-label">Total Screened</div></div>
                <div><div className="stat-value" style={{ color: 'var(--color-green)' }}>{results.summary.average_score}</div><div className="stat-label">Avg Score</div></div>
                <div><div className="stat-value" style={{ color: 'var(--color-orange)', fontSize: 20 }}>{results.summary.top_candidate || 'N/A'}</div><div className="stat-label">Top Candidate</div></div>
              </div>
            </motion.div>

            {/* Ranked Table */}
            <motion.div variants={fadeUp} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {['Rank', 'Candidate', 'Category', 'Match', 'ATS', 'Quality'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.candidates.map((c, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {c.rank <= 3 && <Trophy size={14} style={{ color: c.rank === 1 ? '#FFD700' : c.rank === 2 ? '#C0C0C0' : '#CD7F32' }} />}
                            <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{c.rank}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.candidate_name || c.filename}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{c.filename}</div>
                        </td>
                        <td><span className="pill" style={{ background: 'rgba(232,93,38,0.1)', color: 'var(--color-orange)' }}>{c.result.category || 'Error'}</span></td>
                        <td style={{ fontWeight: 700, color: scoreColor(c.result.match_score || 0) }}>{c.result.match_score || 0}%</td>
                        <td style={{ fontWeight: 600, color: scoreColor(c.result.ats_score || 0) }}>{c.result.ats_score || 0}</td>
                        <td style={{ fontWeight: 600, color: scoreColor(c.result.quality_score?.total || 0) }}>{c.result.quality_score?.total || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 32 }}>
              <button onClick={() => { setResults(null); setFiles([]); }} className="btn btn-outline">Screen More</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
