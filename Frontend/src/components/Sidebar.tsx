import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  TrendingUp,
  Droplets,
  FlaskConical,
  Satellite,
  CloudLightning,
  Sprout,
  Award,
  Settings,
  Info,
  X,
  LogOut,
  Landmark,
  BarChart3,
  Handshake,
  Map,
  Store,
  Tractor,
  PhoneCall,
  Wind,
  Shield,
  Microscope,
  Users,
  Cpu,
  ToggleRight,
  Activity,
  Calendar,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../assets/logo-icon.png';

interface SidebarProps {
  isOpen: boolean;
  collapsed: boolean;
  onClose: () => void;
}

interface NavItemData {
  to: string;
  icon: LucideIcon;
  labelKey: string;
  fallback: string;
  badge?: string;
  badgeColor?: string;
}

const farmerNavItems: NavItemData[] = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', fallback: 'Dashboard' },
  { to: '/yield', icon: TrendingUp, labelKey: 'nav.yieldPrediction', fallback: 'Yield Prediction' },
  { to: '/irrigation', icon: Droplets, labelKey: 'nav.irrigation', fallback: 'Smart Irrigation' },
  { to: '/soil', icon: FlaskConical, labelKey: 'nav.soilIntelligence', fallback: 'Soil Intelligence' },
  { to: '/crop-health', icon: Satellite, labelKey: 'nav.cropHealth', fallback: 'Crop Health' },
  { to: '/climate', icon: CloudLightning, labelKey: 'nav.climateRisk', fallback: 'Climate Risk' },
  { to: '/simulator', icon: Wind, labelKey: 'nav.climateSimulator', fallback: 'Climate Simulator' },
  { to: '/crop-switching', icon: Sprout, labelKey: 'nav.cropSwitching', fallback: 'Crop Switching' },
  { to: '/sustainability', icon: Award, labelKey: 'nav.sustainability', fallback: 'Sustainability' },
  { to: '/land-intelligence', icon: Map, labelKey: 'nav.landIntelligence', fallback: 'Land Intelligence' },
  { to: '/market', icon: BarChart3, labelKey: 'nav.market', fallback: 'Market Analysis' },
  { to: '/subsidies', icon: Landmark, labelKey: 'nav.subsidies', fallback: 'Subsidies' },
  { to: '/marketplace', icon: Store, labelKey: 'nav.marketplace', fallback: 'Marketplace' },
  { to: '/equipment-rental', icon: Tractor, labelKey: 'nav.equipmentRental', fallback: 'Equipment Rental' },
  { to: '/book-consultation', icon: PhoneCall, labelKey: 'nav.bookConsultation', fallback: 'Book Consultation' },
  { to: '/investors', icon: Handshake, labelKey: 'nav.investors', fallback: 'Investors Hub' },
];

const agronomistNavItems: NavItemData[] = [
  { to: '/agronomist', icon: Microscope, labelKey: 'nav.agronomistPortal', fallback: 'Command Center' },
  { to: '/agronomist?tab=consultations', icon: Calendar, labelKey: 'nav.consultationsQueue', fallback: 'Consultations' },
  { to: '/soil', icon: FlaskConical, labelKey: 'nav.soilIntelligence', fallback: 'Soil Lab & Diagnosis' },
  { to: '/crop-health', icon: Satellite, labelKey: 'nav.cropHealth', fallback: 'Satellite NDVI Health' },
  { to: '/land-intelligence', icon: Map, labelKey: 'nav.landIntelligence', fallback: 'Land Intelligence' },
  { to: '/yield', icon: TrendingUp, labelKey: 'nav.yieldPrediction', fallback: 'Yield Analytics' },
  { to: '/irrigation', icon: Droplets, labelKey: 'nav.irrigation', fallback: 'Water Deficit & Irrigation' },
  { to: '/climate', icon: CloudLightning, labelKey: 'nav.climateRisk', fallback: 'Climate & Pest Risk' },
  { to: '/simulator', icon: Wind, labelKey: 'nav.climateSimulator', fallback: 'Stress Simulator' },
  { to: '/crop-switching', icon: Sprout, labelKey: 'nav.cropSwitching', fallback: 'Crop Resilience Engine' },
  { to: '/sustainability', icon: Award, labelKey: 'nav.sustainability', fallback: 'Sustainability Audit' },
];

