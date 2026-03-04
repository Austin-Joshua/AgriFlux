import React from 'react';
import { Leaf, TrendingUp, Droplets, FlaskConical, Award, Satellite } from 'lucide-react';

const About: React.FC = () => (
    <div className="space-y-6 max-w-4xl">
        <div>
            <h1 className="page-header">About AgriFlux</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">AI-Driven Sustainable Agriculture Yield Optimization & Climate Resilience Engine</p>
        </div>

        <div className="card bg-gradient-to-br from-primary-50 to-earth-50 dark:from-primary-900/20 dark:to-earth-900/20 border-primary-200 dark:border-primary-800">
            <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 gradient-green rounded-2xl flex items-center justify-center shadow-lg">
                    <Leaf size={32} className="text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-white">AgriFlux v1.0</h2>
                    <p className="text-primary-600 dark:text-primary-400 font-medium">Hackathon Edition 2026</p>
                </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                AgriFlux is a production-grade AI agriculture intelligence platform designed to help farmers across India and beyond make data-driven decisions. Using machine learning, climate intelligence, and precision agriculture tools, AgriFlux empowers farmers to increase yields, reduce fertilizer misuse, optimize irrigation, and adapt to climate change.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
                { icon: TrendingUp, color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600', title: 'AI Yield Prediction', desc: 'Random Forest & XGBoost ML models predict crop yield with up to 92% accuracy.' },
                { icon: Droplets, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', title: 'Smart Irrigation', desc: 'Precision irrigation scheduling using ET models and rainfall forecasts.' },
                { icon: FlaskConical, color: 'bg-earth-100 dark:bg-earth-900/30 text-earth-600', title: 'Soil AI Advisor', desc: 'AI-powered soil analysis with fertilizer recommendations and crop suitability.' },
                { icon: Satellite, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600', title: 'NDVI Monitoring', desc: 'Satellite vegetation index monitoring for real-time crop health assessment.' },
                { icon: Award, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600', title: 'Sustainability Score', desc: 'Holistic farm sustainability scoring promoting eco-friendly practices.' },
                { icon: Leaf, color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600', title: 'Climate Simulator', desc: 'Future climate scenario simulation for proactive adaptation planning.' },
            ].map(item => (
                <div key={item.title} className="card p-4">
                    <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                        <item.icon size={18} />
                    </div>
                    <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>

        <div className="card">
            <h3 className="section-header mb-4">Tech Stack</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { layer: 'Frontend', tech: 'React + Vite + TypeScript + TailwindCSS' },
                    { layer: 'Backend', tech: 'Node.js + Express + TypeScript + JWT' },
                    { layer: 'AI/ML', tech: 'Python + Random Forest + XGBoost + rule-based engine' },
                    { layer: 'Charts', tech: 'Recharts + SVG custom visualizations' },
                ].map(t => (
                    <div key={t.layer} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">{t.layer}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{t.tech}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
            <p>Built with ❤️ for sustainable farming · AgriFlux v1.0 · 2026</p>
            <p className="mt-1">Built for sustainable agriculture · AgriFlux v1.0</p>
        </div>
    </div>
);

export default About;
