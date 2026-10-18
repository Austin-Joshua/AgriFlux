import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Outlet, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import logo from '../assets/logo-icon.png';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
];

const AuthLayout: React.FC = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isLogin = location.pathname === '/login';
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-x-hidden overflow-y-auto relative font-sans">
      {/* Floating Language Switcher for Auth Pages */}
      <div ref={langRef} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button
          type="button"
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/80 dark:border-gray-700 shadow-sm text-xs font-bold text-gray-700 dark:text-gray-200 hover:scale-105 transition-all"
          aria-label="Change Language"
        >
          <span className="text-sm">{currentLang.flag}</span>
          <span>{currentLang.label}</span>
          <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
        </button>

        {langOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-slide-down">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  setLangOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-left transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/40 ${
                  i18n.language === lang.code
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Background Splashes to match Website Pages */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden lg:block hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/30 blur-[130px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/20 blur-[130px] rounded-full"
        />
      </div>

      {/* Main Glass Container (Matching Website Glassmorphism) */}
      <div className="relative w-full max-w-[1050px] my-auto bg-white/80 dark:bg-gray-800/70 backdrop-blur-2xl rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-white/50 dark:border-white/10 flex overflow-hidden ring-1 ring-black/5">
        {/* The "Sliding" Branding Panel (Ditto Repo Style) */}
        <motion.div
          className="absolute top-0 w-1/2 h-full z-30 hidden lg:block overflow-hidden"
          initial={false}
          animate={{
            left: isLogin ? '0%' : '50%',
            borderRadius: isLogin ? '2.5rem 0 0 2.5rem' : '0 2.5rem 2.5rem 0',
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        >
          <div className="w-full h-full relative">
            {/* Visual background for branding */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-[#0a2318] dark:to-black">
              {/* Liquid Wave Effect Mockup */}
              <div className="absolute inset-0 opacity-20 transition-opacity duration-1000">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.4),transparent_70%)] animate-pulse-slow" />
              </div>
            </div>

            <div className="relative w-full h-full p-8 lg:p-12 flex flex-col justify-between text-white z-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3.5">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    className="w-12 h-12 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0"
                  >
                    <img src={logo} alt="AgriFlux Logo" className="w-full h-full object-cover" />
                  </motion.div>
                  <div className="flex flex-col text-left">
                    <span className="text-xl font-black text-white leading-none tracking-tight">
                      {t('common.agriflux', 'AgriFlux')}
                    </span>
                    <span className="text-[10px] font-black text-gold-400 uppercase tracking-widest mt-1">
                      {t('common.intelligencePlatform', 'Intelligence Platform')}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.div
                    key={isLogin ? 'login-text' : 'reg-text'}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <h2 className="text-3xl sm:text-4xl font-black font-display leading-[1.12] tracking-tight mb-3">
                      {isLogin
                        ? t('common.smartFarming', 'Smart Farming Starts Here.')
                        : t('common.growBetter', 'Grow Better With AI.')}
                    </h2>
                    <p className="text-primary-100/90 text-sm sm:text-base font-medium leading-relaxed max-w-[340px]">
                      {isLogin
                        ? t(
                            'common.smartFarmingDesc',
                            'Access your precision agriculture insights and manage your farm with intelligence.'
                          )
                        : t(
                            'common.growBetterDesc',
                            'Join the next generation of digital agriculture and optimize your farm resources.'
                          )}
                    </p>
                  </motion.div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-primary-200/70">
                    AGRIFLUX INTELLIGENCE
                  </p>
                  <div className="h-1 w-10 bg-teal-400 rounded-full" />
                </div>

                <Link
                  id="auth-sliding-toggle-btn"
                  to={isLogin ? '/register' : '/login'}
                  className="group flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 transition-all font-bold text-xs sm:text-sm tracking-wide shadow-sm"
                >
                  {isLogin ? (
                    <>
                      {t('auth.register', 'Sign Up')}{' '}
                      <ArrowRight
                        size={15}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  ) : (
                    <>
                      <ArrowLeft
                        size={15}
                        className="group-hover:-translate-x-1 transition-transform"
                      />{' '}
                      {t('auth.login', 'Sign In')}
                    </>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form Content Areas */}
        <div className="flex w-full h-full relative">
          {/* Left Slot (Shows Register Form when Register, or empty when Login) */}
          <div
            className={`lg:w-1/2 h-full flex items-center justify-center p-5 sm:p-7 lg:p-8 order-2 lg:order-1 ${!isLogin ? 'flex-1' : 'hidden lg:flex'}`}
          >
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="register-content"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="w-full max-w-md py-2"
                >
                  <Outlet />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Slot (Shows Login Form when Login, or empty when Register) */}
          <div
            className={`lg:w-1/2 h-full flex items-center justify-center p-5 sm:p-7 lg:p-8 order-1 lg:order-2 ${isLogin ? 'flex-1' : 'hidden lg:flex'}`}
          >
            <AnimatePresence mode="wait">
              {isLogin && (
                <motion.div
                  key="login-content"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="w-full max-w-sm py-2"
                >
                  <Outlet />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
