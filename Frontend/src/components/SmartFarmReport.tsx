import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Download, Sparkles, Leaf, TrendingUp, MapPin, AlertCircle,
    ShieldCheck, BarChart3, Droplets, Zap, CheckCircle2
} from 'lucide-react';
import { useRealisticData } from '../hooks/useRealisticData';

interface SmartFarmReportProps {
    isOpen: boolean;
    onClose: () => void;
}

// Generates a random number in a range with 1 decimal
interface ReportData {
    crop: string;
    variety: string;
    yieldEstimate: string;
    priceMin: number;
    priceMax: number;
    bestRegion: string;
    confidence: number;
    soilPh: number;
    humidity: number;
    rainfall: number;
    demandScore: number;
    profitEstimate: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    factors: string[];
}

const STEPS = [
    'Analysing soil parameters...',
    'Querying weather data...',
    'Running crop recommendation model...',
    'Fetching live market prices...',
    'Calculating profit projections...',
    'Generating final report...',
];

const riskColor = (r: 'Low' | 'Medium' | 'High') =>
    r === 'Low' ? 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
    : r === 'Medium' ? 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400'
    : 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';

const SmartFarmReport: React.FC<SmartFarmReportProps> = ({ isOpen, onClose }) => {
    const [phase, setPhase] = useState<'loading' | 'done'>('loading');
    const [stepIdx, setStepIdx] = useState(0);
    const [report, setReport] = useState<ReportData | null>(null);
    const data = useRealisticData();

    useEffect(() => {
        if (!isOpen) return;
        setPhase('loading');
        setStepIdx(0);
        setReport(null);

        let i = 0;
        const iv = setInterval(() => {
            i++;
            setStepIdx(i);
            if (i >= STEPS.length - 1) {
                clearInterval(iv);
                setTimeout(() => {
                    // Sync with hook data
                    setReport({
                        crop: data.crop,
                        variety: data.variety,
                        yieldEstimate: `${data.yieldKgHa.toLocaleString()} kg/ha`,
                        priceMin: data.priceMin,
                        priceMax: data.priceMax,
                        bestRegion: data.bestMarket,
                        confidence: data.confidenceScore,
                        soilPh: data.soilPh,
                        humidity: data.humidity,
                        rainfall: data.rainfall,
                        demandScore: data.demandScore,
                        profitEstimate: `₹${data.profitMin.toLocaleString()} – ₹${data.profitMax.toLocaleString()}`,
                        riskLevel: data.confidenceScore >= 93 ? 'Low' : data.confidenceScore >= 88 ? 'Medium' : 'High',
                        factors: data.factors,
                    });
                    setPhase('done');
                }, 600);
            }
        }, 480); // Slightly faster for snappier feel

        return () => clearInterval(iv);
    }, [isOpen, data]);

    const handlePrint = () => window.print();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none"
                        initial={{ scale: 0.9, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 30, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-green-500 px-7 py-5 print:bg-primary-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Sparkles size={22} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-lg leading-tight">Smart Farm AI Report</h2>
                                        <p className="text-primary-100 text-xs">Powered by AgriFlux AI Engine · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="print:hidden w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-7 max-h-[75vh] overflow-y-auto">
                            {phase === 'loading' ? (
                                <div className="space-y-4 py-4">
                                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">AgriFlux AI is analysing your farm data…</p>
                                    {STEPS.map((step, i) => (
                                        <motion.div
                                            key={i}
                                            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${i <= stepIdx ? 'bg-primary-50 dark:bg-primary-900/20' : 'opacity-30'}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: i <= stepIdx ? 1 : 0.3, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${i < stepIdx ? 'bg-primary-500' : i === stepIdx ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                {i < stepIdx
                                                    ? <CheckCircle2 size={14} className="text-white" />
                                                    : i === stepIdx
                                                        ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                                                        : <span className="text-[10px] text-gray-400 font-bold">{i + 1}</span>
                                                }
                                            </div>
                                            <span className={`text-sm font-medium ${i <= stepIdx ? 'text-primary-700 dark:text-primary-300' : 'text-gray-400'}`}>{step}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : report ? (
                                <motion.div
                                    className="space-y-5"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    {/* Confidence Banner */}
                                    <div className="flex items-center justify-between bg-gradient-to-r from-primary-50 to-green-50 dark:from-primary-900/20 dark:to-green-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl p-4">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="text-primary-600 dark:text-primary-400" size={24} />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI Confidence Score</p>
                                                <p className="text-2xl font-black text-primary-700 dark:text-primary-300">{report.confidence}%</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${riskColor(report.riskLevel)}`}>
                                            {report.riskLevel} Risk
                                        </span>
                                    </div>

                                    {/* Primary Recommendation */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Leaf size={16} className="text-primary-500" />
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recommended Crop</span>
                                            </div>
                                            <p className="text-xl font-black text-gray-900 dark:text-white">{report.crop}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{report.variety}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp size={16} className="text-blue-500" />
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expected Yield</span>
                                            </div>
                                            <p className="text-xl font-black text-gray-900 dark:text-white">{report.yieldEstimate}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Per hectare</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <BarChart3 size={16} className="text-gold-500" />
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Predicted Price Range</span>
                                            </div>
                                            <p className="text-xl font-black text-gray-900 dark:text-white">₹{report.priceMin}–₹{report.priceMax}/kg</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Market estimate (mandi)</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin size={16} className="text-red-400" />
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Best Selling Region</span>
                                            </div>
                                            <p className="text-xl font-black text-gray-900 dark:text-white">{report.bestRegion}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Demand score: {report.demandScore}%</p>
                                        </div>
                                    </div>

                                    {/* Profit Estimate */}
                                    <div className="bg-gradient-to-r from-gold-50 to-yellow-50 dark:from-gold-900/10 dark:to-yellow-900/10 border border-gold-200 dark:border-gold-800 rounded-2xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider mb-1">Estimated Profit (per season)</p>
                                            <p className="text-2xl font-black text-gray-900 dark:text-white">{report.profitEstimate}</p>
                                        </div>
                                        <Zap size={36} className="text-gold-400 opacity-60" />
                                    </div>

                                    {/* AI Inputs — Explainability */}
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <AlertCircle size={14} />
                                            Why this recommendation?
                                        </p>
                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                            <div className="text-center">
                                                <p className="text-lg font-black text-primary-600 dark:text-primary-400">{report.soilPh}</p>
                                                <p className="text-xs text-gray-500">Soil pH</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-black text-blue-500">{report.humidity}%</p>
                                                <p className="text-xs text-gray-500">Humidity</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-black text-indigo-500">{report.rainfall}mm</p>
                                                <p className="text-xs text-gray-500">Rainfall</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            {report.factors.map(f => (
                                                <div key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                    <CheckCircle2 size={14} className="text-primary-500 flex-shrink-0" />
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Trust Footer */}
                                    <div className="flex items-center justify-center gap-6 pt-2 border-t border-gray-100 dark:border-gray-800">
                                        {[
                                            { icon: ShieldCheck, label: 'Secure & Encrypted' },
                                            { icon: Sparkles, label: 'AI Powered Insights' },
                                            { icon: Droplets, label: 'Real-time Data' },
                                        ].map(({ icon: Icon, label }) => (
                                            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                                                <Icon size={13} className="text-primary-500" />
                                                {label}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : null}
                        </div>

                        {/* Footer Actions */}
                        {phase === 'done' && (
                            <div className="px-7 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 print:hidden">
                                <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium">
                                    Close
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Download size={16} />
                                    Download Report (PDF)
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SmartFarmReport;
