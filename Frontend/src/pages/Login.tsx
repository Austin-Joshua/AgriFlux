import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAuth, UserRole } from '../context/AuthContext';
import { GoogleIcon } from '../components/SocialIcons';
import SEO from '../components/SEO';

const DEMO_ACCOUNTS = {
  farmer: {
    identifier: 'farmer@agriflux.com',
    password: 'password123',
    roleLabelKey: 'auth.roleFarmer',
    roleFallback: 'Farmer',
    badge: '🌾',
  },
  agronomist: {
    identifier: 'agronomist@agriflux.com',
    password: 'agro123',
    roleLabelKey: 'auth.roleAgronomist',
    roleFallback: 'Agronomist',
    badge: '🔬',
  },
  admin: {
    identifier: 'admin@agriflux.com',
    password: 'admin123',
    roleLabelKey: 'auth.roleAdmin',
    roleFallback: 'Admin',
    badge: '🛡️',
  },
};

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login, loginWithProvider, isLoading, requiresOnboarding, isAuthenticated, user } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  const [identifier, setIdentifier] = useState(DEMO_ACCOUNTS.farmer.identifier);
  const [password, setPassword] = useState(DEMO_ACCOUNTS.farmer.password);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Safe deep link redirect path helper (preserves target while defeating CWE-601 open redirects)
  const getSafeRedirect = useCallback(
    (userRole: string): string => {
      const stateObj = location.state as { from?: { pathname?: string } } | null;
      const fromPath = stateObj?.from?.pathname;
      if (
        typeof fromPath === 'string' &&
        fromPath.startsWith('/') &&
        !fromPath.startsWith('//') &&
        fromPath !== '/login' &&
        fromPath !== '/'
      ) {
        if (userRole === 'admin') {
          return fromPath.startsWith('/admin') ? fromPath : '/admin';
        }
        if (userRole === 'agronomist') {
          return fromPath.startsWith('/agronomist') ? fromPath : '/agronomist';
        }
        if (fromPath.startsWith('/admin') || fromPath.startsWith('/agronomist')) {
          return '/dashboard';
        }
        return fromPath;
      }
      return userRole === 'admin'
        ? '/admin'
        : userRole === 'agronomist'
          ? '/agronomist'
          : '/dashboard';
    },
    [location.state]
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (requiresOnboarding) {
        navigate('/onboarding');
      } else {
        navigate(getSafeRedirect(user.role));
      }
    }
  }, [isLoading, isAuthenticated, user, requiresOnboarding, navigate, getSafeRedirect]);

  // Safe identifier pre-fill from redirect params (e.g. following registration)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefillUser = params.get('identifier');
    if (prefillUser) {
      setIdentifier(prefillUser);
    }
  }, [location.search]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIdentifier(DEMO_ACCOUNTS[role].identifier);
    setPassword(DEMO_ACCOUNTS[role].password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError(t('auth.invalidCredentials', 'Please enter your email or phone number, and password.'));
      return;
    }

    setError('');
    try {
      const loggedInUser = await login(identifier.trim(), password);
      const role = loggedInUser?.role || selectedRole;
      toast.success(`${t('common.welcome', 'Welcome back')}, ${loggedInUser?.name || t('common.farmer', 'User')}!`);
      navigate(getSafeRedirect(role));
    } catch {
      setError(t('auth.invalidCredentials', 'Invalid credentials. Please verify your email/phone and password.'));
      toast.error(t('auth.invalidCredentials', 'Invalid credentials. Please try again.'));
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    setError('');
    try {
      await loginWithProvider('google', selectedRole);
      toast.success(t('auth.loginSuccess', 'Successfully signed in with Google.'));
      if (!requiresOnboarding) {
        navigate(getSafeRedirect(selectedRole));
      }
    } catch {
      setError('Google sign-in could not be completed. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <SEO title={t('auth.login', 'Sign In')} />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white font-display tracking-tight">
          {t('auth.welcomeBack', 'Welcome Back')} 👋
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-xs sm:text-sm">
          {t('auth.loginSubtitle', 'Sign in to access your farm intelligence and advisory')}
        </p>
      </div>

      {/* Simple Role Selector Tabs */}
      <div
        role="tablist"
        aria-label={t('admin.role', 'User Account Role')}
        className="flex gap-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl p-1 mb-5 border border-gray-200/60 dark:border-white/5"
      >
        {(['farmer', 'agronomist', 'admin'] as const).map((role) => {
          const acc = DEMO_ACCOUNTS[role];
          const isSelected = selectedRole === role;
          return (
            <button
              key={role}
              id={`login-role-${role}`}
              role="tab"
              aria-selected={isSelected}
              type="button"
              onClick={() => handleRoleSelect(role)}
              className={`flex-1 py-2.5 px-3 min-h-[44px] rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{acc.badge}</span>
              <span>{t(acc.roleLabelKey, acc.roleFallback)}</span>
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-medium"
        >
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        {/* Email or Phone Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="identifier-input"
            className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 block cursor-pointer"
          >
            {t('auth.emailOrPhone', 'Email or Phone Number')}
          </label>
          <div className="relative group">
            <User
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors"
            />
            <input
              id="identifier-input"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input-field pl-10 h-11 bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-white/10 hover:border-primary-400 transition-all text-xs sm:text-sm w-full rounded-xl"
              placeholder={t('auth.emailOrPhonePlaceholder', 'e.g. farmer@agriflux.com or 9876543210')}
              autoComplete="username"
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <label
              htmlFor="password-input"
              className="text-xs font-bold text-gray-700 dark:text-gray-300 block cursor-pointer"
            >
              {t('auth.password', 'Password')}
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
              {t('auth.forgotPassword', 'Forgot Password?')}
            </Link>
          </div>
          <div className="relative group">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors"
            />
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10 pr-10 h-11 bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-white/10 hover:border-primary-400 transition-all text-xs sm:text-sm w-full rounded-xl"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label={showPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Single Primary Sign In Button */}
        <button
          id="login-submit"
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full h-11 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg shadow-primary-500/15 mt-2 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('auth.authenticating', 'Signing in...')}</span>
            </>
          ) : (
            <span>{t('auth.login', 'Sign In')}</span>
          )}
        </button>
      </form>

      {/* Google Sign In */}
      <div className="mt-6">
        <div className="relative flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold leading-none">
            {t('auth.orContinueWith', 'or continue with')}
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
        </div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={!!socialLoading || isLoading}
          className="w-full flex items-center justify-center gap-2.5 h-11 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 font-semibold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all active:scale-[0.99]"
        >
          {socialLoading === 'google' ? (
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span>{t('auth.signInWithGoogle', 'Sign in with Google')}</span>
        </button>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        {t('auth.noAccount', "Don't have an account?")}{' '}
        <Link
          id="login-register-link"
          to="/register"
          className="text-primary-600 dark:text-primary-400 font-bold hover:underline ml-1"
        >
          {t('auth.createAccount', 'Create Account')}
        </Link>
      </p>
    </div>
  );
};

export default Login;
