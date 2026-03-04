import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Thermometer, Droplets, CloudSun, Play, RefreshCcw } from 'lucide-react';

const BASE_YIELD: Record<string, number> = {
    Rice: 4500, Wheat: 3800, Corn: 5000, Millet: 1800, Sorghum: 2200
};

const simulateScenario = (crop: string, rainfallChange: number, tempChange: number, drought: number) => {
    const base = BASE_YIELD[crop] || 3500;
    const rainFactor = rainfallChange > 0 ? 1 + rainfallChange * 0.003 : 1 + rainfallChange * 0.006;
    const tempFactor = tempChange > 2 ? 1 - (tempChange - 2) * 0.05 : 1;
    const droughtFactor = 1 - drought * 0.08;
    const predicted = Math.round(base * rainFactor * tempFactor * droughtFactor);
    const change = (((predicted - base) / base) * 100).toFixed(1);
    return { base, predicted, change };
};

const SCENARIOS = [
    { label: 'Baseline (Current)', rainfall: 0, temp: 0, drought: 0, color: '#22c55e' },
    { label: '-20% Rainfall', rainfall: -20, temp: 0, drought: 1, color: '#f59e0b' },
    { label: '+2°C Temperature', rainfall: 0, temp: 2, drought: 0, color: '#f97316' },
    { label: 'Severe Drought', rainfall: -40, temp: 3, drought: 2, color: '#ef4444' },
    { label: 'El Niño Pattern', rainfall: -30, temp: 2, drought: 1.5, color: '#8b5cf6' },
];

const ClimateSimulator: React.FC = () => {
    const { t } = useTranslation();
    const [crop, setCrop] = useState('Rice');
    const [rainfallChange, setRainfallChange] = useState(0);
    const [tempChange, setTempChange] = useState(0);
    const [drought, setDrought] = useState(0);
    const [simulated, setSimulated] = useState(false);
    const [loading, setLoading] = useState(false);

    const result = simulateScenario(crop, rainfallChange, tempChange, drought);

    const chartData = SCENARIOS.map(s => {
        const r = simulateScenario(crop, s.rainfall, s.temp, s.drought);
        return { name: s.label, yield: r.predicted, change: Number(r.change), color: s.color };
    });

    // Add custom scenario
    chartData.push({ name: 'Your Scenario', yield: result.predicted, change: Number(result.change), color: '#22c55e' });

    const handleSimulate = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        setSimulated(true);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center md:flex-row md:items-start justify-between gap-4 text-center md:text-left">
                <div>
                    <h1 className="page-header text-gradient font-extrabold">{t('simulator.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">{t('simulator.subtitle')}</p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="badge-gold py-1.5 px-3 shadow-sm border border-gold-200 dark:border-gold-800">
                        ✨ Premium AI Simulation
                    </span>
                    <span className="badge bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                        🏆 Precision Intelligence
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls */}
                <div className="card glass-gold border-gold-300 dark:border-gold-800/40 space-y-5">
                    <h3 className="section-header text-gold-700 dark:text-gold-400">Scenario Controls</h3>

                    <div>
                        <label className="label">Crop</label>
                        <select className="input-field" value={crop} onChange={e => setCrop(e.target.value)}>
                            {Object.keys(BASE_YIELD).map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="label mb-0">🌧️ Rainfall Change</label>
                            <span className={`text-sm font-bold ${rainfallChange >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                {rainfallChange > 0 ? '+' : ''}{rainfallChange}%
                            </span>
                        </div>
                        <input type="range" min="-50" max="50" value={rainfallChange}
                            onChange={e => setRainfallChange(Number(e.target.value))}
                            className="w-full accent-blue-500" />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                            <span>-50%</span><span>+50%</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="label mb-0">🌡️ Temperature Change</label>
                            <span className={`text-sm font-bold ${tempChange > 2 ? 'text-red-500' : 'text-orange-500'}`}>+{tempChange}°C</span>
                        </div>
                        <input type="range" min="0" max="6" step="0.5" value={tempChange}
                            onChange={e => setTempChange(Number(e.target.value))}
                            className="w-full accent-orange-500" />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                            <span>0°C</span><span>+6°C</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="label mb-0">☀️ Drought Severity</label>
                            <span className={`text-sm font-bold ${drought > 1 ? 'text-red-500' : drought > 0 ? 'text-yellow-500' : 'text-primary-500'}`}>
                                {drought === 0 ? 'None' : drought <= 1 ? 'Mild' : drought <= 2 ? 'Moderate' : 'Severe'}
                            </span>
                        </div>
                        <input type="range" min="0" max="3" step="0.5" value={drought}
                            onChange={e => setDrought(Number(e.target.value))}
                            className="w-full accent-red-500" />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                            <span>None</span><span>Severe</span>
                        </div>
                    </div>

                    <button onClick={handleSimulate} disabled={loading} className="btn-primary w-full">
                        {loading
                            ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Simulating...</span>
                            : <span className="flex items-center justify-center gap-2"><Play size={16} />Run Simulation</span>
                        }
                    </button>

                    {/* Quick Scenarios */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Quick Scenarios</p>
                        {SCENARIOS.slice(1).map(s => (
                            <button key={s.label} onClick={() => { setRainfallChange(s.rainfall); setTempChange(s.temp); setDrought(s.drought); setSimulated(true); }}
                                className="w-full text-left text-xs py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Impact Card */}
                    <div className={`card shadow-glow-gold transition-all duration-500 border-b-4 ${Number(result.change) >= 0 ? 'border-primary-500' : 'border-red-500'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Predicted Yield for {crop}</p>
                                <p className="text-4xl font-bold font-display text-gray-900 dark:text-white mt-1">
                                    {result.predicted.toLocaleString()}
                                    <span className="text-lg font-normal text-gray-500"> kg/ha</span>
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-sm text-gray-500">Baseline: {result.base.toLocaleString()} kg/ha</span>
                                    <span className={`badge ${Number(result.change) >= 0 ? 'badge-green' : 'badge-red'}`}>
                                        {Number(result.change) >= 0 ? '+' : ''}{result.change}% vs baseline
                                    </span>
                                </div>
                            </div>

                            {Number(result.change) < -20 && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                                    ⚠️ <strong>High Impact Alert:</strong> Consider switching to a more resilient crop variety
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scenario Comparison Chart */}
                    <div className="card">
                        <h3 className="section-header mb-4">Scenario Comparison</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={chartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} unit=" kg" />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={110} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v: number) => [`${v.toLocaleString()} kg/ha`, 'Yield']} />
                                <ReferenceLine x={result.base} stroke="#6b7280" strokeDasharray="3 3" />
                                <Bar dataKey="yield" radius={[0, 6, 6, 0]}
                                    fill="#22c55e"
                                    label={{ position: 'right', fontSize: 10, fill: '#6b7280', formatter: (v: number) => v.toLocaleString() }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClimateSimulator;
