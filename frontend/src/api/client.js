import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Screening ──
export const screenResume = (formData) => api.post('/api/screen', formData);
export const screenText = (data) => api.post('/api/screen/text', data);
export const screenEnhanced = (data) => api.post('/api/screen-enhanced', data);
export const bulkScreen = (formData) => api.post('/api/bulk-screen', formData);
export const getCategories = () => api.get('/api/categories');

// ── Claude AI ──
export const analyzeJDClaude = (data) => api.post('/api/analyze-jd-claude', data);
export const analyzeJD = (data) => api.post('/api/job-description/analyze', data);
export const generateHighlights = (data) => api.post('/api/generate-highlights', data);
export const generateCoverLetter = (data) => api.post('/api/generate-cover-letter', data);
export const generateSuggestions = (data) => api.post('/api/generate-suggestions', data);
export const shortenJD = (data) => api.post('/api/shorten-jd', data);

// ── Auth ──
export const registerUser = (data) => api.post('/api/auth/register', data);
export const loginUser = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');

// ── History & Analytics ──
export const getHistory = () => api.get('/api/history');
export const getHistoryDetail = (id) => api.get(`/api/history/${id}`);
export const deleteHistory = (id) => api.delete(`/api/history/${id}`);
export const compareResumes = (ids) => api.post('/api/compare', { screening_ids: ids });
export const getDashboard = () => api.get('/api/analytics/dashboard');
export const getDatasetInfo = () => api.get('/api/dataset-info');

// ── Career DNA ──
export const analyzeCareerDNA = (data) => api.post('/api/career-dna', data);

export default api;
