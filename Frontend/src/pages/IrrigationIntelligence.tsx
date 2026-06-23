import React, { useState, useEffect } from 'react';
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
    isLoading,
    socketConnected,
  } = useIoT();

  const [isToggling, setIsToggling] = useState(false);

  // Animation trigger for "flash" effect
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    setFlashKey((prev) => prev + 1);
  }, [lastSync]);
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

  const waterSaved = 2400;
  const efficiency = 84;

  // Derived Status Indicators
  const getMoistureStatus = () => {
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
            Current System Efficiency: <strong>{efficiency}%</strong>
          </p>
          <p>
            Irrigation efficiency measures the ratio of water successfully delivered to the root
            zone versus the total water withdrawn from the source.
          </p>
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800">
            <h4 className="font-bold text-primary-700 dark:text-primary-300 mb-2">
              AI Optimization Report
            </h4>
            <p className="text-sm">
              Your systems are operating at high efficiency. Precision scheduling based on
              evapotranspiration (ET) rates has reduced surface runoff by 22% compared to historical
              patterns.
            </p>
          </div>
        </div>
      );
      type = 'success';
    } else if (label === 'Soil Moisture') {
      content = (
        <div className="space-y-4">
          <p>
            Current moisture level:{' '}
            <strong>
              {moisture}% ({moisture > 40 ? 'Optimal' : 'Low'})
            </strong>
          </p>
          <p>
            Maintaining soil moisture within the "Management Allowed Depletion" (MAD) range ensures
            plants never reach the permanent wilting point.
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="page-header flex items-center gap-3">
            <Droplets className="text-primary-600 dark:text-primary-400" />
            {t('irrigation.title')}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {t('irrigation.subtitle')}
            </p>
            {isLiveMode && (
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${socketConnected ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700 animate-pulse'}`}
                >
                  {socketConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {socketConnected ? 'Live Connected' : 'Reconnecting...'}
                </span>
                {!isOnline && (
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <AlertTriangle size={10} /> Device Offline
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Banner for Offline state */}
      {isLiveMode && !isOnline && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/20 rounded-xl flex items-center gap-3"
        >
          <AlertTriangle className="text-red-500" size={18} />
          <p className="text-xs font-bold text-red-700 dark:text-red-400 italic">
            "Device disconnected – showing estimated values based on local soil profile"
          </p>
        </motion.div>
      )}

      {/* Status Cards with Framer Motion Flash Effect */}
      <div className="standard-grid">
        {[
          {
            id: 'moisture',
            label: status.label,
            value: `${moisture}%`,
            color: status.color,
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            icon: '💧',
            sub: 'Moisture Node',
            onClick: () => openReport('Soil Moisture'),
          },
          {
            id: 'temp',
            label: 'Temperature Status: Stable',
            value: `${temperature}°C`,
            color: 'text-orange-600',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            icon: '🌡️',
            sub: 'Ambient',
          },
          {
            id: 'humidity',
            label: 'Humidity Saturation',
            value: `${humidity}%`,
            color: 'text-primary-600',
            bg: 'bg-primary-50 dark:bg-primary-900/20',
            icon: '☁️',
            sub: 'Canopy',
          },
        ].map((s) => (
          <motion.div
            key={s.id + flashKey}
            initial={false}
            animate={{
              scale: [1, 1.02, 1],
              backgroundColor:
                isLiveMode && socketConnected
                  ? ['rgba(255,255,255,0)', 'rgba(59,130,246,0.1)', 'rgba(255,255,255,0)']
                  : undefined,
            }}
            transition={{ duration: 0.4 }}
            onClick={s.onClick}
            className={`card !p-6 cursor-pointer relative overflow-hidden ${s.bg}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-3xl">{s.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {s.sub}
              </span>
            </div>
            <p className={`text-3xl font-black mt-4 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              {s.label}
            </p>

            {/* Subtle pulse ring for live mode */}
            {isLiveMode && socketConnected && (
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Rest of the UI remains standardized... (I will keep the Relay Control card as it is vital) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Form (Minified for space) */}
        <div className="card">
          <h3 className="section-header mb-4">Farm Config</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Crop Type</label>
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
              <label className="label">Soil Type</label>
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
              <h3 className="section-header text-gold-700 dark:text-gold-300">Relay Control</h3>
              <div
                className={`w-2.5 h-2.5 rounded-full ${pumpActive ? 'bg-green-500 shadow-glow-green animate-pulse' : 'bg-red-500'}`}
              />
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/40 dark:bg-black/20 rounded-2xl border border-gold-200/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold-700/60 dark:text-gold-400/60 flex items-center gap-1.5">
                  <Zap size={10} /> Pump Status
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
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-lg relative z-10 ${isLiveMode && !isOnline
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
                  ? 'Stop Pump'
                  : 'Start Pump'}
          </button>

          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <Activity size={120} className="text-gold-600 rotate-12" />
          </div>
        </div>

        {/* Resource Metrics */}
        <div className="card flex flex-col justify-between h-full">
          <h3 className="section-header mb-4">Resource Metrics</h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-blue-600 font-display">
                {waterSaved.toLocaleString()}
              </p>
              <p className="text-xs text-blue-500 mt-0.5">Liters Saved</p>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-center">
              <p className="text-2xl font-bold text-primary-600 font-display">{efficiency}%</p>
              <p className="text-xs text-primary-500 mt-0.5">Efficiency Score</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-header">Weekly Schedule</h3>
            <span className="badge-blue">Required vs AI Recommended</span>
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
            <h3 className="section-header">Evapotranspiration Today</h3>
            <span className="badge-gold">Thermal Intensity</span>
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
            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold font-mono">
              {s.time}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                Qty:{' '}
                <span className="text-gray-900 dark:text-gray-200 font-black">{s.amount}</span>
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
