import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Phone, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo-icon.png';
import { GoogleIcon } from '../components/SocialIcons';
import SEO from '../components/SEO';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { login, loginWithProvider, isLoading, requiresOnboarding, isAuthenticated, user } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'farmer' | 'agronomist' | 'admin'>('farmer');

  // Handle redirection after auth state updates or if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (requiresOnboarding) {
        navigate('/onboarding');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'agronomist') {
        navigate('/agronomist');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, requiresOnboarding, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const source = params.get('source');
    const autoUser = params.get('identifier');
    const autoPass = params.get('password');

    if (source === 'citizenone' && autoUser && autoPass) {
      // Auto-login for seamless integration
      const performAutoLogin = async () => {
        try {
          setIdentifier(autoUser);
          setPassword(autoPass);
          const loggedInUser = await login(autoUser, autoPass);
          const role = loggedInUser?.role || loginMode;
          toast.success(`Seamlessly logged in from CitizenOne as ${loggedInUser?.name || 'User'}`);
          if (role === 'admin') navigate('/admin');
          else if (role === 'agronomist') navigate('/agronomist');
          else navigate('/dashboard');
        } catch (err) {
          console.error('Auto-login failed:', err);
        }
      };
      performAutoLogin();
    }
  }, [location, login, loginMode, navigate]);

  const DEMO_CREDENTIALS = {
    farmer: {
      identifier: 'farmer@agriflux.com',
      password: 'password123',
      label: '🌾 Farmer Workspace',
      desc: 'Smart Farm Dashboard, IoT Telemetry, Yield & Closed-Loop Engine',
      route: '/dashboard',
    },
    agronomist: {
      identifier: 'agronomist@agriflux.com',
      password: 'agro123',
      label: '🔬 Agronomist Portal',
      desc: 'Expert Consultation Queue, Soil Health Labs & Advisory Dispatch',
      route: '/agronomist',
    },
    admin: {
      identifier: 'admin@agriflux.com',
      password: 'admin123',
      label: '🛡️ Admin Console',
      desc: 'System Security, User Roles, Audit Logs & Global Telemetry',
      route: '/admin',
    },
  };

  // Pre-fill credentials on mount for instantaneous testing with zero friction
  useEffect(() => {
    if (!identifier && !password) {
      setIdentifier(DEMO_CREDENTIALS.farmer.identifier);
      setPassword(DEMO_CREDENTIALS.farmer.password);
    }
  }, []);

  const switchMode = (mode: 'farmer' | 'agronomist' | 'admin') => {
    setLoginMode(mode);
    setIdentifier(DEMO_CREDENTIALS[mode].identifier);
    setPassword(DEMO_CREDENTIALS[mode].password);
    setError('');
  };

  const handleQuickDemoLogin = async () => {
    setError('');
    try {
      const creds = DEMO_CREDENTIALS[loginMode];
      const loggedInUser = await login(creds.identifier, creds.password);
      const role = loggedInUser?.role || loginMode;
      toast.success(`Welcome to AgriFlux as ${loggedInUser?.name || creds.label}!`);
      if (role === 'admin') navigate('/admin');
      else if (role === 'agronomist') navigate('/agronomist');
      else navigate('/dashboard');
    } catch {
      setError('Instant demo authentication failed. Please try again.');
      toast.error('Demo authentication error.');
    }
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
    } catch {
      setError('Invalid credentials. Please try again.');
      toast.error('Invalid credentials. Please check your email and password.');
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    setSocialLoading(provider);
    setError('');
    try {
      await loginWithProvider(provider, loginMode);
      toast.success(`Welcome back! Successfully authenticated via ${provider}.`);

      // If onboarding is NOT required, navigate to dashboard immediately
      // (onboarding is handled by the useEffect above)
      if (!requiresOnboarding) {
        if (loginMode === 'admin') navigate('/admin');
        else if (loginMode === 'agronomist') navigate('/agronomist');
        else navigate('/dashboard');
      }
    } catch {
      setError(`${provider} login failed. Please try again.`);
      toast.error(`${provider} login failed.`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <SEO title="Sign In" />

      {/* Mobile Branding (only visible on mobile) */}
      <div className="lg:hidden flex flex-col items-center mb-10 text-center">
        <div className="relative p-0.5 rounded-2xl bg-gradient-to-tr from-primary-500 via-primary-600 to-teal-500 shadow-xl shadow-primary-500/20 mb-4 flex-shrink-0">
          <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-[14px] flex items-center justify-center p-2">
            <img src={logo} alt="AgriFlux Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display leading-tight">
          {t('auth.welcomeBack')} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">{t('auth.loginSubtitle')}</p>
      </div>

      {/* Desktop Message Header */}
      <div className="mb-8 hidden lg:block">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white font-display leading-tight">
          {t('auth.welcomeBack')} 👋
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
          {t('auth.loginDesktopDesc')}
        </p>
      </div>

      {/* Login Mode Tabs (Matching Website Style) */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-2xl p-1 mb-3 border border-gray-200 dark:border-white/5">
        {(['farmer', 'agronomist', 'admin'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => switchMode(mode)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              loginMode === mode
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-[1.03]'
                : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
            }`}
          >
            {mode === 'farmer' ? '🌾 Farmer' : mode === 'agronomist' ? '🔬 Agronomist' : '🛡️ Admin'}
          </button>
        ))}
      </div>

      {/* Role Scope Description */}
      <div className="mb-5 px-3.5 py-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
        <p className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
          <span>{DEMO_CREDENTIALS[loginMode].label}</span>
        </p>
        <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 leading-snug">
          {DEMO_CREDENTIALS[loginMode].desc}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <div className="space-y-1.5">
          <label className="label text-xs uppercase tracking-widest font-bold opacity-60 ml-1">
            {t('auth.email')}
          </label>
          <div className="relative group">
            <Phone
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors"
            />
            <input
              id="identifier-input"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input-field pl-12 h-12 bg-white/50 dark:bg-gray-900/40 border-gray-200 dark:border-white/5 hover:border-primary-300 transition-all text-sm"
              placeholder={t('auth.placeholderEmail')}
              autoComplete="off"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <label className="label text-xs uppercase tracking-widest font-bold opacity-60 ml-1 mb-0">
              {t('auth.password')}
            </label>
            <Link
              to="/forgot-password"
              className="text-[10px] text-primary-600 dark:text-primary-400 font-bold hover:underline"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <div className="relative group">
            <Lock
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors"
            />
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {t('auth.authenticating')}
            </span>
          ) : (
            t('auth.login')
          )}
        </button>

        <button
          type="button"
          onClick={handleQuickDemoLogin}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 border border-emerald-400/30 hover-lift mt-2"
        >
          <span>⚡ Instant Demo Access ({DEMO_CREDENTIALS[loginMode].label.split(' ')[1]})</span>
        </button>
      </form>

      {/* Social Login */}
      <div className="mt-8">
        <div className="relative flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
            {t('auth.orContinueWith', 'Or continue with')}
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/5" />
        </div>
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={!!socialLoading || isLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 hover-lift active-press group"
        >
          {socialLoading === 'google' ? (
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="scale-105 group-hover:scale-115 transition-transform duration-200">
              <GoogleIcon />
            </div>
          )}
          <span>Continue with Google</span>
        </button>
      </div>

      <p className="mt-8 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
        {t('auth.noAccount')}{' '}
        <Link
          to="/register"
          className="text-primary-600 dark:text-primary-400 font-black hover:underline ml-1"
        >
          {t('auth.register')}
        </Link>
      </p>
    </div>
  );
};

export default Login;
