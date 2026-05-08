import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, RefreshCw, Loader2, Globe, MessageSquare, AlignLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateCoverLetter } from '../api/client';
import jsPDF from 'jspdf';

const TONES = [
  { id: 'formal', label: 'Formal', icon: '🎩' },
  { id: 'casual', label: 'Casual', icon: '😊' },
  { id: 'concise', label: 'Concise', icon: '⚡' },
];

const LENGTHS = [
  { id: 'short', label: 'Short (~250 words)' },
  { id: 'long', label: 'Long (~350 words)' },
];

const LANGUAGES = [
  { id: 'english', label: 'English', flag: '🇬🇧', code: null },
  { id: 'spanish', label: 'Spanish', flag: '🇪🇸', code: 'es' },
  { id: 'french', label: 'French', flag: '🇫🇷', code: 'fr' },
  { id: 'german', label: 'German', flag: '🇩🇪', code: 'de' },
  { id: 'hindi', label: 'Hindi', flag: '🇮🇳', code: 'hi' },
];

// FIX 3: MyMemory translation API
async function translateText(text, langCode) {
  if (!langCode || !text) return text;
  try {
    // Split into sentences to avoid API length limits
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
    const translated = [];
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|${langCode}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        translated.push(data.responseData.translatedText);
      } else {
        translated.push(trimmed);
      }
    }
    return translated.join(' ');
  } catch (err) {
    console.error('[Translation Error]', err);
    throw new Error('Translation unavailable');
  }
}

export default function CoverLetterTab({ result, resumeText, jdText }) {
  const [tone, setTone] = useState('formal');
  const [length, setLength] = useState('short');
  const [language, setLanguage] = useState('english');
  const [coverLetter, setCoverLetter] = useState('');
  const [originalLetter, setOriginalLetter] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [aiPowered, setAiPowered] = useState(false);
  const [translationCache, setTranslationCache] = useState({});

  const candidateName = result?.candidate_name || result?.entities?.name || '';
  const jobTitle = result?.jd_parsed?.job_title || result?.jd_category || result?.category || '';

  // FIX 3: Handle language change with translation
  const handleLanguageChange = async (langId) => {
    setLanguage(langId);
    const langObj = LANGUAGES.find(l => l.id === langId);

    if (!langObj?.code) {
      // English — show original
      if (originalLetter) setCoverLetter(originalLetter);
      return;
    }

    if (!originalLetter && !coverLetter) return;

    // Check cache
    const cacheKey = `${langId}_${originalLetter?.slice(0, 50)}`;
    if (translationCache[cacheKey]) {
      setCoverLetter(translationCache[cacheKey]);
      return;
    }

    setTranslating(true);
    try {
      const source = originalLetter || coverLetter;
      const translated = await translateText(source, langObj.code);
      setCoverLetter(translated);
      setTranslationCache(prev => ({ ...prev, [cacheKey]: translated }));
    } catch {
      toast.error('Translation unavailable, showing English version');
      if (originalLetter) setCoverLetter(originalLetter);
    } finally {
      setTranslating(false);
    }
  };

  const generate = async () => {
    if (!resumeText || resumeText.length < 50) return toast.error('Resume text required');
    setLoading(true);
    try {
      const res = await generateCoverLetter({
        resume_text: resumeText,
        job_description: jdText || '',
        tone, length, language: 'english',
        candidate_name: candidateName,
        job_title: jobTitle,
      });
      const letter = res.data.cover_letter || '';
      setCoverLetter(letter);
      setOriginalLetter(letter);
      setWordCount(res.data.word_count || letter.split(/\s+/).length);
      setAiPowered(res.data.ai_powered || false);
      setTranslationCache({});
      setLanguage('english');
      toast.success('Cover letter generated!');
    } catch (err) {
      toast.error('Generation failed — try again');
    } finally { setLoading(false); }
  };

  const exportPDF = () => {
    if (!coverLetter) return toast.error('Generate a cover letter first');
    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(coverLetter, 170);
    doc.text(lines, 20, 25);
    doc.save(`Cover_Letter_${candidateName.replace(/\s+/g, '_') || 'Draft'}.pdf`);
    toast.success('Cover letter exported as PDF');
  };

  const PillButton = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: active ? 600 : 400,
      background: active ? 'var(--color-orange)' : 'var(--color-cream)',
      color: active ? 'white' : 'var(--color-text-secondary)',
      border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)',
    }}>
      {children}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-3" style={{ gap: 24 }}>
      {/* Left: Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Language */}
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={14} /> Language
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {LANGUAGES.map(l => (
              <PillButton key={l.id} active={language === l.id} onClick={() => handleLanguageChange(l.id)}>
                {l.flag} {l.label}
              </PillButton>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={14} /> Tone
          </h4>
          <div style={{ display: 'flex', gap: 8 }}>
            {TONES.map(t => (
              <PillButton key={t.id} active={tone === t.id} onClick={() => setTone(t.id)}>
                {t.icon} {t.label}
              </PillButton>
            ))}
          </div>
        </div>

        {/* Length */}
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlignLeft size={14} /> Length
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {LENGTHS.map(l => (
              <PillButton key={l.id} active={length === l.id} onClick={() => setLength(l.id)}>
                {l.label}
              </PillButton>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button onClick={generate} disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><RefreshCw size={16} /> {coverLetter ? 'Regenerate' : 'Generate Cover Letter'}</>}
        </button>
      </div>

      {/* Right: Cover Letter Display */}
      <div className="lg:col-span-2">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Cover Letter</h3>
            {aiPowered && <span className="pill" style={{ background: 'rgba(232,93,38,0.1)', color: 'var(--color-orange)', fontSize: 11 }}>✨ AI Generated</span>}
          </div>
          {coverLetter && (
            <button onClick={exportPDF} className="btn btn-outline" style={{ fontSize: 13, padding: '8px 18px' }}>
              <Download size={14} /> Download PDF
            </button>
          )}
        </div>

        <div className="card" style={{ padding: '40px 44px', minHeight: 400, position: 'relative' }}>
          {/* Translation loading overlay */}
          {translating && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,253,248,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, zIndex: 10 }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-orange)', marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>Translating...</p>
            </div>
          )}

          {coverLetter ? (
            <div style={{ fontFamily: 'Georgia, serif', lineHeight: 1.8 }}>
              {candidateName && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>{candidateName}</h2>
                  {jobTitle && <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 2 }}>{jobTitle}</p>}
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{coverLetter}</div>
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{coverLetter.split(/\s+/).length} words</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {TONES.find(t => t.id === tone)?.icon} {tone} · {LANGUAGES.find(l => l.id === language)?.flag} {language}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, textAlign: 'center' }}>
              <FileText size={48} style={{ color: 'var(--color-border)', marginBottom: 16 }} />
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No cover letter yet</p>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 300 }}>
                Choose your preferred tone, length, and language, then click Generate.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
