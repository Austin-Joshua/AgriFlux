import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { FlaskConical, AlertTriangle, CheckCircle, Leaf, Target } from 'lucide-react';

const Gauge: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => (
    <div className="flex flex-col items-center">
        <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#e5e7eb" strokeWidth="2.5" className="dark:stroke-gray-700" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${value}, 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold dark:text-white">{value}</span>
            </div>
        </div>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
);

const SoilHealthAdvisor: React.FC = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({ nitrogen: '60', phosphorus: '35', potassium: '45', ph: '6.5', organicCarbon: '1.2' });
    const [analyzed, setAnalyzed] = useState(false);
    const [loading, setLoading] = useState(false);

    const radarData = [
        { subject: 'Nitrogen', value: Math.min(100, (Number(form.nitrogen) / 100) * 100) },
        { subject: 'Phosphorus', value: Math.min(100, (Number(form.phosphorus) / 50) * 100) },
        { subject: 'Potassium', value: Math.min(100, (Number(form.potassium) / 60) * 100) },
        { subject: 'pH', value: Math.min(100, ((Number(form.ph) - 4) / 4) * 100) },
        { subject: 'Organic C', value: Math.min(100, (Number(form.organicCarbon) / 3) * 100) },
    ];

    const handleAnalyze = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setAnalyzed(true);
        setLoading(false);
    };

    const pH = Number(form.ph);
    const pHStatus = pH < 5.5 ? 'Acidic' : pH > 7.5 ? 'Alkaline' : 'Optimal';
    const overallScore = Math.round(
        (Number(form.nitrogen) / 100 + Number(form.phosphorus) / 50 + Number(form.potassium) / 60 + (pH >= 6 && pH <= 7 ? 1 : 0.5) + Number(form.organicCarbon) / 3) / 5 * 100
    );

    const fertilizers = [
        { name: 'Urea (N)', dose: `${Math.max(0, 100 - Number(form.nitrogen))} kg/ha`, color: 'primary' },
        { name: 'DAP (P)', dose: `${Math.max(0, 50 - Number(form.phosphorus))} kg/ha`, color: 'blue' },
        { name: 'MOP (K)', dose: `${Math.max(0, 60 - Number(form.potassium))} kg/ha`, color: 'earth' },
    ];

    const suitableCrops = overallScore > 70 ? ['Rice', 'Wheat', 'Corn', 'Sugarcane'] :
        overallScore > 50 ? ['Millet', 'Sorghum', 'Groundnut'] : ['Barley', 'Millet'];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-header">{t('soil.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('soil.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Soil Input Form */}
                <div className="card">
                    <h3 className="section-header mb-4">Soil Test Parameters</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'nitrogen', label: 'Nitrogen (N)', unit: 'kg/ha', max: '200' },
                            { name: 'phosphorus', label: 'Phosphorus (P)', unit: 'kg/ha', max: '100' },
                            { name: 'potassium', label: 'Potassium (K)', unit: 'kg/ha', max: '120' },
                            { name: 'ph', label: 'pH Level', unit: '0-14', max: '14', step: '0.1' },
                            { name: 'organicCarbon', label: 'Organic Carbon', unit: '%', max: '5', step: '0.1' },
                        ].map(f => (
                            <div key={f.name}>
                                <label className="label">{f.label} <span className="text-gray-400 font-normal">({f.unit})</span></label>
                                <input
                                    type="number"
                                    value={form[f.name as keyof typeof form]}
                                    onChange={e => setForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                                    className="input-field"
                                    max={f.max} min="0" step={f.step || '1'}
                                />
                            </div>
                        ))}

                        <button onClick={handleAnalyze} disabled={loading} className="btn-primary w-full">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Analyzing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2"><FlaskConical size={16} /> {t('soil.analyze')}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Radar + Score */}
                <div className="card">
                    <h3 className="section-header mb-3">Soil Profile</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                            <Radar name="Soil" dataKey="value" stroke="#b8823d" fill="#b8823d" fillOpacity={0.25} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>

                    <div className="mt-4 flex justify-around">
                        <Gauge value={overallScore} label="Overall Score" color="#22c55e" />
                        <Gauge value={Math.min(100, Math.round((Number(form.organicCarbon) / 3) * 100))} label="Organic Matter" color="#b8823d" />
                        <Gauge value={pH < 5.5 ? 45 : pH > 7.5 ? 55 : 85} label="pH Status" color="#3b82f6" />
                    </div>

                    {/* pH Status */}
                    <div className={`mt-4 p-3 rounded-xl text-sm ${pHStatus === 'Optimal' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' :
                            'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                        }`}>
                        <p className="font-semibold">pH: {form.ph} — {pHStatus}</p>
                        {pHStatus !== 'Optimal' && (
                            <p className="text-xs mt-0.5">
                                {pH < 5.5 ? 'Add 2 t/ha agricultural lime to correct acidity' : 'Apply gypsum or sulfur to reduce alkalinity'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="card space-y-4">
                    <h3 className="section-header">{t('soil.recommendations')}</h3>
                    {fertilizers.map(f => (
                        <div key={f.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${f.color === 'primary' ? 'bg-primary-500' : f.color === 'blue' ? 'bg-blue-500' : 'bg-earth-500'}`} />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{f.name}</span>
                            </div>
                            <span className={`badge ${f.color === 'primary' ? 'badge-green' : f.color === 'blue' ? 'badge-blue' : 'badge-earth'}`}>{f.dose}</span>
                        </div>
                    ))}

                    <div className="pt-2">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                            <Target size={14} className="text-primary-500" /> Crop Suitability
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {suitableCrops.map(c => (
                                <span key={c} className="badge-green">{c}</span>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 space-y-2">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Improvement Strategies</h4>
                        {['Add organic compost 5t/ha annually', 'Practice crop rotation to restore nutrients', 'Use biofertilizers to boost microbial activity'].map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <CheckCircle size={14} className="text-primary-500 flex-shrink-0" />
                                {s}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoilHealthAdvisor;
