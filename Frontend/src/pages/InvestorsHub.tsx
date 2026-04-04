import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Lightbulb, TrendingUp, Mail, ExternalLink, CheckCircle, Send, Briefcase, Star } from 'lucide-react';

const investors = [
    { id: '1', name: 'Omnivore Partners', type: 'VC Fund', focus: ['Agri-tech', 'FoodTech', 'Climate'], ticketSize: '$500K – $5M', portfolio: 'Ninjacart, DeHaat, Jivabhumi', contact: 'info@omnivore.vc', website: 'https://omnivore.vc', avatar: '🌱', description: "India's first dedicated agri-food tech VC fund, supporting startups transforming food and agriculture." },
    { id: '2', name: 'AgriTech Capital', type: 'Angel Network', focus: ['Precision Farming', 'IoT', 'AI/ML'], ticketSize: '$50K – $500K', portfolio: 'AgroStar, FarMart, Fasal', contact: 'invest@agritechcapital.in', website: 'https://agritechcapital.in', avatar: '🌾', description: 'An angel network focused exclusively on early-stage agritech startups across South and South-East Asia.' },
    { id: '3', name: 'NABARD Nabventures', type: 'Government VC', focus: ['Rural Finance', 'Agri-fintech', 'Supply Chain'], ticketSize: '₹25L – ₹5Cr', portfolio: 'ITC e-Choupal, Samunnati', contact: 'nabventures@nabard.org', website: 'https://nabventures.in', avatar: '🏛️', description: "NABARD's VC arm investing in agri and rural-focused startups with structured mentoring." },
    { id: '4', name: 'Flourish Ventures', type: 'Impact VC', focus: ['AgriFinance', 'Smallholder Farmers', 'Climate Resilience'], ticketSize: '$500K – $3M', portfolio: 'Apollo Agriculture, Kuunda', contact: 'hello@flourishventures.com', website: 'https://flourishventures.com', avatar: '💚', description: 'Impact-focused global fund backing fintech and agritech startups serving smallholder communities.' },
    { id: '5', name: 'Bharat Innovation Fund', type: 'Deep-tech VC', focus: ['Drones', 'Satellite', 'AI'], ticketSize: '₹50L – ₹10Cr', portfolio: 'TartanSense, Intello Labs', contact: 'startups@bif.fund', website: 'https://bif.fund', avatar: '🚀', description: "Backing deep-tech innovation for India's agriculture sector, from drone fleets to satellite sensing." },
    { id: '6', name: 'WaterBridge Ventures', type: 'Seed Fund', focus: ['Water Tech', 'Crop Science', 'Sustainability'], ticketSize: '$100K – $1M', portfolio: 'CropIn, Agricore', contact: 'team@waterbridge.vc', website: 'https://waterbridge.vc', avatar: '💧', description: 'Seed and early-stage investments in agritech startups working on precision agriculture and sustainability.' },
];

const successStories = [
    { name: 'DeHaat', raise: '$115M Series E', impact: 'Serving 1.8M+ farmers across Bihar, UP, Odisha', emoji: '🌾' },
    { name: 'Ninjacart', raise: '$145M', impact: 'Connects 50K+ farmers to 1L+ retailers daily', emoji: '🍅' },
    { name: 'AgroStar', raise: '$95M Series D', impact: 'Reaching 7M+ farmers via digital advisory', emoji: '⭐' },
    { name: 'Fasal', raise: '$10M', impact: 'AI advisory helping 100K+ farmers boost yields', emoji: '🤖' },
];

