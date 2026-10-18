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
    | 'MONITOR_OPTIMAL'
    | 'INSUFFICIENT_DATA';
  actionLabel: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  supportingObservations: Record<string, any>;
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
    actionTaken:
      | 'irrigated'
      | 'postponed'
      | 'inspected'
      | 'dismissed'
      | 'accepted'
      | 'rejected'
      | 'requested_review';
    recordedAt: Date;
    notes?: string;
    actorId?: string;
    actorName?: string;
  };
  followUpEvaluation?: {
    evaluatedAt: Date;
    subsequentReading: Record<string, any>;
    conditionMet: boolean;
    status:
      | 'achieved'
      | 'partially_achieved'
      | 'not_achieved'
      | 'insufficient_evidence'
      | 'improved'
      | 'insufficient_change'
      | 'worsened'
      | 'pending';
    observedDelta: string;
    explanation: string;
  };
  agronomistReview?: {
    reviewedBy: string;
    reviewerName: string;
    reviewedAt: Date;
    status: 'endorsed' | 'revision_requested' | 'inspection_required';
    notes: string;
  };
  ruleVersion?: string;
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
    ruleVersion: { type: String, default: 'v2.1-QUANTEX-FAO56' },
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
        'INSUFFICIENT_DATA',
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
        enum: [
          'irrigated',
          'postponed',
          'inspected',
          'dismissed',
          'accepted',
          'rejected',
          'requested_review',
        ],
      },
      recordedAt: { type: Date },
      notes: { type: String },
      actorId: { type: String },
      actorName: { type: String },
    },
    followUpEvaluation: {
      evaluatedAt: { type: Date },
      subsequentReading: { type: Schema.Types.Mixed },
      conditionMet: { type: Boolean },
      status: {
        type: String,
        enum: [
          'achieved',
          'partially_achieved',
          'not_achieved',
          'insufficient_evidence',
          'improved',
          'insufficient_change',
          'worsened',
          'pending',
        ],
      },
      observedDelta: { type: String },
      explanation: { type: String },
    },
    agronomistReview: {
      reviewedBy: { type: String },
      reviewerName: { type: String },
      reviewedAt: { type: Date },
      status: {
        type: String,
        enum: ['endorsed', 'revision_requested', 'inspection_required'],
      },
      notes: { type: String },
    },
  },
  { timestamps: true }
);

FieldRecommendationSchema.index({ userId: 1, fieldId: 1, createdAt: -1 });
FieldRecommendationSchema.index({ fieldId: 1, createdAt: -1 });
FieldRecommendationSchema.index({ recommendationId: 1 });

export default mongoose.model<IFieldRecommendation>(
  'FieldRecommendation',
  FieldRecommendationSchema
);
