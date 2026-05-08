import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, FileSearch, TrendingUp, Award, Clock, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { getDashboard } from '../api/client';
import { CountUp } from '../components/ScoreRing';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const COLORS = ['#E85D26', '#2D6A4F', '#F4A261', '#1A1A2E', '#5C5C7A', '#C0392B', '#8E8EA0', '#3498DB'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(res => setData(res.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: 140 }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-orange)', margin: '0 auto' }} />
    </div>
  );

  if (!data) return (
    <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: 140 }}>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 16 }}>No dashboard data. Start screening to see analytics!</p>
    </div>
  );

  const catData = Object.entries(data.category_distribution || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: 32 }}>
        <div className="page-header">
          <h1><LayoutDashboard size={24} /> Dashboard</h1>
        </div>

        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Screened', value: data.total_screened, icon: FileSearch, color: 'var(--color-orange)' },
              { label: 'This Week', value: data.this_week, icon: Clock, color: 'var(--color-green)' },
              { label: 'Avg Score', value: data.average_score, icon: TrendingUp, color: 'var(--color-amber)' },
              { label: 'Top Category', value: null, text: data.top_category, icon: Award, color: 'var(--color-navy)' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={18} style={{ color: s.color }} />
                  </div>
                  <span className="stat-label" style={{ marginTop: 0 }}>{s.label}</span>
                </div>
                {s.value !== null ? (
                  <div className="stat-value">
                    <CountUp value={s.value} style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-heading)' }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{s.text}</div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2" style={{ gap: 24, marginBottom: 32 }}>
            {catData.length > 0 && (
              <motion.div variants={fadeUp} className="card" style={{ padding: 28 }}>
                <h3 className="section-title">Category Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                      {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                  {catData.slice(0, 6).map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                      <span>{c.name} ({c.value})</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {catData.length > 0 && (
              <motion.div variants={fadeUp} className="card" style={{ padding: 28 }}>
                <h3 className="section-title">Screenings by Category</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={catData.slice(0, 8)} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--color-orange)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>

          {/* Recent */}
          {data.recent_screenings?.length > 0 && (
            <motion.div variants={fadeUp} className="card" style={{ padding: 28 }}>
              <h3 className="section-title">Recent Screenings</h3>
              {data.recent_screenings.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < data.recent_screenings.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.candidate_name || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{r.category} · {new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className="pill" style={{ background: r.match_score >= 70 ? '#E8F5E9' : '#FFF3E0', color: r.match_score >= 70 ? 'var(--color-green)' : 'var(--color-amber)', fontWeight: 600 }}>
                    {r.match_score}%
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
