import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  CloudRain,
  Sun,
  Thermometer,
  Satellite,
  Calendar,
  Loader,
  RefreshCw,
  AlertTriangle,
  Compass,
  FileSpreadsheet,
  CheckCircle2,
  FlaskConical,
  Sprout,
  BookOpen,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
} from 'recharts';
import { API_URL } from '../config';

interface WeatherObservation {
  dateStr: string;
  timestamp: string;
  temperature?: {
    mean?: number;
    min?: number;
    max?: number;
    instantaneous?: number;
  };
  relativeHumidityPct?: number;
  precipitationMm?: number;
  et0EvapotranspirationMm?: number;
  granularity: 'daily' | 'hourly';
  status: 'observed' | 'estimated' | 'interpolated';
}

interface SatelliteObservationItem {
  _id?: string;
  regionName: string;
  tileId: string;
  productIdentifier: string;
  acquisitionDate: string;
  spatialResolutionMeters: number;
  ndvi: {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
  };
  cloudCoveragePercentage: number;
  validPixelPercentage: number;
  vegetationHealth: string;
  status: string;
}

interface SatelliteResponse {
  isDataAvailable: boolean;
  message?: string;
  targetRegion?: string;
  requiredBands?: string[];
  data: SatelliteObservationItem[];
}

interface SoilProfileData {
  regionName: string;
  sampleDate: string;
  samplingDepthCm: { top: number; bottom: number };
  sampleId: string;
  testMethod: string;
  source: string;
  laboratoryName: string;
  ph: number;
  electricalConductivityDsm: number;
  organicCarbonPct: number;
  availableNitrogenKgHa: number;
  availablePhosphorusKgHa: number;
  availablePotassiumKgHa: number;
  soilTexture: string;
  fertilityRating: string;
  status: string;
}

interface APYRecord {
  state: string;
  district: string;
  crop: string;
  season: string;
  agriculturalYear: string;
  areaHectares: number;
  productionTonnes: number;
  yieldTonnePerHectare: number;
  yieldKgPerHectare: number;
  source: string;
  verificationStatus: string;
}

interface VariableRegistryItem {
  canonicalName: string;
  displayLabel: string;
  category: string;
  unit: string;
  sourceType: string;
  primarySource: string;
  spatialResolution: string;
  temporalResolution: string;
  validationRange: { min: number; max: number };
  safeForActuatorCoupling: boolean;
  safeForRecommendation: boolean;
  description: string;
}

const EnvironmentalIntelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'weather' | 'satellite' | 'soil' | 'apy' | 'registry'>(
    'weather'
  );
  const [weatherGranularity, setWeatherGranularity] = useState<'daily' | 'hourly'>('daily');
  const [timeRangeDays, setTimeRangeDays] = useState<number>(14);

  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherObservation[]>([]);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(true);

  // Satellite state
  const [satelliteData, setSatelliteData] = useState<SatelliteResponse | null>(null);
  const [loadingSatellite, setLoadingSatellite] = useState<boolean>(true);

  // Soil state
  const [soilProfile, setSoilProfile] = useState<SoilProfileData | null>(null);
  const [loadingSoil, setLoadingSoil] = useState<boolean>(false);

  // Crop APY state
  const [apyRecords, setApyRecords] = useState<APYRecord[]>([]);
  const [loadingApy, setLoadingApy] = useState<boolean>(false);

  // Registry state
  const [registryItems, setRegistryItems] = useState<Record<string, VariableRegistryItem>>({});
  const [loadingRegistry, setLoadingRegistry] = useState<boolean>(false);

  // 1. Fetch Historical Weather Observations
  const fetchWeather = useCallback(async () => {
    setLoadingWeather(true);
    try {
      const response = await axios.get(`${API_URL}/environmental/weather`, {
        params: {
          granularity: weatherGranularity,
          limit: weatherGranularity === 'daily' ? timeRangeDays : timeRangeDays * 24,
        },
      });

      if (response.data?.success) {
        setWeatherData(response.data.data || []);
      }
    } catch (err: unknown) {
      console.warn('Weather data fetch note:', (err as Error).message);
    } finally {
      setLoadingWeather(false);
    }
  }, [weatherGranularity, timeRangeDays]);

  // 2. Fetch Sentinel-2 Satellite NDVI Observations
  const fetchSatellite = useCallback(async () => {
    setLoadingSatellite(true);
    try {
      const response = await axios.get(`${API_URL}/environmental/satellite/ndvi`);
      if (response.data?.success) {
        setSatelliteData(response.data);
      }
    } catch (err: unknown) {
      console.warn('Satellite data fetch note:', (err as Error).message);
    } finally {
      setLoadingSatellite(false);
    }
  }, []);

  // 3. Fetch Soil Profile
  const fetchSoil = useCallback(async () => {
    setLoadingSoil(true);
    try {
      const response = await axios.get(`${API_URL}/environmental/soil`);
      if (response.data?.success && response.data.data) {
        setSoilProfile(response.data.data);
      }
    } catch (err: unknown) {
      console.warn('Soil fetch note:', (err as Error).message);
    } finally {
      setLoadingSoil(false);
    }
  }, []);

  // 4. Fetch Crop Production Statistics (DES APY)
  const fetchApy = useCallback(async () => {
    setLoadingApy(true);
    try {
      const response = await axios.get(`${API_URL}/environmental/crop-statistics`);
      if (response.data?.success) {
        setApyRecords(response.data.data || []);
      }
    } catch (err: unknown) {
      console.warn('APY fetch note:', (err as Error).message);
    } finally {
      setLoadingApy(false);
    }
  }, []);

  // 5. Fetch Canonical Environmental Registry
  const fetchRegistry = useCallback(async () => {
    setLoadingRegistry(true);
    try {
      const response = await axios.get(`${API_URL}/environmental/registry`);
      if (response.data?.success) {
        setRegistryItems(response.data.registry || {});
      }
    } catch (err: unknown) {
      console.warn('Registry fetch note:', (err as Error).message);
    } finally {
      setLoadingRegistry(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  useEffect(() => {
    fetchSatellite();
  }, [fetchSatellite]);

  const registryCount = Object.keys(registryItems).length;
  const apyCount = apyRecords.length;

  useEffect(() => {
    if (activeTab === 'soil' && !soilProfile) fetchSoil();
    if (activeTab === 'apy' && apyCount === 0) fetchApy();
    if (activeTab === 'registry' && registryCount === 0) fetchRegistry();
  }, [activeTab, soilProfile, apyCount, registryCount, fetchSoil, fetchApy, fetchRegistry]);

  // Prepare chart data (reverse so chronological left-to-right)
  const chartPoints = React.useMemo(() => {
    const list = [...weatherData].reverse();
    return list.map((item) => {
      const label =
        weatherGranularity === 'daily'
          ? item.dateStr.slice(5) // MM-DD
          : item.dateStr.slice(11, 16); // HH:MM

      return {
        dateStr: item.dateStr,
        displayDate: label,
        meanTemp: item.temperature?.mean ?? item.temperature?.instantaneous ?? null,
        minTemp: item.temperature?.min ?? null,
        maxTemp: item.temperature?.max ?? null,
        rain: item.precipitationMm ?? 0,
        et0: item.et0EvapotranspirationMm ?? 0,
      };
    });
  }, [weatherData, weatherGranularity]);

  // Weather metrics summary
  const weatherSummary = React.useMemo(() => {
    if (weatherData.length === 0) return null;
    let tempSum = 0;
    let tempCount = 0;
    let rainSum = 0;
    let et0Sum = 0;

    for (const row of weatherData) {
      const t = row.temperature?.mean ?? row.temperature?.instantaneous;
      if (typeof t === 'number') {
        tempSum += t;
        tempCount++;
      }
      if (typeof row.precipitationMm === 'number') rainSum += row.precipitationMm;
      if (typeof row.et0EvapotranspirationMm === 'number') et0Sum += row.et0EvapotranspirationMm;
    }

    return {
      avgTemp: tempCount > 0 ? (tempSum / tempCount).toFixed(1) : '--',
      totalRain: rainSum.toFixed(1),
      totalET0: et0Sum.toFixed(1),
      observationsCount: weatherData.length,
    };
  }, [weatherData]);

  return (
    <div className="card overflow-hidden">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="section-header !mb-0 text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Environmental & Agronomic Intelligence Hub
            </h3>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5 flex items-center gap-1.5">
            <Compass size={12} className="text-primary-500" />
            Thanjavur Pilot Region (10.79°N, 79.10°E · 59m elev. · Cauvery Delta)
          </p>
        </div>

        {/* 5-Tab Multi-Source Navigation */}
        <div className="flex flex-wrap items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'weather'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <CloudRain size={13} />
            Open-Meteo Weather
          </button>
          <button
            onClick={() => setActiveTab('satellite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'satellite'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Satellite size={13} />
            Copernicus Sentinel-2
          </button>
          <button
            onClick={() => setActiveTab('soil')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'soil'
                ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <FlaskConical size={13} />
            Regional Soil Benchmark
          </button>
          <button
            onClick={() => setActiveTab('apy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'apy'
                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Sprout size={13} />
            DES Crop Statistics
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'registry'
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <BookOpen size={13} />
            Variable Registry
          </button>
        </div>
      </div>

      {/* TAB 1: HISTORICAL WEATHER TIME SERIES */}
      {activeTab === 'weather' && (
        <div className="pt-4 space-y-4">
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <FileSpreadsheet size={15} className="text-blue-600 shrink-0" />
              <span>
                <strong>Data Provenance:</strong> Open-Meteo ERA5-Land Reanalysis (2021–2026).
                Values are <em>historical model estimates</em>, distinct from direct capacitive IoT
                soil probes.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium text-[11px]">
                Status: Verified Reanalysis
              </span>
              <button
                onClick={fetchWeather}
                title="Refresh observations"
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <RefreshCw size={13} className={loadingWeather ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Metric Summary Cards */}
          {weatherSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium">
                  <Thermometer size={14} className="text-amber-500" />
                  Mean Temp
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-gray-900 dark:text-white">
                    {weatherSummary.avgTemp}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">°C</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">ERA5 2m ambient</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium">
                  <CloudRain size={14} className="text-blue-500" />
                  Precipitation
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                    {weatherSummary.totalRain}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">mm</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">Cumulative rainfall</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium">
                  <Sun size={14} className="text-orange-500" />
                  FAO-56 ET₀
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                    {weatherSummary.totalET0}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">mm</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">Evapotranspiration</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium">
                  <Calendar size={14} className="text-primary-500" />
                  Timeline
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-black text-gray-900 dark:text-white">
                    {weatherSummary.observationsCount}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">pts</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                  {weatherGranularity} series
                </span>
              </div>
            </div>
          )}

          {/* Granularity & Time Range Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Range:</span>
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setTimeRangeDays(days)}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                    timeRangeDays === days
                      ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Mode:</span>
              <button
                onClick={() => setWeatherGranularity('daily')}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                  weatherGranularity === 'daily'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                Daily Summary
              </button>
              <button
                onClick={() => setWeatherGranularity('hourly')}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                  weatherGranularity === 'hourly'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                }`}
              >
                Hourly Continuous
              </button>
            </div>
          </div>

          {/* Recharts Dual-Axis Chart */}
          <div className="p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800/80">
            {loadingWeather ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader className="animate-spin text-primary-500" size={24} />
                <span className="text-xs">Loading Thanjavur weather reanalysis...</span>
              </div>
            ) : chartPoints.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-gray-400">
                <AlertTriangle size={24} className="text-amber-500" />
                <span className="text-xs">
                  No weather records loaded yet. Run `npm run ingest:weather` in Backend.
                </span>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartPoints}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="weatherTempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="weatherRainGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      className="dark:opacity-10"
                    />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis
                      yAxisId="left"
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      unit="°"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 'auto']}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      unit="mm"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                        fontSize: 12,
                        backgroundColor: '#1f2937',
                        color: '#f9fafb',
                      }}
                      formatter={(val: unknown, name: unknown) => {
                        const nameStr = String(name);
                        if (nameStr === 'Temperature') return [`${val} °C`, nameStr];
                        if (nameStr === 'Rainfall') return [`${val} mm`, nameStr];
                        if (nameStr === 'ET0') return [`${val} mm`, nameStr];
                        return [String(val), nameStr];
                      }}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="rain"
                      name="Rainfall"
                      fill="url(#weatherRainGrad)"
                      barSize={12}
                      radius={[4, 4, 0, 0]}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="meanTemp"
                      name="Temperature"
                      stroke="#f59e0b"
                      fill="url(#weatherTempGrad)"
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SENTINEL-2 L2A SATELLITE NDVI */}
      {activeTab === 'satellite' && (
        <div className="pt-4 space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Satellite size={15} className="text-emerald-600 shrink-0" />
              <span>
                <strong>Copernicus Sentinel-2 MSI (Level-2A):</strong> Tile T44NPM · 10m Spatial
                Resolution. NDVI computed as (B08 - B04) / (B08 + B04) with SCL cloud masking.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] shrink-0">
              Orbital Spectral Index
            </span>
          </div>

          {loadingSatellite ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader className="animate-spin text-blue-500" size={24} />
              <span className="text-xs">Checking Copernicus satellite observations...</span>
            </div>
          ) : satelliteData &&
            satelliteData.isDataAvailable &&
            satelliteData.data &&
            satelliteData.data.length > 0 ? (
            <div className="space-y-4">
              {satelliteData.data.map((obs, idx) => (
                <div
                  key={obs._id || idx}
                  className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                          {obs.regionName}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 uppercase">
                          {obs.vegetationHealth.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate max-w-md">
                        {obs.productIdentifier}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">Acquisition:</span>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {new Date(obs.acquisitionDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Mean NDVI
                      </span>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {obs.ndvi.mean.toFixed(2)}
                      </p>
                      <span className="text-[10px] text-gray-400">Vigor scale 0.0 - 1.0</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        NDVI Range
                      </span>
                      <p className="text-lg font-black text-gray-900 dark:text-white">
                        {obs.ndvi.min.toFixed(2)} - {obs.ndvi.max.toFixed(2)}
                      </p>
                      <span className="text-[10px] text-gray-400">
                        StdDev: ±{obs.ndvi.stdDev.toFixed(2)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Cloud Cover
                      </span>
                      <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                        {obs.cloudCoveragePercentage}%
                      </p>
                      <span className="text-[10px] text-gray-400">SCL filter applied</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Spatial Res
                      </span>
                      <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                        {obs.spatialResolutionMeters}m
                      </p>
                      <span className="text-[10px] text-gray-400">Ground pixel size</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-gray-50/60 dark:bg-gray-900/40 border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Satellite size={24} />
              </div>

              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Satellite data not connected
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  No genuine Copernicus Sentinel-2 Level-2A raster product is connected for the
                  Thanjavur pilot area. AgriFlux enforces strict scientific integrity and does not
                  fabricate synthetic satellite observations. The processing pipeline is initialized
                  and ready for orbital raster ingestion when high-resolution imagery is connected.
                  The rest of AgriFlux remains fully operational without satellite connectivity.
                </p>
              </div>

              <div className="max-w-lg mx-auto p-3 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 text-left text-xs space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Processing Pipeline Requirements:
                </span>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 size={13} className="text-primary-500 shrink-0" />
                  <span>Band 04 (Red, 665nm) at 10m spatial resolution</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 size={13} className="text-primary-500 shrink-0" />
                  <span>Band 08 (Near-Infrared, 842nm) at 10m spatial resolution</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 size={13} className="text-primary-500 shrink-0" />
                  <span>Scene Classification Layer (SCL) for cloud/cirrus/shadow masking</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 size={13} className="text-primary-500 shrink-0" />
                  <span>Geographic Target: Tile T44NPM (Cauvery Delta Basin)</span>
                </div>
              </div>

              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 shadow-sm">
                  <Satellite size={13} className="text-blue-500" />
                  Multispectral Ingestion Pipeline Ready (Awaiting L2A Raster Link)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGIONAL SOIL BENCHMARK */}
      {activeTab === 'soil' && (
        <div className="pt-4 space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <FlaskConical size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Regional Soil Benchmark (0–15 cm depth):</strong> Agro-ecological profile
                based on published ICAR-TNAU Cauvery Delta regional soil surveys.
                <strong>
                  {' '}
                  Illustrative benchmark only — NOT an in-situ certified measurement of an
                  individual farm boundary.
                </strong>
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-[10px] tracking-wide uppercase shrink-0">
              Illustrative Regional Benchmark
            </span>
          </div>

          {loadingSoil ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader className="animate-spin text-amber-500" size={24} />
              <span className="text-xs">Loading soil profile...</span>
            </div>
          ) : soilProfile ? (
            <div className="space-y-4">
              {/* Benchmark Disclaimer Alert */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Provenance Note:</strong> This profile reflects published ICAR-TNAU
                  regional classification data for Thanjavur alluvial delta soils (pH 6.4, low
                  available N). For operational field recommendations, an actual certified farm Soil
                  Health Card must be uploaded.
                </p>
              </div>

              {/* Soil Overview Header */}
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                      {soilProfile.regionName}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 uppercase">
                      {soilProfile.fertilityRating} Fertility
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 uppercase">
                      Regional Benchmark
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Sample ID: <strong>{soilProfile.sampleId}</strong> · Sampling Depth: 0–15 cm ·
                    Texture: <strong>{soilProfile.soilTexture}</strong>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-gray-400 block">
                    Regional Survey Authority:
                  </span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {soilProfile.laboratoryName}
                  </span>
                </div>
              </div>

              {/* Soil Chemistry KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                    Soil pH
                  </span>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {soilProfile.ph}
                  </p>
                  <span className="text-[10px] text-gray-400">Slightly Acidic (Rice)</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                    Salinity (EC)
                  </span>
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {soilProfile.electricalConductivityDsm}
                  </p>
                  <span className="text-[10px] text-gray-400">dS/m (Non-saline)</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                    Organic Carbon
                  </span>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {soilProfile.organicCarbonPct}%
                  </p>
                  <span className="text-[10px] text-gray-400">Medium (0.5 - 0.75%)</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                    Available N
                  </span>
                  <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                    {soilProfile.availableNitrogenKgHa}
                  </p>
                  <span className="text-[10px] text-gray-400">kg/ha (Needs Basal N)</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                    Available P₂O₅
                  </span>
                  <p className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1">
                    {soilProfile.availablePhosphorusKgHa}
                  </p>
                  <span className="text-[10px] text-gray-400">kg/ha (Adequate)</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                    Available K₂O
                  </span>
                  <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-1">
                    {soilProfile.availablePotassiumKgHa}
                  </p>
                  <span className="text-[10px] text-gray-400">kg/ha (High Reserve)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-400">
              No soil profile loaded. Run backend service to initialize Thanjavur soil benchmark.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OFFICIAL CROP PRODUCTION STATISTICS (DES APY) */}
      {activeTab === 'apy' && (
        <div className="pt-4 space-y-4">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Sprout size={16} className="text-emerald-600 shrink-0" />
              <span>
                <strong>Archived Directorate of Economics & Statistics (DES) Statistics:</strong>{' '}
                Ministry of Agriculture & Farmers Welfare, Govt of India.
                <strong>
                  {' '}
                  Historical record from Agricultural Year 1997–1998 (Whole Year). Macro district
                  statistic only — NOT a current seasonal yield target or individual farm
                  productivity label.
                </strong>
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold text-[10px] tracking-wide uppercase shrink-0">
              Archived DES Record (1997–1998)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <AlertCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Historical Scope Notice:</strong> This official report reflects Agricultural
              Year 1997–1998 district-wide production for Thanjavur Rice (181,496 Ha, 489,770
              Tonnes, 2.70 t/Ha). It provides macroeconomic historical context and must not be
              conflated with modern seasonal field targets.
            </p>
          </div>

          {loadingApy ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader className="animate-spin text-emerald-500" size={24} />
              <span className="text-xs">Loading official DES agricultural statistics...</span>
            </div>
          ) : apyRecords.length > 0 ? (
            <div className="space-y-4">
              {apyRecords.map((rec, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                          {rec.state} · {rec.district}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 uppercase">
                          {rec.crop} ({rec.season})
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Agricultural Year: <strong>{rec.agriculturalYear}</strong> · Status:{' '}
                        <strong>{rec.verificationStatus.replace('_', ' ')}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">
                        District Average Yield:
                      </span>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        {rec.yieldTonnePerHectare}{' '}
                        <span className="text-xs font-semibold">t/Ha</span> ({rec.yieldKgPerHectare}{' '}
                        <span className="text-xs font-semibold">kg/Ha</span>)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Cultivation Area
                      </span>
                      <p className="text-lg font-black text-gray-900 dark:text-white mt-1">
                        {rec.areaHectares.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-gray-400">Hectares harvested</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Total Production
                      </span>
                      <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
                        {rec.productionTonnes.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-gray-400">Tonnes harvested</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Calculated Ratio
                      </span>
                      <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-1">
                        {(rec.productionTonnes / rec.areaHectares).toFixed(2)}
                      </p>
                      <span className="text-[10px] text-gray-400">P / A consistency check</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-gray-400">
              No APY records loaded. Run `npm run ingest:apy` in Backend.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CANONICAL ENVIRONMENTAL VARIABLE REGISTRY */}
      {activeTab === 'registry' && (
        <div className="pt-4 space-y-4">
          <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
              <BookOpen size={15} className="text-purple-600 shrink-0" />
              <span>
                <strong>Authoritative Variable Registry:</strong> Single typed source of truth
                across meteorology, orbital remote sensing, soil chemistry, and on-farm IoT sensors.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold text-[11px] shrink-0">
              Canonical Registry v1.0
            </span>
          </div>

          {loadingRegistry ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader className="animate-spin text-purple-500" size={24} />
              <span className="text-xs">
                Loading canonical environmental variable definitions...
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Variable</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Source Type</th>
                    <th className="py-2.5 px-3">Valid Range</th>
                    <th className="py-2.5 px-3">Actuator Safe?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {Object.values(registryItems).map((v) => (
                    <tr
                      key={v.canonicalName}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {v.displayLabel}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {v.canonicalName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase">
                          {v.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-700 dark:text-gray-300">
                        {v.unit}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-gray-500 dark:text-gray-400">
                        {v.sourceType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600 dark:text-gray-400">
                        [{v.validationRange.min}, {v.validationRange.max}]
                      </td>
                      <td className="py-2.5 px-3">
                        {v.safeForActuatorCoupling ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck size={12} /> Yes (Direct In-Situ)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500">
                            <AlertTriangle size={12} /> Decoupled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Safety Notice & Agronomic Isolation Disclaimer */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 flex items-start gap-2 text-[11px] text-gray-400 dark:text-gray-500">
        <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
        <span>
          <strong>Operational Safeguard:</strong> Reanalysis weather estimates, satellite NDVI, and
          district statistical benchmarks are displayed for macro-climatic and contextual
          monitoring. In accordance with safety rules, they are strictly decoupled from automated
          closed-loop irrigation actuators until physical on-farm capacitive sensor ground truth is
          verified.
        </span>
      </div>
    </div>
  );
};

export default EnvironmentalIntelligence;
