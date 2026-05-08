import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, FileUp } from 'lucide-react';

export default function FileUploadZone({ onFileSelect, isLoading, accept = '.pdf,.docx,.doc,.txt' }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); onFileSelect(f); }
  }, [onFileSelect]);

  const handleSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); onFileSelect(f); }
  };

  const removeFile = () => { setFile(null); if (inputRef.current) inputRef.current.value = ''; };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className="cursor-pointer transition-all duration-200"
        style={{
          border: `2px dashed ${dragging ? 'var(--color-orange)' : 'var(--color-border)'}`,
          borderRadius: 16, padding: '40px 24px', textAlign: 'center',
          background: dragging ? 'rgba(232,93,38,0.04)' : 'transparent',
          transform: dragging ? 'scale(1.01)' : 'scale(1)',
        }}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={handleSelect} hidden />
        
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center gap-4">
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(45,106,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} style={{ color: 'var(--color-green)' }} />
              </div>
              <div className="text-left">
                <div style={{ fontWeight: 600, fontSize: 15 }}>{file.name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{formatSize(file.size)}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="btn-ghost" style={{ padding: 6, borderRadius: 8 }}>
                <X size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(232,93,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <FileUp size={24} style={{ color: 'var(--color-orange)' }} />
              </div>
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                Drop your resume here or <span style={{ color: 'var(--color-orange)' }}>browse</span>
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>PDF, DOCX, or TXT — Max 5MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
