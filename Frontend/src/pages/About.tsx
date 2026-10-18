import React from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, Target, ShieldCheck, Globe, Users, TrendingUp } from 'lucide-react';

const About: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-widest border border-primary-200 dark:border-primary-800 animate-slide-up-fade">
          <Globe size={14} /> {t('about.globalIntelligence')}
        </div>
        <h1
          className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight animate-slide-up-fade"
          style={{ animationDelay: '100ms' }}
        >
          {t('about.title')}
        </h1>
        <p
          className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-medium animate-slide-up-fade"
          style={{ animationDelay: '200ms' }}
        >
          {t('about.subtitle')}
        </p>
      </div>

      {/* Our Mission Card */}
      <div
        className="card glass-gold border-gold-300 dark:border-gold-800/40 relative overflow-hidden group animate-slide-up-fade"
        style={{ animationDelay: '300ms' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400/10 blur-3xl rounded-full -mr-32 -mt-32 transition-all duration-700" />
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-24 h-24 gradient-gold-green rounded-3xl flex items-center justify-center shadow-2xl rotate-3 flex-shrink-0">
            <Leaf size={48} className="text-white drop-shadow-lg" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
              {t('about.ourMission')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg font-medium">
              {t('about.missionDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Three Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Target,
            title: t('about.precisionIntelligence'),
            desc: t('about.precisionDesc'),
            delay: '400ms',
          },
          {
            icon: ShieldCheck,
            title: t('about.climateResilience'),
            desc: t('about.climateDesc'),
            delay: '500ms',
          },
          {
            icon: Users,
            title: t('about.marketEmpowerment'),
            desc: t('about.marketDesc'),
            delay: '600ms',
          },
        ].map((pillar) => (
          <div
            key={pillar.title}
            className="card p-6 border border-gray-100 dark:border-gray-800 shadow-sm animate-slide-up-fade flex flex-col h-full"
            style={{ animationDelay: pillar.delay }}
          >
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 flex-shrink-0">
              <pillar.icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{pillar.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex-1 italic">
              {pillar.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Impact Stats Card */}
      <div
        className="card bg-gray-900 text-white border-none shadow-glow-green animate-slide-up-fade"
        style={{ animationDelay: '700ms' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-4">
          {[
            { label: t('about.yieldIncrease'), value: '30%', trend: 'Avg. Profit Growth' },
            { label: t('about.waterSavings'), value: '25%', trend: 'Precision Irrigation' },
            { label: t('about.inputEfficiency'), value: '15%', trend: 'Reduced Fertilizer' },
            { label: t('about.dataAccuracy'), value: '99%', trend: 'ML Confidence' },
          ].map((stat) => (
            <div key={stat.label} className="text-center space-y-1">
              <p className="text-4xl font-black text-primary-400">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {stat.label}
              </p>
              <p className="text-[8px] text-primary-600 font-black uppercase">{stat.trend}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Final Vision Statement */}
      <div
        className="text-center p-8 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 animate-slide-up-fade"
        style={{ animationDelay: '800ms' }}
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
          <TrendingUp className="text-primary-500" /> {t('about.shapingFuture')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm italic max-w-2xl mx-auto leading-relaxed">
          "{t('about.missionDesc')}"
        </p>
      </div>

      <div className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 py-4 uppercase tracking-[0.2em]">
        AgriFlux Intelligence Platform · v1.0.4 · Sustaining the Future
      </div>
    </div>
  );
};

export default About;
