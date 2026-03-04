import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, TrendingUp, Droplets, FlaskConical,
    Satellite, CloudLightning, Thermometer, Sprout,
    Award, Settings, Info, X, Leaf, LogOut, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpg';

interface SidebarProps {
    isOpen: boolean;
    collapsed: boolean;
    onClose: () => void;
    onCollapseToggle: () => void;
}

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { to: '/yield', icon: TrendingUp, labelKey: 'nav.yieldPrediction' },
    { to: '/irrigation', icon: Droplets, labelKey: 'nav.irrigation' },
    { to: '/soil', icon: FlaskConical, labelKey: 'nav.soilHealth' },
    { to: '/crop-health', icon: Satellite, labelKey: 'nav.cropHealth' },
    { to: '/climate', icon: CloudLightning, labelKey: 'nav.climateRisk' },
    { to: '/simulator', icon: Thermometer, labelKey: 'nav.climateSimulator' },
    { to: '/crop-switching', icon: Sprout, labelKey: 'nav.cropSwitching' },
    { to: '/sustainability', icon: Award, labelKey: 'nav.sustainability' },
];

const bottomItems = [
    { to: '/about', icon: Info, labelKey: 'nav.about' },
    { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, collapsed, onClose, onCollapseToggle }) => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const w = collapsed ? 'lg:w-[72px]' : 'lg:w-64';

    const NavItem = ({ to, icon: Icon, labelKey }: typeof navItems[0]) => (
        <NavLink to={to} onClick={onClose}
            title={collapsed ? t(labelKey) : undefined}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer group relative overflow-hidden
        ${collapsed ? 'justify-center' : ''}
        ${isActive
                    ? 'bg-gradient-to-r from-primary-500/20 to-gold-500/10 text-primary-700 dark:text-primary-300 shadow-sm border border-primary-200/50 dark:border-primary-700/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/40 hover:text-primary-700 dark:hover:text-primary-300'}`
            }>
            {({ isActive }) => (
                <>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-primary-500 to-gold-500 rounded-r-full" />}
                    <Icon size={18} className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                    {!collapsed && <span className="truncate">{t(labelKey)}</span>}
                </>
            )}
        </NavLink>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
            )}

            {/* Sidebar Panel */}
            <aside className={`fixed top-0 left-0 h-full ${w} glass-sidebar z-50 transform transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

                {/* Logo */}
                <div className={`flex items-center justify-between px-4 py-5 border-b border-white/10 dark:border-gray-700/30 ${collapsed ? 'px-3' : ''}`}>
                    <div
                        onClick={() => navigate('/dashboard')}
                        className={`flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity ${collapsed ? 'justify-center w-full' : ''}`}
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
                            <img src={logo} alt="AgriFlux Logo" className="w-full h-full object-cover" />
                        </div>
                        {!collapsed && (
                            <div>
                                <h1 className="font-bold text-lg text-gray-900 dark:text-white font-display leading-none">AgriFlux</h1>
                                <p className="text-xs bg-gradient-to-r from-primary-600 to-gold-500 text-transparent bg-clip-text font-semibold">AI Agriculture</p>
                            </div>
                        )}
                    </div>
                    {!collapsed && (
                        <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
                    {navItems.map(item => <NavItem key={item.to} {...item} />)}
                </nav>

                {/* Bottom Items */}
                <div className="border-t border-white/10 dark:border-gray-700/30 px-3 py-3 space-y-1">
                    {bottomItems.map(item => <NavItem key={item.to} {...item} />)}

                    {/* User profile */}
                    {!collapsed ? (
                        <div className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl glass-card-sm">
                            <div className="w-8 h-8 gradient-gold-green rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                                {user?.name?.charAt(0).toUpperCase() || 'F'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Farmer'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.farmName || 'My Farm'}</p>
                            </div>
                            <button onClick={handleLogout}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-110"
                                title="Logout">
                                <LogOut size={15} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleLogout} title="Logout"
                            className="w-full flex justify-center p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200">
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
