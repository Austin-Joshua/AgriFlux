import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { FlaskConical, AlertTriangle, CheckCircle, Leaf, Target, UploadCloud, FileText } from 'lucide-react';
import ReportModal from '../components/ReportModal';

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
    const [uploading, setUploading] = useState(false);
    const [predictionText, setPredictionText] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [reportModal, setReportModal] = useState<{ isOpen: boolean; title: string; content: React.ReactNode; type: 'success' | 'warning' | 'info' }>({
        isOpen: false,
        title: '',
        content: null,
        type: 'info'
    });

    const pH = Number(form.ph);
    const overallScore = Math.round(
        (Number(form.nitrogen) / 100 + Number(form.phosphorus) / 50 + Number(form.potassium) / 60 + (pH >= 6 && pH <= 7 ? 1 : 0.5) + Number(form.organicCarbon) / 3) / 5 * 100
    );

    const openReport = (label: string) => {
        let content: React.ReactNode = null;
        let type: 'success' | 'warning' | 'info' = 'info';

        if (label === 'Overall Soil Score') {
            content = (
                <div className="space-y-4">
                    <p>Current Soil Health Index: <strong>{overallScore}/100</strong></p>
                    <p>The Soil Health Index is a composite metric derived from physical, chemical, and biological properties of the soil. It indicates the soil's capacity to function as a vital living ecosystem.</p>
                    <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800">
                        <h4 className="font-bold text-primary-700 dark:text-primary-300 mb-2">AI Soil Verdict</h4>
                        <p className="text-sm">Your soil is in the <strong>"Healthy"</strong> category. The nutrient balance is favorable for cereal crops, though Phosphorus levels are slightly below optimal. The biological activity index is trending upwards due to your recent organic addition practices.</p>
                    </div>
                </div>
            );
            type = 'success';
        } else if (label === 'Nutrient Balance') {
            content = (
                <div className="space-y-4">
                    <p>N-P-K Ratio Status: <strong>{Number(form.nitrogen) > 50 ? 'Balanced' : 'Deficient'}</strong></p>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                            <p className="text-[10px] text-gray-400">Nitrogen</p>
                            <p className="font-bold">{form.nitrogen}</p>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                            <p className="text-[10px] text-gray-400">Phosphorus</p>
                            <p className="font-bold">{form.phosphorus}</p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                            <p className="text-[10px] text-gray-400">Potassium</p>
                            <p className="font-bold">{form.potassium}</p>
                        </div>
                    </div>
                    <p className="text-sm">Balanced nutrients are essential for enzymatic processes and structural integrity of the plant. A deficiency in Phosphorus (P) as seen here can lead to stunted root development.</p>
                </div>
            );
            type = 'info';
        } else if (label === 'pH Level') {
            const status = pH < 5.5 ? 'Acidic' : pH > 7.5 ? 'Alkaline' : 'Optimal';
            content = (
                <div className="space-y-4">
                    <p>Soil pH Level: <strong>{pH} ({status})</strong></p>
                    <p>Soil pH determines the bioavailability of all essential nutrients. Outside the 6.0-7.0 range, many nutrients become chemically locked and unavailable to roots.</p>
                </div>
            );
            type = status === 'Optimal' ? 'success' : 'warning';
        } else if (label === 'Organic Carbon') {
            content = (
                <div className="space-y-4">
                    <p>Organic Carbon: <strong>{form.organicCarbon}%</strong></p>
                    <p>Soil Organic Carbon is the backbone of soil health. It improves water holding capacity, cation exchange capacity, and supports the soil microbiome.</p>
                </div>
            );
            type = 'success';
        }

        setReportModal({ isOpen: true, title: label, content, type });
    };

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
        setPredictionText(null);
        setAnalyzed(true);
        setLoading(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        // Simulate document OCR and data extraction
        await new Promise(r => setTimeout(r, 2000));
        setForm({ nitrogen: '42', phosphorus: '18', potassium: '55', ph: '6.8', organicCarbon: '1.5' });
        setPredictionText("Govt. Soil Health Card parsed successfully. The soil shows optimal pH but is deficient in Phosphorus. Current levels support Wheat and Corn, provided targeted P-fertilizer is applied.");
        setAnalyzed(true);
        setUploading(false);
    };

    const status = pH < 5.5 ? 'Acidic' : pH > 7.5 ? 'Alkaline' : 'Optimal';

    const fertilizers = [
        { name: 'Urea (N)', dose: `${Math.max(0, 100 - Number(form.nitrogen))} kg/ha`, color: 'primary' },
        { name: 'DAP (P)', dose: `${Math.max(0, 50 - Number(form.phosphorus))} kg/ha`, color: 'blue' },
        { name: 'MOP (K)', dose: `${Math.max(0, 60 - Number(form.potassium))} kg/ha`, color: 'earth' },
    ];

    const suitableCrops = overallScore > 70 ? ['Rice', 'Wheat', 'Corn', 'Sugarcane'] :
        overallScore > 50 ? ['Millet', 'Sorghum', 'Groundnut'] : ['Barley', 'Millet'];

    return (
        <div className="space-y-6">
            <ReportModal
                isOpen={reportModal.isOpen}
                onClose={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
                title={reportModal.title}
                content={reportModal.content}
                type={reportModal.type}
            />
            <div className="flex flex-col items-center md:flex-row md:items-start justify-between gap-4 text-center md:text-left">
                <div>
                    <h1 className="page-header text-gradient font-extrabold">{t('soil.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">{t('soil.subtitle')}</p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="badge-gold py-1.5 px-3 shadow-sm border border-gold-200 dark:border-gold-800">
                        ✨ Premium Soil Analysis
                    </span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Overall Soil Score', value: `${overallScore}/100`, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20', icon: '🏆' },
                    { label: 'Nutrient Balance', value: Number(form.nitrogen) > 50 ? 'Optimal' : 'Needs NPK', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: '🧪' },
                    { label: 'pH Level', value: form.ph, color: 'text-gold-600', bg: 'glass-gold border-gold-200', icon: '💎' },
                    { label: 'Organic Carbon', value: `${form.organicCarbon}%`, color: 'text-earth-600', bg: 'bg-earth-50 dark:bg-earth-900/20', icon: '🍂' },
                ].map(s => (
                    <div
                        key={s.label}
                        onClick={() => openReport(s.label)}
                        className={`card p-4 transition-all hover:scale-105 hover:shadow-xl duration-300 cursor-pointer group active:scale-95 ${s.bg}`}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-2xl group-hover:rotate-12 transition-transform">{s.icon}</span>
                            <span className="text-[8px] font-bold uppercase tracking-tighter text-gray-400 group-hover:text-primary-500 transition-colors">Click for report</span>
                        </div>
                        <p className={`text-2xl font-black font-display mt-2 ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Soil Input Form */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header flex-1">Soil Test Parameters</h3>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUpload} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-outline py-1.5 px-3 flex items-center gap-1 text-xs">
                            {uploading ? <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> : <UploadCloud size={14} />}
                            Upload Govt Doc
                        </button>
                    </div>
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
                <div className="card glass-gold border-gold-300 dark:border-gold-900/40">
                    <h3 className="section-header mb-3 text-gold-700 dark:text-gold-400">Soil Profile</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#fde047" strokeWidth={0.5} strokeOpacity={0.3} />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#b8823d' }} />
                            <Radar name="Soil" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2.5} />
                        </RadarChart>
                    </ResponsiveContainer>

                    <div className="mt-4 flex justify-around">
                        <Gauge value={overallScore} label="Overall Score" color="#22c55e" />
                        <Gauge value={Math.min(100, Math.round((Number(form.organicCarbon) / 3) * 100))} label="Organic Matter" color="#b8823d" />
                        <Gauge value={pH < 5.5 ? 45 : pH > 7.5 ? 55 : 85} label="pH Status" color="#3b82f6" />
                    </div>

                    {/* pH Status */}
                    <div className={`mt-4 p-3 rounded-xl text-sm ${status === 'Optimal' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' :
                        'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                        }`}>
                        <p className="font-semibold">pH: {form.ph} — {status}</p>
                        {status !== 'Optimal' && (
                            <p className="text-xs mt-0.5">
                                {pH < 5.5 ? 'Add 2 t/ha agricultural lime to correct acidity' : 'Apply gypsum or sulfur to reduce alkalinity'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="card space-y-4">
                    <h3 className="section-header">{t('soil.recommendations')}</h3>

                    {predictionText && (
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800/50 rounded-xl mb-4">
                            <h4 className="font-bold text-primary-700 dark:text-primary-400 text-sm flex items-center gap-2 mb-1">
                                <FileText size={14} /> AI Document Analysis
                            </h4>
                            <p className="text-xs text-primary-800 dark:text-primary-300 leading-relaxed italic">{predictionText}</p>
                        </div>
                    )}
                    {fertilizers.map(f => (
                        <div key={f.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="flex items-center justify-center md:justify-start gap-2">
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
