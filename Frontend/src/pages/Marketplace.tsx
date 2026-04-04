import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, MapPin, Star, TrendingUp, ShoppingCart, Info, X, CheckCircle2, Plus, ShieldCheck } from 'lucide-react';
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
    const [selectedCropReport, setSelectedCropReport] = useState<CropListing | null>(null);
    const [buyingId, setBuyingId] = useState<string | null>(null);
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
            matchScore: isSessionCrop ? Math.min(99, baseMatch + 15) : baseMatch,
            harvestDate: '2026-03-25',
            moisture: '14.2%',
            certification: 'ISO 22000'
        };
    }), []);

    const categories = ['All', 'Rice', 'Wheat', 'Cotton', 'Maize', 'Vegetables'];

    const filteredListings = listings.filter(l =>
        (selectedCategory === 'All' || l.cropType === selectedCategory || (selectedCategory === 'Vegetables' && l.cropType === 'Tomatoes')) &&
        (l.cropType.toLowerCase().includes(searchTerm.toLowerCase()) || l.location.toLowerCase().includes(searchTerm.toLowerCase()) || l.farmerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleContact = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        try {
            toast.info(`📲 Contact request sent to ${name}. They'll respond within 24 hours.`, { position: 'bottom-right', autoClose: 4000 });
        } catch (err) {
            toast.error('Unable to send contact request. Please check your connection.');
        }
    };

    const handleBuyNow = async (e: React.MouseEvent, crop: CropListing) => {
        e.stopPropagation();
        setBuyingId(crop.id);
        await new Promise(r => setTimeout(r, 1500));
        toast.success(`🎉 Purchase successful! 50MT of ${crop.cropType} secured. Logistics tracking will be available in 2 hours.`, {
            position: 'top-center',
            autoClose: 6000,
            theme: 'colored'
        });
        setBuyingId(null);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <AnimatePresence>
                {selectedCropReport && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedCropReport(null)} />
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[32px] shadow-3xl overflow-hidden border border-white/20"
                        >
                            <div className="h-2 bg-gradient-to-r from-primary-500 via-green-500 to-gold-500" />
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-3xl shadow-inner">
                                            {selectedCropReport.cropType === 'Wheat' ? '🌾' : selectedCropReport.cropType === 'Rice' ? '🍚' : '🌱'}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{selectedCropReport.cropType} Quality Report</h2>
                                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                Verified by AgriFlux Lab · Batch #AF-{rndInt(1000, 9999)}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedCropReport(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:scale-110 transition-transform">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/50">
                                            <h4 className="text-xs font-black text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <TrendingUp size={14} /> AI Quality Grade: A+
                                            </h4>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Moisture Content', value: '12.4%', status: 'Optimal', color: 'text-blue-500' },
                                                    { label: 'Protein (NIR)', value: '14.2%', status: 'High', color: 'text-green-500' },
                                                    { label: 'Foreign Matter', value: '0.02%', status: 'Minimal', color: 'text-green-500' },
                                                    { label: 'Gluten Index', value: '92', status: 'Excellent', color: 'text-primary-500' },
                                                ].map(stat => (
                                                    <div key={stat.label} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-500 font-bold">{stat.label}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-black ${stat.color}`}>{stat.value}</span>
                                                            <span className="text-[10px] bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full shadow-sm text-gray-400 font-black uppercase">{stat.status}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                                            <ShieldCheck className="text-amber-600" size={24} />
                                            <div>
                                                <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-tighter">Microbial Safety</p>
                                                <p className="text-[10px] text-amber-700 dark:text-amber-500 font-bold">Negative for Aflatoxins & Mycotoxins</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-primary-600 rounded-3xl text-white shadow-xl shadow-primary-500/20">
                                            <p className="text-primary-100 text-xs font-black uppercase tracking-widest mb-1">Current Inventory</p>
                                            <p className="text-3xl font-black">{selectedCropReport.quantity} {selectedCropReport.unit}</p>
                                            <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-end">
                                                <div>
                                                    <p className="text-primary-200 text-[10px] font-bold uppercase tracking-widest">Listing Price</p>
                                                    <p className="text-xl font-black">₹{selectedCropReport.price}/MT</p>
                                                </div>
                                                <button 
                                                    onClick={(e) => { handleBuyNow(e, selectedCropReport); setSelectedCropReport(null); }}
                                                    className="px-6 py-2 bg-white text-primary-600 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    SECURE BATCH
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Agronomist Observations</p>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium italic leading-relaxed">
                                                    "Superior kernel hardness and test weight. Crop harvested during dry window ensuring low enzymatic activity. Ideal for premium milling applications."
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold mt-2">— Dr. S. K. Mehta, Sr. Agronomist</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {showPostModal && <PostCropModal onClose={() => setShowPostModal(false)} />}
            </AnimatePresence>

            {/* Header — Standardized */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="page-header flex items-center gap-3">
            <ShoppingCart className="text-primary-600 dark:text-primary-400" />
            {t('nav.marketplace')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
            Browse and purchase high-quality crops directly from certified farms.
          </p>
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

            {/* Crop Grid — Standard 3-column on desktop */}
            <div className="standard-grid mt-6 animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
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
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedCropReport(listing); }}
                                        className="absolute bottom-3 right-3 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                                        title="View Detailed Report"
                                    >
                                        <Info size={18} />
                                    </button>
                                </div>
                                <div className="p-5 flex flex-col flex-1" onClick={() => setSelectedCropReport(listing)}>
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
                                            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Available</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{listing.quantity} {listing.unit}</span>
                                        </div>
                                        <div className="bg-primary-50 dark:bg-primary-900/10 p-2.5 rounded-xl border border-primary-100 dark:border-primary-800/30">
                                            <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 block uppercase tracking-wider">Price</span>
                                            <span className="text-sm font-bold text-primary-700 dark:text-primary-300">₹{listing.price}/ton</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <button 
                                            onClick={(e) => handleBuyNow(e, listing)}
                                            disabled={buyingId === listing.id}
                                            className="flex-1 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl text-xs font-black shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {buyingId === listing.id ? 'PROCESSING...' : 'BUY NOW'}
                                        </button>
                                        <button 
                                            onClick={(e) => handleContact(e, listing.farmerName)}
                                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                        >
                                            <ShoppingCart size={16} className="text-gray-400" />
                                        </button>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-400">By: <span className="text-gray-700 dark:text-gray-300">{listing.farmerName}</span></span>
                                        <span className="text-[10px] font-bold text-primary-500 uppercase">Verified Crop</span>
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
