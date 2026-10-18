import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  ArrowLeft,
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
  labelKey: string;
  labelFallback: string;
  descKey: string;
  descFallback: string;
  icon: React.ElementType;
  route: string;
  roles?: ('farmer' | 'agronomist' | 'admin')[];
  keywords: string[];
}

const SEARCH_DATA: SearchItem[] = [
  {
    labelKey: 'nav.dashboard',
    labelFallback: 'Dashboard',
    descKey: 'nav.smartFarmingDesc',
    descFallback: 'Farm telemetry, alerts and field control',
    icon: LayoutDashboard,
    route: '/dashboard',
    roles: ['farmer', 'admin'],
    keywords: ['dashboard', 'home', 'farm', 'telemetry', 'alerts', 'field', 'overview', 'டாஷ்போர்டு', 'முகப்பு', 'விவசாயம்', 'டேஷ்போர்டு', 'डैशबोर्ड', 'खेती'],
  },
  {
    labelKey: 'nav.agronomistPortal',
    labelFallback: 'Agronomist Command Center',
    descKey: 'header.agroDesc',
    descFallback: 'Regional farm monitoring, consultations and diagnostics',
    icon: BarChart3,
    route: '/agronomist',
    roles: ['agronomist', 'admin'],
    keywords: ['agronomist', 'portal', 'command', 'center', 'diagnostics', 'consultation', 'field', 'கள ஆலோசகர்', 'கன்சோல்', 'ஆலோசனை', 'कृषिविज्ञानी'],
  },
  {
    labelKey: 'nav.yieldPrediction',
    labelFallback: 'Yield Forecasting',
    descKey: 'header.yieldDesc',
    descFallback: 'AI crop yield forecasting & optimization',
    icon: TrendingUp,
    route: '/yield',
    roles: ['agronomist', 'admin'],
    keywords: ['yield', 'harvest', 'forecast', 'production', 'prediction', 'crop', 'forecasting', 'விளைச்சல்', 'கணிப்பு', 'உற்பத்தி', 'மகசூல்', 'पैदावार'],
  },
  {
    labelKey: 'nav.irrigation',
    labelFallback: 'Irrigation Intelligence',
    descKey: 'header.irrigationDesc',
    descFallback: 'Closed-loop smart water scheduling',
    icon: Droplets,
    route: '/irrigation',
    roles: ['farmer', 'admin'],
    keywords: ['irrigation', 'water', 'pump', 'schedule', 'moisture', 'sensors', 'valve', 'பாசனம்', 'நீர்', 'தண்ணீர்', 'ஸ்மார்ட் பாசனம்', 'सिंचाई', 'पानी'],
  },
  {
    labelKey: 'nav.soilIntelligence',
    labelFallback: 'Soil Intelligence',
    descKey: 'header.soilDesc',
    descFallback: 'Soil diagnostic, NPK chemistry & field test recommendations',
    icon: Leaf,
    route: '/soil',
    roles: ['farmer', 'admin'],
    keywords: ['soil', 'npk', 'nitrogen', 'phosphorus', 'potassium', 'fertilizer', 'ph', 'chemistry', 'மண்', 'உரம்', 'மண் பரிசோதனை', 'நுண்ணறிவு', 'मिट्टी', 'खाद'],
  },
  {
    labelKey: 'nav.cropHealth',
    labelFallback: 'Crop Health Monitoring',
    descKey: 'header.cropHealthDesc',
    descFallback: 'Orbital Sentinel-2 NDVI & plant disease scanner',
    icon: Sprout,
    route: '/crop-health',
    roles: ['farmer', 'admin'],
    keywords: ['crop', 'health', 'disease', 'ndvi', 'satellite', 'blight', 'scanner', 'plant', 'பயிர்', 'ஆரோக்கியம்', 'நோய்', 'கண்காணிப்பு', 'செடி', 'रोग'],
  },
  {
    labelKey: 'nav.climateRisk',
    labelFallback: 'Climate Risk Analysis',
    descKey: 'header.climateDesc',
    descFallback: 'Extreme weather hazard forecasting & pest risks',
    icon: AlertTriangle,
    route: '/climate',
    roles: ['agronomist', 'admin'],
    keywords: ['climate', 'risk', 'weather', 'hazard', 'rain', 'drought', 'storm', 'heatwave', 'pest', 'வானிலை', 'ஆபத்து', 'மழை', 'புயல்', 'வெப்பம்', 'मौसम'],
  },
  {
    labelKey: 'nav.climateSimulator',
    labelFallback: 'Climate Simulator',
    descKey: 'header.simulatorDesc',
    descFallback: 'Micro-climate stress testing & what-if scenarios',
    icon: Wind,
    route: '/simulator',
    roles: ['agronomist', 'admin'],
    keywords: ['simulator', 'simulation', 'stress', 'test', 'weather', 'what-if', 'scenario', 'சிமுலேட்டர்', 'வானிலை', 'சோதனை', 'सिम्युलेटर'],
  },
  {
    labelKey: 'nav.cropSwitching',
    labelFallback: 'Crop Resilience Advisor',
    descKey: 'header.cropSwitchingDesc',
    descFallback: 'Optimal crop switching & economic analysis',
    icon: Sprout,
    route: '/crop-switching',
    roles: ['farmer', 'admin'],
    keywords: ['crop', 'resilience', 'switching', 'switch', 'advisor', 'drought', 'economic', 'பயிர்', 'மாற்ற', 'ஆலோசகர்', 'தாங்கும் திறன்', 'फसल बदलाव'],
  },
  {
    labelKey: 'nav.sustainability',
    labelFallback: 'Sustainability Index',
    descKey: 'header.sustainabilityDesc',
    descFallback: 'Environmental ESG metrics & carbon audit index',
    icon: CheckCircle,
    route: '/sustainability',
    roles: ['agronomist', 'admin'],
    keywords: ['sustainability', 'carbon', 'esg', 'green', 'audit', 'index', 'eco', 'நிலைத்தன்மை', 'குறியீடு', 'கார்பன்', 'पर्यावरण'],
  },
  {
    labelKey: 'nav.landIntelligence',
    labelFallback: 'Land Intelligence',
    descKey: 'header.landDesc',
    descFallback: 'Satellite land boundary & topology',
    icon: Map,
    route: '/land-intelligence',
    roles: ['farmer', 'admin'],
    keywords: ['land', 'boundary', 'satellite', 'topology', 'cadastral', 'map', 'area', 'acres', 'நிலம்', 'எல்லை', 'வரைபடம்', 'பரப்பளவு', 'भूमि', 'नक्शा'],
  },
  {
    labelKey: 'nav.marketplace',
    labelFallback: 'Marketplace',
    descKey: 'header.marketplaceDesc',
    descFallback: 'Direct farm produce & agricultural inputs',
    icon: Store,
    route: '/marketplace',
    roles: ['farmer', 'admin'],
    keywords: ['marketplace', 'market', 'buy', 'sell', 'seeds', 'fertilizer', 'produce', 'store', 'சந்தை', 'விற்பனை', 'வாங்குதல்', 'பொருட்கள்', 'बाजार'],
  },
  {
    labelKey: 'nav.equipmentRental',
    labelFallback: 'Equipment Rental',
    descKey: 'header.equipmentDesc',
    descFallback: 'Machinery sharing, tractors & drones',
    icon: Tractor,
    route: '/equipment-rental',
    roles: ['farmer', 'admin'],
    keywords: ['equipment', 'rental', 'tractor', 'drone', 'harvester', 'machinery', 'rent', 'tools', 'வாடகை', 'உபகரணம்', 'டிராக்டர்', 'ட்ரோன்', 'किराया'],
  },
  {
    labelKey: 'nav.subsidies',
    labelFallback: 'Government Subsidies',
    descKey: 'header.subsidiesDesc',
    descFallback: 'PM-KISAN, crop insurance & subsidy schemes',
    icon: Landmark,
    route: '/subsidies',
    roles: ['farmer', 'admin'],
    keywords: ['subsidy', 'subsidies', 'government', 'pm-kisan', 'insurance', 'schemes', 'welfare', 'மானியம்', 'அரசு', 'காப்பீடு', 'திட்டங்கள்', 'सब्सिडी', 'बीमा'],
  },
  {
    labelKey: 'nav.market',
    labelFallback: 'Market Price Intelligence',
    descKey: 'header.marketDesc',
    descFallback: 'APMC mandis, live price trends & forecasts',
    icon: BarChart3,
    route: '/market',
    roles: ['farmer', 'admin'],
    keywords: ['price', 'mandi', 'apmc', 'market', 'rates', 'trends', 'forecast', 'commodity', 'விலை', 'சந்தை', 'மண்டி', 'தகவல்', 'मंडी', 'भाव'],
  },
  {
    labelKey: 'nav.adminConsole',
    labelFallback: 'Admin Control Console',
    descKey: 'header.adminDesc',
    descFallback: 'Platform governance, user management & system telemetry',
    icon: Landmark,
    route: '/admin',
    roles: ['admin'],
    keywords: ['admin', 'governance', 'users', 'system', 'ledger', 'audit', 'blockchain', 'infrastructure', 'நிர்வாகி', 'கன்சோல்', 'ஆளுமை', 'एडमिन'],
  },
  {
    labelKey: 'nav.settings',
    labelFallback: 'Settings & Preferences',
    descKey: 'header.settingsDesc',
    descFallback: 'Personalization, notifications & display',
    icon: Settings,
    route: '/settings',
    keywords: ['settings', 'preferences', 'profile', 'display', 'language', 'theme', 'password', 'account', 'அமைப்புகள்', 'விருப்பங்கள்', 'சுயவிவரம்', 'सेटिंग्स'],
  },
];

