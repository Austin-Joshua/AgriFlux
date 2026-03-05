import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MessageSquare, User, Video, CheckCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Expert {
    id: string;
    name: string;
    specialization: string;
    expertise: string;
    avatar: string;
}

const experts: Expert[] = [
    {
        id: 'exp1',
        name: 'Dr. Ramesh Chandra',
        specialization: 'Soil Science',
        expertise: 'Soil nutrient management and land reclamation.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh'
    },
    {
        id: 'exp2',
        name: 'Dr. Priya Sharma',
        specialization: 'Crop Pathology',
        expertise: 'Pest control and disease prevention in cereals.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya'
    },
    {
        id: 'exp3',
        name: 'Er. Suresh Patel',
        specialization: 'Irrigation Engineering',
        expertise: 'Drip and sprinkler system design and optimization.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh'
    },
    {
        id: 'exp4',
        name: 'Dr. Anjali Verma',
        specialization: 'Sustainable Farming',
        expertise: 'Organic farming and climate-resilient crop switching.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali'
    }
];

const BookConsultation: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, token } = useAuth();

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
            await axios.post('http://localhost:5001/api/consultations/book', {
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
            setTimeout(() => navigate('/dashboard'), 3000);
        } catch (error) {
            console.error('Error booking consultation:', error);
            alert('Failed to book consultation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600">
                    <CheckCircle size={48} />
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Consultation Booked!</h1>
                <p className="text-gray-500 max-w-md">
                    Your 1-to-1 video call with <strong>{selectedExpert?.name}</strong> has been scheduled for {date} at {time}.
                    You will receive a meeting link via WhatsApp shortly.
                </p>
                <button onClick={() => navigate('/dashboard')} className="btn-primary px-8">Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Expert Consultation</h1>
                    <p className="text-gray-500 text-sm">Book a 1-to-1 video call for specialized agricultural advice.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="card space-y-6">
                        <h3 className="section-header flex items-center gap-2"><MessageSquare size={18} className="text-primary-500" /> Session Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="label">What advice do you need? (Your Query)</label>
                                <textarea
                                    className="input-field min-h-[120px] py-3 resize-none"
                                    placeholder="Describe your farm situation, crop health issues, or soil concerns here..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="label flex items-center gap-2 tracking-widest"><Calendar size={14} /> Prefered Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label flex items-center gap-2 tracking-widest"><Clock size={14} /> Prefered Time</label>
                                    <input
                                        type="time"
                                        className="input-field"
                                        value={time}
                                        onChange={e => setTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card space-y-6">
                        <h3 className="section-header flex items-center gap-2"><Video size={18} className="text-primary-500" /> Appointment Type</h3>
                        <div className="flex gap-4">
                            <div className="flex-1 p-4 rounded-2xl border-2 border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 flex items-center gap-3">
                                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600">
                                    <Video size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">Video Consultation</p>
                                    <p className="text-[10px] text-gray-500">1-to-1 live call via WhatsApp/Meet</p>
                                </div>
                                <CheckCircle size={20} className="ml-auto text-primary-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card space-y-6">
                        <h3 className="section-header flex items-center gap-2"><User size={18} className="text-primary-500" /> Select Expert</h3>
                        <div className="space-y-3">
                            {experts.map(expert => (
                                <div
                                    key={expert.id}
                                    onClick={() => setSelectedExpert(expert)}
                                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer group ${selectedExpert?.id === expert.id ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={expert.avatar} alt={expert.name} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{expert.name}</p>
                                            <p className="text-[10px] text-primary-600 font-bold uppercase">{expert.specialization}</p>
                                        </div>
                                    </div>
                                    {selectedExpert?.id === expert.id && (
                                        <div className="mt-2 pt-2 border-t border-primary-100 dark:border-primary-900/30">
                                            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">"{expert.expertise}"</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !selectedExpert}
                        className="w-full btn-primary py-4 rounded-2xl shadow-glow-green disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : 'Confirm Booking'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BookConsultation;
