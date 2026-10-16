import mongoose, { Schema, Document } from 'mongoose';

export interface ISatelliteObservation extends Document {
  regionName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  spatialResolutionMeters: number;
  tileId?: string; // e.g., 'T44NPM' (Thanjavur Sentinel-2 tile)

  // Satellite and sensor provenance
  constellation: string; // 'Copernicus'
  satellite: 'Sentinel-2A' | 'Sentinel-2B' | 'Copernicus Sentinel-2';
  instrument: string; // 'MSI'
  processingLevel: 'Level-2A' | 'Level-1C';
  productIdentifier: string;
  acquisitionDate: Date;

  // Derived Spectral Statistics (NDVI) — never store raw gigabyte rasters in MongoDB
  ndvi: {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
  };

  cloudCoveragePercentage: number;
  validPixelPercentage: number;
  processingMethod: string; // '(B08 - B04) / (B08 + B04)'
  bandSources: {
    redBand: string; // 'B04'
    nirBand: string; // 'B08'
    sceneClassificationBand?: string; // 'SCL'
  };

  vegetationHealth:
    | 'high_vigor'
    | 'moderate_vigor'
    | 'sparse_vegetation'
    | 'water_or_bare_soil'
    | 'cloud_obscured';

  dataType: string; // 'satellite_derived_spectral_index'
  status: 'observed' | 'estimated' | 'cloud_masked';
  importedAt: Date;
}

const SatelliteObservationSchema: Schema = new Schema(
  {
    regionName: { type: String, required: true, default: 'Thanjavur, Tamil Nadu' },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    spatialResolutionMeters: { type: Number, default: 10 },
    tileId: { type: String, default: 'T44NPM' },

    constellation: { type: String, default: 'Copernicus' },
    satellite: {
      type: String,
      enum: ['Sentinel-2A', 'Sentinel-2B', 'Copernicus Sentinel-2'],
      default: 'Copernicus Sentinel-2',
    },
    instrument: { type: String, default: 'MSI' },
    processingLevel: {
      type: String,
      enum: ['Level-2A', 'Level-1C'],
      default: 'Level-2A',
    },
    productIdentifier: { type: String, required: true },
    acquisitionDate: { type: Date, required: true, index: true },

    ndvi: {
      mean: { type: Number, required: true, min: -1.0, max: 1.0 },
      median: { type: Number, required: true, min: -1.0, max: 1.0 },
      min: { type: Number, required: true, min: -1.0, max: 1.0 },
      max: { type: Number, required: true, min: -1.0, max: 1.0 },
      stdDev: { type: Number, required: true, min: 0 },
    },

    cloudCoveragePercentage: { type: Number, default: 0, min: 0, max: 100 },
    validPixelPercentage: { type: Number, default: 100, min: 0, max: 100 },
    processingMethod: {
      type: String,
      default: 'Normalized Difference: (B08 - B04) / (B08 + B04)',
    },
    bandSources: {
      redBand: { type: String, default: 'B04' },
      nirBand: { type: String, default: 'B08' },
      sceneClassificationBand: { type: String, default: 'SCL' },
    },

    vegetationHealth: {
      type: String,
      enum: [
        'high_vigor',
        'moderate_vigor',
        'sparse_vegetation',
        'water_or_bare_soil',
        'cloud_obscured',
      ],
      default: 'moderate_vigor',
    },

    dataType: {
      type: String,
      default: 'satellite_derived_spectral_index',
      required: true,
    },
    status: {
      type: String,
      enum: ['observed', 'estimated', 'cloud_masked'],
      default: 'observed',
    },
    importedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SatelliteObservationSchema.index(
  { 'coordinates.latitude': 1, 'coordinates.longitude': 1, acquisitionDate: 1 },
  { unique: true }
);

SatelliteObservationSchema.index({ acquisitionDate: -1 });

export default mongoose.model<ISatelliteObservation>(
  'SatelliteObservation',
  SatelliteObservationSchema
);
