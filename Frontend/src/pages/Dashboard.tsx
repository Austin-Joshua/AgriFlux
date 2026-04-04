import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, Droplets, ThermometerSun, Leaf,
    AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight,
    Zap, Map, ArrowRight, Sparkles, ShieldCheck, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import SmartFarmReport from '../components/SmartFarmReport';
import { toast } from 'react-toastify';
import { useRealisticData } from '../hooks/useRealisticData';
import AIDecisionPanel from '../components/AIDecisionPanel';
import ProfitRiskIntelligence from '../components/ProfitRiskIntelligence';
import SmartAlerts from '../components/SmartAlerts';

// Dynamic data seeded fresh on each page-load
const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const buildYieldData = () => {
    const base = [2700, 3100, 3500, 3000, 4100, 3700];
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({
        month,
        yield: base[i] + rndInt(-120, 180),
        forecast: base[i] + rndInt(50, 300),
    }));
};

const buildWeatherData = () => {
    const temps = [28, 30, 26, 29, 31, 27, 25];
    const rains = [12, 0, 25, 5, 0, 18, 30];
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
        day,
        temp: temps[i] + rndInt(-2, 2),
        rain: Math.max(0, rains[i] + rndInt(-5, 5)),
    }));
};

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
    const [reportOpen, setReportOpen] = useState(false);
    const data = useRealisticData();

    // Randomized on mount — simulates live data
    const yieldData = useMemo(buildYieldData, []);
    const weatherData = useMemo(buildWeatherData, []);

    // Session-stable metrics from hook
    const soilScore = data.confidenceScore - 5; // Derived from health confidence
    const yieldForecast = `${data.yieldKgHa.toLocaleString()} kg/ha`;
    const confidenceScore = data.confidenceScore;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div className="space-y-6">
            <SEO title="Dashboard" />

            {/* Smart Farm Report Modal */}
            <SmartFarmReport 
                isOpen={reportOpen} 
                onClose={() => setReportOpen(false)} 
                reportData={{
                    crop: data.crop,
                    variety: data.variety,
                    yieldEstimate: `${data.yieldKgHa.toLocaleString()} kg/ha`,
                    priceMin: data.priceMin,
                    priceMax: data.priceMax,
                    bestRegion: data.bestMarket,
                    confidence: data.confidenceScore,
                    soilPh: data.soilPh,
                    humidity: data.humidity,
                    rainfall: data.rainfall,
                    demandScore: data.demandScore,
                    profitEstimate: `₹${data.profitMin.toLocaleString()} – ₹${data.profitMax.toLocaleString()}`,
                    riskLevel: data.confidenceScore >= 93 ? 'Low' : data.confidenceScore >= 88 ? 'Medium' : 'High',
                    factors: data.factors,
                }}
            />

            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="page-header">
                        {t(`dashboard.${greeting.toLowerCase().replace(' ', '')}`)}, <span className="text-gradient font-extrabold">{user?.name?.split(' ')[0] || 'Farmer'}</span> 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Generate Smart Farm Report CTA */}
                    <button
                        onClick={() => setReportOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-green-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all font-semibold text-sm"
                    >
                        <Sparkles size={16} className="text-yellow-200" />
                        Generate Smart Farm Report
                    </button>
                </div>
            </div>

            {/* AI DECISION ENGINE PANEL — Hackathon Core Feature */}
            <div className="animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
                <AIDecisionPanel />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
                <StatCard
                    title={t('dashboard.soilHealth')} value={`${soilScore}/100`} change="+5 pts"
                    icon={<Leaf size={22} className="text-earth-600" />}
                    color="text-earth-600 dark:text-earth-400"
                    bgColor="bg-earth-100 dark:bg-earth-900/30"
                    accentColor="#b8823d"
                    route="/soil"
                />
                <StatCard
                    title={t('dashboard.yieldForecast')} value={yieldForecast} change="+12%"
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
                {/* Yield Chart */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="section-header">Crop Yield Trend</h3>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Actual vs AI Forecast (kg/ha)</p>
                        </div>
                        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                            {(['area', 'bar'] as const).map(type => (
                                <button key={type} onClick={(e) => { e.stopPropagation(); setActiveChart(type); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeChart === type
                                        ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-primary-400 scale-105'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                                    {type === 'area' ? 'Area' : 'Bar'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div 
                        className="cursor-pointer group/chart" 
                        onClick={() => toast.info('📊 AI Insight: Yield expected to peak in May due to optimized irrigation.')}
                    >
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
                        <div className="mt-2 text-[10px] text-gray-400 text-center opacity-0 group-hover/chart:opacity-100 transition-opacity font-bold uppercase tracking-widest">
                            Click for Deep Analysis Insights
                        </div>
                    </div>
                </div>

                {/* 7-Day Weather */}
                <div className="card group/weather cursor-pointer hover:border-blue-500/30 transition-all" onClick={() => toast.success('🌤️ Weather Analysis: Stable conditions for harvest.')}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header">7-Day Weather</h3>
                        <Droplets size={18} className="text-blue-400 group-hover/weather:scale-125 transition-transform" />
                    </div>
                    <div className="space-y-2">
                        {weatherData.map(d => (
                            <div key={d.day} className="flex items-center gap-3 py-1 border-b border-gray-50 dark:border-gray-700/30 last:border-0 group/row">
                                <span className="text-sm text-gray-500 dark:text-gray-400 w-8 group-hover/row:text-primary-600 transition-colors">{d.day}</span>
                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700"
                                        style={{ width: `${Math.min(100, (d.rain / 30) * 100)}%` }} />
                                </div>
                                <span className="text-xs text-blue-500 w-8 text-right font-bold">{d.rain}mm</span>
                                <span className="text-sm font-bold text-gold-500 w-8 text-right">{d.temp}°</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover/weather:opacity-100 transition-opacity">
                        <Sparkles size={10} /> View Historical Comparison
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Profit & Risk Intelligence */}
                <div className="lg:col-span-1 animate-slide-up-fade" style={{ animationDelay: '250ms' }}>
                    <ProfitRiskIntelligence />
                </div>

                {/* Smart Alerts System */}
                <div className="lg:col-span-1 animate-slide-up-fade" style={{ animationDelay: '300ms' }}>
                    <SmartAlerts />
                </div>

                {/* Farm Map */}
                <div className="card !p-0 overflow-hidden animate-slide-up-fade" style={{ animationDelay: '350ms' }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
                        <h3 className="section-header">🗺️ Farm Location</h3>
                        <Map size={16} className="text-primary-500" />
                    </div>
                    <div className="relative w-full group/map" style={{ height: '220px' }}>
                        <iframe
                            title="Farm Location Map"
                            className="w-full h-full border-0 transition-all duration-700 grayscale group-hover/map:grayscale-0"
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d248849.886527!2d77.6309395!3d12.9539974!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sin!4v1709000000000!5m2!1sen!2sin&maptype=satellite"
                        />
                        <div className="absolute top-3 left-3 glass rounded-xl px-3 py-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 shadow-md flex items-center gap-1.5 border border-white/20">
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                            Live Satellite Feed
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover/map:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="glass px-2 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-tighter">Lat: 12.95° N · Lon: 77.63° E</div>
                            <div className="flex gap-1 pointer-events-auto">
                                <button className="p-1.5 bg-black/60 hover:bg-primary-600 rounded-lg text-white transition-all backdrop-blur-sm" onClick={() => toast.info('🗺️ Map Layer: Terrain Enabled')}>
                                    <Map size={12} />
                                </button>
                                <button className="p-1.5 bg-primary-600 rounded-lg text-white transition-all shadow-lg shadow-primary-500/30">
                                    <Sparkles size={12} />
                                </button>
                            </div>
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
            {/* Trust / Security Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 pb-1 animate-slide-up-fade" style={{ animationDelay: '400ms' }}>
                {[
                    { icon: Lock, label: 'Secure Login Enabled', color: 'text-blue-500' },
                    { icon: Sparkles, label: 'AI Powered Insights', color: 'text-primary-500' },
                    { icon: ShieldCheck, label: 'Data Encrypted (AES-256)', color: 'text-green-500' },
                    { icon: Zap, label: 'JWT + Rate-Limited APIs', color: 'text-gold-500' },
                ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-800">
                        <Icon size={12} className={color} />
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
