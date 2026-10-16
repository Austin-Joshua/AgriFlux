import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  MapPin,
  Target,
  Zap,
  Clock,
  Droplets,
  RotateCw,
  Send,
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

const AIDecisionPanel: React.FC = () => {
  const { token } = useAuth();
  const [selectedField, setSelectedField] = useState<FieldOption>(FIELDS[0]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // Follow-up evaluation state
  const [followUpMoisture, setFollowUpMoisture] = useState('52');
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // Fetch structured recommendation from backend
  const fetchRecommendation = useCallback(
    async (field = selectedField, moistureOverride?: number) => {
      setLoading(true);
      try {
        const payload: Record<string, any> = {
          fieldId: field.id,
          fieldName: field.name,
          cropType: field.crop,
          cropStage: field.stage,
        };

        if (moistureOverride !== undefined) {
          payload.soilMoistureOverride = moistureOverride;
        }

        const res = await axios.post(`${API_URL}/field-intelligence/recommend`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.data?.success) {
          setRecommendation(res.data.data);
          setEvaluationResult(null);
        }
      } catch (err: any) {
        console.error('Error fetching field recommendation:', err);
      } finally {
        setLoading(false);
      }
    },
    [selectedField, token]
  );

  useEffect(() => {
    fetchRecommendation(selectedField);
  }, [fetchRecommendation, selectedField]);

  // Handle field selection
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
        setRecommendation((prev: any) => ({
          ...prev,
          farmerAction: res.data.data.farmerAction,
        }));
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

  const obs = recommendation?.supportingObservations;
  const urgency = recommendation?.urgency || 'medium';

  const urgencyStyles = {
    critical: {
      bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
      badge: 'bg-red-600 text-white',
    },
    high: {
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      badge: 'bg-amber-600 text-white',
    },
    medium: {
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      badge: 'bg-blue-600 text-white',
    },
    low: {
      bg: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/30',
      badge: 'bg-primary-600 text-white',
    },
  }[urgency as 'critical' | 'high' | 'medium' | 'low'];

  return (
    <div className="card-gradient overflow-hidden relative group border border-primary-500/20 shadow-xl">
      {/* Background Accent */}
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-primary-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-teal-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Top Bar: Title & Field Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-md">
            <Target size={18} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">
                AgriFlux Field Intelligence Engine
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 uppercase">
                Closed-Loop Decisions
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Evidence-based agronomic recommendations connecting real-time IoT sensors, soil
              health, and weather forecasts.
            </p>
          </div>
        </div>

        {/* Field Selection Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl self-start md:self-auto border border-gray-200/50 dark:border-white/5">
          {FIELDS.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSelectField(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedField.id === f.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {f.name.split(' ')[0]} ({f.crop})
            </button>
          ))}
          <button
            onClick={() => fetchRecommendation(selectedField)}
            disabled={loading}
            title="Refresh Recommendation"
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Active Recommendation & Evidence (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Action Banner */}
          <div className={`p-4 rounded-2xl border ${urgencyStyles.bg} relative overflow-hidden`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${urgencyStyles.badge}`}
                  >
                    {urgency.toUpperCase()} PRIORITY
                  </span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin size={12} /> {selectedField.name} · {selectedField.crop} (
                    {selectedField.stage})
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-snug">
                  {recommendation?.actionLabel || 'Analyzing field context...'}
                </h3>
              </div>
            </div>

            {/* Explanation */}
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium bg-white/50 dark:bg-gray-900/40 p-3 rounded-xl border border-white/20 dark:border-white/5">
              {recommendation?.explanation || 'Loading agronomic rationale...'}
            </p>

            {/* Decision Rule Trigger */}
            {recommendation?.decisionRules && recommendation.decisionRules.length > 0 && (
              <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                <Zap size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="italic">
                  Rule: {recommendation.decisionRules[0]}
                </span>
              </div>
            )}
          </div>

          {/* Validated Telemetry Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                Soil Moisture
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {obs?.soilMoisture?.value !== undefined ? `${obs.soilMoisture.value}%` : '---'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {obs?.soilMoisture?.source === 'iot_simulator' ? '(Simulated)' : '(Sensor)'}
                </span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-0.5">
                <Clock size={10} /> Freshness:{' '}
                {obs?.soilMoisture?.freshnessMinutes !== undefined
                  ? `${obs.soilMoisture.freshnessMinutes}m`
                  : '0m'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                Soil Chemistry
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-primary-600 dark:text-primary-400">
                  pH {obs?.soilPh?.value || 6.4}
                </span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1">
                K: {obs?.soilPotassium?.value || 48} kg/ha
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                Ambient Temp
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                  {obs?.ambientTemp?.value || 28}°C
                </span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1">
                Humidity: {obs?.humidity?.value || 60}%
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/50 border border-gray-100 dark:border-white/5">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                Rain Forecast (24h)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-teal-600 dark:text-teal-400">
                  {obs?.forecastRainMm?.value || 0} mm
                </span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1">
                Prob: {obs?.forecastRainProbability?.value || 15}%
              </p>
            </div>
          </div>

          {/* Expected Follow-up Condition */}
          {recommendation?.expectedFollowUpCondition && (
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 text-xs">
              <p className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                <CheckCircle size={14} className="text-blue-600" />
                Target Evaluation Criteria (Within {recommendation.expectedFollowUpCondition.timeframeHours}h):
              </p>
              <p className="text-blue-700/80 dark:text-blue-300/80">
                {recommendation.expectedFollowUpCondition.description} (Target: {recommendation.expectedFollowUpCondition.targetRange})
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Action Execution & Closed-Loop Evaluation (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* STEP 1: Farmer Action Recording */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                Step 1: Record Farmer Action
              </h4>
              {recommendation?.farmerAction ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 uppercase">
                  Action Recorded ✅
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-500 uppercase animate-pulse">
                  Pending Execution
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Record your real farm response to ensure traceability and track closed-loop crop
              responses.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleRecordAction('irrigated')}
                disabled={actionLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  recommendation?.farmerAction?.actionTaken === 'irrigated'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-100'
                }`}
              >
                <Droplets size={13} /> Irrigated Field
              </button>

              <button
                onClick={() => handleRecordAction('postponed')}
                disabled={actionLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  recommendation?.farmerAction?.actionTaken === 'postponed'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                <Clock size={13} /> Postponed Cycle
              </button>

              <button
                onClick={() => handleRecordAction('inspected')}
                disabled={actionLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  recommendation?.farmerAction?.actionTaken === 'inspected'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
                }`}
              >
                <CheckCircle size={13} /> Inspected Field
              </button>

              <button
                onClick={() => handleRecordAction('dismissed')}
                disabled={actionLoading}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  recommendation?.farmerAction?.actionTaken === 'dismissed'
                    ? 'bg-gray-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Dismissed
              </button>
            </div>
          </div>

          {/* STEP 2: Closed-Loop Outcome Evaluator */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50/50 to-teal-50/20 dark:from-gray-800/40 dark:to-gray-900/40 border border-primary-200/50 dark:border-primary-800/30 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-primary-700 dark:text-primary-400 flex items-center gap-1.5">
              <RotateCw size={14} /> Step 2: Evaluate Follow-up Outcome
            </h4>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Verify if subsequent field telemetry satisfies the expected condition following the
              recorded action.
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Subsequent Moisture (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={followUpMoisture}
                  onChange={(e) => setFollowUpMoisture(e.target.value)}
                  className="w-full h-9 px-3 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="e.g. 52"
                />
              </div>

              <button
                onClick={handleEvaluateFollowUp}
                disabled={evaluating || !recommendation}
                className="btn-primary self-end h-9 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <Send size={12} /> {evaluating ? 'Evaluating...' : 'Evaluate'}
              </button>
            </div>

            {/* Outcome Display */}
            {evaluationResult && (
              <div
                className={`p-3 rounded-xl border mt-2 text-xs ${
                  evaluationResult.conditionMet
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-800 dark:text-primary-200'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black uppercase tracking-wider flex items-center gap-1">
                    {evaluationResult.conditionMet ? (
                      <CheckCircle size={14} className="text-primary-600" />
                    ) : (
                      <AlertTriangle size={14} className="text-amber-600" />
                    )}
                    Outcome: {evaluationResult.conditionMet ? 'Condition Satisfied' : 'Review Needed'}
                  </span>
                  <span className="font-extrabold text-[11px]">
                    {evaluationResult.observedDelta}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed opacity-90">{evaluationResult.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDecisionPanel;
