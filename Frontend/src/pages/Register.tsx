import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Wheat, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.jpg';
import { GoogleIcon, MicrosoftIcon, AppleIcon } from '../components/SocialIcons';
import SEO from '../components/SEO';

const Register: React.FC = () => {
    const { t } = useTranslation();
    const { register, loginWithProvider, isLoading, requiresOnboarding } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        farmName: '', phone: '', location: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError(t('auth.passwordsMatchError'));
            toast.warning(t('auth.passwordsMatchError'));
            return;
        }
        setError('');
        try {
            await register(form);
            toast.success('Account created successfully! Welcome to AgriFlux.');
            navigate('/dashboard');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(msg);
            toast.error(msg);
        }
    };

    const [socialLoading, setSocialLoading] = useState<string | null>(null);

    // Handle redirection after auth state updates
    React.useEffect(() => {
        if (!isLoading && requiresOnboarding) {
            navigate('/onboarding');
        }
    }, [isLoading, requiresOnboarding, navigate]);

    const handleSocialSignup = async (provider: 'google' | 'microsoft' | 'apple') => {
        setSocialLoading(provider);
        setError('');
        try {
            await loginWithProvider(provider, 'farmer');
            toast.success(`Welcome! Successfully authenticated via ${provider}.`);
        } catch (err: any) {
            setError(`${provider} sign-up failed. Please try again.`);
            toast.error(`${provider} sign-up failed.`);
        } finally {
            setSocialLoading(null);
        }
    };

    const openMockProviderPopup = (provider: 'microsoft' | 'apple') => {
        setSocialLoading(provider);
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            'about:blank',
            `${provider}-signup`,
            `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
        );

        if (popup) {
            popup.document.write(`
                <html>
                    <head>
                        <title>Sign up with ${provider.charAt(0).toUpperCase() + provider.slice(1)}</title>
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
                    handleSocialSignup(provider);
                }
            }, 500);
        } else {
            setSocialLoading(null);
            setError('Popup blocked. Please allow popups.');
            toast.warning('Popup blocked. Please allow popups.');
        }
    };


    const fields = [
        { name: 'name', label: t('auth.fullName'), icon: User, type: 'text', placeholder: t('auth.placeholderName'), required: true },
        { name: 'email', label: t('auth.email'), icon: Mail, type: 'email', placeholder: t('auth.placeholderEmail'), required: true },
        { name: 'farmName', label: t('auth.farmName'), icon: Wheat, type: 'text', placeholder: t('auth.placeholderFarm'), required: false },
        { name: 'phone', label: t('auth.phone'), icon: Phone, type: 'tel', placeholder: t('auth.placeholderPhone'), required: false },
        { name: 'location', label: t('auth.location'), icon: MapPin, type: 'text', placeholder: t('auth.placeholderLocation'), required: false },
    ];

    return (
        <div className="w-full h-full flex flex-col justify-center py-4">
            <SEO title="Create Account" />
            
            {/* Mobile Branding */}
            <div className="lg:hidden flex flex-col items-center mb-6 text-center">
                <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl mb-3 p-2">
                    <img src={logo} alt="AgriFlux" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white font-display leading-tight">{t('auth.joinTitle')}</h1>
                <p className="text-primary-600 dark:text-amber-400/80 text-[10px] font-bold uppercase tracking-widest mt-1">{t('auth.register')}</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2 text-red-600 dark:text-red-400 text-[11px] font-bold">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    {fields.map(field => (
                        <div key={field.name} className="space-y-1">
                            <label className="label text-[10px] uppercase tracking-widest font-bold opacity-60 ml-1 block leading-none">{field.label}</label>
                            <div className="relative group">
                                <field.icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={form[field.name as keyof typeof form]}
                                    onChange={handleChange}
                                    className="input-field pl-11 h-10 bg-white/50 dark:bg-gray-900/40 border-gray-200 dark:border-white/5 hover:border-primary-300 transition-all text-sm"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    autoComplete={field.name === 'email' ? 'email' : 'off'}
                                />
                            </div>
                        </div>
                    ))}

                    <div className="space-y-1">
                        <label className="label text-[10px] uppercase tracking-widest font-bold opacity-60 ml-1 block leading-none">{t('auth.password')}</label>
                        <div className="relative group">
                            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                className="input-field pl-11 h-10 bg-white/50 dark:bg-gray-900/40 border-gray-200 dark:border-white/5 hover:border-primary-300 transition-all text-sm"
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="label text-[10px] uppercase tracking-widest font-bold opacity-60 ml-1 block leading-none">{t('auth.confirmPassword')}</label>
                        <div className="relative group">
                            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                className="input-field pl-11 h-10 bg-white/50 dark:bg-gray-900/40 border-gray-200 dark:border-white/5 hover:border-primary-300 transition-all text-sm"
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-1">
                     <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[10px] text-primary-600 font-bold uppercase tracking-widest hover:underline"
                     >
                        {showPassword ? 'Hide Password' : 'Show Password'}
                     </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full h-11 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/10 mt-2 active:scale-[0.98] transition-transform"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                             {t('auth.creatingAccount')}
                        </span>
                    ) : t('auth.register')}
                </button>
            </form>

            <div className="mt-4">
                <div className="relative flex items-center gap-4 mb-3">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Or join with</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'google', icon: <GoogleIcon />, action: () => handleSocialSignup('google') },
                        { id: 'microsoft', icon: <MicrosoftIcon />, action: () => openMockProviderPopup('microsoft') },
                        { id: 'apple', icon: <AppleIcon className={isDark ? 'text-white' : 'text-black'} />, action: () => openMockProviderPopup('apple') }
                    ].map(provider => (
                        <button
                            key={provider.id}
                            type="button"
                            onClick={provider.action}
                            disabled={!!socialLoading || isLoading}
                            className="flex items-center justify-center h-10 border border-gray-100 dark:border-white/5 rounded-xl bg-white/50 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-900 transition-all group"
                        >
                            <div className="scale-90 group-hover:scale-100 transition-transform">
                                {socialLoading === provider.id ? (
                                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                ) : provider.icon}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <p className="mt-5 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('auth.hasAccount')}{' '}
                <Link to="/login" className="text-primary-600 dark:text-primary-400 font-black hover:underline ml-1">
                    {t('auth.login')}
                </Link>
            </p>
        </div>
    );
};

export default Register;
