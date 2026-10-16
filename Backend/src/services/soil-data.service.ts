import mongoose from 'mongoose';
import SoilObservation, { ISoilObservation } from '../../../Database/Models/SoilObservation';
import { isDBConnected } from '../config/db';

export interface SoilIngestPayload {
  regionName?: string;
  latitude: number;
  longitude: number;
  sampleDate: string;
  samplingDepthTopCm?: number;
  samplingDepthBottomCm?: number;
  sampleId?: string;
  testMethod?:
    | 'soil_health_card'
    | 'laboratory_wet_chemistry'
    | 'soilgrids_gridded_estimate'
    | 'regional_survey_benchmark';
  source?: string;
  laboratoryName?: string;
  ph: number;
  electricalConductivityDsm?: number;
  organicCarbonPct?: number;
  availableNitrogenKgHa?: number;
  availablePhosphorusKgHa?: number;
  availablePotassiumKgHa?: number;
  soilTexture?: string;
  secondaryNutrients?: {
    sulfurPpm?: number;
    zincPpm?: number;
    boronPpm?: number;
    ironPpm?: number;
  };
  dataType?:
    | 'soil_health_card_observation'
    | 'laboratory_soil_test'
    | 'gridded_soil_estimate'
    | 'illustrative_regional_benchmark';
  status?: 'verified' | 'provisional' | 'estimated' | 'benchmark';
  notes?: string;
}

// In-memory store for development / demo mode
const memorySoilObservations: Map<string, any> = new Map();

// Illustrative regional agro-ecological benchmark for Thanjavur Cauvery Delta (TNAU/ICAR survey)
// Relabeled: NOT a verified in-situ measurement of an individual farm
const THANJAVUR_BENCHMARK_SOIL = {
  regionName: 'Thanjavur, Tamil Nadu (Cauvery Delta Basin)',
  coordinates: { latitude: 10.790861, longitude: 79.098145 },
  sampleDate: new Date('2024-02-15T00:00:00.000Z'),
  samplingDepthCm: { top: 0, bottom: 15 },
  sampleId: 'BENCHMARK-TN-TAN-ALLUVIAL',
  testMethod: 'regional_survey_benchmark' as const,
  source: 'Regional Soil Survey Reference (ICAR-TNAU Published Survey) [ILLUSTRATIVE BENCHMARK]',
  laboratoryName: 'Regional Cauvery Delta Agro-Ecological Survey Benchmark (TNAU/ICAR)',
  ph: 6.4, // Slightly Acidic - optimal for wetland rice
  electricalConductivityDsm: 0.38, // Non-saline (< 1.0 dS/m)
  organicCarbonPct: 0.62, // Medium (0.50% - 0.75%)
  availableNitrogenKgHa: 195.0, // Low-Medium (< 280 kg/ha requires basal N)
  availablePhosphorusKgHa: 22.4, // Medium (11 - 25 kg/ha)
  availablePotassiumKgHa: 245.0, // Medium-High (110 - 280 kg/ha)
  soilTexture: 'Clay Loam (Alluvial Delta Sediment)',
  secondaryNutrients: {
    zincPpm: 0.82,
    ironPpm: 6.4,
    boronPpm: 0.45,
  },
  fertilityRating: 'medium' as const,
  dataType: 'illustrative_regional_benchmark' as const,
  status: 'benchmark' as const,
  notes:
    'Illustrative regional agro-ecological benchmark for Cauvery Delta alluvial rice soils based on published ICAR-TNAU regional soil surveys. NOT an in-situ certified measurement of an individual farm boundary.',
  importedAt: new Date(),
};

// Seed in-memory store with benchmark
memorySoilObservations.set(
  `10.790861_79.098145_${THANJAVUR_BENCHMARK_SOIL.sampleDate.toISOString()}`,
  THANJAVUR_BENCHMARK_SOIL
);

