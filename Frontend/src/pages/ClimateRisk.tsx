import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CloudLightning, Thermometer, Droplets, Wind, AlertTriangle, TrendingDown, Sun } from 'lucide-react';

const rainfallData = [
    { month: 'Jan', actual: 45, forecast: 50, avg: 55 },
    { month: 'Feb', actual: 30, forecast: 35, avg: 42 },
    { month: 'Mar', actual: 65, forecast: 70, avg: 68 },
    { month: 'Apr', actual: 120, forecast: 110, avg: 125 },
    { month: 'May', actual: 180, forecast: 170, avg: 165 },
    { month: 'Jun', actual: null, forecast: 220, avg: 210 },
    { month: 'Jul', actual: null, forecast: 280, avg: 270 },
];

const tempData = [
    { month: 'Jan', min: 12, max: 28 }, { month: 'Feb', min: 14, max: 31 },
    { month: 'Mar', min: 18, max: 35 }, { month: 'Apr', min: 22, max: 38 },
    { month: 'May', min: 24, max: 40 }, { month: 'Jun', min: 22, max: 36 },
];

const ClimateRisk: React.FC = () => {
    const { t } = useTranslation();
    const riskScore = 32;

    const alerts = [
        { type: 'warning', icon: Thermometer, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', title: 'Heatwave Risk', body: 'Temperatures 3°C above seasonal average expected next week. Risk of crop stress for sensitive crops.' },
        { type: 'info', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', title: 'Monsoon Onset', body: 'Southwest monsoon expected to arrive in 12 days. Prepare drainage to prevent waterlogging.' },
        { type: 'success', icon: Wind, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/20', border: 'border-primary-200 dark:border-primary-800', title: 'Favorable Wind Conditions', body: 'Moderate northeasterly winds will aid pollination for flowering crops this week.' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-header">{t('climate.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('climate.subtitle')}</p>
            </div>

            {/* Risk Score + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card flex flex-col items-center justify-center text-center">
                    <CloudLightning size={28} className="text-orange-500 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Climate Risk Score</p>
                    <div className="relative w-36 h-36 mb-3">
                        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="#fef3c7" strokeWidth="2.5" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray={`${riskScore}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white font-display">{riskScore}</span>
                            <span className="text-xs text-gray-500">/ 100</span>
                        </div>
                    </div>
                    <span className="badge-green">Low Risk</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Good conditions for most crops this season</p>

                    <div className="mt-4 w-full grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                            <p className="text-lg font-bold text-orange-600">12%</p>
                            <p className="text-xs text-gray-500">Drought Risk</p>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <p className="text-lg font-bold text-blue-600">8%</p>
                            <p className="text-xs text-gray-500">Flood Risk</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-3">
                    {alerts.map((a, i) => (
                        <div key={i} className={`flex gap-3 p-4 ${a.bg} border ${a.border} rounded-xl`}>
                            <a.icon size={20} className={`${a.color} flex-shrink-0 mt-0.5`} />
                            <div>
                                <p className={`font-semibold text-sm ${a.color}`}>{a.title}</p>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-0.5">{a.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="section-header mb-4">Rainfall Forecast vs Historical</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={rainfallData}>
                            <defs>
                                <linearGradient id="forecastG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} unit="mm" />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Area type="monotone" dataKey="avg" name="Historical Avg" stroke="#9ca3af" fill="none" strokeDasharray="4 2" strokeWidth={1.5} />
                            <Area type="monotone" dataKey="forecast" name="AI Forecast" stroke="#3b82f6" fill="url(#forecastG)" strokeWidth={2} />
                            <Area type="monotone" dataKey="actual" name="Actual" stroke="#22c55e" fill="none" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <h3 className="section-header mb-4">Temperature Range Forecast</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={tempData} barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} unit="°C" />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Bar dataKey="min" name="Min Temp" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="max" name="Max Temp" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ClimateRisk;
