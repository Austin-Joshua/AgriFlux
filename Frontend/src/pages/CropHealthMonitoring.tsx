import React, { useState } from 'react';
import {
  Activity,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReportModal from '../components/ReportModal';

const NDVI_ZONES = [
  {
    zone: 'Zone A (NW)',
    ndvi: 0.72,
    evi: 0.68,
    status: 'Healthy',
    color: '#22c55e',
    area: '2.1 ha',
  },
  {
    zone: 'Zone B (NE)',
    ndvi: 0.58,
    evi: 0.52,
    status: 'Moderate',
    color: '#f59e0b',
    area: '1.8 ha',
  },
  {
    zone: 'Zone C (SE)',
    ndvi: 0.41,
    evi: 0.38,
    status: 'Stressed',
    color: '#ef4444',
    area: '1.2 ha',
  },
  {
    zone: 'Zone D (SW)',
    ndvi: 0.65,
    evi: 0.61,
    status: 'Healthy',
    color: '#22c55e',
    area: '2.4 ha',
  },
  {
    zone: 'Zone E (Center)',
    ndvi: 0.79,
    evi: 0.74,
    status: 'Excellent',
    color: '#16a34a',
    area: '1.5 ha',
  },
];

const CropHealthMonitoring: React.FC = () => {
  const { t } = useTranslation();
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
    type: 'success' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    content: null,
    type: 'info',
  });

  const avgNDVI = (NDVI_ZONES.reduce((a, z) => a + z.ndvi, 0) / NDVI_ZONES.length).toFixed(2);
  const healthyCount = NDVI_ZONES.filter(
    (z) => z.status === 'Healthy' || z.status === 'Excellent'
  ).length;

  const openReport = (label: string) => {
    let content: React.ReactNode = null;
    let type: 'success' | 'warning' | 'info' = 'info';

    if (label === 'Avg NDVI Score') {
      content = (
        <div className="space-y-4">
          <p>
            Current Average NDVI: <strong>{avgNDVI}</strong>
          </p>
          <p>
            The Normalized Difference Vegetation Index (NDVI) measures the health of vegetation by
            analyzing the difference between near-infrared (which vegetation strongly reflects) and
            red light (which vegetation absorbs).
          </p>
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800">
            <h4 className="font-bold text-primary-700 dark:text-primary-300 mb-2">{t('cropHealthMonitor.aiAnalysis', 'AI Analysis')}</h4>
            <p className="text-sm">
              Your farm's average NDVI is stable. Zone E shows exceptional vitality, while Zone C is
              suppressing the overall average due to localized stress. Automated satellite
              monitoring suggests no large-scale intervention is needed at this time.
            </p>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>
              <strong>{t('cropHealthMonitor.photosyntheticActivity', 'Photosynthetic Activity:')}</strong> High across 70% of the farm.
            </li>
            <li>
              <strong>{t('cropHealthMonitor.biomassDensity', 'Biomass Density:')}</strong> Increasing in NW quadrants.
            </li>
            <li>
              <strong>{t('cropHealthMonitor.nextScan', 'Next Scan:')}</strong> Expected in 48 hours via Sentinel-2.
            </li>
          </ul>
        </div>
      );
      type = 'success';
    } else if (label === 'Healthy Zones') {
      content = (
        <div className="space-y-4">
          <p>
            Healthy Regions:{' '}
            <strong>
              {healthyCount} out of {NDVI_ZONES.length}
            </strong>
          </p>
          <p>
            This metric identifies areas with optimal chlorophyll levels and moisture content.
            Healthy zones are characterized by vigorous growth and a lack of visible spectral
            stress.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
            <h4 className="font-bold text-green-700 dark:text-green-300 mb-2">
              Vegetation Health Report
            </h4>
            <p className="text-sm">
              Consistent growth observed in Zones A, D, and E. These areas have reached the desired
              canopy closure for this stage of the crop cycle. Nutrient uptake remains highly
              efficient in these sectors.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400">{t('cropHealthMonitor.chlorophyllIndex', 'Chlorophyll Index')}</p>
              <p className="font-bold">8.4 ({t('cropHealthMonitor.high', 'High')})</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400">{t('cropHealthMonitor.leafAreaIndex', 'Leaf Area Index')}</p>
              <p className="font-bold">3.2 {t('cropHealthMonitor.lai', 'LAI')}</p>
            </div>
          </div>
        </div>
      );
      type = 'success';
    } else if (label === 'Stress Zones') {
      const stressCount = NDVI_ZONES.filter((z) => z.status === 'Stressed').length;
      content = (
        <div className="space-y-4">
          <p>
            Active Stress Alerts: <strong>{stressCount} Zone Detected</strong>
          </p>
          <p>
            Spectral analysis indicates a drop in near-infrared reflectance in the Southeast sector
            (Zone C). This is often an early indicator of water deficiency or pest pressure before
            it becomes visible to the human eye.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
            <h4 className="font-bold text-red-700 dark:text-red-300 mb-2">
              Critical Action Required
            </h4>
            <p className="text-sm italic">
              "Satellite thermal imaging shows a 2°C increase in canopy temperature in Zone C
              compared to surroundings. Recommend immediate soil moisture check."
            </p>
          </div>
          <div className="p-4 border border-yellow-200 dark:border-yellow-800/50 rounded-xl bg-yellow-50/50 dark:bg-yellow-900/10">
            <h4 className="font-bold text-sm mb-2 text-yellow-700 dark:text-yellow-400">
              {t('cropHealthMonitor.probableCauses', 'Probable Causes:')}
            </h4>
            <ol className="list-decimal pl-5 space-y-1 text-xs">
              <li>{t('cropHealthMonitor.cause1', 'Clogging in drip irrigation emitters (Sector C14).')}</li>
              <li>{t('cropHealthMonitor.cause2', 'Early-stage blast disease (Spectral signature matches).')}</li>
              <li>{t('cropHealthMonitor.cause3', 'Localized soil salinity issues.')}</li>
            </ol>
          </div>
        </div>
      );
      type = 'warning';
    } else if (label === 'Total Farm Area') {
      content = (
        <div className="space-y-4">
          <p>
            {t('cropHealthMonitor.monitoredArea', 'Monitored Area:')} <strong>9.0 {t('cropHealthMonitor.hectares', 'Hectares')} (22.2 {t('cropHealthMonitor.acres', 'Acres')})</strong>
          </p>
          <p>
            Precise boundary mapping ensures that AI analytics are focused strictly on your
            productive assets. Our Geo-fencing is accurate to within 10cm.
          </p>
          <div className="flex flex-col gap-2">
            {NDVI_ZONES.map((z) => (
              <div
                key={z.zone}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="text-xs font-semibold">{z.zone}</span>
                <span className="text-xs text-gray-400">{z.area}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 border-t pt-2 dark:border-gray-700 italic">
            Historical data shows a 0.2 ha increase in productive land usage since last year due to
            wasteland reclamation in the Western boundary.
          </p>
        </div>
      );
      type = 'info';
    }

    setReportModal({
      isOpen: true,
      title: label,
      content,
      type,
    });
  };

  return (
    <div className="space-y-6">
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal((prev) => ({ ...prev, isOpen: false }))}
        title={reportModal.title}
        content={reportModal.content}
        type={reportModal.type}
      />
      {/* Header with Clean Structured Capsules */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div>
          <h1 className="page-header flex items-center gap-3">
            <Activity className="text-primary-600 dark:text-primary-400" />
            {t('cropHealthMonitor.title', 'Satellite Crop Health')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
            {t('cropHealthMonitor.subtitle', 'Precision NDVI & EVI vegetation analytics via satellite vision')}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('cropHealthMonitor.satelliteAiVision', 'Satellite AI Vision')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/50 shadow-sm whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {t('cropHealthMonitor.sentinelCalibration', 'Copernicus Sentinel-2 L2A')}
            </span>
          </div>
        </div>
      </div>

      {/* Crop Health KPI Stat Cards — Symmetrical 4-Column Layout like Dashboard */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 animate-slide-up-fade"
        style={{ animationDelay: '100ms' }}
      >
        <div
          onClick={() => openReport('Avg NDVI Score')}
          className="card-clickable group border-b-2 border-transparent hover:border-primary-500 p-3 sm:p-4 md:p-5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 md:[&>svg]:w-[22px] md:[&>svg]:h-[22px]">
              <Leaf className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col items-end gap-0.5 min-w-0">
              <span className="flex items-center justify-end gap-0.5 text-[11px] sm:text-xs md:text-sm font-bold tracking-tight text-right text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">{t('cropHealthMonitor.optimalRange', 'Optimal')}</span>
              </span>
              <span className="hidden sm:flex text-[9px] md:text-[10px] text-gray-400 group-hover:text-primary-500 items-center gap-0.5 transition-colors duration-200">
                {t('common.viewDetails', 'View details')} <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">
            {t('cropHealthMonitor.avgNdviScore', 'Avg NDVI Score')}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display truncate">
            {avgNDVI}
          </p>
        </div>

        <div
          onClick={() => openReport('Healthy Zones')}
          className="card-clickable group border-b-2 border-transparent hover:border-primary-500 p-3 sm:p-4 md:p-5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 md:[&>svg]:w-[22px] md:[&>svg]:h-[22px]">
              <CheckCircle2 className="text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex flex-col items-end gap-0.5 min-w-0">
              <span className="flex items-center justify-end gap-0.5 text-[11px] sm:text-xs md:text-sm font-bold tracking-tight text-right text-primary-600 dark:text-primary-400">
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">{Math.round((healthyCount / NDVI_ZONES.length) * 100)}% {t('cropHealthMonitor.healthy', 'Healthy')}</span>
              </span>
              <span className="hidden sm:flex text-[9px] md:text-[10px] text-gray-400 group-hover:text-primary-500 items-center gap-0.5 transition-colors duration-200">
                {t('common.viewDetails', 'View details')} <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">
            {t('cropHealthMonitor.fieldHealth', 'Field Health')}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-display truncate">
            {healthyCount}/{NDVI_ZONES.length} {t('cropHealthMonitor.zones', 'Zones')}
          </p>
        </div>

        <div
          onClick={() => openReport('Stress Zones')}
          className="card-clickable group border-b-2 border-transparent hover:border-amber-500 p-3 sm:p-4 md:p-5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 md:[&>svg]:w-[22px] md:[&>svg]:h-[22px]">
              <AlertTriangle className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex flex-col items-end gap-0.5 min-w-0">
              <span className="flex items-center justify-end gap-0.5 text-[11px] sm:text-xs md:text-sm font-bold tracking-tight text-right text-amber-600 dark:text-amber-400">
                <span className="truncate">{t('cropHealthMonitor.zoneCAlert', 'Zone C Alert')}</span>
              </span>
              <span className="hidden sm:flex text-[9px] md:text-[10px] text-gray-400 group-hover:text-amber-500 items-center gap-0.5 transition-colors duration-200">
                {t('common.viewDetails', 'View details')} <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">
            {t('cropHealthMonitor.stressAlert', 'Stress Alert')}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400 font-display truncate">
            {NDVI_ZONES.filter((z) => z.status === 'Stressed').length} {t('cropHealthMonitor.zoneStressed', 'Zone Stressed')}
          </p>
        </div>

        <div
          onClick={() => openReport('Total Farm Area')}
          className="card-clickable group border-b-2 border-transparent hover:border-blue-500 p-3 sm:p-4 md:p-5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5 md:[&>svg]:w-[22px] md:[&>svg]:h-[22px]">
              <Layers className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col items-end gap-0.5 min-w-0">
              <span className="flex items-center justify-end gap-0.5 text-[11px] sm:text-xs md:text-sm font-bold tracking-tight text-right text-blue-600 dark:text-blue-400">
                <span className="truncate">22.2 {t('cropHealthMonitor.acres', 'Acres')}</span>
              </span>
              <span className="hidden sm:flex text-[9px] md:text-[10px] text-gray-400 group-hover:text-blue-500 items-center gap-0.5 transition-colors duration-200">
                {t('common.viewDetails', 'View details')} <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">
            {t('cropHealthMonitor.monitoredArea', 'Monitored Area')}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 font-display truncate">
            9.0 ha
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Simulated Farm Map */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-header">{t('cropHealthMonitor.farmVegetationMap', 'Farm Vegetation Map')}</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-primary-700 inline-block" />
                {t('cropHealthMonitor.excellent', 'Excellent')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-primary-400 inline-block" />
                {t('cropHealthMonitor.good', 'Good')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-400 inline-block" />
                {t('cropHealthMonitor.moderate', 'Moderate')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-400 inline-block" />
                {t('cropHealthMonitor.stressed', 'Stressed')}
              </span>
            </div>
          </div>

          {/* SVG Farm Heatmap */}
          <div className="relative w-full h-[60vh] min-h-[400px] bg-slate-950 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
            <svg viewBox="0 0 400 280" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid system */}
              <g stroke="rgba(20, 184, 166, 0.15)" strokeWidth="0.5" strokeDasharray="3,3">
                {[50, 100, 150, 200, 250, 300, 350].map((x) => (
                  <line key={`map-x-${x}`} x1={x} y1="0" x2={x} y2="280" />
                ))}
                {[50, 100, 150, 200, 250].map((y) => (
                  <line key={`map-y-${y}`} x1="0" y1={y} x2="400" y2={y} />
                ))}
              </g>

              {/* Coordinate ticks */}
              <text x="5" y="12" fill="#14b8a6" fontSize="6" fontFamily="monospace" opacity="0.6">
                11°56'24" N | 79°12'05" E
              </text>
              <text x="310" y="12" fill="#14b8a6" fontSize="6" fontFamily="monospace" opacity="0.6">
                11°56'24" N | 79°12'42" E
              </text>
              <text x="5" y="275" fill="#14b8a6" fontSize="6" fontFamily="monospace" opacity="0.6">
                11°56'02" N | 79°12'05" E
              </text>
              <text
                x="310"
                y="275"
                fill="#14b8a6"
                fontSize="6"
                fontFamily="monospace"
                opacity="0.6"
              >
                11°56'02" N | 79°12'42" E
              </text>

              {/* Irregular Zones */}
              {/* Zone A (NW) */}
              <polygon
                points="15,20 175,15 190,120 10,105"
                fill="#22c55e"
                fillOpacity={selectedZone === 0 ? '0.6' : '0.35'}
                stroke="#22c55e"
                strokeWidth={selectedZone === 0 ? '2' : '1'}
                className="cursor-pointer transition-all duration-200 hover:fill-opacity-50"
                onClick={() => setSelectedZone(0)}
              />
              <text
                x="90"
                y="65"
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="bold"
                opacity="0.9"
              >
                Zone A
              </text>
              <text x="90" y="75" textAnchor="middle" fill="white" fontSize="7" opacity="0.7">
                NDVI: 0.72
              </text>

              {/* Zone B (NE) */}
              <polygon
                points="215,25 385,15 375,125 200,120"
                fill="#f59e0b"
                fillOpacity={selectedZone === 1 ? '0.6' : '0.35'}
                stroke="#f59e0b"
                strokeWidth={selectedZone === 1 ? '2' : '1'}
                className="cursor-pointer transition-all duration-200 hover:fill-opacity-50"
                onClick={() => setSelectedZone(1)}
              />
              <text
                x="290"
                y="65"
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="bold"
                opacity="0.9"
              >
                Zone B
              </text>
              <text x="290" y="75" textAnchor="middle" fill="white" fontSize="7" opacity="0.7">
                NDVI: 0.58
              </text>

              {/* Zone C (SE) */}
              <polygon
                points="205,135 380,140 390,260 215,255"
                fill="#ef4444"
                fillOpacity={selectedZone === 2 ? '0.6' : '0.35'}
                stroke="#ef4444"
                strokeWidth={selectedZone === 2 ? '2' : '1'}
                className="cursor-pointer transition-all duration-200 hover:fill-opacity-50"
                onClick={() => setSelectedZone(2)}
              />
              <text
                x="295"
                y="200"
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="bold"
                opacity="0.9"
              >
                Zone C
              </text>
              <text x="295" y="210" textAnchor="middle" fill="white" fontSize="7" opacity="0.7">
                NDVI: 0.41
              </text>

              {/* Zone D (SW) */}
              <polygon
                points="10,120 185,130 195,250 20,260"
                fill="#22c55e"
                fillOpacity={selectedZone === 3 ? '0.6' : '0.35'}
                stroke="#22c55e"
                strokeWidth={selectedZone === 3 ? '2' : '1'}
                className="cursor-pointer transition-all duration-200 hover:fill-opacity-50"
                onClick={() => setSelectedZone(3)}
              />
              <text
                x="100"
                y="190"
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="bold"
                opacity="0.9"
              >
                Zone D
              </text>
              <text x="100" y="200" textAnchor="middle" fill="white" fontSize="7" opacity="0.7">
                NDVI: 0.65
              </text>

              {/* Zone E (Center) */}
              <polygon
                points="120,80 270,90 280,180 130,175"
                fill="#16a34a"
                fillOpacity={selectedZone === 4 ? '0.65' : '0.4'}
                stroke="#16a34a"
                strokeWidth={selectedZone === 4 ? '2' : '1'}
                className="cursor-pointer transition-all duration-200 hover:fill-opacity-50"
                onClick={() => setSelectedZone(4)}
              />
              <text
                x="200"
                y="130"
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="bold"
                opacity="0.9"
              >
                Zone E
              </text>
              <text x="200" y="140" textAnchor="middle" fill="white" fontSize="7" opacity="0.7">
                NDVI: 0.79
              </text>
            </svg>

            {/* Corner HUD overlays */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-teal-500/60" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-teal-500/60" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-teal-500/60" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-teal-500/60" />

            {/* HUD Scanning line */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-500/80 to-transparent pointer-events-none animate-scan-line"
              style={{
                animation: 'scan-line 6s linear infinite',
              }}
            />

            {/* Legend */}
            <div className="absolute bottom-2 right-3 text-[9px] font-black uppercase tracking-widest text-teal-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-teal-500/30 backdrop-blur-sm">
              {t('cropHealthMonitor.telemetricScanActive', 'Telemetric Scan Active')}
            </div>
            <div className="absolute bottom-2 left-3 text-[9px] font-bold text-gray-400">
              {t('cropHealthMonitor.clickZonesForDetails', 'Click zones for details')}
            </div>
          </div>
        </div>

        {/* Zone Details */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="section-header">{t('cropHealthMonitor.zoneAnalysis', 'Zone Analysis')}</h3>
          {NDVI_ZONES.map((zone, i) => (
            <div
              key={zone.zone}
              onClick={() => setSelectedZone(selectedZone === i ? null : i)}
              className={`card p-4 cursor-pointer transition-all ${selectedZone === i ? 'ring-2 ring-primary-500' : 'hover:shadow-md'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {zone.zone}
                  </span>
                </div>
                <span
                  className={`badge ${zone.status === 'Healthy' || zone.status === 'Excellent' ? 'badge-green' : zone.status === 'Moderate' ? 'badge-yellow' : 'badge-red'}`}
                >
                  {zone.status === 'Healthy'
                    ? t('cropHealthMonitor.healthy', 'Healthy')
                    : zone.status === 'Moderate'
                      ? t('cropHealthMonitor.moderate', 'Moderate')
                      : zone.status === 'Stressed'
                        ? t('cropHealthMonitor.stressed', 'Stressed')
                        : zone.status}
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
                  <p className="text-gray-500 dark:text-gray-400">{t('cropHealthMonitor.area', 'Area')}</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{zone.area}</p>
                </div>
              </div>
              {selectedZone === i && zone.status === 'Stressed' && (
                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-600 dark:text-red-400">
                  {t('cropHealthMonitor.interventionNeeded', '⚠️ Intervention needed: Possible water stress or pest infestation. Recommend field inspection.')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Footnotes & Data Source Disclaimer */}
      <div className="card bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 p-5 mt-6 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {t('cropHealthMonitor.methodology', 'Scientific Methodology & Data Sources')}
        </h4>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed space-y-2">
          <p>
            <strong>{t('cropHealthMonitor.dataSource', 'Data Source:')}</strong> {t('cropHealthMonitor.dataSourceDesc', 'Remote sensing spectral data is retrieved from the Copernicus Sentinel-2 satellite constellation at a spatial resolution of 10 meters, with a 5-day revisit cycle. Ground-level validation is synced with our local IoT soil moisture arrays.')}
          </p>
          <p>
            <strong>{t('cropHealthMonitor.vegetationIndicesFormulae', 'Vegetation Indices Formulae:')}</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>{t('cropHealthMonitor.ndviFull', 'Normalized Difference Vegetation Index (NDVI):')}</strong>{' '}
              <code className="bg-gray-100 dark:bg-gray-800/60 px-1 py-0.5 rounded font-mono text-primary-600 dark:text-primary-400">
                NDVI = (NIR - Red) / (NIR + Red)
              </code>
              . {t('cropHealthMonitor.ndviFormulaDesc', 'Used to estimate vegetation health, density, and chlorophyll concentration.')}
            </li>
            <li>
              <strong>{t('cropHealthMonitor.eviFull', 'Enhanced Vegetation Index (EVI):')}</strong>{' '}
              <code className="bg-gray-100 dark:bg-gray-800/60 px-1 py-0.5 rounded font-mono text-primary-600 dark:text-primary-400">
                EVI = 2.5 * ((NIR - Red) / (NIR + 6 * Red - 7.5 * Blue + 1))
              </code>
              . {t('cropHealthMonitor.eviFormulaDesc', 'Optimized to reduce soil background and atmospheric scatter in high biomass density plots.')}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CropHealthMonitoring;
