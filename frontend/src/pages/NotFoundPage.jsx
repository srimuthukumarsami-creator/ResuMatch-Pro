import { motion } from 'framer-motion';
import { Home, FileSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 32px 64px' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', maxWidth: 500 }}>
        <div style={{ fontSize: 100, fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-border)', lineHeight: 1 }}>404</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, marginTop: 20, marginBottom: 10, letterSpacing: '-0.02em' }}>Page Not Found</h1>
        <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', marginBottom: 36, lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}><Home size={16} /> Go Home</Link>
          <Link to="/screen" className="btn btn-outline" style={{ textDecoration: 'none' }}><FileSearch size={16} /> Screen Resumes</Link>
        </div>
      </motion.div>
    </div>
  );
}
