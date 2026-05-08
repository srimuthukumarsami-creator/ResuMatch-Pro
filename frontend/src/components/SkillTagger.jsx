import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SkillTagger({ skills, setSkills, placeholder = 'Type a skill and press Enter', color = 'orange' }) {
  const [input, setInput] = useState('');

  const addSkill = () => {
    const s = input.trim();
    if (s && !skills.includes(s)) { setSkills([...skills, s]); setInput(''); }
  };

  const removeSkill = (skill) => setSkills(skills.filter(s => s !== skill));

  const colors = {
    orange: { bg: 'rgba(232,93,38,0.1)', text: 'var(--color-orange)', border: 'rgba(232,93,38,0.2)' },
    green: { bg: 'rgba(45,106,79,0.1)', text: 'var(--color-green)', border: 'rgba(45,106,79,0.2)' },
  };
  const c = colors[color] || colors.orange;

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          className="input flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
          placeholder={placeholder}
          style={{ padding: '10px 14px', fontSize: 14 }}
        />
        <button onClick={addSkill} className="btn btn-outline" style={{ padding: '10px 14px' }} type="button">
          <Plus size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {skills.map(skill => (
            <motion.span key={skill} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="pill" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
              {skill}
              <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, padding: 0, display: 'flex' }}>
                <X size={12} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
