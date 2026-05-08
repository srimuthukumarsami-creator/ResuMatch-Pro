import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Sparkles, Download, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateSuggestions } from '../api/client';
import jsPDF from 'jspdf';

const SEV_COLORS = { high: 'var(--color-red)', medium: 'var(--color-amber)', low: 'var(--color-green)' };
const SEV_BG = { high: '#FFEBEE', medium: '#FFF3E0', low: '#E8F5E9' };

export default function ResumeEditorTab({ result, resumeText, jdText }) {
  const [suggestions, setSuggestions] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [showChanges, setShowChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editableText, setEditableText] = useState('');

  // BUG 5 FIX: Use resume_text from API result, NEVER jdText
  const actualResume = result?.resume_text || resumeText || result?.cleaned_text || '';
  const entities = result?.entities || {};
  const name = entities.name || 'Candidate';
  const email = entities.email || '';
  const phone = entities.phone || '';

  useEffect(() => {
    setEditableText(actualResume);
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    if (!actualResume || actualResume.length < 50) return;
    setLoading(true);
    try {
      const issues = {
        missing_skills: result?.skills_score?.missing_hard || result?.skills_match?.missing || [],
        low_quantified: (result?.content_score?.quantified_count || 0) < 3,
        missing_summary: !result?.sections_score?.sections?.summary?.present,
        short_resume: (result?.content_score?.word_count || 0) < 200,
      };
      const res = await generateSuggestions({ resume_text: actualResume, job_description: jdText || '', issues });
      setSuggestions(Array.isArray(res.data) ? res.data : []);
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  };

  const dismiss = (id) => setDismissed(prev => new Set([...prev, id]));
  const activeSuggestions = suggestions.filter(s => !dismissed.has(s.id));

  const formatResume = (text) => {
    if (!text) return [];
    const lines = text.split('\n');
    const blocks = [];
    let currentSection = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Section headings: ALL CAPS or Title Case followed by colon
      const isHeading = /^(SUMMARY|OBJECTIVE|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|AWARDS|CONTACT|REFERENCES|WORK HISTORY|EMPLOYMENT|TECHNICAL SKILLS|PROFESSIONAL|PROFILE)/i.test(trimmed);
      if (isHeading || (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 30 && !/\d{4}/.test(trimmed))) {
        currentSection = trimmed;
        blocks.push({ type: 'heading', text: trimmed });
      } else if (/^[-•*→►]/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        blocks.push({ type: 'bullet', text: trimmed.replace(/^[-•*→►]\s*/, '').replace(/^\d+\.\s*/, '') });
      } else {
        blocks.push({ type: 'paragraph', text: trimmed });
      }
    }
    return blocks;
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(name, 20, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const contact = [email, phone].filter(Boolean).join(' · ');
    if (contact) doc.text(contact, 20, 33);

    doc.setFontSize(11);
    const textToExport = editableText || actualResume;
    const lines = doc.splitTextToSize(textToExport, 170);
    doc.text(lines, 20, 45);
    doc.save(`${name.replace(/\s+/g, '_')}_Resume.pdf`);
    toast.success('Resume exported as PDF');
  };

  const blocks = formatResume(editableText || actualResume);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-3" style={{ gap: 24 }}>
      {/* Left: Suggestion Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} style={{ color: 'var(--color-orange)' }} /> Suggestions
          </h3>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{activeSuggestions.length} items</span>
        </div>

        {loading && (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-orange)', borderRadius: '50%', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Generating suggestions...</p>
          </div>
        )}

        <AnimatePresence>
          {activeSuggestions.map((s, i) => (
            <motion.div key={s.id || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ borderLeft: `3px solid ${SEV_COLORS[s.severity] || 'var(--color-amber)'}`, borderRadius: '0 14px 14px 0', padding: '14px 16px', background: SEV_BG[s.severity] || '#FFF3E0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: SEV_COLORS[s.severity], letterSpacing: '0.05em' }}>{s.section || 'General'}</span>
                <button onClick={() => dismiss(s.id || `sug_${i}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <X size={14} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{s.title || 'Suggestion'}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{s.description || ''}</p>
              {s.example && (
                <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-green)' }}>
                  💡 {s.example}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && activeSuggestions.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <Check size={24} style={{ color: 'var(--color-green)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, fontWeight: 600 }}>All suggestions addressed!</p>
          </div>
        )}
      </div>

      {/* Right: Resume Display — shows RESUME content, NOT JD */}
      <div className="lg:col-span-2">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setShowChanges(!showChanges)} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, borderRadius: 10, padding: '6px 14px' }}>
              {showChanges ? <EyeOff size={14} /> : <Eye size={14} />}
              {showChanges ? 'Hide changes' : 'Show changes'}
            </button>
          </div>
          <button onClick={exportPDF} className="btn btn-outline" style={{ fontSize: 13, padding: '8px 18px' }}>
            <Download size={14} /> Export PDF
          </button>
        </div>

        <div className="card" style={{ padding: '40px 44px', fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>
          {/* Candidate name as H1 */}
          {name && name !== 'Candidate' && (
            <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', marginBottom: 4 }}>{name}</h1>
          )}
          {(email || phone) && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              {[email, phone, entities.linkedin, entities.github].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Editable resume content */}
          <textarea
            value={editableText}
            onChange={e => setEditableText(e.target.value)}
            style={{
              width: '100%', minHeight: 400, border: 'none', outline: 'none', resize: 'vertical',
              fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.7, background: 'transparent',
              color: 'var(--color-navy)',
            }}
          />

          {showChanges && activeSuggestions.length > 0 && (
            <div style={{ marginTop: 24, padding: '16px 20px', borderRadius: 12, border: '2px solid var(--color-amber)', background: '#FFF3E0' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#E65100', marginBottom: 8 }}>
                <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {activeSuggestions.length} improvement(s) suggested
              </p>
              {activeSuggestions.map((s, i) => (
                <p key={i} style={{ fontSize: 12, color: '#E65100', marginBottom: 4 }}>
                  → <strong>{s.section || 'General'}:</strong> {s.title || ''}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
