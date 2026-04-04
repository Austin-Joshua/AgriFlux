import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Store, Tractor, Leaf, Map,
    Sparkles
} from 'lucide-react';
import SmartFarmReport from './SmartFarmReport';
import { useState } from 'react';

const BOTTOM_ITEMS = [
    { to: '/dashboard',         icon: LayoutDashboard, label: 'Home' },
    { to: '/marketplace',       icon: Store,           label: 'Market' },
    { to: '/soil',              icon: Leaf,            label: 'Soil' },
    { to: '/land-intelligence', icon: Map,             label: 'Land' },
    { to: '/equipment-rental',  icon: Tractor,         label: 'Equip' },
];

/**
 * Mobile-only bottom navigation bar.
 * Rendered inside Layout, only visible on screens < lg.
 * Includes a central "AI Report" floating action button.
 */
const MobileBottomNav: React.FC = () => {
    const [reportOpen, setReportOpen] = useState(false);

    return (
        <>
            <SmartFarmReport isOpen={reportOpen} onClose={() => setReportOpen(false)} />

            {/* Bottom bar — lg:hidden so it disappears on desktop */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-inset-bottom"
                 style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="glass-sidebar border-t border-gray-200/60 dark:border-gray-700/40 px-2 pt-2 pb-3 flex items-center justify-around gap-1">
                    {BOTTOM_ITEMS.map(({ to, icon: Icon, label }, i) => {
                        // Insert FAB in the middle (after index 1)
                        const fab = i === 2 ? (
                            <button
                                key="ai-fab"
                                onClick={() => setReportOpen(true)}
                                className="flex flex-col items-center -mt-8 group"
                                aria-label="Generate Smart Farm Report"
                            >
                                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary-600 to-green-500 flex items-center justify-center shadow-xl shadow-primary-500/30 group-hover:scale-110 group-active:scale-95 transition-transform">
                                    <Sparkles size={22} className="text-white" />
                                </div>
                                <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 mt-1">AI Report</span>
                            </button>
                        ) : null;

                        const navItem = (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] ${
                                        isActive
                                            ? 'text-primary-600 dark:text-primary-400'
                                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                            isActive
                                                ? 'bg-primary-50 dark:bg-primary-900/30 scale-110'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}>
                                            <Icon size={20} />
                                        </div>
                                        <span className="text-[10px] font-semibold leading-none">{label}</span>
                                    </>
                                )}
                            </NavLink>
                        );

                        return (
                            <React.Fragment key={to}>
                                {i === 2 && fab}
                                {navItem}
                            </React.Fragment>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};

export default MobileBottomNav;
