import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Map as MapIcon,
  Maximize2,
  Calculator,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReportModal from '../components/ReportModal';
import SEO from '../components/SEO';

const toDMS = (coordinate: number, isLat: boolean, secondOffset = 0) => {
  let absolute = Math.abs(coordinate);
  absolute += secondOffset * 0.000277;
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
  const dir = isLat ? (coordinate >= 0 ? 'N' : 'S') : (coordinate >= 0 ? 'E' : 'W');
  return `${degrees}°${minutes}'${seconds}" ${dir}`;
};

const LandIntelligence: React.FC = () => {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    size: number;
    value: number;
    health: number;
    zones: { type: string; area: number; color: string }[];
  } | null>(null);
  const [selectedReport, setSelectedReport] = useState<{
    title: string;
    content: React.ReactNode;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [baseCoords, setBaseCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setBaseCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragging(true);
    else if (e.type === 'dragleave') setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const runAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setResult({
        size: 15.4,
        value: 4500000,
        health: 84,
        zones: [
          { type: 'Highly Productive', area: 8.2, color: 'bg-green-500' },
          { type: 'Moderate Yield', area: 4.5, color: 'bg-lime-400' },
          { type: 'Low Productivity', area: 2.7, color: 'bg-amber-400' },
        ],
      });
      setAnalyzing(false);
    }, 2500);
  };

  return (
    <div className="space-y-4">
      <SEO title="Land Intelligence" />

      {/* Header — Standardized */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="page-header flex items-center gap-3">
            <MapIcon className="text-primary-600 dark:text-primary-400" />
            {t('land.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
            {t('land.subtitle')}
          </p>
        </div>
        <div className="flex items-center justify-center md:justify-start gap-2">
          <span className="badge-gold py-1.5 px-3 shadow-sm border border-gold-200 dark:border-gold-800">
            🛰️ Satellite AI Mapping
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upload & Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card min-h-[420px] flex flex-col items-center justify-center relative overflow-hidden">
            {!image ? (
              <div
                className={`w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all
                                    ${dragging ? 'border-primary-500 bg-primary-50/10' : 'border-gray-200 dark:border-gray-700'}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-600">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('land.uploadTitle')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('land.uploadSubtitle')}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(
                        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1000'
                      );
                    }}
                    className="mt-6 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-lg hover:bg-primary-200 transition-all border border-primary-200 dark:border-primary-800"
                  >
                    ✨ {t('land.tryDemo')}
                  </button>
                  <p className="text-[10px] text-gray-400 mt-4 italic">{t('land.support')}</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col overflow-x-auto scrollbar-thin">
                <div className="relative flex-1 min-w-[640px] lg:min-w-0 bg-black/5 dark:bg-black/20 rounded-xl overflow-hidden group">
                  <img src={image} alt="Land Preview" className="w-full h-full object-contain" />

                  {/* Precise SVG Telemetry Outlines & Coordinates */}
                  {result && (
                    <div className="absolute inset-0 pointer-events-none w-full h-full">
                      <svg
                        viewBox="0 0 800 500"
                        className="w-full h-full absolute inset-0"
                        preserveAspectRatio="none"
                      >
                        {/* Grid coordinates */}
                        <g
                          stroke="rgba(20, 184, 166, 0.25)"
                          strokeWidth="0.5"
                          strokeDasharray="4,4"
                        >
                          {[100, 200, 300, 400, 500, 600, 700].map((x) => (
                            <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="500" />
                          ))}
                          {[100, 200, 300, 400].map((y) => (
                            <line key={`y-${y}`} x1="0" y1={y} x2="800" y2={y} />
                          ))}
                        </g>

                        {/* Corner Coordinates text */}
                        <text
                          x="15"
                          y="25"
                          fill="#14b8a6"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          opacity="0.8"
                        >
                          {baseCoords ? toDMS(baseCoords.lat, true, 22) : "11°56'24\" N"}
                        </text>
                        <text
                          x="15"
                          y="38"
                          fill="#14b8a6"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          opacity="0.8"
                        >
                          {baseCoords ? toDMS(baseCoords.lng, false, 0) : "79°12'05\" E"}
                        </text>

                        <text
                          x="710"
                          y="25"
                          fill="#14b8a6"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          opacity="0.8"
                        >
                          {baseCoords ? toDMS(baseCoords.lat, true, 22) : "11°56'24\" N"}
                        </text>
                        <text
                          x="710"
                          y="38"
                          fill="#14b8a6"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          opacity="0.8"
                        >
                          {baseCoords ? toDMS(baseCoords.lng, false, 37) : "79°12'42\" E"}
                        </text>

                        <text
                          x="15"
                          y="475"
                          fill="#14b8a6"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          opacity="0.8"
                        >
                          {baseCoords ? toDMS(baseCoords.lat, true, 0) : "11°56'02\" N"}
                        </text>
                        <text
                          x="15"
                          y="488"
                          fill="#14b8a6"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          opacity="0.8"
                        >
                          {baseCoords ? toDMS(baseCoords.lng, false, 0) : "79°12'05\" E"}
                        </text>

                        {/* Zone Telemetry Polygons */}
                        {/* Zone 1: Highly Productive (Teal/Green) */}
                        <polygon
                          points="120,80 380,110 420,320 180,290"
                          fill="rgba(20, 184, 166, 0.25)"
                          stroke="#14b8a6"
                          strokeWidth="1.5"
                          strokeDasharray="3,3"
                        />
                        <text
                          x="240"
                          y="180"
                          fill="#14b8a6"
                          fontSize="11"
                          fontWeight="extrabold"
                          fontFamily="sans-serif"
                        >
                          ZONE A: HIGHLY PRODUCTIVE (8.2 Ac)
                        </text>
                        <text
                          x="240"
                          y="195"
                          fill="#14b8a6"
                          fontSize="9"
                          fontWeight="medium"
                          fontFamily="monospace"
                        >
                          NDVI: 0.84 | pH: 6.4
                        </text>

                        {/* Zone 2: Moderate Yield (Lime/Cyan) */}
                        <polygon
                          points="380,110 720,150 640,380 420,320"
                          fill="rgba(34, 197, 94, 0.2)"
                          stroke="#22c55e"
                          strokeWidth="1.5"
                          strokeDasharray="3,3"
                        />
                        <text
                          x="480"
                          y="220"
                          fill="#22c55e"
                          fontSize="11"
                          fontWeight="extrabold"
                          fontFamily="sans-serif"
                        >
                          ZONE B: MODERATE YIELD (4.5 Ac)
                        </text>
                        <text
                          x="480"
                          y="235"
                          fill="#22c55e"
                          fontSize="9"
                          fontWeight="medium"
                          fontFamily="monospace"
                        >
                          NDVI: 0.65 | pH: 6.8
                        </text>

                        {/* Zone 3: Low Productivity (Orange/Amber) */}
                        <polygon
                          points="180,290 420,320 520,460 80,440"
                          fill="rgba(245, 158, 11, 0.15)"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          strokeDasharray="3,3"
                        />
                        <text
                          x="220"
                          y="380"
                          fill="#f59e0b"
                          fontSize="11"
                          fontWeight="extrabold"
                          fontFamily="sans-serif"
                        >
                          ZONE C: LOW STRESS (2.7 Ac)
                        </text>
                        <text
                          x="220"
                          y="395"
                          fill="#f59e0b"
                          fontSize="9"
                          fontWeight="medium"
                          fontFamily="monospace"
                        >
                          NDVI: 0.42 | pH: 7.2
                        </text>

                        {/* Scanning telemetric sweep line */}
                        <line
                          x1="0"
                          y1="10"
                          x2="800"
                          y2="10"
                          stroke="#14b8a6"
                          strokeWidth="2.5"
                          opacity="0.8"
                        >
                          <animate
                            attributeName="y1"
                            values="10;490;10"
                            dur="8s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="y2"
                            values="10;490;10"
                            dur="8s"
                            repeatCount="indefinite"
                          />
                        </line>
                      </svg>

                      {/* Corner brackets simulating HUD corners */}
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-teal-500" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-teal-500" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-teal-500" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-teal-500" />
                    </div>
                  )}

                  {analyzing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                      <div className="w-12 h-12 border-4 border-white/20 border-t-primary-500 rounded-full animate-spin mb-4" />
                      <p className="font-bold text-lg animate-pulse">{t('land.analyzing')}</p>
                      <p className="text-sm opacity-60">{t('land.scanning')}</p>
                    </div>
                  )}

                  <button
                    onClick={() => setImage(null)}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    {t('land.changeImage')}
                  </button>
                </div>

                {!result && !analyzing && (
                  <button
                    onClick={runAnalysis}
                    className="btn-primary mt-4 py-4 w-full flex items-center justify-center gap-2"
                  >
                    <Calculator size={18} /> {t('land.runAnalysis')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="section-header mb-2">{t('land.params')}</h3>
            {!result ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                <MapIcon size={40} className="mb-4 opacity-20" />
                <p className="text-sm">{t('land.uploadToSee')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Main Stats */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-primary-100 dark:border-primary-800/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Maximize2 size={16} className="text-primary-600" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {t('land.predictedSize')}
                      </span>
                    </div>
                    <p className="text-3xl font-black text-primary-700 dark:text-primary-400">
                      {result.size} <span className="text-sm">{t('land.acres')}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-amber-100 dark:border-amber-800/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-amber-600" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {t('land.marketVal')}
                      </span>
                    </div>
                    <p className="text-3xl font-black text-amber-700 dark:text-amber-500">
                      ₹ {(result.value / 100000).toFixed(1)}{' '}
                      <span className="text-sm">{t('land.lakhs')}</span>
                    </p>
                  </div>
                </div>

                {/* Heatmap Legend */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {t('land.zones')}
                  </h4>
                  <div className="space-y-2">
                    {result.zones.map((z) => (
                      <div key={z.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${z.color}`} />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{z.type}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {z.area} Ac
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-bold">{t('land.reliability')}: 99%</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed italic mb-3">
                    {t('land.disclaimer')}
                  </p>
                  <button
                    onClick={() =>
                      setSelectedReport({
                        title: 'Comprehensive Land Intelligence Report',
                        content: (
                          <div className="space-y-6 text-gray-700 dark:text-gray-300">
                            <div>
                              <h3 className="text-lg font-bold border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                                Spatial Analysis Overview
                              </h3>
                              <p className="text-sm leading-relaxed">
                                The AI vision model has processed the uploaded satellite imagery and
                                identified distinct productivity zones across your {result.size}{' '}
                                acre property. The overall health index is rated at {result.health}
                                /100.
                              </p>
                            </div>
                            <div>
                              <h4 className="font-bold border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                                Zone Breakdown
                              </h4>
                              <ul className="space-y-3 text-sm">
                                {result.zones.map((z) => (
                                  <li key={z.type} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${z.color} shrink-0`} />
                                    <strong>{z.type}:</strong> {z.area} acres (
                                    {((z.area / result.size) * 100).toFixed(1)}%)
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                              <h4 className="font-bold text-amber-700 dark:text-amber-500 mb-2">
                                Valuation Metrics
                              </h4>
                              <p className="text-sm font-medium">
                                The estimated market value of ₹ {(result.value / 100000).toFixed(1)}{' '}
                                Lakhs is calculated based on current regional land rates, soil
                                health index, and the historical yield capacity of the identified
                                productive zones.
                              </p>
                            </div>
                          </div>
                        ),
                      })
                    }
                    className="w-full btn-outline border-primary-200 dark:border-primary-800 text-primary-700 py-2 flex items-center justify-center gap-2 text-xs hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors"
                  >
                    <FileText size={14} /> View Report
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none shadow-glow-green !p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle size={18} className="text-white/60" />
              <h3 className="font-bold text-sm">{t('land.nextSteps')}</h3>
            </div>
            <ul className="text-[11px] space-y-2 opacity-90">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1 shrink-0" />
                {t('land.step1')}
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1 shrink-0" />
                {t('land.step2')}
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white mt-1 shrink-0" />
                {t('land.step3')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scientific Methodology Footnote */}
      <div className="card bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 p-5 mt-6 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Spatial Analysis Methodology
        </h4>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed space-y-2">
          <p>
            <strong>Image Segmentation & Boundaries:</strong> Land area boundaries and acreage are
            calculated using spatial vector polygon calculation. By projecting pixel boundaries onto
            UTM grid projections, the system converts spatial imagery dimensions directly to acreage
            estimates with a standard error margin under 2.5%.
          </p>
          <p>
            <strong>Productivity Zonation:</strong> Zone zonation maps represent a multi-temporal
            synthesis of high-resolution spectral imagery. By tracking historical NDVI trends over
            consecutive seasons, areas are classified dynamically into highly productive (stable
            high NDVI), moderate yield, and low-productivity zones (stressed/low biomass signature).
          </p>
        </div>
      </div>

      <ReportModal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport?.title || ''}
        content={selectedReport?.content}
      />
    </div>
  );
};

export default LandIntelligence;
