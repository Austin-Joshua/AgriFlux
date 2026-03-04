import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Lightbulb, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CROPS = ['Rice', 'Wheat', 'Corn', 'Sugarcane', 'Cotton', 'Soybean', 'Millet', 'Barley', 'Sorghum', 'Groundnut'];

const predictYield = (inputs: Record<string, number | string>) => {
    const baseYields: Record<string, number> = {
        Rice: 4500, Wheat: 3800, Corn: 5000, Sugarcane: 70000, Cotton: 1500,
        Soybean: 2800, Millet: 1800, Barley: 3200, Sorghum: 2200, Groundnut: 2000
    };
    const crop = inputs.cropType as string;
    const base = baseYields[crop] || 3000;
    const n = Number(inputs.nitrogen), p = Number(inputs.phosphorus), k = Number(inputs.potassium);
    const rain = Number(inputs.rainfall), temp = Number(inputs.temperature);
    const fert = Number(inputs.fertilizerUsed);

    const nutrientScore = Math.min((n / 100 + p / 50 + k / 60) / 3, 1.3);
    const weatherScore = rain > 600 && rain < 1200 ? 1.2 : rain < 300 ? 0.7 : 1.0;
    const tempScore = temp >= 20 && temp <= 30 ? 1.1 : temp < 15 || temp > 38 ? 0.7 : 1.0;
    const fertScore = fert > 200 ? 1.15 : fert < 50 ? 0.85 : 1.0;

    const predicted = Math.round(base * nutrientScore * weatherScore * tempScore * fertScore);
    const historical = Number(inputs.historicalYield) || base;
    const improvement = (((predicted - historical) / historical) * 100).toFixed(1);
    const risk = predicted < historical * 0.85 ? 'High' : predicted < historical * 0.95 ? 'Medium' : 'Low';

    return { predicted, improvement, risk };
};

const YieldPrediction: React.FC = () => {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const [form, setForm] = useState({
        cropType: 'Rice', nitrogen: '80', phosphorus: '40', potassium: '50',
        rainfall: '800', temperature: '26', humidity: '65', fertilizerUsed: '150', historicalYield: '4000'
    });
    const [result, setResult] = useState<{ predicted: number; improvement: string; risk: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handlePredict = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 1200));
        setResult(predictYield(form));
        setLoading(false);
    };

    const radarData = [
        { subject: 'Nitrogen', value: Math.min(100, (Number(form.nitrogen) / 120) * 100) },
        { subject: 'Phosphorus', value: Math.min(100, (Number(form.phosphorus) / 60) * 100) },
        { subject: 'Potassium', value: Math.min(100, (Number(form.potassium) / 70) * 100) },
        { subject: 'Moisture', value: Math.min(100, (Number(form.humidity) / 80) * 100) },
        { subject: 'Rainfall', value: Math.min(100, (Number(form.rainfall) / 1200) * 100) },
    ];

    const suggestions = [
        'Apply 20kg/ha more NPK for optimal growth',
        'Schedule irrigation 3 days before flowering stage',
        'Monitor for fungal diseases in high humidity conditions',
        'Consider split fertilizer application for better absorption',
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="page-header text-gradient font-extrabold">{t('yield.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('yield.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="badge-gold py-1.5 px-3 shadow-sm border border-gold-200 dark:border-gold-800">
                        ✨ Full AI Report
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Input Form */}
                <div className="xl:col-span-2 card">
                    <h3 className="section-header mb-4">Input Parameters</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="label">{t('yield.cropType')}</label>
                            <div className="relative">
                                <select
                                    name="cropType"
                                    value={form.cropType}
                                    onChange={handleChange}
                                    className="input-field appearance-none pr-10"
                                >
                                    {CROPS.map(c => <option key={c}>{c}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        {[
                            { name: 'nitrogen', label: t('yield.nitrogen'), unit: 'kg/ha', max: '200' },
                            { name: 'phosphorus', label: t('yield.phosphorus'), unit: 'kg/ha', max: '100' },
                            { name: 'potassium', label: t('yield.potassium'), unit: 'kg/ha', max: '120' },
                            { name: 'rainfall', label: t('yield.rainfall'), unit: 'mm', max: '2000' },
                            { name: 'temperature', label: t('yield.temperature'), unit: '°C', max: '45' },
                            { name: 'humidity', label: t('yield.humidity'), unit: '%', max: '100' },
                            { name: 'fertilizerUsed', label: t('yield.fertilizerUsed'), unit: 'kg/ha', max: '400' },
                            { name: 'historicalYield', label: t('yield.historicalYield'), unit: 'kg/ha', max: '10000' },
                        ].map(field => (
                            <div key={field.name}>
                                <label className="label">{field.label} <span className="text-gray-400 font-normal">({field.unit})</span></label>
                                <input
                                    type="number"
                                    name={field.name}
                                    value={form[field.name as keyof typeof form]}
                                    onChange={handleChange}
                                    max={field.max}
                                    min="0"
                                    className="input-field"
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handlePredict}
                        disabled={loading}
                        className="btn-primary w-full mt-5 py-3 text-base"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Running AI Model...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <TrendingUp size={18} /> {t('yield.predictYield')}
                            </span>
                        )}
                    </button>
                </div>

                {/* Radar Chart */}
                <div className="card glass-gold flex flex-col border-gold-200 dark:border-gold-900/40">
                    <h3 className="section-header mb-3 text-gold-700 dark:text-gold-400">Nutrient Profile</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke={isDark ? '#4b5563' : '#e5e7eb'} />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                            <Radar name="Soil" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2.5} />
                        </RadarChart>
                    </ResponsiveContainer>

                    {result && (
                        <div className={`mt-4 p-5 rounded-2xl border-b-4 shadow-xl transition-all animate-scale-in ${result.risk === 'Low' ? 'border-primary-500 bg-white dark:bg-gray-800' :
                            result.risk === 'Medium' ? 'border-gold-500 bg-white dark:bg-gray-800' :
                                'border-red-500 bg-white dark:bg-gray-800'
                            }`}>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{t('yield.predictedYield')}</p>
                            <p className="text-4xl font-extrabold text-gray-900 dark:text-white font-display">
                                {result.predicted.toLocaleString()}<span className="text-sm font-normal text-gray-500 ml-1">kg/ha</span>
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`badge py-1 px-3 ${result.risk === 'Low' ? 'badge-green' : result.risk === 'Medium' ? 'badge-gold' : 'badge-red'}`}>
                                    {result.risk} Risk
                                </span>
                                <span className={`flex items-center gap-1 text-sm font-bold ${Number(result.improvement) >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-500'}`}>
                                    {Number(result.improvement) >= 0 ? <TrendingUp size={14} /> : null}
                                    {Number(result.improvement) >= 0 ? '+' : ''}{result.improvement}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Suggestions */}
            {result && (
                <div className="card animate-slide-up">
                    <h3 className="section-header mb-4 flex items-center gap-2">
                        <Lightbulb size={18} className="text-yellow-500" />
                        {t('yield.suggestions')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <CheckCircle size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-700 dark:text-gray-300">{s}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default YieldPrediction;
