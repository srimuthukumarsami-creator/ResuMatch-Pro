import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Files, Microscope, GitCompareArrows, BookOpen, LayoutDashboard, Clock, Settings, LogOut, Menu, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/screen', label: 'Screen', icon: FileSearch },
  { to: '/bulk', label: 'Bulk Screen', icon: Files },
  { to: '/jd-analyzer', label: 'JD Analyzer', icon: Microscope },
  { to: '/compare', label: 'Compare', icon: GitCompareArrows },
  { to: '/how-it-works', label: 'How It Works', icon: BookOpen },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserMenu(false); }, [location]);

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(245,240,232,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSearch size={18} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: 'var(--color-navy)' }}>
              Resu<span style={{ color: 'var(--color-orange)' }}>Match</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-orange)', marginLeft: 3 }}>Pro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 2 }}>
            {NAV_LINKS.map(link => {
              const Icon = link.icon;
              const active = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                  <div className="btn-ghost" style={{
                    display: 'flex', alignItems: 'center', gap: 6, position: 'relative',
                    color: active ? 'var(--color-orange)' : 'var(--color-text-secondary)',
                    fontSize: 14, fontWeight: active ? 600 : 500, borderRadius: 10, padding: '8px 14px',
                  }}>
                    <Icon size={16} />
                    <span>{link.label}</span>
                    {active && <motion.div layoutId="nav-underline" style={{ position: 'absolute', bottom: 0, left: 12, right: 12, height: 2, background: 'var(--color-orange)', borderRadius: 1 }} />}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
            {user ? (
              <>
                <Link to="/dashboard" className="btn-ghost" style={{ padding: '8px 10px', borderRadius: 10, textDecoration: 'none' }}>
                  <LayoutDashboard size={18} />
                </Link>
                <Link to="/history" className="btn-ghost" style={{ padding: '8px 10px', borderRadius: 10, textDecoration: 'none' }}>
                  <Clock size={18} />
                </Link>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setUserMenu(!userMenu)} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={14} color="white" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{user.name?.split(' ')[0]}</span>
                  </button>
                  <AnimatePresence>
                    {userMenu && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="card" style={{ position: 'absolute', right: 0, top: 48, padding: '8px 0', width: 190, zIndex: 100 }}>
                        <Link to="/settings" className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '10px 16px', textDecoration: 'none' }}>
                          <Settings size={15} /> Settings
                        </Link>
                        <button onClick={() => { logout(); setUserMenu(false); }} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '10px 16px', color: 'var(--color-red)' }}>
                          <LogOut size={15} /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link to="/login" className="btn-ghost" style={{ fontSize: 14, textDecoration: 'none' }}>Log In</Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '9px 22px', fontSize: 14, textDecoration: 'none' }}>Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button className="md:hidden btn-ghost" onClick={() => setMobileOpen(!mobileOpen)} style={{ padding: 8 }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      {/* FIX 4: Mobile Slide-in Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(26,26,46,0.4)', backdropFilter: 'blur(4px)' }}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed top-0 right-0 bottom-0 z-50 md:hidden"
              style={{ width: 280, background: 'var(--color-surface)', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}
            >
              {/* Drawer Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Hello, {user.name?.split(' ')[0] || 'User'}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{user.email}</div>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16 }}>
                    Resu<span style={{ color: 'var(--color-orange)' }}>Match</span> Pro
                  </span>
                )}
                <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={20} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>

              {/* Nav Links */}
              <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                {NAV_LINKS.map(link => {
                  const Icon = link.icon;
                  const active = location.pathname === link.to;
                  return (
                    <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, textDecoration: 'none',
                      background: active ? 'rgba(232,93,38,0.08)' : 'transparent',
                      color: active ? 'var(--color-orange)' : 'var(--color-text-secondary)',
                      fontWeight: active ? 600 : 500, fontSize: 14,
                    }}>
                      <Icon size={18} /> {link.label}
                    </Link>
                  );
                })}

                <div style={{ height: 1, background: 'var(--color-border-light)', margin: '8px 0' }} />

                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, textDecoration: 'none', color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 500 }}>
                      <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    <Link to="/history" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, textDecoration: 'none', color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 500 }}>
                      <Clock size={18} /> History
                    </Link>
                    <Link to="/settings" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, textDecoration: 'none', color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 500 }}>
                      <Settings size={18} /> Settings
                    </Link>
                    <div style={{ height: 1, background: 'var(--color-border-light)', margin: '8px 0' }} />
                    <button onClick={() => { logout(); setMobileOpen(false); }} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', width: '100%',
                    }}>
                      <LogOut size={18} /> Logout
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-outline" style={{ justifyContent: 'center', textDecoration: 'none' }}>Log In</Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary" style={{ justifyContent: 'center', textDecoration: 'none' }}>Get Started</Link>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border-light)', textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>ResuMatch Pro v1.0</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
