import React, { useState } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Star, Search, ArrowUpDown, AlertCircle, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Crop {
    id: string;
    name: string;
    icon: string;
    price: number;
    msp: number;
    change: string;
    high: number;
    low: number;
    volume: string;
    trends: { t: string; v: number }[];
}

// Simulated market data
const generateData = (base: number, points: number, label: string[]) =>
    label.map((t, i) => ({ t, v: Math.round(base + (Math.random() - 0.48) * base * 0.04 * (i + 1)) }));
const dayLabels = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'];
const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthLabels = ['W1', 'W2', 'W3', 'W4'];
const yearLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MarketAnalysis: React.FC = () => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');

    const generateCrop = (id: string, name: string, icon: string, price: number, msp: number) => {
        const changeVal = Math.round((Math.random() - 0.45) * price * 0.06);
        const changePct = (Math.round((changeVal / price) * 1000) / 10);
        return {
            id, name, icon, price, msp,
            change: (changePct >= 0 ? '+' : '') + changePct.toFixed(1) + '%',
            high: price + Math.round(price * 0.03), // Simulated high
            low: price - Math.round(price * 0.02),  // Simulated low
            volume: `${(Math.random() * 10 + 1).toFixed(1)}k T`, // Simulated volume
            trends: generateData(price, 9, dayLabels)
        };
    };

    const marketData: Crop[] = [
        generateCrop('rice', 'Rice', '🌾', 2450, 2183),
        generateCrop('wheat', 'Wheat', '🌿', 2380, 2275),
        generateCrop('maize', 'Maize', '🌽', 1890, 1962),
        generateCrop('cotton', 'Cotton', '🌱', 6520, 6620),
        generateCrop('soybean', 'Soybean', '🫘', 4250, 4600),
        generateCrop('groundnut', 'Groundnut', '🥜', 5720, 5850),
        generateCrop('onion', 'Onion', '🧅', 1840, 1700),
        generateCrop('tomato', 'Tomato', '🍅', 2100, 2000),
        generateCrop('potato', 'Potato', '🥔', 1280, 1100),
        generateCrop('sugarcane', 'Sugarcane', '🎋', 380, 340),
        generateCrop('turmeric', 'Turmeric', '🌕', 14800, 12000),
        generateCrop('chilli', 'Red Chilli', '🌶️', 9200, 8000),
    ];

    const [selectedCrop, setSelectedCrop] = useState<Crop>(marketData[0]);
    const [watchlist, setWatchlist] = useState<string[]>(['Wheat', 'Rice']);

    const toggleWatchlist = (name: string) =>
        setWatchlist(w => w.includes(name) ? w.filter(x => x !== name) : [...w, name]);

    const filtered = marketData.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );


    const chartData = timeframe === '1D' ? selected.data :
        timeframe === '1W' ? selected.weekData :
            timeframe === '1M' ? generateData(selected.price, 4, monthLabels) :
                generateData(selected.price, 12, yearLabels);

    const aboveMSP = selected.msp > 0 && selected.price >= selected.msp;
    const below = selected.msp > 0 && selected.price < selected.msp;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="page-header">📈 {t('market.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('market.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-100/50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-bold border border-primary-200 dark:border-primary-800/50">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    {t('market.liveData')}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Analysis Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Charts & Ticker */}
                    <div className="card">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">{selectedCrop.icon}</div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedCrop.name}</h2>
                                    <div className="flex items-center gap-3">
                                        <p className="text-2xl font-bold text-primary-600">₹{selectedCrop.price.toLocaleString()}<span className="text-xs font-medium text-gray-400 ml-1">{t('market.perQt')}</span></p>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${selectedCrop.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {selectedCrop.change.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {selectedCrop.change}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => toggleWatchlist(selectedCrop.name)} className={`p-2 rounded-xl border transition-all ${watchlist.includes(selectedCrop.name) ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                                <Star size={18} fill={watchlist.includes(selectedCrop.name) ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        {/* MSP Alert */}
                        <div className={`p-3 rounded-xl mb-6 border ${selectedCrop.price >= selectedCrop.msp ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800/50 text-primary-700 dark:text-primary-400' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-400'}`}>
                            <p className="text-xs font-bold flex items-center gap-2">
                                <AlertCircle size={14} />
                                {selectedCrop.price >= selectedCrop.msp
                                    ? t('market.aboveMsp', { diff: (selectedCrop.price - selectedCrop.msp).toLocaleString() })
                                    : t('market.belowMsp', { diff: (selectedCrop.msp - selectedCrop.price).toLocaleString(), msp: selectedCrop.msp.toLocaleString() })
                                }
                            </p>
                        </div>

                        {/* Chart Area */}
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={selectedCrop.trends}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="opacity-30" />
                                    <XAxis dataKey="t" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                                    <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Price Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                            {[
                                { label: t('market.dayHigh'), value: `₹${(selectedCrop.price + 120).toLocaleString()}` },
                                { label: t('market.dayLow'), value: `₹${(selectedCrop.price - 85).toLocaleString()}` },
                                { label: t('market.volume'), value: '4.2k T' },
                                { label: t('market.msp'), value: `₹${selectedCrop.msp.toLocaleString()}` },
                            ].map(stat => (
                                <div key={stat.label}>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-sm font-black text-gray-800 dark:text-gray-200">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Watchlist */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <Star size={16} className="text-amber-500 fill-amber-500" />
                            <h3 className="section-header">{t('market.watchlist')}</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {marketData.filter(d => watchlist.includes(d.name)).map(d => (
                                <div key={d.name} onClick={() => setSelectedCrop(d)}
                                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between
                                        ${selectedCrop.name === d.name ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{d.icon}</span>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{d.name}</p>
                                            <p className="text-xs text-primary-600 font-bold">₹{d.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold ${d.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{d.change}</span>
                                </div>
                            ))}
                            {watchlist.length === 0 && <p className="text-xs text-gray-400 py-4 italic">{t('market.starToWatch')}</p>}
                        </div>
                    </div>
                </div>

                {/* Sidebar Search & Rankings */}
                <div className="space-y-6">
                    <div className="card">
                        <div className="relative mb-6">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder={t('subsidies.search')}
                                className="input-field pl-10 w-full"
                            />
                        </div>

                        <h3 className="section-header mb-4 flex items-center gap-2"><ArrowUpDown size={14} /> {t('market.topMovers')}</h3>
                        <div className="space-y-4">
                            {filtered.sort((a, b) => parseFloat(b.change) - parseFloat(a.change)).map(d => (
                                <div key={d.name} onClick={() => setSelectedCrop(d)}
                                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800
                                        ${selectedCrop.name === d.name ? 'bg-primary-50/50 dark:bg-primary-900/5' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{d.icon}</span>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{d.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">₹{d.price.toLocaleString()}</p>
                                        <p className={`text-[10px] font-bold ${d.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{d.change}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card bg-gray-900 text-white border-none shadow-glow-green overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="font-black text-lg mb-4">{t('market.gainers')} & {t('market.losers')}</h3>
                            <div className="space-y-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingUp size={10} /> {t('market.gainers')}</p>
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold">Tomato (Nashik)</span>
                                        <span className="text-lg font-black text-green-500">+18.4%</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingDown size={10} /> {t('market.losers')}</p>
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold">Onion (Maharashtra)</span>
                                        <span className="text-lg font-black text-red-500">-12.1%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 blur-3xl -mr-16 -mt-16" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketAnalysis;
