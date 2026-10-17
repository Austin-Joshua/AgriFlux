import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Leaf,
  Map,
  Sparkles,
  Shield,
  Users,
  Activity,
  FileText,
  Microscope,
  Calendar,
  Satellite,
  CloudLightning,
  ToggleRight,
  LucideIcon,
} from 'lucide-react';
import SmartFarmReport from './SmartFarmReport';
import { useAuth } from '../context/AuthContext';

interface BottomTab {
  to: string;
  icon: LucideIcon;
  label: string;
}

/**
 * Mobile-only bottom navigation bar.
 * Rendered inside Layout, visible on screens < lg.
 * Native iOS / Material 3 dock aesthetics with role-aware tabs and a central floating action button (FAB).
 */
const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [reportOpen, setReportOpen] = useState(false);

  const role = user?.role || 'farmer';

  // Role-specific bottom items (2 left, 1 center FAB, 2 right = 5 items total for perfect bilateral symmetry)
  let leftItems: BottomTab[];
  let rightItems: BottomTab[];
  let fabConfig: {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    isActive: boolean;
  };

  if (role === 'admin') {
    leftItems = [
      { to: '/admin', icon: Shield, label: 'Console' },
      { to: '/admin?tab=users', icon: Users, label: 'Users' },
    ];
    rightItems = [
      { to: '/admin?tab=system', icon: Activity, label: 'System' },
      { to: '/admin?tab=activity', icon: FileText, label: 'Audit' },
    ];
    fabConfig = {
      icon: ToggleRight,
      label: 'Actuators',
      onClick: () => navigate('/admin?tab=actuators'),
      isActive: location.pathname === '/admin' && location.search.includes('tab=actuators'),
    };
  } else if (role === 'agronomist') {
    leftItems = [
      { to: '/agronomist', icon: Microscope, label: 'Portal' },
      { to: '/soil', icon: Leaf, label: 'Soil Lab' },
    ];
    rightItems = [
      { to: '/crop-health', icon: Satellite, label: 'NDVI' },
      { to: '/climate', icon: CloudLightning, label: 'Climate' },
    ];
    fabConfig = {
      icon: Calendar,
      label: 'Advisory',
      onClick: () => navigate('/agronomist?tab=consultations'),
      isActive: location.pathname === '/agronomist' && location.search.includes('tab=consultations'),
    };
  } else {
    // Farmer
    leftItems = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
      { to: '/soil', icon: Leaf, label: 'Soil' },
    ];
    rightItems = [
      { to: '/marketplace', icon: Store, label: 'Market' },
      { to: '/land-intelligence', icon: Map, label: 'Land' },
    ];
    fabConfig = {
      icon: Sparkles,
      label: 'AI Report',
      onClick: () => setReportOpen(true),
      isActive: reportOpen,
    };
  }

  const checkIsActive = (to: string) => {
    const [targetPath, targetQuery] = to.split('?');
    if (location.pathname !== targetPath) return false;
    if (!targetQuery) {
      const currentParams = new URLSearchParams(location.search);
      const tab = currentParams.get('tab');
      return !tab || tab === 'overview';
    }
    const currentParams = new URLSearchParams(location.search);
    const targetParams = new URLSearchParams(targetQuery);
    for (const [k, v] of targetParams.entries()) {
      if (currentParams.get(k) !== v) return false;
    }
    return true;
  };

  const renderTab = ({ to, icon: Icon, label }: BottomTab) => {
    const active = checkIsActive(to);

    return (
      <NavLink
        key={to}
        to={to}
        className={
          `flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 transition-all duration-150 active:scale-95 select-none ${
            active
              ? 'text-primary-600 dark:text-primary-400 font-bold'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`
        }
      >
        <div
          className={`px-3 py-1 rounded-full flex items-center justify-center transition-all duration-200 ${
            active
              ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 shadow-xs'
              : 'hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <Icon size={19} className={`transition-transform duration-150 ${active ? 'scale-110' : ''}`} />
        </div>
        <span
          className={`text-[9.5px] leading-tight mt-0.5 truncate max-w-full tracking-tight ${
            active ? 'font-bold' : 'font-medium'
          }`}
        >
          {label}
        </span>
        {active && (
          <span className="w-1 h-1 rounded-full bg-primary-600 dark:bg-primary-400 mt-0.5" />
        )}
      </NavLink>
    );
  };

  const FabIcon = fabConfig.icon;

  return (
    <>
      <SmartFarmReport isOpen={reportOpen} onClose={() => setReportOpen(false)} />

      {/* Mobile/Tablet Bottom Navigation Bar — hidden on desktop (lg:hidden) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 w-full max-w-full overflow-hidden pointer-events-auto shadow-2xl"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}
        aria-label="Mobile Navigation"
      >
        <div className="glass-sidebar border-t border-gray-200/70 dark:border-gray-700/50 px-2 pt-1.5 pb-1 flex items-center justify-between w-full max-w-full backdrop-blur-xl">
          {/* Left 2 Tabs */}
          {leftItems.map(renderTab)}

          {/* Central Elevated Floating Action Button */}
          <button
            onClick={fabConfig.onClick}
            className="flex flex-col items-center -mt-5 group px-1 flex-shrink-0 active:scale-90 transition-transform duration-150 focus:outline-none"
            aria-label={fabConfig.label}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-150 border-2 border-white dark:border-gray-900 group-hover:scale-105 ${
                fabConfig.isActive
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/40 scale-105'
                  : 'bg-gradient-to-tr from-primary-600 via-primary-500 to-emerald-400 shadow-primary-500/35'
              }`}
            >
              <FabIcon size={21} className="text-white" />
            </div>
            <span className="text-[9.5px] font-black tracking-tight text-primary-700 dark:text-primary-300 mt-0.5 whitespace-nowrap">
              {fabConfig.label}
            </span>
          </button>

          {/* Right 2 Tabs */}
          {rightItems.map(renderTab)}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
