import React, { useState } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Star, StarOff, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';

interface Crop {
    id: string; name: string; emoji: string;
    price: number; msp: number; change: number; changePct: number;
    high: number; low: number; volume: string;
    data: { t: string; v: number }[];
    weekData: { t: string; v: number }[];
}

// Simulated market data
const generateData = (base: number, points: number, label: string[]) =>
    label.map((t, i) => ({ t, v: Math.round(base + (Math.random() - 0.48) * base * 0.04 * (i + 1)) }));

const dayLabels = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'];
const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthLabels = ['W1', 'W2', 'W3', 'W4'];
const yearLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const createCrop = (id: string, name: string, emoji: string, price: number, msp: number) => {
    const change = Math.round((Math.random() - 0.45) * price * 0.06);
    return {
        id, name, emoji, price, msp, change,
        changePct: Math.round((change / price) * 1000) / 10,
        high: price + Math.abs(change) + 20,
        low: price - Math.abs(change) - 15,
        volume: `${Math.round(Math.random() * 80 + 20)}K MT`,
        data: generateData(price, 9, dayLabels),
        weekData: generateData(price, 6, weekLabels),
    };
};

const initialCrops: Crop[] = [
    createCrop('rice', 'Rice', '🌾', 2450, 2183),
    createCrop('wheat', 'Wheat', '🌿', 2380, 2275),
    createCrop('maize', 'Maize', '🌽', 1890, 1962),
    createCrop('cotton', 'Cotton', '🌱', 6520, 6620),
    createCrop('soybean', 'Soybean', '🫘', 4250, 4600),
    createCrop('groundnut', 'Groundnut', '🥜', 5720, 5850),
    createCrop('onion', 'Onion', '🧅', 1840, 0),
    createCrop('tomato', 'Tomato', '🍅', 2100, 0),
    createCrop('potato', 'Potato', '🥔', 1280, 0),
    createCrop('sugarcane', 'Sugarcane', '🎋', 380, 340),
    createCrop('turmeric', 'Turmeric', '🌕', 14800, 0),
    createCrop('chilli', 'Red Chilli', '🌶️', 9200, 0),
];

