import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  Sun,
  Moon,
  Search,
  ChevronDown,
  Bell,
  Settings,
  X,
  TrendingUp,
  Droplets,
  Leaf,
  AlertTriangle,
  CheckCircle,
  LogOut,
  ChevronRight,
  Map,
  Store,
  Tractor,
  Wind,
  Sprout,
  BarChart3,
  Landmark,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../assets/logo-icon.png';
import SmartFarmReport from './SmartFarmReport';

interface HeaderProps {
  onMenuClick: () => void;
  onCollapseToggle?: () => void;
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
  {
    id: 1,
    icon: CheckCircle,
    color: 'text-primary-500',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    titleKey: 'notifications.yieldReadyTitle',
    bodyKey: 'notifications.yieldReadyMsg',
    timeKey: 'notifications.time2m',
    title: 'Yield Prediction Ready',
    body: 'Your Rice crop yield forecast is available.',
    time: '2 min ago',
    unread: true,
  },
  {
    id: 2,
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    titleKey: 'notifications.heatwaveTitle',
    bodyKey: 'notifications.heatwaveMsg',
    timeKey: 'notifications.time15m',
    title: 'Heatwave Alert 🔥',
    body: 'Extreme heat expected Thursday in your region.',
    time: '15 min ago',
    unread: true,
  },
  {
    id: 3,
    icon: Droplets,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    titleKey: 'notifications.wateringTitle',
    bodyKey: 'notifications.wateringMsg',
    timeKey: 'notifications.time1h',
    title: 'Irrigation Optimized',
    body: 'Schedule updated — saving 18mm water this week.',
    time: '1 hr ago',
    unread: false,
  },
  {
    id: 4,
    icon: Leaf,
    color: 'text-earth-500',
    bg: 'bg-earth-50 dark:bg-earth-900/20',
    titleKey: 'notifications.soilPhTitle',
    bodyKey: 'notifications.soilPhMsg',
    timeKey: 'notifications.time1h',
    title: 'Soil Report Generated',
    body: 'AI detected low Potassium levels in Zone B.',
    time: '3 hr ago',
    unread: false,
  },
];

interface SearchItem {
  label: string;
  icon: React.ElementType;
  route: string;
  desc: string;
  roles?: ('farmer' | 'agronomist' | 'admin')[];
}

