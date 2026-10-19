import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  Sparkles,
  Menu,
  X,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo-icon.png';
import SEO from '../components/SEO';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
];

const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeModeTab, setActiveModeTab] = useState<'farmer' | 'agronomist'>('farmer');
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement)?.closest('#landing-mobile-menu-btn')
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Automatically close mobile menu on screen resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setLangOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'agronomist') return '/agronomist';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-dark-100 transition-colors duration-300 font-sans selection:bg-emerald-500 selection:text-white">
      <SEO
        title={t('landing.heroTitle', 'AgriFlux — Autonomous Precision Agriculture & Intelligence Platform')}
        description={t(
          'landing.heroSubtitle',
          'AgriFlux connects IoT soil sensors, AI crop health diagnostics, closed-loop irrigation, expert agronomy consultations, and equipment rental into one unified precision farming ecosystem.'
        )}
      />

      {/* ── Top Navigation Bar (Mobile-First & Native-Optimized) ─────────── */}
      <header
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-dark-950/90 border-b border-slate-200/80 dark:border-dark-800/80 transition-all duration-200"
      >
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Identity: Guaranteed Single-Line & Clean Wrapping */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0 border border-emerald-500/20">
              <img src={logo} alt="AgriFlux Logo" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight font-display whitespace-nowrap">
                Agri<span className="text-emerald-600 dark:text-emerald-400">Flux</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mt-0.5 truncate max-w-[190px]">
                {t('landing.brandTagline', 'AI Agriculture Intelligence')}
              </span>
            </div>
          </Link>

          {/* Center Navigation Links: Hidden on Mobile & Tablet, Visible on Desktop (lg+) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-bold text-slate-600 dark:text-dark-300">
            <a
              href="#mvp-features"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1"
            >
              {t('landing.navFeatures', 'Platform Features')}
            </a>
            <a
              href="#dual-workspaces"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1"
            >
              {t('landing.navWorkspaces', 'Farmer vs. Agronomist')}
            </a>
            <a
              href="#how-it-works"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1"
            >
              {t('landing.navHowItWorks', 'How It Works')}
            </a>
            <a
              href="#roi-impact"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1"
            >
              {t('landing.navRoi', 'Impact & ROI')}
            </a>
          </nav>

          {/* Right Action Elements: Space-Tuned for Touch & Responsiveness */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Language Selector Dropdown */}
            <div ref={langRef} className="relative">
              <button
                id="landing-language-selector"
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl text-slate-700 dark:text-dark-200 border border-slate-200/90 dark:border-dark-700 bg-white/90 dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 transition-all text-xs font-bold shadow-xs active:scale-95"
                aria-label="Language selector"
              >
                <span className="text-sm leading-none">{currentLang.flag}</span>
                <span className="hidden sm:inline uppercase text-[11px] font-bold">{currentLang.code}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-150 ${langOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {langOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[90] bg-black/20 sm:hidden"
                    onClick={() => setLangOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-slide-down">
                    {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        setLangOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/30 ${
                        i18n.language === lang.code
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'text-slate-700 dark:text-dark-200 font-medium'
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            </div>

            {/* Dual Mode (Light / Dark) Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border border-slate-200/90 dark:border-dark-700 bg-white/90 dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-700 dark:text-dark-200 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all shadow-xs group active:scale-95"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle visual theme"
            >
              {theme === 'dark' ? (
                <Sun
                  size={16}
                  className="text-amber-400 group-hover:rotate-45 transition-transform"
                />
              ) : (
                <Moon
                  size={16}
                  className="text-slate-700 dark:text-slate-200 group-hover:-rotate-12 transition-transform"
                />
              )}
            </button>

            {/* Desktop Auth CTAs (shown on tablet & desktop) */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 bg-slate-100/90 hover:bg-slate-200/90 dark:bg-dark-800 dark:hover:bg-dark-700 border border-slate-200 dark:border-dark-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all active:scale-95 shadow-xs whitespace-nowrap"
              >
                {t('auth.login', 'Sign In')}
              </Link>
              <Link
                to="/login"
                className="btn-primary px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-md shadow-emerald-500/25 active:scale-95 transition-all whitespace-nowrap"
              >
                {t('auth.getStarted', 'Get Started')}
              </Link>
              {isAuthenticated && (
                <button
                  onClick={() => navigate(getDashboardRoute())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all whitespace-nowrap active:scale-95"
                  title={t('landing.goToWorkspace', 'Go to Workspace')}
                >
                  <LayoutDashboard size={13} />
                  <span>{t('landing.goToWorkspace', 'Workspace')}</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>

            {/* Mobile "Sign In" & "Get Started" Quick Pills (Compact on mobile for direct tap) */}
            <div className="flex sm:hidden items-center gap-1.5">
              <Link
                to="/login"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 transition-all whitespace-nowrap active:scale-95"
              >
                {t('auth.login', 'Sign In')}
              </Link>
              <Link
                to="/login"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all whitespace-nowrap active:scale-95 shadow-xs"
              >
                {t('auth.getStarted', 'Get Started')}
              </Link>
            </div>

            {/* Mobile Hamburger / Close Button */}
            <button
              id="landing-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border border-slate-200/90 dark:border-dark-700 bg-white/90 dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-700 dark:text-dark-200 transition-all shadow-xs active:scale-95"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X size={18} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Menu size={18} />
              )}
            </button>
          </div>
        </div>

        {/* ── Native-Style Mobile Navigation Drawer / Dropdown Sheet ── */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="lg:hidden border-t border-slate-200/90 dark:border-dark-800/90 bg-white/98 dark:bg-dark-950/98 backdrop-blur-2xl shadow-2xl animate-slide-down px-4 py-5 max-h-[85vh] overflow-y-auto"
          >
            {/* Navigation Links with Icons */}
            <div className="space-y-1 mb-5">
              <a
                href="#mvp-features"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-slate-800 dark:text-dark-100 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <span>{t('landing.navFeatures', 'Platform Features')}</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </a>

              <a
                href="#dual-workspaces"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-slate-800 dark:text-dark-100 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100/80 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Sprout size={16} />
                  </div>
                  <span>{t('landing.navWorkspaces', 'Farmer vs. Agronomist')}</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </a>

              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-slate-800 dark:text-dark-100 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <span>{t('landing.navHowItWorks', 'How It Works & Security')}</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </a>

              <a
                href="#roi-impact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-slate-800 dark:text-dark-100 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/80 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <TrendingUp size={16} />
                  </div>
                  <span>{t('landing.navRoi', 'Impact & ROI')}</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </a>
            </div>

            {/* Mobile Actions & CTAs */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-dark-800/80 space-y-2.5">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full btn-primary py-3 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-98"
              >
                <span>{t('auth.getStarted', 'Get Started')}</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-dark-100 bg-slate-100 dark:bg-dark-850 hover:bg-slate-200 dark:hover:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <LogIn size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t('landing.exploreDemoAccounts', 'Explore Demo Accounts')}</span>
              </Link>

              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-dark-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>{t('auth.createAccount', 'Create New Account')}</span>
                <ChevronRight size={14} />
              </Link>

              {isAuthenticated && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(getDashboardRoute());
                  }}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <LayoutDashboard size={14} />
                  <span>{t('landing.goToWorkspace', 'Resume Active Workspace')}</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            {/* Quick Language Bar inside Mobile Menu */}
            <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-dark-800/80">
              <span className="text-[11px] font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wider block mb-2 px-1">
                Language / மொழி
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                      i18n.language === lang.code
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-dark-850 text-slate-700 dark:text-dark-200 hover:bg-slate-200 dark:hover:bg-dark-800'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="truncate">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section (Fluid & Responsive across All Screens) ──────────── */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-18 lg:pt-18 lg:pb-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/50 via-slate-50 to-white dark:from-emerald-950/30 dark:via-dark-950 dark:to-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/70 border border-emerald-500/20 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-extrabold mb-4 sm:mb-6 shadow-xs animate-fade-in max-w-full">
            <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{t('landing.heroBadge', 'Unified Autonomous Agriculture Platform')}</span>
          </div>

          {/* Headline: Fluid clamp typography */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight font-display max-w-4xl mx-auto leading-[1.15] sm:leading-[1.12]">
            {t('landing.heroTitle1', 'Smarter Farming Decisions.')}{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-green-500 bg-clip-text text-transparent">
              {t('landing.heroTitle2', 'Maximized Harvest Yield.')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-dark-300 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed px-1 sm:px-0">
            {t(
              'landing.heroSubtitle',
              'AgriFlux bridges satellite field telemetry, in-ground IoT soil monitoring, autonomous closed-loop irrigation, and expert agronomic consultations into one streamlined, easy-to-use platform for farmers, agronomists, and agricultural enterprises.'
            )}
          </p>

          {/* Action CTAs: Full-width stacked on mobile, row on tablet/desktop */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-3.5 max-w-md mx-auto w-full px-2 sm:px-0">
            <Link
              to="/login"
              className="w-full sm:w-auto btn-primary px-7 py-3.5 text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span>{t('auth.getStarted', 'Get Started')}</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 dark:border-dark-700 bg-white/80 dark:bg-dark-900/80 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-800 dark:text-dark-100 text-xs sm:text-sm font-bold shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t('landing.exploreDemoAccounts', 'Explore Demo Accounts')}</span>
            </Link>
          </div>

          {/* Trust Badges Strip (Native App Feel) */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-dark-300">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 dark:bg-dark-850/80 border border-slate-200/80 dark:border-dark-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time IoT Sync</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 dark:bg-dark-850/80 border border-slate-200/80 dark:border-dark-800">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>Tamper-Proof Audit</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 dark:bg-dark-850/80 border border-slate-200/80 dark:border-dark-800">
              <Award size={12} className="text-teal-500" />
              <span>ICAR-TNAU Calibrated</span>
            </div>
          </div>

          {/* Hero Visual Mockup Card: Responsive Aspect Ratio & Safe Overlays */}
          <div className="mt-8 sm:mt-12 relative max-w-5xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 dark:border-dark-800 bg-white dark:bg-dark-900 group">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] w-full overflow-hidden">
              <img
                src="/hero-preview.jpg"
                alt="AgriFlux Precision Agriculture Dashboard & Field Telemetry"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex items-end p-2.5 sm:p-6 lg:p-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 w-full">
                  <div className="backdrop-blur-md bg-white/20 dark:bg-dark-900/70 border border-white/20 dark:border-white/10 rounded-xl p-2 sm:p-3 text-left text-white">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-300">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="truncate">{t('landing.mockupNdvi', 'SATELLITE NDVI')}</span>
                    </div>
                    <span className="text-base sm:text-xl font-black mt-0.5 block leading-tight">
                      0.84 {t('landing.mockupVigor', 'Vigor')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-200 block truncate">
                      {t('landing.mockupOptimalCanopy', 'Optimal Canopy')}
                    </span>
                  </div>

                  <div className="backdrop-blur-md bg-white/20 dark:bg-dark-900/70 border border-white/20 dark:border-white/10 rounded-xl p-2 sm:p-3 text-left text-white">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-bold text-teal-300">
                      <Droplets size={12} className="shrink-0" />
                      <span className="truncate">{t('landing.mockupIrrigation', 'IRRIGATION')}</span>
                    </div>
                    <span className="text-base sm:text-xl font-black mt-0.5 block leading-tight">
                      38.2% {t('landing.mockupSaved', 'Saved')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-200 block truncate">
                      {t('landing.mockupClosedLoop', 'Closed-Loop Auto')}
                    </span>
                  </div>

                  <div className="backdrop-blur-md bg-white/20 dark:bg-dark-900/70 border border-white/20 dark:border-white/10 rounded-xl p-2 sm:p-3 text-left text-white">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-300">
                      <Activity size={12} className="shrink-0" />
                      <span className="truncate">{t('landing.mockupDiagnostics', 'DIAGNOSTICS')}</span>
                    </div>
                    <span className="text-base sm:text-xl font-black mt-0.5 block leading-tight">
                      99.4% {t('landing.mockupAcc', 'Acc.')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-200 block truncate">
                      {t('landing.mockupPlantPathology', 'AI Plant Pathology')}
                    </span>
                  </div>

                  <div className="backdrop-blur-md bg-white/20 dark:bg-dark-900/70 border border-white/20 dark:border-white/10 rounded-xl p-2 sm:p-3 text-left text-white">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-bold text-green-300">
                      <ShieldCheck size={12} className="shrink-0" />
                      <span className="truncate">{t('landing.mockupDataAudit', 'DATA AUDIT')}</span>
                    </div>
                    <span className="text-base sm:text-xl font-black mt-0.5 block leading-tight truncate">
                      {t('landing.mockupTamperProof', 'Tamper-Proof')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-200 block truncate">
                      {t('landing.mockupVerifiedActivity', 'Verified Activity Log')}
                    </span>
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
        className="py-14 sm:py-20 bg-white dark:bg-dark-900 border-y border-slate-200/80 dark:border-dark-800/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              {t('landing.mvpTag', 'Core Platform Value & MVP')}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-2 font-display">
              {t('landing.mvpTitle', 'Designed for Real-World Agricultural Impact')}
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-dark-300 mt-3 leading-relaxed">
              {t(
                'landing.mvpSubtitle',
                'AgriFlux solves the core challenges faced by modern farms: unpredictable weather, water scarcity, fertilizer waste, and limited access to agronomic specialists.'
              )}
            </p>
          </div>

          {/* Feature Showcase Grid with Imagery: 1 column on mobile, 3 on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1: Soil Intelligence & Auto Irrigation */}
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-950/60 overflow-hidden hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="h-44 sm:h-52 w-full overflow-hidden relative">
                <img
                  src="/soil-feature.jpg"
                  alt="In-ground Soil Moisture and NPK Sensor with Micro Drip Irrigation"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-sm">
                  {t('landing.f1Tag', 'IoT Sensor Integration')}
                </div>
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {t('landing.f1Title', 'Soil Intelligence & Closed-Loop Irrigation')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2.5 leading-relaxed">
                    {t(
                      'landing.f1Desc',
                      'Deploy field sensors to track NPK ratios, root moisture, and soil pH continuously. When moisture falls below critical thresholds, automated drip valves trigger automatically and shut off when optimal.'
                    )}
                  </p>
                  <div className="mt-4 space-y-1.5 text-xs text-slate-700 dark:text-dark-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span>{t('landing.f1B1', 'Cuts water and electricity consumption by ~38%')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span>{t('landing.f1B2', 'Prevents root rotting and fertilizer leaching')}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-dark-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>{t('landing.f1Usage', 'Usage: Live Sensor Telemetry')}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>

            {/* Feature 2: 1-on-1 Agronomist Scientific Consultations */}
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-950/60 overflow-hidden hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="h-44 sm:h-52 w-full overflow-hidden relative">
                <img
                  src="/agronomist-feature.jpg"
                  alt="Agronomist Scientist inspecting crop health diagnostics on digital tablet"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-sm">
                  {t('landing.f2Tag', '1-on-1 Scientific Advisory')}
                </div>
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {t('landing.f2Title', 'Direct Agronomist Consultations & Prescriptions')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2.5 leading-relaxed">
                    {t(
                      'landing.f2Desc',
                      'Farmers can connect directly with accredited agricultural specialists for customized soil treatments, crop rotation strategies, and organic disease remedies with direct synchronization between farmer and specialist.'
                    )}
                  </p>
                  <div className="mt-4 space-y-1.5 text-xs text-slate-700 dark:text-dark-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                      <span>{t('landing.f2B1', 'Synchronized prescription and treatment logs')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                      <span>{t('landing.f2B2', 'Fast turnaround time for critical blight diagnosis')}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-dark-800 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                  <span>{t('landing.f2Usage', 'Usage: Integrated Video & Queue')}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>

            {/* Feature 3: Smart Machinery Rental & Input Marketplace */}
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-dark-800 bg-slate-50/70 dark:bg-dark-950/60 overflow-hidden hover:border-teal-500/50 hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="h-44 sm:h-52 w-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-dark-850 dark:to-dark-900 relative p-6 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 items-center w-full">
                  <div className="bg-white/80 dark:bg-dark-800/80 p-2.5 sm:p-3 rounded-2xl shadow-sm text-center">
                    <img
                      src="/equipments/drone.png"
                      alt="Agricultural Spray Drone"
                      className="h-16 sm:h-20 w-auto mx-auto object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-dark-200 block mt-1">
                      {t('equipment.drone', 'Spray Drone')}
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-dark-800/80 p-2.5 sm:p-3 rounded-2xl shadow-sm text-center">
                    <img
                      src="/equipments/johndeere-tractor.png"
                      alt="Modern Farm Tractor"
                      className="h-16 sm:h-20 w-auto mx-auto object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="text-[10px] font-bold text-slate-700 dark:text-dark-200 block mt-1">
                      John Deere 5050D
                    </span>
                  </div>
                </div>
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-teal-600 text-white text-[11px] font-bold shadow-sm">
                  {t('landing.f3Tag', 'Agri-Market & Fleet')}
                </div>
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {t('landing.f3Title', 'Machinery Rental & Quality Input Marketplace')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2.5 leading-relaxed">
                    {t(
                      'landing.f3Desc',
                      'Access high-tech spray drones, multi-row seeders, and tractors by the day without hefty capital investments. Purchase certified organic fertilizers and bio-stimulants directly from verified sellers.'
                    )}
                  </p>
                  <div className="mt-4 space-y-1.5 text-xs text-slate-700 dark:text-dark-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-teal-500 shrink-0" />
                      <span>{t('landing.f3B1', 'Saves up to 60% on machinery capital expenditures')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-teal-500 shrink-0" />
                      <span>{t('landing.f3B2', 'Verified quality and transparent per-acre rates')}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-dark-800 text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center justify-between">
                  <span>{t('landing.f3Usage', 'Usage: Hourly & Daily Booking')}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Specialized Roles: Farmer vs. Agronomist Workspaces ─────────── */}
      <section id="dual-workspaces" className="py-14 sm:py-20 bg-slate-50 dark:bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              {t('landing.workspaceTag', 'Dedicated Workspaces')}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-2 font-display">
              {t('landing.workspaceTitle', 'Two Specialized Operating Modes')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2">
              {t(
                'landing.workspaceSubtitle',
                'Farmers and Agronomists each have tailored tools designed specifically for their daily tasks.'
              )}
            </p>

            {/* Mode Tab Switcher: Full Width Segmented Control on Mobile */}
            <div className="w-full max-w-sm sm:max-w-md mx-auto grid grid-cols-2 p-1.5 rounded-2xl bg-slate-200/90 dark:bg-dark-850 mt-6 border border-slate-300/80 dark:border-dark-700">
              <button
                onClick={() => setActiveModeTab('farmer')}
                className={`py-2.5 px-3 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeModeTab === 'farmer'
                    ? 'bg-white dark:bg-dark-750 text-emerald-700 dark:text-emerald-300 shadow-md'
                    : 'text-slate-600 dark:text-dark-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🌾</span>
                <span className="truncate">{t('landing.tabFarmer', 'Farmer Workspace')}</span>
              </button>
              <button
                onClick={() => setActiveModeTab('agronomist')}
                className={`py-2.5 px-3 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeModeTab === 'agronomist'
                    ? 'bg-white dark:bg-dark-750 text-blue-700 dark:text-blue-300 shadow-md'
                    : 'text-slate-600 dark:text-dark-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🔬</span>
                <span className="truncate">{t('landing.tabAgronomist', 'Agronomist Portal')}</span>
              </button>
            </div>
          </div>

          {/* Farmer Features Showcase */}
          {activeModeTab === 'farmer' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 animate-fade-in">
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-emerald-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Activity size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('nav.cropHealth', 'Crop Health Monitoring')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  {t(
                    'landing.cardCropHealthDesc',
                    'Real-time Sentinel-2 canopy vigor scans, automated pest infestation detection, and foliar disease alerts to protect yields.'
                  )}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {t('landing.farmerFeature', 'Farmer Workspace Feature')}
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-emerald-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                  <Droplets size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('nav.soilAdvisor', 'Soil Intelligence')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  {t(
                    'landing.cardSoilDesc',
                    'Deep sensor analysis for NPK ratios, soil acidity (pH), root-zone moisture depletion, and organic carbon benchmarks.'
                  )}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-teal-600 dark:text-teal-400">
                  {t('landing.farmerFeature', 'Farmer Workspace Feature')}
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-emerald-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <Sprout size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('nav.cropSwitching', 'Crop Resilience Advisor')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  {t(
                    'landing.cardResilienceDesc',
                    'Predictive climate stress mitigation, biological biostimulant schedules, and drought-resistant seed switching recommendations.'
                  )}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {t('landing.farmerFeature', 'Farmer Workspace Feature')}
                </div>
              </div>
            </div>
          )}

          {/* Agronomist Features Showcase */}
          {activeModeTab === 'agronomist' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 animate-fade-in">
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-blue-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <TrendingUp size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('nav.yieldForecasting', 'Yield Forecasting')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  {t(
                    'landing.cardYieldDesc',
                    'Machine learning model estimating quintals/acre harvest outcomes based on rainfall patterns and soil profiles.'
                  )}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-blue-600 dark:text-blue-400">
                  {t('landing.agronomistFeature', 'Agronomist Portal Feature')}
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-blue-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                  <CloudLightning size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('nav.climateRisk', 'Climate Risk Analysis')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  {t(
                    'landing.cardClimateDesc',
                    'Forecasts extreme meteorological anomalies including flash heatwaves, unseasonal hail, and flood runoff.'
                  )}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-red-600 dark:text-red-400">
                  {t('landing.agronomistFeature', 'Agronomist Portal Feature')}
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-blue-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                  <Microscope size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('nav.climateSimulator', 'Climate Simulator')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  {t(
                    'landing.cardSimDesc',
                    'Interactive what-if scenario sandbox adjusting temperature, rainfall deficits, and humidity to stress-test crop viability.'
                  )}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-purple-600 dark:text-purple-400">
                  {t('landing.agronomistFeature', 'Agronomist Portal Feature')}
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm hover:border-blue-500/50 transition-all">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Award size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('nav.sustainability', 'Sustainability Index')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-2 leading-relaxed">
                  {t(
                    'landing.cardSustDesc',
                    'Quantifies farm biodiversity, carbon sequestration footprint, and chemical leaching risk with standardized ESG metrics.'
                  )}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-800 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {t('landing.agronomistFeature', 'Agronomist Portal Feature')}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Enterprise Data Protection & Activity Ledger ─────────────────── */}
      <section
        id="how-it-works"
        className="py-14 sm:py-20 bg-white dark:bg-dark-900 border-t border-slate-200/80 dark:border-dark-800/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 dark:from-dark-850 dark:via-dark-900 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20 mb-4">
                  <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('landing.securityTag', 'Platform Feature')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
                  {t('landing.securityTitle', 'Enterprise-Grade Farm Data Security & Verified Audit')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-dark-300 mt-3 leading-relaxed">
                  {t(
                    'landing.securityDesc',
                    'Every reading from in-field IoT sensors, prescription from agronomists, and irrigation activation is verified and sealed in a tamper-proof activity ledger. This guarantees accurate, undeniable documentation for crop insurance claims, organic certifications, and farm credit evaluations.'
                  )}
                </p>

                <div className="mt-5 space-y-2.5 sm:space-y-3">
                  {[
                    t('landing.securityB1', 'Tamper-Proof Audit Trail: Farm activity and sensor logs cannot be retroactively altered or forged.'),
                    t('landing.securityB2', 'Verified Identity Access: High-security authentication via Email, Phone, or Google Sign-In with instant OTP.'),
                    t('landing.securityB3', 'Hardware Command Safeguard: Ensures automated irrigation valves only execute authorized instructions.'),
                    t('landing.securityB4', 'Bankable Farm Data: Export verified health and yield records for loans, insurance, and buyers.'),
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-dark-200"
                    >
                      <CheckCircle2
                        size={15}
                        className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                      />
                      <span className="leading-normal">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3 sm:gap-4">
                  <Link
                    to="/register"
                    className="btn-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm active:scale-98"
                  >
                    {t('landing.startFreeVerification', 'Start Free Verification')}
                  </Link>
                  <Link
                    to="/login"
                    className="text-xs font-bold text-slate-700 dark:text-dark-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1"
                  >
                    {t('landing.exploreAdminConsole', 'Explore in Admin Console →')}
                  </Link>
                </div>
              </div>

              {/* Verified Activity Preview Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-800 shadow-md">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-800 gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-dark-100 flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate">{t('landing.ledgerTitle', 'Verified Farm Activity Ledger')}</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded shrink-0">
                    {t('landing.ledgerActive', 'Active & Protected')}
                  </span>
                </div>
                <div className="mt-4 space-y-2.5 sm:space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-dark-800/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {t('landing.ledgerItem1Title', 'Soil Moisture Telemetry')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-dark-400 block truncate">
                        {t('landing.ledgerItem1Sub', 'Zone A · Moisture: 38.4% · pH: 6.8')}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {t('landing.verified', 'Verified')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-dark-800/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {t('landing.ledgerItem2Title', 'Agronomist Advisory Prescribed')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-dark-400 block truncate">
                        {t('landing.ledgerItem2Sub', 'Dr. Sharma · Organic Bio-Stimulant Protocol')}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                      {t('landing.verified', 'Verified')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-dark-800/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {t('landing.ledgerItem3Title', 'Automated Micro-Drip Cycle')}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-dark-400 block truncate">
                        {t('landing.ledgerItem3Sub', 'Valves 1 & 2 · 450 Liters Delivered')}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 shrink-0">
                      {t('landing.verified', 'Verified')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact & ROI Metrics (Responsive 2x2 on Mobile, 4 on Desktop) ─── */}
      <section id="roi-impact" className="py-14 sm:py-16 bg-slate-50 dark:bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            {t('landing.roiTag', 'Measurable Results')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 font-display">
            {t('landing.roiTitle', 'Built for Tangible Returns')}
          </h2>
          <div className="mt-8 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm text-left">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-600 dark:text-emerald-400 block font-display">
                99.4%
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-dark-100 mt-1 block">
                {t('landing.roiM1Title', 'Diagnosis Accuracy')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-dark-400 mt-0.5 block leading-tight">
                {t('landing.roiM1Sub', 'Satellite & image benchmark models')}
              </span>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm text-left">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-teal-600 dark:text-teal-400 block font-display">
                38.2%
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-dark-100 mt-1 block">
                {t('landing.roiM2Title', 'Water Resource Saved')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-dark-400 mt-0.5 block leading-tight">
                {t('landing.roiM2Sub', 'Closed-loop soil deficit irrigation')}
              </span>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm text-left">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-600 dark:text-blue-400 block font-display">
                4.2x
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-dark-100 mt-1 block">
                {t('landing.roiM3Title', 'Faster Advisory Loop')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-dark-400 mt-0.5 block leading-tight">
                {t('landing.roiM3Sub', 'Direct farmer-to-agronomist queue')}
              </span>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-sm text-left">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-purple-600 dark:text-purple-400 block font-display">
                60%
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-dark-100 mt-1 block">
                {t('landing.roiM4Title', 'Lower Equipment Cost')}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-dark-400 mt-0.5 block leading-tight">
                {t('landing.roiM4Sub', 'Pay-as-you-go farm machinery fleet')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Demo Account Quick Access Banner ─────────────────────────────── */}
      <section className="py-10 sm:py-12 bg-white dark:bg-dark-900 border-t border-slate-200/80 dark:border-dark-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-emerald-600 dark:bg-emerald-700 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl text-center md:text-left">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-100">
                {t('landing.demoTag', 'Instant Interactive Demo')}
              </span>
              <h3 className="text-xl sm:text-2xl font-black mt-1 font-display">
                {t('landing.demoTitle', 'Experience AgriFlux Right Now')}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1.5 max-w-xl">
                {t(
                  'landing.demoDesc',
                  'Try out the platform as a Farmer, Agronomist, or Administrator with preloaded telemetry and live features.'
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link
                to="/login"
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 text-center"
              >
                {t('landing.demoCta', 'Sign In to Demo Accounts')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/80 dark:border-dark-800/80 bg-slate-50 dark:bg-dark-950 py-10 sm:py-12 text-xs text-slate-500 dark:text-dark-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg overflow-hidden shadow-sm shrink-0 border border-emerald-500/20">
                <img src={logo} alt="AgriFlux" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {t('landing.footerPlatform', 'AgriFlux Intelligence Platform')}
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{t('landing.footerSlogan', 'Autonomous Precision Farming')}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Link
                to="/login"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold"
              >
                {t('auth.login', 'Sign In')}
              </Link>
              <Link
                to="/register"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold"
              >
                {t('auth.register', 'Register')}
              </Link>
              <a
                href="#mvp-features"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold"
              >
                {t('landing.navFeatures', 'Platform Features')}
              </a>
              <button
                onClick={toggleTheme}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold flex items-center gap-1 active:scale-95"
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                <span>{theme === 'dark' ? t('header.lightMode', 'Light Mode') : t('header.darkMode', 'Dark Mode')}</span>
              </button>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-dark-850 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-dark-500 text-center sm:text-left">
            <p>© {new Date().getFullYear()} AgriFlux. {t('landing.allRightsReserved', 'All rights reserved.')}</p>
            <p>{t('landing.footerMission', 'Empowering sustainable, high-yield agriculture through intelligent technology.')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
