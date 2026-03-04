import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Leaf, AlertTriangle, CheckCircle, TrendingUp, Droplets, Sprout, Microscope, Camera, Activity, Search, Info } from 'lucide-react';

interface SoilInput {
    salinity: string; ph: string; moisture: string;
    waterLevel: string; germination: string; region: string;
}

interface CropRec {
    name: string; emoji: string; score: number; suitability: string;
    guidance: string; soilPrep: string; waterReq: string; yieldPotential: string;
    tenYearTrend: string; color: string;
}

const SoilPlantAdvisor: React.FC = () => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<'soil' | 'plant'>('soil');
    const [input, setInput] = useState<SoilInput>({ salinity: '', ph: '', moisture: '', waterLevel: '', germination: '', region: 'Karnataka' });
    const [recs, setRecs] = useState<CropRec[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [alerts, setAlerts] = useState<string[]>([]);

    const getRecommendations = (data: SoilInput): CropRec[] => {
        const sal = parseFloat(data.salinity);
        const ph = parseFloat(data.ph);
        const moist = parseFloat(data.moisture);
        const water = parseFloat(data.waterLevel);
        const germ = parseFloat(data.germination);

        const all: CropRec[] = [
            { name: 'Rice', emoji: '🌾', score: 0, suitability: '', guidance: 'Paddy thrives in high moisture, neutral to slightly acidic soils. Use SRI method to maximise yield with reduced water.', soilPrep: 'Puddle soil 2 weeks before transplant. Apply 25 kg/ha zinc sulphate.', waterReq: '1,200–2,000 mm/season', yieldPotential: '5–8 MT/ha', tenYearTrend: 'Stable demand; MSP raised 8% avg over last 10 years. Export demand rising for Basmati.', color: 'from-green-500 to-green-400' },
            { name: 'Wheat', emoji: '🌿', score: 0, suitability: '', guidance: 'Well-drained loamy soil, low-medium salinity. Sow October–November for best yield. Use DBW 222 or HD 3226 varieties.', soilPrep: 'Deep ploughing + 2 tons FYM. Apply NPK 120:60:40 kg/ha.', waterReq: '450–650 mm (4–6 irrigations)', yieldPotential: '4–6 MT/ha', tenYearTrend: 'Consistent MSP growth, 6.5% avg CAGR. Climate stress reducing N-India yields; technology gap = opportunity.', color: 'from-amber-500 to-amber-400' },
            { name: 'Cotton', emoji: '🌱', score: 0, suitability: '', guidance: 'Tolerates moderate salinity and alkalinity. Deep black cotton soil preferred. Use BT varieties for pest management.', soilPrep: 'Deep summer ploughing. Apply 10 tons FYM + neem cake.', waterReq: '700–1,200 mm (drip preferred)', yieldPotential: '1.8–2.5 MT/ha seed cotton', tenYearTrend: 'Export earnings volatile; domestic textile demand strong. GMO technology providing 15% yield advantage.', color: 'from-blue-500 to-blue-400' },
            { name: 'Maize', emoji: '🌽', score: 0, suitability: '', guidance: 'Well-drained soil, tolerant of moderate moisture. Suitable for a wide pH range. Excellent feed crop with rising demand.', soilPrep: 'Add 2–3 tonnes FYM pre-sowing. NPK 150:75:75 kg/ha.', waterReq: '600–900 mm', yieldPotential: '6–10 MT/ha (hybrid)', tenYearTrend: 'Ethanol blending policy driving 30% demand surge. Contract farming opportunities with poultry and ethanol plants growing rapidly.', color: 'from-yellow-500 to-yellow-400' },
            { name: 'Sunflower', emoji: '🌻', score: 0, suitability: '', guidance: 'Drought-tolerant, suits well-drained soil. Sensitive to waterlogging. Good rotation crop for soil health.', soilPrep: '1 tonne FYM + 40 kg P2O5/ha pre-sowing. Boron foliar spray at bud stage.', waterReq: '500–750 mm (5–6 irrigations)', yieldPotential: '1.5–2.5 MT/ha', tenYearTrend: 'Edible oil import dependency creating strong domestic price support. 10-year avg price up 12% CAGR.', color: 'from-orange-500 to-orange-400' },
            { name: 'Soybean', emoji: '🫘', score: 0, suitability: '', guidance: 'Legume — fixes nitrogen and improves soil. Moderate moisture requirement. Short germination period ideal for quick rotation.', soilPrep: 'Rhizobium seed treatment. Add 20 kg P and K each/ha.', waterReq: '600–700 mm', yieldPotential: '1.5–3 MT/ha', tenYearTrend: 'Protein meal exports booming. MSP revised up 10% in 2023. Strong demand from poultry feed industry.', color: 'from-brown-500 to-earth-400' },
            { name: 'Barley', emoji: '🌾', score: 0, suitability: '', guidance: 'High salinity tolerance (up to 8 dS/m). Cool season crop. Suitable for alkaline soils (pH up to 8.5). Ideal for saline-alkali reclamation.', soilPrep: 'Gypsum application (2.5 t/ha) for alkali soils. Balance K before sowing.', waterReq: '350–500 mm', yieldPotential: '3–5 MT/ha', tenYearTrend: 'Specialty barley for malt and beer industry commands premium of 40–60% above feed grade. Niche market growing.', color: 'from-lime-500 to-lime-400' },
            { name: 'Sugarcane', emoji: '🎋', score: 0, suitability: '', guidance: 'High water requirement but tolerates waterlogging for short periods. Plant in February or October. Ratoon crop helps cut costs.', soilPrep: 'Deep furrow planting, 5 t FYM. Trash mulching conserves moisture.', waterReq: '1,500–2,500 mm', yieldPotential: '70–100 MT/ha cane', tenYearTrend: 'FRP revised annually. Ethanol policy guarantees offtake. Co-gen power adds revenue stream. Long-term price stable.', color: 'from-teal-500 to-teal-400' },
        ];

        return all.map(crop => {
            let s = 70;
            if (crop.name === 'Rice') {
                if (sal <= 2) s += 15; else if (sal <= 4) s += 5; else s -= 20;
                if (ph >= 5.5 && ph <= 7) s += 10; else s -= 10;
                if (moist >= 70) s += 10; else s -= 15;
            } else if (crop.name === 'Barley') {
                if (sal >= 4) s += 20; else s += 5;
                if (ph >= 7 && ph <= 8.5) s += 15; else s -= 5;
            } else if (crop.name === 'Cotton') {
                if (sal >= 2 && sal <= 6) s += 10;
                if (moist >= 40 && moist <= 65) s += 10; else s -= 5;
                if (water > 1.5) s -= 15;
            } else if (crop.name === 'Wheat') {
                if (sal <= 3) s += 15; else s -= 15;
                if (ph >= 6 && ph <= 7.5) s += 10;
                if (germ <= 7) s += 10;
            } else if (crop.name === 'Maize') {
                if (sal <= 2) s += 10;
                if (moist >= 50 && moist <= 70) s += 10;
                if (water < 1) s -= 10;
            } else if (crop.name === 'Sugarcane') {
                if (moist >= 70) s += 15;
                if (water <= 1) s += 10;
            } else if (crop.name === 'Sunflower') {
                if (moist <= 55 && water > 1.5) s -= 15;
                if (ph >= 6 && ph <= 7.8) s += 10;
            }

            s = Math.max(20, Math.min(98, s));
            let suit = 'Good';
            if (s >= 80) suit = 'Excellent';
            else if (s >= 65) suit = 'Good';
            else if (s >= 45) suit = 'Moderate';
            else suit = 'Low';

            return { ...crop, score: s, suitability: suit };
        }).sort((a, b) => b.score - a.score).slice(0, 3);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setInput(p => ({ ...p, [e.target.name]: e.target.value }));

    const analyze = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const warns: string[] = [];
        if (parseFloat(input.salinity) > 6) warns.push('⚠️ High salinity detected. Consider leaching with fresh water and gypsum treatment before planting.');
        if (parseFloat(input.ph) > 8.5) warns.push('⚠️ Highly alkaline soil. Apply gypsum (2–4 t/ha) and sulphur to reduce pH before sowing.');
        if (parseFloat(input.ph) < 5.5) warns.push('⚠️ Acidic soil. Lime application recommended at 1–2 tonnes/ha. Improves nutrient availability.');
        if (parseFloat(input.moisture) < 30) warns.push('⚠️ Low soil moisture. Schedule irrigation or mulching before planting to avoid germination failure.');
        if (parseFloat(input.waterLevel) < 0.5) warns.push('⚠️ Very shallow water table — waterlogging risk. Raised-bed farming recommended.');
        setAlerts(warns);
        await new Promise(r => setTimeout(r, 1200));
        setRecs(getRecommendations(input));
        setLoading(false);
    };

    const regions = ['Karnataka', 'Punjab', 'Maharashtra', 'Uttar Pradesh', 'Rajasthan', 'Andhra Pradesh', 'Tamil Nadu', 'Bihar', 'Madhya Pradesh', 'Gujarat'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-header">🔬 {t('advisor.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('advisor.subtitle')}</p>
                </div>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setMode('soil')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'soil' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {t('advisor.soilAnalysis')}
                    </button>
                    <button
                        onClick={() => setMode('plant')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'plant' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {t('advisor.plantHealth')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {mode === 'soil' ? (
                        <div className="space-y-6">
                            <div className="card">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600">
                                        <FlaskConical size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('advisor.soilReport')}</h2>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('advisor.lastUpdated')}: 2 {t('common.daysAgo')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                    {[
                                        { label: 'pH Level', value: '6.8', status: 'Optimal', color: 'text-green-500' },
                                        { label: 'Nitrogen (N)', value: '42%', status: 'Medium', color: 'text-amber-500' },
                                        { label: 'Phosphorus (P)', value: '18%', status: 'Low', color: 'text-red-500' },
                                        { label: 'Potassium (K)', value: '55%', status: 'High', color: 'text-blue-500' },
                                    ].map(stat => (
                                        <div key={stat.label} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className="text-lg font-black text-gray-900 dark:text-white">{stat.value}</p>
                                            <p className={`text-[10px] font-bold ${stat.color}`}>{stat.status}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="section-header">{t('advisor.recommendations')}</h3>
                                    <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50 flex gap-4">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-xl h-fit shadow-sm"><Droplets size={20} className="text-primary-500" /></div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{t('advisor.irrigationStrategy')}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Based on current moisture levels, increase watering cycles by 15% for the next 3 days to support peak growth phase.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 flex gap-4">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-xl h-fit shadow-sm"><Sprout size={20} className="text-amber-500" /></div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{t('advisor.fertilizerPlan')}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Apply 2.5kg/acre of Phosphorus-rich organic compost to address soil deficiency detected in northern plot B-12.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Manual Analysis Form */}
                            <div className="card">
                                <h3 className="section-header mb-4 flex items-center gap-2"><FlaskConical size={16} className="text-primary-500" /> {t('advisor.manualInput')}</h3>
                                <form onSubmit={analyze} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Salinity (dS/m)</label>
                                        <input name="salinity" type="number" step="0.1" className="input-field" value={input.salinity} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="label">pH Level</label>
                                        <input name="ph" type="number" step="0.1" className="input-field" value={input.ph} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="label">Moisture (%)</label>
                                        <input name="moisture" type="number" className="input-field" value={input.moisture} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="label">Water Table (m)</label>
                                        <input name="waterLevel" type="number" step="0.1" className="input-field" value={input.waterLevel} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="label">Germination Rate (%)</label>
                                        <input name="germination" type="number" className="input-field" value={input.germination} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="label">Region</label>
                                        <select name="region" className="input-field" value={input.region} onChange={handleChange}>
                                            {regions.map(r => <option key={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                                            {loading ? t('common.loading') : t('advisor.getAIRecommendation')}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Recommendations Grid */}
                            {recs && (
                                <div className="space-y-4">
                                    {alerts.map((a, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                                            <AlertTriangle size={14} /> {a}
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-1 gap-4">
                                        {recs.map((rec, i) => (
                                            <div key={rec.name} className="card border-l-4 border-l-primary-500">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-3xl">{rec.emoji}</span>
                                                        <div>
                                                            <h4 className="font-black text-gray-900 dark:text-white">#{i + 1} {rec.name}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="h-1.5 w-24 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                                    <div className={`h-full bg-gradient-to-r ${rec.color}`} style={{ width: `${rec.score}%` }} />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-gray-400">{rec.score}% Match</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600">{rec.suitability}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">{rec.guidance}</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                                    <div><p className="text-[10px] font-bold text-gray-400 uppercase">{t('advisor.waterReq')}</p><p className="text-xs font-bold">{rec.waterReq}</p></div>
                                                    <div><p className="text-[10px] font-bold text-gray-400 uppercase">{t('advisor.yieldPotential')}</p><p className="text-xs font-bold">{rec.yieldPotential}</p></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-primary-600">
                                    <Microscope size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('advisor.plantAnalysis')}</h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">AI Scanner Active</p>
                                </div>
                            </div>

                            <div className="relative aspect-video rounded-3xl bg-gray-900 overflow-hidden group mb-6">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white/50">
                                        <Camera size={48} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">{t('advisor.uploadScan')}</p>
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4 bg-primary-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                                    LIVE SCANNING...
                                </div>
                                {/* Simulated Analysis Overlay */}
                                <div className="absolute inset-0 pointer-events-none border-2 border-primary-500/30 m-8 rounded-2xl">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-500" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-500" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-500" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Activity size={16} className="text-primary-500" />
                                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">{t('advisor.vitals')}</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Chlorophyll Index</span>
                                            <span className="font-bold text-green-500">82% (Excellent)</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Pest Probability</span>
                                            <span className="font-bold text-amber-500">12% (Low)</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50/10 transition-all flex flex-col items-center justify-center gap-2">
                                    <Camera size={20} className="text-gray-400" />
                                    <span className="text-xs font-bold text-gray-500">{t('advisor.newScan')}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <h3 className="section-header mb-4">{t('advisor.upcomingTasks')}</h3>
                        <div className="space-y-3">
                            {[
                                { task: 'Soil Testing Plot C-4', time: 'Tomorrow, 08:00 AM', priority: 'High', color: 'text-red-500' },
                                { task: 'Foliar Nutrient Spray', time: 'Friday, 06:30 AM', priority: 'Normal', color: 'text-primary-500' },
                            ].map(item => (
                                <div key={item.task} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.priority === 'High' ? 'bg-red-500' : 'bg-primary-500'}`} />
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white">{item.task}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{item.time}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${item.color}`}>{item.priority}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card bg-gray-900 text-white border-none shadow-glow-green overflow-hidden relative">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Search size={16} className="text-primary-400" />
                                <h3 className="text-sm font-black uppercase tracking-wider">{t('advisor.expertHelp')}</h3>
                            </div>
                            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                                Get a professional agronomy report for your farm by connecting with our certified experts.
                            </p>
                            <button className="w-full btn-primary !bg-white !text-gray-900 border-none py-3 text-xs font-black rounded-xl">
                                {t('advisor.bookConsultation')}
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 blur-3xl -mr-16 -mt-16" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-600/10 blur-3xl -ml-12 -mb-12" />
                    </div>

                    <div className="card">
                        <h3 className="section-header mb-4">{t('advisor.marketImpact')}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic border-l-2 border-amber-300 pl-3">
                            "Current soil moisture level is ideal for Wheat plantation. This could lead to a 10% higher yield if sowing is completed this week."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoilPlantAdvisor;
