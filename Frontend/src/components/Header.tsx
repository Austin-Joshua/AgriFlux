import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Sun, Moon, Globe, Search, ChevronDown, Bell, Settings, X, TrendingUp, Droplets, Leaf, AlertTriangle, CheckCircle, User, LogOut, Shield, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
    onMenuClick: () => void;
    onCollapseToggle: () => void;
}

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
    { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
];

const NOTIFICATIONS = [
    { id: 1, icon: CheckCircle, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', title: 'Yield Prediction Ready', body: 'Your Rice crop yield forecast is available.', time: '2 min ago', unread: true },
    { id: 2, icon: AlertTriangle, color: 'text-gold-500', bg: 'bg-gold-50 dark:bg-gold-900/20', title: 'Heatwave Alert 🔥', body: 'Extreme heat expected Thursday in your region.', time: '15 min ago', unread: true },
    { id: 3, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', title: 'Irrigation Optimized', body: 'Schedule updated — saving 18mm water this week.', time: '1 hr ago', unread: false },
    { id: 4, icon: Leaf, color: 'text-earth-500', bg: 'bg-earth-50 dark:bg-earth-900/20', title: 'Soil Report Generated', body: 'AI detected low Potassium levels in Zone B.', time: '3 hr ago', unread: false },
];

const SEARCH_DATA = [
    { label: 'Yield Prediction', icon: TrendingUp, route: '/yield', desc: 'AI crop yield forecasting' },
    { label: 'Irrigation Intelligence', icon: Droplets, route: '/irrigation', desc: 'Smart water scheduling' },
    { label: 'Soil Health Advisor', icon: Leaf, route: '/soil', desc: 'Soil analysis & nutrients' },
    { label: 'Climate Risk', icon: AlertTriangle, route: '/climate', desc: 'Weather risk alerts' },
    { label: 'Sustainability Score', icon: CheckCircle, route: '/sustainability', desc: 'Farm eco score' },
];

const Header: React.FC<HeaderProps> = ({ onMenuClick, onCollapseToggle }) => {
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [langOpen, setLangOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const searchRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const accountRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);

    const [notifications, setNotifications] = useState(NOTIFICATIONS);
    const [selectedNotif, setSelectedNotif] = useState<typeof NOTIFICATIONS[0] | null>(null);

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
    const unreadCount = notifications.filter(n => n.unread).length;
    const filteredSearch = searchQuery.trim()
        ? SEARCH_DATA.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()))
        : SEARCH_DATA;

    const handleMarkAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
            if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
            if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <header className="sticky top-0 z-30 glass-header px-4 py-3 flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
                id="mobile-menu-toggle"
                onClick={onMenuClick}
                className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 lg:hidden transition-all duration-200"
                aria-label="Open mobile menu"
            >
                <Menu size={22} />
            </button>

            {/* Dedicated Hamburger icon for Sidebar Minimization/Maximization (Desktop) */}
            <button
                id="sidebar-collapse-toggle"
                onClick={onCollapseToggle}
                className="hidden lg:flex p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Toggle Sidebar"
            >
                <Menu size={22} />
            </button>

            {/* Search */}
            <div ref={searchRef} className="relative flex-1 max-w-[120px] sm:max-w-xs md:max-w-sm">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${searchOpen ? 'glass-input ring-2 ring-primary-400/50 shadow-glow-green' : 'bg-gray-100/80 dark:bg-gray-800/80'}`}>
                    <Search size={16} className="text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search crops, insights, modules..."
                        value={searchQuery}
                        onFocus={() => setSearchOpen(true)}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none flex-1 min-w-0"
                    />
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {searchOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-50">
                        <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            {searchQuery ? `Results for "${searchQuery}"` : 'Quick Navigate'}
                        </p>
                        {filteredSearch.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-500">No results found.</p>
                        ) : filteredSearch.map(item => (
                            <button key={item.route}
                                onClick={() => { navigate(item.route); setSearchOpen(false); setSearchQuery(''); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50/60 dark:hover:bg-primary-900/20 transition-all duration-150 group">
                                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                                    <item.icon size={15} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                                </div>
                                <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-150" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="hidden md:block flex-1" />

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5">

                {/* Notifications */}
                <div ref={notifRef} className="relative flex-shrink-0">
                    <button id="notification-bell" onClick={() => { setNotifOpen(!notifOpen); setAccountOpen(false); setLangOpen(false); }}
                        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-gold-500 transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
                        aria-label="Notifications">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute -right-24 sm:right-0 top-full mt-2 w-80 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-[100]">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm font-display">{t('notifications.title')}</h3>
                                <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline">
                                    {t('notifications.markAllRead')}
                                </button>
                            </div>

                            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                                {!selectedNotif ? (
                                    notifications.length === 0 ? (
                                        <div className="py-8 text-center bg-white dark:bg-gray-800/50">
                                            <p className="text-sm text-gray-500">{t('notifications.empty')}</p>
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
                                            <ChevronRight size={14} className="rotate-180" /> {t('notifications.back')}
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

                            <div className="border-t border-gray-100/50 dark:border-gray-700/50 px-4 py-3 bg-gray-50/30 dark:bg-gray-800/20">
                                <button className="w-full text-center text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                                    {t('common.viewAll')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Language Selector */}
                <div ref={langRef} className="relative flex-shrink-0">
                    <button id="language-selector" onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setAccountOpen(false); }}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 transition-all duration-200 hover:scale-105 active:scale-95 text-sm flex-shrink-0">
                        <Globe size={18} />
                        <span className="hidden sm:inline font-medium text-xs">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
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
                    {isDark
                        ? <Sun size={20} className="text-gold-400 drop-shadow-[0_0_6px_rgba(250,180,50,0.8)]" />
                        : <Moon size={20} />}
                </button>

                {/* Settings Icon with Account Preview */}
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
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Full Settings</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">App preferences</p>
                                </div>
                                <ChevronRight size={14} className="ml-auto text-primary-300 group-hover:translate-x-0.5 transition-all" />
                            </button>

                            {/* Logout Action */}
                            <button
                                onClick={() => { logout(); navigate('/login'); }}
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
        </header>
    );
};

export default Header;
