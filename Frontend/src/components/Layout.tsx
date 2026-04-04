import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistantChat from './AIAssistantChat';
import MobileBottomNav from './MobileBottomNav';
import { ArrowLeft } from 'lucide-react';

interface LayoutProps { children: React.ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isFromCitizenOne, setIsFromCitizenOne] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('source') === 'citizenone') {
            localStorage.setItem('agriflux_source', 'citizenone');
            setIsFromCitizenOne(true);
        } else if (localStorage.getItem('agriflux_source') === 'citizenone') {
            setIsFromCitizenOne(true);
        }
    }, [location]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const mainMargin = sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {isFromCitizenOne && (
                <a
                    href="https://citizenone.vercel.app"
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-gradient-to-r from-teal-500 to-primary-600 text-white px-5 py-2.5 rounded-full shadow-2xl hover:scale-105 hover:shadow-primary-500/50 transition-all font-black text-sm uppercase tracking-widest border border-white/20 backdrop-blur-md"
                >
                    <ArrowLeft size={16} />
                    Back to CitizenOne
                </a>
            )}

            {/* Desktop Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                collapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
                onCollapseToggle={() => setSidebarCollapsed(prev => !prev)}
            />

            {/* Main content area */}
            <div className={`flex-1 flex flex-col min-w-0 ${mainMargin} transition-all duration-300`}>
                <Header
                    onMenuClick={() => setSidebarOpen(true)}
                    onCollapseToggle={() => setSidebarCollapsed(prev => !prev)}
                />
                {/* Extra top padding if CitizenOne banner is visible; extra bottom padding on mobile for bottom nav */}
                <main className={`flex-1 p-4 md:p-6 overflow-auto pb-24 lg:pb-6 ${isFromCitizenOne ? 'pt-16' : ''}`}>
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Nav (hidden on lg+) */}
            <MobileBottomNav />

            {/* Floating AI Chat — uses fixed positioning internally, offset class applied via CSS */}
            <AIAssistantChat />
        </div>
    );
};

export default Layout;
