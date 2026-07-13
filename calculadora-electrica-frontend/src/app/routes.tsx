import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Providers from './providers';
import Layout from '@shared/components/Layout';
import ProtectedRoute from '@shared/components/ProtectedRoute';
import LoginPage from '@features/auth/LoginPage';
import RegisterPage from '@features/auth/RegisterPage';
import DashboardPage from '@features/calc/DashboardPage';
import CalculatorPage from '@features/calc/CalculatorPage';
import ProjectsPage from '@features/projects/ProjectsPage';

export default function AppRoutes() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