const adminNavItems: NavItemData[] = [
  { to: '/admin', icon: Shield, labelKey: 'nav.adminConsole', fallback: 'Admin Console' },
  { to: '/admin?tab=users', icon: Users, labelKey: 'nav.adminUsers', fallback: 'User Governance' },
  { to: '/admin?tab=system', icon: Cpu, labelKey: 'nav.adminSystem', fallback: 'Cloud & Infrastructure' },
  { to: '/admin?tab=actuators', icon: ToggleRight, labelKey: 'nav.adminActuators', fallback: 'Actuator Overrides' },
  { to: '/admin?tab=activity', icon: Activity, labelKey: 'nav.adminActivity', fallback: 'Security Audit Logs' },
];

const adminDirectPortals: NavItemData[] = [
  {
    to: '/agronomist',
    icon: Microscope,
    labelKey: 'nav.agronomistPortal',
    fallback: 'Agronomist Portal',
    badge: 'PORTAL',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    labelKey: 'nav.farmerPreview',
    fallback: 'Farmer View',
    badge: 'PREVIEW',
    badgeColor: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  },
];

const bottomItems: NavItemData[] = [
  { to: '/settings', icon: Settings, labelKey: 'nav.settings', fallback: 'Settings' },
  { to: '/about', icon: Info, labelKey: 'nav.about', fallback: 'About AgriFlux' },
];

// Standalone memoized NavItem component: declared outside Sidebar so DOM elements are reconciled
// without unmounting and remounting on each route change, completely preserving scroll position.
interface NavItemProps extends NavItemData {
  collapsed: boolean;
  onClick: () => void;
  currentPath: string;
  currentSearch: string;
}

const NavItem: React.FC<NavItemProps> = React.memo(
  ({ to, icon: Icon, labelKey, fallback, badge, badgeColor, collapsed, onClick, currentPath, currentSearch }) => {
    const { t } = useTranslation();

    const isItemActive = useMemo(() => {
      const [targetPath, targetQuery] = to.split('?');
      if (currentPath !== targetPath) return false;
      if (!targetQuery) {
        // When target has no query params, active only if current URL has no tab param or tab=overview
        const currentParams = new URLSearchParams(currentSearch);
        const tab = currentParams.get('tab');
        return !tab || tab === 'overview';
      }
      const currentParams = new URLSearchParams(currentSearch);
      const targetParams = new URLSearchParams(targetQuery);
      for (const [k, v] of targetParams.entries()) {
        if (currentParams.get(k) !== v) return false;
      }
      return true;
    }, [currentPath, currentSearch, to]);

    const label = t(labelKey, fallback);

    return (
      <NavLink
        to={to}
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={
          `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer group relative overflow-hidden select-none
          ${collapsed ? 'justify-center' : ''}
          ${
            isItemActive
              ? 'bg-gradient-to-r from-primary-500/20 to-teal-500/10 text-primary-700 dark:text-primary-300 shadow-sm border border-primary-200/50 dark:border-primary-700/30 font-semibold'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/40 hover:text-primary-700 dark:hover:text-primary-300'
          }`
        }
      >
        {isItemActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-primary-500 to-teal-500 rounded-r-full" />
        )}
        <Icon
          size={18}
          className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
            isItemActive ? 'text-primary-600 dark:text-primary-400' : ''
          }`}
        />
        {!collapsed && (
          <span className="truncate max-w-[145px] xl:max-w-[165px] flex-1 text-left">{label}</span>
        )}
        {!collapsed && badge && (
          <span
            className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-md uppercase ${
              badgeColor || 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
            }`}
          >
            {badge}
          </span>
        )}
      </NavLink>
    );
  }
);

NavItem.displayName = 'NavItem';

