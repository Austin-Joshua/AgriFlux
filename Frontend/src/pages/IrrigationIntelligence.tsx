import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  Droplets,
  Clock,
  AlertTriangle,
  Zap,
  Activity,
  Wifi,
  WifiOff,
  Thermometer,
  Cloud,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ReportModal from '../components/ReportModal';
import { useIoT } from '../hooks/useIoT';
import { toast } from 'react-toastify';

const scheduleData = [
  { day: 'Mon', required: 25, recommended: 20 },
  { day: 'Tue', required: 30, recommended: 0 },
  { day: 'Wed', required: 20, recommended: 18 },
  { day: 'Thu', required: 35, recommended: 0 },
  { day: 'Fri', required: 28, recommended: 22 },
  { day: 'Sat', required: 32, recommended: 28 },
  { day: 'Sun', required: 25, recommended: 20 },
];

const etData = [
  { time: '6am', et: 0.8 },
  { time: '9am', et: 2.1 },
  { time: '12pm', et: 4.2 },
  { time: '3pm', et: 3.8 },
  { time: '6pm', et: 1.9 },
  { time: '9pm', et: 0.5 },
];

const IrrigationIntelligence: React.FC = () => {
  const { t } = useTranslation();
  const {
    moisture,
    temperature,
    humidity,
    pumpActive,
    pumpStatus,
    togglePump,
    lastSync,
    isLiveMode,
    isOnline,
    isStale,
    isLoading,
    socketConnected,
  } = useIoT();

  const [isToggling, setIsToggling] = useState(false);

  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
    type: 'success' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    content: null,
    type: 'info',
  });

  const [cropType, setCropType] = useState('Rice');
  const [soilType, setSoilType] = useState('Sandy Loam');
  const waterSaved = 2400;
  const efficiency = 84;

  // Derived Status Indicators
  const getMoistureStatus = () => {
    if (isStale)
      return {
        label: t('irrigation.staleTelemetry', 'Stale Sensor Reading (>15m) — Verification Required'),
        color: 'text-amber-600 dark:text-amber-400',
        badge: 'badge-yellow',
      };
    if (moisture < 30)
      return { label: 'Dry Soil – Irrigation Active', color: 'text-red-600', badge: 'badge-red' };
    if (moisture < 60)
      return {
        label: 'Optimal Moisture – Pump Off',
        color: 'text-primary-600',
        badge: 'badge-green',
      };
    return { label: 'Saturated Soil – Drainage Mode', color: 'text-blue-600', badge: 'badge-blue' };
  };

  const status = getMoistureStatus();

  const openReport = (label: string) => {
    let content: React.ReactNode = null;
    let type: 'success' | 'warning' | 'info' = 'info';

    if (label === 'Water Efficiency') {
      content = (
        <div className="space-y-4">
          <p>
            {t('irrigation.currentEfficiency', 'Current System Efficiency:')} <strong>{efficiency}%</strong>
          </p>
          <p>
            {t('irrigation.efficiencyExplanation', 'Irrigation efficiency measures the ratio of water successfully delivered to the root zone versus the total water withdrawn from the source.')}
          </p>
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800">
            <h4 className="font-bold text-primary-700 dark:text-primary-300 mb-2">
              {t('irrigation.aiOptimizationReport', 'AI Optimization Report')}
            </h4>
            <p className="text-sm">
              {t('irrigation.aiOptimizationDesc', 'Your systems are operating at high efficiency. Precision scheduling based on evapotranspiration (ET) rates has reduced surface runoff by 22% compared to historical patterns.')}
            </p>
          </div>
        </div>
      );
      type = 'success';
    } else if (label === 'Soil Moisture') {
      content = (
        <div className="space-y-4">
          <p>
            {t('irrigation.currentMoistureLevel', 'Current moisture level:')}{' '}
            <strong>
              {moisture}% ({moisture > 40 ? t('irrigation.optimal', 'Optimal') : t('irrigation.low', 'Low')})
            </strong>
          </p>
          <p>
            {t('irrigation.madExplanation', 'Maintaining soil moisture within the "Management Allowed Depletion" (MAD) range ensures plants never reach the permanent wilting point.')}
          </p>
        </div>
      );
      type = 'info';
    }

    setReportModal({ isOpen: true, title: label, content, type });
  };

  return (
    <div className="space-y-6">
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal((prev) => ({ ...prev, isOpen: false }))}
        title={reportModal.title}
        content={reportModal.content}
        type={reportModal.type}
      />
      {/* Header — Standardized with Live Toggle & Socket Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div>
          <h1 className="page-header flex items-center gap-3">
            <Droplets className="text-primary-600 dark:text-primary-400" />
            {t('irrigation.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
            {t('irrigation.subtitle')}
          </p>
          {isLiveMode && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight whitespace-nowrap shadow-sm ${socketConnected ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse'}`}
              >
                {socketConnected ? <Wifi size={12} className="text-emerald-600 dark:text-emerald-400" /> : <WifiOff size={12} className="text-amber-600 dark:text-amber-400" />}
                {socketConnected ? t('irrigation.liveConnected', 'Live Connected') : t('irrigation.reconnecting', 'Reconnecting...')}
              </span>
              {!isOnline && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight whitespace-nowrap bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-sm">
                  <AlertTriangle size={12} className="text-rose-600 dark:text-rose-400" /> {t('irrigation.deviceOffline', 'Device Offline')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Performance Banner for Offline state */}
      {isLiveMode && !isOnline && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-xl flex items-center gap-3"
        >
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
            {t('irrigation.deviceOfflineNotice', 'Hardware node offline — telemetry actively synthesized from calibrated soil sensor profiles.')}
          </p>
        </motion.div>
      )}

      {/* Status Cards — Symmetrical 4-Column Layout like Dashboard */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 animate-slide-up-fade"
        style={{ animationDelay: '100ms' }}
      >
        <div
          onClick={() => openReport('Soil Moisture')}
          className="card-clickable group border-b-2 border-transparent hover:border-blue-500 p-3 sm:p-4 md:p-5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 md:[&>svg]:w-[22px] md:[&>svg]:h-[22px]">
              <Droplets className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col items-end gap-0.5 min-w-0">
              <span className={`flex items-center justify-end gap-0.5 text-[11px] sm:text-xs md:text-sm font-bold tracking-tight text-right ${status.color}`}>
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">{moisture >= 30 && moisture <= 60 ? t('irrigation.optimal', 'Optimal') : t('irrigation.active', 'Active')}</span>
              </span>
              <span className="hidden sm:flex text-[9px] md:text-[10px] text-gray-400 group-hover:text-blue-500 items-center gap-0.5 transition-colors duration-200">
                {t('common.viewDetails', 'View details')} <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">
            {t('irrigation.soilMoisture', 'Soil Moisture')}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 font-display truncate">
            {moisture}%
          </p>
        </div>

        <div
          className="card-clickable group border-b-2 border-transparent hover:border-orange-500 p-3 sm:p-4 md:p-5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 md:[&>svg]:w-[22px] md:[&>svg]:h-[22px]">
              <Thermometer className="text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex flex-col items-end gap-0.5 min-w-0">
              <span className="flex items-center justify-end gap-0.5 text-[11px] sm:text-xs md:text-sm font-bold tracking-tight text-right text-orange-600 dark:text-orange-400">
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">{t('irrigation.stable', 'Stable')}</span>
              </span>
              <span className="hidden sm:flex text-[9px] md:text-[10px] text-gray-400 group-hover:text-orange-500 items-center gap-0.5 transition-colors duration-200">
                {t('common.viewDetails', 'View details')} <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">
            {t('irrigation.ambientTemp', 'Ambient Temp')}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400 font-display truncate">
            {temperature}°C
          </p>
        </div>

        <div
          className="card-clickable group border-b-2 border-transparent hover:border-teal-500 p-3 sm:p-4 md:p-5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 md:[&>svg]:w-[22px] md:[&>svg]:h-[22px]">
              <Cloud className="text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex flex-col items-end gap-0.5 min-w-0">
              <span className="flex items-center justify-end gap-0.5 text-[11px] sm:text-xs md:text-sm font-bold tracking-tight text-right text-teal-600 dark:text-teal-400">
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">{t('irrigation.normal', 'Normal')}</span>
              </span>
              <span className="hidden sm:flex text-[9px] md:text-[10px] text-gray-400 group-hover:text-teal-500 items-center gap-0.5 transition-colors duration-200">
                {t('common.viewDetails', 'View details')} <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">
            {t('irrigation.canopyHumidity', 'Canopy Humidity')}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-teal-600 dark:text-teal-400 font-display truncate">
            {humidity}%
          </p>
        </div>

        <div
          onClick={() => openReport('Water Efficiency')}
          className="card-clickable group border-b-2 border-transparent hover:border-emerald-500 p-3 sm:p-4 md:p-5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 md:[&>svg]:w-[22px] md:[&>svg]:h-[22px]">
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col items-end gap-0.5 min-w-0">
              <span className="flex items-center justify-end gap-0.5 text-[11px] sm:text-xs md:text-sm font-bold tracking-tight text-right text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">{efficiency}% {t('irrigation.eff', 'Eff.')}</span>
              </span>
              <span className="hidden sm:flex text-[9px] md:text-[10px] text-gray-400 group-hover:text-emerald-500 items-center gap-0.5 transition-colors duration-200">
                {t('common.viewDetails', 'View details')} <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">
            {t('irrigation.waterSaved', 'Water Conserved')}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display truncate">
            {waterSaved.toLocaleString()} L
          </p>
        </div>
      </div>

      {/* Rest of the UI remains standardized... (I will keep the Relay Control card as it is vital) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Form (Minified for space) */}
        <div className="card">
          <h3 className="section-header mb-4">{t('irrigation.farmConfig', 'Farm Config')}</h3>
          <div className="space-y-4">
            <div>
              <label className="label">{t('irrigation.cropType', 'Crop Type')}</label>
              <select
                className="input-field"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
              >
                {['Rice', 'Wheat', 'Corn', 'Cotton', 'Sugarcane'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('irrigation.soilType', 'Soil Type')}</label>
              <select
                className="input-field"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
              >
                {['Sandy Loam', 'Clay Loam', 'Silt Loam', 'Sandy Clay'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Relay Control Card */}
        <div className="card glass-gold border-gold-300 relative overflow-hidden flex flex-col justify-between h-full">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-header text-gold-700 dark:text-gold-300">{t('irrigation.relayControl', 'Relay Control')}</h3>
              <div
                className={`w-2.5 h-2.5 rounded-full ${pumpActive ? 'bg-green-500 shadow-glow-green animate-pulse' : 'bg-red-500'}`}
              />
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/40 dark:bg-black/20 rounded-2xl border border-gold-200/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold-700/60 dark:text-gold-400/60 flex items-center gap-1.5">
                  <Zap size={10} /> {pumpActive ? t('irrigation.pumpActive', 'Pump Active') : t('irrigation.pumpInactive', 'Pump Standby')}
                </p>
                <p
                  className={`text-4xl font-black font-display tracking-tight mt-1 ${pumpActive ? 'text-green-600' : 'text-red-500'}`}
                >
                  {pumpStatus}
                </p>
                <p className="text-[9px] text-gold-600/60 mt-1 font-medium">
                  Last sync: {lastSync.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              setIsToggling(true);
              try {
                const newState = await togglePump();
                toast.success(`Irrigation Pump turned ${newState ? 'ON' : 'OFF'}`);
              } finally {
                setIsToggling(false);
              }
            }}
            disabled={isToggling || (isLiveMode && !isOnline)}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-lg relative z-10 ${
              isLiveMode && !isOnline
                ? 'bg-gray-400 cursor-not-allowed'
                : pumpActive
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
            }`}
            aria-label={pumpActive ? 'Stop Irrigation Pump' : 'Start Irrigation Pump'}
            aria-pressed={pumpActive}
          >
            {isLoading
              ? 'Connecting...'
              : isToggling
                ? 'Syncing...'
                : pumpActive
                  ? t('irrigation.turnPumpOff', 'Turn Pump OFF')
                  : t('irrigation.turnPumpOn', 'Turn Pump ON')}
          </button>

          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <Activity size={120} className="text-gold-600 rotate-12" />
          </div>
        </div>

        {/* Resource Metrics */}
        <div className="card flex flex-col justify-between h-full">
          <h3 className="section-header mb-4">{t('irrigation.resourceMetrics', 'Resource Metrics')}</h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-blue-600 font-display">
                {waterSaved.toLocaleString()}
              </p>
              <p className="text-xs text-blue-500 mt-0.5">{t('irrigation.litersSaved', 'Liters Saved')}</p>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-primary-600 font-display">{efficiency}%</p>
              <p className="text-xs text-primary-500 mt-0.5">{t('irrigation.efficiencyScore', 'Efficiency Score')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-header">{t('irrigation.weeklySchedule', 'Weekly Schedule')}</h3>
            <span className="badge-blue">{t('irrigation.requiredVsRecommended', 'Required vs AI Recommended')}</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={scheduleData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} unit="mm" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Bar dataKey="required" name="Crop Need" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recommended" name="AI Optimal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ET Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-header">{t('irrigation.evapotranspirationToday', 'Evapotranspiration Today')}</h3>
            <span className="badge-gold">{t('irrigation.thermalIntensity', 'Thermal Intensity')}</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={etData}>
              <defs>
                <linearGradient id="etGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Area
                type="monotone"
                dataKey="et"
                stroke="#f97316"
                fill="url(#etGrad)"
                strokeWidth={2}
                name="ET Rate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Irrigation Schedule Cards — Standardized to 3-column */}
      <div className="standard-grid mt-6">
        {[
          {
            day: 'Monday',
            time: '6:00 AM',
            duration: '45 min',
            amount: '20mm',
            status: 'scheduled',
            icon: Clock,
          },
          {
            day: 'Wednesday',
            time: 'Skipped',
            duration: '—',
            amount: '0mm',
            status: 'rain',
            icon: AlertTriangle,
          },
          {
            day: 'Friday',
            time: '5:30 AM',
            duration: '60 min',
            amount: '22mm',
            status: 'scheduled',
            icon: Clock,
          },
        ].map((s) => (
          <div
            key={s.day}
            className={`card !p-6 transition-all hover:-translate-y-1 ${s.status === 'rain' ? 'border-blue-200 dark:border-blue-800 bg-blue-50/5' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight">
                {s.day}
              </p>
              {s.status === 'rain' ? (
                <span className="badge-blue text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                  🌧️ Rain Early
                </span>
              ) : (
                <span className="badge-green text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-primary-200">
                  Scheduled
                </span>
              )}
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold font-mono">{s.time}</p>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                Qty: <span className="text-gray-900 dark:text-gray-200 font-black">{s.amount}</span>
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                Dur:{' '}
                <span className="text-gray-900 dark:text-gray-200 font-black">{s.duration}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IrrigationIntelligence;
