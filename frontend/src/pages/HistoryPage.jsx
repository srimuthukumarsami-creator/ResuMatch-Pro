import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Trash2, Loader2, Search, FileSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { getHistory, deleteHistory } from '../api/client';

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getHistory().then(res => setRecords(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try { await deleteHistory(id); setRecords(records.filter(r => r.id !== id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = records.filter(r =>
    (r.candidate_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const scoreColor = (s) => s >= 70 ? 'var(--color-green)' : s >= 40 ? 'var(--color-amber)' : 'var(--color-red)';

  if (loading) return (
    <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: 140 }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-orange)', margin: '0 auto' }} />
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: 32 }}>
        <div className="page-header">
          <h1><Clock size={24} /> Screening History</h1>
          <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 500 }}>{records.length} records</span>
        </div>

        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="input" style={{ paddingLeft: 44 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or category..." />
        </div>

        {filtered.length === 0 ? (
          <div className="card" style={{ padding: '56px 32px', textAlign: 'center' }}>
            <FileSearch size={48} style={{ color: 'var(--color-border)', margin: '0 auto 16px', display: 'block' }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No screening history</p>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Screen some resumes to see them here</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {['Candidate', 'Category', 'Match', 'ATS', 'Quality', 'Date', ''].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td style={{ fontWeight: 600 }}>{r.candidate_name || r.filename || 'Unknown'}</td>
                      <td><span className="pill" style={{ background: 'rgba(232,93,38,0.1)', color: 'var(--color-orange)' }}>{r.category}</span></td>
                      <td style={{ fontWeight: 700, color: scoreColor(r.match_score) }}>{r.match_score}%</td>
                      <td style={{ fontWeight: 600, color: scoreColor(r.ats_score) }}>{r.ats_score}</td>
                      <td style={{ fontWeight: 600, color: scoreColor(r.quality_score) }}>{r.quality_score}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => handleDelete(r.id)} className="btn-ghost" style={{ padding: 6, color: 'var(--color-red)' }}><Trash2 size={14} /></button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