const Sidebar: React.FC<SidebarProps> = ({ isOpen, collapsed, onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  // Restore sidebar scroll position across navigation and clicks
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem('agriflux_sidebar_scroll');
    if (saved && navRef.current) {
      navRef.current.scrollTop = Number(saved);
    }
  }, [location.pathname, location.search]);

  const handleNavScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem('agriflux_sidebar_scroll', String(navRef.current.scrollTop));
    }
  };

  const handleNavClick = () => {
    // Preserve scroll position
    if (navRef.current) {
      sessionStorage.setItem('agriflux_sidebar_scroll', String(navRef.current.scrollTop));
    }
    // Only close drawer overlay on mobile / small screens
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Signed out successfully.');
    navigate('/login');
  };

  const w = collapsed ? 'lg:w-[72px]' : 'lg:w-64';

  // Role-specific navigation items selection
  const userRole = user?.role || 'farmer';
  const roleNavItems =
    userRole === 'admin'
      ? adminNavItems
      : userRole === 'agronomist'
        ? agronomistNavItems
        : farmerNavItems;

  const roleBadge =
    userRole === 'admin'
      ? { label: '🛡️ ADMIN', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200/50' }
      : userRole === 'agronomist'
        ? { label: '🔬 AGRONOMIST', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200/50' }
        : { label: '🌾 FARMER', color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200/50' };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 h-[100dvh] pb-6 lg:pb-0 lg:h-screen ${w} glass-sidebar z-50 transform transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center justify-between px-4 py-5 border-b border-white/10 dark:border-gray-700/30 ${
            collapsed ? 'px-3' : ''
          }`}
        >
          <div
            onClick={() => {
              if (userRole === 'admin') navigate('/admin');
              else if (userRole === 'agronomist') navigate('/agronomist');
              else navigate('/dashboard');
            }}
            className={`flex items-center gap-2.5 cursor-pointer transition-transform duration-200 hover:scale-[1.03] ${
              collapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="relative p-0.5 rounded-xl bg-gradient-to-tr from-primary-500 via-primary-600 to-teal-500 shadow-md shadow-primary-500/25 flex-shrink-0">
              <div className="w-8 h-8 rounded-[10px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden p-0.5">
                <img src={logo} alt="AgriFlux Logo" className="h-full w-full object-contain" />
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col text-left">
                <span className="text-sm font-black text-gray-900 dark:text-white leading-none tracking-tight">
                  {t('common.agriflux', 'AgriFlux')}
                </span>
                <span className="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-0.5">
                  {userRole === 'admin'
                    ? 'Admin Command'
                    : userRole === 'agronomist'
                      ? 'Consulting Suite'
                      : t('common.intelligencePlatform', 'Intelligence Platform')}
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Primary Role-Aware Nav Links Container with Scroll Persistence */}
        <nav
          ref={navRef}
          onScroll={handleNavScroll}
          className="flex-1 px-3 py-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
        >
          {roleNavItems.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              collapsed={collapsed}
              onClick={handleNavClick}
              currentPath={location.pathname}
              currentSearch={location.search}
            />
          ))}

          {/* Admin Direct Inspection Portals */}
          {userRole === 'admin' && (
            <>
              <div className="pt-3 pb-1 px-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {!collapsed ? 'Direct Portals' : '•••'}
                </p>
              </div>
              {adminDirectPortals.map((item) => (
                <NavItem
                  key={item.to}
                  {...item}
                  collapsed={collapsed}
                  onClick={handleNavClick}
                  currentPath={location.pathname}
                  currentSearch={location.search}
                />
              ))}
            </>
          )}
        </nav>

        {/* Bottom Preferences & User Profile */}
        <div className="border-t border-white/10 dark:border-gray-700/30 px-3 py-3 space-y-1">
          {bottomItems.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              collapsed={collapsed}
              onClick={handleNavClick}
              currentPath={location.pathname}
              currentSearch={location.search}
            />
          ))}

          {/* User Profile Card */}
          {!collapsed ? (
            <div className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl glass-card-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {user?.name || 'AgriFlux User'}
                  </p>
                </div>
                <div className="mt-0.5">
                  <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-md ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-110 flex-shrink-0"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-full flex justify-center p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
