import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Upload, Type, Loader2, Sparkles, Target, Zap, TrendingUp, BookOpen, Shield, Brain, Code, Cloud, Smartphone, Palette, CheckCircle, ChevronRight, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import FileUploadZone from '../components/FileUploadZone';
import { screenResume, analyzeCareerDNA } from '../api/client';

const ICON_MAP = { code: Code, brain: Brain, cloud: Cloud, smartphone: Smartphone, palette: Palette, shield: Shield, check: CheckCircle, server: Code, database: Code };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

/* ── DNA Ring Visualization ── */
function DNARing({ segments, size = 340 }) {
  const cx = size / 2, cy = size / 2, radius = size / 2 - 30;
  const active = segments.filter(s => s.strength > 0);
  const total = segments.length;
  const gap = 2;
  const arcLen = (360 - total * gap) / total;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: 'drop-shadow(0 0 20px rgba(232,93,38,0.15))' }}>
      {/* Background rings */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(232,93,38,0.06)" strokeWidth={28} />
      <circle cx={cx} cy={cy} r={radius - 36} fill="none" stroke="rgba(232,93,38,0.04)" strokeWidth={20} />
      {/* DNA segments */}
      {segments.map((seg, i) => {
        const startAngle = i * (arcLen + gap) - 90;
        const sweep = arcLen * (seg.strength / 100);
        const bgSweep = arcLen;
        const hue = seg.color_hue;
        const toRad = a => (a * Math.PI) / 180;
        const bgEnd = { x: cx + radius * Math.cos(toRad(startAngle + bgSweep)), y: cy + radius * Math.sin(toRad(startAngle + bgSweep)) };
        const start = { x: cx + radius * Math.cos(toRad(startAngle)), y: cy + radius * Math.sin(toRad(startAngle)) };
        const end = { x: cx + radius * Math.cos(toRad(startAngle + sweep)), y: cy + radius * Math.sin(toRad(startAngle + sweep)) };
        const largeArc = sweep > 180 ? 1 : 0;
        const bgLargeArc = bgSweep > 180 ? 1 : 0;
        return (
          <g key={seg.category}>
            <path d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${bgLargeArc} 1 ${bgEnd.x} ${bgEnd.y}`}
              fill="none" stroke={`hsla(${hue},70%,60%,0.12)`} strokeWidth={22} strokeLinecap="round" />
            {seg.strength > 0 && (
              <motion.path
                d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
                fill="none" stroke={`hsl(${hue},70%,55%)`} strokeWidth={22} strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: i * 0.05, ease: 'easeOut' }}
              />
            )}
          </g>
        );
      })}
      {/* Center label */}
      <text x={cx} y={cy - 14} textAnchor="middle" fill="var(--color-navy)" fontFamily="var(--font-heading)" fontWeight="800" fontSize="28">
        {active.length}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="var(--color-text-muted)" fontFamily="var(--font-body)" fontSize="11">
        Active Categories
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fill="var(--color-orange)" fontFamily="var(--font-heading)" fontWeight="700" fontSize="13">
        Skill DNA
      </text>
    </svg>
  );
}

/* ── Readiness Gauge ── */
function ReadinessGauge({ score, grade }) {
  const radius = 70, circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: 160, height: 100 }}>
      <svg width={160} height={100} viewBox="0 0 160 100">
        <path d={`M 10 90 A ${radius} ${radius} 0 0 1 150 90`} fill="none" stroke="rgba(232,93,38,0.1)" strokeWidth={12} strokeLinecap="round" />
        <motion.path d={`M 10 90 A ${radius} ${radius} 0 0 1 150 90`} fill="none" stroke={grade?.color || 'var(--color-orange)'}
          strokeWidth={12} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: 'easeOut' }} />
      </svg>
      <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, color: grade?.color }}>{grade?.letter}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>{grade?.label}</div>
      </div>
    </div>
  );
}

/* ── Career Fit Bar ── */
function FitBar({ score, delay = 0 }) {
  const color = score >= 70 ? '#10B981' : score >= 45 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <motion.div style={{ height: '100%', borderRadius: 4, background: color }}
        initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, delay, ease: 'easeOut' }} />
    </div>
  );
}

/* ── Main Page ── */
export default function CareerDNAPage() {
  const [mode, setMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (mode === 'upload' && !file) return toast.error('Upload a resume first');
    if (mode === 'text' && resumeText.length < 50) return toast.error('Resume too short');

    setLoading(true);
    try {
      let text = resumeText;
      if (mode === 'upload') {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('job_description', 'General software engineering position requiring programming skills');
        const screenRes = await screenResume(fd);
        text = screenRes.data.resume_text || screenRes.data.cleaned_text || '';
      }
      if (text.length < 50) { toast.error('Could not extract resume text'); setLoading(false); return; }
      const res = await analyzeCareerDNA({ resume_text: text });
      setResult(res.data);
      toast.success('Career DNA analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: 24 }}>
        <div className="page-header">
          <h1><Dna size={24} /> Career DNA Analyzer</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            🧬 Discover your unique Skill Genome, predict career paths, and find skill synergies
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="page-content" style={{ paddingTop: 0 }}>
            <div className="card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: 4, borderRadius: 14, background: 'var(--color-cream)' }}>
                {[{ id: 'upload', label: 'Upload File', icon: Upload }, { id: 'text', label: 'Paste Text', icon: Type }].map(t => (
                  <button key={t.id} onClick={() => setMode(t.id)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 10,
                    background: mode === t.id ? 'var(--color-surface)' : 'transparent',
                    boxShadow: mode === t.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    fontWeight: mode === t.id ? 600 : 400, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}><t.icon size={16} /> {t.label}</button>
                ))}
              </div>
              {mode === 'upload' ? <FileUploadZone onFileSelect={setFile} isLoading={loading} /> : (
                <textarea className="input" value={resumeText} onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste your full resume text here..." style={{ minHeight: 220 }} />
              )}
              {file && (
                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: '#E8F5E9', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={16} style={{ color: 'var(--color-green)' }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{file.name}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <button onClick={handleAnalyze} disabled={loading || (mode === 'upload' ? !file : resumeText.length < 50)}
                className="btn btn-primary" style={{ padding: '14px 40px', fontSize: 16 }}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing DNA...</> : <><Dna size={18} /> Analyze Career DNA</>}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="page-content" style={{ paddingTop: 0 }}>
            {/* Reset */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <button onClick={() => { setResult(null); setFile(null); setResumeText(''); }} className="btn btn-outline">← New Analysis</button>
            </div>

            {/* Summary Cards */}
            <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}
              initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
              {[
                { icon: Sparkles, label: 'Skills Found', value: result.summary?.total_skills_found || 0, color: '#E85D26' },
                { icon: Target, label: 'Best Career Fit', value: `${result.summary?.top_career_fit || 0}%`, color: '#10B981' },
                { icon: Zap, label: 'Synergy Score', value: result.synergies?.synergy_score || 0, color: '#818CF8' },
                { icon: TrendingUp, label: 'Market Grade', value: result.summary?.readiness_grade || 'N/A', color: '#F59E0B' },
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeUp} className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <stat.icon size={22} style={{ color: stat.color, marginBottom: 8 }} />
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, color: 'var(--color-navy)' }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* DNA Ring + Market Readiness */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Dna size={18} style={{ color: 'var(--color-orange)' }} /> Skill DNA Fingerprint
                </h3>
                <DNARing segments={result.dna_fingerprint || []} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16, justifyContent: 'center', maxWidth: 360 }}>
                  {(result.dna_fingerprint || []).filter(s => s.strength > 0).map(seg => (
                    <span key={seg.category} style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20,
                      background: `hsla(${seg.color_hue},70%,55%,0.1)`, color: `hsl(${seg.color_hue},70%,40%)`, fontWeight: 600,
                    }}>{seg.label} {seg.strength}%</span>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="card" style={{ padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} style={{ color: 'var(--color-orange)' }} /> Market Readiness
                </h3>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <ReadinessGauge score={result.market_readiness?.readiness_score || 0} grade={result.market_readiness?.grade} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Diversity', value: result.market_readiness?.diversity_score },
                    { label: 'Trending', value: result.market_readiness?.trending_score },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center', padding: 12, borderRadius: 12, background: 'var(--color-cream)' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--color-navy)' }}>{m.value || 0}%</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                {result.market_readiness?.trending_found?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>🔥 Trending Skills You Have:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {result.market_readiness.trending_found.map(s => (
                        <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#ECFDF5', color: '#059669', fontWeight: 600 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Career Path Predictions */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="card" style={{ padding: 28, marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={20} style={{ color: 'var(--color-orange)' }} /> Career Path Predictions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {(result.career_predictions || []).map((career, i) => {
                  const IconComp = ICON_MAP[career.icon] || Code;
                  return (
                    <motion.div key={career.career} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }} style={{
                        padding: 20, borderRadius: 16, border: i === 0 ? '2px solid var(--color-orange)' : '1px solid var(--color-border)',
                        background: i === 0 ? 'rgba(232,93,38,0.03)' : 'var(--color-surface)', position: 'relative',
                      }}>
                      {i === 0 && <span style={{ position: 'absolute', top: -10, right: 16, background: 'var(--color-orange)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>BEST MATCH</span>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(232,93,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconComp size={20} style={{ color: 'var(--color-orange)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{career.career}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{career.avg_salary}</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: career.fit_score >= 70 ? '#10B981' : career.fit_score >= 45 ? '#F59E0B' : '#EF4444' }}>
                          {career.fit_score}%
                        </div>
                      </div>
                      <FitBar score={career.fit_score} delay={0.1 * i} />
                      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
                        <span>✅ {career.core_match}/{career.core_total} core</span>
                        <span>⭐ {career.bonus_match}/{career.bonus_total} bonus</span>
                        <span>📈 {career.market_demand}% demand</span>
                      </div>
                      {career.missing_core?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#EF4444', marginBottom: 4 }}>Skills to Learn:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {career.missing_core.slice(0, 4).map(s => (
                              <span key={s} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', fontWeight: 500 }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ArrowRight size={12} /> {career.growth_path}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Skill Synergies */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }} className="card" style={{ padding: 28, marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={20} style={{ color: '#818CF8' }} /> Skill Synergies
                <span style={{ fontSize: 12, fontWeight: 600, color: '#818CF8', background: 'rgba(129,140,248,0.1)', padding: '3px 10px', borderRadius: 8, marginLeft: 'auto' }}>
                  {result.synergies?.synergy_count || 0}/{result.synergies?.total_possible || 0} unlocked
                </span>
              </h3>
              {result.synergies?.synergies_found?.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                  {result.synergies.synergies_found.map((syn, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * i }} style={{
                        padding: 14, borderRadius: 12, background: 'linear-gradient(135deg, rgba(129,140,248,0.06), rgba(232,93,38,0.04))',
                        border: '1px solid rgba(129,140,248,0.15)',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Zap size={14} style={{ color: '#818CF8' }} />
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{syn.label}</span>
                        <span style={{ fontSize: 11, color: '#818CF8', fontWeight: 700, marginLeft: 'auto' }}>+{syn.bonus_points}pts</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {syn.skills.map(s => (
                          <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: 'rgba(129,140,248,0.1)', color: '#6366F1', fontWeight: 600 }}>{s}</span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No synergy pairs found yet. Add more complementary skills!</p>
              )}
            </motion.div>

            {/* Learning Roadmap for top career */}
            {result.career_predictions?.[0]?.learning_roadmap?.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.4 }} className="card" style={{ padding: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={20} style={{ color: '#10B981' }} /> Learning Roadmap
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 400 }}>→ {result.career_predictions[0].career}</span>
                </h3>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {result.career_predictions[0].learning_roadmap.map((phase, i) => (
                    <div key={i} style={{ flex: '1 1 220px', minWidth: 220, padding: 20, borderRadius: 14, border: '1px solid var(--color-border)', position: 'relative' }}>
                      <div style={{
                        position: 'absolute', top: -10, left: 16, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                        background: phase.priority === 'critical' ? '#FEE2E2' : phase.priority === 'recommended' ? '#FEF3C7' : '#ECFDF5',
                        color: phase.priority === 'critical' ? '#DC2626' : phase.priority === 'recommended' ? '#D97706' : '#059669',
                      }}>{phase.priority.toUpperCase()}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, marginTop: 4 }}>{phase.phase}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 12 }}>⏱ {phase.duration}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {phase.skills.map(s => (
                          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500 }}>
                            <ChevronRight size={12} style={{ color: 'var(--color-orange)' }} /> {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
