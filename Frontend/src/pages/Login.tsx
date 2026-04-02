import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Leaf, Phone, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGoogleLogin } from '@react-oauth/google';
import logo from '../assets/logo.jpg';
import { GoogleIcon, MicrosoftIcon, AppleIcon } from '../components/SocialIcons';
import SEO from '../components/SEO';

const Login: React.FC = () => {
    const { t } = useTranslation();
    const { login, loginWithProvider, isLoading } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const roleCreds: Record<string, { phone: string; password: string }> = {
        farmer: { phone: '9876543210', password: 'password123' },
        agronomist: { phone: '8765432109', password: 'agro123' },
        admin: { phone: '7654321098', password: 'admin123' },
    };

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [socialLoading, setSocialLoading] = useState<string | null>(null);
    const [loginMode, setLoginMode] = useState<'farmer' | 'agronomist' | 'admin'>('farmer');

    const switchMode = (mode: 'farmer' | 'agronomist' | 'admin') => {
        setLoginMode(mode);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const loggedInUser = await login(identifier, password);
            const role = loggedInUser?.role || loginMode;
            toast.success(`Welcome back, ${loggedInUser?.name || 'User'}!`);
            if (role === 'admin') navigate('/admin');
            else if (role === 'agronomist') navigate('/agronomist');
            else navigate('/dashboard');
        } catch (err) {
            setError('Invalid credentials. Please try again.');
            toast.error('Invalid credentials. Please check your phone and password.');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: tokenResponse => {
            console.log('Google login success:', tokenResponse);
            handleSocialLogin('google');
        },
        onError: () => {
            setError('Google login failed. Please try again.');
            toast.error('Google login failed.');
        }
    });

    const openMockProviderPopup = (provider: 'microsoft' | 'apple') => {
        setSocialLoading(provider);
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            'about:blank',
            `${provider}-login`,
            `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
        );

        if (popup) {
            popup.document.write(`
                <html>
                    <head>
                        <title>Sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}</title>
                        <style>
                            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
                            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #16a34a; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; }
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        </style>
                    </head>
                    <body>
                        <div class="loader"></div>
                        <p>Connecting to ${provider}...</p>
                        <script>
                            setTimeout(() => {
                                window.close();
                            }, 1500);
                        </script>
                    </body>
                </html>
            `);

            const interval = setInterval(() => {
                if (popup.closed) {
                    clearInterval(interval);
                    handleSocialLogin(provider);
                }
            }, 500);
        } else {
            setSocialLoading(null);
            setError('Popup blocked. Please allow popups for this site.');
            toast.warning('Popup blocked. Please allow popups.');
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'microsoft' | 'apple') => {
        setSocialLoading(provider);
        setError('');
        try {
            await loginWithProvider(provider, loginMode);
            toast.success(`Success! Logged in with ${provider}.`);
            if (loginMode === 'admin') navigate('/admin');
            else if (loginMode === 'agronomist') navigate('/agronomist');
            else navigate('/dashboard');
        } catch {
            setError('Social login failed. Please try again.');
            toast.error('Social login failed.');
        } finally {
            setSocialLoading(null);
        }
    };

    return (
        <div className="w-full h-full flex flex-col justify-center">
            <SEO title="Sign In" />
            
            {/* Mobile Branding (only visible on mobile) */}
            <div className="lg:hidden flex flex-col items-center mb-10 text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl mb-4 p-2">
                    <img src={logo} alt="AgriFlux" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display leading-tight">{t('auth.welcomeBack')} 👋</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Sign in to your farm intelligence dashboard</p>
            </div>

            {/* Desktop Message Header */}
            <div className="mb-8 hidden lg:block">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white font-display leading-tight">{t('auth.welcomeBack')} 👋</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">Sign in to access premium agricultural insights.</p>
            </div>

            {/* Login Mode Tabs (Matching Website Style) */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-2xl p-1 mb-6 border border-gray-200 dark:border-white/5">
                {(['farmer', 'agronomist', 'admin'] as const).map(mode => (
                    <button
                        key={mode}
                        onClick={() => switchMode(mode)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${loginMode === mode
                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-[1.03]'
                            : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                            }`}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            {/* Role Demo Hint */}
            <div className="mb-6 p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 text-[11px] text-primary-700 dark:text-primary-400 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                <span className="font-bold">{loginMode.toUpperCase()} Mode:</span>
                <span className="font-mono opacity-80">{roleCreds[loginMode].phone}</span>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div className="space-y-1.5">
                    <label className="label text-xs uppercase tracking-widest font-bold opacity-60 ml-1">Phone or Email</label>
                    <div className="relative group">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            id="identifier-input"
                            type="text"
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            className="input-field pl-12 h-12 bg-white/50 dark:bg-gray-900/40 border-gray-200 dark:border-white/5 hover:border-primary-300 transition-all text-sm"
                            placeholder="Enter phone or email"
                            autoComplete="off"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between mb-1">
                        <label className="label text-xs uppercase tracking-widest font-bold opacity-60 ml-1 mb-0">{t('auth.password')}</label>
                        <Link to="/forgot-password" className="text-[10px] text-primary-600 dark:text-primary-400 font-bold hover:underline">
                            {t('auth.forgotPassword')}
                        </Link>
                    </div>
                    <div className="relative group">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            id="password-input"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input-field pl-12 pr-12 h-12 bg-white/50 dark:bg-gray-900/40 border-gray-200 dark:border-white/5 hover:border-primary-300 transition-all text-sm"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <button
                    id="login-submit"
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-500/10 mt-4 active:scale-95"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            Authenticating...
                        </span>
                    ) : t('auth.login')}
                </button>
            </form >

            {/* Social Login */}
            <div className="mt-8">
                <div className="relative flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">{t('auth.orContinueWith', 'Or continue with')}</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: 'google', icon: <GoogleIcon />, action: () => googleLogin() },
                        { id: 'microsoft', icon: <MicrosoftIcon />, action: () => openMockProviderPopup('microsoft') },
                        { id: 'apple', icon: <AppleIcon className={isDark ? 'text-white' : 'text-black'} />, action: () => openMockProviderPopup('apple') }
                    ].map(provider => (
                        <button
                            key={provider.id}
                            type="button"
                            onClick={provider.action}
                            disabled={!!socialLoading || isLoading}
                            className={`flex items-center justify-center py-3.5 border border-gray-100 dark:border-white/5 rounded-2xl bg-white/50 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-900 transition-all hover:shadow-xl hover:-translate-y-1 group ${provider.id === 'apple' && isDark ? 'hover:border-white/20' : ''}`}
                        >
                            <div className="scale-110 group-hover:scale-125 transition-transform">
                                {socialLoading === provider.id ? (
                                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                ) : provider.icon}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <p className="mt-8 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('auth.noAccount')}{' '}
                <Link to="/register" className="text-primary-600 dark:text-primary-400 font-black hover:underline ml-1">
                    {t('auth.register')}
                </Link>
            </p>
        </div>
    );
};

export default Login;