interface ExploringLink {
  labelKey: string;
  fallbackLabel: string;
  route: string;
  icon: React.ElementType;
}

const ROLE_EXPLORING_LINKS: Record<string, ExploringLink[]> = {
  farmer: [
    { labelKey: 'nav.irrigation', fallbackLabel: 'Smart Irrigation', route: '/irrigation', icon: Droplets },
    { labelKey: 'nav.soilIntelligence', fallbackLabel: 'Soil Intelligence', route: '/soil', icon: Leaf },
    { labelKey: 'nav.cropSwitching', fallbackLabel: 'Crop Resilience Advisor', route: '/crop-switching', icon: Sprout },
    { labelKey: 'nav.cropHealth', fallbackLabel: 'Crop Health Monitoring', route: '/crop-health', icon: Leaf },
    { labelKey: 'nav.marketplace', fallbackLabel: 'Agri Marketplace', route: '/marketplace', icon: Store },
  ],
  agronomist: [
    { labelKey: 'nav.yieldPrediction', fallbackLabel: 'Yield Forecasting', route: '/yield', icon: TrendingUp },
    { labelKey: 'nav.climateRisk', fallbackLabel: 'Climate Risk Analysis', route: '/climate', icon: AlertTriangle },
    { labelKey: 'nav.climateSimulator', fallbackLabel: 'Climate Stress Simulator', route: '/simulator', icon: Wind },
    { labelKey: 'nav.sustainability', fallbackLabel: 'Sustainability Index', route: '/sustainability', icon: CheckCircle },
    { labelKey: 'nav.farmerPreview', fallbackLabel: 'Farmer Field Preview', route: '/dashboard', icon: LayoutDashboard },
  ],
  admin: [
    { labelKey: 'nav.adminConsole', fallbackLabel: 'Admin Control Console', route: '/admin', icon: Landmark },
    { labelKey: 'nav.agronomistPortal', fallbackLabel: 'Agronomist Operations', route: '/agronomist', icon: BarChart3 },
    { labelKey: 'nav.farmerPreview', fallbackLabel: 'Farmer Operations', route: '/dashboard', icon: LayoutDashboard },
    { labelKey: 'nav.settings', fallbackLabel: 'System Settings', route: '/settings', icon: Settings },
  ],
};

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [selectedNotif, setSelectedNotif] = useState<(typeof NOTIFICATIONS)[0] | null>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];
  const unreadCount = notifications.filter((n) => n.unread).length;

  const userRole = user?.role || 'farmer';
  const workspaceRoute =
    userRole === 'admin'
      ? '/admin'
      : userRole === 'agronomist'
        ? '/agronomist'
        : '/dashboard';
  const roleAllowedData = SEARCH_DATA.filter((s) => !s.roles || s.roles.includes(userRole));
  const queryLower = searchQuery.trim().toLowerCase();
  const filteredSearch = queryLower
    ? roleAllowedData.filter((s) => {
        const translatedLabel = t(s.labelKey, s.labelFallback).toLowerCase();
        const translatedDesc = t(s.descKey, s.descFallback).toLowerCase();
        const fallbackLabel = s.labelFallback.toLowerCase();
        const fallbackDesc = s.descFallback.toLowerCase();
        const matchesKeyword = s.keywords.some((kw) => kw.toLowerCase().includes(queryLower));
        const matchesRoute = s.route.toLowerCase().includes(queryLower);

        return (
          translatedLabel.includes(queryLower) ||
          translatedDesc.includes(queryLower) ||
          fallbackLabel.includes(queryLower) ||
          fallbackDesc.includes(queryLower) ||
          matchesKeyword ||
          matchesRoute
        );
      })
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
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setMobileSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node))
        setAccountOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header
      style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}
      className="sticky top-0 z-30 glass-header px-2 sm:px-4 pb-2 sm:pb-2.5 flex items-center justify-between gap-1 sm:gap-2 md:gap-3 w-full max-w-full select-none"
    >
      {mobileSearchOpen ? (
        /* Full-width Mobile Search Bar Overlay */
        <div ref={mobileSearchRef} className="flex md:hidden items-center gap-1.5 w-full animate-fade-in relative py-0.5">
          <button
            onClick={() => {
              setMobileSearchOpen(false);
              setSearchOpen(false);
              setSearchQuery('');
            }}
            className="p-1.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            aria-label={t('common.back', 'Back')}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100/90 dark:bg-gray-800/90 glass-input ring-2 ring-primary-400/50">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              id="mobile-search-input"
              type="text"
              autoFocus
              placeholder={t('header.searchPlaceholder', 'Search fields, advisories, tools...')}
              value={searchQuery}
              onFocus={() => {
                setSearchOpen(true);
                setSelectedIndex(0);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
                setSelectedIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (filteredSearch.length > 0) {
                    setSelectedIndex((prev) => (prev + 1) % filteredSearch.length);
                  }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (filteredSearch.length > 0) {
                    setSelectedIndex((prev) => (prev - 1 + filteredSearch.length) % filteredSearch.length);
                  }
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredSearch.length > 0) {
                    const item = filteredSearch[selectedIndex] || filteredSearch[0];
                    navigate(item.route);
                    setSearchOpen(false);
                    setMobileSearchOpen(false);
                    setSearchQuery('');
                  }
                } else if (e.key === 'Escape') {
                  setSearchOpen(false);
                  setMobileSearchOpen(false);
                }
              }}
              className="bg-transparent text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none flex-1 min-w-0 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {/* Mobile Search Results Dropdown */}
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-50 max-h-80 overflow-y-auto">
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {searchQuery ? `${t('common.searchResults', 'Results for')} "${searchQuery}"` : t('common.quickNavigate', 'Quick Navigate')}
              </p>
              {filteredSearch.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">{t('common.noResults', 'No results found.')}</p>
              ) : (
                filteredSearch.map((item, idx) => (
                  <Link
                    key={item.route}
                    id={`mobile-search-item-${item.route.replace('/', '')}`}
                    to={item.route}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSearchOpen(false);
                      setMobileSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50/70 dark:hover:bg-primary-900/30 transition-all duration-150 group cursor-pointer ${
                      idx === selectedIndex ? 'bg-primary-50/80 dark:bg-primary-900/40 ring-1 ring-primary-500/20' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-100/80 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <item.icon size={15} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {t(item.labelKey, item.labelFallback)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t(item.descKey, item.descFallback)}</p>
                    </div>
                    <ChevronRight
                      size={14}
                      className="ml-auto text-gray-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-150 flex-shrink-0"
                    />
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Left Section: Mobile Menu + Mobile Logo + Desktop Logo (No desktop hamburger) */}
          <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
            {/* Mobile Hamburger Menu Button - ONLY visible on mobile (<lg) */}
            <button
              id="mobile-menu-toggle"
              onClick={onMenuClick}
              className="p-1 sm:p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 lg:hidden transition-all duration-150 flex-shrink-0"
              aria-label={t('header.openMenu', 'Open mobile menu')}
            >
              <Menu size={19} />
            </button>

            {/* Mobile Brand / Logo */}
            <div
              onClick={() => {
                if (userRole === 'admin') navigate('/admin');
                else if (userRole === 'agronomist') navigate('/agronomist');
                else navigate('/dashboard');
              }}
              className="flex lg:hidden items-center gap-1 cursor-pointer flex-shrink-0 group"
              role="button"
              tabIndex={0}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden shadow-sm shadow-primary-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                <img src={logo} alt="AgriFlux Logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white tracking-tight leading-none">
                Agri<span className="text-gradient">Flux</span>
              </span>
            </div>
          </div>

          {/* Center Section: Responsive Search Bar (Desktop & Tablet only) */}
          <div
            ref={searchRef}
            className="hidden md:block relative flex-1 max-w-xs md:max-w-md lg:max-w-lg mx-2"
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
            id="desktop-search-input"
            type="text"
            placeholder={t('header.searchPlaceholder', 'Search fields, advisories, tools...')}
            value={searchQuery}
            onFocus={() => {
              setSearchOpen(true);
              setSelectedIndex(0);
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (filteredSearch.length > 0) {
                  setSelectedIndex((prev) => (prev + 1) % filteredSearch.length);
                }
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (filteredSearch.length > 0) {
                  setSelectedIndex((prev) => (prev - 1 + filteredSearch.length) % filteredSearch.length);
                }
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredSearch.length > 0) {
                  const item = filteredSearch[selectedIndex] || filteredSearch[0];
                  navigate(item.route);
                  setSearchOpen(false);
                  setMobileSearchOpen(false);
                  setSearchQuery('');
                }
              } else if (e.key === 'Escape') {
                setSearchOpen(false);
                setMobileSearchOpen(false);
              }
            }}
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
          <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-50 max-h-96 overflow-y-auto">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {searchQuery ? `${t('common.searchResults', 'Results for')} "${searchQuery}"` : t('common.quickNavigate', 'Quick Navigate')}
            </p>
            {filteredSearch.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">{t('common.noResults', 'No results found.')}</p>
            ) : (
              filteredSearch.map((item, idx) => (
                <Link
                  key={item.route}
                  id={`search-item-${item.route.replace('/', '')}`}
                  to={item.route}
                  onMouseDown={(e) => {
                    // Prevent input blur before click registers
                    e.preventDefault();
                  }}
                  onClick={() => {
                    setSearchOpen(false);
                    setMobileSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50/70 dark:hover:bg-primary-900/30 transition-all duration-150 group cursor-pointer ${
                    idx === selectedIndex ? 'bg-primary-50/80 dark:bg-primary-900/40 ring-1 ring-primary-500/20' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-100/80 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <item.icon size={15} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {t(item.labelKey, item.labelFallback)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {t(item.descKey, item.descFallback)}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="ml-auto text-gray-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-150 flex-shrink-0"
                  />
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Section: All Action Buttons Fully Visible with Balanced Spacing */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Mobile Search Toggle Button — Mobile only */}
        <button
          id="mobile-search-toggle"
          onClick={() => {
            setMobileSearchOpen(true);
            setSearchOpen(true);
          }}
          className="flex md:hidden p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 transition-all duration-150 active:scale-95 flex-shrink-0"
          aria-label={t('common.search', 'Search')}
        >
          <Search size={17} />
        </button>

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
            className="p-1.5 sm:p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-500 transition-all duration-150 hover:scale-105 active:scale-95 flex-shrink-0"
            aria-label={t('notifications.title', 'Notifications')}
          >
            <div className="relative flex items-center justify-center">
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border border-white dark:border-gray-800 shadow-sm" />
              )}
            </div>
          </button>

          {notifOpen && (
            <>
              {/* Mobile backdrop for clean outside dismissal */}
              <div
                className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-[2px] sm:hidden"
                onClick={() => setNotifOpen(false)}
              />
              <div className="fixed left-3 right-3 top-[calc(max(env(safe-area-inset-top),0.5rem)+3.25rem)] w-auto max-w-md mx-auto sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mx-0 sm:w-80 sm:max-w-none glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-[100] border border-gray-100/80 dark:border-gray-800">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm font-display">
                      {t('notifications.title')}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline"
                    >
                      {t('notifications.markAllRead')}
                    </button>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Close notifications"
                    >
                      <X size={15} />
                    </button>
                  </div>
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
            </>
          )}
        </div>

        {/* Language Selector — Visible on all screen sizes (compact flag on mobile) */}
        <div ref={langRef} className="relative flex-shrink-0">
          <button
            id="language-selector"
            onClick={() => {
              setLangOpen(!langOpen);
              setNotifOpen(false);
              setAccountOpen(false);
            }}
            className="flex items-center gap-1 p-1.5 sm:px-2 py-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-primary-600 transition-all duration-150 hover:scale-105 active:scale-95 text-xs flex-shrink-0"
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
            <>
              {/* Mobile backdrop for clean outside dismissal */}
              <div
                className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-[2px] sm:hidden"
                onClick={() => setLangOpen(false)}
              />
              <div className="absolute right-0 sm:right-0 top-full mt-2 w-48 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slide-down z-[100] border border-gray-100/80 dark:border-gray-800">
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
            </>
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
            className="p-0.5 rounded-full text-gray-700 dark:text-gray-200 hover:scale-105 active:scale-95 transition-all duration-150 group focus:outline-none flex-shrink-0"
            aria-label={t('header.accountSettings', 'User profile and account settings')}
            title={user?.name || 'User Profile'}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xs shadow-sm ring-2 ring-emerald-500/30 group-hover:ring-emerald-500 group-hover:shadow-emerald-500/25 transition-all flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>

          {accountOpen && (
            <>
              {/* Mobile backdrop for clean outside dismissal */}
              <div
                className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-[2px] sm:hidden"
                onClick={() => setAccountOpen(false)}
              />
              <div
                id="profile-dropdown-menu"
                className="fixed left-3 right-3 top-[calc(max(env(safe-area-inset-top),0.5rem)+3.25rem)] w-auto max-w-md mx-auto sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mx-0 sm:w-80 sm:max-w-none max-h-[calc(100dvh-5rem)] overflow-y-auto glass-panel rounded-2xl shadow-2xl animate-slide-down z-[100] border border-gray-100/90 dark:border-gray-800"
              >
                {/* User Identity Banner */}
                <div className="p-4 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-dark-850 dark:to-dark-900 border-b border-gray-100 dark:border-gray-800 relative">
                  <button
                    onClick={() => setAccountOpen(false)}
                    className="sm:hidden absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 transition-colors"
                    aria-label="Close profile menu"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex items-center gap-3 pr-6 sm:pr-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0">
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

              {/* Primary Workspace Dashboard Link */}
              <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                <Link
                  id="header-workspace-link"
                  to={workspaceRoute}
                  onClick={() => {
                    setAccountOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-gray-800 dark:text-gray-100 text-xs font-bold transition-all group cursor-pointer border border-emerald-200/40 dark:border-emerald-800/40"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard size={15} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-bold text-xs truncate">
                      {userRole === 'admin'
                        ? t('nav.adminConsole', 'System Admin Portal')
                        : userRole === 'agronomist'
                          ? t('nav.agronomistPortal', 'Agronomist Command Center')
                          : t('nav.dashboard', 'Farmer Workspace Dashboard')}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-normal truncate">
                      {userRole === 'admin'
                        ? t('header.adminConsoleDesc', 'Platform control & governance')
                        : userRole === 'agronomist'
                          ? t('header.agronomistDesc', 'Regional diagnostics & farm telemetry')
                          : t('header.farmerDesc', 'Field telemetry, alerts & operations')}
                    </p>
                  </div>
                  <ChevronRight size={13} className="text-emerald-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </Link>
              </div>

              {/* Role-Specific Exploring Options */}
              <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                <div className="px-2 pt-1 pb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {t('header.exploreTools', 'Explore Tools')}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded uppercase">
                    {userRole}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {(ROLE_EXPLORING_LINKS[userRole] || ROLE_EXPLORING_LINKS.farmer).map((tool) => (
                    <Link
                      key={tool.route}
                      id={`profile-explore-${tool.route.replace('/', '')}`}
                      to={tool.route}
                      onClick={() => {
                        setAccountOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0">
                        <tool.icon size={13} />
                      </div>
                      <span className="truncate flex-1">{t(tool.labelKey, tool.fallbackLabel)}</span>
                      <ChevronRight size={12} className="text-gray-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Navigation Options: Account & Preferences */}
              <div className="p-1.5">
                <Link
                  id="header-settings-link"
                  to="/settings"
                  onClick={() => {
                    setAccountOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-200 text-xs font-bold transition-colors group cursor-pointer"
                >
                  <Settings size={15} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-left">{t('header.accountPreferences', 'Account & Preferences')}</span>
                  <ChevronRight size={13} className="text-gray-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </Link>
              </div>

              {/* Explicit Logout Action */}
              <div className="p-1.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-dark-900/40">
                <button
                  id="header-logout-btn"
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAccountOpen(false);
                    try {
                      logout();
                    } catch (err) {
                      console.warn('Logout fallback:', err);
                    }
                    toast.info(t('auth.signedOutSuccess', 'Signed out successfully.'));
                    navigate('/login', { replace: true, state: null });
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-100/70 dark:bg-red-950/70 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                    <LogOut size={14} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="leading-tight truncate">{t('common.signOut', 'Sign Out')}</p>
                    <p className="text-[10px] text-gray-400 font-normal truncate">{t('header.endSession', 'End active session')}</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
        </>
      )}

      {/* Global Smart Farm Report Modal */}
      <SmartFarmReport isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </header>
  );
};

export default Header;
