import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Target,
  Zap,
  Clock,
  Droplets,
  RotateCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Thermometer,
  CloudRain,
  Activity,
  History,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

interface FieldOption {
  id: string;
  name: string;
  crop: string;
  stage: string;
  defaultMoisture: number;
}

const FIELDS: FieldOption[] = [
  {
    id: 'field-01',
    name: 'North Acre Parcel A',
    crop: 'Rice',
    stage: 'Vegetative (Tillering)',
    defaultMoisture: 24, // Trigger drought stress for live demo
  },
  {
    id: 'field-02',
    name: 'South Terrace Plateau',
    crop: 'Maize',
    stage: 'Tasseling',
    defaultMoisture: 52, // Optimal
  },
  {
    id: 'field-03',
    name: 'Riverside Lowland Parcel',
    crop: 'Sugarcane',
    stage: 'Grand Growth',
    defaultMoisture: 78, // High moisture / postpone
  },
];

interface FieldRecommendationData {
  recommendationId: string;
  fieldId: string;
  fieldName: string;
  cropType: string;
  cropStage: string;
  action: string;
  actionLabel: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  explanation: string;
  ruleVersion?: string;
  decisionRules: string[];
  assumptionsAndLimitations: string[];
  alternativeActions: Array<{ action: string; tradeOff: string }>;
  expectedFollowUpCondition?: {
    parameter: string;
    targetRange: string;
    timeframeHours: number;
    description: string;
  };
  supportingObservations: {
    soilMoisture?: {
      value: number | null;
      unit: string;
      source: string;
      sourceType?: string;
      dataQualityStatus?: string;
      freshnessMinutes: number;
      isStale: boolean;
      provenance?: string;
    };
    soilTemp?: { value: number; unit: string; source: string };
    soilPh?: { value: number; unit: string; source: string };
    soilNitrogen?: { value: number; unit: string };
    soilPhosphorus?: { value: number; unit: string };
    soilPotassium?: { value: number; unit: string };
    ambientTemp?: { value: number; unit: string };
    humidity?: { value: number; unit: string };
    forecastRainMm?: { value: number; unit: string };
    forecastRainProbability?: { value: number; unit: string };
    satelliteCanopyNDVI?: {
      value: number | null;
      isAvailable: boolean;
      vigor: string;
      cloudCoverPct?: number;
      acquisitionDate?: string;
      source: string;
    };
    districtYieldBenchmark?: {
      crop: string;
      district: string;
      yieldKgHa: number;
      source: string;
    };
  };
  farmerAction?: {
    actionTaken: string;
    notes?: string;
    recordedAt: string;
    actorName?: string;
    actorId?: string;
  };
  agronomistReview?: {
    status: 'endorsed' | 'revision_requested' | 'inspection_required';
    notes: string;
    reviewerName: string;
    reviewedAt: string;
    revisedPrescription?: string;
  };
  followUpEvaluation?: {
    conditionMet: boolean;
    status: string;
    observedDelta: string;
    explanation: string;
    causalAttributionDisclaimer?: string;
    evaluatedAt: string;
  };
}

interface FollowUpEvaluationData {
  conditionMet: boolean;
  status:
    | 'achieved'
    | 'partially_achieved'
    | 'not_achieved'
    | 'insufficient_evidence'
    | 'improved'
    | 'insufficient_change'
    | 'worsened';
  observedDelta: string;
  explanation: string;
  causalAttributionDisclaimer?: string;
  subsequentReading?: { moisture: number | null; temperature: number };
}

interface TimelineEvent {
  id: string;
  recommendationId: string;
  fieldId: string;
  fieldName: string;
  eventType:
    | 'RECOMMENDATION_GENERATED'
    | 'FARMER_ACTION_RECORDED'
    | 'AGRONOMIST_REVIEW_LOGGED'
    | 'FOLLOW_UP_EVALUATED';
  timestamp: string;
  title: string;
  description: string;
  actor: string;
  actorId?: string;
  status?: string;
  ruleVersion?: string;
  metadata?: Record<string, unknown>;
}

