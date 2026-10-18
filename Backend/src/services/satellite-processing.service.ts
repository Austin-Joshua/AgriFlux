import SatelliteObservation, {
  ISatelliteObservation,
} from '../../../Database/Models/SatelliteObservation';
import { isDBConnected } from '../config/db';

export interface Sentinel2BandSample {
  pixelIndex: number;
  b04_red: number; // Sentinel-2 B04 (665 nm)
  b08_nir: number; // Sentinel-2 B08 (842 nm)
  scl_classification?: number; // Scene Classification Layer (SCL: 3=cloud shadow, 8-9=cloud, 10=cirrus)
}

export interface SatelliteIngestPayload {
  productIdentifier: string; // e.g. S2A_MSIL2A_20261014T050721_N0500_R019_T44NPM_20261014T083412
  acquisitionDate: string | Date;
  satellite?: 'Sentinel-2A' | 'Sentinel-2B' | 'Copernicus Sentinel-2';
  regionName?: string;
  latitude?: number;
  longitude?: number;
  spatialResolutionMeters?: number;
  tileId?: string;
  samples: Sentinel2BandSample[];
  reportedCloudCoveragePercentage?: number;
}

export interface NDVIStatistics {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  validPixelPercentage: number;
  cloudCoveragePercentage: number;
  vegetationHealth:
    | 'high_vigor'
    | 'moderate_vigor'
    | 'sparse_vegetation'
    | 'water_or_bare_soil'
    | 'cloud_obscured';
}

// In-memory buffer for development / demo mode
const memorySatelliteObservations: Map<string, any> = new Map();

export class SatelliteProcessingService {
  /**
   * Computes NDVI for a pixel using Sentinel-2 L2A Red (B04) and NIR (B08) bands.
   * Handles 0-10000 DN scaling, zero denominators, and invalid pixel boundaries.
   * Formula: NDVI = (NIR - RED) / (NIR + RED)
   */
  static calculatePixelNDVI(
    b04_red: number,
    b08_nir: number
  ): { ndvi: number | null; isValid: boolean } {
    // Check for null/NaN
    if (isNaN(b04_red) || isNaN(b08_nir)) {
      return { ndvi: null, isValid: false };
    }

    // Scale Sentinel-2 Digital Numbers (DN) if in 0-10000 range
    let redReflectance = b04_red;
    let nirReflectance = b08_nir;

    if (redReflectance > 1.0 || nirReflectance > 1.0) {
      redReflectance = redReflectance / 10000.0;
      nirReflectance = nirReflectance / 10000.0;
    }

    // Physical surface reflectance bounds check
    if (redReflectance < 0 || nirReflectance < 0) {
      return { ndvi: null, isValid: false };
    }

    const denominator = nirReflectance + redReflectance;
    if (denominator <= 0.0001) {
      // Avoid division by zero (water absorption or shadow)
      return { ndvi: 0.0, isValid: true };
    }

    const rawNdvi = (nirReflectance - redReflectance) / denominator;

    // Constrain to physical NDVI limits [-1.0, +1.0]
    if (rawNdvi < -1.0 || rawNdvi > 1.0) {
      return { ndvi: null, isValid: false };
    }

    return {
      ndvi: Math.round(rawNdvi * 1000) / 1000,
      isValid: true,
    };
  }

  /**
   * Processes a collection of Sentinel-2 band samples to compute aggregated NDVI statistics.
   * Filters clouds, calculates mean, median, min, max, standard deviation, and assigns vigor classification.
   */
  static processBandMatrix(samples: Sentinel2BandSample[], reportedCloudCover = 0): NDVIStatistics {
    if (!samples || samples.length === 0) {
      throw new Error('No pixel samples provided for Sentinel-2 NDVI calculation.');
    }
    if (samples.length > 2000) {
      throw new Error('Pixel sample batch exceeds maximum allowed limit (2000 samples).');
    }

    const validNdviValues: number[] = [];
    let cloudPixelCount = 0;

    for (const sample of samples) {
      // Scene Classification Layer (SCL) cloud filtering
      if (
        sample.scl_classification === 3 || // Cloud shadow
        sample.scl_classification === 8 || // Cloud medium probability
        sample.scl_classification === 9 || // Cloud high probability
        sample.scl_classification === 10 // Thin cirrus
      ) {
        cloudPixelCount++;
        continue;
      }

      const { ndvi, isValid } = this.calculatePixelNDVI(sample.b04_red, sample.b08_nir);
      if (isValid && ndvi !== null) {
        validNdviValues.push(ndvi);
      }
    }

    const totalSamples = samples.length;
    const computedCloudPct =
      totalSamples > 0 ? Math.round((cloudPixelCount / totalSamples) * 100) : reportedCloudCover;
    const cloudCoverage = Math.max(reportedCloudCover, computedCloudPct);

    if (validNdviValues.length === 0) {
      return {
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        validPixelPercentage: 0,
        cloudCoveragePercentage: cloudCoverage,
        vegetationHealth: 'cloud_obscured',
      };
    }

    // Sort for median calculation
    validNdviValues.sort((a, b) => a - b);

    const sum = validNdviValues.reduce((acc, val) => acc + val, 0);
    const mean = Math.round((sum / validNdviValues.length) * 1000) / 1000;

    const mid = Math.floor(validNdviValues.length / 2);
    const median =
      validNdviValues.length % 2 !== 0
        ? validNdviValues[mid]
        : Math.round(((validNdviValues[mid - 1] + validNdviValues[mid]) / 2) * 1000) / 1000;

    const min = validNdviValues[0];
    const max = validNdviValues[validNdviValues.length - 1];

    const variance =
      validNdviValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      validNdviValues.length;
    const stdDev = Math.round(Math.sqrt(variance) * 1000) / 1000;

    const validPct = Math.round((validNdviValues.length / totalSamples) * 100);

    // Classify agronomic vegetation vigor
    let vegetationHealth: NDVIStatistics['vegetationHealth'];
    if (cloudCoverage > 60) {
      vegetationHealth = 'cloud_obscured';
    } else if (mean >= 0.6) {
      vegetationHealth = 'high_vigor';
    } else if (mean >= 0.35) {
      vegetationHealth = 'moderate_vigor';
    } else if (mean >= 0.15) {
      vegetationHealth = 'sparse_vegetation';
    } else {
      vegetationHealth = 'water_or_bare_soil';
    }

    return {
      mean,
      median,
      min,
      max,
      stdDev,
      validPixelPercentage: validPct,
      cloudCoveragePercentage: cloudCoverage,
      vegetationHealth,
    };
  }

