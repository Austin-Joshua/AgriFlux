import React from 'react';
import { 
    AlertTriangle, CheckCircle, TrendingUp, 
    ArrowRight, MapPin, DollarSign, Sprout, 
    Info, Target, Zap
} from 'lucide-react';
import { useRealisticData } from '../hooks/useRealisticData';

const AIDecisionPanel: React.FC = () => {
    const data = useRealisticData();
    
    // Risk Calculation (Simulation)
    const getRiskInfo = () => {
        const ph = data.soilPh;
        const rain = data.rainfall;
        if (ph < 6.0 || ph > 7.5 || rain < 400) return { label: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' };
        if (ph < 5.5 || rain < 300) return { label: 'High', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' };
        return { label: 'Low', color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20', border: 'border-primary-200 dark:border-primary-800' };
    };

    const risk = getRiskInfo();

    return (
        <div className="card-gradient overflow-hidden relative group">
            {/* Background Accent */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gold-500/5 blur-3xl rounded-full" />

            <div className="relative flex flex-col lg:flex-row gap-6">
                {/* Main Identity */}
                <div className="lg:w-1/3 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-md">
                                <Target size={12} />
                                Optimized Recommendation
                            </span>
                        </div>
                        <h2 className="text-4xl font-black font-display text-gray-800 dark:text-white leading-tight">
                            {data.crop} <br />
                            <span className="text-primary-600 dark:text-primary-400 text-2xl">{data.variety}</span>
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-xs leading-relaxed">
                            AI analyzed your soil health, local Mandi demand, and 7-day weather forecast to predict a high-yield opportunity.
                        </p>
                    </div>

                    <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/50 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">AI Confidence</span>
                            <span className="text-sm font-bold text-primary-600">{data.confidenceScore}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000"
                                style={{ width: `${data.confidenceScore}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Yield */}
                    <div className="p-4 rounded-2xl bg-white/40 dark:bg-gray-800/30 border border-white/40 dark:border-gray-700/40 hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                <TrendingUp size={18} />
                            </div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Expected Yield</span>
                        </div>
                        <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{data.yieldKgHa.toLocaleString()} <span className="text-sm font-medium">kg/ha</span></p>
                    </div>

                    {/* Profit */}
                    <div className="p-4 rounded-2xl bg-white/40 dark:bg-gray-800/30 border border-white/40 dark:border-gray-700/40 hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                <DollarSign size={18} />
                            </div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Est. Profit (1ha)</span>
                        </div>
                        <p className="text-2xl font-black text-primary-600">₹{(data.profitMax/1000).toFixed(1)}k <span className="text-sm font-medium text-gray-400">avg.</span></p>
                    </div>

                    {/* Best Market */}
                    <div className="p-4 rounded-2xl bg-white/40 dark:bg-gray-800/30 border border-white/40 dark:border-gray-700/40 hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center text-gold-600">
                                <MapPin size={18} />
                            </div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Regional Demand</span>
                        </div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{data.bestMarket}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 italic mt-1">{data.trendLabel}</p>
                    </div>

                    {/* Risk Level */}
                    <div className={`p-4 rounded-2xl ${risk.bg} border ${risk.border} hover:scale-[1.02] transition-transform flex items-center justify-between`}>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle size={14} className={risk.color} />
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Risk Level</span>
                            </div>
                            <span className={`text-xl font-black ${risk.color}`}>{risk.label}</span>
                        </div>
                        <div className="text-right">
                           {risk.label === 'Low' && <CheckCircle size={24} className="text-primary-600 opacity-50" />}
                           {risk.label === 'Medium' && <Info size={24} className="text-yellow-500 opacity-50" />}
                        </div>
                    </div>
                </div>

                {/* Logic / Advice */}
                <div className="lg:w-1/4 bg-gray-50/50 dark:bg-gray-900/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                    <h3 className="text-xs font-bold text-primary-600 uppercase mb-3 flex items-center gap-1.5">
                        <Zap size={14} className="animate-pulse" />
                        AI Logic Trace
                    </h3>
                    <ul className="space-y-2.5">
                        {data.factors.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex gap-2 text-xs">
                                <span className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i+1}</span>
                                <span className="text-gray-600 dark:text-gray-300">{f}</span>
                            </li>
                        ))}
                    </ul>
                    <button className="mt-5 w-full py-2 bg-white dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-all">
                        Deep Analysis <ArrowRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIDecisionPanel;
