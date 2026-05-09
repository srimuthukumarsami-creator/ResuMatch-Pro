import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import ScreenerPage from './pages/ScreenerPage';
import BulkScreenPage from './pages/BulkScreenPage';
import JDAnalyzerPage from './pages/JDAnalyzerPage';
import HowItWorksPage from './pages/HowItWorksPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import ComparePage from './pages/ComparePage';
import CareerDNAPage from './pages/CareerDNAPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/screen" element={<ScreenerPage />} />
            <Route path="/bulk" element={<BulkScreenPage />} />
            <Route path="/jd-analyzer" element={<JDAnalyzerPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/career-dna" element={<CareerDNAPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
