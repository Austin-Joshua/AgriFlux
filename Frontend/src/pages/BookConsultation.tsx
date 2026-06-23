import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MessageSquare, User, Video, CheckCircle, ShieldCheck, Sparkles, PhoneCall } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import SEO from '../components/SEO';

interface Expert {
    id: string;
    name: string;
    specialization: string;
    expertise: string;
    avatar: string;
    rating: number;
}

const experts: Expert[] = [
    {
        id: 'exp1',
        name: 'Dr. Ramesh Chandra',
        specialization: 'Soil Science',
        expertise: 'Soil nutrient management and land reclamation.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh',
        rating: 4.9
    },
    {
        id: 'exp2',
        name: 'Dr. Priya Sharma',
        specialization: 'Crop Pathology',
        expertise: 'Pest control and disease prevention in cereals.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
        rating: 4.7
    },
    {
        id: 'exp3',
        name: 'Er. Suresh Patel',
        specialization: 'Irrigation Engineering',
        expertise: 'Drip and sprinkler system design and optimization.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh',
        rating: 4.8
    },
    {
        id: 'exp4',
        name: 'Dr. Anjali Verma',
        specialization: 'Sustainable Farming',
        expertise: 'Organic farming and climate-resilient crop switching.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali',
        rating: 4.9
    }
];

