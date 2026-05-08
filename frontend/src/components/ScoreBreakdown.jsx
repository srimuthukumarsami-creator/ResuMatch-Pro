import { motion } from 'framer-motion';

const BAR_COLORS = {
  content: '#3498DB',
  skills: '#2D6A4F',
  format: '#E85D26',
  sections: '#C0392B',
  style: '#8E44AD',
};

const BAR_LABELS = {
  content: 'Content',
  skills: 'Skills',
  format: 'Format',
  sections: 'Sections',
  style: 'Style',
};

const WEIGHTS = { content: 25, skills: 30, format: 20, sections: 15, style: 10 };

export default function ScoreBreakdown({ breakdown }) {
  if (!breakdown) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Object.entries(breakdown).map(([key, value], i) => (
        <div key={key}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {BAR_LABELS[key] || key} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>({WEIGHTS[key]}%)</span>
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-heading)', color: BAR_COLORS[key] }}>
              {value}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--color-border-light)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 4, background: BAR_COLORS[key] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
