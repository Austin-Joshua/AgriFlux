import React from 'react';
import { Leaf, Target, ShieldCheck, Globe, Users, TrendingUp } from 'lucide-react';

const About: React.FC = () => (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-widest border border-primary-200 dark:border-primary-800 animate-slide-up-fade">
                <Globe size={14} /> Global Agriculture Intelligence
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
                AgriFlux AI: The Future of <span className="text-gradient">Precision Farming</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-medium animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
                Bridging the gap between traditional agricultural wisdom and modern artificial intelligence to empower the next generation of farmers.
            </p>
        </div>

        {/* Our Mission Card */}
        <div className="card glass-gold border-gold-300 dark:border-gold-800/40 relative overflow-hidden group animate-slide-up-fade" style={{ animationDelay: '300ms' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/10 blur-3xl rounded-full -mr-32 -mt-32 transition-all duration-700" />
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="w-24 h-24 gradient-gold-green rounded-3xl flex items-center justify-center shadow-2xl rotate-3 flex-shrink-0">
                    <Leaf size={48} className="text-white drop-shadow-lg" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Our Mission</h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg font-medium">
                        At AgriFlux, we believe every farmer deserves access to the world's most advanced intelligence. Our mission is to eliminate uncertainty in agriculture by providing actionable, data-driven insights that increase profitability while preserving our planet's most vital resources.
                    </p>
                </div>
            </div>
        </div>

        {/* Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { 
                    icon: Target, 
                    title: 'Precision Intelligence', 
                    desc: 'We replace guesswork with science. AgriFlux analyzes your soil\'s unique DNA to provide exact nutrient recommendations for record-breaking yields.',
                    delay: '400ms'
                },
                { 
                    icon: ShieldCheck, 
                    title: 'Climate Resilience', 
                    desc: 'Shield your crops from the unpredictable. Our predictive AI models simulate climate scenarios to help you stay ahead of weather risks.',
                    delay: '500ms'
                },
                { 
                    icon: Users, 
                    title: 'Market Empowerment', 
                    desc: 'Direct connectivity to global demand. We provide real-time market trends and verified trading channels to ensure you get the best price for your hard work.',
                    delay: '600ms'
                },
            ].map((pillar) => (
                <div key={pillar.title} className="card p-6 border border-gray-100 dark:border-gray-800 shadow-sm animate-slide-up-fade flex flex-col h-full" style={{ animationDelay: pillar.delay }}>
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 flex-shrink-0">
                        <pillar.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{pillar.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex-1 italic">{pillar.desc}</p>
                </div>
            ))}
        </div>

        {/* Impact Stats Card */}
        <div className="card bg-gray-900 text-white border-none shadow-glow-green animate-slide-up-fade" style={{ animationDelay: '700ms' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-4">
                {[
                    { label: 'Yield Increase', value: '30%', trend: 'Avg. Profit Growth' },
                    { label: 'Water Savings', value: '25%', trend: 'Precision Irrigation' },
                    { label: 'Input Efficiency', value: '15%', trend: 'Reduced Fertilizer' },
                    { label: 'Data Accuracy', value: '92%', trend: 'ML Confidence' },
                ].map((stat) => (
                    <div key={stat.label} className="text-center space-y-1">
                        <p className="text-4xl font-black text-primary-400">{stat.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
                        <p className="text-[8px] text-primary-600 font-black uppercase">{stat.trend}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Final Vision Statement */}
        <div className="text-center p-8 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 animate-slide-up-fade" style={{ animationDelay: '800ms' }}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                <TrendingUp className="text-primary-500" /> Shaping the Future Heritage
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm italic max-w-2xl mx-auto leading-relaxed">
                "AgriFlux is not just a platform; it's a commitment to the soil. We are building the tools today to ensure that the farmers of tomorrow inherit a land that is more fertile, more predictable, and more profitable than ever before."
            </p>
        </div>

        <div className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 py-4 uppercase tracking-[0.2em]">
            AgriFlux Intelligence Platform · v1.0.4 · Sustaining the Future
        </div>
    </div>
);

export default About;
