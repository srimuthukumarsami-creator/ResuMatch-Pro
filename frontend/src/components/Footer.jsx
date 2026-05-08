import { FileSearch } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--color-navy)', color: 'rgba(255,255,255,0.6)', padding: '52px 32px', textAlign: 'center' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSearch size={15} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: 'white' }}>
            Resu<span style={{ color: 'var(--color-orange)' }}>Match</span> Pro
          </span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>AI-Powered Resume Screening with NLP &amp; Machine Learning</p>
        <p style={{ fontSize: 12, marginTop: 10, opacity: 0.5, letterSpacing: '0.03em' }}>Screen Smarter. Hire Better. © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
