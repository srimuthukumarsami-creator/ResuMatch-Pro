import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Edit3, Mail, Loader2 } from 'lucide-react';
import ReportTab from './ReportTab';
import ResumeEditorTab from './ResumeEditorTab';
import CoverLetterTab from './CoverLetterTab';
import { generateHighlights } from '../api/client';

const TABS = [
  { id: 'report', label: 'Report', icon: FileBarChart },
  { id: 'resume', label: 'Resume', icon: Edit3 },
  { id: 'cover', label: 'Cover Letter', icon: Mail },
];

export default function ReportTabs({ result, resumeText, jdText, onReset }) {
  const [activeTab, setActiveTab] = useState('report');
  const [highlights, setHighlights] = useState(null);
  const [hlLoading, setHlLoading] = useState(false);

  useEffect(() => {
    if (result && resumeText) {
      fetchHighlights();
    }
  }, [result]);

  const fetchHighlights = async () => {
    setHlLoading(true);
    try {
      const scores = {
        content_score: result.content_score?.score || 0,
        skills_score: result.skills_score?.score || 0,
        format_score: result.format_score?.score || 0,
        sections_score: result.sections_score?.score || 0,
        style_score: result.style_score?.score || 0,
      };
      const res = await generateHighlights({
        resume_text: resumeText,
        job_description: jdText || '',
        scores,
      });
      setHighlights(res.data);
    } catch {
      setHighlights({
        highlights: ['Resume submitted for analysis'],
        improvements: ['Consider adding more quantified achievements'],
        ai_powered: false,
      });
    } finally { setHlLoading(false); }
  };

  return (
    <div className="page-content" style={{ paddingTop: 0, paddingBottom: 48 }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 14, background: 'var(--color-cream)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 11,
                background: active ? 'var(--color-surface)' : 'transparent',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? 'var(--color-navy)' : 'var(--color-text-muted)',
                transition: 'all 0.2s',
                position: 'relative',
              }}>
                <Icon size={16} />
                {tab.label}
                {active && (
                  <motion.div layoutId="tab-indicator" style={{
                    position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--color-orange)',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        <button onClick={onReset} className="btn btn-outline" style={{ fontSize: 13, padding: '9px 20px' }}>
          ↩ Screen Another
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'report' && (
        hlLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-orange)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Generating AI insights...</p>
          </div>
        ) : (
          <ReportTab result={result} highlights={highlights} />
        )
      )}

      {activeTab === 'resume' && (
        <ResumeEditorTab result={result} resumeText={resumeText} jdText={jdText} />
      )}

      {activeTab === 'cover' && (
        <CoverLetterTab result={result} resumeText={resumeText} jdText={jdText} />
      )}
    </div>
  );
}
