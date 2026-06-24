import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User, Globe, Moon, Sun, Bell, Shield, Save, Camera, CheckCircle,
  CreditCard, Database, Activity, Trash2, Download,
  Lock, Eye, EyeOff, Wifi, WifiOff, AlertTriangle, ChevronRight,
  Package, RefreshCw, HardDrive,
} from 'lucide-react';
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

const IOT_DEVICES = [
  { name: 'Soil Sensor – Plot A', id: 'SS-001', status: 'online', battery: 87, lastSync: '2 min ago', type: '🌱' },
  { name: 'Weather Station – Main', id: 'WS-002', status: 'online', battery: 64, lastSync: '5 min ago', type: '🌤️' },
  { name: 'Irrigation Controller', id: 'IC-003', status: 'online', battery: 92, lastSync: '1 min ago', type: '💧' },
  { name: 'Drone – Agri-X1', id: 'DR-004', status: 'offline', battery: 12, lastSync: '3 hrs ago', type: '🚁' },
];

const ACTIVITY_LOG = [
  { action: 'Login', detail: 'Successful login from Chrome/Android', time: '2 mins ago', icon: '🔐', color: 'text-green-500' },
  { action: 'Report Generated', detail: 'Smart Farm Report for Wheat — Yield Estimate', time: '1 hr ago', icon: '📄', color: 'text-blue-500' },
  { action: 'Climate Simulation', detail: 'Scenario: El Niño Pattern simulated for Rice', time: '3 hrs ago', icon: '🌡️', color: 'text-orange-500' },
  { action: 'Consultation Booked', detail: 'Dr. Arun Patel — Soil Specialist', time: 'Yesterday', icon: '📅', color: 'text-purple-500' },
  { action: 'Settings Changed', detail: 'Language preference changed to Tamil', time: '2 days ago', icon: '⚙️', color: 'text-gray-500' },
  { action: 'Login Attempt Failed', detail: 'Unrecognized device blocked automatically', time: '3 days ago', icon: '🚫', color: 'text-red-500' },
];

