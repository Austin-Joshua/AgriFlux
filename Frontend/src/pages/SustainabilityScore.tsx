import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Award, TrendingUp, Droplets, Leaf, RefreshCcw } from 'lucide-react';
import ReportModal from '../components/ReportModal';

const trendData = [
    { month: 'Aug', score: 62 }, { month: 'Sep', score: 65 }, { month: 'Oct', score: 68 },
    { month: 'Nov', score: 71 }, { month: 'Dec', score: 74 }, { month: 'Jan', score: 78 },
];

const SustainabilityScore: React.FC = () => {
    const { t } = useTranslation();
    const [fertEff] = useState(82);
    const [waterCons] = useState(75);
    const [cropDiv] = useState(68);
    const [soilHealth] = useState(85);
    const [reportModal, setReportModal] = useState<{ isOpen: boolean; title: string; content: React.ReactNode; type: 'success' | 'warning' | 'info' }>({
        isOpen: false,
        title: '',
        content: null,
        type: 'info'
    });

    const overall = Math.round((fertEff + waterCons + cropDiv + soilHealth) / 4);

    const openReport = (label: string) => {
        let content: React.ReactNode = null;
        let type: 'success' | 'warning' | 'info' = 'info';

        if (label === 'Fertilizer Efficiency') {
            content = (
                <div className="space-y-4">
                    <p>Current Efficiency: <strong>{fertEff}%</strong></p>
                    <p>Fertilizer efficiency measures the amount of applied nutrients that are actually taken up by the crop versus those lost to leaching or volatilization.</p>
                    <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800">
                        <h4 className="font-bold text-primary-700 dark:text-primary-300 mb-2">Efficiency Analysis</h4>
                        <p className="text-sm">Your split-application strategy has significantly reduced Nitrogen leaching. Continued use of organic amendments will further stabilize these levels.</p>
                    </div>
                </div>
            );
            type = 'success';
        } else if (label === 'Water Conservation') {
            content = (
                <div className="space-y-4">
                    <p>Current Conservation Score: <strong>{waterCons}%</strong></p>
                    <p>This score reflects how effectively you managed your water resources relative to the theoretical crop water requirement.</p>
                </div>
            );
            type = 'info';
        } else if (label === 'Crop Diversity') {
            content = (
                <div className="space-y-4">
                    <p>Diversity Index: <strong>{cropDiv}%</strong></p>
                    <p>Crop diversity is critical for pest management and long-term soil vitality. More diverse systems are naturally more resilient to climate shocks.</p>
                </div>
            );
            type = 'info';
        } else if (label === 'Soil Health Index') {
            content = (
                <div className="space-y-4">
                    <p>Soil Health Index: <strong>{soilHealth}/100</strong></p>
                    <p>A comprehensive rating based on organic carbon, microbial activity, and structure stability.</p>
                </div>
            );
            type = 'success';
        }

        setReportModal({ isOpen: true, title: label, content, type });
    };

    const radarData = [
        { subject: 'Fertilizer Eff.', value: fertEff },
        { subject: 'Water Use', value: waterCons },
        { subject: 'Crop Diversity', value: cropDiv },
        { subject: 'Soil Health', value: soilHealth },
        { subject: 'Carbon Stock', value: 65 },
    ];

    const metrics = [
        { label: 'Fertilizer Efficiency', value: fertEff, icon: Leaf, color: 'primary', tip: 'Reduce chemical fertilizer by 15% with compost blending' },
        { label: 'Water Conservation', value: waterCons, icon: Droplets, color: 'blue', tip: 'Drip irrigation can save an additional 30% water' },
        { label: 'Crop Diversity', value: cropDiv, icon: RefreshCcw, color: 'earth', tip: 'Add 1 more crop variety to boost biodiversity score' },
        { label: 'Soil Health Index', value: soilHealth, icon: TrendingUp, color: 'primary', tip: 'Excellent! Maintain organic matter levels for sustained health' },
    ];

    const scoreColor = overall >= 80 ? '#22c55e' : overall >= 60 ? '#f59e0b' : '#ef4444';
    const scoreLabel = overall >= 80 ? 'Excellent 🌟' : overall >= 60 ? 'Good 👍' : 'Needs Improvement ⚠️';

    return (
        <div className="space-y-6">
            <ReportModal
                isOpen={reportModal.isOpen}
                onClose={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
                title={reportModal.title}
                content={reportModal.content}
                type={reportModal.type}
            />
            {/* Header — Standardized */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h1 className="page-header flex items-center gap-3">
                        <Award className="text-primary-600 dark:text-primary-400" />
                        {t('sustainability.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
                        {t('sustainability.subtitle')}
                    </p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="badge-gold py-1.5 px-3 shadow-sm border border-gold-200 dark:border-gold-800">
                        🌟 Premium Farm Score
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Score */}
                <div className="card flex flex-col items-center py-8">
                    <h3 className="section-header mb-4 flex items-center gap-3">
                        <Award size={20} className="text-primary-500" />
                        Our Analysis
                    </h3>

                    <div className="relative w-44 h-44 mb-4">
                        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-gray-700" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke={scoreColor} strokeWidth="2.5" strokeDasharray={`${overall}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-bold font-display" style={{ color: scoreColor }}>{overall}</span>
                            <span className="text-xs text-gray-500 mt-1">/ 100</span>
                        </div>
                    </div>

                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{scoreLabel}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center max-w-[200px]">
                        Your farm is performing better than 72% of farms in your region
                    </p>

                    <div className="mt-6 w-full grid grid-cols-2 gap-2">
                        {[
                            { label: 'CO₂ Saved', value: '2.4t', color: 'primary' },
                            { label: 'Water Saved', value: '12kL', color: 'blue' },
                            { label: 'Chem Reduced', value: '18%', color: 'earth' },
                            { label: 'Biodiversity', value: 'Good', color: 'primary' },
                        ].map(s => (
                            <div key={s.label} className={`p-2.5 ${s.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' : s.color === 'earth' ? 'bg-earth-50 dark:bg-earth-900/20' : 'bg-primary-50 dark:bg-primary-900/20'} rounded-xl text-center`}>
                                <p className={`font-bold text-sm ${s.color === 'blue' ? 'text-blue-600' : s.color === 'earth' ? 'text-earth-600' : 'text-primary-600'}`}>{s.value}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Radar + Trend */}
                <div className="space-y-4">
                    <div className="card">
                        <h3 className="section-header mb-2">Sustainability Radar</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <RadarChart data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                                <Radar name="Score" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card">
                        <h3 className="section-header mb-3">Score Trend (6 Months)</h3>
                        <ResponsiveContainer width="100%" height={130}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <YAxis domain={[55, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 3 }} name="Sustainability Score" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Metric Cards */}
                <div className="space-y-3">
                    {metrics.map(m => (
                        <div
                            key={m.label}
                            onClick={() => openReport(m.label)}
                            className="card p-4 group hover:scale-[1.02] transition-all cursor-pointer hover:shadow-xl active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-9 h-9 ${m.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : m.color === 'earth' ? 'bg-earth-100 dark:bg-earth-900/30' : 'bg-primary-100 dark:bg-primary-900/30'} rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform`}>
                                    <m.icon size={16} className={m.color === 'blue' ? 'text-blue-600' : m.color === 'earth' ? 'text-earth-600' : 'text-primary-600'} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">{m.label}</p>
                                        <span className="text-[7px] font-black text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">Full Report</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mr-3 overflow-hidden">
                                            <div className={`h-1.5 rounded-full ${m.color === 'blue' ? 'bg-blue-500' : m.color === 'earth' ? 'bg-earth-500' : 'bg-primary-500'}`} style={{ width: `${m.value}%` }} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{m.value}%</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 ml-12 italic">" {m.tip} "</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SustainabilityScore;
