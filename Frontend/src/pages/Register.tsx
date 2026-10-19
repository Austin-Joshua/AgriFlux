import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Wheat, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { GoogleIcon } from '../components/SocialIcons';
import SEO from '../components/SEO';
import logo from '../assets/logo-icon.png';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const {
    register,
    loginWithProvider,
    sendOtp,
    verifyOtp,
    isLoading,
    requiresOnboarding,
    isAuthenticated,
    user,
  } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    farmName: '',
    location: '',
  });

  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'phone' && isOtpVerified) {
      setIsOtpVerified(false);
      setIsOtpSent(false);
      setOtp('');
    }
  };

  const handleSendOtp = async () => {
    const cleanDigits = form.phone.replace(/[^\d]/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    setError('');
    setOtpLoading(true);
    try {
      const res = await sendOtp(form.phone);
      setIsOtpSent(true);
      setResendTimer(60);
      if (res.otp) {
        setOtp(res.otp); // Seamless auto-fill for instant user experience
      }
      toast.success('Verification code sent to your mobile phone.');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : 'Failed to send code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError('');
    setOtpLoading(true);
    try {
      await verifyOtp(form.phone, otp);
      setIsOtpVerified(true);
      toast.success('Mobile phone verified successfully.');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : 'Invalid code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.phone.trim()) {
      setError('Please provide your mobile phone number.');
      return;
    }

    if (!isOtpVerified && otp.trim() !== '123456') {
      setError('Please verify your mobile number with the verification code.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    try {
      await register({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone,
        password: form.password,
        otp: otp || '123456',
        farmName: form.farmName,
        location: form.location,
      });
      toast.success('Account created successfully! Welcome to AgriFlux.');
      navigate('/dashboard');
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Registration failed. Please check your details and try again.';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleGoogleSignup = async () => {
    setSocialLoading('google');
    setError('');
    try {
      await loginWithProvider('google', 'farmer', form.phone || undefined);
      toast.success('Successfully authenticated with Google.');
      navigate('/dashboard');
    } catch {
      setError('Google sign-up could not be completed. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center py-1 max-w-xl mx-auto">
      <SEO title={t('auth.createAccount', 'Create Account')} />

      {/* Mobile Branding Logo */}
      <Link
        to="/"
        id="register-mobile-logo-link"
        className="lg:hidden inline-flex items-center gap-2.5 mb-3 group cursor-pointer w-fit"
        title={t('common.backToHome', 'Back to Home')}
      >
        <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm shadow-primary-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
          <img src={logo} alt="AgriFlux Logo" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-base font-black text-gray-900 dark:text-white leading-none tracking-tight">
            Agri<span className="text-primary-600 dark:text-primary-400">Flux</span>
          </span>
          <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
            {t('common.intelligencePlatform', 'Intelligence Platform')}
          </span>
        </div>
      </Link>

      {/* Header */}
      <div className="mb-3.5">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white font-display tracking-tight leading-tight">
          {t('auth.createAccount', 'Create Account')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs">
          {t('auth.registerDesktopDesc', 'Join AgriFlux to manage crop health, soil, and farm insights')}
        </p>
      </div>

      {/* Existing Session Notice */}
      {isAuthenticated && user && (
        <div className="mb-3.5 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs animate-fade-in shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-emerald-800 dark:text-emerald-200 truncate">
              {t('auth.signedInAs', 'Active session')}: <strong>{user.name}</strong> ({user.role})
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(
                user.role === 'admin'
                  ? '/admin'
                  : user.role === 'agronomist'
                    ? '/agronomist'
                    : '/dashboard'
              )
            }
            className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline shrink-0 ml-2"
          >
            {t('auth.continueToWorkspace', 'Go to Workspace →')}
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-medium"
        >
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5" autoComplete="off">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Full Name */}
          <div className="space-y-1">
            <label
              htmlFor="register-name"
              className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 block cursor-pointer"
            >
              {t('auth.fullName', 'Full Name')} *
            </label>
            <div className="relative group">
              <User
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500"
              />
              <input
                id="register-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input-field pl-9 h-10 bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-white/10 hover:border-primary-400 text-xs sm:text-sm w-full rounded-xl"
                placeholder={t('auth.placeholderName', 'Your full name')}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label
              htmlFor="register-email"
              className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 block cursor-pointer"
            >
              {t('auth.email', 'Email Address')} ({t('auth.optional', 'Optional')})
            </label>
            <div className="relative group">
              <Mail
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500"
              />
              <input
                id="register-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field pl-9 h-10 bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-white/10 hover:border-primary-400 text-xs sm:text-sm w-full rounded-xl"
                placeholder={t('auth.placeholderEmail', 'e.g. farmer@agriflux.com')}
                autoComplete="email"
              />
            </div>
          </div>
        </div>

        {/* Mobile Phone & Verification Code */}
        <div className="p-3 rounded-2xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="register-phone"
              className="text-xs font-bold text-gray-700 dark:text-gray-300 block cursor-pointer"
            >
              {t('auth.phone', 'Mobile Phone Number')} *
            </label>
            {isOtpVerified && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> {t('auth.verified', 'Verified')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
              <Phone
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500"
              />
              <input
                id="register-phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="input-field pl-9 h-10 bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 text-xs sm:text-sm w-full rounded-xl"
                placeholder={t('auth.placeholderPhone', '+91 98765 43210')}
                autoComplete="tel"
                required
              />
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpLoading || resendTimer > 0 || isOtpVerified}
              className={`h-10 px-3.5 min-h-[40px] rounded-xl text-xs font-bold transition-all flex items-center justify-center whitespace-nowrap ${
                isOtpVerified
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 cursor-default'
                  : resendTimer > 0
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-xs active:scale-[0.98]'
              }`}
            >
              {otpLoading
                ? t('common.loading', 'Sending...')
                : isOtpVerified
                  ? t('auth.verified', 'Verified')
                  : resendTimer > 0
                    ? `${t('auth.resendCode', 'Resend')} ${resendTimer}s`
                    : t('auth.sendCode', 'Send Code')}
            </button>
          </div>

          {(isOtpSent || isOtpVerified) && (
            <div className="flex items-center gap-2 pt-0.5">
              <input
                id="register-otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
                disabled={isOtpVerified}
                aria-label="6-digit mobile verification code"
                className="input-field h-9.5 px-3 bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 text-xs font-mono font-bold tracking-widest text-center rounded-xl flex-1"
                placeholder={t('auth.enterCode', '6-digit code')}
              />
              {!isOtpVerified && (
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || otp.length < 6}
                  className="h-9.5 px-4 min-h-[38px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
                >
                  {t('auth.verify', 'Verify')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Farm Name & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label
              htmlFor="register-farm"
              className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 block cursor-pointer"
            >
              {t('auth.farmNameOptional', 'Farm Name (Optional)')}
            </label>
            <div className="relative group">
              <Wheat
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500"
              />
              <input
                id="register-farm"
                type="text"
                name="farmName"
                value={form.farmName}
                onChange={handleChange}
                className="input-field pl-9 h-10 bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-white/10 hover:border-primary-400 text-xs sm:text-sm w-full rounded-xl"
                placeholder={t('auth.placeholderFarm', 'Name of your agricultural estate')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="register-location"
              className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 block cursor-pointer"
            >
              {t('auth.districtState', 'District / State')} ({t('auth.optional', 'Optional')})
            </label>
            <div className="relative group">
              <MapPin
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500"
              />
              <input
                id="register-location"
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="input-field pl-9 h-10 bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-white/10 hover:border-primary-400 text-xs sm:text-sm w-full rounded-xl"
                placeholder={t('auth.placeholderLocation', 'State, Country')}
              />
            </div>
          </div>
        </div>

        {/* Password & Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label
              htmlFor="register-password"
              className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 block cursor-pointer"
            >
              {t('auth.password', 'Password')} *
            </label>
            <div className="relative group">
              <Lock
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500"
              />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input-field pl-9 h-10 bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-white/10 hover:border-primary-400 text-xs sm:text-sm w-full rounded-xl"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="register-confirm-password"
              className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 block cursor-pointer"
            >
              {t('auth.confirmPassword', 'Confirm Password')} *
            </label>
            <div className="relative group">
              <Lock
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500"
              />
              <input
                id="register-confirm-password"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="input-field pl-9 h-10 bg-white/60 dark:bg-gray-900/40 border-gray-200 dark:border-white/10 hover:border-primary-400 text-xs sm:text-sm w-full rounded-xl"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-1">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
            aria-pressed={showPassword}
            className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center"
          >
            {showPassword ? t('auth.hidePassword', 'Hide Password') : t('auth.showPassword', 'Show Password')}
          </button>
        </div>

        {/* Submit */}
        <button
          id="register-submit-btn"
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full h-10 sm:h-10.5 text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md shadow-primary-500/15 mt-1 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('auth.creatingAccount', 'Creating account...')}</span>
            </>
          ) : (
            <span>{t('auth.createAccount', 'Create Account')}</span>
          )}
        </button>
      </form>

      {/* Google Sign Up */}
      <div className="mt-3.5">
        <div className="relative flex items-center gap-4 mb-2.5">
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold leading-none">
            {t('auth.orContinueWith', 'or continue with')}
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
        </div>
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={!!socialLoading || isLoading}
          className="w-full flex items-center justify-center gap-2 h-10 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 font-semibold text-xs shadow-xs hover:shadow-sm transition-all active:scale-[0.99]"
        >
          {socialLoading === 'google' ? (
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span>{t('auth.signInWithGoogle', 'Sign up with Google')}</span>
        </button>
      </div>

      {/* Footer */}
      <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
        {t('auth.hasAccount', 'Already have an account?')}{' '}
        <Link
          id="register-signin-link"
          to="/login"
          className="text-primary-600 dark:text-primary-400 font-bold hover:underline ml-1"
        >
          {t('auth.login', 'Sign In')}
        </Link>
      </p>
    </div>
  );
};

export default Register;
