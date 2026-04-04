import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Leaf, ArrowLeft, Search } from 'lucide-react';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-6">
            <div className="max-w-lg w-full text-center space-y-8 animate-fade-in-up">

                {/* Illustration */}
                <div className="relative mx-auto w-40 h-40">
                    <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-full animate-pulse-slow" />
                    <div className="absolute inset-4 bg-primary-50 dark:bg-primary-900/20 rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <Leaf size={48} className="text-primary-500 mx-auto mb-1" />
                            <span className="text-5xl font-black text-gradient leading-none">404</span>
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display">
                        Page Not Found
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 text-base leading-relaxed max-w-sm mx-auto">
                        The page you're looking for doesn't exist or has been moved. Let's get you back to your farm.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    {[
                        { label: 'Dashboard', route: '/dashboard', icon: Home },
                        { label: 'Marketplace', route: '/marketplace', icon: Search },
                        { label: 'Soil Advisor', route: '/soil', icon: Leaf },
                        { label: 'Crop Health', route: '/crop-health', icon: Leaf },
                    ].map(({ label, route, icon: Icon }) => (
                        <button
                            key={route}
                            onClick={() => navigate(route)}
                            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600 hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Icon size={16} className="text-primary-500" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 rounded-xl font-semibold transition-all"
                    >
                        <ArrowLeft size={16} />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        <Home size={16} />
                        Back to Dashboard
                    </button>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-600">
                    AgriFlux AI · Smart Agricultural Intelligence Platform
                </p>
            </div>
        </div>
    );
};

export default NotFoundPage;
