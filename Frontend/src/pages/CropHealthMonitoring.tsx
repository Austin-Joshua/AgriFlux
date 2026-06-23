import React, { useState } from 'react';
import { Activity } from 'lucide-react';
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
            <h4 className="font-bold text-primary-700 dark:text-primary-300 mb-2">AI Analysis</h4>
            <p className="text-sm">
              Your farm's average NDVI is stable. Zone E shows exceptional vitality, while Zone C is
              suppressing the overall average due to localized stress. Automated satellite
              monitoring suggests no large-scale intervention is needed at this time.
            </p>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>
              <strong>Photosynthetic Activity:</strong> High across 70% of the farm.
            </li>
            <li>
              <strong>Biomass Density:</strong> Increasing in NW quadrants.
            </li>
            <li>
              <strong>Next Scan:</strong> Expected in 48 hours via Sentinel-2.
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
              <p className="text-xs text-gray-400">Chlorophyll Index</p>
              <p className="font-bold">8.4 (High)</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400">Leaf Area Index</p>
              <p className="font-bold">3.2 LAI</p>
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
              Probable Causes:
            </h4>
            <ol className="list-decimal pl-5 space-y-1 text-xs">
              <li>Clogging in drip irrigation emitters (Sector C14).</li>
              <li>Early-stage blast disease (Spectral signature matches).</li>
              <li>Localized soil salinity issues.</li>
            </ol>
          </div>
        </div>
      );
      type = 'warning';
    } else if (label === 'Total Farm Area') {
      content = (
        <div className="space-y-4">
          <p>
            Monitored Area: <strong>9.0 Hectares (22.2 Acres)</strong>
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
      {/* Header — Standardized */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="page-header flex items-center gap-3">
            <Activity className="text-primary-600 dark:text-primary-400" />
            Satellite Crop Health
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
            Precision NDVI & EVI vegetation analytics via satellite vision
          </p>
        </div>
        <div className="flex items-center justify-center md:justify-start gap-2">
          <span className="badge-gold py-1.5 px-3 shadow-sm border border-gold-200 dark:border-gold-800">
            🛰️ Satellite AI Vision
          </span>
        </div>
      </div>

      {/* Summary Cards — Standardized to 3-column */}
      <div className="standard-grid">
        {[
          {
            label: 'Avg NDVI Score',
            value: avgNDVI,
            color: 'text-primary-600',
            bg: 'glass-gold border-gold-200',
            icon: '🌿',
          },
          {
            label: 'Field Health',
            value: `${healthyCount}/${NDVI_ZONES.length} Healthy`,
            color: 'text-primary-600',
            bg: 'bg-primary-50 dark:bg-primary-900/20',
            icon: '✅',
          },
          {
            label: 'Total Farm Area',
            value: '9.0 ha',
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            icon: '🗺️',
          },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() => openReport(s.label === 'Field Health' ? 'Healthy Zones' : s.label)}
            className={`card !p-6 transition-all hover:scale-[1.02] hover:shadow-2xl duration-300 cursor-pointer group active:scale-95 ${s.bg}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-3xl group-hover:rotate-12 transition-transform">{s.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary-500 transition-colors">
                Analytical Report
              </span>
            </div>
            <p className={`text-3xl font-black mt-4 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Simulated Farm Map */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-header">Farm Vegetation Map</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-primary-700 inline-block" />
                Excellent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-primary-400 inline-block" />
                Good
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-400 inline-block" />
                Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-400 inline-block" />
                Stressed
              </span>
            </div>
          </div>

          {/* SVG Farm Heatmap */}
          <div className="relative w-full h-80 bg-slate-950 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
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
              Telemetric Scan Active
            </div>
            <div className="absolute bottom-2 left-3 text-[9px] font-bold text-gray-400">
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
                  ⚠️ Intervention needed: Possible water stress or pest infestation. Recommend field
                  inspection.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Footnotes & Data Source Disclaimer */}
      <div className="card bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 p-5 mt-6 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Scientific Methodology & Data Sources
        </h4>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed space-y-2">
          <p>
            <strong>Data Source:</strong> Remote sensing spectral data is retrieved from the
            Copernicus Sentinel-2 satellite constellation at a spatial resolution of 10 meters, with
            a 5-day revisit cycle. Ground-level validation is synced with our local IoT soil
            moisture arrays.
          </p>
          <p>
            <strong>Vegetation Indices Formulae:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Normalized Difference Vegetation Index (NDVI):</strong>{' '}
              <code className="bg-gray-100 dark:bg-gray-800/60 px-1 py-0.5 rounded font-mono text-primary-600 dark:text-primary-400">
                NDVI = (NIR - Red) / (NIR + Red)
              </code>
              . Used to estimate vegetation health, density, and chlorophyll concentration.
            </li>
            <li>
              <strong>Enhanced Vegetation Index (EVI):</strong>{' '}
              <code className="bg-gray-100 dark:bg-gray-800/60 px-1 py-0.5 rounded font-mono text-primary-600 dark:text-primary-400">
                EVI = 2.5 * ((NIR - Red) / (NIR + 6 * Red - 7.5 * Blue + 1))
              </code>
              . Optimized to reduce soil background and atmospheric scatter in high biomass density
              plots.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CropHealthMonitoring;
