import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, X, ChevronRight, Zap } from 'lucide-react';

interface DemoStep {
    route: string;
    title: string;
    description: string;
    duration: number; // ms to stay on the page
}

const DEMO_STEPS: DemoStep[] = [
    { route: '/dashboard',        title: 'Smart Dashboard',         description: 'Unified farm overview with live AI power & session-stable data.',  duration: 4000 },
    { route: '/soil',             title: 'Soil Health Advisor',      description: 'Precision analysis of pH, nitrogen, and moisture levels.',  duration: 3500 },
    { route: '/crop-health',      title: 'AI Disease Detection',     description: 'Deep learning detects crop diseases from simple leaf photos.',  duration: 3000 },
    { route: '/yield',            title: 'Yield Forecasting',        description: 'Predicting harvest output based on seasonal AI trends.', duration: 3000 },
    { route: '/market',           title: 'Market Insights',          description: 'Live mandi price tracking and demand-supply forecasts.', duration: 3000 },
    { route: '/marketplace',      title: 'Agri Marketplace',         description: 'Direct market access with AI-powered buyer matching.',  duration: 3000 },
    { route: '/dashboard',        title: 'Demo Complete! 🚀',        description: 'AgriFlux AI: Scalable, Sustainable, Production-Ready.',  duration: 0 },
];

const DemoMode: React.FC = () => {
    const navigate = useNavigate();
    const [running, setRunning] = useState(false);
    const [stepIdx, setStepIdx] = useState(0);

    const stopDemo = useCallback(() => {
        setRunning(false);
        setStepIdx(0);
        navigate('/dashboard');
    }, [navigate]);

    useEffect(() => {
        if (!running) return;
        const step = DEMO_STEPS[stepIdx];
        navigate(step.route);

        if (step.duration === 0) {
            // Final step — stop automatically after a moment
            const t = setTimeout(() => setRunning(false), 2000);
            return () => clearTimeout(t);
        }

        const t = setTimeout(() => {
            setStepIdx(prev => {
                const next = prev + 1;
                if (next >= DEMO_STEPS.length) {
                    setRunning(false);
                    return 0;
                }
                return next;
            });
        }, step.duration);

        return () => clearTimeout(t);
    }, [running, stepIdx, navigate]);

    const startDemo = () => {
        setStepIdx(0);
        setRunning(true);
    };

    const progress = ((stepIdx + 1) / DEMO_STEPS.length) * 100;
    const current = DEMO_STEPS[stepIdx];

    return (
        <>
            {/* Trigger Button — fixed bottom left */}
            {!running && (
                <motion.button
                    onClick={startDemo}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 }}
                    className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all font-semibold text-sm"
                    title="Run automated farm demo"
                >
                    <Zap size={16} className="text-yellow-300" />
                    Run Demo
                    <Play size={14} className="ml-0.5" />
                </motion.button>
            )}

            {/* Demo Overlay Bar */}
            <AnimatePresence>
                {running && (
                    <motion.div
                        className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-indigo-900/95 to-purple-900/95 backdrop-blur-md"
                        initial={{ y: -80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -80, opacity: 0 }}
                    >
                        {/* Progress bar */}
                        <motion.div
                            className="h-1 bg-gradient-to-r from-indigo-400 to-purple-400"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                        <div className="flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <span className="text-xs font-bold text-green-300 uppercase tracking-widest">LIVE DEMO</span>
                                </div>
                                <div className="hidden sm:flex items-center gap-1.5 text-white">
                                    <span className="font-bold text-sm">{current.title}</span>
                                    <ChevronRight size={14} className="text-indigo-300" />
                                    <span className="text-indigo-200 text-xs">{current.description}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-indigo-300 font-medium hidden sm:block">
                                    Step {stepIdx + 1} of {DEMO_STEPS.length}
                                </span>
                                <div className="flex gap-1">
                                    {DEMO_STEPS.map((_, i) => (
                                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === stepIdx ? 'bg-white scale-125' : i < stepIdx ? 'bg-indigo-400' : 'bg-indigo-700'}`} />
                                    ))}
                                </div>
                                <button onClick={stopDemo} className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
                                    <X size={13} />
                                    Stop
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default DemoMode;
