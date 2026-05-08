import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Upload, Type, Loader2, ChevronRight, Briefcase, Search, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import FileUploadZone from '../components/FileUploadZone';
import ReportTabs from '../components/ReportTabs';
import { screenResume, shortenJD } from '../api/client';

export default function ScreenerPage() {
  const [mode, setMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);
  const [shortening, setShortening] = useState(false);

  // Handle real screening — NO demo mode, NO fake data
  const handleScreen = async () => {
    if (mode === 'upload' && !file) return toast.error('Upload a resume first');
    if (mode === 'text' && resumeText.length < 50) return toast.error('Resume too short (min 50 chars)');
    if (jd.length < 30) return toast.error('Job description too short (min 30 chars)');

    setLoading(true);
    try {
      const fd = new FormData();
      if (mode === 'upload') {
        fd.append('file', file);
      } else {
        fd.append('resume_text', resumeText);
      }
      fd.append('job_description', jd);

      const res = await screenResume(fd);
      const data = res.data;

      // Store resume text for editor tab
      setResumeText(data.resume_text || data.cleaned_text || resumeText);
      setResult(data);
      toast.success(`Screening complete — ${data.candidate_name || 'Resume'} analyzed`);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Screening failed';
      toast.error(msg);
      console.error('[Screen Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setFile(null);
    setResumeText('');
    setStep(1);
  };

  const hasResume = mode === 'upload' ? !!file : resumeText.length >= 50;
  const canScreen = hasResume && jd.length >= 30;

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: 24, paddingBottom: 0 }}>
        <div className="page-header">
          <h1><FileSearch size={24} /> Resume Screener</h1>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="page-content" style={{ paddingTop: 0 }}>
            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              {[
                { num: 1, label: 'Upload Resume' },
                { num: 2, label: 'Add Job Description' },
              ].map((s, i) => (
                <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {i > 0 && <div style={{ width: 40, height: 2, background: step >= s.num ? 'var(--color-orange)' : 'var(--color-border)' }} />}
                  <button onClick={() => { if (s.num === 1 || hasResume) setStep(s.num); }} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 12,
                    background: step === s.num ? 'var(--color-orange)' : step > s.num ? '#E8F5E9' : 'var(--color-cream)',
                    color: step === s.num ? 'white' : step > s.num ? 'var(--color-green)' : 'var(--color-text-muted)',
                    border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-body)',
                  }}>
                    {step > s.num ? <CheckCircle size={14} /> : <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{s.num}</span>}
                    {s.label}
                  </button>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="card" style={{ padding: 32 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: 4, borderRadius: 14, background: 'var(--color-cream)' }}>
                      {[
                        { id: 'upload', label: 'Upload File', icon: Upload },
                        { id: 'text', label: 'Paste Text', icon: Type },
                      ].map(t => (
                        <button key={t.id} onClick={() => setMode(t.id)} style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 10,
                          background: mode === t.id ? 'var(--color-surface)' : 'transparent',
                          boxShadow: mode === t.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                          fontWeight: mode === t.id ? 600 : 400, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                        }}>
                          <t.icon size={16} /> {t.label}
                        </button>
                      ))}
                    </div>

                    {mode === 'upload' ? (
                      <FileUploadZone onFileSelect={setFile} isLoading={loading} />
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <textarea className="input" value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your full resume text here..." style={{ minHeight: 250 }} />
                        <span style={{ position: 'absolute', bottom: 14, right: 14, fontSize: 12, color: 'var(--color-text-muted)' }}>{resumeText.length} chars</span>
                      </div>
                    )}

                    {file && (
                      <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: '#E8F5E9', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle size={16} style={{ color: 'var(--color-green)' }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{file.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                    <button onClick={() => { if (hasResume) setStep(2); else toast.error('Add a resume first'); }}
                      className="btn btn-primary" style={{ padding: '14px 32px' }}>
                      Next: Job Description <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="card" style={{ padding: 32 }}>
                    <h3 className="section-title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Briefcase size={16} /> Job Description *
                    </h3>
                    <div style={{ position: 'relative' }}>
                      <textarea className="input" value={jd} onChange={e => setJd(e.target.value)}
                        placeholder="Paste the full job description here — the screening will match resume skills against this JD specifically..." style={{ minHeight: 220 }} />
                      <span style={{ position: 'absolute', bottom: 14, right: 14, fontSize: 12, color: jd.length >= 30 ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
                        {jd.length} chars {jd.length >= 30 ? '✓' : '(min 30)'}
                      </span>
                    </div>

                    {/* Shorten button */}
                    {jd.length >= 30 && (
                      <div style={{ marginTop: 12 }}>
                        <button onClick={async () => {
                          setShortening(true);
                          try {
                            const res = await shortenJD({ job_description: jd });
                            setJd(res.data.shortened || jd);
                            toast.success(`Shortened to ${res.data.word_count} words`);
                          } catch { toast.error('Could not shorten JD'); }
                          finally { setShortening(false); }
                        }} disabled={shortening} className="btn btn-outline" style={{ fontSize: 13, padding: '8px 18px' }}>
                          {shortening ? <><Loader2 size={14} className="animate-spin" /> Shortening...</> : '✂️ Shorten Description'}
                        </button>
                      </div>
                    )}

                    {/* Resume confirmation */}
                    <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: '#E8F5E9', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle size={16} style={{ color: 'var(--color-green)' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-green)' }}>
                        {mode === 'upload' ? `Resume: ${file?.name}` : `Resume: ${resumeText.length} chars entered`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 28 }}>
                    <button onClick={() => setStep(1)} className="btn btn-outline" style={{ padding: '14px 28px' }}>← Back</button>
                    <button onClick={handleScreen} disabled={loading || !canScreen}
                      className="btn btn-primary" style={{ padding: '14px 40px', fontSize: 16, opacity: canScreen ? 1 : 0.5 }}>
                      {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing resume...</> : <><Search size={18} /> Start Scanning</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ReportTabs result={result} resumeText={result.resume_text || resumeText} jdText={jd} onReset={resetForm} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
