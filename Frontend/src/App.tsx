import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import YieldPrediction from './pages/YieldPrediction';
import IrrigationIntelligence from './pages/IrrigationIntelligence';
import SoilHealthAdvisor from './pages/SoilHealthAdvisor';
import CropHealthMonitoring from './pages/CropHealthMonitoring';
import ClimateRisk from './pages/ClimateRisk';
import ClimateSimulator from './pages/ClimateSimulator';
import CropSwitchingAdvisor from './pages/CropSwitchingAdvisor';
import SustainabilityScore from './pages/SustainabilityScore';
import Settings from './pages/Settings';
import About from './pages/About';
import GovernmentSubsidies from './pages/GovernmentSubsidies';
import MarketAnalysis from './pages/MarketAnalysis';
import InvestorsHub from './pages/InvestorsHub';
import SoilPlantAdvisor from './pages/SoilPlantAdvisor';
import LandIntelligence from './pages/LandIntelligence';
import AgronomistDashboard from './pages/AgronomistDashboard';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER">
                    <BrowserRouter>
                        <Routes>
                            {/* Authentication Layer with Sliding Transitions */}
                            <Route element={<AuthLayout />}>
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                            </Route>
                            <Route path="/forgot-password" element={<ForgotPassword />} />

                            {/* Protected Routes inside Layout */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Layout><Dashboard /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/yield"
                                element={
                                    <ProtectedRoute>
                                        <Layout><YieldPrediction /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/irrigation"
                                element={
                                    <ProtectedRoute>
                                        <Layout><IrrigationIntelligence /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/soil"
                                element={
                                    <ProtectedRoute>
                                        <Layout><SoilHealthAdvisor /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/crop-health"
                                element={
                                    <ProtectedRoute>
                                        <Layout><CropHealthMonitoring /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/climate"
                                element={
                                    <ProtectedRoute>
                                        <Layout><ClimateRisk /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/simulator"
                                element={
                                    <ProtectedRoute>
                                        <Layout><ClimateSimulator /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/crop-switching"
                                element={
                                    <ProtectedRoute>
                                        <Layout><CropSwitchingAdvisor /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/sustainability"
                                element={
                                    <ProtectedRoute>
                                        <Layout><SustainabilityScore /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <ProtectedRoute>
                                        <Layout><Settings /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/about"
                                element={
                                    <ProtectedRoute>
                                        <Layout><About /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/subsidies"
                                element={
                                    <ProtectedRoute>
                                        <Layout><GovernmentSubsidies /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/market"
                                element={
                                    <ProtectedRoute>
                                        <Layout><MarketAnalysis /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/investors"
                                element={
                                    <ProtectedRoute>
                                        <Layout><InvestorsHub /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/soil-advisor"
                                element={
                                    <ProtectedRoute>
                                        <Layout><SoilPlantAdvisor /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/land-intelligence"
                                element={
                                    <ProtectedRoute>
                                        <Layout><LandIntelligence /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/agronomist"
                                element={
                                    <ProtectedRoute>
                                        <Layout><AgronomistDashboard /></Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute>
                                        <Layout><AdminDashboard /></Layout>
                                    </ProtectedRoute>
                                }
                            />

                            {/* Redirects */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </BrowserRouter>
                </GoogleOAuthProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
