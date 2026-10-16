import mongoose, { Schema, Document } from 'mongoose';

export interface IHistoricalWeather extends Document {
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  elevation: number;
  timezone: string;
  timezoneAbbreviation: string;
  granularity: 'hourly' | 'daily';
  dateStr: string; // ISO date string: YYYY-MM-DD or YYYY-MM-DDTHH:mm
  timestamp: Date;

  // Hourly measurements
  temperature_2m?: number;
  relative_humidity_2m?: number;
  et0_fao_evapotranspiration?: number;

  // Daily summary measurements
  temperature_2m_mean?: number;
  temperature_2m_max?: number;
  temperature_2m_min?: number;
  precipitation_sum?: number;

  // Provenance and Data Quality
  source: string; // 'open-meteo-reanalysis'
  dataType: string; // 'historical_reanalysis_estimate'
  sourceFile: string;
  importedAt: Date;
}

const HistoricalWeatherSchema: Schema = new Schema(
  {
    locationName: { type: String, required: true, default: 'Thanjavur, Tamil Nadu' },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    elevation: { type: Number, default: 59.0 },
    timezone: { type: String, default: 'GMT' },
    timezoneAbbreviation: { type: String, default: 'GMT' },
    granularity: {
      type: String,
      enum: ['hourly', 'daily'],
      required: true,
      index: true,
    },
    dateStr: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },

    // Hourly
    temperature_2m: { type: Number, min: -10, max: 60 },
    relative_humidity_2m: { type: Number, min: 0, max: 100 },
    et0_fao_evapotranspiration: { type: Number, min: 0 },

    // Daily
    temperature_2m_mean: { type: Number, min: -10, max: 60 },
    temperature_2m_max: { type: Number, min: -10, max: 60 },
    temperature_2m_min: { type: Number, min: -10, max: 60 },
    precipitation_sum: { type: Number, min: 0 },

    // Provenance
    source: { type: String, required: true, default: 'open-meteo-reanalysis' },
    dataType: {
      type: String,
      required: true,
      default: 'historical_reanalysis_estimate',
    },
    sourceFile: { type: String, required: true },
    importedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Idempotent compound unique index: importing the same coordinates, granularity, and date replaces/skips duplicates
HistoricalWeatherSchema.index(
  { 'coordinates.latitude': 1, 'coordinates.longitude': 1, granularity: 1, dateStr: 1 },
  { unique: true }
);

HistoricalWeatherSchema.index({ timestamp: -1, granularity: 1 });

export default mongoose.model<IHistoricalWeather>('HistoricalWeather', HistoricalWeatherSchema);
