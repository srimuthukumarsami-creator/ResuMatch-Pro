import { useState } from 'react';
import { motion } from 'framer-motion';
import { Microscope, Loader2, Lightbulb, Target, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeJD } from '../api/client';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function JDAnalyzerPage() {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (jd.length < 50) return toast.error('JD too short (min 50 chars)');
    setLoading(true);
    try {
      const res = await analyzeJD({ job_description: jd });
      setResult(res.data);
      toast.success('JD analyzed!');
    } catch (err) { toast.error('Analysis failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: 32 }}>
        <div className="page-header">
          <h1><Microscope size={24} /> JD Analyzer</h1>
        </div>

        <div className="grid lg:grid-cols-2" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 32 }}>
            <h3 className="section-title">Paste Job Description</h3>
            <textarea className="input" value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the complete job description here..." style={{ minHeight: 300 }} />
            <button onClick={handleAnalyze} disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : <><Microscope size={18} /> Analyze JD</>}
            </button>
          </div>

          {result && (
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <motion.div variants={fadeUp} className="card" style={{ padding: 24 }}>
                <h3 className="section-title"><Target size={16} /> Category Match</h3>
                <div className="pill" style={{ background: 'rgba(232,93,38,0.1)', color: 'var(--color-orange)', fontSize: 16, fontWeight: 700, padding: '9px 22px' }}>
                  {result.category_prediction}
                </div>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 10 }}>Experience: <strong>{result.experience_level}</strong></p>
              </motion.div>

              <motion.div variants={fadeUp} className="card" style={{ padding: 24 }}>
                <h3 className="section-title">✅ Required Skills</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.required_skills?.map(s => <span key={s} className="pill" style={{ background: '#E8F5E9', color: 'var(--color-green)' }}>{s}</span>)}
                  {!result.required_skills?.length && <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>None detected</span>}
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="card" style={{ padding: 24 }}>
                <h3 className="section-title">⭐ Nice to Have</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.nice_to_have_skills?.map(s => <span key={s} className="pill" style={{ background: '#FFF3E0', color: 'var(--color-amber)' }}>{s}</span>)}
                  {!result.nice_to_have_skills?.length && <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>None detected</span>}
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="card" style={{ padding: 24 }}>
                <h3 className="section-title"><BarChart3 size={16} /> Top Keywords</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.keyword_density?.slice(0, 8).map((kw, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, minWidth: 90, fontWeight: 500 }}>{kw.keyword}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--color-border-light)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, kw.score * 20)}%`, height: '100%', borderRadius: 3, background: 'var(--color-orange)' }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', minWidth: 28, textAlign: 'right' }}>{kw.score}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="card" style={{ padding: 24 }}>
                <h3 className="section-title"><Lightbulb size={16} /> Suggestions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.suggestions?.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'var(--color-cream)' }}>
                      <span style={{ color: 'var(--color-orange)', fontWeight: 700, fontFamily: 'var(--font-heading)', minWidth: 20 }}>{i + 1}.</span>
                      <span style={{ fontSize: 14, lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
