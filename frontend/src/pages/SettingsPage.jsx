import { motion } from 'framer-motion';
import { Settings, User, Bell, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 32px 64px' }}>
        <div className="page-header">
          <h1><Settings size={24} /> Settings</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 28 }}>
            <h3 className="section-title"><User size={18} /> Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { label: 'Name', value: user?.name || '' },
                { label: 'Email', value: user?.email || '' },
                { label: 'Company', value: user?.company || '' },
              ].map((f, i) => (
                <div key={i} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input className="input" defaultValue={f.value} disabled style={{ opacity: 0.7 }} />
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h3 className="section-title"><Palette size={18} /> Preferences</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Theme and preference settings coming soon.</p>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h3 className="section-title"><Bell size={18} /> About</h3>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 2 }}>
              <p><strong>ResuMatch Pro</strong> v1.0.0</p>
              <p>AI-Powered Resume Screening with TF-IDF + KNN</p>
              <p>Built with FastAPI, React, and scikit-learn</p>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>College Final Project — CS Engineering</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
