import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Satellite, Activity, AlertTriangle, CheckCircle, Map } from 'lucide-react';

const NDVI_ZONES = [
    { zone: 'Zone A (NW)', ndvi: 0.72, evi: 0.68, status: 'Healthy', color: '#22c55e', area: '2.1 ha' },
    { zone: 'Zone B (NE)', ndvi: 0.58, evi: 0.52, status: 'Moderate', color: '#f59e0b', area: '1.8 ha' },
    { zone: 'Zone C (SE)', ndvi: 0.41, evi: 0.38, status: 'Stressed', color: '#ef4444', area: '1.2 ha' },
    { zone: 'Zone D (SW)', ndvi: 0.65, evi: 0.61, status: 'Healthy', color: '#22c55e', area: '2.4 ha' },
    { zone: 'Zone E (Center)', ndvi: 0.79, evi: 0.74, status: 'Excellent', color: '#16a34a', area: '1.5 ha' },
];

const CropHealthMonitoring: React.FC = () => {
    const { t } = useTranslation();
    const [selectedZone, setSelectedZone] = useState<number | null>(null);

    const avgNDVI = (NDVI_ZONES.reduce((a, z) => a + z.ndvi, 0) / NDVI_ZONES.length).toFixed(2);
    const healthyCount = NDVI_ZONES.filter(z => z.status === 'Healthy' || z.status === 'Excellent').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center md:flex-row md:items-start justify-between gap-4 text-center md:text-left">
                <div>
                    <h1 className="page-header text-gradient font-extrabold">Satellite Crop Health</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Precision NDVI & EVI vegetation analytics via satellite vision</p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="badge-gold py-1.5 px-3 shadow-sm border border-gold-200 dark:border-gold-800">
                        🛰️ Satellite AI Vision
                    </span>
                    <span className="badge bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                        🏆 Precision Intelligence
                    </span>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Avg NDVI Score', value: avgNDVI, color: 'text-gold-600', bg: 'glass-gold border-gold-200', icon: '🌿' },
                    { label: 'Healthy Zones', value: `${healthyCount}/${NDVI_ZONES.length}`, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20', icon: '✅' },
                    { label: 'Stress Zones', value: NDVI_ZONES.filter(z => z.status === 'Stressed').length, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', icon: '⚠️' },
                    { label: 'Total Farm Area', value: '9.0 ha', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: '🗺️' },
                ].map(s => (
                    <div key={s.label} className={`card p-4 transition-transform hover:scale-105 duration-300 ${s.bg}`}>
                        <span className="text-2xl">{s.icon}</span>
                        <p className={`text-2xl font-black font-display mt-2 ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Simulated Farm Map */}
                <div className="lg:col-span-3 card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header">Farm Vegetation Map</h3>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-700 inline-block" />Excellent</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-400 inline-block" />Good</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" />Moderate</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" />Stressed</span>
                        </div>
                    </div>

                    {/* SVG Farm Heatmap */}
                    <div className="relative w-full h-72 bg-gray-100 dark:bg-gray-700/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                        <svg viewBox="0 0 400 280" className="w-full h-full">
                            {/* Background */}
                            <rect width="400" height="280" fill="#f0fdf4" />
                            {/* Grid lines */}
                            {[0, 1, 2, 3].map(i => (
                                <line key={i} x1={i * 100} y1="0" x2={i * 100} y2="280" stroke="#d1d5db" strokeWidth="0.5" />
                            ))}
                            {[0, 1, 2].map(i => (
                                <line key={i} x1="0" y1={i * 140} x2="400" y2={i * 140} stroke="#d1d5db" strokeWidth="0.5" />
                            ))}
                            {/* Zones */}
                            <rect x="5" y="5" width="185" height="130" rx="6" fill="#22c55e" opacity="0.7" className="cursor-pointer hover:opacity-90" onClick={() => setSelectedZone(0)} />
                            <text x="97" y="70" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Zone A</text>
                            <text x="97" y="85" textAnchor="middle" fill="white" fontSize="10">NDVI: 0.72</text>

                            <rect x="210" y="5" width="185" height="130" rx="6" fill="#f59e0b" opacity="0.75" className="cursor-pointer hover:opacity-90" onClick={() => setSelectedZone(1)} />
                            <text x="302" y="70" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Zone B</text>
                            <text x="302" y="85" textAnchor="middle" fill="white" fontSize="10">NDVI: 0.58</text>

                            <rect x="210" y="145" width="185" height="130" rx="6" fill="#ef4444" opacity="0.75" className="cursor-pointer hover:opacity-90" onClick={() => setSelectedZone(2)} />
                            <text x="302" y="213" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Zone C</text>
                            <text x="302" y="228" textAnchor="middle" fill="white" fontSize="10">NDVI: 0.41</text>

                            <rect x="5" y="145" width="185" height="130" rx="6" fill="#22c55e" opacity="0.7" className="cursor-pointer hover:opacity-90" onClick={() => setSelectedZone(3)} />
                            <text x="97" y="213" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Zone D</text>
                            <text x="97" y="228" textAnchor="middle" fill="white" fontSize="10">NDVI: 0.65</text>

                            <circle cx="200" cy="140" r="45" fill="#16a34a" opacity="0.8" className="cursor-pointer hover:opacity-90" onClick={() => setSelectedZone(4)} />
                            <text x="200" y="136" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Zone E</text>
                            <text x="200" y="150" textAnchor="middle" fill="white" fontSize="10">NDVI: 0.79</text>
                        </svg>

                        {/* Legend */}
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                            Click zones for details
                        </div>
                    </div>
                </div>

                {/* Zone Details */}
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="section-header">Zone Analysis</h3>
                    {NDVI_ZONES.map((zone, i) => (
                        <div
                            key={zone.zone}
                            onClick={() => setSelectedZone(selectedZone === i ? null : i)}
                            className={`card p-4 cursor-pointer transition-all ${selectedZone === i ? 'ring-2 ring-primary-500' : 'hover:shadow-md'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: zone.color }} />
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{zone.zone}</span>
                                </div>
                                <span className={`badge ${zone.status === 'Healthy' || zone.status === 'Excellent' ? 'badge-green' : zone.status === 'Moderate' ? 'badge-yellow' : 'badge-red'}`}>
                                    {zone.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">NDVI</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">{zone.ndvi}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">EVI</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">{zone.evi}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">Area</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">{zone.area}</p>
                                </div>
                            </div>
                            {selectedZone === i && zone.status === 'Stressed' && (
                                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-600 dark:text-red-400">
                                    ⚠️ Intervention needed: Possible water stress or pest infestation. Recommend field inspection.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CropHealthMonitoring;
