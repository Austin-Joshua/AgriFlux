import mongoose, { Schema, Document } from 'mongoose';

export interface ISoilObservation extends Document {
  regionName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  sampleDate: Date;
  samplingDepthCm: {
    top: number;
    bottom: number;
  };
  sampleId?: string;
  testMethod:
    | 'soil_health_card'
    | 'laboratory_wet_chemistry'
    | 'soilgrids_gridded_estimate'
    | 'in_situ_sensor_estimate';
  source: string;
  laboratoryName?: string;
  ph: number;
  electricalConductivityDsm?: number;
  organicCarbonPct?: number;
  availableNitrogenKgHa?: number;
  availablePhosphorusKgHa?: number;
  availablePotassiumKgHa?: number;
  soilTexture?: string; // e.g. 'Clay Loam', 'Alluvial Clay'
  secondaryNutrients?: {
    sulfurPpm?: number;
    zincPpm?: number;
    boronPpm?: number;
    ironPpm?: number;
  };
  fertilityRating: 'low' | 'medium' | 'high' | 'optimal';
  dataType: 'soil_health_card_observation' | 'laboratory_soil_test' | 'gridded_soil_estimate';
  status: 'verified' | 'provisional' | 'estimated';
  importedAt: Date;
}

const SoilObservationSchema: Schema = new Schema<ISoilObservation>(
  {
    regionName: {
      type: String,
      required: true,
      default: 'Thanjavur, Tamil Nadu',
      trim: true,
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    sampleDate: {
      type: Date,
      required: true,
      index: true,
    },
    samplingDepthCm: {
      top: { type: Number, default: 0 },
      bottom: { type: Number, default: 15 },
    },
    sampleId: {
      type: String,
      trim: true,
    },
    testMethod: {
      type: String,
      enum: [
        'soil_health_card',
        'laboratory_wet_chemistry',
        'soilgrids_gridded_estimate',
        'in_situ_sensor_estimate',
      ],
      default: 'soil_health_card',
    },
    source: {
      type: String,
      required: true,
      default: 'Government of India Soil Health Card (ICAR-TNAU)',
    },
    laboratoryName: {
      type: String,
      default: 'District Soil Testing Laboratory, Thanjavur',
    },
    ph: {
      type: Number,
      required: true,
      min: 3.0,
      max: 11.0,
    },
    electricalConductivityDsm: {
      type: Number,
      min: 0.0,
      max: 20.0,
    },
    organicCarbonPct: {
      type: Number,
      min: 0.01,
      max: 10.0,
    },
    availableNitrogenKgHa: {
      type: Number,
      min: 10.0,
      max: 1000.0,
    },
    availablePhosphorusKgHa: {
      type: Number,
      min: 1.0,
      max: 300.0,
    },
    availablePotassiumKgHa: {
      type: Number,
      min: 10.0,
      max: 1500.0,
    },
    soilTexture: {
      type: String,
      default: 'Clay Loam (Alluvial Delta)',
    },
    secondaryNutrients: {
      sulfurPpm: Number,
      zincPpm: Number,
      boronPpm: Number,
      ironPpm: Number,
    },
    fertilityRating: {
      type: String,
      enum: ['low', 'medium', 'high', 'optimal'],
      default: 'medium',
    },
    dataType: {
      type: String,
      enum: [
        'soil_health_card_observation',
        'laboratory_soil_test',
        'gridded_soil_estimate',
      ],
      default: 'soil_health_card_observation',
    },
    status: {
      type: String,
      enum: ['verified', 'provisional', 'estimated'],
      default: 'verified',
    },
    importedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index to prevent duplicate soil test entries
SoilObservationSchema.index(
  {
    'coordinates.latitude': 1,
    'coordinates.longitude': 1,
    sampleDate: 1,
    'samplingDepthCm.bottom': 1,
  },
  { unique: true }
);

export default mongoose.models.SoilObservation ||
  mongoose.model<ISoilObservation>('SoilObservation', SoilObservationSchema);
