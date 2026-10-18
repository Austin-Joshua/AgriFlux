import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

// Layouts
import AuthLayout from './layouts/AuthLayout';

// Pages — eagerly loaded (auth screens must be instant)
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import LandingPage from './pages/LandingPage';

// Pages — lazy loaded (code-splitting for performance)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const YieldPrediction = lazy(() => import('./pages/YieldPrediction'));
const IrrigationIntelligence = lazy(() => import('./pages/IrrigationIntelligence'));
const SoilAdvisor = lazy(() => import('./pages/SoilAdvisor'));
const CropHealthMonitoring = lazy(() => import('./pages/CropHealthMonitoring'));
const ClimateRisk = lazy(() => import('./pages/ClimateRisk'));
const ClimateSimulator = lazy(() => import('./pages/ClimateSimulator'));
const CropSwitchingAdvisor = lazy(() => import('./pages/CropSwitchingAdvisor'));
const SustainabilityScore = lazy(() => import('./pages/SustainabilityScore'));
const Settings = lazy(() => import('./pages/Settings'));
const About = lazy(() => import('./pages/About'));
const GovernmentSubsidies = lazy(() => import('./pages/GovernmentSubsidies'));
const MarketAnalysis = lazy(() => import('./pages/MarketAnalysis'));
const InvestorsHub = lazy(() => import('./pages/InvestorsHub'));
const LandIntelligence = lazy(() => import('./pages/LandIntelligence'));
const AgronomistDashboard = lazy(() => import('./pages/AgronomistDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const BookConsultation = lazy(() => import('./pages/BookConsultation'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const EquipmentRental = lazy(() => import('./pages/EquipmentRental'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Helper: Wrap protected lazy routes
const P = () => (
  <ProtectedRoute>
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </Layout>
  </ProtectedRoute>
);

// Helper: Root home route redirect based on user role
const HomeRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === 'agronomist') {
    return <Navigate to="/agronomist" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Authentication */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />

                {/* Protected lazy routes */}
                <Route element={<P />}>
                  {/* Common Shared Routes */}
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />

                  {/* Distinct Farmer Features */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/crop-health"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <CropHealthMonitoring />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/crop-health-monitoring"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <CropHealthMonitoring />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/soil"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <SoilAdvisor />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/soil-advisor"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <SoilAdvisor />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/soil-intelligence"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <SoilAdvisor />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/crop-switching"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <CropSwitchingAdvisor />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/crop-resilience"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <CropSwitchingAdvisor />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/irrigation"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <IrrigationIntelligence />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/irrigation-intelligence"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <IrrigationIntelligence />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/land-intelligence"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <LandIntelligence />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/marketplace"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <Marketplace />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/equipment-rental"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <EquipmentRental />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/subsidies"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <GovernmentSubsidies />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/government-subsidies"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <GovernmentSubsidies />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/market"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <MarketAnalysis />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/market-analysis"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <MarketAnalysis />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/investors"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <InvestorsHub />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/investors-hub"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <InvestorsHub />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/book-consultation"
                    element={
                      <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                        <BookConsultation />
                      </ProtectedRoute>
                    }
                  />

                  {/* Distinct Agronomist Features */}
                  <Route
                    path="/agronomist"
                    element={
                      <ProtectedRoute allowedRoles={['agronomist', 'admin']}>
                        <AgronomistDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/yield"
                    element={
                      <ProtectedRoute allowedRoles={['agronomist', 'admin']}>
                        <YieldPrediction />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/yield-prediction"
                    element={
                      <ProtectedRoute allowedRoles={['agronomist', 'admin']}>
                        <YieldPrediction />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/climate"
                    element={
                      <ProtectedRoute allowedRoles={['agronomist', 'admin']}>
                        <ClimateRisk />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/climate-risk"
                    element={
                      <ProtectedRoute allowedRoles={['agronomist', 'admin']}>
                        <ClimateRisk />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/simulator"
                    element={
                      <ProtectedRoute allowedRoles={['agronomist', 'admin']}>
                        <ClimateSimulator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/climate-simulator"
                    element={
                      <ProtectedRoute allowedRoles={['agronomist', 'admin']}>
                        <ClimateSimulator />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sustainability"
                    element={
                      <ProtectedRoute allowedRoles={['agronomist', 'admin']}>
                        <SustainabilityScore />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sustainability-score"
                    element={
                      <ProtectedRoute allowedRoles={['agronomist', 'admin']}>
                        <SustainabilityScore />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sustainability-index"
                    element={
                      <ProtectedRoute allowedRoles={['agronomist', 'admin']}>
                        <SustainabilityScore />
                      </ProtectedRoute>
                    }
                  />

                  {/* Distinct Admin Features */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Base Landing Page & Redirects */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={<LandingPage />} />
                <Route path="/app" element={<HomeRedirect />} />
                <Route
                  path="/404"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <NotFoundPage />
                    </Suspense>
                  }
                />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
          <ToastContainer
            position="top-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            limit={3}
          />
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
