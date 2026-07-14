import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Providers from './providers';
import Layout from '@shared/components/Layout';
import ProtectedRoute from '@shared/components/ProtectedRoute';
import LoginPage from '@features/auth/LoginPage';
import RegisterPage from '@features/auth/RegisterPage';
import DashboardPage from '@features/calc/DashboardPage';

const CalculatorPage = lazy(() => import('@features/calc/CalculatorPage'));
const ProjectsPage = lazy(() => import('@features/projects/ProjectsPage'));
const PlansPage = lazy(() => import('@features/plans/PlansPage'));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        role="status"
        aria-label="Cargando"
      />
    </div>
  );
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

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
            <Route
              path="/calculator"
              element={
                <LazyPage>
                  <CalculatorPage />
                </LazyPage>
              }
            />
            <Route
              path="/projects"
              element={
                <LazyPage>
                  <ProjectsPage />
                </LazyPage>
              }
            />
            <Route
              path="/plans"
              element={
                <LazyPage>
                  <PlansPage />
                </LazyPage>
              }
            />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