const InvestorsHub: React.FC = () => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<'investors' | 'pitch'>('investors');
    const [pitch, setPitch] = useState({ startup: '', problem: '', solution: '', stage: 'Idea', ask: '', email: '' });
    const [submitted, setSubmitted] = useState(false);

    return (
        <div className="space-y-5">
            {/* Header — Standardized */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="page-header flex items-center gap-3">
                        <Users className="text-primary-600 dark:text-primary-400" />
                        {t('investors.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
                        {t('investors.subtitle')}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 w-fit">
                {(['investors', 'pitch'] as const).map(t_id => (
                    <button key={t_id} onClick={() => setTab(t_id)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${tab === t_id ? 'bg-white dark:bg-gray-700 shadow-md text-primary-600 dark:text-primary-400 scale-[1.02]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>
                        {t_id === 'investors' ? `🏦 ${t('investors.investorsTab', 'Investors')}` : `💡 ${t('investors.pitchTitle')}`}
                    </button>
                ))}
            </div>

            {tab === 'investors' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="standard-grid">
                        {investors.map(inv => (
                            <div key={inv.id} className="card group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col border-b-4 border-transparent hover:border-primary-500">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/20 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">{inv.avatar}</div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-gray-900 dark:text-white text-base truncate">{inv.name}</h3>
                                        <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 mt-1">{inv.type}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 flex-1 leading-relaxed line-clamp-3">{inv.description}</p>
                                <div className="space-y-2.5 mb-5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-center gap-2.5 text-xs"><Briefcase size={14} className="text-primary-500" /><span className="text-gray-400 font-bold uppercase tracking-tighter">{t('investors.ticket')}:</span><span className="font-black text-gray-800 dark:text-gray-200">{inv.ticketSize}</span></div>
                                    <div className="flex items-center gap-2.5 text-xs"><Star size={14} className="text-gold-500 fill-gold-500/20" /><span className="font-bold text-gray-700 dark:text-gray-300 line-clamp-1">{inv.portfolio}</span></div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-6">{inv.focus.map(f => <span key={f} className="text-[10px] font-bold px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800/50">{f}</span>)}</div>
                                <div className="flex gap-3 mt-auto">
                                    <a href={`mailto:${inv.contact}`} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 text-xs font-black tracking-wide shadow-lg shadow-primary-500/20"><Mail size={14} /> {t('investors.contact', 'Contact')}</a>
                                    <a href={inv.website} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl border-2 border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-primary-500 hover:border-primary-500 transition-all group-hover:bg-primary-50/50 dark:group-hover:bg-primary-900/10"><ExternalLink size={16} /></a>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card !p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl -mr-32 -mt-32" />
                        <h3 className="section-header flex items-center gap-3 mb-6">
                            <TrendingUp size={20} className="text-primary-600" />
                            {t('investors.successStories')}
                        </h3>
                        <div className="standard-grid">
                            {successStories.map(s => (
                                <div key={s.name} className="p-5 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:shadow-xl hover:-translate-y-0.5 transition-all group cursor-default">
                                    <div className="text-3xl mb-3 group-hover:scale-125 transition-transform duration-300 origin-left">{s.emoji}</div>
                                    <p className="font-black text-gray-900 dark:text-white text-base">{s.name}</p>
                                    <p className="text-xs text-primary-600 dark:text-primary-400 font-black mt-1 uppercase tracking-wider">{s.raise}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">{s.impact}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'pitch' && (
                <div className="max-w-3xl mx-auto w-full animate-slide-up-fade">
                    {submitted ? (
                        <div className="card text-center py-16 px-8 flex flex-col items-center">
                            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle size={40} className="text-primary-500" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{t('investors.pitchSubmitted')}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed">{t('investors.pitchSuccessMsg')}</p>
                            <button onClick={() => setSubmitted(false)} className="btn-primary mt-8 px-10 py-3.5 font-black tracking-wide shadow-xl shadow-primary-500/30 transition-transform active:scale-95">{t('investors.submitAnother')}</button>
                        </div>
                    ) : (
                        <div className="card !p-0 overflow-hidden border-t-4 border-primary-500 shadow-2xl">
                            <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3"><Lightbulb size={28} className="text-gold-500" /> {t('investors.submitIdea', 'Submit Your Idea')}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('investors.pitchSubtitle')}</p>
                                </div>
                                <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('investors.startupName')}</label>
                                            <input className="input-field !py-3.5" placeholder="e.g. FarmAI" value={pitch.startup} onChange={e => setPitch(p => ({ ...p, startup: e.target.value }))} required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('investors.stage')}</label>
                                            <select className="input-field !py-3.5" value={pitch.stage} onChange={e => setPitch(p => ({ ...p, stage: e.target.value }))}>
                                                {['Idea', 'Prototype', 'MVP', 'Early Revenue', 'Growth'].map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('investors.problem')}</label>
                                        <textarea className="input-field min-h-[120px] resize-y !py-3.5" placeholder={t('investors.problemPlaceholder')} value={pitch.problem} onChange={e => setPitch(p => ({ ...p, problem: e.target.value }))} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('investors.solution')}</label>
                                        <textarea className="input-field min-h-[120px] resize-y !py-3.5" placeholder={t('investors.solutionPlaceholder')} value={pitch.solution} onChange={e => setPitch(p => ({ ...p, solution: e.target.value }))} required />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('investors.fundingAsk')}</label>
                                            <input className="input-field !py-3.5" placeholder="e.g. ₹50 Lakhs Seed Round" value={pitch.ask} onChange={e => setPitch(p => ({ ...p, ask: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('investors.yourEmail', 'Your Email')}</label>
                                            <input type="email" className="input-field !py-3.5" placeholder="founder@startup.com" value={pitch.email} onChange={e => setPitch(p => ({ ...p, email: e.target.value }))} required />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary w-full py-4 mt-4 flex items-center justify-center gap-3 text-sm font-black tracking-widest shadow-2xl shadow-primary-500/40 hover:scale-[1.01] active:scale-95 transition-all"><Send size={18} /> {t('investors.submitBtn')}</button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InvestorsHub;
