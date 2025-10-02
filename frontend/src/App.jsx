import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CountrySelector from './components/public/CountrySelector';
import Login from './components/Login';
import Dashboard from './components/admin/Dashboard';
import DataManager from './components/admin/DataManager';
import Settings from './components/admin/Settings';
import ScrapingLogs from './components/admin/ScrapingLogs';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsAuthenticated(!!token);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route
          path="/"
          element={
            <Layout isAdmin={false}>
              <CountrySelector />
            </Layout>
          }
        />

        {/* Admin Login */}
        <Route
          path="/admin"
          element={
            isAuthenticated ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            isAuthenticated ? (
              <Layout isAdmin={true}>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
        <Route
          path="/admin/data"
          element={
            isAuthenticated ? (
              <Layout isAdmin={true}>
                <DataManager />
              </Layout>
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
        <Route
          path="/admin/logs"
          element={
            isAuthenticated ? (
              <Layout isAdmin={true}>
                <ScrapingLogs />
              </Layout>
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
        <Route
          path="/admin/settings"
          element={
            isAuthenticated ? (
              <Layout isAdmin={true}>
                <Settings />
              </Layout>
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;