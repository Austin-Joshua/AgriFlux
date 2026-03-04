import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Droplets, Clock, AlertTriangle, CheckCircle, Thermometer, Wind } from 'lucide-react';

const scheduleData = [
    { day: 'Mon', required: 25, recommended: 20 },
    { day: 'Tue', required: 30, recommended: 0 },
    { day: 'Wed', required: 20, recommended: 18 },
    { day: 'Thu', required: 35, recommended: 0 },
    { day: 'Fri', required: 28, recommended: 22 },
    { day: 'Sat', required: 32, recommended: 28 },
    { day: 'Sun', required: 25, recommended: 20 },
];

const etData = [
    { time: '6am', et: 0.8 }, { time: '9am', et: 2.1 }, { time: '12pm', et: 4.2 },
    { time: '3pm', et: 3.8 }, { time: '6pm', et: 1.9 }, { time: '9pm', et: 0.5 },
];

const IrrigationIntelligence: React.FC = () => {
    const { t } = useTranslation();
    const [cropType, setCropType] = useState('Rice');
    const [area, setArea] = useState('5');
    const [soilType, setSoilType] = useState('Clay Loam');
    const [calculated, setCalculated] = useState(false);

    const waterSaved = 2400;
    const efficiency = 84;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="page-header">{t('irrigation.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('irrigation.subtitle')}</p>
            </div>

            {/* Alert */}
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300">Rainfall Alert</p>
                    <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-0.5">18mm of rainfall expected Thursday. AI recommends skipping irrigation on Wednesday and Thursday to conserve water.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Config Form */}
                <div className="card">
                    <h3 className="section-header mb-4">Farm Configuration</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="label">Crop Type</label>
                            <select className="input-field" value={cropType} onChange={e => setCropType(e.target.value)}>
                                {['Rice', 'Wheat', 'Corn', 'Cotton', 'Sugarcane'].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Farm Area (hectares)</label>
                            <input type="number" className="input-field" value={area} onChange={e => setArea(e.target.value)} min="0.1" step="0.1" />
                        </div>
                        <div>
                            <label className="label">Soil Type</label>
                            <select className="input-field" value={soilType} onChange={e => setSoilType(e.target.value)}>
                                {['Sandy Loam', 'Clay Loam', 'Silt Loam', 'Sandy Clay', 'Heavy Clay'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Current Soil Moisture (%)</label>
                            <input type="number" className="input-field" defaultValue="45" min="0" max="100" />
                        </div>

                        <button onClick={() => setCalculated(true)} className="btn-primary w-full">
                            <span className="flex items-center justify-center gap-2"><Droplets size={16} /> Calculate Schedule</span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                            <p className="text-2xl font-bold text-blue-600 font-display">{waterSaved.toLocaleString()}</p>
                            <p className="text-xs text-blue-500 mt-0.5">Liters Saved</p>
                        </div>
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-center">
                            <p className="text-2xl font-bold text-primary-600 font-display">{efficiency}%</p>
                            <p className="text-xs text-primary-500 mt-0.5">Efficiency</p>
                        </div>
                    </div>
                </div>

                {/* Schedule Chart */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header">Weekly Irrigation Schedule</h3>
                        <span className="badge-blue">Required vs Recommended</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={scheduleData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} unit="mm" />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Bar dataKey="required" name="Crop Requirement" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="recommended" name="AI Recommended" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* ET Chart */}
                    <div className="mt-4">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Evapotranspiration Today (mm/hr)</h4>
                        <ResponsiveContainer width="100%" height={140}>
                            <AreaChart data={etData}>
                                <defs>
                                    <linearGradient id="etGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Area type="monotone" dataKey="et" stroke="#f97316" fill="url(#etGrad)" strokeWidth={2} name="ET Rate" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Irrigation Schedule Cards */}
            {(calculated || true) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { day: 'Monday', time: '6:00 AM', duration: '45 min', amount: '20mm', status: 'scheduled', icon: Clock },
                        { day: 'Wednesday', time: 'Skipped', duration: '—', amount: '0mm', status: 'rain', icon: AlertTriangle },
                        { day: 'Friday', time: '5:30 AM', duration: '60 min', amount: '22mm', status: 'scheduled', icon: Clock },
                        { day: 'Sunday', time: '6:00 AM', duration: '50 min', amount: '20mm', status: 'scheduled', icon: Clock },
                    ].map(s => (
                        <div key={s.day} className={`card p-4 ${s.status === 'rain' ? 'border-blue-200 dark:border-blue-800' : ''}`}>
                            <div className="flex items-start justify-between mb-2">
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{s.day}</p>
                                {s.status === 'rain'
                                    ? <span className="badge-blue">🌧️ Rain</span>
                                    : <span className="badge-green">Scheduled</span>
                                }
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">{s.time}</p>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-500">Duration: {s.duration}</span>
                                <span className="text-xs font-semibold text-blue-500">{s.amount}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default IrrigationIntelligence;
