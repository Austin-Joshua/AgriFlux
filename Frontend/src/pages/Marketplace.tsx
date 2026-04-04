import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, MapPin, Star, TrendingUp, ShoppingCart, Info, X, CheckCircle2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useRealisticData, SESSION_CROP } from '../hooks/useRealisticData';

interface CropListing {
    id: string;
    farmerName: string;
    cropType: string;
    variety: string;
    quantity: number;
    unit: string;
    price: number;
    location: string;
    rating: number;
    image: string;
    matchScore: number;
    dateListed: string;
}

const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const BASE_LISTINGS: CropListing[] = [
    { id: '1', farmerName: 'Ramesh Singh', cropType: 'Wheat', variety: 'Sharbati', quantity: 50, unit: 'Tonnes', price: 2400, location: 'Punjab, India', rating: 4.8, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80', matchScore: 94, dateListed: '2026-04-01' },
    { id: '2', farmerName: 'Patel Farms', cropType: 'Cotton', variety: 'BT Cotton', quantity: 120, unit: 'Bales', price: 6500, location: 'Gujarat, India', rating: 4.6, image: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=400&q=80', matchScore: 88, dateListed: '2026-04-02' },
    { id: '3', farmerName: 'Green Valley', cropType: 'Rice', variety: 'Basmati', quantity: 200, unit: 'Tonnes', price: 3600, location: 'Haryana, India', rating: 4.9, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80', matchScore: 97, dateListed: '2026-04-03' },
    { id: '4', farmerName: 'Kamala Devi', cropType: 'Tomatoes', variety: 'Hybrid', quantity: 5, unit: 'Tonnes', price: 1800, location: 'Maharashtra, India', rating: 4.3, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80', matchScore: 82, dateListed: '2026-04-04' },
    { id: '5', farmerName: 'Suresh Reddy', cropType: 'Maize', variety: 'HQPM-1', quantity: 80, unit: 'Tonnes', price: 1950, location: 'Andhra Pradesh, India', rating: 4.5, image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80', matchScore: 85, dateListed: '2026-04-04' },
];

interface PostCropModalProps { onClose: () => void; }

const PostCropModal: React.FC<PostCropModalProps> = ({ onClose }) => {
    const [form, setForm] = useState({ crop: '', variety: '', quantity: '', price: '', unit: 'Tonnes', location: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Simulated API call
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    // 5% chance of simulated failure for testing resilience
                    if (Math.random() < 0.05) reject(new Error('Network timeout'));
                    else resolve(true);
                }, 1400);
            });
            toast.success('🌾 Your crop listing has been posted successfully! Buyers will be notified.', { position: 'bottom-right', autoClose: 5000 });
            onClose();
        } catch (err) {
            toast.error('Service temporarily unavailable. Please try again later.');
            console.error('Post listing error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
        <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input
                type={type} required placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:text-white text-sm transition-all"
            />
        </div>
    );

    return (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
                <div className="bg-gradient-to-r from-primary-600 to-green-500 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                            <Plus size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold">Post Crop Listing</h2>
                            <p className="text-primary-100 text-xs">Reach 350+ verified buyers instantly</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-all">
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {field('Crop Name', 'crop', 'text', 'e.g. Wheat')}
                        {field('Variety', 'variety', 'text', 'e.g. Sharbati')}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {field('Quantity', 'quantity', 'number', 'e.g. 50')}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Unit</label>
                            <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:text-white text-sm">
                                {['Tonnes', 'Quintals', 'Bags', 'Bales'].map(u => <option key={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                    {field('Expected Price (₹/unit)', 'price', 'number', 'e.g. 2400')}
                    {field('Location (District, State)', 'location', 'text', 'e.g. Ludhiana, Punjab')}
                    <button type="submit" disabled={submitting}
                        className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                        {submitting ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                        ) : (
                            <><CheckCircle2 size={18} /> Post Listing</>
                        )}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const Marketplace: React.FC = () => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showPostModal, setShowPostModal] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const data = useRealisticData();

    // Simulate data fetch on mount
    React.useEffect(() => {
        const timer = setTimeout(() => setIsDataLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // Boost match scores for the session crop
    const listings = useMemo(() => BASE_LISTINGS.map(l => {
        const isSessionCrop = l.cropType === SESSION_CROP;
        const baseMatch = rndInt(l.matchScore - 5, Math.min(96, l.matchScore + 3));
        return { 
            ...l, 
            matchScore: isSessionCrop ? Math.min(99, baseMatch + 15) : baseMatch 
        };
    }), []);

    const categories = ['All', 'Rice', 'Wheat', 'Cotton', 'Maize', 'Vegetables'];

    const filteredListings = listings.filter(l =>
        (selectedCategory === 'All' || l.cropType === selectedCategory || (selectedCategory === 'Vegetables' && l.cropType === 'Tomatoes')) &&
        (l.cropType.toLowerCase().includes(searchTerm.toLowerCase()) || l.location.toLowerCase().includes(searchTerm.toLowerCase()) || l.farmerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleContact = (name: string) => {
        try {
            toast.info(`📲 Contact request sent to ${name}. They'll respond within 24 hours.`, { position: 'bottom-right', autoClose: 4000 });
        } catch (err) {
            toast.error('Unable to send contact request. Please check your connection.');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <AnimatePresence>{showPostModal && <PostCropModal onClose={() => setShowPostModal(false)} />}</AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-up-fade">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="text-primary-600" />
                        {t('nav.marketplace', 'Agri Marketplace')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Connect directly with verified farmers and buyers.</p>
                </div>
                <button onClick={() => setShowPostModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl shadow-lg hover:bg-primary-700 transition-all font-semibold hover:scale-105 active:scale-95">
                    <Plus size={18} />
                    Post a Listing
                </button>
            </div>

            {/* Analytics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
                {[
                    { label: 'Active Listings', value: `${rndInt(1220, 1280).toLocaleString()}`, trend: `+${rndInt(12, 18)}% this week`, color: 'border-l-blue-500' },
                    { label: 'Successful Trades (30d)', value: `₹${rndInt(38, 48) / 10}Cr`, trend: `+${rndInt(6, 12)}% this week`, color: 'border-l-green-500' },
                    { label: 'Verified Buyers', value: `${rndInt(340, 365)}+`, trend: 'Across 12 states', color: 'border-l-purple-500' },
                ].map(({ label, value, trend, color }) => (
                    <div key={label} className={`card p-5 border-l-4 ${color}`}>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{label}</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                        <span className="text-xs text-green-500 font-medium">{trend}</span>
                    </div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center !py-3 animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Search crops, locations, farmers..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white" />
                </div>
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto w-full md:w-auto">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
                <button className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0">
                    <Filter size={20} />
                </button>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
                {isDataLoading ? (
                    // Skeleton Loaders
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="card rounded-2xl h-[400px] animate-pulse bg-gray-100 dark:bg-gray-800/40 relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                        </div>
                    ))
                ) : (
                    <AnimatePresence>
                        {filteredListings.map(listing => (
                            <motion.div key={listing.id} layout
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="card rounded-2xl overflow-hidden group cursor-pointer flex flex-col h-full !p-0">
                                <div className="relative h-48 overflow-hidden">
                                    <img src={listing.image} alt={listing.cropType} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-xs font-bold flex items-center gap-1">
                                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                        {listing.rating}
                                    </div>
                                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                                        <div className="px-2.5 py-1 bg-gradient-to-r from-primary-500 to-green-500 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                                            <TrendingUp size={12} />
                                            AI Match: {listing.matchScore}%
                                        </div>
                                        {listing.cropType === SESSION_CROP && (
                                            <div className="px-2.5 py-1 bg-gold-500 text-white rounded-lg text-[10px] font-black shadow-lg animate-pulse-slow">
                                                HIGH DEMAND
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                                {listing.cropType} ({listing.variety})
                                            </h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <MapPin size={14} /> {listing.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <span className="text-xs text-gray-500 block">Available</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{listing.quantity} {listing.unit}</span>
                                        </div>
                                        <div className="bg-primary-50 dark:bg-primary-900/10 p-2.5 rounded-xl border border-primary-100 dark:border-primary-800/30">
                                            <span className="text-xs text-primary-600 dark:text-primary-400 block">Price</span>
                                            <span className="text-sm font-bold text-primary-700 dark:text-primary-300">₹{listing.price}/{listing.unit === 'Tonnes' ? 'Don' : 'Bale'}</span>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                                        <span className="text-xs text-gray-400">By: <span className="font-medium text-gray-700 dark:text-gray-300">{listing.farmerName}</span></span>
                                        <button onClick={() => handleContact(listing.farmerName)}
                                            className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline flex items-center gap-1 text-left">
                                            Contact
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {filteredListings.length === 0 && (
                <div className="text-center py-16 card rounded-2xl">
                    <Info className="mx-auto text-gray-300 dark:text-gray-700 mb-3" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No listings found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                    <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }} className="mt-4 text-primary-600 text-sm font-medium hover:underline">Clear filters</button>
                </div>
            )}
        </div>
    );
};

export default Marketplace;