export class SoilDataService {
  /**
   * Ingests a verified soil test / Soil Health Card record
   */
  static async ingestSoilRecord(payload: SoilIngestPayload) {
    // Range validation
    if (payload.ph < 3.5 || payload.ph > 10.5) {
      throw new Error(`Soil pH value ${payload.ph} out of physical range [3.5, 10.5].`);
    }

    if (
      payload.electricalConductivityDsm !== undefined &&
      (payload.electricalConductivityDsm < 0 || payload.electricalConductivityDsm > 15)
    ) {
      throw new Error(
        `Electrical conductivity ${payload.electricalConductivityDsm} dS/m out of range [0, 15].`
      );
    }

    if (
      payload.organicCarbonPct !== undefined &&
      (payload.organicCarbonPct < 0.01 || payload.organicCarbonPct > 8.0)
    ) {
      throw new Error(`Organic Carbon ${payload.organicCarbonPct}% out of range [0.01, 8.0].`);
    }

    // Determine fertility rating
    let fertilityRating: 'low' | 'medium' | 'high' | 'optimal' = 'medium';
    const oc = payload.organicCarbonPct || 0.6;
    const n = payload.availableNitrogenKgHa || 200;
    if (oc < 0.4 || n < 150) {
      fertilityRating = 'low';
    } else if (oc > 0.75 && n > 280) {
      fertilityRating = 'high';
    }

    const sampleDate = new Date(payload.sampleDate);
    const record = {
      regionName: payload.regionName || 'Thanjavur, Tamil Nadu',
      coordinates: {
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
      sampleDate,
      samplingDepthCm: {
        top: payload.samplingDepthTopCm || 0,
        bottom: payload.samplingDepthBottomCm || 15,
      },
      sampleId: payload.sampleId || `SHC-${Date.now().toString().slice(-6)}`,
      testMethod: payload.testMethod || 'soil_health_card',
      source: payload.source || 'Soil Health Card (ICAR-TNAU)',
      laboratoryName: payload.laboratoryName || 'District Soil Testing Laboratory',
      ph: payload.ph,
      electricalConductivityDsm: payload.electricalConductivityDsm ?? 0.35,
      organicCarbonPct: payload.organicCarbonPct ?? 0.6,
      availableNitrogenKgHa: payload.availableNitrogenKgHa ?? 200,
      availablePhosphorusKgHa: payload.availablePhosphorusKgHa ?? 22,
      availablePotassiumKgHa: payload.availablePotassiumKgHa ?? 240,
      soilTexture: payload.soilTexture || 'Clay Loam',
      secondaryNutrients: payload.secondaryNutrients,
      fertilityRating,
      dataType:
        payload.dataType ||
        (payload.testMethod === 'laboratory_wet_chemistry'
          ? ('laboratory_soil_test' as const)
          : payload.testMethod === 'regional_survey_benchmark'
            ? ('illustrative_regional_benchmark' as const)
            : ('soil_health_card_observation' as const)),
      status:
        payload.status ||
        (payload.testMethod === 'regional_survey_benchmark'
          ? ('benchmark' as const)
          : ('verified' as const)),
      notes:
        payload.notes ||
        (payload.testMethod === 'regional_survey_benchmark'
          ? 'Illustrative regional benchmark. Not an individual farm measurement.'
          : undefined),
      importedAt: new Date(),
    };

    const isConnected = isDBConnected || mongoose.connection.readyState === 1;
    if (isConnected) {
      await SoilObservation.findOneAndUpdate(
        {
          'coordinates.latitude': payload.latitude,
          'coordinates.longitude': payload.longitude,
          sampleDate,
          'samplingDepthCm.bottom': record.samplingDepthCm.bottom,
        },
        { $set: record },
        { upsert: true, returnDocument: 'after' }
      );
    }

    const key = `${payload.latitude}_${payload.longitude}_${sampleDate.toISOString()}`;
    memorySoilObservations.set(key, record);

    return record;
  }

  /**
   * Retrieves the latest verified soil test profile for a location
   */
  static async getLatestSoilProfile(coordinates?: { latitude: number; longitude: number }) {
    const isConnected = isDBConnected || mongoose.connection.readyState === 1;
    if (isConnected) {
      const query: Record<string, any> = {};
      if (coordinates) {
        // Approximate coordinate match (within ~0.05 degrees)
        query['coordinates.latitude'] = {
          $gte: coordinates.latitude - 0.05,
          $lte: coordinates.latitude + 0.05,
        };
        query['coordinates.longitude'] = {
          $gte: coordinates.longitude - 0.05,
          $lte: coordinates.longitude + 0.05,
        };
      }

      const latest = await SoilObservation.findOne(query).sort({ sampleDate: -1 }).lean();
      if (latest) {
        return {
          isAvailable: true,
          isBenchmark: latest.status === 'benchmark',
          data: latest,
        };
      }
    }

    // Check memory store
    if (memorySoilObservations.size > 0) {
      const list = Array.from(memorySoilObservations.values());
      list.sort((a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime());
      const selected = list[0];
      return {
        isAvailable: true,
        isBenchmark: selected.status === 'benchmark',
        data: selected,
      };
    }

    // Default to illustrative regional benchmark
    return {
      isAvailable: true,
      isBenchmark: true,
      data: THANJAVUR_BENCHMARK_SOIL,
      disclaimer:
        'Illustrative regional agro-ecological benchmark for Cauvery Delta alluvial rice soils. NOT an in-situ certified measurement of an individual farm boundary.',
    };
  }
}
