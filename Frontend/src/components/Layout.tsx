import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistantChat from './AIAssistantChat';

interface LayoutProps { children: React.ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const mainMargin = sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            <Sidebar
                isOpen={sidebarOpen}
                collapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
                onCollapseToggle={() => setSidebarCollapsed(prev => !prev)}
            />

            <div className={`flex-1 flex flex-col min-w-0 ${mainMargin} transition-all duration-300`}>
                <Header
                    onMenuClick={() => setSidebarOpen(true)}
                    onCollapseToggle={() => setSidebarCollapsed(prev => !prev)}
                />
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>

            <AIAssistantChat />
        </div>
    );
};

export default Layout;