type Section = 'profile' | 'appearance' | 'language' | 'notifications' | 'security' | 'subscription' | 'devices' | 'activity' | 'data';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    farmName: user?.farmName || '',
    location: user?.location || '',
    cropTypes: 'Rice, Wheat',
    farmSize: '4.2',
    soilType: 'Loamy',
  });

  const [notifications, setNotifications] = useState({
    yieldAlerts: true,
    irrigationReminders: true,
    climateRiskAlerts: true,
    soilHealthReports: false,
    marketPriceUpdates: false,
    consultationReminders: true,
    weeklyDigest: true,
    pushNotifications: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sidebarItems: { key: Section; label: string; icon: React.ElementType; badge?: string }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'appearance', label: 'Appearance', icon: isDark ? Moon : Sun },
    { key: 'language', label: 'Language', icon: Globe },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'subscription', label: 'Subscription', icon: CreditCard, badge: 'PRO' },
    { key: 'devices', label: 'IoT Devices', icon: Wifi },
    { key: 'activity', label: 'Activity Log', icon: Activity },
    { key: 'data', label: 'Data & Privacy', icon: Database },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center md:flex-row md:items-start justify-between gap-4 text-center md:text-left">
        <div>
          <h1 className="page-header text-gradient font-extrabold">{t('settings.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">
            Manage your premium AgriFlux farm account preferences
          </p>
        </div>
        <div className="flex items-center justify-center md:justify-start gap-2">
          <span className="badge-gold py-1.5 px-3 shadow-sm border border-gold-200 dark:border-gold-800">
            ⭐ Premium Account
          </span>
        </div>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Sidebar tabs */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="card p-2 space-y-0.5">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                id={`settings-${item.key}`}
                onClick={() => setActiveSection(item.key)}
                className={
                  activeSection === item.key
                    ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg w-full'
                    : 'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 w-full'
                }
              >
                <item.icon size={15} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-black bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full">{item.badge}</span>
                )}
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
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    {user?.name?.charAt(0) || 'F'}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-primary-700 transition-colors border-2 border-white dark:border-gray-800">
                    <Camera size={12} />
                  </button>
                </div>
                <div>
                  <h3 className="font-black text-xl text-gray-900 dark:text-white font-display tracking-tight">{user?.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded text-[10px] font-bold">VERIFIED FARMER</span>
                    <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">PRO PLAN</span>
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
                  { key: 'farmSize', label: 'Farm Size (ha)', placeholder: '4.2', type: 'number' },
                  { key: 'soilType', label: 'Primary Soil Type', placeholder: 'Loamy' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="label">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={profile[f.key as keyof typeof profile]}
                      onChange={(e) => setProfile((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="input-field"
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>

              <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                {saved ? (<><CheckCircle size={16} /> Saved!</>) : (<><Save size={16} /> {t('settings.saveChanges')}</>)}
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
                ].map((opt) => (
                  <button
                    key={opt.value}
                    id={`theme-${opt.value}`}
                    onClick={() => (isDark ? opt.value === 'light' : opt.value === 'dark') && toggleTheme()}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      (isDark ? opt.value === 'dark' : opt.value === 'light')
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

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Display Density</h4>
                <div className="grid grid-cols-3 gap-3">
                  {['Compact', 'Default', 'Comfortable'].map((d) => (
                    <button key={d} className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${d === 'Default' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Language */}
          {activeSection === 'language' && (
            <div className="space-y-4">
              <h3 className="section-header">{t('settings.language')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    id={`lang-${lang.code}`}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      i18n.language === lang.code
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-3xl">{lang.flag}</span>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{lang.label}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{lang.native}</p>
                    </div>
                    {i18n.language === lang.code && <CheckCircle size={16} className="text-primary-500 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="space-y-4">
              <h3 className="section-header">Notification Preferences</h3>
              <div className="space-y-2">
                {[
                  { key: 'yieldAlerts', label: 'Yield Prediction Alerts', sub: 'Get notified when AI predicts yield changes' },
                  { key: 'irrigationReminders', label: 'Irrigation Reminders', sub: 'Scheduled irrigation notifications' },
                  { key: 'climateRiskAlerts', label: 'Climate Risk Alerts', sub: 'Severe weather and drought warnings' },
                  { key: 'consultationReminders', label: 'Consultation Reminders', sub: 'Upcoming expert session reminders' },
                  { key: 'soilHealthReports', label: 'Soil Health Reports', sub: 'Weekly soil analysis summaries' },
                  { key: 'marketPriceUpdates', label: 'Market Price Updates', sub: 'Crop market price notifications' },
                  { key: 'weeklyDigest', label: 'Weekly AI Digest', sub: 'Weekly summary of farm performance' },
                  { key: 'pushNotifications', label: 'Push Notifications', sub: 'Allow push notifications on this device' },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{n.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{n.sub}</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${notifications[n.key as keyof typeof notifications] ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${notifications[n.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="space-y-5">
              <h3 className="section-header">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <button className="btn-primary flex items-center gap-2"><Lock size={16} />Update Password</button>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable 2FA</p>
                    <p className="text-xs text-gray-500">Extra layer of security for your account</p>
                  </div>
                  <button className="btn-outline text-sm py-1.5 px-3">Enable</button>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-xl flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-green-700 dark:text-green-400">AES-256 Encryption Active</p>
                    <p className="text-xs text-green-600 dark:text-green-500">All your farm data is fully encrypted at rest and in transit.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription */}
          {activeSection === 'subscription' && (
            <div className="space-y-5">
              <h3 className="section-header">Subscription & Billing</h3>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-70">Current Plan</p>
                    <p className="text-2xl font-black mt-1">AgriFlux Pro ⭐</p>
                    <p className="text-sm opacity-80 mt-1">₹2,499 / year · Renews Jan 2027</p>
                  </div>
                  <Package size={40} className="opacity-20" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Unlimited AI Reports', 'IoT Device Sync', 'Priority Support', 'Market Analytics', 'Expert Consultation'].map(f => (
                    <span key={f} className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full">{f}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Recent Invoices</h4>
                {[
                  { date: 'Jan 15, 2026', amount: '₹2,499', status: 'Paid', plan: 'Annual Pro' },
                  { date: 'Jan 15, 2025', amount: '₹1,999', status: 'Paid', plan: 'Annual Standard' },
                  { date: 'Jan 15, 2024', amount: '₹1,499', status: 'Paid', plan: 'Annual Basic' },
                ].map((inv) => (
                  <div key={inv.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{inv.plan}</p>
                      <p className="text-xs text-gray-500">{inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm">{inv.amount}</span>
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">{inv.status}</span>
                      <button className="text-primary-600 hover:text-primary-700"><Download size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button className="btn-primary flex items-center gap-2 flex-1 justify-center"><RefreshCw size={16} />Manage Subscription</button>
                <button className="btn-outline flex items-center gap-2"><CreditCard size={16} />Update Payment</button>
              </div>
            </div>
          )}

          {/* IoT Devices */}
          {activeSection === 'devices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="section-header">Connected IoT Devices</h3>
                <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg">{IOT_DEVICES.filter(d => d.status === 'online').length} Online</span>
              </div>
              <div className="space-y-2">
                {IOT_DEVICES.map((device) => (
                  <div key={device.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <span className="text-2xl">{device.type}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{device.name}</p>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${device.status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{device.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">{device.id}</span>
                        <span className="text-xs text-gray-400">Synced {device.lastSync}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1">
                        {device.status === 'online' ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-400" />}
                        <span className={`text-xs font-bold ${device.battery < 20 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>{device.battery}%</span>
                      </div>
                      {device.battery < 20 && <p className="text-[10px] text-red-500 font-bold">Low Battery</p>}
                    </div>
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
              <button className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 text-sm font-semibold rounded-xl hover:border-primary-400 hover:text-primary-600 transition-all">
                + Pair New Device
              </button>
            </div>
          )}

          {/* Activity Log */}
          {activeSection === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="section-header">Recent Activity</h3>
                <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><Download size={12} />Export Log</button>
              </div>
              <div className="space-y-2">
                {ACTIVITY_LOG.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <span className="text-lg flex-shrink-0">{log.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${log.color}`}>{log.action}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{log.detail}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">{log.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl flex items-start gap-2">
                <Activity size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">Activity logs are retained for 90 days. For compliance purposes, export a full log before deletion.</p>
              </div>
            </div>
          )}

          {/* Data & Privacy */}
          {activeSection === 'data' && (
            <div className="space-y-5">
              <h3 className="section-header">Data & Privacy</h3>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Data Export</h4>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Download My Farm Data</p>
                  <p className="text-xs text-gray-500 mb-3">Export all your farm reports, soil analysis, yield predictions, and consultation history in JSON or PDF format.</p>
                  <div className="flex gap-2">
                    <button className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1"><Download size={12} />Export as JSON</button>
                    <button className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1"><Download size={12} />Export as PDF</button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Storage Usage</h4>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Used Storage</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">2.4 GB / 10 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-2 bg-primary-500 rounded-full" style={{ width: '24%' }} />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><HardDrive size={10} />Reports: 1.2 GB</span>
                    <span className="flex items-center gap-1"><HardDrive size={10} />Images: 0.9 GB</span>
                    <span className="flex items-center gap-1"><HardDrive size={10} />Other: 0.3 GB</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Privacy Controls</h4>
                {[
                  { label: 'Share anonymized data for AI training', sub: 'Help improve AgriFlux AI models', on: true },
                  { label: 'Location access for Satellite Mapping', sub: 'Required for accurate farm mapping', on: true },
                  { label: 'Marketing communications', sub: 'Receive product updates and offers', on: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.sub}</p>
                    </div>
                    <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${item.on ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${item.on ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-red-100 dark:border-red-900/30 space-y-3">
                <h4 className="text-sm font-bold text-red-600 flex items-center gap-2"><AlertTriangle size={14} />Danger Zone</h4>
                <div className="p-3 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Delete My Account</p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-3">Permanently delete your account and all associated farm data. This action cannot be undone.</p>
                  <button className="flex items-center gap-2 text-xs font-bold text-red-600 border border-red-300 dark:border-red-700 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    <Trash2 size={13} /> Delete Account
                  </button>
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
