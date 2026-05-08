import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Upload, FileText, Cpu, BarChart3, Briefcase, Layout, Layers, Palette, Sparkles, ChevronDown, Brain, Database, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const STEPS = [
  { icon: Upload, title: 'Upload Resume', desc: 'Upload your PDF, DOCX, or paste text', color: '#3498DB' },
  { icon: FileText, title: 'Add Job Description', desc: 'Paste the job description you\'re applying for', color: '#2D6A4F' },
  { icon: Cpu, title: 'AI Analysis', desc: 'Our ML model + Claude AI analyze the match in under 1 second', color: '#E85D26' },
  { icon: BarChart3, title: 'Get Results', desc: 'See your match score, skill gaps, and improvement tips', color: '#8E44AD' },
];

const AXES = [
  { icon: FileText, name: 'Content', weight: 25, desc: 'Word count, quantified achievements, action verbs', color: '#3498DB' },
  { icon: Briefcase, name: 'Skills', weight: 30, desc: 'Hard & soft skills matched against the JD requirements', color: '#2D6A4F' },
  { icon: Layout, name: 'Format', weight: 20, desc: 'Date formatting, resume length, bullet point usage', color: '#E85D26' },
  { icon: Layers, name: 'Sections', weight: 15, desc: 'Summary, Experience, Education, Skills — all present?', color: '#C0392B' },
  { icon: Palette, name: 'Style', weight: 10, desc: 'Professional tone, buzzword detection, voice analysis', color: '#8E44AD' },
];

const CATEGORIES = [
  "Advocate", "Arts", "Automation Testing", "Blockchain", "Business Analyst",
  "Civil Engineer", "Data Science", "Database", "DevOps Engineer", "DotNet Developer",
  "ETL Developer", "Electrical Engineering", "HR", "Hadoop", "Health & Fitness",
  "Java Developer", "Mechanical Engineer", "Network Security", "Operations Manager",
  "PMO", "Python Developer", "React Developer", "SAP Developer", "Sales",
  "Testing",
];

export default function HowItWorksPage() {
  const [techOpen, setTechOpen] = useState(false);

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <div className="page-header" style={{ textAlign: 'center', marginBottom: 48 }}>
            <motion.h1 variants={fadeUp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <BookOpen size={28} /> How ResuMatch Pro Works
            </motion.h1>
            <motion.p variants={fadeUp} style={{ fontSize: 16, color: 'var(--color-text-secondary)', maxWidth: 600, margin: '12px auto 0' }}>
              From upload to actionable insights in 4 simple steps
            </motion.p>
          </div>

          {/* ── Section 1: Four Steps ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 64 }}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={i} variants={fadeUp} className="card" style={{
                  padding: 28, textAlign: 'center', position: 'relative', overflow: 'visible',
                }}>
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block" style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-border)' }}>
                      <ArrowRight size={20} />
                    </div>
                  )}
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, background: `${step.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  }}>
                    <Icon size={26} style={{ color: step.color }} />
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: step.color, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13,
                    margin: '0 auto 12px', fontFamily: 'var(--font-heading)',
                  }}>
                    {i + 1}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{step.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* ── Section 2: What We Check (5 axes) ── */}
          <motion.div variants={fadeUp} style={{ marginBottom: 64 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-heading)', textAlign: 'center', marginBottom: 8 }}>
              <Sparkles size={22} style={{ color: 'var(--color-orange)', display: 'inline', verticalAlign: 'middle' }} /> What We Check
            </h2>
            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 28 }}>
              Your resume is scored across 5 weighted axes for a comprehensive match score
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {AXES.map((axis, i) => {
                const Icon = axis.icon;
                return (
                  <motion.div key={i} variants={fadeUp} className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${axis.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} style={{ color: axis.color }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{axis.name}</h4>
                        <span style={{ fontSize: 12, fontWeight: 600, color: axis.color }}>{axis.weight}% weight</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{axis.desc}</p>
                    {/* Weight bar */}
                    <div style={{ marginTop: 12, height: 4, borderRadius: 2, background: 'var(--color-border-light)', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${axis.weight * 3.3}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                        style={{ height: '100%', borderRadius: 2, background: axis.color }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Section 3: Our Technology ── */}
          <motion.div variants={fadeUp} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-heading)', textAlign: 'center', marginBottom: 28 }}>
              Our Technology
            </h2>
            <div className="grid md:grid-cols-2" style={{ gap: 20 }}>
              {/* ML Pipeline */}
              <div className="card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database size={22} style={{ color: 'var(--color-green)' }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>ML Pipeline</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'TF-IDF Vectorizer', desc: 'Converts resume text into numerical features' },
                    { label: 'KNN Classifier', desc: 'Classifies resumes into 25 job categories' },
                    { label: 'Training Data', desc: '9,808 real resumes from industry datasets' },
                    { label: 'Feature Extraction', desc: 'Skills, entities, formatting analysis' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Zap size={14} style={{ color: 'var(--color-green)', marginTop: 3, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 6 }}>— {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Layer */}
              <div className="card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(232,93,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={22} style={{ color: 'var(--color-orange)' }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>AI Layer</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Claude AI', desc: 'Natural language feedback and analysis' },
                    { label: 'Cover Letter Generation', desc: 'Personalized letters using real resume data' },
                    { label: 'JD Understanding', desc: 'Deep parsing of job requirements' },
                    { label: 'Graceful Fallback', desc: 'Works without API key using ML heuristics' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Sparkles size={14} style={{ color: 'var(--color-orange)', marginTop: 3, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 6 }}>— {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Collapsible Technical Details ── */}
          <motion.div variants={fadeUp} className="card" style={{ overflow: 'hidden', marginBottom: 48 }}>
            <button onClick={() => setTechOpen(!techOpen)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={16} /> Technical Details
              </span>
              <ChevronDown size={18} style={{ color: 'var(--color-text-muted)', transition: 'transform 0.3s', transform: techOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            {techOpen && (
              <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--color-border-light)' }}>
                <div style={{ paddingTop: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Supported Categories ({CATEGORIES.length})</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                    {CATEGORIES.map(cat => (
                      <span key={cat} className="pill" style={{ background: 'var(--color-cream)', fontSize: 12 }}>{cat}</span>
                    ))}
                  </div>

                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>API Endpoints</h4>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--color-cream)', padding: 16, borderRadius: 10, lineHeight: 1.8 }}>
                    POST /api/screen — Screen single resume<br/>
                    POST /api/screen/text — Screen from raw text<br/>
                    POST /api/bulk-screen — Batch screening<br/>
                    POST /api/generate-cover-letter — AI cover letter<br/>
                    POST /api/generate-highlights — AI highlights<br/>
                    POST /api/shorten-jd — Shorten job description<br/>
                    GET /api/categories — List supported categories
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 32 }}>
            <Link to="/screen" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: 16, textDecoration: 'none' }}>
              Try It Now <ArrowRight size={18} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
