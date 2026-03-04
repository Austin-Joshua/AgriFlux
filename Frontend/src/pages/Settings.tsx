import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Globe, Moon, Sun, Bell, Shield, Save, Camera, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
];

type Section = 'profile' | 'appearance' | 'language' | 'notifications' | 'security';

const Settings: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { isDark, toggleTheme } = useTheme();
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState<Section>('profile');
    const [saved, setSaved] = useState(false);

    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        farmName: user?.farmName || '',
        location: user?.location || '',
        cropTypes: 'Rice, Wheat',
    });

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const sidebarItems: { key: Section; label: string; icon: React.ElementType }[] = [
        { key: 'profile', label: 'Profile', icon: User },
        { key: 'appearance', label: 'Appearance', icon: isDark ? Moon : Sun },
        { key: 'language', label: 'Language', icon: Globe },
        { key: 'notifications', label: 'Notifications', icon: Bell },
        { key: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center md:flex-row md:items-start justify-between gap-4 text-center md:text-left">
                <div>
                    <h1 className="page-header text-gradient font-extrabold">{t('settings.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Manage your premium AgriFlux farm account preferences</p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="badge-gold py-1.5 px-3 shadow-sm border border-gold-200 dark:border-gold-800">
                        ⭐ Premium Account
                    </span>
                </div>
            </div>

            <div className="flex gap-6 flex-col lg:flex-row">
                {/* Sidebar tabs */}
                <div className="lg:w-56 flex-shrink-0">
                    <div className="card glass-gold border-gold-300 dark:border-gold-800/40 p-2 space-y-1">
                        {sidebarItems.map(item => (
                            <button
                                key={item.key}
                                id={`settings-${item.key}`}
                                onClick={() => setActiveSection(item.key)}
                                className={activeSection === item.key
                                    ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-glow-gold w-full'
                                    : 'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 hover:text-gold-700 w-full'}
                            >
                                <item.icon size={16} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 card">
                    {/* Profile */}
                    {activeSection === 'profile' && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4 pb-5 border-b border-gray-100 dark:border-gray-700">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-glow-gold">
                                        {user?.name?.charAt(0) || 'F'}
                                    </div>
                                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-gold-700 transition-colors border-2 border-white dark:border-gray-800">
                                        <Camera size={12} />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-gray-900 dark:text-white font-display tracking-tight">{user?.name}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{user?.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="badge-gold px-2 py-0.5 text-[10px]">VERIFIED FARMER</span>
                                        <span className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">PRO PLAN</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { key: 'name', label: 'Full Name', placeholder: 'Enter your name' },
                                    { key: 'email', label: 'Email', placeholder: 'your@email.com', type: 'email' },
                                    { key: 'phone', label: 'Phone', placeholder: '+91 9876543210', type: 'tel' },
                                    { key: 'farmName', label: 'Farm Name', placeholder: 'Green Valley Farm' },
                                    { key: 'location', label: 'Location', placeholder: 'Karnataka, India' },
                                    { key: 'cropTypes', label: 'Primary Crops', placeholder: 'Rice, Wheat, Corn' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="label">{f.label}</label>
                                        <input
                                            type={f.type || 'text'}
                                            value={profile[f.key as keyof typeof profile]}
                                            onChange={e => setProfile(prev => ({ ...prev, [f.key]: e.target.value }))}
                                            className="input-field"
                                            placeholder={f.placeholder}
                                        />
                                    </div>
                                ))}
                            </div>

                            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                                {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> {t('settings.saveChanges')}</>}
                            </button>
                        </div>
                    )}

                    {/* Appearance */}
                    {activeSection === 'appearance' && (
                        <div className="space-y-4">
                            <h3 className="section-header">{t('settings.theme')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { label: 'Light Mode', value: 'light', icon: Sun, desc: 'Clean, bright interface for daytime use' },
                                    { label: 'Dark Mode', value: 'dark', icon: Moon, desc: 'Easy on the eyes for night-time use' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        id={`theme-${opt.value}`}
                                        onClick={() => (isDark ? opt.value === 'light' : opt.value === 'dark') && toggleTheme()}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${(isDark ? opt.value === 'dark' : opt.value === 'light')
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        <opt.icon size={24} className={isDark && opt.value === 'dark' ? 'text-primary-500' : !isDark && opt.value === 'light' ? 'text-primary-500' : 'text-gray-400'} />
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{opt.label}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                                        </div>
                                        {((isDark && opt.value === 'dark') || (!isDark && opt.value === 'light')) && (
                                            <CheckCircle size={16} className="text-primary-500 ml-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Language */}
                    {activeSection === 'language' && (
                        <div className="space-y-4">
                            <h3 className="section-header">{t('settings.language')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        id={`lang-${lang.code}`}
                                        onClick={() => i18n.changeLanguage(lang.code)}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${i18n.language === lang.code
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <span className="text-3xl">{lang.flag}</span>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{lang.label}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{lang.native}</p>
                                        </div>
                                        {i18n.language === lang.code && (
                                            <CheckCircle size={16} className="text-primary-500 ml-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeSection === 'notifications' && (
                        <div className="space-y-4">
                            <h3 className="section-header">Notification Preferences</h3>
                            {[
                                { label: 'Yield Prediction Alerts', sub: 'Get notified when AI predicts yield changes', on: true },
                                { label: 'Irrigation Reminders', sub: 'Scheduled irrigation notifications', on: true },
                                { label: 'Climate Risk Alerts', sub: 'Severe weather and drought warnings', on: true },
                                { label: 'Soil Health Reports', sub: 'Weekly soil analysis summaries', on: false },
                                { label: 'Market Price Updates', sub: 'Crop market price notifications', on: false },
                            ].map((n, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{n.label}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{n.sub}</p>
                                    </div>
                                    <button
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${n.on ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${n.on ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Security */}
                    {activeSection === 'security' && (
                        <div className="space-y-4">
                            <h3 className="section-header">Security Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Current Password</label>
                                    <input type="password" className="input-field" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="label">New Password</label>
                                    <input type="password" className="input-field" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="label">Confirm New Password</label>
                                    <input type="password" className="input-field" placeholder="••••••••" />
                                </div>
                                <button className="btn-primary">Update Password</button>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Two-Factor Authentication</p>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable 2FA</p>
                                            <p className="text-xs text-gray-500">Extra layer of security for your account</p>
                                        </div>
                                        <button className="btn-outline text-sm py-1.5 px-3">Enable</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