const AIDecisionPanel: React.FC = () => {
  const { token, user } = useAuth();
  const [selectedField, setSelectedField] = useState<FieldOption>(FIELDS[0]);
  const [recommendation, setRecommendation] = useState<FieldRecommendationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // Follow-up evaluation state
  const [followUpMoisture, setFollowUpMoisture] = useState('52');
  const [evaluationResult, setEvaluationResult] = useState<FollowUpEvaluationData | null>(null);

  // Field action timeline state
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);

  // Fetch chronological timeline for selected field
  const fetchTimeline = useCallback(
    async (fieldId = selectedField.id) => {
      setLoadingTimeline(true);
      try {
        const res = await axios.get(`${API_URL}/field-intelligence/timeline/${fieldId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data?.success && Array.isArray(res.data.data)) {
          setTimeline(res.data.data);
        }
      } catch (err: unknown) {
        console.warn('Could not fetch field timeline:', err);
      } finally {
        setLoadingTimeline(false);
      }
    },
    [selectedField.id, token]
  );

  // Fetch structured recommendation from backend
  const fetchRecommendation = useCallback(
    async (field = selectedField, moistureOverride?: number, forceRefresh = false) => {
      setLoading(true);
      try {
        const targetMoisture =
          moistureOverride !== undefined ? moistureOverride : field.defaultMoisture;
        const payload: Record<string, string | number | boolean> = {
          fieldId: field.id,
          fieldName: field.name,
          cropType: field.crop,
          cropStage: field.stage,
          soilMoistureOverride: targetMoisture,
          forceRefresh,
          reuseActive: !forceRefresh,
        };

        const res = await axios.post(`${API_URL}/field-intelligence/recommend`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.data?.success) {
          setRecommendation(res.data.data);
          setEvaluationResult(null);
          // Auto sync timeline
          fetchTimeline(field.id);
        }
      } catch (err: unknown) {
        console.error('Error fetching field recommendation:', err);
      } finally {
        setLoading(false);
      }
    },
    [selectedField, token, fetchTimeline]
  );

  // On mount and field switch, fetch calibrated telemetry immediately
  useEffect(() => {
    fetchRecommendation(selectedField, selectedField.defaultMoisture, false);
  }, [fetchRecommendation, selectedField]);

  const handleSelectField = (field: FieldOption) => {
    setSelectedField(field);
    fetchRecommendation(field, field.defaultMoisture, false);
  };

  // Record Farmer Response
  const handleRecordAction = async (
    actionTaken:
      | 'accepted'
      | 'postponed'
      | 'rejected'
      | 'requested_review'
      | 'irrigated'
      | 'inspected'
      | 'dismissed'
  ) => {
    if (!recommendation?.recommendationId) return;
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/field-intelligence/action`,
        {
          recommendationId: recommendation.recommendationId,
          actionTaken,
          notes: `Recorded via Farmer Workspace by ${user?.name || 'Farmer'} for ${selectedField.name}`,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (res.data?.success) {
        toast.success(`Action '${actionTaken}' recorded and persisted in field audit log!`);
        setRecommendation((prev) =>
          prev
            ? {
                ...prev,
                farmerAction: res.data.data.farmerAction,
              }
            : null
        );
        fetchTimeline(selectedField.id);
      }
    } catch {
      toast.error('Failed to record action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Evaluate Follow-up Outcome (Closed-Loop verification)
  const handleEvaluateFollowUp = async () => {
    if (!recommendation?.recommendationId) return;
    setEvaluating(true);
    try {
      const res = await axios.post(
        `${API_URL}/field-intelligence/evaluate`,
        {
          recommendationId: recommendation.recommendationId,
          subsequentTelemetry: {
            moisture: Number(followUpMoisture),
            temperature: 26,
            source: 'calibrated_followup_sensor',
            notes: 'Post-action root-zone sensor telemetry',
          },
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (res.data?.success) {
        setEvaluationResult(res.data.data);
        toast.success('Closed-loop outcome evaluated and sealed!');
        fetchTimeline(selectedField.id);
      }
    } catch {
      toast.error('Evaluation failed. Please verify input value.');
    } finally {
      setEvaluating(false);
    }
  };

  const getFallbackAction = (f: FieldOption) => {
    if (f.defaultMoisture < 30) return 'Immediate Irrigation Required — Root Zone Deficit';
    if (f.defaultMoisture > 70) return 'Postpone Irrigation Cycle — Soil Near Saturation';
    return 'Maintain Monitoring Schedule — Root Zone Moisture Optimal';
  };

  const getFallbackUrgency = (f: FieldOption): 'critical' | 'high' | 'medium' | 'low' => {
    if (f.defaultMoisture < 30) return 'high';
    if (f.defaultMoisture > 70) return 'medium';
    return 'low';
  };

  const getFallbackExplanation = (f: FieldOption) => {
    if (f.defaultMoisture < 30) {
      return `Root-zone sensor telemetry reads ${f.defaultMoisture}%, severely below the managed depletion threshold for ${f.crop}. Immediate hydration is recommended to prevent yield stunting.`;
    }
    if (f.defaultMoisture > 70) {
      return `Root-zone sensor telemetry reads ${f.defaultMoisture}%. High moisture combined with scheduled rain indicates irrigation should be suspended to avoid root hypoxia.`;
    }
    return `Root-zone sensor telemetry reads ${f.defaultMoisture}%. Soil hydration and micro-climate parameters are within the calibrated agronomic target window for ${f.crop}.`;
  };

  const obs = recommendation?.supportingObservations;
  const urgency = recommendation?.urgency || getFallbackUrgency(selectedField);

  // Guaranteed valid numeric moisture value - never null or undefined
  const moistureValue =
    obs?.soilMoisture?.value != null
      ? Number(obs.soilMoisture.value)
      : selectedField.defaultMoisture;

  const urgencyStyles = {
    critical: {
      border: 'border-red-500/30 dark:border-red-500/40',
      badge: 'bg-red-500 text-white shadow-sm shadow-red-500/30',
      accent: 'from-red-500/10 to-amber-500/5',
      text: 'text-red-700 dark:text-red-300',
    },
    high: {
      border: 'border-amber-500/30 dark:border-amber-500/40',
      badge: 'bg-amber-500 text-white shadow-sm shadow-amber-500/30',
      accent: 'from-amber-500/10 to-primary-500/5',
      text: 'text-amber-700 dark:text-amber-300',
    },
    medium: {
      border: 'border-blue-500/30 dark:border-blue-500/40',
      badge: 'bg-blue-500 text-white shadow-sm shadow-blue-500/30',
      accent: 'from-blue-500/10 to-teal-500/5',
      text: 'text-blue-700 dark:text-blue-300',
    },
    low: {
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      badge: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30',
      accent: 'from-emerald-500/10 to-teal-500/5',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
  }[urgency as 'critical' | 'high' | 'medium' | 'low'];

  // Moisture gauge color indicator
  const getMoistureColor = (val: number) => {
    if (val < 30)
      return {
        bar: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        label: 'Drought Stress',
      };
    if (val > 70)
      return {
        bar: 'bg-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        label: 'Field Saturated',
      };
    return {
      bar: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      label: 'Optimal Range',
    };
  };

  const moistureStatus = getMoistureColor(moistureValue);

  return (
    <div className="space-y-4">
      {/* 1. Telemetry Hub Card */}
      <div className="card-executive overflow-hidden border border-emerald-500/20 shadow-xl transition-all duration-200 hover:shadow-2xl p-4 sm:p-5 relative">
        {/* Ambient Lighting Orbs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header Bar: Status & Field Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                <Target size={20} />
              </span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white font-display">
                  Field Intelligence Engine
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Rule: {recommendation?.ruleVersion || 'v2.1-QUANTEX-FAO56'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40">
                  {obs?.soilMoisture?.provenance === 'measured'
                    ? '⚡ ESP32 Measured'
                    : '🔬 Simulated Calibration Profile'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Deterministic FAO-56 decision gates connecting in-situ IoT sensors, ERA5 reanalysis,
                and Sentinel-2 NDVI.
              </p>
            </div>
          </div>

          {/* Field Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl max-w-full overflow-x-auto no-scrollbar border border-gray-200/50 dark:border-white/5 flex-nowrap self-start sm:self-auto flex-shrink-0">
            {FIELDS.map((f) => (
              <button
                key={f.id}
                onClick={() => handleSelectField(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  selectedField.id === f.id
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 scale-[1.02]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                {f.name.split(' ')[0]} ({f.crop})
              </button>
            ))}
            <button
              onClick={() => fetchRecommendation(selectedField, selectedField.defaultMoisture, true)}
              disabled={loading}
              title="Refresh In-Situ Telemetry"
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex-shrink-0 active:scale-95"
            >
              <RotateCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
            </button>
          </div>
        </div>

        {/* Telemetry Gauges Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {/* Gauge 1: Soil Moisture */}
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/40 hover-lift">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Droplets size={12} className="text-blue-500" /> Moisture
              </span>
              <span className={`text-[10px] font-extrabold ${moistureStatus.text}`}>
                {moistureStatus.label}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-display">
                {moistureValue}%
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Root-Zone</span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              {obs?.soilMoisture?.source === 'esp32_hardware' ? (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  ESP32 Measured
                </span>
              ) : obs?.soilMoisture?.source === 'manual_operator_input' ? (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  Calibrated Input
                </span>
              ) : (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Simulated Baseline
                </span>
              )}
            </div>

            <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ease-out ${moistureStatus.bar}`}
                style={{ width: `${Math.min(100, Math.max(5, moistureValue))}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-semibold">
              <span>0% Deficit</span>
              <span>50% Target</span>
              <span>100% Sat</span>
            </div>
          </div>

          {/* Gauge 2: Soil Chemistry */}
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/40 hover-lift">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Activity size={12} className="text-emerald-500" /> Chemistry
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                ICAR-TNAU
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                pH {obs?.soilPh?.value || 6.4}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Optimal</span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                N:{obs?.soilNitrogen?.value || 165} P:{obs?.soilPhosphorus?.value || 18} K:{obs?.soilPotassium?.value || 175}
              </span>
            </div>

            <div className="w-full bg-gradient-to-r from-red-400 via-emerald-400 to-blue-400 rounded-full h-1.5 mt-2 relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gray-900 dark:bg-white rounded-full border border-emerald-500 shadow-sm transition-all duration-200 ease-out"
                style={{ left: `${((Number(obs?.soilPh?.value || 6.4) - 4) / 5) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-semibold">
              <span>Acidic</span>
              <span>pH 7.0</span>
              <span>Alkaline</span>
            </div>
          </div>

          {/* Gauge 3: Ambient Climate */}
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/40 hover-lift">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Thermometer size={12} className="text-amber-500" /> Weather
              </span>
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                ERA5-Land
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-display">
                {obs?.ambientTemp?.value || 28}°C
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {obs?.humidity?.value || 60}% RH
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                Historical Reanalysis
              </span>
            </div>

            <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-200 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(10, ((Number(obs?.ambientTemp?.value || 28) - 10) / 35) * 100))}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-semibold">
              <span>10°C</span>
              <span>25°C</span>
              <span>45°C</span>
            </div>
          </div>

          {/* Gauge 4: Precipitation & ET0 */}
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/40 hover-lift">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <CloudRain size={12} className="text-blue-500" /> Rain Forecast
              </span>
              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                {obs?.forecastRainProbability?.value || 15}% Prob
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-display">
                {obs?.forecastRainMm?.value || 0} mm
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Next 24h</span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                Open-Meteo Model
              </span>
            </div>

            <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-200 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(5, (Number(obs?.forecastRainMm?.value || 0) / 30) * 100))}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-semibold">
              <span>0mm</span>
              <span>15mm</span>
              <span>30mm+</span>
            </div>
          </div>
        </div>

        {/* Multi-Source Provenance & Satellite Verification Ribbon */}
        <div className="mt-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" /> Multi-Source Provenance:
            </span>
            {obs?.satelliteCanopyNDVI?.isAvailable ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20">
                🛰️ Sentinel-2 L2A NDVI: {obs.satelliteCanopyNDVI.value} ({obs.satelliteCanopyNDVI.vigor})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 border border-amber-500/20">
                🛰️ Sentinel-2 L2A: Overpass Pending / Cloud-Masked
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-teal-100/80 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 text-[10px] font-bold flex items-center gap-1 border border-teal-500/20">
              🧪 Soil Health Card Chemistry
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 text-[10px] font-bold flex items-center gap-1 border border-blue-500/20">
              📈 DES APY District Baseline ({obs?.districtYieldBenchmark?.yieldKgHa || 3820} kg/ha)
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-semibold">
            Rule Version: {recommendation?.ruleVersion || 'v2.1-QUANTEX-FAO56'}
          </span>
        </div>
      </div>

      {/* 2. Autonomous Advisory & Closed-Loop Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT CARD: Agronomic Advisory (7 Cols) */}
        <div
          className={`lg:col-span-7 card-executive p-4 sm:p-5 border ${urgencyStyles.border} bg-gradient-to-br ${urgencyStyles.accent} relative overflow-hidden flex flex-col justify-between space-y-3.5`}
        >
          <div>
            {/* Urgency and Context Badges */}
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${urgencyStyles.badge}`}
              >
                {urgency.toUpperCase()} PRIORITY
              </span>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <MapPin size={13} className="text-emerald-500" />
                {selectedField.name} · {selectedField.crop} ({selectedField.stage})
              </span>
            </div>

            {/* Action Headline */}
            <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white font-display leading-snug">
              {recommendation?.actionLabel || getFallbackAction(selectedField)}
            </h3>

            {/* Crisp Rationale */}
            <p className="mt-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {recommendation?.explanation || getFallbackExplanation(selectedField)}
            </p>

            {/* Decision Rule Trigger */}
            {recommendation?.decisionRules && recommendation.decisionRules.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <Zap size={14} className="text-amber-500 flex-shrink-0" />
                <span className="truncate">Rule: {recommendation.decisionRules[0]}</span>
              </div>
            )}
          </div>

          {/* Expected Target Condition Banner */}
          <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="truncate">
                <span className="font-bold text-blue-900 dark:text-blue-300">Target Outcome: </span>
                <span className="text-blue-700 dark:text-blue-400">
                  {recommendation?.expectedFollowUpCondition?.description ||
                    'Soil moisture between 48% - 55% within 2 hours'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 uppercase whitespace-nowrap flex-shrink-0">
              Target: 48-55%
            </span>
          </div>
        </div>

        {/* RIGHT CARD: Closed-Loop Governance & Action Center (5 Cols) */}
        <div className="lg:col-span-5 card-executive p-4 sm:p-5 border border-gray-200/80 dark:border-gray-700/60 shadow-md flex flex-col justify-between space-y-4">
          {/* STEP 1: Farmer Action Recording */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 font-display flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-500" /> Step 1: Record Farmer Action
              </h4>
              {recommendation?.farmerAction ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 uppercase">
                  Action: {recommendation.farmerAction.actionTaken.toUpperCase()} ✅
                </span>
              ) : (
                <span className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1">
                  <Clock size={11} /> Pending Action
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleRecordAction('accepted')}
                disabled={actionLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 ${
                  recommendation?.farmerAction?.actionTaken === 'accepted' ||
                  recommendation?.farmerAction?.actionTaken === 'irrigated'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/40'
                }`}
              >
                <CheckCircle2 size={13} /> Action Completed
              </button>

              <button
                onClick={() => handleRecordAction('postponed')}
                disabled={actionLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 ${
                  recommendation?.farmerAction?.actionTaken === 'postponed'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200/50 dark:border-amber-800/40'
                }`}
              >
                <Clock size={13} /> Postpone Cycle
              </button>

              <button
                onClick={() => handleRecordAction('requested_review')}
                disabled={actionLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 ${
                  recommendation?.farmerAction?.actionTaken === 'requested_review' ||
                  recommendation?.farmerAction?.actionTaken === 'inspected'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/50 dark:border-blue-800/40'
                }`}
              >
                <UserCheck size={13} /> Request Agronomist
              </button>

              <button
                onClick={() => handleRecordAction('rejected')}
                disabled={actionLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 ${
                  recommendation?.farmerAction?.actionTaken === 'rejected' ||
                  recommendation?.farmerAction?.actionTaken === 'dismissed'
                    ? 'bg-gray-700 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <XCircle size={13} /> Dismiss / Reject
              </button>
            </div>

            {/* Specialist Consultation & Agronomist Review State */}
            {recommendation?.agronomistReview ? (
              <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400" />
                    Specialist Review:{' '}
                    {recommendation.agronomistReview.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                    {new Date(recommendation.agronomistReview.reviewedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-[11px] leading-relaxed">
                  <span className="font-semibold text-purple-800 dark:text-purple-300">
                    {recommendation.agronomistReview.reviewerName}:
                  </span>{' '}
                  {recommendation.agronomistReview.notes}
                </p>
                {recommendation.agronomistReview.revisedPrescription && (
                  <p className="text-emerald-700 dark:text-emerald-300 font-bold text-[11px] bg-white/60 dark:bg-gray-900/60 p-1.5 rounded-lg border border-purple-100 dark:border-purple-900/40">
                    Prescription: {recommendation.agronomistReview.revisedPrescription}
                  </p>
                )}
              </div>
            ) : recommendation?.farmerAction?.actionTaken === 'requested_review' ||
              recommendation?.farmerAction?.actionTaken === 'inspected' ? (
              <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 text-xs flex items-center gap-2">
                <Clock size={14} className="text-blue-500 animate-spin flex-shrink-0" />
                <span className="text-blue-800 dark:text-blue-200 text-[11px]">
                  Specialist review dispatched. Regional agronomist notified in consultation queue.
                </span>
              </div>
            ) : null}
          </div>

          {/* STEP 2: Closed-Loop Outcome Verification */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 font-display flex items-center gap-1.5">
              <RotateCw size={13} className="text-emerald-500" /> Step 2: Evaluate Follow-up Outcome
            </h4>

            <div className="flex items-center gap-2">
              <div className="relative w-28 sm:w-32 flex-shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={followUpMoisture}
                  onChange={(e) => setFollowUpMoisture(e.target.value)}
                  className="w-full h-10 px-3 pr-7 text-sm font-black text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="52"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                  %
                </span>
              </div>

              <button
                onClick={handleEvaluateFollowUp}
                disabled={evaluating || !recommendation}
                className="btn-primary h-10 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-150 flex-1 sm:flex-initial shadow-md shadow-emerald-600/20"
              >
                <Send size={12} /> {evaluating ? 'Evaluating...' : 'Evaluate'}
              </button>
            </div>

            {/* Outcome Display with 4 States and Non-Causal Attribution Disclaimer */}
            {evaluationResult && (
              <div
                className={`p-3 rounded-xl border text-xs transition-all duration-150 ${
                  evaluationResult.status === 'achieved' || evaluationResult.status === 'improved'
                    ? 'bg-emerald-100/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                    : evaluationResult.status === 'partially_achieved'
                      ? 'bg-blue-100/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200'
                      : evaluationResult.status === 'insufficient_evidence'
                        ? 'bg-purple-100/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200'
                        : 'bg-red-100/70 dark:bg-red-950/40 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black uppercase tracking-wider flex items-center gap-1">
                    {evaluationResult.status === 'achieved' ||
                    evaluationResult.status === 'improved' ? (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    ) : evaluationResult.status === 'partially_achieved' ? (
                      <CheckCircle2 size={14} className="text-blue-600" />
                    ) : evaluationResult.status === 'insufficient_evidence' ? (
                      <Info size={14} className="text-purple-600" />
                    ) : (
                      <AlertTriangle size={14} className="text-red-600" />
                    )}
                    Outcome: {evaluationResult.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="font-extrabold text-[11px]">
                    {evaluationResult.observedDelta}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed opacity-95">{evaluationResult.explanation}</p>

                {/* Non-Causal Attribution Disclaimer */}
                <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 flex items-start gap-1.5 text-[10px] opacity-80">
                  <Info size={12} className="flex-shrink-0 mt-0.5 text-blue-500" />
                  <span>
                    {evaluationResult.causalAttributionDisclaimer ||
                      'Observational telemetry comparison only. Outcome classification does not imply direct singular causation by farmer action; micro-climate, precipitation, and soil heterogeneity contribute to moisture dynamics.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Field Action Timeline (Phase 4 Chronological Audit Trail) */}
      <div className="card-executive overflow-hidden border border-gray-200/80 dark:border-gray-800 shadow-md p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <History size={16} />
            </span>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white font-display">
                Field Action Timeline · {selectedField.name}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Immutable chronological audit record of decisions, farmer executions, and verified
                outcomes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTimeline(selectedField.id)}
              disabled={loadingTimeline}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
              title="Refresh timeline"
            >
              <RotateCw size={14} className={loadingTimeline ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              {showTimeline ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {showTimeline && (
          <div className="pt-4">
            {timeline.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs font-medium">
                No timeline events recorded yet for this parcel. Record an action or evaluate an
                outcome above to begin the audit trail.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
                {timeline.map((event) => {
                  const eventConfig = {
                    RECOMMENDATION_GENERATED: {
                      dot: 'bg-amber-500',
                      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
                      icon: <Zap size={12} className="text-white" />,
                    },
                    FARMER_ACTION_RECORDED: {
                      dot: 'bg-emerald-500',
                      badge:
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
                      icon: <CheckCircle2 size={12} className="text-white" />,
                    },
                    AGRONOMIST_REVIEW_LOGGED: {
                      dot: 'bg-blue-500',
                      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
                      icon: <ShieldCheck size={12} className="text-white" />,
                    },
                    FOLLOW_UP_EVALUATED: {
                      dot: 'bg-purple-500',
                      badge:
                        'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
                      icon: <RotateCw size={12} className="text-white" />,
                    },
                  }[event.eventType];

                  return (
                    <div key={event.id} className="relative group">
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full flex items-center justify-center shadow-sm ${eventConfig.dot}`}
                      >
                        {eventConfig.icon}
                      </span>

                      {/* Content Card */}
                      <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/40 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900 dark:text-white">
                              {event.title}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${eventConfig.badge}`}
                            >
                              {event.actor}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDecisionPanel;
