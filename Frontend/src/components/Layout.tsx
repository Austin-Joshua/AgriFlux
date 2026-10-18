import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import { ArrowLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-gray-50 dark:bg-gray-900 flex">
      {/* Skip to Content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg z-[200] font-bold text-xs"
      >
        {t('common.skipToContent', 'Skip to main content')}
      </a>

      {/* Accessible Live Region Announcer */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="accessibility-announcer"
      ></div>

      {isFromCitizenOne && (
        <a
          href="https://citizenone.vercel.app"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-gradient-to-r from-teal-500 to-primary-600 text-white px-5 py-2.5 rounded-full shadow-2xl hover:scale-105 hover:shadow-primary-500/50 transition-all font-black text-sm uppercase tracking-widest border border-white/20 backdrop-blur-md"
        >
          <ArrowLeft size={16} />
          {t('common.backToCitizenOne', 'Back to CitizenOne')}
        </a>
      )}

      {/* Desktop Sidebar (Permanent and stable on lg+) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden lg:ml-64 transition-all duration-200">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {/* Extra top padding if CitizenOne banner is visible; extra bottom padding on mobile for bottom nav */}
        <main
          id="main-content"
          className={`flex-1 w-full max-w-full p-2.5 sm:p-4 md:p-6 overflow-x-hidden overflow-y-auto pb-32 lg:pb-8 ${isFromCitizenOne ? 'pt-16' : ''}`}
        >
          <div className="w-full max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Nav (hidden on lg+) */}
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
