import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Public API
export const getCountries = () => api.get('/countries');
export const getVisaRequirements = (passport, residence, destination) =>
  api.get('/visa-requirements', { params: { passport, residence, destination } });
export const getScrapingStatus = (requestId) =>
  api.get(`/scraping-status/${requestId}`);

// Auth API
export const login = (username, password) =>
  api.post('/admin/login', { username, password });
export const logout = () => api.post('/admin/logout');

// Admin API
export const getDashboard = () => api.get('/admin/dashboard');
export const getAllCountries = () => api.get('/admin/countries');
export const createCountry = (name, code) => api.post('/admin/countries', { name, code });
export const deleteCountry = (id) => api.delete(`/admin/countries/${id}`);

export const getAllVisaRequirements = (queryString = '') =>
  api.get(`/admin/visa-requirements${queryString ? '?' + queryString : ''}`);
export const deleteVisaRequirement = (id) => api.delete(`/admin/visa-requirements/${id}`);

export const scrapeRequirement = (id, force = false) =>
  api.post(`/admin/scrape/${id}${force ? '?force=true' : ''}`);
export const scrapeAll = () => api.post('/admin/scrape-all');

export const getLogs = (limit) => api.get('/admin/logs', { params: { limit } });
export const getSettings = () => api.get('/admin/settings');
export const updateSettings = (settings) => api.put('/admin/settings', settings);

export default api;