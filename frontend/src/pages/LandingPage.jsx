import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileSearch, Zap, Shield, BarChart3, Upload, Brain, CheckCircle, ArrowRight, Users, TrendingUp } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function TypeWriter({ words }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[idx];
    const timer = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1));
        if (text.length === word.length) setTimeout(() => setDeleting(true), 1500);
      } else {
        setText(word.slice(0, text.length - 1));
        if (text.length === 0) { setDeleting(false); setIdx((idx + 1) % words.length); }
      }
    }, deleting ? 50 : 100);
    return () => clearTimeout(timer);
  }, [text, deleting, idx, words]);

  return <span style={{ color: 'var(--color-orange)' }}>{text}<span style={{ borderRight: '2px solid var(--color-orange)', animation: 'blink 1s infinite' }}>&nbsp;</span></span>;
}

function BookOpenIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 32px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 80, right: '10%', width: 280, height: 280, borderRadius: '50%', opacity: 0.15, background: 'var(--color-orange)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: 80, left: '10%', width: 200, height: 200, borderRadius: '50%', opacity: 0.12, background: 'var(--color-green)', filter: 'blur(80px)' }} />

        <motion.div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }} initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
            <span className="pill" style={{ background: 'rgba(232,93,38,0.1)', color: 'var(--color-orange)', fontWeight: 600, padding: '7px 18px', fontSize: 13 }}>
              <Zap size={14} /> AI-Powered Resume Screening
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.08, color: 'var(--color-navy)', marginBottom: 24, letterSpacing: '-0.03em' }}>
            Screen Smarter.<br/>
            <TypeWriter words={['Hire Better.', 'Save Time.', 'Find Talent.']} />
          </motion.h1>

          <motion.p variants={fadeUp} style={{ fontSize: 18, color: 'var(--color-text-secondary)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Classify resumes into 25 job categories using NLP &amp; Machine Learning. Get instant match scores, skill analysis, and ATS reports.
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            <Link to="/screen" className="btn btn-primary" style={{ padding: '15px 36px', fontSize: 16, textDecoration: 'none' }}>
              <FileSearch size={18} /> Start Screening Free
            </Link>
            <Link to="/how-it-works" className="btn btn-outline" style={{ padding: '15px 36px', fontSize: 16, textDecoration: 'none' }}>
              <BookOpenIcon /> How It Works
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 40, marginTop: 64 }}>
            {[
              { icon: Users, value: '25', label: 'Job Categories' },
              { icon: TrendingUp, value: '100%', label: 'Model Accuracy' },
              { icon: Zap, value: '<1s', label: 'Processing Time' },
            ].map((stat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(232,93,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={20} style={{ color: 'var(--color-orange)' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 24, color: 'var(--color-navy)', lineHeight: 1.2 }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', letterSpacing: '0.01em' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: '96px 32px', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div style={{ textAlign: 'center', marginBottom: 64 }} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.02em' }}>
              Everything You Need to <span style={{ color: 'var(--color-orange)' }}>Screen Resumes</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: 'var(--color-text-secondary)', fontSize: 16, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Powered by TF-IDF vectorization, KNN classification, and advanced NLP analysis.
            </motion.p>
          </motion.div>

          <motion.div className="grid md:grid-cols-3" style={{ gap: 24 }} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { icon: Brain, title: 'AI Classification', desc: 'TF-IDF + KNN classifies resumes into 25 job categories with high confidence scores.' },
              { icon: Shield, title: 'ATS Compatibility', desc: 'Check if resumes pass Applicant Tracking Systems with detailed improvement tips.' },
              { icon: BarChart3, title: 'Skill Matching', desc: 'Compare candidate skills against job requirements. Find matches, gaps, and bonus skills.' },
              { icon: Upload, title: 'PDF & DOCX Support', desc: 'Upload PDF, DOCX, or paste text directly. Drag-and-drop with instant parsing.' },
              { icon: Zap, title: 'Instant Results', desc: 'Get comprehensive analysis in under a second — categories, scores, and recommendations.' },
              { icon: CheckCircle, title: 'Quality Scoring', desc: 'Resume quality report: length, contact info, action verbs, quantified achievements.' },
            ].map((feat, i) => (
              <motion.div key={i} variants={fadeUp} className="card" style={{ padding: 32, cursor: 'default', transition: 'transform 0.3s' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(232,93,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <feat.icon size={24} style={{ color: 'var(--color-orange)' }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.01em' }}>{feat.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '96px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div style={{ textAlign: 'center', marginBottom: 64 }} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.02em' }}>
              How It Works
            </motion.h2>
          </motion.div>

          <motion.div className="grid md:grid-cols-3" style={{ gap: 36 }} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { step: '01', title: 'Upload Resume', desc: 'Upload a PDF/DOCX file or paste resume text directly into the screener.' },
              { step: '02', title: 'AI Analysis', desc: 'Our NLP pipeline cleans, vectorizes, and classifies using TF-IDF + KNN.' },
              { step: '03', title: 'Get Results', desc: 'Receive category prediction, match scores, skill analysis, and improvement tips.' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} style={{ textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: 'var(--color-orange)', color: 'white', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/screen" className="btn btn-primary" style={{ padding: '15px 36px', textDecoration: 'none' }}>
              Try It Now <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '96px 32px', background: 'var(--color-navy)' }}>
        <motion.div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 variants={fadeUp} style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 18, letterSpacing: '-0.02em' }}>
            Ready to Screen Smarter?
          </motion.h2>
          <motion.p variants={fadeUp} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
            Start screening resumes with AI-powered NLP analysis. Free to use, no sign-up required.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link to="/screen" className="btn btn-primary" style={{ padding: '17px 44px', fontSize: 17, textDecoration: 'none' }}>
              <FileSearch size={20} /> Start Screening
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
