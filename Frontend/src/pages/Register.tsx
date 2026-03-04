import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Wheat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import logo from '../assets/logo.jpg';

const Register: React.FC = () => {
    const { t } = useTranslation();
    const { register, loginWithProvider, isLoading } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [socialLoading, setSocialLoading] = useState<string | null>(null);

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
            setError('Passwords do not match');
            return;
        }
        setError('');
        try {
            await register(form);
            navigate('/dashboard');
        } catch {
            setError('Registration failed. Please try again.');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: tokenResponse => {
            console.log('Google signup success:', tokenResponse);
            handleSocialSignup('google');
        },
        onError: () => setError('Google sign-up failed. Please try again.'),
    });

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
            setError('Popup blocked. Please allow popups for this site.');
        }
    };

    const handleSocialSignup = async (provider: 'google' | 'microsoft' | 'apple') => {
        setSocialLoading(provider);
        setError('');
        try {
            await loginWithProvider(provider, 'farmer');
            navigate('/dashboard');
        } catch {
            setError('Social sign-up failed. Please try again.');
        } finally {
            setSocialLoading(null);
        }
    };

    const fields = [
        { name: 'name', label: t('auth.fullName'), icon: User, type: 'text', placeholder: 'Ravi Kumar', required: true },
        { name: 'email', label: t('auth.email'), icon: Mail, type: 'email', placeholder: 'ravi@farm.com', required: true },
        { name: 'farmName', label: t('auth.farmName'), icon: Wheat, type: 'text', placeholder: 'Green Valley Farm', required: false },
        { name: 'phone', label: t('auth.phone'), icon: Phone, type: 'tel', placeholder: '+91 9876543210', required: false },
        { name: 'location', label: t('auth.location'), icon: MapPin, type: 'text', placeholder: 'Karnataka, India', required: false },
    ];

    return (
        <div className="login-bg min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
            />

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md text-gray-600 dark:text-gray-400 hover:scale-110 transition-all z-50"
            >
                {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>

            <div className="w-full max-w-lg animate-slide-up relative z-10">
                <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-4 border border-primary-200 dark:border-primary-800/50 overflow-hidden bg-white dark:bg-gray-800 transition-all duration-700">
                        <img src={logo} alt="AgriFlux Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display tracking-tightest transition-colors duration-700">Join AgriFlux</h1>
                    <p className="text-primary-600 dark:text-amber-400/80 text-xs font-bold uppercase tracking-widest mt-2 transition-colors duration-700">Precision AI Agriculture Intelligence</p>
                </div>

                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 p-8 transition-all duration-700">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {fields.map(field => (
                                <div key={field.name} className={field.name === 'email' ? 'sm:col-span-2' : ''}>
                                    <label className="label">{field.label}</label>
                                    <div className="relative">
                                        <field.icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type={field.type}
                                            name={field.name}
                                            value={form[field.name as keyof typeof form]}
                                            onChange={handleChange}
                                            className="input-field pl-10"
                                            placeholder={field.placeholder}
                                            required={field.required}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="label">{t('auth.password')}</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="input-field pl-10 pr-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="label">{t('auth.confirmPassword')}</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className="input-field pl-10"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="btn-primary w-full py-4 text-base mt-2 shadow-glow-green hover:scale-[1.02] active:scale-[0.98] transition-all">
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating account...
                                </span>
                            ) : t('auth.register')}
                        </button>
                    </form>

                    {/* Social Sign Up */}
                    <div className="mt-5">
                        <div className="relative flex items-center gap-3 mb-4">
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                            <span className="text-xs text-gray-400 font-medium">Or sign up with</span>
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
                                    type="button"
                                    onClick={() => p.id === 'google' ? googleLogin() : openMockProviderPopup(p.id)}
                                    disabled={!!socialLoading || isLoading}
                                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {socialLoading === p.id
                                        ? <div className="w-4 h-4 border-2 border-gray-400 border-t-primary-600 rounded-full animate-spin" />
                                        : <span>{p.emoji}</span>}
                                    <span className="hidden sm:inline text-xs">{socialLoading === p.id ? 'Signing up…' : p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {t('auth.hasAccount')}{' '}
                        <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                            {t('auth.login')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
