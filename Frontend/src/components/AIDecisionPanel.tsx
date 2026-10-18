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
      freshnessMinutes: number;
      isStale: boolean;
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
  };
  farmerAction?: {
    actionTaken: string;
    notes?: string;
    recordedAt: string;
  };
}

interface FollowUpEvaluationData {
  conditionMet: boolean;
  status: 'improved' | 'insufficient_change' | 'worsened';
  observedDelta: string;
  explanation: string;
  subsequentReading?: { moisture: number; temperature: number };
}

const AIDecisionPanel: React.FC = () => {
  const { token } = useAuth();
  const [selectedField, setSelectedField] = useState<FieldOption>(FIELDS[0]);
  const [recommendation, setRecommendation] = useState<FieldRecommendationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // Follow-up evaluation state
  const [followUpMoisture, setFollowUpMoisture] = useState('52');
  const [evaluationResult, setEvaluationResult] = useState<FollowUpEvaluationData | null>(null);

  // Fetch structured recommendation from backend
  const fetchRecommendation = useCallback(
    async (field = selectedField, moistureOverride?: number) => {
      setLoading(true);
      try {
        const targetMoisture =
          moistureOverride !== undefined ? moistureOverride : field.defaultMoisture;
        const payload: Record<string, string | number> = {
          fieldId: field.id,
          fieldName: field.name,
          cropType: field.crop,
          cropStage: field.stage,
          soilMoistureOverride: targetMoisture,
        };

        const res = await axios.post(`${API_URL}/field-intelligence/recommend`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.data?.success) {
          setRecommendation(res.data.data);
          setEvaluationResult(null);
        }
      } catch (err: unknown) {
        console.error('Error fetching field recommendation:', err);
      } finally {
        setLoading(false);
      }
    },
    [selectedField, token]
  );

  // On mount and field switch, fetch calibrated telemetry immediately
  useEffect(() => {
    fetchRecommendation(selectedField, selectedField.defaultMoisture);
  }, [fetchRecommendation, selectedField]);

  const handleSelectField = (field: FieldOption) => {
    setSelectedField(field);
    fetchRecommendation(field, field.defaultMoisture);
  };

  // Record Farmer Response
  const handleRecordAction = async (
    actionTaken: 'irrigated' | 'postponed' | 'inspected' | 'dismissed'
  ) => {
    if (!recommendation?.recommendationId) return;
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/field-intelligence/action`,
        {
          recommendationId: recommendation.recommendationId,
          actionTaken,
          notes: `Recorded via Farmer Workspace for ${selectedField.name}`,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (res.data?.success) {
        toast.success(`Action '${actionTaken}' recorded and persisted!`);
        setRecommendation((prev) =>
          prev
            ? {
                ...prev,
                farmerAction: res.data.data.farmerAction,
              }
            : null
        );
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
            notes: 'Post-action sensor reading',
          },
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (res.data?.success) {
        setEvaluationResult(res.data.data);
        toast.success('Closed-loop outcome evaluated!');
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
                  Closed-Loop AI
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Autonomous agronomic decision gates connecting real-time IoT sensors & ERA5 weather.
              </p>
            </div>
          </div>

          {/* Field Switcher Pills - Horizontal scrolling on mobile without overflow */}
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
              onClick={() => fetchRecommendation(selectedField, selectedField.defaultMoisture)}
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

            {/* Visual Progress Bar Gauge - Snappy 200ms duration */}
            <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ease-out ${moistureStatus.bar}`}
                style={{ width: `${Math.min(100, Math.max(5, moistureValue))}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-semibold">
              <span>0% Dry</span>
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
                Balanced
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                pH {obs?.soilPh?.value || 6.4}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Optimal</span>
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
                <Thermometer size={12} className="text-amber-500" /> Climate
              </span>
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                Warm
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-display">
                {obs?.ambientTemp?.value || 28}°C
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                RH {obs?.humidity?.value || 60}%
              </span>
            </div>

            <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-200 ease-out"
                style={{
                  width: `${Math.min(100, ((Number(obs?.ambientTemp?.value || 28) - 10) / 35) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-semibold">
              <span>15°C</span>
              <span>28°C Normal</span>
              <span>45°C</span>
            </div>
          </div>

          {/* Gauge 4: Precipitation Window */}
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/40 hover-lift">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <CloudRain size={12} className="text-teal-500" /> Rain (24h)
              </span>
              <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400">
                {obs?.forecastRainProbability?.value || 15}% Prob
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 font-display">
                {obs?.forecastRainMm?.value || 0} mm
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Clear Window</span>
            </div>

            <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-blue-500 rounded-full transition-all duration-200 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(8, Number(obs?.forecastRainProbability?.value || 15)))}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-semibold">
              <span>Dry</span>
              <span>Rain Window</span>
              <span>Heavy</span>
            </div>
          </div>
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

            {/* Crisp Rationale (Clean, open typography without boxed clutter) */}
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
                  Action Recorded ✅
                </span>
              ) : (
                <span className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1">
                  <Clock size={11} /> Pending
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleRecordAction('irrigated')}
                disabled={actionLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 ${
                  recommendation?.farmerAction?.actionTaken === 'irrigated'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/40'
                }`}
              >
                <Droplets size={13} /> Irrigated Field
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
                <Clock size={13} /> Postponed Cycle
              </button>

              <button
                onClick={() => handleRecordAction('inspected')}
                disabled={actionLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 ${
                  recommendation?.farmerAction?.actionTaken === 'inspected'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/50 dark:border-blue-800/40'
                }`}
              >
                <CheckCircle2 size={13} /> Inspected Field
              </button>

              <button
                onClick={() => handleRecordAction('dismissed')}
                disabled={actionLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 ${
                  recommendation?.farmerAction?.actionTaken === 'dismissed'
                    ? 'bg-gray-700 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                Dismissed
              </button>
            </div>
          </div>

          {/* STEP 2: Closed-Loop Outcome Verification */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 font-display flex items-center gap-1.5">
              <RotateCw size={13} className="text-emerald-500" /> Step 2: Evaluate Follow-up Outcome
            </h4>

            {/* Refined compact input group on desktop */}
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

            {/* Outcome Display */}
            {evaluationResult && (
              <div
                className={`p-3 rounded-xl border text-xs transition-all duration-150 ${
                  evaluationResult.conditionMet
                    ? 'bg-emerald-100/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-100/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black uppercase tracking-wider flex items-center gap-1">
                    {evaluationResult.conditionMet ? (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    ) : (
                      <AlertTriangle size={14} className="text-amber-600" />
                    )}
                    Outcome:{' '}
                    {evaluationResult.conditionMet ? 'Condition Satisfied' : 'Review Needed'}
                  </span>
                  <span className="font-extrabold text-[11px]">
                    {evaluationResult.observedDelta}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed opacity-95">{evaluationResult.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDecisionPanel;
