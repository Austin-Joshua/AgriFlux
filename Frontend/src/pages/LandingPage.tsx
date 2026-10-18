import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  ShieldCheck,
  TrendingUp,
  Droplets,
  CloudLightning,
  Microscope,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  Activity,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo-icon.png';
import SEO from '../components/SEO';

const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeModeTab, setActiveModeTab] = useState<'farmer' | 'agronomist'>('farmer');

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'agronomist') return '/agronomist';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-dark-100 transition-colors duration-300 font-sans selection:bg-emerald-500 selection:text-white">
      <SEO
        title="AgriFlux — Autonomous Precision Agriculture & Intelligence Platform"
        description="AgriFlux connects IoT soil sensors, AI crop health diagnostics, closed-loop irrigation, expert agronomy consultations, and equipment rental into one unified precision farming ecosystem."
      />

      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-dark-950/85 border-b border-slate-200/80 dark:border-dark-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative p-0.5 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-green-400 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-9 h-9 rounded-[10px] bg-white dark:bg-dark-900 flex items-center justify-center p-1">
                <img src={logo} alt="AgriFlux Logo" className="h-full w-full object-contain" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight font-display">
                Agri<span className="text-emerald-600 dark:text-emerald-400">Flux</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mt-0.5">
                AI Agriculture Intelligence
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600 dark:text-dark-300">
            <a
              href="#mvp-features"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Platform Features
            </a>
            <a
              href="#dual-workspaces"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Farmer vs. Agronomist
            </a>
            <a
              href="#how-it-works"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#roi-impact"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Impact & ROI
            </a>
          </nav>

          {/* Right Action Elements: Dual Theme Toggle & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dual Mode (Light / Dark) Toggle — Clean Icon-Only */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border border-slate-200/90 dark:border-dark-700 bg-white/90 dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-700 dark:text-dark-200 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all shadow-xs group"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle visual theme"
            >
              {theme === 'dark' ? (
                <Sun
                  size={17}
                  className="text-amber-400 group-hover:rotate-45 transition-transform"
                />
              ) : (
                <Moon
                  size={17}
                  className="text-slate-700 dark:text-slate-200 group-hover:-rotate-12 transition-transform"
                />
              )}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => navigate(getDashboardRoute())}
                className="btn-primary px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5"
              >
                <span>Go to Workspace</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 bg-slate-100/90 hover:bg-slate-200/90 dark:bg-dark-800 dark:hover:bg-dark-700 border border-slate-200 dark:border-dark-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all active:scale-95 shadow-xs"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary px-4 sm:px-5 py-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-white dark:from-emerald-950/30 dark:via-dark-950 dark:to-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/70 border border-emerald-500/20 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold mb-6 shadow-xs animate-fade-in">
            <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Unified Autonomous Agriculture Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight font-display max-w-4xl mx-auto leading-[1.12]">
            Smarter Farming Decisions.{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-green-500 bg-clip-text text-transparent">
              Maximized Harvest Yield.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-dark-300 max-w-3xl mx-auto leading-relaxed">
            AgriFlux bridges satellite field telemetry, in-ground IoT soil monitoring, autonomous
            closed-loop irrigation, and expert agronomic consultations into one streamlined,
            easy-to-use platform for farmers, agronomists, and agricultural enterprises.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              to="/register"
              className="w-full sm:w-auto btn-primary px-7 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>Start Free Now</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white/80 dark:bg-dark-900/80 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-800 dark:text-dark-100 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Demo Accounts</span>
            </Link>
          </div>

          {/* Hero Visual Mockup Card */}
          <div className="mt-12 relative max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 dark:border-dark-800 bg-white dark:bg-dark-900 group">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img
                src="/hero-preview.jpg"
                alt="AgriFlux Precision Agriculture Dashboard & Field Telemetry"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4 sm:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                  <div className="backdrop-blur-md bg-white/20 dark:bg-dark-900/60 border border-white/20 dark:border-white/10 rounded-xl p-3 text-left text-white">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>SATELLITE NDVI</span>
                    </div>
                    <span className="text-xl font-black mt-0.5 block">0.84 Vigor</span>
                    <span className="text-[10px] text-slate-200">Optimal Canopy</span>
                  </div>

                  <div className="backdrop-blur-md bg-white/20 dark:bg-dark-900/60 border border-white/20 dark:border-white/10 rounded-xl p-3 text-left text-white">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-300">
                      <Droplets size={12} />
                      <span>IRRIGATION</span>
                    </div>
                    <span className="text-xl font-black mt-0.5 block">38.2% Saved</span>
                    <span className="text-[10px] text-slate-200">Closed-Loop Auto</span>
                  </div>

                  <div className="backdrop-blur-md bg-white/20 dark:bg-dark-900/60 border border-white/20 dark:border-white/10 rounded-xl p-3 text-left text-white">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                      <Activity size={12} />
                      <span>DIAGNOSTICS</span>
                    </div>
                    <span className="text-xl font-black mt-0.5 block">99.4% Acc.</span>
                    <span className="text-[10px] text-slate-200">AI Plant Pathology</span>
                  </div>

                  <div className="backdrop-blur-md bg-white/20 dark:bg-dark-900/60 border border-white/20 dark:border-white/10 rounded-xl p-3 text-left text-white">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-300">
                      <ShieldCheck size={12} />
                      <span>DATA AUDIT</span>
                    </div>
                    <span className="text-xl font-black mt-0.5 block">Tamper-Proof</span>
                    <span className="text-[10px] text-slate-200">Verified Activity Log</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core MVP Features & Real-World Usage ─────────────────────────── */}
      <section
        id="mvp-features"
        className="py-20 bg-white dark:bg-dark-900 border-y border-slate-200/80 dark:border-dark-800/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Core Platform Value & MVP
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2 font-display">
              Designed for Real-World Agricultural Impact
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-dark-300 mt-3 leading-relaxed">
              AgriFlux solves the core challenges faced by modern farms: unpredictable weather,
              water scarcity, fertilizer waste, and limited access to agronomic specialists.
            </p>
          </div>

          {/* Feature Showcase Grid with Imagery */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feature 1: Soil Intelligence & Auto Irrigation */}
            <div className="rounded-3xl border border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-950/60 overflow-hidden hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="h-52 w-full overflow-hidden relative">
                <img
                  src="/soil-feature.jpg"
                  alt="In-ground Soil Moisture and NPK Sensor with Micro Drip Irrigation"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-sm">
                  IoT Sensor Integration
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Soil Intelligence & Closed-Loop Irrigation
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2.5 leading-relaxed">
                    Deploy field sensors to track NPK ratios, root moisture, and soil pH
                    continuously. When moisture falls below critical thresholds, automated drip
                    valves trigger automatically and shut off when optimal.
                  </p>
                  <div className="mt-4 space-y-1.5 text-xs text-slate-700 dark:text-dark-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Cuts water and electricity consumption by ~38%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Prevents root rotting and fertilizer leaching</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-dark-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>Usage: Live Sensor Telemetry</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>

            {/* Feature 2: 1-on-1 Agronomist Scientific Consultations */}
            <div className="rounded-3xl border border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-950/60 overflow-hidden hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="h-52 w-full overflow-hidden relative">
                <img
                  src="/agronomist-feature.jpg"
                  alt="Agronomist Scientist inspecting crop health diagnostics on digital tablet"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-sm">
                  1-on-1 Scientific Advisory
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Direct Agronomist Consultations & Prescriptions
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2.5 leading-relaxed">
                    Farmers can connect directly with accredited agricultural specialists for
                    customized soil treatments, crop rotation strategies, and organic disease
                    remedies with direct synchronization between farmer and specialist.
                  </p>
                  <div className="mt-4 space-y-1.5 text-xs text-slate-700 dark:text-dark-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-blue-500" />
                      <span>Synchronized prescription and treatment logs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-blue-500" />
                      <span>Fast turnaround time for critical blight diagnosis</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-dark-800 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                  <span>Usage: Integrated Video & Queue</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>

            {/* Feature 3: Smart Machinery Rental & Input Marketplace */}
            <div className="rounded-3xl border border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-950/60 overflow-hidden hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="h-52 w-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-dark-850 dark:to-dark-900 relative p-6 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 items-center w-full">
                  <div className="bg-white/80 dark:bg-dark-800/80 p-3 rounded-2xl shadow-sm text-center">
                    <img
                      src="/equipments/drone.png"
                      alt="Agricultural Spray Drone"
                      className="h-20 w-auto mx-auto object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-dark-200 block mt-1">
                      Spray Drone
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-dark-800/80 p-3 rounded-2xl shadow-sm text-center">
                    <img
                      src="/equipments/johndeere-tractor.png"
                      alt="Modern Farm Tractor"
                      className="h-20 w-auto mx-auto object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-dark-200 block mt-1">
                      John Deere 5050D
                    </span>
                  </div>
                </div>
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-teal-600 text-white text-[11px] font-bold shadow-sm">
                  Agri-Market & Fleet
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Machinery Rental & Quality Input Marketplace
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2.5 leading-relaxed">
                    Access high-tech spray drones, multi-row seeders, and tractors by the day
                    without hefty capital investments. Purchase certified organic fertilizers and
                    bio-stimulants directly from verified sellers.
                  </p>
                  <div className="mt-4 space-y-1.5 text-xs text-slate-700 dark:text-dark-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-teal-500" />
                      <span>Saves up to 60% on machinery capital expenditures</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-teal-500" />
                      <span>Verified quality and transparent per-acre rates</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-dark-800 text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center justify-between">
                  <span>Usage: Hourly & Daily Booking</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Specialized Roles: Farmer vs. Agronomist Workspaces ─────────── */}
      <section id="dual-workspaces" className="py-20 bg-slate-50 dark:bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Dedicated Workspaces
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2 font-display">
              Two Specialized Operating Modes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2">
              Farmers and Agronomists each have tailored tools designed specifically for their daily
              tasks.
            </p>

            {/* Mode Tab Switcher */}
            <div className="inline-flex gap-2 p-1.5 rounded-2xl bg-slate-200/90 dark:bg-dark-850 mt-6 border border-slate-300/80 dark:border-dark-700">
              <button
                onClick={() => setActiveModeTab('farmer')}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  activeModeTab === 'farmer'
                    ? 'bg-white dark:bg-dark-750 text-emerald-700 dark:text-emerald-300 shadow-md'
                    : 'text-slate-600 dark:text-dark-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🌾</span>
                <span>Farmer Workspace</span>
              </button>
              <button
                onClick={() => setActiveModeTab('agronomist')}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  activeModeTab === 'agronomist'
                    ? 'bg-white dark:bg-dark-750 text-blue-700 dark:text-blue-300 shadow-md'
                    : 'text-slate-600 dark:text-dark-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🔬</span>
                <span>Agronomist Portal</span>
              </button>
            </div>
          </div>

          {/* Farmer Features Showcase */}
          {activeModeTab === 'farmer' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-emerald-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Activity size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Crop Health Monitoring
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  Real-time Sentinel-2 canopy vigor scans, automated pest infestation detection, and
                  foliar disease alerts to protect yields.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Farmer Workspace Feature
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-emerald-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                  <Droplets size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Soil Intelligence
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  Deep sensor analysis for NPK ratios, soil acidity (pH), root-zone moisture
                  depletion, and organic carbon benchmarks.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-teal-600 dark:text-teal-400">
                  Farmer Workspace Feature
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-emerald-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <Sprout size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Crop Resilience Advisor
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  Predictive climate stress mitigation, biological biostimulant schedules, and
                  drought-resistant seed switching recommendations.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-amber-600 dark:text-amber-400">
                  Farmer Workspace Feature
                </div>
              </div>
            </div>
          )}

          {/* Agronomist Features Showcase */}
          {activeModeTab === 'agronomist' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-blue-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <TrendingUp size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Yield Forecasting
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  Machine learning model estimating quintals/acre harvest outcomes based on rainfall
                  patterns and soil profiles.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-blue-600 dark:text-blue-400">
                  Agronomist Portal Feature
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-blue-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                  <CloudLightning size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Climate Risk Analysis
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  Forecasts extreme meteorological anomalies including flash heatwaves, unseasonal
                  hail, and flood runoff.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-red-600 dark:text-red-400">
                  Agronomist Portal Feature
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-blue-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                  <Microscope size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Climate Simulator
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  Interactive what-if scenario sandbox adjusting temperature, rainfall deficits, and
                  humidity to stress-test crop viability.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-purple-600 dark:text-purple-400">
                  Agronomist Portal Feature
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-blue-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Award size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sustainability Index
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  Quantifies farm biodiversity, carbon sequestration footprint, and chemical
                  leaching risk with standardized ESG metrics.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Agronomist Portal Feature
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Enterprise Data Protection (Feature) ─────────────────────────── */}
      <section
        id="how-it-works"
        className="py-20 bg-white dark:bg-dark-900 border-t border-slate-200/80 dark:border-dark-800/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 dark:from-dark-850 dark:via-dark-900 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20 mb-4">
                  <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Platform Feature</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
                  Enterprise-Grade Farm Data Security & Verified Audit
                </h2>
                <p className="text-sm text-slate-600 dark:text-dark-300 mt-3 leading-relaxed">
                  Every reading from in-field IoT sensors, prescription from agronomists, and
                  irrigation activation is verified and sealed in a tamper-proof activity ledger.
                  This guarantees accurate, undeniable documentation for crop insurance claims,
                  organic certifications, and farm credit evaluations.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    'Tamper-Proof Audit Trail: Farm activity and sensor logs cannot be retroactively altered or forged.',
                    'Verified Identity Access: High-security authentication via Email, Phone, or Google Sign-In with instant OTP.',
                    'Hardware Command Safeguard: Ensures automated irrigation valves only execute authorized instructions.',
                    'Bankable Farm Data: Export verified health and yield records for loans, insurance, and buyers.',
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-dark-200"
                    >
                      <CheckCircle2
                        size={16}
                        className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5"
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <Link
                    to="/register"
                    className="btn-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm"
                  >
                    Start Free Verification
                  </Link>
                  <Link
                    to="/login"
                    className="text-xs font-bold text-slate-700 dark:text-dark-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Explore in Admin Console →
                  </Link>
                </div>
              </div>

              {/* Verified Activity Preview Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-800 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-dark-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Farm Activity Ledger
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    Active & Protected
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-dark-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Soil Moisture Telemetry
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-dark-400">
                        Zone A · Moisture: 38.4% · pH: 6.8
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Verified
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-dark-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Agronomist Advisory Prescribed
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-dark-400">
                        Dr. Sharma · Organic Bio-Stimulant Protocol
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      Verified
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-dark-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Automated Micro-Drip Cycle
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-dark-400">
                        Valves 1 & 2 · 450 Liters Delivered
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact & ROI Metrics ─────────────────────────────────────────── */}
      <section id="roi-impact" className="py-16 bg-slate-50 dark:bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Measurable Results
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-display">
            Built for Tangible Returns
          </h2>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm text-left">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 block font-display">
                99.4%
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-dark-100 mt-1 block">
                Diagnosis Accuracy
              </span>
              <span className="text-[11px] text-slate-500 dark:text-dark-400 mt-0.5 block">
                Satellite & image benchmark models
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm text-left">
              <span className="text-3xl font-black text-teal-600 dark:text-teal-400 block font-display">
                38.2%
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-dark-100 mt-1 block">
                Water Resource Saved
              </span>
              <span className="text-[11px] text-slate-500 dark:text-dark-400 mt-0.5 block">
                Closed-loop soil deficit irrigation
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm text-left">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400 block font-display">
                4.2x
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-dark-100 mt-1 block">
                Faster Advisory Loop
              </span>
              <span className="text-[11px] text-slate-500 dark:text-dark-400 mt-0.5 block">
                Direct farmer-to-agronomist queue
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm text-left">
              <span className="text-3xl font-black text-purple-600 dark:text-purple-400 block font-display">
                60%
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-dark-100 mt-1 block">
                Lower Equipment Cost
              </span>
              <span className="text-[11px] text-slate-500 dark:text-dark-400 mt-0.5 block">
                Pay-as-you-go farm machinery fleet
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Demo Account Quick Access ────────────────────────────────────── */}
      <section className="py-12 bg-white dark:bg-dark-900 border-t border-slate-200/80 dark:border-dark-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-emerald-600 dark:bg-emerald-700 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-100">
                Instant Interactive Demo
              </span>
              <h3 className="text-2xl font-black mt-1 font-display">
                Experience AgriFlux Right Now
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1.5 max-w-xl">
                Try out the platform as a Farmer, Agronomist, or Administrator with preloaded
                telemetry and live features.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
              >
                Sign In to Demo Accounts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/80 dark:border-dark-800/80 bg-slate-50 dark:bg-dark-950 py-12 text-xs text-slate-500 dark:text-dark-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="AgriFlux" className="w-6 h-6 object-contain" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                AgriFlux Intelligence Platform
              </span>
              <span>·</span>
              <span>Autonomous Precision Farming</span>
            </div>

            <div className="flex items-center gap-6">
              <Link
                to="/login"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold"
              >
                Register
              </Link>
              <a
                href="#mvp-features"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold"
              >
                Features
              </a>
              <button
                onClick={toggleTheme}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold flex items-center gap-1"
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-dark-850 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-dark-500">
            <p>© {new Date().getFullYear()} AgriFlux. All rights reserved.</p>
            <p>Empowering sustainable, high-yield agriculture through intelligent technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
