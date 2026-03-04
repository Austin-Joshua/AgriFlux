import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Outlet, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, ArrowLeft, ArrowRight, Globe, ChevronDown, Bell, Settings, LogOut, ChevronRight, CheckCircle, AlertTriangle, Droplets, Leaf } from 'lucide-react';
import logo from '../assets/new-leaf-logo.png';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
    { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
];

const NOTIFICATIONS = [
    { id: 1, icon: CheckCircle, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', title: 'Welcome to AgriFlux', body: 'Please sign in to access your farm intelligence.', time: 'Just now', unread: true }
];

const AuthLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { isDark, toggleTheme } = useTheme();
    const { logout } = useAuth();
    const isLogin = location.pathname === '/login';

    const [langOpen, setLangOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);

    const notifRef = useRef<HTMLDivElement>(null);
    const accountRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);

    const [notifications, setNotifications] = useState(NOTIFICATIONS);
    const [selectedNotif, setSelectedNotif] = useState<typeof NOTIFICATIONS[0] | null>(null);

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
    const unreadCount = notifications.filter(n => n.unread).length;

    const handleMarkAsRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    const handleMarkAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
            if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
            if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-1000 overflow-hidden relative font-sans">
            {/* Dynamic Background Splashes to match Website Pages */}
            <div className="absolute inset-0 pointer-events-none lg:block hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/30 blur-[130px] rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.1, 0.15, 0.1],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-500/20 blur-[130px] rounded-full"
                />
            </div>

            {/* Top Right Header Action Icons (Matching Dashboard) */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-1 sm:gap-1.5 glass-panel px-2 py-1 sm:px-3 sm:py-2 rounded-2xl shadow-lg border border-white/20">

                {/* Notifications */}
                <div ref={notifRef} className="relative flex-shrink-0">
                    <button id="notification-bell" onClick={() => { setNotifOpen(!notifOpen); setAccountOpen(false); setLangOpen(false); }}
                        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-gold-500 transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute -right-24 sm:right-0 top-full mt-2 w-80 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-[100]">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm font-display">Notifications</h3>
                                <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline">
                                    Mark all read
                                </button>
                            </div>

                            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                                {!selectedNotif ? (
                                    notifications.length === 0 ? (
                                        <div className="py-8 text-center bg-white dark:bg-gray-800/50">
                                            <p className="text-sm text-gray-500">No new notifications</p>
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id}
                                                onClick={() => { setSelectedNotif(n); handleMarkAsRead(n.id); }}
                                                className={`flex gap-3 px-4 py-4 transition-all duration-300 cursor-pointer group relative hover:bg-white dark:hover:bg-gray-700/60 ${n.unread ? 'bg-primary-50/20 dark:bg-primary-900/10' : ''}`}>
                                                <div className={`w-10 h-10 rounded-xl ${n.bg} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                                                    <n.icon size={18} className={n.color} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-sm tracking-tight ${n.unread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-400'}`}>{n.title}</p>
                                                        {n.unread && <span className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0 mt-1.5 shadow-glow-gold" />}
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{n.body}</p>
                                                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-2 uppercase">{n.time}</p>
                                                </div>
                                            </div>
                                        ))
                                    )
                                ) : (
                                    <div className="p-4 bg-white dark:bg-gray-800/50 animate-fade-in">
                                        <button onClick={() => setSelectedNotif(null)} className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400 hover:text-primary-600 mb-4 transition-colors">
                                            <ChevronRight size={14} className="rotate-180" /> Back
                                        </button>
                                        <div className="flex gap-4 items-start mb-4">
                                            <div className={`w-12 h-12 rounded-2xl ${selectedNotif.bg} flex items-center justify-center shadow-lg border border-white dark:border-gray-700`}>
                                                <selectedNotif.icon size={22} className={selectedNotif.color} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{selectedNotif.title}</h4>
                                                <p className="text-[10px] font-black text-gray-400 uppercase mt-1">{selectedNotif.time}</p>
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600/50">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                                {selectedNotif.body}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedNotif(null)}
                                            className="btn-primary w-full mt-4 text-xs font-bold py-2 shadow-glow-green">
                                            Got it
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Language Selector */}
                <div ref={langRef} className="relative flex-shrink-0">
                    <button id="language-selector" onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setAccountOpen(false); }}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 transition-all duration-200 hover:scale-105 active:scale-95 text-sm flex-shrink-0">
                        <Globe size={18} />
                        <ChevronDown size={13} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {langOpen && (
                        <div className="absolute -right-12 sm:right-0 top-full mt-2 w-44 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-[100]">
                            {LANGUAGES.map(lang => (
                                <button key={lang.code}
                                    onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-all duration-150 hover:bg-primary-50/60 dark:hover:bg-primary-900/20
                    ${i18n.language === lang.code ? 'text-primary-600 dark:text-primary-400 font-semibold bg-primary-50/40 dark:bg-primary-900/10' : 'text-gray-700 dark:text-gray-300'}`}>
                                    <span className="text-base">{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <button id="theme-toggle" onClick={toggleTheme}
                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-gold-500 dark:hover:text-gold-400 transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
                    aria-label="Toggle theme">
                    {isDark ? <Sun size={20} className="text-gold-400 drop-shadow-[0_0_6px_rgba(250,180,50,0.8)]" /> : <Moon size={20} />}
                </button>

                {/* Settings / Logout */}
                <div ref={accountRef} className="relative flex-shrink-0">
                    <button id="settings-icon"
                        onClick={() => { setAccountOpen(!accountOpen); setNotifOpen(false); setLangOpen(false); }}
                        className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
                        aria-label="Settings">
                        <Settings size={20} />
                    </button>

                    {accountOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-[100]">
                            {/* Simple Settings Action */}
                            <button
                                onClick={() => { navigate('/settings'); setAccountOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-primary-50/40 dark:hover:bg-primary-900/10 transition-all duration-150 group">
                                <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                    <Settings size={18} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Settings</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">App preferences</p>
                                </div>
                                <ChevronRight size={14} className="ml-auto text-primary-300 group-hover:translate-x-0.5 transition-all" />
                            </button>

                            {/* Logout Action */}
                            <button
                                onClick={() => { logout(); navigate('/login'); setAccountOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50/40 dark:hover:bg-red-900/10 text-red-500 hover:text-red-600 transition-all duration-150 group border-t border-gray-100/50 dark:border-gray-700/50">
                                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                    <LogOut size={18} className="text-red-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold">Sign Out</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Exit session</p>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Glass Container (Matching Website Glassmorphism) */}
            <div className="relative w-full max-w-[1050px] min-h-[600px] lg:min-h-[720px] bg-white/70 dark:bg-gray-800/60 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_128px_rgba(0,0,0,0.4)] border border-white/40 dark:border-white/5 flex overflow-hidden ring-1 ring-black/5">

                {/* The "Sliding" Branding Panel (Ditto Repo Style) */}
                <motion.div
                    className="absolute top-0 w-1/2 h-full z-30 hidden lg:block overflow-hidden"
                    initial={false}
                    animate={{
                        left: isLogin ? '0%' : '50%',
                        borderRadius: isLogin ? '1.5rem 0 0 1.5rem' : '0 1.5rem 1.5rem 0'
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

                        <div className="relative w-full h-full p-16 flex flex-col justify-between text-white z-10">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <motion.div
                                        whileHover={{ scale: 1.05, rotate: 5 }}
                                        className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden ring-1 ring-white/30"
                                    >
                                        <img src={logo} alt="AgriFlux" className="w-10 h-10 object-contain" />
                                    </motion.div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-2xl font-black text-white leading-none tracking-tight">AgriFlux</span>
                                        <span className="text-xs font-black text-gold-400 uppercase tracking-widest mt-1">Intelligence Platform</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <motion.div
                                        key={isLogin ? 'login-text' : 'reg-text'}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <h2 className="text-5xl font-black font-display leading-[1.1] tracking-tightest mb-4">
                                            {isLogin ? 'Smart Farming Starts Here.' : 'Grow Better With AI.'}
                                        </h2>
                                        <p className="text-primary-100/90 text-xl font-medium leading-relaxed max-w-[340px]">
                                            {isLogin
                                                ? 'Access your precision agriculture insights and manage your farm with intelligence.'
                                                : 'Join the next generation of digital agriculture and optimize your farm resources.'}
                                        </p>
                                    </motion.div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-200/60">
                                        AGRIFLUX INTELLIGENCE
                                    </p>
                                    <div className="h-1 w-12 bg-gold-500 rounded-full" />
                                </div>

                                <Link
                                    to={isLogin ? '/register' : '/login'}
                                    className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 transition-all font-bold text-sm tracking-wide"
                                >
                                    {isLogin ? (
                                        <>Sign Up <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                    ) : (
                                        <><ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Sign In</>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Form Content Areas */}
                <div className="flex w-full h-full relative">
                    {/* Left Slot (Shows Register Form when Register, or empty/bg when Login) */}
                    <div className="flex-1 lg:w-1/2 h-full flex items-center justify-center p-6 sm:p-12 order-2 lg:order-1">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    key="register-content"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className="w-full max-w-sm"
                                >
                                    <Outlet />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Slot (Shows Login Form when Login, or empty/bg when Register) */}
                    <div className="flex-1 lg:w-1/2 h-full flex items-center justify-center p-6 sm:p-12 order-1 lg:order-2">
                        <AnimatePresence mode="wait">
                            {isLogin && (
                                <motion.div
                                    key="login-content"
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50 }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className="w-full max-w-sm"
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
