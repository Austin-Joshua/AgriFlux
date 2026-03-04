import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Leaf, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import logo from '../assets/logo.jpg';

const Login: React.FC = () => {
    const { t } = useTranslation();
    const { login, loginWithProvider, isLoading } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const roleCreds: Record<string, { email: string; password: string }> = {
        farmer: { email: 'user@agriflux.ai', password: 'password123' },
        agronomist: { email: 'agronomist@agriflux.ai', password: 'agro123' },
        admin: { email: 'admin@agriflux.ai', password: 'admin123' },
    };

    const [email, setEmail] = useState('user@agriflux.ai');
    const [password, setPassword] = useState('password123');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [socialLoading, setSocialLoading] = useState<string | null>(null);
    const [loginMode, setLoginMode] = useState<'farmer' | 'agronomist' | 'admin'>('farmer');

    const switchMode = (mode: 'farmer' | 'agronomist' | 'admin') => {
        setLoginMode(mode);
        setEmail(roleCreds[mode].email);
        setPassword(roleCreds[mode].password);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password, loginMode);
            if (loginMode === 'admin') navigate('/admin');
            else if (loginMode === 'agronomist') navigate('/agronomist');
            else navigate('/dashboard');
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'microsoft' | 'apple') => {
        setSocialLoading(provider);
        setError('');
        try {
            await loginWithProvider(provider, loginMode);
            if (loginMode === 'admin') navigate('/admin');
            else if (loginMode === 'agronomist') navigate('/agronomist');
            else navigate('/dashboard');
        } catch {
            setError('Social login failed. Please try again.');
        } finally {
            setSocialLoading(null);
        }
    };

    return (
        <div className="min-h-screen flex relative" style={{ background: 'linear-gradient(135deg, #071a0e 0%, #0a2318 50%, #0d2e1c 100%)' }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
            />

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md text-gray-600 dark:text-gray-400 hover:scale-110 transition-all"
            >
                {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>

            {/* Left Panel — Branding */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white relative overflow-hidden shadow-2xl border-r border-white/5" style={{ background: 'linear-gradient(160deg, #0a2e1a 0%, #0f4a2a 40%, #0d3a20 100%)' }}>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-400 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                </div>

                <div className="relative">
                    <div className="flex flex-col items-start gap-4 mb-12">
                        <div className="h-20 bg-black/40 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl overflow-hidden px-4">
                            <img src={logo} alt="AgriFlux Logo" className="h-16 w-auto object-contain" />
                        </div>
                        <div className="pl-2">
                            <p className="text-gold-300 font-bold text-xs uppercase tracking-widest">Premium AI Agriculture</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold font-display leading-tight">
                            Smart Farming<br />Starts Here
                        </h2>
                        <p className="text-primary-100 text-lg leading-relaxed">
                            AI-powered crop yield prediction, climate intelligence, and precision agriculture tools for the modern farmer.
                        </p>
                    </div>
                </div>

                <div className="relative space-y-4">
                    {[
                        { emoji: '🌾', text: 'AI Crop Yield Prediction', sub: 'Machine learning models for accurate forecasts' },
                        { emoji: '🌦️', text: 'Climate Risk Forecasting', sub: 'Real-time weather intelligence' },
                        { emoji: '💧', text: 'Smart Irrigation', sub: 'Precision water management' },
                    ].map(item => (
                        <div key={item.text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <span className="text-2xl">{item.emoji}</span>
                            <div>
                                <p className="font-semibold text-sm">{item.text}</p>
                                <p className="text-primary-200 text-xs">{item.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel — Login Form */}
            <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'linear-gradient(160deg, #061610 0%, #0a2318 100%)' }}>
                <div className="w-full max-w-md animate-slide-up">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="h-16 rounded-2xl flex items-center justify-center shadow-md overflow-hidden bg-white dark:bg-black/40 px-4 border border-gray-100 dark:border-gray-800">
                            <img src={logo} alt="AgriFlux Logo" className="h-12 w-auto object-contain" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-dark-xl border border-gray-100 dark:border-gray-700 p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white font-display leading-tight">{t('auth.welcomeBack')} 👋</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">Sign in to your premium farm intelligence dashboard</p>
                        </div>

                        {/* Login Mode Tabs */}
                        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-5">
                            {(['farmer', 'agronomist', 'admin'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => switchMode(mode)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all duration-300 ${loginMode === mode
                                        ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-glow-gold scale-105'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gold-600'
                                        }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                        {/* Role hint */}
                        <div className="mb-4 p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 text-xs text-primary-700 dark:text-primary-400 flex items-center gap-2">
                            <span className="font-bold">{loginMode === 'farmer' ? '🌾 Farmer' : loginMode === 'agronomist' ? '🔬 Agronomist' : '🛡️ Admin'} Mode:</span>
                            <span className="font-mono">{roleCreds[loginMode].email}</span>
                            <span className="opacity-60">/ {roleCreds[loginMode].password}</span>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">{t('auth.email')}</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="email-input"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="input-field pl-10"
                                        placeholder="user@agriflux.ai"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="label mb-0">{t('auth.password')}</label>
                                    <Link to="/forgot-password" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                                        {t('auth.forgotPassword')}
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="password-input"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="input-field pl-10 pr-10"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                id="login-submit"
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full py-4 text-base relative shadow-glow-green mt-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                        Authenticating...
                                    </span>
                                ) : t('auth.login')}
                            </button>
                        </form>

                        {/* Social Login */}
                        <div className="mt-5">
                            <div className="relative flex items-center gap-3 mb-4">
                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                                <span className="text-xs text-gray-400 font-medium">{t('auth.orContinueWith', 'Or continue with')}</span>
                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {([
                                    { id: 'google', label: 'Google', emoji: '🔍' },
                                    { id: 'microsoft', label: 'Microsoft', emoji: '🪟' },
                                    { id: 'apple', label: 'Apple', emoji: '🍎' },
                                ] as const).map(p => (
                                    <button
                                        key={p.id}
                                        id={`${p.id}-login`}
                                        type="button"
                                        onClick={() => handleSocialLogin(p.id)}
                                        disabled={!!socialLoading || isLoading}
                                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {socialLoading === p.id ? (
                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-primary-600 rounded-full animate-spin" />
                                        ) : <span>{p.emoji}</span>}
                                        <span className="hidden sm:inline text-xs">{socialLoading === p.id ? 'Signing in…' : p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
                            {t('auth.noAccount')}{' '}
                            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                                {t('auth.register')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
