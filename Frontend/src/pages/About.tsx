import React from 'react';
import { Leaf, TrendingUp, Droplets, FlaskConical, Award, Satellite } from 'lucide-react';

const About: React.FC = () => (
    <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col items-center md:flex-row md:items-start justify-between gap-4 text-center md:text-left">
            <div>
                <h1 className="page-header text-gradient font-extrabold">About AgriFlux</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Empowering Sustainable Agriculture through Climate Intelligence</p>
            </div>
            <div className="flex gap-2">
                <span className="badge-gold px-3 py-1 shadow-sm border border-gold-200 dark:border-gold-800">Production Ready</span>
                <span className="badge-green px-3 py-1 shadow-sm border border-primary-200 dark:border-primary-800">v1.0.4</span>
            </div>
        </div>

        <div className="card glass-gold border-gold-300 dark:border-gold-800/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-gold-400/20 transition-all duration-700" />
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                <div className="w-20 h-20 gradient-gold-green rounded-3xl flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-6 transition-transform">
                    <Leaf size={40} className="text-white drop-shadow-lg" />
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold font-display text-gray-900 dark:text-white mb-2">AgriFlux Intelligence</h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                        AgriFlux is a premier, data-driven agricultural intelligence engine designed for the next generation of farming. By fusing real-time climate data, satellite imagery, and advanced machine learning, we provide farmers with the precision tools needed to maximize yields while ensuring ecological sustainability.
                    </p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
                { icon: TrendingUp, color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-primary-100 dark:border-primary-800', title: 'AI Yield Forecast', desc: 'Predict crop yield with 92% ML precision.' },
                { icon: Droplets, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800', title: 'Smart Water', desc: 'Optimized irrigation based on AI weather tools.' },
                { icon: FlaskConical, color: 'bg-earth-50 dark:bg-earth-900/20 text-earth-600 border-earth-100 dark:border-earth-800', title: 'Soil Advisor', desc: 'NPK analysis and fertilizer optimization.' },
                { icon: Satellite, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-100 dark:border-purple-800', title: 'NDVI Vision', desc: 'Satellite health monitoring for every acre.' },
                { icon: Award, color: 'bg-gold-50 dark:bg-gold-900/20 text-gold-600 border-gold-100 dark:border-gold-800', title: 'Eco Score', desc: 'Total farm sustainability & eco-compliance.' },
                { icon: Leaf, color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-primary-100 dark:border-primary-800', title: 'Climate Sim', desc: 'Proactive future scenario simulations.' },
            ].map(item => (
                <div key={item.title} className={`card-clickable !p-4 border shadow-sm ${item.color}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <item.icon size={20} />
                        <h3 className="font-bold text-sm tracking-tight">{item.title}</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs opacity-80 leading-snug">{item.desc}</p>
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
        </div>
    </div>
);

export default About;
