import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, XCircle, AlertTriangle, FileText, Briefcase, Layout, Layers, Palette, Sparkles, TrendingUp } from 'lucide-react';
import RadarScoreChart from './RadarScoreChart';
import ScoreBreakdown from './ScoreBreakdown';
import ScoreRing from './ScoreRing';

function Badge({ pass: p, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: p ? '#E8F5E9' : '#FFEBEE', color: p ? 'var(--color-green)' : 'var(--color-red)',
    }}>
      {p ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {label || (p ? 'PASS' : 'FAIL')}
    </span>
  );
}

function Section({ icon: Icon, title, color, badge, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px',
        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</span>
        {badge}
        <ChevronDown size={18} style={{ color: 'var(--color-text-muted)', transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--color-border-light)' }}>
              <div style={{ paddingTop: 20 }}>{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckRow({ pass: p, label, detail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--color-border-light)' }}>
      {p ? <CheckCircle size={16} style={{ color: 'var(--color-green)', marginTop: 2, flexShrink: 0 }} /> : <XCircle size={16} style={{ color: 'var(--color-red)', marginTop: 2, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        {detail && <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>{detail}</div>}
      </div>
    </div>
  );
}

function SkillTable({ title, skills, color }) {
  if (!skills?.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 8 }}>{title}</h4>
      <div style={{ border: '1px solid var(--color-border-light)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-cream)' }}>
              <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Skill</th>
              <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>In Resume</th>
              <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((s, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--color-border-light)' }}>
                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>{s.skill}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13 }}>{s.found ? s.resume_freq || '✓' : '—'}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                  {s.found
                    ? <CheckCircle size={16} style={{ color: 'var(--color-green)' }} />
                    : <XCircle size={16} style={{ color: 'var(--color-red)' }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReportTab({ result, highlights }) {
  const composite = result.composite || {};
  const breakdown = composite.breakdown || {};
  const radarData = composite.radar_data || [];
  const content = result.content_score || {};
  const skills = result.skills_score || {};
  const fmt = result.format_score || {};
  const sections = result.sections_score || {};
  const style = result.style_score || {};
  const hl = highlights || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Overview Card ── */}
      <div className="card" style={{ padding: 32, marginBottom: 24 }}>
        <div className="grid lg:grid-cols-3" style={{ gap: 32 }}>
          {/* Score Ring + Candidate Name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ScoreRing score={composite.composite_score || result.match_score || 0} label="Match Score" size={140} />
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              {/* Candidate name prominently */}
              {(result.candidate_name || result.entities?.name) && (
                <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 8 }}>
                  {result.candidate_name || result.entities?.name}
                </h2>
              )}
              {/* Resume category */}
              <span className="pill" style={{ background: 'rgba(232,93,38,0.1)', color: 'var(--color-orange)', fontWeight: 600, fontSize: 13 }}>
                {result.category || '—'}
              </span>
              {/* JD category match indicator */}
              {result.jd_category && result.jd_category !== result.category && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> JD expects: {result.jd_category}
                </div>
              )}
              {result.jd_category && result.jd_category === result.category && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <CheckCircle size={12} /> Category match ✓
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>{result.confidence || 0}% confidence · {result.processing_time_ms || 0}ms</div>
            </div>
          </div>

          {/* Radar Chart */}
          <div>
            <RadarScoreChart data={radarData} />
          </div>

          {/* Score Breakdown */}
          <div>
            <ScoreBreakdown breakdown={breakdown} />
          </div>
        </div>

        {/* Highlights & Improvements */}
        {(hl.highlights?.length > 0 || hl.improvements?.length > 0) && (
          <div className="grid md:grid-cols-2" style={{ gap: 16, marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--color-border-light)' }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-green)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> Highlights
              </h4>
              {(hl.highlights || []).map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <CheckCircle size={14} style={{ color: 'var(--color-green)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, lineHeight: 1.5 }}>{h}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-amber)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={14} /> Improvements
              </h4>
              {(hl.improvements || []).map((imp, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <AlertTriangle size={14} style={{ color: 'var(--color-amber)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, lineHeight: 1.5 }}>{imp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Collapsible Sections ── */}

      {/* 1. Content */}
      <Section icon={FileText} title="Content" color="#3498DB"
        badge={<Badge pass={(content.score || 0) >= 50} label={`${content.score || 0}/100`} />} defaultOpen>
        <CheckRow pass={content.details?.measurable_results?.pass} label="Measurable Results"
          detail={content.details?.measurable_results?.message} />
        <CheckRow pass={content.details?.word_count_check?.pass} label="Resume Length"
          detail={content.details?.word_count_check?.message} />
        <CheckRow pass={(content.action_verb_count || 0) >= 5} label="Action Verbs"
          detail={`Found ${content.action_verb_count || 0} action verbs — ${(content.action_verb_count || 0) >= 5 ? 'great variety' : 'use more strong action verbs'}`} />
      </Section>

      {/* 2. Skills */}
      <Section icon={Briefcase} title="Skills" color="#2D6A4F"
        badge={<Badge pass={(skills.score || 0) >= 50} label={`${skills.match_percentage || 0}% match`} />} defaultOpen>
        <SkillTable title="Hard Skills" skills={skills.hard_skills} color="var(--color-navy)" />
        <SkillTable title="Soft Skills" skills={skills.soft_skills} color="var(--color-text-secondary)" />
        {skills.nice_to_have?.some(s => s.found) && (
          <SkillTable title="Nice to Have (Bonus)" skills={skills.nice_to_have} color="var(--color-green)" />
        )}
        {(skills.missing_hard?.length > 0 || skills.missing_soft?.length > 0) && (
          <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 12, background: '#FFF3E0', border: '1px solid var(--color-amber)' }}>
            <p style={{ fontSize: 13, color: '#E65100', fontWeight: 600 }}>
              ⚡ Add {(skills.missing_hard?.length || 0) + (skills.missing_soft?.length || 0)} missing skills for a stronger match!
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {[...(skills.missing_hard || []), ...(skills.missing_soft || [])].map(s => (
                <span key={s} className="pill" style={{ background: '#FFEBEE', color: 'var(--color-red)', fontSize: 11 }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* 3. Format */}
      <Section icon={Layout} title="Format" color="#E85D26"
        badge={<Badge pass={(fmt.score || 0) >= 66} label={`${fmt.score || 0}/100`} />}>
        <CheckRow pass={fmt.date_formatting?.pass} label="Date Formatting" detail={fmt.date_formatting?.message} />
        <CheckRow pass={fmt.resume_length?.pass} label={`Resume Length (${fmt.resume_length?.word_count || 0} words)`} detail={fmt.resume_length?.message} />
        <CheckRow pass={fmt.bullet_points?.pass} label={`Bullet Points (${fmt.bullet_points?.count || 0} found)`} detail={fmt.bullet_points?.message} />
      </Section>

      {/* 4. Sections */}
      <Section icon={Layers} title="Sections" color="#C0392B"
        badge={<Badge pass={sections.overall_pass} label={`${sections.present_count || 0}/${sections.total_count || 0}`} />}>
        {sections.sections && Object.entries(sections.sections).map(([key, val]) => (
          <CheckRow key={key} pass={val.present} label={key.charAt(0).toUpperCase() + key.slice(1)}
            detail={val.value !== 'Detected' && val.value !== 'Not found' ? val.value : undefined} />
        ))}
      </Section>

      {/* 5. Style */}
      <Section icon={Palette} title="Style" color="#8E44AD"
        badge={<Badge pass={(style.score || 0) >= 60} label={`${style.score || 0}/100`} />}>
        <CheckRow pass={style.voice?.pass !== false}
          label={`Voice: ${style.voice?.tone || 'Professional'}`}
          detail={style.voice?.description || hl.voice_description} />
        <CheckRow pass={style.buzzwords?.pass}
          label="Buzzwords & Clichés"
          detail={style.buzzwords?.message} />
        {style.buzzwords?.found?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {style.buzzwords.found.map(bw => (
              <span key={bw} className="pill" style={{ background: '#FFEBEE', color: 'var(--color-red)', fontSize: 11 }}>"{bw}"</span>
            ))}
          </div>
        )}
      </Section>

      {/* Top Keywords */}
      {result.top_features?.length > 0 && (
        <Section icon={TrendingUp} title="Top TF-IDF Keywords" color="var(--color-navy)"
          badge={<span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{result.top_features.length} keywords</span>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.top_features.slice(0, 8).map((kw, i) => {
              const max = result.top_features[0]?.score || 1;
              const pct = (kw.score / max) * 100;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, minWidth: 100 }}>{kw.keyword}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--color-border-light)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.04 }}
                      style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--color-orange), var(--color-amber))' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', minWidth: 40, textAlign: 'right' }}>{kw.score?.toFixed(3)}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </motion.div>
  );
}
