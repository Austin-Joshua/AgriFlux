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
                                        <span className="text-2xl font-black text-white leading-none tracking-tight">{t('common.agriflux', 'AgriFlux')}</span>
                                        <span className="text-xs font-black text-gold-400 uppercase tracking-widest mt-1">{t('common.intelligencePlatform', 'Intelligence Platform')}</span>
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
                                            {isLogin ? t('common.smartFarming', 'Smart Farming Starts Here.') : t('common.growBetter', 'Grow Better With AI.')}
                                        </h2>
                                        <p className="text-primary-100/90 text-xl font-medium leading-relaxed max-w-[340px]">
                                            {isLogin
                                                ? t('common.smartFarmingDesc', 'Access your precision agriculture insights and manage your farm with intelligence.')
                                                : t('common.growBetterDesc', 'Join the next generation of digital agriculture and optimize your farm resources.')}
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
                    <div className={`lg:w-1/2 h-full flex items-center justify-center p-6 sm:p-12 order-2 lg:order-1 ${!isLogin ? 'flex-1' : 'hidden lg:flex'}`}>
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
                    <div className={`lg:w-1/2 h-full flex items-center justify-center p-6 sm:p-12 order-1 lg:order-2 ${isLogin ? 'flex-1' : 'hidden lg:flex'}`}>
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
