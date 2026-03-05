import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, Droplets, ThermometerSun, Leaf,
    AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, Zap, Map, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const yieldData = [
    { month: 'Jan', yield: 2800, forecast: 2900 },
    { month: 'Feb', yield: 3200, forecast: 3100 },
    { month: 'Mar', yield: 3600, forecast: 3500 },
    { month: 'Apr', yield: 3100, forecast: 3300 },
    { month: 'May', yield: 4200, forecast: 4000 },
    { month: 'Jun', yield: 3800, forecast: 4100 },
];

const weatherData = [
    { day: 'Mon', temp: 28, rain: 12 },
    { day: 'Tue', temp: 30, rain: 0 },
    { day: 'Wed', temp: 26, rain: 25 },
    { day: 'Thu', temp: 29, rain: 5 },
    { day: 'Fri', temp: 31, rain: 0 },
    { day: 'Sat', temp: 27, rain: 18 },
    { day: 'Sun', temp: 25, rain: 30 },
];

const StatCard: React.FC<{
    title: string; value: string; change: string; positive?: boolean;
    icon: React.ReactNode; color: string; bgColor: string; route: string;
    accentColor: string;
}> = ({ title, value, change, positive = true, icon, color, bgColor, route, accentColor }) => {
    const navigate = useNavigate();

    return (
        <div
            className="card-clickable group border-b-2 border-transparent hover:border-gold-500"
            onClick={() => navigate(route)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate(route)}
        >
            {/* Shimmer overlay on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-glow-gold"
                style={{ background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 60%)` }} />

            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`flex items-center gap-1 text-sm font-semibold ${positive ? 'text-primary-600 dark:text-primary-400' : 'text-red-500'}`}>
                        {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {change}
                    </span>
                    <span className="text-[10px] text-gray-400 group-hover:text-primary-500 flex items-center gap-0.5 transition-colors duration-200">
                        View details <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
            <p className={`text-2xl font-bold ${color} font-display`}>{value}</p>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeChart, setActiveChart] = useState<'area' | 'bar'>('area');

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div className="space-y-5">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="page-header">
                        {t(`dashboard.${greeting.toLowerCase().replace(' ', '')}`)}, <span className="text-gradient font-extrabold">{user?.name?.split(' ')[0] || 'Farmer'}</span> 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-4 py-2 rounded-xl border border-primary-200 dark:border-primary-800 shadow-sm">
                    <Zap size={15} className="text-gold-500" />
                    <span className="font-semibold">AI Engine Active</span>
                </div>
            </div>

            {/* Stat Cards — all clickable */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title={t('dashboard.soilHealth')} value="85/100" change="+5 pts"
                    icon={<Leaf size={22} className="text-earth-600" />}
                    color="text-earth-600 dark:text-earth-400"
                    bgColor="bg-earth-100 dark:bg-earth-900/30"
                    accentColor="#b8823d"
                    route="/soil"
                />
                <StatCard
                    title={t('dashboard.yieldForecast')} value="4,200 kg/ha" change="+12%"
                    icon={<TrendingUp size={22} className="text-primary-600" />}
                    color="text-primary-600 dark:text-primary-400"
                    bgColor="bg-primary-100 dark:bg-primary-900/30"
                    accentColor="#22c55e"
                    route="/yield"
                />
                <StatCard
                    title={t('dashboard.irrigationStatus')} value="Optimal" change="Water Saved"
                    icon={<Droplets size={22} className="text-blue-600" />}
                    color="text-blue-600 dark:text-blue-400"
                    bgColor="bg-blue-100 dark:bg-blue-900/30"
                    accentColor="#3b82f6"
                    route="/irrigation"
                />
                <StatCard
                    title={t('dashboard.climateRisk')} value="Low" change="Stable"
                    icon={<ThermometerSun size={22} className="text-gold-600" />}
                    color="text-gold-600 dark:text-gold-400"
                    bgColor="bg-gold-100 dark:bg-gold-900/30"
                    accentColor="#f59e0b"
                    route="/climate"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Yield Chart */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="section-header">Crop Yield Trend</h3>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Actual vs AI Forecast (kg/ha)</p>
                        </div>
                        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                            {(['area', 'bar'] as const).map(type => (
                                <button key={type} onClick={() => setActiveChart(type)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeChart === type
                                        ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-primary-400 scale-105'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                                    {type === 'area' ? 'Area' : 'Bar'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        {activeChart === 'area' ? (
                            <AreaChart data={yieldData}>
                                <defs>
                                    <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: 12 }} />
                                <Area type="monotone" dataKey="yield" stroke="#22c55e" fill="url(#yieldGrad)" strokeWidth={2.5} name="Actual" />
                                <Area type="monotone" dataKey="forecast" stroke="#f59e0b" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="5 3" name="AI Forecast" />
                            </AreaChart>
                        ) : (
                            <BarChart data={yieldData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: 12 }} />
                                <Bar dataKey="yield" fill="#22c55e" radius={[6, 6, 0, 0]} name="Actual" />
                                <Bar dataKey="forecast" fill="#f59e0b" radius={[6, 6, 0, 0]} name="AI Forecast" />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* 7-Day Weather */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header">7-Day Weather</h3>
                        <Droplets size={18} className="text-blue-400" />
                    </div>
                    <div className="space-y-2">
                        {weatherData.map(d => (
                            <div key={d.day} className="flex items-center gap-3 py-1 border-b border-gray-50 dark:border-gray-700/30 last:border-0">
                                <span className="text-sm text-gray-500 dark:text-gray-400 w-8">{d.day}</span>
                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700"
                                        style={{ width: `${(d.rain / 30) * 100}%` }} />
                                </div>
                                <span className="text-xs text-blue-500 w-8 text-right">{d.rain}mm</span>
                                <span className="text-sm font-bold text-gold-500 w-8 text-right">{d.temp}°</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* AI Insights */}
                <div className="card glass-gold">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header text-gold-700 dark:text-gold-400">🤖 {t('dashboard.aiInsights')}</h3>
                        <span className="badge-gold animate-pulse-slow">Live</span>
                    </div>
                    <div className="space-y-3">
                        {[
                            { icon: CheckCircle, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'Optimal time to apply nitrogen this week', sub: 'Soil temp 22°C — ideal for uptake' },
                            { icon: AlertTriangle, color: 'text-gold-500', bg: 'bg-gold-50 dark:bg-gold-900/20', text: 'Delay irrigation — rain expected Thursday', sub: '18mm forecast via weather AI' },
                            { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'Rice yield +15% with precision watering', sub: 'AI model confidence: 91%' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-3 p-3 bg-gray-50/70 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/60 transition-all duration-200 cursor-default">
                                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                                    <item.icon size={16} className={item.color} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.text}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sustainability Score — clickable */}
                <div className="card-clickable" onClick={() => navigate('/sustainability')}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header">🌱 Sustainability</h3>
                        <span className="badge-gold">Good</span>
                    </div>
                    <div className="flex items-center gap-5 mb-4">
                        <div className="relative w-20 h-20 flex-shrink-0">
                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="#e5e7eb" strokeWidth="2.5" className="dark:stroke-gray-700" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="url(#scoreGrad)" strokeWidth="2.5" strokeDasharray="78, 100" strokeLinecap="round" />
                                <defs>
                                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#16a34a" />
                                        <stop offset="100%" stopColor="#f59e0b" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-gradient">78</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            {[
                                { label: 'Fertilizer', value: 82, color: 'from-primary-500 to-primary-400' },
                                { label: 'Water', value: 75, color: 'from-blue-500 to-blue-400' },
                                { label: 'Diversity', value: 68, color: 'from-gold-500 to-gold-400' },
                                { label: 'Soil', value: 85, color: 'from-earth-500 to-earth-400' },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-xs mb-0.5">
                                        <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{item.value}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                        <div className={`h-1.5 bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1">
                        Click for full report <ArrowRight size={12} />
                    </p>
                </div>

                {/* Google Maps Farm Map */}
                <div className="card !p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
                        <h3 className="section-header">🗺️ Farm Location</h3>
                        <Map size={16} className="text-primary-500" />
                    </div>
                    <div className="relative w-full" style={{ height: '260px' }}>
                        <iframe
                            title="Farm Location Map"
                            className="w-full h-full border-0"
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d248849.886527!2d77.6309395!3d12.9539974!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sin!4v1709000000000!5m2!1sen!2sin&maptype=satellite"
                        />
                        {/* Overlay badge */}
                        <div className="absolute top-3 left-3 glass rounded-xl px-3 py-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 shadow-md flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                            Green Valley Farm
                        </div>
                    </div>
                    <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">📍 Karnataka, India · 4.2 ha</span>
                        <a href="https://maps.google.com" target="_blank" rel="noreferrer"
                            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                            Open in Maps <ArrowRight size={10} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