const MarketAnalysis: React.FC = () => {
    const [crops] = useState<Crop[]>(initialCrops);
    const [selected, setSelected] = useState<Crop>(initialCrops[0]);
    const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');
    const [watchlist, setWatchlist] = useState<string[]>(['rice', 'wheat', 'cotton']);

    const toggleWatch = (id: string) =>
        setWatchlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);

    const gainers = [...crops].filter(c => c.change > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 3);
    const losers = [...crops].filter(c => c.change < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 3);

    const chartData = timeframe === '1D' ? selected.data :
        timeframe === '1W' ? selected.weekData :
            timeframe === '1M' ? generateData(selected.price, 4, monthLabels) :
                generateData(selected.price, 12, yearLabels);

    const aboveMSP = selected.msp > 0 && selected.price >= selected.msp;
    const below = selected.msp > 0 && selected.price < selected.msp;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="page-header">📈 Crop Market Analysis</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Live mandi prices, MSP comparison, and market trends</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <RefreshCw size={12} className="animate-spin-slow" />
                    <span>Simulated live data · Updates every 30s</span>
                </div>
            </div>

            {/* Ticker Bar */}
            <div className="card !p-0 overflow-hidden">
                <div className="flex overflow-x-auto scrollbar-none">
                    {crops.map(c => (
                        <button key={c.id} onClick={() => setSelected(c)}
                            className={`flex items-center gap-2 px-4 py-3 border-r border-gray-100 dark:border-gray-700/50 whitespace-nowrap hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex-shrink-0 ${selected.id === c.id ? 'bg-primary-50 dark:bg-primary-900/20 border-b-2 border-b-primary-500' : ''}`}>
                            <span className="text-base">{c.emoji}</span>
                            <div className="text-left">
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{c.name}</p>
                                <p className={`text-xs font-semibold ${c.change >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-500'}`}>
                                    ₹{c.price.toLocaleString()}
                                    <span className="ml-1 text-[10px]">{c.change >= 0 ? '+' : ''}{c.changePct}%</span>
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Chart Panel */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="card">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{selected.emoji}</span>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">{selected.name}</h2>
                                    <button onClick={() => toggleWatch(selected.id)} className="text-gray-300 hover:text-amber-400 transition-colors">
                                        {watchlist.includes(selected.id) ? <Star size={16} className="fill-amber-400 text-amber-400" /> : <StarOff size={16} />}
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">₹{selected.price.toLocaleString()}<span className="text-sm text-gray-400">/qt</span></span>
                                    <span className={`flex items-center gap-1 text-sm font-bold ${selected.change >= 0 ? 'text-primary-600' : 'text-red-500'}`}>
                                        {selected.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {selected.change >= 0 ? '+' : ''}₹{selected.change} ({selected.changePct}%)
                                    </span>
                                </div>
                            </div>
                            {/* Timeframe */}
                            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                                {(['1D', '1W', '1M', '1Y'] as const).map(tf => (
                                    <button key={tf} onClick={() => setTimeframe(tf)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${timeframe === tf ? 'bg-white dark:bg-gray-600 shadow text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* MSP Alert */}
                        {selected.msp > 0 && (
                            <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${aboveMSP ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200'}`}>
                                <AlertCircle size={13} />
                                {aboveMSP
                                    ? `Market price ₹${(selected.price - selected.msp).toLocaleString()} above MSP — good time to sell!`
                                    : `⚠️ Market price ₹${(selected.msp - selected.price).toLocaleString()} BELOW MSP of ₹${selected.msp.toLocaleString()} — hold if possible`}
                            </div>
                        )}

                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="cropGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={selected.change >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={selected.change >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                                <XAxis dataKey="t" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: 12 }}
                                    formatter={(v: number) => [`₹${v.toLocaleString()}`, selected.name]} />
                                {selected.msp > 0 && <ReferenceLine y={selected.msp} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: 'MSP', fill: '#f59e0b', fontSize: 10 }} />}
                                <Area type="monotone" dataKey="v" stroke={selected.change >= 0 ? '#22c55e' : '#ef4444'} fill="url(#cropGrad)" strokeWidth={2.5} />
                            </AreaChart>
                        </ResponsiveContainer>

                        {/* Stats row */}
                        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                            {[
                                { l: "Day High", v: `₹${selected.high.toLocaleString()}` },
                                { l: "Day Low", v: `₹${selected.low.toLocaleString()}` },
                                { l: "Volume", v: selected.volume },
                                { l: "MSP", v: selected.msp > 0 ? `₹${selected.msp.toLocaleString()}` : 'N/A' },
                            ].map(s => (
                                <div key={s.l} className="text-center">
                                    <p className="text-[10px] text-gray-400">{s.l}</p>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{s.v}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="space-y-4">
                    {/* Watchlist */}
                    <div className="card">
                        <h3 className="section-header mb-3 flex items-center gap-2">
                            <Star size={15} className="text-amber-400 fill-amber-400" /> Watchlist
                        </h3>
                        <div className="space-y-2">
                            {crops.filter(c => watchlist.includes(c.id)).map(c => (
                                <button key={c.id} onClick={() => setSelected(c)} className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span>{c.emoji}</span>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{c.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">₹{c.price.toLocaleString()}</p>
                                        <p className={`text-[11px] font-semibold ${c.change >= 0 ? 'text-primary-600' : 'text-red-500'}`}>{c.change >= 0 ? '+' : ''}{c.changePct}%</p>
                                    </div>
                                </button>
                            ))}
                            {watchlist.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Star a crop to add to watchlist</p>}
                        </div>
                    </div>

                    {/* Gainers / Losers */}
                    <div className="card">
                        <h3 className="section-header mb-3 flex items-center gap-2"><TrendingUp size={15} className="text-primary-500" /> Top Movers</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 font-semibold">Gainers</p>
                        {gainers.map(c => (
                            <button key={c.id} onClick={() => setSelected(c)} className="w-full flex items-center justify-between py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg px-2 transition-colors">
                                <span className="text-sm text-gray-600 dark:text-gray-300">{c.emoji} {c.name}</span>
                                <span className="text-sm font-bold text-primary-600">+{c.changePct}%</span>
                            </button>
                        ))}
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-3 mb-2 font-semibold">Losers</p>
                        {losers.map(c => (
                            <button key={c.id} onClick={() => setSelected(c)} className="w-full flex items-center justify-between py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg px-2 transition-colors">
                                <span className="text-sm text-gray-600 dark:text-gray-300">{c.emoji} {c.name}</span>
                                <span className="text-sm font-bold text-red-500">{c.changePct}%</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketAnalysis;
