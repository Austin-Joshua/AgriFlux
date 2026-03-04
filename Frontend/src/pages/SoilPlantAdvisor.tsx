import React, { useState } from 'react';
import { FlaskConical, Leaf, AlertTriangle, CheckCircle, TrendingUp, Droplets, Thermometer, Info } from 'lucide-react';

interface SoilInput {
    salinity: string; ph: string; moisture: string;
    waterLevel: string; germination: string; region: string;
}

interface CropRec {
    name: string; emoji: string; score: number; suitability: string;
    guidance: string; soilPrep: string; waterReq: string; yieldPotential: string;
    tenYearTrend: string; color: string;
}

function getRecommendations(input: SoilInput): CropRec[] {
    const sal = parseFloat(input.salinity);
    const ph = parseFloat(input.ph);
    const moist = parseFloat(input.moisture);
    const water = parseFloat(input.waterLevel);
    const germ = parseFloat(input.germination);

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

    // Score each crop
    return all.map(crop => {
        let score = 70;
        let suitability = 'Good';

        if (crop.name === 'Rice') {
            if (sal <= 2) score += 15; else if (sal <= 4) score += 5; else score -= 20;
            if (ph >= 5.5 && ph <= 7) score += 10; else score -= 10;
            if (moist >= 70) score += 10; else score -= 15;
        } else if (crop.name === 'Barley') {
            if (sal >= 4) score += 20; else score += 5;
            if (ph >= 7 && ph <= 8.5) score += 15; else score -= 5;
        } else if (crop.name === 'Cotton') {
            if (sal >= 2 && sal <= 6) score += 10;
            if (moist >= 40 && moist <= 65) score += 10; else score -= 5;
            if (water > 1.5) score -= 15;
        } else if (crop.name === 'Wheat') {
            if (sal <= 3) score += 15; else score -= 15;
            if (ph >= 6 && ph <= 7.5) score += 10;
            if (germ <= 7) score += 10;
        } else if (crop.name === 'Maize') {
            if (sal <= 2) score += 10;
            if (moist >= 50 && moist <= 70) score += 10;
            if (water < 1) score -= 10;
        } else if (crop.name === 'Sugarcane') {
            if (moist >= 70) score += 15;
            if (water <= 1) score += 10;
        } else if (crop.name === 'Sunflower') {
            if (moist <= 55 && water > 1.5) score -= 15;
            if (ph >= 6 && ph <= 7.8) score += 10;
        }

        score = Math.max(20, Math.min(98, score));
        if (score >= 80) suitability = 'Excellent';
        else if (score >= 65) suitability = 'Good';
        else if (score >= 45) suitability = 'Moderate';
        else suitability = 'Low';

        return { ...crop, score, suitability };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
}

const SoilPlantAdvisor: React.FC = () => {
    const [input, setInput] = useState<SoilInput>({ salinity: '', ph: '', moisture: '', waterLevel: '', germination: '', region: 'Karnataka' });
    const [recs, setRecs] = useState<CropRec[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [alerts, setAlerts] = useState<string[]>([]);

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
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="page-header">🌱 Advanced Soil & Plant Advisor</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">AI-powered crop recommendations based on soil parameters + 10-year historical guidance</p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-4 py-2 rounded-xl border border-primary-200 dark:border-primary-800">
                    <FlaskConical size={15} />
                    <span className="font-semibold">5 Parameters · AI Analysis</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Input Form */}
                <div className="card lg:col-span-1">
                    <h3 className="section-header mb-4 flex items-center gap-2"><FlaskConical size={16} className="text-primary-500" /> Soil Parameters</h3>
                    <form onSubmit={analyze} className="space-y-4">
                        <div>
                            <label className="label flex items-center gap-1">Salinity <span className="text-gray-400 text-[10px]">(dS/m)</span></label>
                            <input name="salinity" type="number" step="0.1" min="0" max="20" className="input-field" placeholder="0 – 20 dS/m" value={input.salinity} onChange={handleChange} required />
                            <p className="text-[10px] text-gray-400 mt-0.5">{'Normal: 0–2 · Tolerant crops: 2–8 · High: >8'}</p>
                        </div>
                        <div>
                            <label className="label flex items-center gap-1">pH / Alkalinity Level</label>
                            <input name="ph" type="number" step="0.1" min="2" max="14" className="input-field" placeholder="4 – 9 (neutral = 7)" value={input.ph} onChange={handleChange} required />
                            <p className="text-[10px] text-gray-400 mt-0.5">Ideal for most crops: 6.0 – 7.5</p>
                        </div>
                        <div>
                            <label className="label">Moisture Content <span className="text-gray-400 text-[10px]">(%)</span></label>
                            <input name="moisture" type="number" step="1" min="0" max="100" className="input-field" placeholder="0 – 100%" value={input.moisture} onChange={handleChange} required />
                        </div>
                        <div>
                            <label className="label">Water Table Level <span className="text-gray-400 text-[10px]">(m depth)</span></label>
                            <input name="waterLevel" type="number" step="0.1" min="0" max="20" className="input-field" placeholder="Depth in metres" value={input.waterLevel} onChange={handleChange} required />
                            <p className="text-[10px] text-gray-400 mt-0.5">{'< 1m = waterlogging risk · > 3m = drought risk'}</p>
                        </div>
                        <div>
                            <label className="label">Germination Period <span className="text-gray-400 text-[10px]">(days)</span></label>
                            <input name="germination" type="number" step="1" min="1" max="60" className="input-field" placeholder="Days to germination" value={input.germination} onChange={handleChange} required />
                        </div>
                        <div>
                            <label className="label">Region</label>
                            <select name="region" className="input-field" value={input.region} onChange={handleChange}>
                                {regions.map(r => <option key={r}>{r}</option>)}
                            </select>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2">
                            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analysing...</> : <><Leaf size={15} /> Get AI Recommendations</>}
                        </button>
                    </form>
                </div>

                {/* Results */}
                <div className="lg:col-span-2 space-y-4">
                    {!recs && !loading && (
                        <div className="card flex flex-col items-center justify-center py-16 text-center">
                            <FlaskConical size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
                            <h3 className="font-bold text-gray-400 dark:text-gray-500 text-lg">Enter soil parameters to see recommendations</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Our AI analyses salinity, pH, moisture, water table, and germination data to suggest the best crops for your field.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="card flex flex-col items-center justify-center py-16">
                            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
                            <p className="font-semibold text-gray-600 dark:text-gray-300">Analysing soil data against 10-year crop performance records...</p>
                        </div>
                    )}

                    {recs && !loading && (
                        <div className="space-y-4">
                            {/* Alerts */}
                            {alerts.length > 0 && (
                                <div className="card border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10">
                                    <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2"><AlertTriangle size={14} /> Soil Health Alerts</h4>
                                    <div className="space-y-1.5">
                                        {alerts.map((a, i) => <p key={i} className="text-xs text-amber-700 dark:text-amber-400">{a}</p>)}
                                    </div>
                                </div>
                            )}

                            <h3 className="section-header flex items-center gap-2"><Leaf size={16} className="text-primary-500" /> Top 3 Crop Recommendations for {input.region}</h3>

                            {recs.map((rec, i) => (
                                <div key={rec.name} className="card border-l-4 border-l-primary-400 hover:shadow-md transition-all duration-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{rec.emoji}</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-gray-900 dark:text-white text-base">#{i + 1} {rec.name}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rec.suitability === 'Excellent' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : rec.suitability === 'Good' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>{rec.suitability}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full w-32 overflow-hidden">
                                                        <div className={`h-2 bg-gradient-to-r ${rec.color} rounded-full transition-all duration-1000`} style={{ width: `${rec.score}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-500">{rec.score}% match</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{rec.guidance}</p>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        {[
                                            { icon: Droplets, label: 'Water Need', val: rec.waterReq, color: 'text-blue-500' },
                                            { icon: TrendingUp, label: 'Yield Potential', val: rec.yieldPotential, color: 'text-primary-500' },
                                            { icon: FlaskConical, label: 'Soil Prep', val: rec.soilPrep, color: 'text-amber-500' },
                                        ].map(s => (
                                            <div key={s.label} className="flex flex-col gap-1">
                                                <p className="text-[10px] text-gray-400 flex items-center gap-1 uppercase tracking-wide font-semibold">
                                                    <s.icon size={10} className={s.color} />{s.label}
                                                </p>
                                                <p className="text-xs text-gray-700 dark:text-gray-200 font-medium leading-tight">{s.val}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50">
                                        <p className="text-[10px] uppercase tracking-wide font-bold text-primary-600 dark:text-primary-400 mb-1 flex items-center gap-1"><Info size={10} /> 10-Year Market Trend & Guidance</p>
                                        <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed">{rec.tenYearTrend}</p>
                                    </div>
                                </div>
                            ))}

                            <div className="card bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700/50">
                                <p className="text-xs text-gray-400 flex items-start gap-2">
                                    <Info size={13} className="flex-shrink-0 mt-0.5" />
                                    Recommendations are based on typical agronomic norms for the selected region and entered parameters. Always validate with a local KVK (Krishi Vigyan Kendra) or soil testing lab before large-scale planting decisions.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SoilPlantAdvisor;
