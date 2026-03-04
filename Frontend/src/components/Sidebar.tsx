import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, TrendingUp, Droplets, FlaskConical,
    Satellite, CloudLightning, Thermometer, Sprout,
    Award, Settings, Info, X, Leaf, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/yield', icon: TrendingUp, labelKey: 'nav.yieldPrediction' },
    { to: '/irrigation', icon: Droplets, labelKey: 'nav.irrigation' },
    { to: '/soil', icon: FlaskConical, labelKey: 'nav.soilHealth' },
    { to: '/crop-health', icon: Satellite, labelKey: 'nav.cropHealth' },
    { to: '/climate', icon: CloudLightning, labelKey: 'nav.climateRisk' },
];

const hackathonItems = [
    { to: '/simulator', icon: Thermometer, labelKey: 'nav.climateSimulator' },
    { to: '/crop-switching', icon: Sprout, labelKey: 'nav.cropSwitching' },
    { to: '/sustainability', icon: Award, labelKey: 'nav.sustainability' },
];

const bottomItems = [
    { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
    { to: '/about', icon: Info, labelKey: 'nav.about' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavItem = ({ to, icon: Icon, labelKey }: typeof navItems[0]) => (
        <NavLink
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
                isActive ? 'nav-item-active' : 'nav-item'
            }
        >
            <Icon size={18} />
            <span className="truncate">{t(labelKey)}</span>
        </NavLink>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Panel */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 gradient-green rounded-xl flex items-center justify-center shadow-md">
                            <Leaf size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-gray-900 dark:text-white font-display leading-none">AgriFlux</h1>
                            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">AI Agriculture</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Core Modules</p>
                    {navItems.map(item => <NavItem key={item.to} {...item} />)}

                    <div className="pt-4">
                        <p className="px-3 text-xs font-semibold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-2">🏆 Hackathon Features</p>
                        {hackathonItems.map(item => <NavItem key={item.to} {...item} />)}
                    </div>
                </nav>

                {/* User & Bottom Items */}
                <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-3 space-y-1">
                    {bottomItems.map(item => <NavItem key={item.to} {...item} />)}

                    {/* User profile */}
                    <div className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                        <div className="w-8 h-8 gradient-green rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {user?.name?.charAt(0).toUpperCase() || 'F'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Farmer'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.farmName || 'My Farm'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
