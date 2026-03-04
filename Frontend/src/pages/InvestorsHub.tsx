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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="page-header">🤝 {t('investors.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">{t('investors.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800">
                    <TrendingUp size={15} />
                    <span className="font-semibold">{t('investors.stat')}</span>
                </div>
            </div>

            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
                {(['investors', 'pitch'] as const).map(t_id => (
                    <button key={t_id} onClick={() => setTab(t_id)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === t_id ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                        {t_id === 'investors' ? `🏦 ${t('investors.title')}` : `💡 ${t('investors.pitchTitle')}`}
                    </button>
                ))}
            </div>

            {tab === 'investors' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {investors.map(inv => (
                            <div key={inv.id} className="card group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl flex-shrink-0">{inv.avatar}</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{inv.name}</h3>
                                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{inv.type}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex-1 leading-relaxed">{inv.description}</p>
                                <div className="space-y-1.5 mb-3 text-xs">
                                    <div className="flex items-center gap-2"><Briefcase size={11} className="text-primary-500" /><span className="text-gray-400">{t('investors.ticket')}:</span><span className="font-semibold text-gray-700 dark:text-gray-200">{inv.ticketSize}</span></div>
                                    <div className="flex items-center gap-2"><Star size={11} className="text-amber-400" /><span className="text-gray-400">{inv.portfolio}</span></div>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-4">{inv.focus.map(f => <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400">{f}</span>)}</div>
                                <div className="flex gap-2">
                                    <a href={`mailto:${inv.contact}`} className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5"><Mail size={11} /> {t('common.contact')}</a>
                                    <a href={inv.website} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><ExternalLink size={13} /></a>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card">
                        <h3 className="section-header mb-4">🚀 {t('investors.successStories')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {successStories.map(s => (
                                <div key={s.name} className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 text-center">
                                    <div className="text-2xl mb-2">{s.emoji}</div>
                                    <p className="font-black text-gray-900 dark:text-white text-sm">{s.name}</p>
                                    <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mt-0.5">{s.raise}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{s.impact}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'pitch' && (
                <div className="max-w-2xl">
                    {submitted ? (
                        <div className="card text-center py-12">
                            <CheckCircle size={48} className="text-primary-500 mx-auto mb-4" />
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('investors.submitted')}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('investors.waitMsg')}</p>
                            <button onClick={() => setSubmitted(false)} className="btn-primary mt-6 px-6">{t('investors.submitAnother')}</button>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="mb-6">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2"><Lightbulb size={20} className="text-amber-400" /> {t('investors.pitchTitle')}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('investors.pitchSubtitle')}</p>
                            </div>
                            <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className="label">{t('investors.startupName')}</label><input className="input-field" placeholder="e.g. FarmAI" value={pitch.startup} onChange={e => setPitch(p => ({ ...p, startup: e.target.value }))} required /></div>
                                    <div><label className="label">{t('common.stage')}</label><select className="input-field" value={pitch.stage} onChange={e => setPitch(p => ({ ...p, stage: e.target.value }))}>{['Idea', 'Prototype', 'MVP', 'Early Revenue', 'Growth'].map(s => <option key={s}>{s}</option>)}</select></div>
                                </div>
                                <div><label className="label">{t('investors.problem')}</label><textarea className="input-field min-h-[80px] resize-none" placeholder={t('investors.problemPlaceholder')} value={pitch.problem} onChange={e => setPitch(p => ({ ...p, problem: e.target.value }))} required /></div>
                                <div><label className="label">{t('investors.solution')}</label><textarea className="input-field min-h-[80px] resize-none" placeholder={t('investors.solutionPlaceholder')} value={pitch.solution} onChange={e => setPitch(p => ({ ...p, solution: e.target.value }))} required /></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className="label">{t('investors.fundingAsk')}</label><input className="input-field" placeholder="e.g. ₹50 Lakhs Seed Round" value={pitch.ask} onChange={e => setPitch(p => ({ ...p, ask: e.target.value }))} /></div>
                                    <div><label className="label">{t('common.email')}</label><input type="email" className="input-field" placeholder="founder@startup.com" value={pitch.email} onChange={e => setPitch(p => ({ ...p, email: e.target.value }))} required /></div>
                                </div>
                                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2"><Send size={15} /> {t('investors.submitBtn')}</button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InvestorsHub;
