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

// Layouts
import AuthLayout from './layouts/AuthLayout';

// Pages — eagerly loaded (auth screens must be instant)
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';

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
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/equipment-rental" element={<EquipmentRental />} />
                  <Route path="/yield" element={<YieldPrediction />} />
                  <Route path="/irrigation" element={<IrrigationIntelligence />} />
                  <Route path="/soil" element={<SoilAdvisor />} />
                  <Route path="/crop-health" element={<CropHealthMonitoring />} />
                  <Route path="/climate" element={<ClimateRisk />} />
                  <Route path="/simulator" element={<ClimateSimulator />} />
                  <Route path="/crop-switching" element={<CropSwitchingAdvisor />} />
                  <Route path="/sustainability" element={<SustainabilityScore />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/subsidies" element={<GovernmentSubsidies />} />
                  <Route path="/market" element={<MarketAnalysis />} />
                  <Route path="/investors" element={<InvestorsHub />} />
                  <Route path="/soil-advisor" element={<SoilAdvisor />} />
                  <Route path="/book-consultation" element={<BookConsultation />} />
                  <Route path="/land-intelligence" element={<LandIntelligence />} />
                  <Route path="/agronomist" element={<AgronomistDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>

                {/* Redirects */}
                <Route path="/" element={<HomeRedirect />} />
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
            position="bottom-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