const SEARCH_DATA: SearchItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    route: '/dashboard',
    desc: 'Farm telemetry, alerts and field control',
    roles: ['farmer', 'admin'],
  },
  {
    label: 'Agronomist Command Center',
    icon: BarChart3,
    route: '/agronomist',
    desc: 'Regional farm monitoring, consultations and diagnostics',
    roles: ['agronomist', 'admin'],
  },
  {
    label: 'Yield Forecasting',
    icon: TrendingUp,
    route: '/yield',
    desc: 'AI crop yield forecasting & optimization',
    roles: ['agronomist', 'admin'],
  },
  {
    label: 'Irrigation Intelligence',
    icon: Droplets,
    route: '/irrigation',
    desc: 'Closed-loop smart water scheduling',
    roles: ['farmer', 'admin'],
  },
  {
    label: 'Soil Intelligence',
    icon: Leaf,
    route: '/soil',
    desc: 'Soil diagnostic, NPK chemistry & field test recommendations',
    roles: ['farmer', 'admin'],
  },
  {
    label: 'Crop Health Monitoring',
    icon: Sprout,
    route: '/crop-health',
    desc: 'Orbital Sentinel-2 NDVI & plant disease scanner',
    roles: ['farmer', 'admin'],
  },
  {
    label: 'Climate Risk Analysis',
    icon: AlertTriangle,
    route: '/climate',
    desc: 'Extreme weather hazard forecasting & pest risks',
    roles: ['agronomist', 'admin'],
  },
  {
    label: 'Climate Simulator',
    icon: Wind,
    route: '/simulator',
    desc: 'Micro-climate stress testing & what-if scenarios',
    roles: ['agronomist', 'admin'],
  },
  {
    label: 'Crop Resilience Advisor',
    icon: Sprout,
    route: '/crop-switching',
    desc: 'Optimal crop switching & economic analysis',
    roles: ['farmer', 'admin'],
  },
  {
    label: 'Sustainability Index',
    icon: CheckCircle,
    route: '/sustainability',
    desc: 'Environmental ESG metrics & carbon audit index',
    roles: ['agronomist', 'admin'],
  },
  {
    label: 'Land Intelligence',
    icon: Map,
    route: '/land-intelligence',
    desc: 'Satellite land boundary & topology',
    roles: ['farmer', 'admin'],
  },
  {
    label: 'Marketplace',
    icon: Store,
    route: '/marketplace',
    desc: 'Direct farm produce & agricultural inputs',
    roles: ['farmer', 'admin'],
  },
  {
    label: 'Equipment Rental',
    icon: Tractor,
    route: '/equipment-rental',
    desc: 'Machinery sharing, tractors & drones',
    roles: ['farmer', 'admin'],
  },
  {
    label: 'Government Subsidies',
    icon: Landmark,
    route: '/subsidies',
    desc: 'PM-KISAN, crop insurance & subsidy schemes',
    roles: ['farmer', 'admin'],
  },
  {
    label: 'Market Price Intelligence',
    icon: BarChart3,
    route: '/market',
    desc: 'APMC mandis, live price trends & forecasts',
    roles: ['farmer', 'admin'],
  },
  {
    label: 'Settings & Preferences',
    icon: Settings,
    route: '/settings',
    desc: 'Personalization, notifications & display',
  },
];

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [selectedNotif, setSelectedNotif] = useState<(typeof NOTIFICATIONS)[0] | null>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];
  const unreadCount = notifications.filter((n) => n.unread).length;

  const userRole = user?.role || 'farmer';
  const roleAllowedData = SEARCH_DATA.filter((s) => !s.roles || s.roles.includes(userRole));
  const filteredSearch = searchQuery.trim()
    ? roleAllowedData.filter(
        (s) =>
          s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : roleAllowedData;

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node))
        setAccountOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 glass-header px-2 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3 w-full max-w-full overflow-x-clip select-none">
      {/* Left Section: Mobile Menu + Mobile Logo + Desktop Logo (No desktop hamburger) */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Mobile Hamburger Menu Button - ONLY visible on mobile (<lg) */}
        <button
          id="mobile-menu-toggle"
          onClick={onMenuClick}
          className="p-1.5 sm:p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 lg:hidden transition-all duration-150 flex-shrink-0"
          aria-label={t('header.openMenu', 'Open mobile menu')}
        >
          <Menu size={20} />
        </button>

        {/* Mobile Brand / Logo: Placed right after the hamburger icon and before the search bar */}
        <div
          onClick={() => {
            if (userRole === 'admin') navigate('/admin');
            else if (userRole === 'agronomist') navigate('/agronomist');
            else navigate('/dashboard');
          }}
          className="flex lg:hidden items-center gap-1.5 cursor-pointer flex-shrink-0 group"
          role="button"
          tabIndex={0}
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm shadow-primary-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <img src={logo} alt="AgriFlux Logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-none">
            Agri<span className="text-gradient">Flux</span>
          </span>
        </div>
      </div>

      {/* Center Section: Responsive Search Bar */}
      <div
        ref={searchRef}
        className="relative flex-1 min-w-[100px] sm:max-w-xs md:max-w-md lg:max-w-lg mx-1.5 sm:mx-2"
      >
        <div
          className={`flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl transition-all duration-200 ${
            searchOpen
              ? 'glass-input ring-2 ring-primary-400/50 shadow-glow-green bg-white dark:bg-gray-800'
              : 'bg-gray-100/90 dark:bg-gray-800/90'
          }`}
        >
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder={t('header.searchPlaceholder', 'Search fields, advisories, tools...')}
            value={searchQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none flex-1 min-w-0 w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={13} />
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
              <p className="px-4 py-3 text-sm text-gray-500">{t('common.noResults', 'No results found.')}</p>
            ) : (
              filteredSearch.map((item) => (
                <button
                  key={item.route}
                  onClick={() => {
                    navigate(item.route);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50/60 dark:hover:bg-primary-900/20 transition-all duration-150 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <item.icon size={15} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="ml-auto text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-150"
                  />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Section: All Action Buttons Fully Visible with Balanced Spacing */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* AI Report Button — Desktop only (hidden on mobile & tablet since bottom dock handles it) */}
        <button
          id="header-ai-report-btn"
          onClick={() => setReportOpen(true)}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-primary-600 to-teal-600 text-white font-bold text-xs shadow-sm shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-150 flex-shrink-0"
          title={t('header.generateReportTooltip', 'Generate Smart Farm Report')}
        >
          <Sparkles size={14} className="text-yellow-200 animate-pulse flex-shrink-0" />
          <span className="font-bold">{t('header.aiReport', 'AI Report')}</span>
        </button>

        {/* Notifications Bell */}
        <div ref={notifRef} className="relative flex-shrink-0">
          <button
            id="notification-bell"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setAccountOpen(false);
              setLangOpen(false);
            }}
            className="relative p-1.5 sm:p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-500 transition-all duration-150 hover:scale-105 active:scale-95 flex-shrink-0"
            aria-label={t('notifications.title', 'Notifications')}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-[100]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm font-display">
                  {t('notifications.title')}
                </h3>
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline"
                >
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
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setSelectedNotif(n);
                          handleMarkAsRead(n.id);
                        }}
                        className={`flex gap-3 px-4 py-4 transition-all duration-150 cursor-pointer group relative hover:bg-white dark:hover:bg-gray-700/60 ${n.unread ? 'bg-primary-50/20 dark:bg-primary-900/10' : ''}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl ${n.bg} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
                        >
                          <n.icon size={18} className={n.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm tracking-tight ${n.unread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-400'}`}
                            >
                              {n.titleKey ? t(n.titleKey, n.title) : n.title}
                            </p>
                            {n.unread && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5 shadow-glow-green" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                            {n.bodyKey ? t(n.bodyKey, n.body) : n.body}
                          </p>
                          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-2 uppercase">
                            {n.timeKey ? t(n.timeKey, n.time) : n.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  <div className="p-4 bg-white dark:bg-gray-800/50 animate-fade-in">
                    <button
                      onClick={() => setSelectedNotif(null)}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400 hover:text-primary-600 mb-4 transition-colors"
                    >
                      <ChevronRight size={14} className="rotate-180" /> {t('notifications.back')}
                    </button>
                    <div className="flex gap-4 items-start mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl ${selectedNotif.bg} flex items-center justify-center shadow-lg border border-white dark:border-gray-700`}
                      >
                        <selectedNotif.icon size={22} className={selectedNotif.color} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white leading-tight">
                          {selectedNotif.titleKey ? t(selectedNotif.titleKey, selectedNotif.title) : selectedNotif.title}
                        </h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase mt-1">
                          {selectedNotif.timeKey ? t(selectedNotif.timeKey, selectedNotif.time) : selectedNotif.time}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600/50">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                        {selectedNotif.bodyKey ? t(selectedNotif.bodyKey, selectedNotif.body) : selectedNotif.body}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedNotif(null)}
                      className="btn-primary w-full mt-4 text-xs font-bold py-2 shadow-glow-green"
                    >
                      {t('common.gotIt', 'Got it')}
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

        {/* Language Selector — Desktop & Tablet only (removed on mobile for cleaner spacing) */}
        <div ref={langRef} className="hidden md:block relative flex-shrink-0">
          <button
            id="language-selector"
            onClick={() => {
              setLangOpen(!langOpen);
              setNotifOpen(false);
              setAccountOpen(false);
            }}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 transition-all duration-150 hover:scale-105 active:scale-95 text-xs flex-shrink-0"
            aria-label={t('header.selectLanguage', 'Language selector')}
          >
            <span className="text-sm leading-none">{currentLang.flag}</span>
            <span className="hidden sm:inline font-bold text-xs uppercase">{currentLang.code}</span>
            <ChevronDown
              size={11}
              className={`hidden sm:inline transition-transform duration-150 ${langOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-[100]">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    setLangOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-all duration-150 hover:bg-primary-50/60 dark:hover:bg-primary-900/20
                    ${i18n.language === lang.code ? 'text-primary-600 dark:text-primary-400 font-semibold bg-primary-50/40 dark:bg-primary-900/10' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          id="theme-toggle"
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-150 hover:scale-105 active:scale-95 flex-shrink-0"
          aria-label={t('header.toggleTheme', 'Toggle theme')}
        >
          {isDark ? (
            <Sun
              size={17}
              className="text-yellow-500 dark:text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]"
            />
          ) : (
            <Moon size={17} />
          )}
        </button>

        {/* User Profile & Account Menu — Profile Avatar Icon Only */}
        <div ref={accountRef} className="relative flex-shrink-0">
          <button
            id="profile-dropdown-btn"
            onClick={() => {
              setAccountOpen(!accountOpen);
              setNotifOpen(false);
              setLangOpen(false);
            }}
            className="p-0.5 rounded-full text-gray-700 dark:text-gray-200 hover:scale-105 active:scale-95 transition-all duration-150 group focus:outline-none"
            aria-label={t('header.accountSettings', 'User profile and account settings')}
            title={user?.name || 'User Profile'}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xs shadow-sm ring-2 ring-emerald-500/30 group-hover:ring-emerald-500 group-hover:shadow-emerald-500/25 transition-all">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>

          {accountOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-[100] border border-gray-100/80 dark:border-gray-800">
              {/* User Identity Banner */}
              <div className="p-4 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-dark-850 dark:to-dark-900 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {user?.name || 'AgriFlux User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || user?.phone || 'farmer@agriflux.com'}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/40">
                      {user?.role === 'agronomist'
                        ? `🔬 ${t('header.seniorAgronomist', 'Senior Agronomist')}`
                        : user?.role === 'admin'
                          ? `🛡️ ${t('header.systemAdmin', 'System Admin')}`
                          : `🌾 ${t('header.verifiedFarmer', 'Verified Farmer')}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="p-1.5 space-y-0.5">
                <button
                  id="header-workspace-link"
                  onClick={() => {
                    navigate(
                      user?.role === 'agronomist'
                        ? '/agronomist'
                        : user?.role === 'admin'
                          ? '/admin'
                          : '/dashboard'
                    );
                    setAccountOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 text-gray-700 dark:text-gray-200 text-xs font-bold transition-colors group cursor-pointer"
                >
                  <LayoutDashboard size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{t('header.workspaceDashboard', 'Workspace Dashboard')}</span>
                  <ChevronRight size={13} className="ml-auto text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  id="header-settings-link"
                  onClick={() => {
                    navigate('/settings');
                    setAccountOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-200 text-xs font-bold transition-colors group cursor-pointer"
                >
                  <Settings size={16} className="text-gray-500 dark:text-gray-400" />
                  <span>{t('header.accountPreferences', 'Account & Preferences')}</span>
                  <ChevronRight size={13} className="ml-auto text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Explicit Logout Action */}
              <div className="p-1.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-dark-900/40">
                <button
                  id="header-logout-btn"
                  onClick={() => {
                    setAccountOpen(false);
                    logout();
                    toast.info('Signed out successfully.');
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-100/70 dark:bg-red-950/70 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <LogOut size={14} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="leading-tight">{t('common.signOut', 'Sign Out')}</p>
                    <p className="text-[10px] text-gray-400 font-normal">{t('header.endSession', 'Terminate session')}</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Smart Farm Report Modal */}
      <SmartFarmReport isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </header>
  );
};

export default Header;
