import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';
import DemoMode from './components/DemoMode';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import AuthLayout from './layouts/AuthLayout';

// Pages — eagerly loaded (auth screens must be instant)
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';

// Pages — lazy loaded (code-splitting for performance)
const Dashboard           = lazy(() => import('./pages/Dashboard'));
const YieldPrediction     = lazy(() => import('./pages/YieldPrediction'));
const IrrigationIntelligence = lazy(() => import('./pages/IrrigationIntelligence'));
const SoilAdvisor         = lazy(() => import('./pages/SoilAdvisor'));
const CropHealthMonitoring = lazy(() => import('./pages/CropHealthMonitoring'));
const ClimateRisk         = lazy(() => import('./pages/ClimateRisk'));
const ClimateSimulator    = lazy(() => import('./pages/ClimateSimulator'));
const CropSwitchingAdvisor = lazy(() => import('./pages/CropSwitchingAdvisor'));
const SustainabilityScore = lazy(() => import('./pages/SustainabilityScore'));
const Settings            = lazy(() => import('./pages/Settings'));
const About               = lazy(() => import('./pages/About'));
const GovernmentSubsidies = lazy(() => import('./pages/GovernmentSubsidies'));
const MarketAnalysis      = lazy(() => import('./pages/MarketAnalysis'));
const InvestorsHub        = lazy(() => import('./pages/InvestorsHub'));
const LandIntelligence    = lazy(() => import('./pages/LandIntelligence'));
const AgronomistDashboard = lazy(() => import('./pages/AgronomistDashboard'));
const AdminDashboard      = lazy(() => import('./pages/AdminDashboard'));
const BookConsultation    = lazy(() => import('./pages/BookConsultation'));
const Marketplace         = lazy(() => import('./pages/Marketplace'));
const EquipmentRental     = lazy(() => import('./pages/EquipmentRental'));
const NotFoundPage        = lazy(() => import('./pages/NotFoundPage'));

// Helper: Wrap protected lazy routes
const P = ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute>
        <Layout>
            <Suspense fallback={<PageLoader />}>
                {children}
            </Suspense>
        </Layout>
    </ProtectedRoute>
);

const App: React.FC = () => {
    return (
        <HelmetProvider>
            <ThemeProvider>
                <AuthProvider>
                        <ErrorBoundary>
                            <BrowserRouter>
                            {/* Demo Mode controller — mounted inside BrowserRouter for navigate access */}
                            <DemoMode />
                            <Routes>
                                {/* Authentication */}
                                <Route element={<AuthLayout />}>
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                </Route>
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                                {/* Protected lazy routes */}
                                <Route path="/dashboard"        element={<P><Dashboard /></P>} />
                                <Route path="/marketplace"      element={<P><Marketplace /></P>} />
                                <Route path="/equipment-rental" element={<P><EquipmentRental /></P>} />
                                <Route path="/yield"            element={<P><YieldPrediction /></P>} />
                                <Route path="/irrigation"       element={<P><IrrigationIntelligence /></P>} />
                                <Route path="/soil"             element={<P><SoilAdvisor /></P>} />
                                <Route path="/crop-health"      element={<P><CropHealthMonitoring /></P>} />
                                <Route path="/climate"          element={<P><ClimateRisk /></P>} />
                                <Route path="/simulator"        element={<P><ClimateSimulator /></P>} />
                                <Route path="/crop-switching"   element={<P><CropSwitchingAdvisor /></P>} />
                                <Route path="/sustainability"   element={<P><SustainabilityScore /></P>} />
                                <Route path="/settings"         element={<P><Settings /></P>} />
                                <Route path="/about"            element={<P><About /></P>} />
                                <Route path="/subsidies"        element={<P><GovernmentSubsidies /></P>} />
                                <Route path="/market"           element={<P><MarketAnalysis /></P>} />
                                <Route path="/investors"        element={<P><InvestorsHub /></P>} />
                                <Route path="/soil-advisor"     element={<P><SoilAdvisor /></P>} />
                                <Route path="/book-consultation"element={<P><BookConsultation /></P>} />
                                <Route path="/land-intelligence"element={<P><LandIntelligence /></P>} />
                                <Route path="/agronomist"       element={<P><AgronomistDashboard /></P>} />
                                <Route path="/admin"            element={<P><AdminDashboard /></P>} />

                                {/* Redirects */}
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/404" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
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
