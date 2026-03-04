import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRight, CheckCircle, Sprout, TrendingDown, Cloud } from 'lucide-react';

const CROPS_DB: Record<string, {
    waterNeed: string; climateResilience: number; profitScore: number; alternatives: string[];
    switchRules: { condition: string; alternative: string; reason: string }[];
}> = {
    Rice: {
        waterNeed: 'Very High', climateResilience: 45, profitScore: 78,
        alternatives: ['Millet', 'Sorghum', 'Groundnut'],
        switchRules: [
            { condition: 'Rainfall decreases >20%', alternative: 'Millet', reason: 'Millet is drought-tolerant and requires 60% less water than rice.' },
            { condition: 'Temperature increases >3°C', alternative: 'Sorghum', reason: 'Sorghum thrives in high heat and is heat-stress resistant.' },
            { condition: 'Water scarcity (severe)', alternative: 'Groundnut', reason: 'Groundnut has deep roots and excellent drought tolerance.' },
        ]
    },
    Wheat: {
        waterNeed: 'Medium', climateResilience: 62, profitScore: 72,
        alternatives: ['Barley', 'Chickpea', 'Mustard'],
        switchRules: [
            { condition: 'Rainfall decreases >30%', alternative: 'Barley', reason: 'Barley is more drought-tolerant than wheat with lower water needs.' },
            { condition: 'Temperature increases >2°C', alternative: 'Chickpea', reason: 'Chickpea adapts well to warmer conditions and fixes nitrogen.' },
        ]
    },
    Corn: {
        waterNeed: 'High', climateResilience: 55, profitScore: 80,
        alternatives: ['Sorghum', 'Millet', 'Cowpea'],
        switchRules: [
            { condition: 'Drought probability >40%', alternative: 'Sorghum', reason: 'Sorghum yields well under water stress losing only 20% yield vs 50% for corn.' },
            { condition: 'Rainfall decreases >25%', alternative: 'Millet', reason: 'Millet completes its lifecycle with minimal water inputs.' },
        ]
    },
};

const CropSwitchingAdvisor: React.FC = () => {
    const { t } = useTranslation();
    const [currentCrop, setCurrentCrop] = useState('Rice');
    const [rainfallRisk, setRainfallRisk] = useState(25);
    const [tempRisk, setTempRisk] = useState(2.5);
    const [analyzed, setAnalyzed] = useState(false);
    const [loading, setLoading] = useState(false);

    const cropInfo = CROPS_DB[currentCrop] || CROPS_DB['Rice'];
    const overallRisk = Math.round((rainfallRisk * 0.6 + tempRisk * 8) / 2);

    const handleAnalyze = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 900));
        setAnalyzed(true);
        setLoading(false);
    };

    const activeRules = cropInfo.switchRules.filter((_, i) =>
        (i === 0 && rainfallRisk > 20) || (i === 1 && tempRisk > 2) || (i === 2 && rainfallRisk > 35)
    );

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="page-header">{t('switching.title')}</h1>
                    <span className="badge bg-earth-100 dark:bg-earth-900/30 text-earth-700 dark:text-earth-300">🏆 Hackathon Feature</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400">{t('switching.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Config */}
                <div className="card">
                    <h3 className="section-header mb-4">Farm Conditions</h3>
                    <div className="space-y-5">
                        <div>
                            <label className="label">Current Crop</label>
                            <select className="input-field" value={currentCrop} onChange={e => { setCurrentCrop(e.target.value); setAnalyzed(false); }}>
                                {Object.keys(CROPS_DB).map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="label mb-0">Rainfall Deficit Risk</label>
                                <span className={`text-sm font-bold ${rainfallRisk > 30 ? 'text-red-500' : rainfallRisk > 15 ? 'text-yellow-500' : 'text-primary-500'}`}>{rainfallRisk}%</span>
                            </div>
                            <input type="range" min="0" max="60" value={rainfallRisk} onChange={e => setRainfallRisk(Number(e.target.value))} className="w-full accent-blue-500" />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="label mb-0">Temperature Increase</label>
                                <span className={`text-sm font-bold ${tempRisk > 3 ? 'text-red-500' : 'text-orange-500'}`}>+{tempRisk}°C</span>
                            </div>
                            <input type="range" min="0" max="6" step="0.5" value={tempRisk} onChange={e => setTempRisk(Number(e.target.value))} className="w-full accent-orange-500" />
                        </div>

                        <button onClick={handleAnalyze} disabled={loading} className="btn-primary w-full">
                            {loading
                                ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Analyzing...</span>
                                : <span className="flex items-center justify-center gap-2"><Sprout size={16} />Get AI Recommendation</span>
                            }
                        </button>

                        {/* Crop Profile */}
                        <div className="pt-2 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{currentCrop} Profile</h4>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Water Need</span>
                                <span className={`badge ${cropInfo.waterNeed === 'Very High' ? 'badge-red' : cropInfo.waterNeed === 'High' ? 'badge-yellow' : 'badge-green'}`}>{cropInfo.waterNeed}</span>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Climate Resilience</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{cropInfo.climateResilience}%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                    <div className="h-2 bg-primary-500 rounded-full" style={{ width: `${cropInfo.climateResilience}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Risk Summary */}
                    <div className={`card ${overallRisk > 40 ? 'border-red-200 dark:border-red-800' : overallRisk > 20 ? 'border-yellow-200 dark:border-yellow-800' : 'border-primary-200 dark:border-primary-800'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Overall Climate Risk for {currentCrop}</p>
                                <p className="text-3xl font-bold font-display text-gray-900 dark:text-white mt-1">{overallRisk}% Risk</p>
                            </div>
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${overallRisk > 40 ? 'bg-red-100 dark:bg-red-900/20' : overallRisk > 20 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-primary-100 dark:bg-primary-900/20'}`}>
                                {overallRisk > 40 ? <AlertTriangle size={28} className="text-red-500" /> : <TrendingDown size={28} className="text-yellow-500" />}
                            </div>
                        </div>
                    </div>

                    {/* Switch Recommendations */}
                    {(analyzed || activeRules.length > 0) && (
                        <div className="space-y-3">
                            <h3 className="section-header">🤖 AI Crop Switch Recommendations</h3>
                            {(activeRules.length > 0 ? activeRules : cropInfo.switchRules.slice(0, 1)).map((rule, i) => (
                                <div key={i} className="card p-4 border-l-4 border-primary-500 space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertTriangle size={14} className="text-yellow-500" />
                                                <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{rule.condition}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">{currentCrop}</span>
                                                <ArrowRight size={16} className="text-primary-500" />
                                                <span className="font-bold text-primary-600 dark:text-primary-400">{rule.alternative}</span>
                                            </div>
                                        </div>
                                        <span className="badge-green whitespace-nowrap">Recommended</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{rule.reason}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Alternative Crops Grid */}
                    <div className="card">
                        <h3 className="section-header mb-4">Alternative Climate-Resilient Crops</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {cropInfo.alternatives.map(alt => (
                                <div key={alt} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Sprout size={18} className="text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{alt}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Climate resilient</p>
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

export default CropSwitchingAdvisor;
