import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Sun, Moon, Globe, Search, ChevronDown, Bell, Settings, X, TrendingUp, Droplets, Leaf, AlertTriangle, CheckCircle, User, LogOut, Shield, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps { onMenuClick: () => void; }

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

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { i18n } = useTranslation();
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

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
    const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;
    const filteredSearch = searchQuery.trim()
        ? SEARCH_DATA.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()))
        : SEARCH_DATA;

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
            {/* Hamburger */}
            <button id="hamburger-menu" onClick={onMenuClick}
                className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Toggle sidebar">
                <Menu size={22} />
            </button>

            {/* Search */}
            <div ref={searchRef} className="relative flex-1 max-w-sm">
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

            <div className="flex-1" />

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">

                {/* Notifications */}
                <div ref={notifRef} className="relative">
                    <button id="notification-bell" onClick={() => { setNotifOpen(!notifOpen); setAccountOpen(false); setLangOpen(false); }}
                        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-gold-500 transition-all duration-200 hover:scale-110 active:scale-95"
                        aria-label="Notifications">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-lg animate-pulse-slow">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/50 dark:border-gray-700/50">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Notifications</h3>
                                <span className="text-xs text-primary-600 dark:text-primary-400 font-medium cursor-pointer hover:underline">{unreadCount} unread</span>
                            </div>
                            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                                {NOTIFICATIONS.map(n => (
                                    <div key={n.id} className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-700/40 ${n.unread ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
                                        <div className={`w-9 h-9 rounded-xl ${n.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                            <n.icon size={16} className={n.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{n.title}</p>
                                                {n.unread && <span className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0 mt-1.5" />}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{n.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-100/50 dark:border-gray-700/50 px-4 py-2.5">
                                <button className="w-full text-center text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">View all notifications</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Language Selector */}
                <div ref={langRef} className="relative">
                    <button id="language-selector" onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setAccountOpen(false); }}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 transition-all duration-200 hover:scale-105 active:scale-95 text-sm">
                        <Globe size={18} />
                        <span className="hidden sm:inline font-medium text-xs">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                        <ChevronDown size={13} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {langOpen && (
                        <div className="absolute right-0 top-full mt-2 w-44 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-50">
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
                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-gold-500 dark:hover:text-gold-400 transition-all duration-200 hover:scale-110 active:scale-95"
                    aria-label="Toggle theme">
                    {isDark
                        ? <Sun size={20} className="text-gold-400 drop-shadow-[0_0_6px_rgba(250,180,50,0.8)]" />
                        : <Moon size={20} />}
                </button>

                {/* Settings Icon with Account Preview */}
                <div ref={accountRef} className="relative">
                    <button id="settings-icon"
                        onClick={() => { setAccountOpen(!accountOpen); setNotifOpen(false); setLangOpen(false); }}
                        className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 hover:scale-110 active:scale-95"
                        aria-label="Settings">
                        <Settings size={20} />
                    </button>

                    {accountOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-50">
                            {/* Account Info */}
                            <div className="px-4 pt-4 pb-3 border-b border-gray-100/50 dark:border-gray-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 gradient-gold-green rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0">
                                        {user?.name?.charAt(0).toUpperCase() || 'D'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Demo Farmer'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'farmer@agriflux.ai'}</p>
                                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                            🌾 {user?.role || 'Farmer'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                                    {[{ label: 'Farm', value: user?.farmName || 'Green Valley' }, { label: 'Score', value: '78/100' }, { label: 'Plan', value: 'Pro' }].map(s => (
                                        <div key={s.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg py-1.5 px-1">
                                            <p className="text-[10px] text-gray-400">{s.label}</p>
                                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Menu Actions */}
                            {[
                                { icon: User, label: 'My Profile', sub: 'View & edit profile' },
                                { icon: Shield, label: 'Security', sub: 'Password & 2FA' },
                            ].map(item => (
                                <button key={item.label}
                                    onClick={() => { navigate('/settings'); setAccountOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-all duration-150 group">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                        <item.icon size={15} className="text-gray-600 dark:text-gray-300" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                                        <p className="text-xs text-gray-400">{item.sub}</p>
                                    </div>
                                    <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                                </button>
                            ))}

                            <button
                                onClick={() => { navigate('/settings'); setAccountOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50/40 dark:hover:bg-primary-900/10 transition-all duration-150 group border-t border-gray-100/50 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                    <Settings size={15} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Full Settings</p>
                                    <p className="text-xs text-gray-400">App preferences</p>
                                </div>
                                <ChevronRight size={14} className="ml-auto text-primary-300 group-hover:translate-x-0.5 transition-all" />
                            </button>

                            {/* Logout */}
                            <button
                                onClick={() => { logout(); navigate('/login'); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50/40 dark:hover:bg-red-900/10 text-red-500 hover:text-red-600 transition-all duration-150 group border-t border-gray-100/50 dark:border-gray-700/50">
                                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                    <LogOut size={15} className="text-red-500" />
                                </div>
                                <span className="text-sm font-medium">Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <button
                    onClick={() => { setAccountOpen(!accountOpen); setNotifOpen(false); setLangOpen(false); }}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-200 hover:scale-105 active:scale-95">
                    <div className="w-8 h-8 gradient-gold-green rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                        {user?.name?.charAt(0).toUpperCase() || 'D'}
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
                        {user?.name?.split(' ')[0] || 'Demo'}
                    </span>
                </button>
            </div>
        </header>
    );
};

export default Header;
