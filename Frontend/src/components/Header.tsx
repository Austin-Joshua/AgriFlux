import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Menu, Sun, Moon, Globe, Settings, Bell, Search, ChevronDown
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
    onMenuClick: () => void;
}

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
    { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
];

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { isDark, toggleTheme } = useTheme();
    const { user } = useAuth();
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const [langOpen, setLangOpen] = useState(false);

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        setLangOpen(false);
    };

    return (
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-4 shadow-sm">
            {/* Hamburger */}
            <button
                id="hamburger-menu"
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Open menu"
            >
                <Menu size={22} />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Search crops, insights..."
                    className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none flex-1"
                />
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <button
                    className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Language Selector */}
                <div className="relative">
                    <button
                        id="language-selector"
                        onClick={() => setLangOpen(!langOpen)}
                        className="flex items-center gap-1.5 p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                    >
                        <Globe size={18} />
                        <span className="hidden sm:inline font-medium">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                        <ChevronDown size={14} />
                    </button>
                    {langOpen && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700
                    ${i18n.language === lang.code ? 'text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-300'}`}
                                >
                                    <span>{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    id="theme-toggle"
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Toggle theme"
                >
                    {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
                </button>

                {/* Settings Icon */}
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `p-2 rounded-lg transition-colors ${isActive
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`
                    }
                    aria-label="Settings"
                >
                    <Settings size={20} />
                </NavLink>

                {/* User Avatar */}
                <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <div className="w-8 h-8 gradient-green rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'F'}
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                        {user?.name || 'Farmer'}
                    </span>
                </button>
            </div>

            {/* Click outside to close lang dropdown */}
            {langOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
            )}
        </header>
    );
};

export default Header;