  /**
   * Ingests and stores a verified Sentinel-2 L2A observation summary into MongoDB
   */
  static async ingestObservation(payload: SatelliteIngestPayload) {
    const stats = this.processBandMatrix(
      payload.samples,
      payload.reportedCloudCoveragePercentage || 0
    );

    const acquisitionDate = new Date(payload.acquisitionDate);
    const latitude = payload.latitude || 10.790861;
    const longitude = payload.longitude || 79.098145;

    const record = {
      regionName: payload.regionName || 'Thanjavur, Tamil Nadu',
      coordinates: { latitude, longitude },
      spatialResolutionMeters: payload.spatialResolutionMeters || 10,
      tileId: payload.tileId || 'T44NPM',
      constellation: 'Copernicus',
      satellite: payload.satellite || 'Copernicus Sentinel-2',
      instrument: 'MSI',
      processingLevel: 'Level-2A',
      productIdentifier: payload.productIdentifier,
      acquisitionDate,
      ndvi: {
        mean: stats.mean,
        median: stats.median,
        min: stats.min,
        max: stats.max,
        stdDev: stats.stdDev,
      },
      cloudCoveragePercentage: stats.cloudCoveragePercentage,
      validPixelPercentage: stats.validPixelPercentage,
      processingMethod: 'Normalized Difference: (B08 - B04) / (B08 + B04)',
      bandSources: {
        redBand: 'B04',
        nirBand: 'B08',
        sceneClassificationBand: 'SCL',
      },
      vegetationHealth: stats.vegetationHealth,
      dataType: 'satellite_derived_spectral_index',
      status: stats.vegetationHealth === 'cloud_obscured' ? 'cloud_masked' : 'observed',
      importedAt: new Date(),
    };

    if (isDBConnected) {
      await SatelliteObservation.findOneAndUpdate(
        {
          'coordinates.latitude': latitude,
          'coordinates.longitude': longitude,
          acquisitionDate,
        },
        { $set: record },
        { upsert: true, new: true }
      );
    } else {
      memorySatelliteObservations.set(
        `${latitude}_${longitude}_${acquisitionDate.toISOString()}`,
        record
      );
    }

    return record;
  }

  /**
   * Queries satellite observations for a region.
   * Returns honest empty state if no Copernicus products have been imported yet.
   */
  static async queryObservations(params: { startDate?: string; endDate?: string; limit?: number }) {
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 10));

    if (isDBConnected) {
      const filter: Record<string, any> = {};
      if (params.startDate || params.endDate) {
        filter.acquisitionDate = {};
        if (params.startDate) filter.acquisitionDate.$gte = new Date(params.startDate);
        if (params.endDate) filter.acquisitionDate.$lte = new Date(params.endDate);
      }

      const records = await SatelliteObservation.find(filter)
        .sort({ acquisitionDate: -1 })
        .limit(limit)
        .lean();

      if (records.length > 0) {
        return {
          source: 'copernicus_sentinel2_l2a',
          isDataAvailable: true,
          count: records.length,
          data: records,
        };
      }
    }

    // Memory buffer check
    let list = Array.from(memorySatelliteObservations.values());
    if (params.startDate) {
      const start = new Date(params.startDate);
      list = list.filter((r) => new Date(r.acquisitionDate) >= start);
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      list = list.filter((r) => new Date(r.acquisitionDate) <= end);
    }

    if (list.length > 0) {
      list.sort(
        (a, b) => new Date(b.acquisitionDate).getTime() - new Date(a.acquisitionDate).getTime()
      );
      return {
        source: 'copernicus_sentinel2_l2a',
        isDataAvailable: true,
        count: list.length,
        data: list.slice(0, limit),
      };
    }

    // Honest empty state when no raster has been ingested
    return {
      source: 'copernicus_sentinel2_l2a',
      isDataAvailable: false,
      message:
        'No Copernicus Sentinel-2 Level-2A raster product has been ingested for the Thanjavur pilot area yet. Import a Sentinel-2 L2A B04/B08 raster product using the satellite ingestion pipeline to calculate real-world NDVI observations.',
      targetRegion: 'Thanjavur, Tamil Nadu (Tile T44NPM)',
      requiredBands: ['B04 (Red, 665nm)', 'B08 (NIR, 842nm)', 'SCL (Scene Classification)'],
      count: 0,
      data: [],
    };
  }
}