const BookConsultation: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [step, setStep] = useState(1);
    const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExpert) return;

        setLoading(true);
        try {
            // Simulated API delay for better UX feel
            await new Promise(r => setTimeout(r, 1200));
            // Actual API call
            await axios.post(`${API_URL}/consultations/book`, {
                expertId: selectedExpert.id,
                expertName: selectedExpert.name,
                specialization: selectedExpert.specialization,
                date,
                time,
                query,
                userId: user?.id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSubmitted(true);
            toast.success('Consultation booked successfully!');
            setTimeout(() => navigate('/dashboard'), 4000);
        } catch (error) {
            toast.error('Failed to book consultation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
            >
                <SEO title="Booking Confirmed" />
                <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 mb-6 shadow-glow-green">
                    <CheckCircle size={56} />
                </div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Consultation Booked!</h1>
                <div className="max-w-lg bg-gray-50 dark:bg-gray-800/50 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl">
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                        Your 1-to-1 video call with <strong className="text-primary-600">{selectedExpert?.name}</strong> has been scheduled for <span className="font-bold">{date}</span> at <span className="font-bold">{time}</span>.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-primary-500 font-bold text-sm bg-primary-50 dark:bg-primary-900/20 py-3 rounded-xl">
                        <Video size={18} />
                        WhatsApp Meeting Link Sent
                    </div>
                </div>
                <button onClick={() => navigate('/dashboard')} className="btn-primary mt-10 px-12 py-4">Back to Dashboard</button>
            </motion.div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10 px-4 animate-fade-in">
            <SEO title="Book Consultation" />
            
            {/* Header — Standardized */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-header flex items-center gap-3">
                        <PhoneCall className="text-primary-600 dark:text-primary-400" />
                        {t('nav.bookConsultation')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
                        Connect with certified agronomists for professional farm guidance.
                    </p>
                </div>
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/50">
                    <ShieldCheck size={18} className="text-primary-600" />
                    <span className="text-xs font-bold text-primary-700 dark:text-primary-400">Verified Professional Network</span>
                </div>
            </div>

            {/* Custom Progress Stepper */}
            <div className="flex justify-between items-center max-w-xl mx-auto mb-10 relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0" />
                <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-primary-500 -translate-y-1/2 z-0 transition-all duration-300"
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                />
                {[
                    { number: 1, label: 'Select Expert' },
                    { number: 2, label: 'Schedule & Query' },
                    { number: 3, label: 'Review & Confirm' }
                ].map((s) => (
                    <div key={s.number} className="relative z-10 flex flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (s.number < step || (s.number === 2 && selectedExpert) || (s.number === 3 && selectedExpert && date && time && query.trim())) {
                                    setStep(s.number);
                                }
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2
                                ${step === s.number 
                                    ? 'bg-primary-600 border-primary-600 text-white shadow-glow-green scale-110' 
                                    : step > s.number 
                                        ? 'bg-primary-100 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-300' 
                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500'}`}
                        >
                            {s.number}
                        </button>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${step === s.number ? 'text-primary-600 dark:text-primary-400 font-extrabold' : 'text-gray-400'}`}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="items-start">
                {/* STEP 1: Select Expert */}
                {step === 1 && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="card space-y-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent opacity-50 pointer-events-none" />
                            <h3 className="section-header flex items-center gap-3"><User size={20} className="text-primary-500" /> Select Expert</h3>
                            <p className="text-xs text-gray-500 -mt-3">Choose a verified expert from our certified agronomist network for your consultation.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {experts.map(expert => (
                                    <motion.div
                                        key={expert.id}
                                        whileHover={{ y: -4 }}
                                        onClick={() => setSelectedExpert(expert)}
                                        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between ${selectedExpert?.id === expert.id ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-900/10 shadow-lg' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white/50 dark:bg-transparent'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="relative">
                                                <img src={expert.avatar} alt={expert.name} className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-105 transition-transform" />
                                                {selectedExpert?.id === expert.id && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                                                        <CheckCircle size={10} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors uppercase tracking-tight">{expert.name}</p>
                                                <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest mt-0.5">{expert.specialization}</p>
                                                <div className="mt-2 flex items-center gap-1.5">
                                                    <div className="flex items-center gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < Math.floor(expert.rating) ? 'bg-primary-500' : 'bg-gray-200'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400">{expert.rating}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold italic">"{expert.expertise}"</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                type="button"
                                disabled={!selectedExpert}
                                onClick={() => setStep(2)}
                                className="btn-primary px-8 py-3.5 flex items-center gap-2 text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next Step &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Session Details */}
                {step === 2 && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card !p-8 space-y-8 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl -mr-16 -mt-16" />
                            <h3 className="section-header flex items-center gap-3"><MessageSquare size={20} className="text-primary-500" /> Session Details</h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Describe your query or issue</label>
                                    <textarea
                                        className="input-field min-h-[160px] !py-4 resize-none text-base bg-gray-50/50 dark:bg-gray-800/30"
                                        placeholder="e.g. My wheat crop shows yellowing at leaf tips. Soil test indicated high pH last season. Need treatment plan..."
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar size={14} /> Preferred Date</label>
                                        <input
                                            type="date"
                                            className="input-field !py-3.5"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Clock size={14} /> Preferred Time Slot</label>
                                        <input
                                            type="time"
                                            className="input-field !py-3.5"
                                            value={time}
                                            onChange={e => setTime(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        <div className="flex justify-between pt-4">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="btn-outline px-8 py-3.5 text-sm font-bold uppercase tracking-widest"
                            >
                                &larr; Back
                            </button>
                            <button
                                type="button"
                                disabled={!date || !time || !query.trim()}
                                onClick={() => setStep(3)}
                                className="btn-primary px-8 py-3.5 flex items-center gap-2 text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next Step &rarr;
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Mode & Review Confirmation */}
                {step === 3 && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Summary of Selection */}
                            <div className="card p-6 border border-primary-500/20 bg-primary-50/10 dark:bg-primary-900/5 space-y-4">
                                <h4 className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Selected Consultation Details</h4>
                                <div className="flex gap-4 items-center">
                                    <img src={selectedExpert?.avatar} alt={selectedExpert?.name} className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 border" />
                                    <div>
                                        <p className="font-black text-gray-900 dark:text-white uppercase text-sm">{selectedExpert?.name}</p>
                                        <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">{selectedExpert?.specialization}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t dark:border-gray-800">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Scheduled Date</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">{date}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Time Slot</span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">{time}</span>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Your Query</span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium italic mt-1 bg-white/40 dark:bg-gray-900/30 p-3 rounded-xl">"{query}"</p>
                                </div>
                            </div>

                            {/* Mode Selection */}
                            <div className="card !p-8 space-y-6 shadow-xl border-b-4 border-primary-500">
                                <div className="flex items-center justify-between">
                                    <h3 className="section-header flex items-center gap-3"><Video size={20} className="text-primary-500" /> Mode of Consultation</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-100 dark:bg-primary-900/30 px-3 py-1 rounded-full">Included In Premium</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-3xl border-2 border-primary-500 bg-primary-50/30 dark:bg-primary-900/10 flex items-center gap-4 transition-all hover:shadow-lg">
                                        <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 ring-4 ring-primary-500/10">
                                            <Video size={24} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">HD Video Call</p>
                                            <p className="text-xs text-gray-500 font-medium">30 Min Session · WhatsApp/Meet</p>
                                        </div>
                                        <CheckCircle size={24} className="ml-auto text-primary-500" />
                                    </div>
                                    <div className="p-5 rounded-3xl border-2 border-transparent bg-gray-50 dark:bg-gray-800/50 flex items-center gap-4 opacity-70 grayscale cursor-not-allowed">
                                        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-gray-400">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">On-Site Visit</p>
                                            <p className="text-xs text-gray-500 font-medium">Coming Soon to your region</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fee and Submit */}
                            <div className="card bg-gray-900 dark:bg-white text-white dark:text-gray-900 !p-6 space-y-4 shadow-3xl">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-70">
                                    <span>Booking Fee</span>
                                    <span className="line-through text-red-400">₹499</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-black">Total Amount</span>
                                    <span className="text-3xl font-black text-primary-400 dark:text-primary-600">FREE</span>
                                </div>
                                <p className="text-[10px] opacity-60 font-medium text-gray-300 dark:text-gray-600">Limited period hackathon offer for registered users.</p>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-sm font-black tracking-widest shadow-xl shadow-primary-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>PROCESSING...</span>
                                        </div>
                                    ) : (
                                        'CONFIRM BOOKING'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                        <div className="flex justify-start pt-4">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="btn-outline px-8 py-3.5 text-sm font-bold uppercase tracking-widest"
                            >
                                &larr; Back
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default BookConsultation;
