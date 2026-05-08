import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ScoreRing({ score, size = 160, strokeWidth = 10, label = 'Match Score' }) {
  const [val, setVal] = useState(0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    const timer = setTimeout(() => setVal(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const color = val >= 70 ? 'var(--color-green)' : val >= 40 ? 'var(--color-amber)' : 'var(--color-red)';
  const bgColor = val >= 70 ? '#E8F5E9' : val >= 40 ? '#FFF3E0' : '#FFEBEE';
  const offset = circ - (circ * val) / 100;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-border-light)" strokeWidth={strokeWidth} />
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <CountUp value={val} style={{ fontSize: 36, fontFamily: 'var(--font-heading)', fontWeight: 700, color }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>%</span>
        </div>
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</span>
    </div>
  );
}

function CountUp({ value, style }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const timer = setTimeout(tick, 300);
    return () => clearTimeout(timer);
  }, [value]);
  return <span style={style}>{display}</span>;
}

export { CountUp };
