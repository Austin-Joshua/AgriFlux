import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
    TrendingUp, Droplets, ThermometerSun, CloudRain, Leaf,
    AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, Zap
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
    icon: React.ReactNode; color: string; bgColor: string;
}> = ({ title, value, change, positive = true, icon, color, bgColor }) => (
    <div className="card group">
        <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
                {icon}
            </div>
            <span className={`flex items-center gap-1 text-sm font-semibold ${positive ? 'text-primary-600 dark:text-primary-400' : 'text-red-500'}`}>
                {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {change}
            </span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
        <p className={`text-2xl font-bold ${color} font-display`}>{value}</p>
    </div>
);

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeChart, setActiveChart] = useState<'area' | 'bar'>('area');

    const currentTime = new Date();
    const hour = currentTime.getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-header">
                        {greeting}, {user?.name?.split(' ')[0] || 'Farmer'} 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-4 py-2 rounded-xl border border-primary-200 dark:border-primary-800">
                    <Zap size={16} />
                    <span className="font-medium">AI Engine Active</span>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title={t('dashboard.yieldForecast')}
                    value="4,200 kg/ha"
                    change="+12.5%"
                    positive={true}
                    icon={<TrendingUp size={22} className="text-primary-600" />}
                    color="text-primary-600 dark:text-primary-400"
                    bgColor="bg-primary-100 dark:bg-primary-900/30"
                />
                <StatCard
                    title={t('dashboard.irrigationStatus')}
                    value="Optimal"
                    change="2.4L saved"
                    positive={true}
                    icon={<Droplets size={22} className="text-blue-600" />}
                    color="text-blue-600 dark:text-blue-400"
                    bgColor="bg-blue-100 dark:bg-blue-900/30"
                />
                <StatCard
                    title={t('dashboard.climateRisk')}
                    value="Low"
                    change="-8% risk"
                    positive={true}
                    icon={<ThermometerSun size={22} className="text-orange-600" />}
                    color="text-orange-500 dark:text-orange-400"
                    bgColor="bg-orange-100 dark:bg-orange-900/30"
                />
                <StatCard
                    title={t('dashboard.soilHealth')}
                    value="85/100"
                    change="+5 pts"
                    positive={true}
                    icon={<Leaf size={22} className="text-earth-600" />}
                    color="text-earth-600 dark:text-earth-400"
                    bgColor="bg-earth-100 dark:bg-earth-900/30"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Yield Chart */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="section-header">Crop Yield Trend</h3>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">Actual vs AI Forecast (kg/ha)</p>
                        </div>
                        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            {(['area', 'bar'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setActiveChart(type)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeChart === type
                                            ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-primary-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    {type === 'area' ? 'Area' : 'Bar'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        {activeChart === 'area' ? (
                            <AreaChart data={yieldData}>
                                <defs>
                                    <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="yield" stroke="#22c55e" fill="url(#yieldGrad)" strokeWidth={2} name="Actual Yield" />
                                <Area type="monotone" dataKey="forecast" stroke="#3b82f6" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="4 2" name="AI Forecast" />
                            </AreaChart>
                        ) : (
                            <BarChart data={yieldData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="yield" fill="#22c55e" radius={[6, 6, 0, 0]} name="Actual Yield" />
                                <Bar dataKey="forecast" fill="#86efac" radius={[6, 6, 0, 0]} name="AI Forecast" />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* Weather Widget */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header">7-Day Weather</h3>
                        <CloudRain size={18} className="text-blue-400" />
                    </div>

                    <div className="space-y-2">
                        {weatherData.map(d => (
                            <div key={d.day} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                                <span className="text-sm text-gray-600 dark:text-gray-400 w-10">{d.day}</span>
                                <div className="flex items-center gap-2 flex-1 mx-3">
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-400 rounded-full"
                                            style={{ width: `${(d.rain / 30) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-right">
                                    <span className="text-xs text-blue-500">{d.rain}mm</span>
                                    <span className="text-sm font-semibold text-orange-500">{d.temp}°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* AI Insights */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header">🤖 AI Insights</h3>
                        <span className="badge-green">Live</span>
                    </div>
                    <div className="space-y-3">
                        {[
                            { icon: CheckCircle, color: 'text-primary-500', text: 'Optimal time to apply nitrogen fertilizer this week', sub: 'Soil temp is 22°C — ideal for uptake' },
                            { icon: AlertTriangle, color: 'text-yellow-500', text: 'Moderate rainfall expected Thursday — delay irrigation', sub: '18mm rainfall forecast by OpenWeather' },
                            { icon: TrendingUp, color: 'text-blue-500', text: 'Rice yield can increase 15% with precision watering', sub: 'AI recommendation based on soil moisture data' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <item.icon size={18} className={`${item.color} flex-shrink-0 mt-0.5`} />
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.text}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Farm Sustainability Score */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header">🌱 Sustainability Score</h3>
                        <span className="badge-earth">Good</span>
                    </div>
                    <div className="flex items-center gap-6 mb-5">
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-gray-700" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="78, 100" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">78</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            {[
                                { label: 'Fertilizer Efficiency', value: 82, color: 'bg-primary-500' },
                                { label: 'Water Conservation', value: 75, color: 'bg-blue-500' },
                                { label: 'Crop Diversity', value: 68, color: 'bg-earth-500' },
                                { label: 'Soil Health', value: 85, color: 'bg-primary-400' },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{item.value}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                        <div className={`h-1.5 ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
