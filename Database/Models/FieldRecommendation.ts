import mongoose, { Schema, Document } from 'mongoose';

export interface IFieldRecommendation extends Document {
  recommendationId: string;
  userId: string;
  farmId: string;
  fieldId: string;
  fieldName: string;
  cropType: string;
  cropStage: string;
  action:
    | 'IRRIGATE_IMMEDIATE'
    | 'IRRIGATE_LIGHT'
    | 'POSTPONE_IRRIGATION'
    | 'SOIL_AERATION'
    | 'NUTRIENT_APPLICATION'
    | 'HEAT_PROTECTION'
    | 'MONITOR_OPTIMAL';
  actionLabel: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  supportingObservations: {
    soilMoisture: {
      value: number;
      unit: string;
      source: string;
      freshnessMinutes: number;
      isStale: boolean;
    };
    soilTemp: { value: number; unit: string; source: string };
    soilPh: { value: number; unit: string; source: string };
    soilNitrogen: { value: number; unit: string };
    soilPhosphorus: { value: number; unit: string };
    soilPotassium: { value: number; unit: string };
    ambientTemp: { value: number; unit: string };
    humidity: { value: number; unit: string };
    forecastRainMm: { value: number; unit: string };
    forecastRainProbability: { value: number; unit: string };
  };
  decisionRules: string[];
  explanation: string;
  assumptionsAndLimitations: string[];
  alternativeActions: { action: string; tradeOff: string }[];
  expectedFollowUpCondition: {
    parameter: string;
    targetRange: string;
    timeframeHours: number;
    description: string;
  };
  farmerAction?: {
    actionTaken: 'irrigated' | 'postponed' | 'inspected' | 'dismissed';
    recordedAt: Date;
    notes?: string;
  };
  followUpEvaluation?: {
    evaluatedAt: Date;
    subsequentReading: Record<string, any>;
    conditionMet: boolean;
    status: 'improved' | 'insufficient_change' | 'worsened' | 'pending';
    observedDelta: string;
    explanation: string;
  };
  createdAt: Date;
}

const FieldRecommendationSchema: Schema = new Schema(
  {
    recommendationId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.Mixed, required: true },
    farmId: { type: String, default: 'farm-01' },
    fieldId: { type: String, required: true },
    fieldName: { type: String, required: true },
    cropType: { type: String, required: true },
    cropStage: { type: String, default: 'Vegetative' },
    action: {
      type: String,
      enum: [
        'IRRIGATE_IMMEDIATE',
        'IRRIGATE_LIGHT',
        'POSTPONE_IRRIGATION',
        'SOIL_AERATION',
        'NUTRIENT_APPLICATION',
        'HEAT_PROTECTION',
        'MONITOR_OPTIMAL',
      ],
      required: true,
    },
    actionLabel: { type: String, required: true },
    urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    supportingObservations: { type: Schema.Types.Mixed, required: true },
    decisionRules: [{ type: String }],
    explanation: { type: String, required: true },
    assumptionsAndLimitations: [{ type: String }],
    alternativeActions: [
      {
        action: { type: String },
        tradeOff: { type: String },
      },
    ],
    expectedFollowUpCondition: {
      parameter: { type: String },
      targetRange: { type: String },
      timeframeHours: { type: Number },
      description: { type: String },
    },
    farmerAction: {
      actionTaken: {
        type: String,
        enum: ['irrigated', 'postponed', 'inspected', 'dismissed'],
      },
      recordedAt: { type: Date },
      notes: { type: String },
    },
    followUpEvaluation: {
      evaluatedAt: { type: Date },
      subsequentReading: { type: Schema.Types.Mixed },
      conditionMet: { type: Boolean },
      status: {
        type: String,
        enum: ['improved', 'insufficient_change', 'worsened', 'pending'],
      },
      observedDelta: { type: String },
      explanation: { type: String },
    },
  },
  { timestamps: true }
);

FieldRecommendationSchema.index({ userId: 1, fieldId: 1, createdAt: -1 });
FieldRecommendationSchema.index({ recommendationId: 1 });

export default mongoose.model<IFieldRecommendation>(
  'FieldRecommendation',
  FieldRecommendationSchema
);
