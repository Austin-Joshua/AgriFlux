import crypto from 'crypto';
import FieldRecommendation, {
  IFieldRecommendation,
} from '../../../Database/Models/FieldRecommendation';
import IoTReading from '../../../Database/Models/IoTReading';
import { isDBConnected } from '../config/db';
import { env } from '../config/env';
import { WeatherIngestionService } from './weather-ingestion.service';
import { SatelliteProcessingService } from './satellite-processing.service';
import { SoilDataService } from './soil-data.service';
import { CropStatisticsService } from './crop-statistics.service';
import { BlockchainService } from './blockchain.service';
import {
  TELEMETRY_FRESHNESS_WINDOW_MINUTES,
  evaluateTelemetryQuality,
  TelemetryQualityStatus,
} from '../types/telemetry';
import { getInMemoryIoTReading } from '../controllers/iot.controller';

export interface FieldContextInput {
  fieldId?: string;
  deviceId?: string;
  fieldName?: string;
  cropType?: string;
  cropStage?: string;
  soilMoistureOverride?: number | null;
  soilPhOverride?: number;
  nitrogenOverride?: number;
  phosphorusOverride?: number;
  potassiumOverride?: number;
  forecastRainMm?: number;
  forecastRainProbability?: number;
  ambientTemp?: number;
  humidity?: number;
  latitude?: number;
  longitude?: number;
  forceRefresh?: boolean;
  reuseActive?: boolean;
  allowSimulation?: boolean;
  isSimulated?: boolean;
}

// In-memory cache for demo mode
const memoryRecommendations: Record<string, any> = {};

export class FieldIntelligenceService {
  /**
   * Generates a structured, evidence-based agronomic recommendation
   * by dynamically integrating:
   * 1. In-situ capacitive IoT soil moisture & temperature telemetry
   * 2. Open-Meteo ERA5-Land historical weather reanalysis & recent rainfall/ET0
   * 3. Copernicus Sentinel-2 L2A satellite-derived NDVI canopy vigor
   * 4. Government of India Soil Health Card chemical fertility profiles
   * 5. Directorate of Economics & Statistics (DES) contextual crop production baselines
   */
  static async generateRecommendation(userId: string, context: FieldContextInput): Promise<any> {
    const fieldId = context.fieldId || 'field-01';
    const fieldName = context.fieldName || 'North Acre Parcel A';
    const cropType = context.cropType || 'Rice';
    const cropStage = context.cropStage || 'Vegetative (Tillering)';
    const latitude = context.latitude || 10.790861;
    const longitude = context.longitude || 79.098145;

    // --- 0. STRICT INPUT VALIDATION ---
    if (context.soilPhOverride !== undefined && context.soilPhOverride !== null) {
      const ph = Number(context.soilPhOverride);
      if (isNaN(ph) || !isFinite(ph) || ph < 0 || ph > 14) {
        const err: any = new Error(
          `Invalid soil pH override: "${context.soilPhOverride}". Must be a valid numeric pH in physical range [0, 14].`
        );
        err.statusCode = 400;
        throw err;
      }
    }
    if (context.nitrogenOverride !== undefined && context.nitrogenOverride !== null) {
      const n = Number(context.nitrogenOverride);
      if (isNaN(n) || !isFinite(n) || n < 0 || n > 2000) {
        const err: any = new Error(
          `Invalid soil nitrogen override: "${context.nitrogenOverride}". Must be a non-negative numeric value [0, 2000] kg/ha.`
        );
        err.statusCode = 400;
        throw err;
      }
    }
    if (context.phosphorusOverride !== undefined && context.phosphorusOverride !== null) {
      const p = Number(context.phosphorusOverride);
      if (isNaN(p) || !isFinite(p) || p < 0 || p > 2000) {
        const err: any = new Error(
          `Invalid soil phosphorus override: "${context.phosphorusOverride}". Must be a non-negative numeric value [0, 2000] kg/ha.`
        );
        err.statusCode = 400;
        throw err;
      }
    }
    if (context.potassiumOverride !== undefined && context.potassiumOverride !== null) {
      const k = Number(context.potassiumOverride);
      if (isNaN(k) || !isFinite(k) || k < 0 || k > 2000) {
        const err: any = new Error(
          `Invalid soil potassium override: "${context.potassiumOverride}". Must be a non-negative numeric value [0, 2000] kg/ha.`
        );
        err.statusCode = 400;
        throw err;
      }
    }
    if (context.forecastRainMm !== undefined && context.forecastRainMm !== null) {
      const r = Number(context.forecastRainMm);
      if (isNaN(r) || !isFinite(r) || r < 0 || r > 1000) {
        const err: any = new Error(
          `Invalid forecast rainfall override: "${context.forecastRainMm}". Must be a non-negative numeric value [0, 1000] mm.`
        );
        err.statusCode = 400;
        throw err;
      }
    }
    if (context.forecastRainProbability !== undefined && context.forecastRainProbability !== null) {
      const prob = Number(context.forecastRainProbability);
      if (isNaN(prob) || !isFinite(prob) || prob < 0 || prob > 100) {
        const err: any = new Error(
          `Invalid forecast rain probability: "${context.forecastRainProbability}". Must be in percentage range [0, 100].`
        );
        err.statusCode = 400;
        throw err;
      }
    }
    if (context.ambientTemp !== undefined && context.ambientTemp !== null) {
      const t = Number(context.ambientTemp);
      if (isNaN(t) || !isFinite(t) || t < -30 || t > 70) {
        const err: any = new Error(
          `Invalid ambient temperature: "${context.ambientTemp}". Must be in plausible range [-30, 70] °C.`
        );
        err.statusCode = 400;
        throw err;
      }
    }
    if (context.humidity !== undefined && context.humidity !== null) {
      const h = Number(context.humidity);
      if (isNaN(h) || !isFinite(h) || h < 0 || h > 100) {
        const err: any = new Error(
          `Invalid relative humidity: "${context.humidity}". Must be in percentage range [0, 100].`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // --- 1. SENSOR TELEMETRY ACQUISITION (Scoped by field and device) ---
    let latestSensor: any;
    if (isDBConnected) {
      try {
        const sensorFilter: any = {
          $or: [
            { fieldId: fieldId },
            ...(context.deviceId ? [{ deviceId: context.deviceId }] : []),
            ...(fieldId === 'field-01'
              ? [{ deviceId: 'esp32-node-01', fieldId: { $in: [null, undefined, 'field-01'] } }]
              : []),
          ],
        };
        latestSensor = await IoTReading.findOne(sensorFilter).sort({ createdAt: -1 });
      } catch {
        latestSensor = null;
      }
    } else {
      latestSensor = getInMemoryIoTReading(fieldId, context.deviceId);
    }

    const now = Date.now();

    // --- 0. REUSE ACTIVE RECOMMENDATION IF REQUESTED ---
    if (context.reuseActive && !context.forceRefresh) {
      if (isDBConnected) {
        try {
          const activeRec = await FieldRecommendation.findOne({
            userId,
            fieldId,
            createdAt: { $gte: new Date(now - 30 * 60 * 1000) },
          }).sort({ createdAt: -1 });
          if (activeRec) return activeRec;
        } catch {
          /* fallback to memory */
        }
      }

      const activeMem = Object.values(memoryRecommendations)
        .filter(
          (r) =>
            r.userId === userId &&
            r.fieldId === fieldId &&
            now - new Date(r.createdAt).getTime() < 30 * 60 * 1000
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      if (activeMem) return activeMem;
    }

    let sensorMoisture: number | null | undefined;
    let sensorTemp: number | null | undefined;
    let sensorHumidity: number | null | undefined;
    let sensorSource: string | undefined;
    let sensorSourceType: string | undefined;
    let sensorQualityStatus: TelemetryQualityStatus | string;
    let sensorProvenance: 'measured' | 'simulated' | 'missing';
    let freshnessMinutes: number;
    let isStale: boolean;
    let stalenessReason: string | undefined;

    if (context.soilMoistureOverride !== undefined) {
      if (context.soilMoistureOverride === null) {
        sensorMoisture = null;
        sensorSource = 'missing_telemetry';
        sensorSourceType = 'iot_capacitive_probe';
        sensorQualityStatus = 'missing';
        sensorProvenance = 'missing';
        freshnessMinutes = -1;
        isStale = true;
        stalenessReason = 'Operator explicit null telemetry override.';
      } else {
        const rawMoist = Number(context.soilMoistureOverride);
        if (isNaN(rawMoist) || !isFinite(rawMoist) || rawMoist < 0 || rawMoist > 100) {
          const err: any = new Error(
            `Invalid soil moisture override: "${context.soilMoistureOverride}". Must be a valid numeric percentage in physical range [0, 100].`
          );
          err.statusCode = 400;
          throw err;
        }
        sensorMoisture = Math.round(rawMoist * 10) / 10;
        sensorSource = 'manual_operator_input';
        sensorSourceType = 'calibrated_field_measurement';
        sensorQualityStatus = 'fresh';
        sensorProvenance = 'measured';
        freshnessMinutes = 0;
        isStale = false;
      }
    } else if (context.isSimulated) {
      // Explicit simulation requested by operator or test harness
      const fieldDefaultMoisture =
        fieldId === 'field-01'
          ? 24 // North Acre Rice: Triggers targeted irrigation advisory
          : fieldId === 'field-02'
            ? 52 // South Terrace Maize: Optimal moisture
            : fieldId === 'field-03'
              ? 78 // Riverside Sugarcane: High moisture / postponed cycle
              : 38;
      sensorMoisture = fieldDefaultMoisture;
      sensorTemp = 28;
      sensorHumidity = 62;
      sensorSource = 'iot_simulator';
      sensorSourceType = 'simulated_calibration_profile';
      sensorQualityStatus = 'simulated';
      sensorProvenance = 'simulated';
      freshnessMinutes = 2;
      isStale = false;
    } else if (latestSensor) {
      const assessment = evaluateTelemetryQuality(latestSensor);
      sensorQualityStatus = assessment.quality;
      freshnessMinutes = assessment.freshnessMinutes;
      isStale = assessment.isStale;
      stalenessReason = assessment.reason;

      if (assessment.quality === 'invalid') {
        sensorMoisture = null;
        sensorSource = 'invalid_telemetry';
        sensorSourceType = 'iot_capacitive_probe';
        sensorProvenance = 'missing';
      } else if (assessment.quality === 'stale') {
        sensorMoisture = Number(latestSensor.moisture);
        sensorTemp = latestSensor.temperature;
        sensorHumidity = latestSensor.humidity;
        sensorSource = latestSensor.isSimulated ? 'iot_simulator' : 'esp32_hardware';
        sensorSourceType = 'iot_capacitive_probe';
        sensorProvenance = latestSensor.isSimulated ? 'simulated' : 'measured';
      } else if (assessment.quality === 'simulated') {
        sensorMoisture = Number(latestSensor.moisture);
        sensorTemp = latestSensor.temperature;
        sensorHumidity = latestSensor.humidity;
        sensorSource = 'iot_simulator';
        sensorSourceType = 'simulated_calibration_profile';
        sensorProvenance = 'simulated';
      } else {
        // Fresh physical telemetry
        sensorMoisture = Number(latestSensor.moisture);
        sensorTemp = latestSensor.temperature;
        sensorHumidity = latestSensor.humidity;
        sensorSource = 'esp32_hardware';
        sensorSourceType = 'iot_capacitive_probe';
        sensorProvenance = 'measured';
      }
    } else if (context.allowSimulation || context.isSimulated) {
      // Explicit simulation mode permitted only when requested
      const fieldDefaultMoisture =
        fieldId === 'field-01'
          ? 24 // North Acre Rice: Triggers targeted irrigation advisory
          : fieldId === 'field-02'
            ? 52 // South Terrace Maize: Optimal moisture
            : fieldId === 'field-03'
              ? 78 // Riverside Sugarcane: High moisture / postponed cycle
              : 38;
      sensorMoisture = fieldDefaultMoisture;
      sensorTemp = 28;
      sensorHumidity = 62;
      sensorSource = 'iot_simulator';
      sensorSourceType = 'simulated_calibration_profile';
      sensorQualityStatus = 'simulated';
      sensorProvenance = 'simulated';
      freshnessMinutes = 2;
      isStale = false;
    } else {
      // Normal production path: No physical reading and no simulation flag -> trigger INSUFFICIENT_DATA gate
      sensorMoisture = null;
      sensorSource = 'missing_telemetry';
      sensorSourceType = 'iot_capacitive_probe';
      sensorQualityStatus = 'missing';
      sensorProvenance = 'missing';
      freshnessMinutes = -1;
      isStale = true;
      stalenessReason = 'No physical sensor telemetry or calibrated observation available.';
    }

    // --- 2. MULTI-SOURCE ENVIRONMENTAL DATA INGESTION ---
    // A. Weather reanalysis (recent 3 days context)
    let recent3dRainfallMm = 0;
    let recentMeanET0 = 4.2;
    const weatherSource = 'Open-Meteo ERA5-Land Reanalysis';
    try {
      const weatherRes = await WeatherIngestionService.queryObservations({
        granularity: 'daily',
        limit: 3,
      });
      if (weatherRes.data && weatherRes.data.length > 0) {
        let rainSum = 0;
        let et0Sum = 0;
        let count = 0;
        for (const w of weatherRes.data) {
          // Normalize schema: precipitation_sum (daily model) or precipitationMm (legacy)
          const precipVal =
            w.precipitation_sum !== undefined
              ? Number(w.precipitation_sum)
              : w.precipitationMm !== undefined
                ? Number(w.precipitationMm)
                : NaN;
          if (!isNaN(precipVal) && precipVal >= 0) {
            rainSum += precipVal;
          }

          // Normalize schema: et0_fao_evapotranspiration (model) or et0EvapotranspirationMm (legacy)
          const et0Val =
            w.et0_fao_evapotranspiration !== undefined
              ? Number(w.et0_fao_evapotranspiration)
              : w.et0EvapotranspirationMm !== undefined
                ? Number(w.et0EvapotranspirationMm)
                : NaN;
          if (!isNaN(et0Val) && et0Val >= 0) {
            et0Sum += et0Val;
            count++;
          }
        }
        recent3dRainfallMm = Math.round(rainSum * 10) / 10;
        if (count > 0) recentMeanET0 = Math.round((et0Sum / count) * 10) / 10;
      }
    } catch {
      /* fallback to defaults */
    }

    // B. Satellite NDVI Observation
    let satelliteNdvi: number | null = null;
    let satelliteVigor = 'unknown';
    let satelliteCloudCover = 0;
    let satelliteAcquisitionDate: string | null = null;
    let satelliteAvailable = false;
    try {
      const satRes = await SatelliteProcessingService.queryObservations({ limit: 1 });
      if (satRes.isDataAvailable && satRes.data && satRes.data.length > 0) {
        const latestSat = satRes.data[0];
        satelliteNdvi = latestSat.ndvi.mean;
        satelliteVigor = latestSat.vegetationHealth;
        satelliteCloudCover = latestSat.cloudCoveragePercentage;
        satelliteAcquisitionDate = new Date(latestSat.acquisitionDate).toISOString();
        satelliteAvailable = true;
      }
    } catch {
      /* satellite pending */
    }

    // C. Soil Health Card Chemistry
    let soilPh = 6.4;
    let soilN = 195;
    let soilP = 22;
    let soilK = 245;
    let soilTexture = 'Clay Loam (Alluvial Delta)';
    let soilSource = 'Government of India Soil Health Card (ICAR-TNAU)';
    let soilQualityStatus = 'verified';
    try {
      const soilRes = await SoilDataService.getLatestSoilProfile({
        latitude,
        longitude,
      });
      if (soilRes.isAvailable && soilRes.data) {
        soilPh =
          context.soilPhOverride !== undefined ? Number(context.soilPhOverride) : soilRes.data.ph;
        soilN =
          context.nitrogenOverride !== undefined
            ? Number(context.nitrogenOverride)
            : soilRes.data.availableNitrogenKgHa || 195;
        soilP =
          context.phosphorusOverride !== undefined
            ? Number(context.phosphorusOverride)
            : soilRes.data.availablePhosphorusKgHa || 22;
        soilK =
          context.potassiumOverride !== undefined
            ? Number(context.potassiumOverride)
            : soilRes.data.availablePotassiumKgHa || 245;
        soilTexture = soilRes.data.soilTexture || soilTexture;
        soilSource = soilRes.data.source;
        soilQualityStatus = soilRes.data.status;
      }
    } catch {
      /* fallback to defaults */
    }

    // D. District Crop Production Statistics Baseline (DES APY)
    let districtYieldBaselineKgHa = 2700;
    let apySource = 'Directorate of Economics and Statistics (DES)';
    try {
      const apyRes = await CropStatisticsService.getDistrictYieldBaseline('Thanjavur', cropType);
      if (apyRes.isAvailable) {
        districtYieldBaselineKgHa = apyRes.yieldKgPerHectare;
        apySource = apyRes.source;
      }
    } catch {
      /* fallback baseline */
    }

    // Forecast weather inputs (manual overrides or estimated)
    const forecastRainMm =
      context.forecastRainMm !== undefined
        ? Number(context.forecastRainMm)
        : recent3dRainfallMm > 15
          ? 5
          : 0;
    const forecastRainProb =
      context.forecastRainProbability !== undefined
        ? Number(context.forecastRainProbability)
        : forecastRainMm > 10
          ? 70
          : 15;
    const ambientTemp = Number(context.ambientTemp) || sensorTemp || 28;
    const ambientHumidity = Number(context.humidity) || sensorHumidity || 60;

    // --- 3. DATA-QUALITY GATE: INSUFFICIENT DATA SAFETY CHECK ---
    // Physical root-zone telemetry must be fresh, finite, and verified to drive automated decisions.
    // Stale, missing, or invalid telemetry MUST trigger the safety gate and return INSUFFICIENT_DATA.
    if (
      sensorMoisture == null ||
      isStale ||
      sensorQualityStatus === 'stale' ||
      sensorQualityStatus === 'missing' ||
      sensorQualityStatus === 'invalid'
    ) {
      const recommendationId = 'rec_' + crypto.randomUUID().substring(0, 12);
      const isStaleCase = isStale || sensorQualityStatus === 'stale';
      const isInvalidCase = sensorQualityStatus === 'invalid';

      const insufficientResult = {
        recommendationId,
        userId,
        farmId: 'farm-01',
        fieldId,
        fieldName,
        cropType,
        cropStage,
        action: 'INSUFFICIENT_DATA' as const,
        actionLabel: isStaleCase
          ? `Data Quality Gate: Telemetry Stale (>${TELEMETRY_FRESHNESS_WINDOW_MINUTES}m) — Automated Irrigation Paused`
          : isInvalidCase
            ? 'Data Quality Gate: Telemetry Invalid or Out-of-Bounds'
            : 'Data Quality Gate: In-Situ Soil Moisture Reading Required',
        urgency: isStaleCase ? ('medium' as const) : ('low' as const),
        supportingObservations: {
          soilMoisture: {
            value: sensorMoisture ?? null,
            unit: '%',
            source: sensorSource,
            sourceType: sensorSourceType,
            dataQualityStatus: sensorQualityStatus,
            freshnessMinutes,
            isStale: true,
            provenance: sensorProvenance,
          },
          ambientTemp: { value: ambientTemp, unit: '°C', source: 'reanalysis_model_estimate' },
          humidity: { value: ambientHumidity, unit: '%', source: 'reanalysis_model_estimate' },
          forecastRainMm: {
            value: forecastRainMm,
            unit: 'mm',
            source: 'reanalysis_model_estimate',
          },
          satelliteNDVI: {
            value: satelliteNdvi,
            isAvailable: satelliteAvailable,
            vigor: satelliteVigor,
            source: 'Copernicus Sentinel-2 L2A',
          },
          soilHealthCard: {
            ph: soilPh,
            availableN: soilN,
            availableP: soilP,
            availableK: soilK,
            texture: soilTexture,
            source: soilSource,
          },
          districtYieldBaseline: {
            crop: cropType,
            district: 'Thanjavur',
            yieldKgHa: districtYieldBaselineKgHa,
            source: apySource,
          },
        },
        decisionRules: [
          isStaleCase
            ? `Safety Gate Triggered: Telemetry age (${freshnessMinutes}m) exceeds the strict ${TELEMETRY_FRESHNESS_WINDOW_MINUTES}-minute freshness boundary.`
            : isInvalidCase
              ? `Safety Gate Triggered: Sensor readings failed integrity validation (${stalenessReason || 'invalid timestamp/bounds'}).`
              : 'Safety Gate Triggered: No physical capacitive probe reading or calibrated field observation available.',
          'Operational Rule: Stale, missing, or invalid telemetry cannot safely drive automated physical pump actuation.',
        ],
        explanation: isStaleCase
          ? `Soil moisture telemetry is stale (${freshnessMinutes} minutes old, exceeding the ${TELEMETRY_FRESHNESS_WINDOW_MINUTES}-minute freshness threshold). AgriFlux safety interlocks withhold automated irrigation recommendations until current in-situ readings are synchronized, preventing accidental waterlogging or under-irrigation.`
          : isInvalidCase
            ? `Telemetry reading failed physical data sanity checks (${stalenessReason || 'invalid or future-dated'}). Actionable recommendations are withheld.`
            : 'AgriFlux enforces strict scientific data gates. While macro-reanalysis weather and orbital satellite NDVI provide regional environmental context, they do not replace direct root-zone moisture measurements for automated closed-loop irrigation.',
        assumptionsAndLimitations: [
          'Automated physical irrigation commands strictly prohibited until live sensor probe connects or operator provides calibrated manual reading.',
          'Macro-climate ERA5 reanalysis and Sentinel-2 NDVI provide contextual background but cannot override missing in-situ root-zone truth.',
        ],
        alternativeActions: [
          {
            action: 'Check ESP32 sensor battery and LoRaWAN/Wi-Fi connection',
            tradeOff: 'Restores real-time automated intelligence once fresh telemetry arrives.',
          },
          {
            action: 'Input manual calibrated soil moisture reading',
            tradeOff:
              'Enables immediate one-off agronomic calculation based on verified manual observation.',
          },
        ],
        expectedFollowUpCondition: {
          parameter: 'Sensor Connectivity',
          targetRange: `Online with fresh telemetry (< ${TELEMETRY_FRESHNESS_WINDOW_MINUTES}m old)`,
          timeframeHours: 1,
          description: 'Awaiting fresh sensor sync.',
        },
        ruleVersion: 'v2.1-QUANTEX-FAO56',
        createdAt: new Date(),
      };

      if (isDBConnected) {
        try {
          await FieldRecommendation.create(insufficientResult);
        } catch (err: any) {
          const dbErr: any = new Error(
            'Service Unavailable: Failed to persist field recommendation to durable storage. Please retry.'
          );
          dbErr.statusCode = 503;
          throw dbErr;
        }
      } else {
        if (env.NODE_ENV === 'production') {
          const dbErr: any = new Error(
            'Service Unavailable: Database connection required to persist field recommendations in production. Please retry.'
          );
          dbErr.statusCode = 503;
          throw dbErr;
        }
      }
      memoryRecommendations[recommendationId] = insufficientResult;
      return insufficientResult;
    }

    // --- 4. DOMAIN DECISION ENGINE (FAO-56 CROP WATER DEPLETION & ICAR NPK) ---
    const decisionRules: string[] = [];
    const assumptions: string[] = [
      `Assumes ${cropType} is at '${cropStage}' development phase in Thanjavur alluvial basin.`,
      `Telemetry source: ${sensorSource} (${sensorQualityStatus}, freshness: ${freshnessMinutes}m).`,
      `Weather context: Open-Meteo ERA5-Land (recent 3d rain: ${recent3dRainfallMm}mm, mean ET₀: ${recentMeanET0} mm/day).`,
      satelliteAvailable
        ? `Satellite Canopy Vigor: Copernicus Sentinel-2 L2A NDVI = ${satelliteNdvi} (${satelliteVigor}, cloud: ${satelliteCloudCover}%).`
        : 'Satellite canopy vigor pending raw L2A raster upload.',
      `Soil Chemistry: ${soilSource} (pH ${soilPh}, texture: ${soilTexture}).`,
      `District Benchmark: DES historical baseline for Thanjavur Rice is ${districtYieldBaselineKgHa} kg/ha.`,
    ];
    if (isStale) {
      assumptions.push(
        `⚠️ CAUTION: Sensor telemetry is stale (${freshnessMinutes}m old, exceeding 15-minute validity window). Recommendation is based on historical telemetry and may not reflect current root-zone conditions.`
      );
    }
    const alternatives: { action: string; tradeOff: string }[] = [];

    let action: IFieldRecommendation['action'];
    let actionLabel: string;
    let urgency: IFieldRecommendation['urgency'];
    let explanation: string;
    let expectedCondition = {
      parameter: 'Soil Moisture',
      targetRange: '45% – 60%',
      timeframeHours: 12,
      description: 'Soil moisture should stabilize within optimal root-zone capacity.',
    };

    // Rule 1: High moisture or impending precipitation
    if (
      sensorMoisture >= 75 ||
      (forecastRainMm >= 20 && forecastRainProb >= 65) ||
      recent3dRainfallMm >= 35
    ) {
      action = 'POSTPONE_IRRIGATION';
      actionLabel = 'Postpone Irrigation — High Moisture & Rain Inbound';
      urgency = sensorMoisture > 82 ? 'high' : 'medium';
      decisionRules.push(
        `Triggered by high soil moisture (${sensorMoisture}%), recent 3-day precipitation (${recent3dRainfallMm}mm), or forecast rain (${forecastRainMm}mm at ${forecastRainProb}%).`
      );
      if (sensorMoisture >= 75) {
        explanation = `Soil moisture is currently at ${sensorMoisture}%, which exceeds root-zone field capacity. Recent cumulative rainfall in Thanjavur is ${recent3dRainfallMm}mm. Applying additional water now risks root hypoxia, nutrient leaching, and increased sheath blight vulnerability.`;
      } else {
        explanation = `Soil moisture is at ${sensorMoisture}%. Significant precipitation is imminent (${forecastRainMm}mm forecast at ${forecastRainProb}%, with ${recent3dRainfallMm}mm recent rainfall). Irrigation is postponed to avoid surface waterlogging and fertilizer runoff.`;
      }
      alternatives.push({
        action: 'Inspect field drainage bunds',
        tradeOff: 'Prevents waterlogging if downpour exceeds forecast intensity.',
      });
      expectedCondition = {
        parameter: 'Soil Moisture',
        targetRange: '55% – 70%',
        timeframeHours: 24,
        description: 'Moisture expected to naturally draw down via evapotranspiration.',
      };
    }
    // Rule 2A: Critical root zone depletion with low forecast rain (< 5mm)
    else if (sensorMoisture < 28 && forecastRainMm < 5) {
      action = 'IRRIGATE_IMMEDIATE';
      actionLabel = 'Immediate Irrigation Required — Root Zone Deficit';
      urgency = sensorMoisture <= 20 ? 'critical' : 'high';
      decisionRules.push(
        `Triggered by soil moisture (${sensorMoisture}%) falling below FAO-56 Management Allowed Depletion (MAD 50% / threshold 28%) with high reference ET₀ (${recentMeanET0} mm/day) and negligible forecast rain (${forecastRainMm}mm).`
      );
      explanation = `Soil moisture has depleted to ${sensorMoisture}%, severely below the managed depletion threshold for ${cropType}. Atmospheric evapotranspiration demand (ET₀) is ${recentMeanET0} mm/day. Without timely hydration, crop transpiration stress will cause stomatal closure and vegetative yield stunting.`;
      alternatives.push({
        action: 'Postpone 6 hours until evening',
        tradeOff: 'Reduces evaporative losses by up to 25%, but prolongs daytime canopy wilting.',
      });
      expectedCondition = {
        parameter: 'Soil Moisture',
        targetRange: '48% – 65%',
        timeframeHours: 4,
        description: 'Moisture must rise above 48% within 4 hours post-irrigation.',
      };
    }
    // Rule 2B: Critical root zone depletion with light-to-moderate rain (5 <= rain < 15mm)
    else if (sensorMoisture < 28 && forecastRainMm >= 5 && forecastRainMm < 15) {
      action = 'IRRIGATE_LIGHT';
      actionLabel = 'Schedule Light Irrigation Cycle (10-15mm) — Deficit with Rain Offset';
      urgency = 'high';
      decisionRules.push(
        `Triggered by severe soil moisture depletion (${sensorMoisture}% < 28%) buffered by light forecast rain (${forecastRainMm}mm).`
      );
      explanation = `Soil moisture is critically depleted at ${sensorMoisture}%. While light-to-moderate rain (${forecastRainMm}mm) is forecast, it is insufficient on its own to replenish the root zone. A light 10–15mm cycle provides necessary hydration while leaving buffer capacity for incoming precipitation.`;
      alternatives.push({
        action: 'Hold irrigation for 12 hours to observe rainfall onset',
        tradeOff:
          'Avoids supplemental pumping if downpour exceeds forecast, but prolongs daytime moisture stress.',
      });
      expectedCondition = {
        parameter: 'Soil Moisture',
        targetRange: '45% – 60%',
        timeframeHours: 8,
        description: 'Moisture expected to recover to 45–60% with combined irrigation and rain.',
      };
    }
    // Rule 2C: Critical root zone depletion with substantial forecast rain (15 <= rain < 20mm)
    else if (sensorMoisture < 28 && forecastRainMm >= 15 && forecastRainMm < 20) {
      action = 'POSTPONE_IRRIGATION';
      actionLabel = 'Temporary Postpone — Inbound Rain Cushion with Drought Watch';
      urgency = 'medium';
      decisionRules.push(
        `Triggered by low soil moisture (${sensorMoisture}%) offset by substantial forecast rain (${forecastRainMm}mm at ${forecastRainProb}%).`
      );
      explanation = `Soil moisture is depleted (${sensorMoisture}%), but substantial precipitation (${forecastRainMm}mm) is anticipated. Postponing irrigation conserves resources. Actively monitor root-zone moisture; if rain fails to arrive within 12 hours, execute immediate irrigation.`;
      alternatives.push({
        action: 'Apply micro-drip pulse',
        tradeOff: 'Provides immediate relief to top 5cm root zone with minimal water volume.',
      });
      expectedCondition = {
        parameter: 'Soil Moisture',
        targetRange: '45% – 60%',
        timeframeHours: 12,
        description: 'Awaiting rainfall arrival to restore root zone.',
      };
    }
    // Rule 3A: Moderate depletion with low rain (< 10mm)
    else if (sensorMoisture < 42 && forecastRainMm < 10) {
      action = 'IRRIGATE_LIGHT';
      actionLabel = 'Schedule Light Irrigation Cycle (15mm)';
      urgency = 'medium';
      decisionRules.push(
        `Triggered by soil moisture (${sensorMoisture}%) reaching lower optimal bounds (42%) under moderate ET₀ (${recentMeanET0} mm/day).`
      );
      explanation = `Moisture levels are currently at ${sensorMoisture}%. A standard 15mm irrigation cycle will restore root-zone water content to ideal field capacity without oversaturating the ${soilTexture} profile.`;
      alternatives.push({
        action: 'Apply furrow or drip pulse',
        tradeOff: 'Higher water efficiency compared to flood irrigation.',
      });
      expectedCondition = {
        parameter: 'Soil Moisture',
        targetRange: '50% – 60%',
        timeframeHours: 6,
        description: 'Moisture expected to recover to 50–60% range.',
      };
    }
    // Rule 3B: Moderate depletion with sufficient rain (>= 10mm)
    else if (sensorMoisture < 42 && forecastRainMm >= 10) {
      action = 'POSTPONE_IRRIGATION';
      actionLabel = 'Postpone Irrigation — Anticipated Rain Replenishment';
      urgency = 'low';
      decisionRules.push(
        `Triggered by moderate soil moisture (${sensorMoisture}%) with sufficient forecast rain (${forecastRainMm}mm) to replenish root zone.`
      );
      explanation = `Moisture levels are moderate at ${sensorMoisture}%. Forecast precipitation of ${forecastRainMm}mm is sufficient to replenish root-zone capacity naturally without supplemental irrigation.`;
      alternatives.push({
        action: 'Check field bunds and drainage outlets',
        tradeOff: 'Ensures even water retention across parcel.',
      });
      expectedCondition = {
        parameter: 'Soil Moisture',
        targetRange: '50% – 65%',
        timeframeHours: 18,
        description: 'Rainfall expected to recharge root zone.',
      };
    }
    // Rule 4: Nitrogen replenishment during tillering
    else if (soilN < 180 && sensorMoisture >= 45 && cropStage.toLowerCase().includes('tillering')) {
      action = 'NUTRIENT_APPLICATION';
      actionLabel = 'Apply Basal/Top-Dress Nitrogen (Neem-Coated Urea)';
      urgency = 'medium';
      decisionRules.push(
        `Triggered by low soil Nitrogen (${soilN} kg/ha < optimal 200 kg/ha from Soil Health Card) during critical ${cropStage} stage.`
      );
      explanation = `Soil Health Card analysis identifies available nitrogen at ${soilN} kg/ha, which is deficient for high-tillering paddy in Thanjavur delta. Soil moisture is receptive (${sensorMoisture}%). Top-dressing with neem-coated urea at 35 kg/ha is recommended.`;
      alternatives.push({
        action: 'Apply vermicompost or green manure (Sesbania)',
        tradeOff: 'Organic slow-release nutrient restoration with lower leaching risk.',
      });
      expectedCondition = {
        parameter: 'Canopy Color / Chlorophyll Vigor',
        targetRange: 'NDVI improvement > 0.05 within 10 days',
        timeframeHours: 72,
        description: 'Verify vegetative canopy recovery post-nitrogen uptake.',
      };
    }
    // Rule 5: Potassium deficit with stable moisture
    else if (soilK < 180 && sensorMoisture >= 45) {
      action = 'NUTRIENT_APPLICATION';
      actionLabel = 'Apply Potassium (MOP) Supplementation';
      urgency = 'medium';
      decisionRules.push(
        `Triggered by low soil Potassium (${soilK} kg/ha < threshold 200 kg/ha) while soil moisture is receptive (${sensorMoisture}%).`
      );
      explanation = `Soil moisture is receptive at ${sensorMoisture}%, making this an ideal window for applying Muriate of Potash (MOP) at 25 kg/ha to bolster stem rigidity and disease resistance prior to panicle initiation.`;
      alternatives.push({
        action: 'Apply organic wood ash',
        tradeOff: 'Cost-effective organic alternative with slower nutrient release.',
      });
      expectedCondition = {
        parameter: 'Stem Rigidity / Root Uptake',
        targetRange: 'Nutrient absorption within 7 days',
        timeframeHours: 72,
        description: 'Verify nutrient uptake without root burn.',
      };
    }
    // Rule 6: Extreme heatwave stress
    else if (ambientTemp > 36 && ambientHumidity < 40) {
      action = 'HEAT_PROTECTION';
      actionLabel = 'Activate Heat Shock Mitigation & Micro-Misting';
      urgency = 'high';
      decisionRules.push(
        `Triggered by high temperature (${ambientTemp}°C > 36°C) and low relative humidity (${ambientHumidity}% < 40%).`
      );
      explanation = `Vapor Pressure Deficit (VPD) is critically elevated. Crop is vulnerable to leaf scorch and pollen desiccation. Light canopy misting or mulching recommended during peak afternoon heat (12:00–15:00).`;
      alternatives.push({
        action: 'Apply Kaolin clay spray',
        tradeOff: 'Reflects excess solar radiation and reduces leaf surface temperature by 2–3°C.',
      });
      expectedCondition = {
        parameter: 'Canopy Temp & Soil Moisture',
        targetRange: 'Soil moisture > 40%',
        timeframeHours: 6,
        description: 'Prevent midday moisture drop below 35%.',
      };
    }
    // Rule 7: Optimal condition
    else {
      action = 'MONITOR_OPTIMAL';
      actionLabel = 'Field Conditions Optimal — Continue Monitoring';
      urgency = 'low';
      decisionRules.push(
        `Soil moisture (${sensorMoisture}%), temperature (${ambientTemp}°C), and pH (${soilPh}) are within optimal agronomic targets.`
      );
      explanation = `All validated telemetry metrics are within optimal parameters for ${cropType}. Soil moisture is steady at ${sensorMoisture}%, pH is ${soilPh}, recent ET₀ is ${recentMeanET0} mm/day, and no immediate weather or nutrient risks are detected.`;
      alternatives.push({
        action: 'Routine perimeter pest scouting',
        tradeOff: 'Proactive early detection of stem borer or weed emergence.',
      });
    }

    const recommendationId = 'rec_' + crypto.randomUUID().substring(0, 12);

    const result = {
      recommendationId,
      userId,
      farmId: 'farm-01',
      fieldId,
      fieldName,
      cropType,
      cropStage,
      action,
      actionLabel,
      urgency,
      supportingObservations: {
        soilMoisture: {
          value: sensorMoisture,
          unit: '%',
          source: sensorSource,
          sourceType: sensorSourceType,
          dataQualityStatus: sensorQualityStatus,
          freshnessMinutes,
          isStale,
          provenance: sensorProvenance,
        },
        soilTemp: {
          value: sensorTemp || 25.0,
          unit: '°C',
          source: sensorSource,
          dataQualityStatus: sensorQualityStatus,
        },
        soilPh: {
          value: soilPh,
          unit: 'pH',
          source: soilSource,
          dataQualityStatus: soilQualityStatus,
        },
        soilNitrogen: { value: soilN, unit: 'kg/ha', source: soilSource },
        soilPhosphorus: { value: soilP, unit: 'kg/ha', source: soilSource },
        soilPotassium: { value: soilK, unit: 'kg/ha', source: soilSource },
        soilHealthCard: {
          ph: soilPh,
          availableN: soilN,
          availableP: soilP,
          availableK: soilK,
          texture: soilTexture,
          source: soilSource,
          dataQualityStatus: soilQualityStatus,
        },
        ambientTemp: { value: ambientTemp, unit: '°C', source: weatherSource },
        humidity: { value: ambientHumidity, unit: '%', source: weatherSource },
        forecastRainMm: { value: forecastRainMm, unit: 'mm', source: weatherSource },
        forecastRainProbability: { value: forecastRainProb, unit: '%', source: weatherSource },
        recentRainfall3dMm: { value: recent3dRainfallMm, unit: 'mm', source: weatherSource },
        referenceET0MmDay: { value: recentMeanET0, unit: 'mm/day', source: weatherSource },
        satelliteCanopyNDVI: {
          value: satelliteNdvi,
          isAvailable: satelliteAvailable,
          vigor: satelliteVigor,
          cloudCoverPct: satelliteCloudCover,
          acquisitionDate: satelliteAcquisitionDate,
          source: 'Copernicus Sentinel-2 Level-2A (MSI)',
        },
        districtYieldBenchmark: {
          crop: cropType,
          district: 'Thanjavur',
          yieldKgHa: districtYieldBaselineKgHa,
          source: apySource,
        },
      },
      decisionRules,
      explanation,
      assumptionsAndLimitations: assumptions,
      alternativeActions: alternatives,
      expectedFollowUpCondition: expectedCondition,
      ruleVersion: 'v2.1-QUANTEX-FAO56',
      createdAt: new Date(),
    };

    // Persist recommendation
    if (isDBConnected) {
      try {
        await FieldRecommendation.create(result);
      } catch (err: any) {
        console.warn(`⚠️ [FIELD INTELLIGENCE] DB save error: ${err.message}`);
        const dbErr: any = new Error(
          'Service Unavailable: Failed to persist field recommendation to durable storage. Please retry.'
        );
        dbErr.statusCode = 503;
        throw dbErr;
      }
    } else {
      if (env.NODE_ENV === 'production') {
        const dbErr: any = new Error(
          'Service Unavailable: Database connection required to persist field recommendations in production. Please retry.'
        );
        dbErr.statusCode = 503;
        throw dbErr;
      }
    }

    memoryRecommendations[recommendationId] = result;

    return result;
  }

  /**
   * Phase 2 — Unified Field Context & Data Quality
   * Brings together available field, crop, soil, weather, historical, and IoT information
   * with explicit data provenance, freshness, quality flags, and risk rating.
   */
  static async getFieldContext(userId: string, contextInput?: FieldContextInput) {
    const context = contextInput || {};
    const fieldId = context.fieldId || 'field-01';
    const fieldName =
      context.fieldName ||
      (fieldId === 'field-01'
        ? 'North Acre Parcel A'
        : fieldId === 'field-02'
          ? 'South Terrace Plateau'
          : fieldId === 'field-03'
            ? 'Riverside Lowland Parcel'
            : 'North Acre Parcel A');
    const cropType =
      context.cropType ||
      (fieldId === 'field-01' ? 'Rice' : fieldId === 'field-02' ? 'Maize' : 'Sugarcane');
    const cropStage =
      context.cropStage ||
      (fieldId === 'field-01'
        ? 'Vegetative (Tillering)'
        : fieldId === 'field-02'
          ? 'Tasseling'
          : 'Grand Growth');
    const latitude = context.latitude || 10.790861;
    const longitude = context.longitude || 79.098145;

    // 1. Sensor acquisition (Scoped by field and device)
    let latestSensor: any;
    if (isDBConnected) {
      try {
        const sensorFilter: any = {
          $or: [
            { fieldId: fieldId },
            ...(context.deviceId ? [{ deviceId: context.deviceId }] : []),
            ...(fieldId === 'field-01'
              ? [{ deviceId: 'esp32-node-01', fieldId: { $in: [null, undefined, 'field-01'] } }]
              : []),
          ],
        };
        latestSensor = await IoTReading.findOne(sensorFilter).sort({ createdAt: -1 });
      } catch {
        latestSensor = null;
      }
    } else {
      latestSensor = getInMemoryIoTReading(fieldId, context.deviceId);
    }

    const now = Date.now();
    let sensorMoisture: number | null;
    let sensorTemp: number | null = null;
    let sensorHumidity: number | null = null;
    let sensorSource: string;
    let sensorSourceType: string;
    let sensorQualityStatus: string;
    let sensorProvenance: 'measured' | 'simulated' | 'missing';
    let freshnessMinutes: number;
    let isStale: boolean;

    if (context.soilMoistureOverride !== undefined) {
      if (context.soilMoistureOverride === null) {
        sensorMoisture = null;
        sensorSource = 'missing_telemetry';
        sensorSourceType = 'iot_capacitive_probe';
        sensorQualityStatus = 'missing';
        sensorProvenance = 'missing';
        freshnessMinutes = -1;
        isStale = true;
      } else {
        const rawMoist = Number(context.soilMoistureOverride);
        if (isNaN(rawMoist) || !isFinite(rawMoist) || rawMoist < 0 || rawMoist > 100) {
          const err: any = new Error(
            `Invalid soil moisture override: "${context.soilMoistureOverride}". Must be a valid numeric percentage in physical range [0, 100].`
          );
          err.statusCode = 400;
          throw err;
        }
        sensorMoisture = Math.round(rawMoist * 10) / 10;
        sensorTemp = 28;
        sensorHumidity = 60;
        sensorSource = 'manual_operator_input';
        sensorSourceType = 'calibrated_field_measurement';
        sensorQualityStatus = 'verified';
        sensorProvenance = 'measured';
        freshnessMinutes = 0;
        isStale = false;
      }
    } else if (latestSensor) {
      const assessment = evaluateTelemetryQuality(latestSensor);
      sensorMoisture = assessment.quality === 'invalid' ? null : Number(latestSensor.moisture);
      sensorTemp = latestSensor.temperature;
      sensorHumidity = latestSensor.humidity;
      sensorSource = latestSensor.isSimulated ? 'iot_simulator' : 'esp32_hardware';
      sensorSourceType = 'iot_capacitive_probe';
      sensorQualityStatus = assessment.quality;
      sensorProvenance = latestSensor.isSimulated ? 'simulated' : 'measured';
      freshnessMinutes = assessment.freshnessMinutes;
      isStale = assessment.isStale;
    } else if (context.allowSimulation || context.isSimulated) {
      const fieldDefaultMoisture =
        fieldId === 'field-01'
          ? 24
          : fieldId === 'field-02'
            ? 52
            : fieldId === 'field-03'
              ? 78
              : 38;
      sensorMoisture = fieldDefaultMoisture;
      sensorTemp = 28;
      sensorHumidity = 62;
      sensorSource = 'iot_simulator';
      sensorSourceType = 'simulated_calibration_profile';
      sensorQualityStatus = 'simulated';
      sensorProvenance = 'simulated';
      freshnessMinutes = 2;
      isStale = false;
    } else {
      sensorMoisture = null;
      sensorSource = 'missing_telemetry';
      sensorSourceType = 'iot_capacitive_probe';
      sensorQualityStatus = 'missing';
      sensorProvenance = 'missing';
      freshnessMinutes = -1;
      isStale = true;
    }

    // 2. Weather reanalysis
    let recent3dRainfallMm = 0;
    let recentMeanET0 = 4.2;
    const weatherSource = 'Open-Meteo ERA5-Land Reanalysis';
    try {
      const weatherRes = await WeatherIngestionService.queryObservations({
        granularity: 'daily',
        limit: 3,
      });
      if (weatherRes.data && weatherRes.data.length > 0) {
        let rainSum = 0;
        let et0Sum = 0;
        let count = 0;
        for (const w of weatherRes.data) {
          const precipVal =
            w.precipitation_sum !== undefined
              ? Number(w.precipitation_sum)
              : w.precipitationMm !== undefined
                ? Number(w.precipitationMm)
                : NaN;
          if (!isNaN(precipVal) && precipVal >= 0) {
            rainSum += precipVal;
          }

          const et0Val =
            w.et0_fao_evapotranspiration !== undefined
              ? Number(w.et0_fao_evapotranspiration)
              : w.et0EvapotranspirationMm !== undefined
                ? Number(w.et0EvapotranspirationMm)
                : NaN;
          if (!isNaN(et0Val) && et0Val >= 0) {
            et0Sum += et0Val;
            count++;
          }
        }
        recent3dRainfallMm = Math.round(rainSum * 10) / 10;
        if (count > 0) recentMeanET0 = Math.round((et0Sum / count) * 10) / 10;
      }
    } catch {
      /* fallback defaults */
    }

    // 3. Satellite NDVI
    let satelliteNdvi: number | null = null;
    let satelliteVigor = 'Moderate Canopy Vigor';
    let satelliteCloudCover = 12;
    let satelliteAcquisitionDate: string | null = null;
    let satelliteAvailable = false;
    try {
      const satRes = await SatelliteProcessingService.queryObservations({ limit: 1 });
      if (satRes.isDataAvailable && satRes.data && satRes.data.length > 0) {
        const latestSat = satRes.data[0];
        satelliteNdvi = latestSat.ndvi.mean;
        satelliteVigor = latestSat.vegetationHealth;
        satelliteCloudCover = latestSat.cloudCoveragePercentage;
        satelliteAcquisitionDate = new Date(latestSat.acquisitionDate).toISOString();
        satelliteAvailable = true;
      }
    } catch {
      /* fallback */
    }

    // 4. Soil chemistry
    let soilPh = 6.4;
    let soilN = 195;
    let soilP = 22;
    let soilK = 245;
    let soilTexture = 'Clay Loam (Alluvial Delta)';
    let soilSource = 'Government of India Soil Health Card (ICAR-TNAU)';
    let soilQualityStatus = 'verified';
    try {
      const soilRes = await SoilDataService.getLatestSoilProfile({ latitude, longitude });
      if (soilRes.isAvailable && soilRes.data) {
        soilPh =
          context.soilPhOverride !== undefined ? Number(context.soilPhOverride) : soilRes.data.ph;
        soilN =
          context.nitrogenOverride !== undefined
            ? Number(context.nitrogenOverride)
            : soilRes.data.availableNitrogenKgHa || 195;
        soilP =
          context.phosphorusOverride !== undefined
            ? Number(context.phosphorusOverride)
            : soilRes.data.availablePhosphorusKgHa || 22;
        soilK =
          context.potassiumOverride !== undefined
            ? Number(context.potassiumOverride)
            : soilRes.data.availablePotassiumKgHa || 245;
        soilTexture = soilRes.data.soilTexture || soilTexture;
        soilSource = soilRes.data.source;
        soilQualityStatus = soilRes.data.status;
      }
    } catch {
      /* fallback */
    }

    // 5. District yield benchmark
    let districtYieldBaselineKgHa = 2700;
    let apySource = 'Directorate of Economics and Statistics (DES)';
    try {
      const apyRes = await CropStatisticsService.getDistrictYieldBaseline('Thanjavur', cropType);
      if (apyRes.isAvailable) {
        districtYieldBaselineKgHa = apyRes.yieldKgPerHectare;
        apySource = apyRes.source;
      }
    } catch {
      /* fallback */
    }

    const forecastRainMm =
      context.forecastRainMm !== undefined
        ? Number(context.forecastRainMm)
        : recent3dRainfallMm > 15
          ? 5
          : 0;
    const forecastRainProb =
      context.forecastRainProbability !== undefined
        ? Number(context.forecastRainProbability)
        : forecastRainMm > 10
          ? 70
          : 15;
    const ambientTemp = Number(context.ambientTemp) || sensorTemp || 28;
    const ambientHumidity = Number(context.humidity) || sensorHumidity || 60;

    // Data Quality Assessment
    const warnings: string[] = [];
    const missingInputs: string[] = [];
    const conflictingInputs: string[] = [];

    if (sensorMoisture == null) {
      missingInputs.push('soilMoisture');
      warnings.push('Root-zone capacitive soil moisture telemetry is unacquired.');
    }
    if (isStale) {
      warnings.push(
        `Sensor telemetry is stale (${freshnessMinutes} minutes old; exceeds 15m window).`
      );
    }
    if (sensorProvenance === 'simulated') {
      warnings.push(
        'Telemetry originates from IoT simulator profile, not hardware-verified probe.'
      );
    }
    if (forecastRainMm > 15 && sensorMoisture !== null && sensorMoisture < 25) {
      conflictingInputs.push('Severe dry soil vs heavy forecast rain event.');
    }

    const qualityStatus: 'good' | 'degraded' | 'insufficient' =
      sensorMoisture == null
        ? 'insufficient'
        : isStale || sensorProvenance === 'simulated' || conflictingInputs.length > 0
          ? 'degraded'
          : 'good';

    // Overall Risk Calculation
    let overallRisk: 'critical' | 'high' | 'medium' | 'low' = 'low';
    let riskReason =
      'Field moisture and environmental conditions are within optimal agronomic parameters.';

    if (sensorMoisture !== null && sensorMoisture < 25) {
      overallRisk = 'critical';
      riskReason = `Severe root-zone moisture deficit (${sensorMoisture}%). Crop stunting imminent if irrigation not applied.`;
    } else if (sensorMoisture !== null && sensorMoisture < 35) {
      overallRisk = 'high';
      riskReason = `Depleted root-zone moisture (${sensorMoisture}%). Nearing stress threshold for ${cropType}.`;
    } else if (sensorMoisture !== null && sensorMoisture > 75) {
      overallRisk = 'medium';
      riskReason = `Elevated soil saturation (${sensorMoisture}%). Risk of root hypoxia if additional irrigation applied.`;
    }

    // Confidence
    let confidenceScore = 92;
    if (sensorProvenance === 'simulated') confidenceScore -= 10;
    if (isStale) confidenceScore -= 15;
    if (!satelliteAvailable) confidenceScore -= 5;
    if (qualityStatus === 'insufficient') confidenceScore = 30;

    const confidenceExplanation =
      confidenceScore >= 80
        ? 'High multi-source agreement across in-situ telemetry, ERA5 weather, and regional soil chemistry.'
        : confidenceScore >= 60
          ? 'Moderate confidence: relies partially on simulated telemetry or historical reanalysis.'
          : 'Low confidence: missing ground-truth telemetry requires operator inspection.';

    return {
      fieldId,
      fieldName,
      cropType,
      cropStage,
      timestamp: new Date().toISOString(),
      overallRisk,
      riskReason,
      confidenceScore,
      confidenceExplanation,
      dataQuality: {
        status: qualityStatus,
        warnings,
        missingInputs,
        conflictingInputs,
      },
      observations: {
        soilMoisture: {
          value: sensorMoisture,
          unit: '%',
          source: sensorSource,
          sourceType: sensorSourceType,
          dataQualityStatus: sensorQualityStatus,
          freshnessMinutes,
          isStale,
          provenance: sensorProvenance,
        },
        soilTemperature: {
          value: sensorTemp || 25,
          unit: '°C',
          source: sensorSource,
          provenance: sensorProvenance,
        },
        soilPh: {
          value: soilPh,
          unit: 'pH',
          source: soilSource,
          provenance: 'benchmark',
          dataQualityStatus: soilQualityStatus,
        },
        soilNPK: {
          nitrogen: { value: soilN, unit: 'kg/ha' },
          phosphorus: { value: soilP, unit: 'kg/ha' },
          potassium: { value: soilK, unit: 'kg/ha' },
          texture: soilTexture,
          source: soilSource,
          provenance: 'benchmark',
        },
        weather: {
          ambientTemp: { value: ambientTemp, unit: '°C' },
          humidity: { value: ambientHumidity, unit: '%' },
          forecastRainMm: { value: forecastRainMm, unit: 'mm' },
          forecastRainProbability: { value: forecastRainProb, unit: '%' },
          recentRainfall3dMm: { value: recent3dRainfallMm, unit: 'mm' },
          referenceET0MmDay: { value: recentMeanET0, unit: 'mm/day' },
          source: weatherSource,
          provenance: 'historical_reanalysis',
        },
        satelliteCanopyNDVI: {
          value: satelliteNdvi,
          isAvailable: satelliteAvailable,
          vigor: satelliteVigor,
          cloudCoverPct: satelliteCloudCover,
          acquisitionDate: satelliteAcquisitionDate,
          source: 'Copernicus Sentinel-2 Level-2A (MSI)',
          provenance: 'satellite_observation',
        },
        districtYieldBenchmark: {
          crop: cropType,
          district: 'Thanjavur',
          yieldKgHa: districtYieldBaselineKgHa,
          source: apySource,
          provenance: 'statistical_benchmark',
        },
      },
    };
  }

  /**
   * Phase 4 — Persisted Farmer Action
   * Records farmer's response with actor identification and immutable audit record
   */
  static async recordFarmerAction(
    userId: string,
    recommendationId: string,
    actionTaken:
      | 'irrigated'
      | 'postponed'
      | 'inspected'
      | 'dismissed'
      | 'accepted'
      | 'rejected'
      | 'requested_review',
    notes?: string,
    actorId?: string,
    actorName?: string
  ) {
    const actionRecord = {
      actionTaken,
      recordedAt: new Date(),
      notes: notes || `Farmer executed: ${actionTaken}`,
      actorId: actorId || userId,
      actorName: actorName || 'Farmer',
    };

    if (isDBConnected) {
      try {
        const existing = await FieldRecommendation.findOne({ recommendationId });
        if (existing) {
          // Verify ownership: Farmer must own the recommendation, unless it's demo data
          if (
            existing.userId &&
            existing.userId.toString() !== userId.toString() &&
            existing.userId !== 'demo-farmer' &&
            userId !== 'demo-farmer'
          ) {
            const err: any = new Error(
              'Access denied: You do not have ownership of this field recommendation.'
            );
            err.statusCode = 403;
            throw err;
          }

          // Idempotency: If exact same action was already recorded, return existing state
          if (existing.farmerAction && existing.farmerAction.actionTaken === actionTaken) {
            return existing;
          }

          existing.farmerAction = actionRecord;
          await existing.save();

          try {
            await BlockchainService.getInstance().addBlock('ACTUATOR_OVERRIDE', {
              recommendationId,
              farmerAction: actionTaken,
              actorId: actorId || userId,
              actorName: actorName || 'Farmer',
              recordedAt: actionRecord.recordedAt.toISOString(),
            });
          } catch (auditErr: any) {
            console.warn('⚠️ [FIELD INTELLIGENCE] Audit block notice:', auditErr.message);
          }

          return existing;
        }
      } catch (err: any) {
        if (err.statusCode) throw err;
        console.warn(`⚠️ [FIELD INTELLIGENCE] Action record error: ${err.message}`);
        const dbErr: any = new Error(
          'Service Unavailable: Failed to persist farmer action to durable storage. Please retry.'
        );
        dbErr.statusCode = 503;
        throw dbErr;
      }
    } else {
      if (env.NODE_ENV === 'production') {
        const dbErr: any = new Error(
          'Service Unavailable: Database connection required to record farmer action in production. Please retry.'
        );
        dbErr.statusCode = 503;
        throw dbErr;
      }
    }

    if (memoryRecommendations[recommendationId]) {
      if (env.NODE_ENV === 'production') {
        const dbErr: any = new Error(
          'Service Unavailable: Database connection required to record farmer action in production. Please retry.'
        );
        dbErr.statusCode = 503;
        throw dbErr;
      }

      const memRec = memoryRecommendations[recommendationId];
      if (
        memRec.userId &&
        memRec.userId.toString() !== userId.toString() &&
        memRec.userId !== 'demo-farmer' &&
        userId !== 'demo-farmer'
      ) {
        const err: any = new Error(
          'Access denied: You do not have ownership of this field recommendation.'
        );
        err.statusCode = 403;
        throw err;
      }

      // Idempotency check for in-memory store
      if (memRec.farmerAction && memRec.farmerAction.actionTaken === actionTaken) {
        return memRec;
      }

      memRec.farmerAction = actionRecord;

      try {
        await BlockchainService.getInstance().addBlock('ACTUATOR_OVERRIDE', {
          recommendationId,
          farmerAction: actionTaken,
          actorId: actorId || userId,
          actorName: actorName || 'Farmer',
          recordedAt: actionRecord.recordedAt.toISOString(),
        });
      } catch {
        /* audit safe */
      }

      return memRec;
    }

    const notFoundErr: any = new Error(
      `Field recommendation with ID '${recommendationId}' was not found.`
    );
    notFoundErr.statusCode = 404;
    throw notFoundErr;
  }

  /**
   * Phase 5 — Closed-Loop Outcome Evaluation Loop
   * Evaluates subsequent observation against expected follow-up condition
   * with 4-state classification and explicit non-causal attribution disclaimer.
   */
  static async evaluateFollowUp(
    userId: string,
    recommendationId: string,
    subsequentTelemetry: {
      moisture: number;
      temperature?: number;
      notes?: string;
      source?: string;
    }
  ) {
    let rec: any = null;
    if (isDBConnected) {
      try {
        rec = await FieldRecommendation.findOne({ recommendationId });
      } catch {
        rec = null;
      }
    }
    if (!rec && memoryRecommendations[recommendationId]) {
      rec = memoryRecommendations[recommendationId];
    }

    if (!rec) {
      const notFoundErr: any = new Error(
        `Field recommendation with ID '${recommendationId}' was not found.`
      );
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    if (
      rec.userId &&
      rec.userId.toString() !== userId.toString() &&
      rec.userId !== 'demo-farmer' &&
      userId !== 'demo-farmer'
    ) {
      const forbiddenErr: any = new Error(
        'Access denied: You do not have ownership of this field recommendation.'
      );
      forbiddenErr.statusCode = 403;
      throw forbiddenErr;
    }

    const baselineMoisture = rec?.supportingObservations?.soilMoisture?.value;
    const newMoisture = Number(subsequentTelemetry?.moisture);
    const actionTaken = rec?.farmerAction?.actionTaken || 'accepted';

    let conditionMet: boolean;
    let status:
      | 'achieved'
      | 'partially_achieved'
      | 'not_achieved'
      | 'insufficient_evidence'
      | 'improved'
      | 'insufficient_change'
      | 'worsened';
    let explanation: string;
    let delta = 0;

    // Safety check: Allow "insufficient evidence" instead of fabricating success
    if (
      isNaN(newMoisture) ||
      newMoisture < 0 ||
      newMoisture > 100 ||
      baselineMoisture == null ||
      isNaN(Number(baselineMoisture))
    ) {
      status = 'insufficient_evidence';
      conditionMet = false;
      explanation =
        'Insufficient telemetry evidence: Valid pre-action baseline or subsequent calibrated moisture reading was unavailable for empirical comparison.';
    } else {
      delta = Math.round((newMoisture - Number(baselineMoisture)) * 10) / 10;
      const isIrrigationAction = actionTaken === 'irrigated' || actionTaken === 'accepted';
      const isPostponeAction = actionTaken === 'postponed';
      const isReviewAction = actionTaken === 'requested_review' || actionTaken === 'inspected';
      const isDismissedAction = actionTaken === 'rejected' || actionTaken === 'dismissed';

      if (isIrrigationAction) {
        if (newMoisture > 75) {
          conditionMet = false;
          status = 'worsened';
          explanation = `Excessive soil moisture observed (${newMoisture}%). Exceeds root-zone field capacity and aeration threshold (75%), presenting acute waterlogging and hypoxia risk. Irrigation should be suspended immediately.`;
        } else if (newMoisture >= 45 && newMoisture <= 75 && delta >= 8) {
          conditionMet = true;
          status = 'achieved';
          explanation = `Follow-up observation verified! Soil moisture increased from ${baselineMoisture}% to ${newMoisture}% (+${delta}% delta), successfully fulfilling the root-zone replenishment condition within the safe agronomic range (45-75%).`;
        } else if (delta > 0) {
          conditionMet = false;
          status = 'partially_achieved';
          explanation = `Soil moisture rose slightly (+${delta}%), but remains at ${newMoisture}%, which is still below target capacity. A secondary light cycle may be required.`;
        } else {
          conditionMet = false;
          status = 'not_achieved';
          explanation = `Soil moisture did not increase (current: ${newMoisture}%). Verify irrigation pump pressure, emitter lines, or soil compaction.`;
        }
      } else if (isPostponeAction) {
        if (newMoisture > 75) {
          conditionMet = false;
          status = 'worsened';
          explanation = `Postpone strategy resulted in soil saturation (${newMoisture}%), indicating heavy unabsorbed rainfall or waterlogging. Check drainage ditches and tile drains.`;
        } else if (newMoisture >= 35 && newMoisture <= 75) {
          conditionMet = true;
          status = 'achieved';
          explanation = `Postpone strategy successful: Soil moisture held safely at ${newMoisture}%, saving irrigation water while preventing saturation.`;
        } else if (delta < -15 || newMoisture < 28) {
          conditionMet = false;
          status = 'not_achieved';
          explanation = `Soil moisture depleted rapidly to ${newMoisture}%. Irrigation threshold reached; schedule immediate hydration.`;
        } else {
          conditionMet = true;
          status = 'partially_achieved';
          explanation = `Postpone strategy partially sustained: Soil moisture stands at ${newMoisture}%.`;
        }
      } else if (isDismissedAction) {
        if (newMoisture < 30) {
          conditionMet = false;
          status = 'not_achieved';
          explanation = `Recommendation was rejected/dismissed. Soil moisture has continued to decline to ${newMoisture}%, risking crop stress.`;
        } else {
          conditionMet = true;
          status = 'partially_achieved';
          explanation = `Advisory was dismissed. Soil moisture remains stable at ${newMoisture}%.`;
        }
      } else if (isReviewAction) {
        conditionMet = true;
        status = 'achieved';
        explanation = `Agronomist inspection logged. Ground verification confirmed root-zone moisture at ${newMoisture}%.`;
      } else {
        conditionMet = true;
        status = 'achieved';
        explanation = `Field telemetry updated. Observed moisture is ${newMoisture}%.`;
      }
    }

    const evaluation = {
      evaluatedAt: new Date(),
      subsequentReading: {
        moisture: isNaN(newMoisture) ? null : newMoisture,
        temperature: subsequentTelemetry?.temperature || 25,
        source: subsequentTelemetry?.source || 'iot_followup_telemetry',
        unit: '%',
      },
      conditionMet,
      status,
      observedDelta:
        status === 'insufficient_evidence'
          ? 'N/A (insufficient data)'
          : `${delta > 0 ? '+' : ''}${delta}% moisture`,
      explanation,
      causalAttributionDisclaimer:
        'Observational telemetry comparison only. Outcome classification does not imply direct singular causation by farmer action; micro-climate, precipitation, and soil heterogeneity contribute to moisture dynamics.',
    };

    if (rec && isDBConnected) {
      try {
        rec.followUpEvaluation = evaluation;
        await rec.save();
      } catch (err: any) {
        const dbErr: any = new Error(
          'Service Unavailable: Failed to persist follow-up evaluation in durable storage. Please retry.'
        );
        dbErr.statusCode = 503;
        throw dbErr;
      }
    } else if (env.NODE_ENV === 'production') {
      const dbErr: any = new Error(
        'Service Unavailable: Database connection required to evaluate follow-up in production. Please retry.'
      );
      dbErr.statusCode = 503;
      throw dbErr;
    }

    if (memoryRecommendations[recommendationId]) {
      memoryRecommendations[recommendationId].followUpEvaluation = evaluation;
    }

    try {
      await BlockchainService.getInstance().addBlock('TELEMETRY_LOG', {
        recommendationId,
        evaluationStatus: evaluation.status,
        conditionMet: evaluation.conditionMet,
        observedDelta: evaluation.observedDelta,
        evaluatedAt: evaluation.evaluatedAt.toISOString(),
      });
    } catch (auditErr: any) {
      console.warn('⚠️ [FIELD INTELLIGENCE] Telemetry audit block notice:', auditErr.message);
    }

    return evaluation;
  }

  /**
   * Phase 4 — Persisted Field Action Timeline
   * Retrieves an immutable chronological timeline of recommendations, actions, reviews, and evaluations
   */
  static async getFieldTimeline(
    userId: string,
    fieldId?: string,
    limit = 25,
    isSpecialist = false
  ) {
    const query: Record<string, any> = {};
    if (!isSpecialist) {
      query.userId = userId;
    }
    if (fieldId) query.fieldId = fieldId;

    let recs: any[] = [];
    if (isDBConnected) {
      try {
        recs = await FieldRecommendation.find(query).sort({ createdAt: -1 }).limit(limit);
      } catch {
        recs = [];
      }
    }

    if (recs.length === 0) {
      recs = Object.values(memoryRecommendations)
        .filter((r) => (isSpecialist || r.userId === userId) && (!fieldId || r.fieldId === fieldId))
        .slice(0, limit);
    }

    const events: Array<{
      id: string;
      recommendationId: string;
      fieldId: string;
      fieldName: string;
      eventType:
        | 'RECOMMENDATION_GENERATED'
        | 'FARMER_ACTION_RECORDED'
        | 'AGRONOMIST_REVIEW_LOGGED'
        | 'FOLLOW_UP_EVALUATED';
      timestamp: Date;
      title: string;
      description: string;
      actor: string;
      actorId?: string;
      status?: string;
      ruleVersion?: string;
      metadata?: Record<string, any>;
    }> = [];

    for (const rec of recs) {
      // 1. Generation event
      events.push({
        id: `evt-gen-${rec.recommendationId}`,
        recommendationId: rec.recommendationId,
        fieldId: rec.fieldId,
        fieldName: rec.fieldName,
        eventType: 'RECOMMENDATION_GENERATED',
        timestamp: new Date(rec.createdAt),
        title: `Decision Generated: ${rec.actionLabel || rec.action}`,
        description: rec.explanation,
        actor: 'AgriFlux FAO-56 Engine',
        status: rec.urgency,
        ruleVersion: rec.ruleVersion || 'v2.1-QUANTEX-FAO56',
        metadata: {
          urgency: rec.urgency,
          soilMoisture: rec.supportingObservations?.soilMoisture?.value,
          rule: rec.decisionRules?.[0],
        },
      });

      // 2. Farmer action event
      if (rec.farmerAction?.recordedAt) {
        events.push({
          id: `evt-act-${rec.recommendationId}`,
          recommendationId: rec.recommendationId,
          fieldId: rec.fieldId,
          fieldName: rec.fieldName,
          eventType: 'FARMER_ACTION_RECORDED',
          timestamp: new Date(rec.farmerAction.recordedAt),
          title: `Farmer Action: ${String(rec.farmerAction.actionTaken).toUpperCase()}`,
          description: rec.farmerAction.notes || `Action executed: ${rec.farmerAction.actionTaken}`,
          actor: rec.farmerAction.actorName || 'Farmer',
          actorId: rec.farmerAction.actorId,
          status: rec.farmerAction.actionTaken,
          ruleVersion: rec.ruleVersion || 'v2.1-QUANTEX-FAO56',
        });
      }

      // 3. Agronomist review event
      if (rec.agronomistReview?.reviewedAt) {
        events.push({
          id: `evt-rev-${rec.recommendationId}`,
          recommendationId: rec.recommendationId,
          fieldId: rec.fieldId,
          fieldName: rec.fieldName,
          eventType: 'AGRONOMIST_REVIEW_LOGGED',
          timestamp: new Date(rec.agronomistReview.reviewedAt),
          title: `Agronomist Review: ${String(rec.agronomistReview.status).toUpperCase()}`,
          description: rec.agronomistReview.notes || `Status: ${rec.agronomistReview.status}`,
          actor: rec.agronomistReview.reviewerName || 'Agronomist Specialist',
          actorId: rec.agronomistReview.reviewedBy,
          status: rec.agronomistReview.status,
          ruleVersion: rec.ruleVersion || 'v2.1-QUANTEX-FAO56',
        });
      }

      // 4. Follow-up evaluation event
      if (rec.followUpEvaluation?.evaluatedAt) {
        events.push({
          id: `evt-eval-${rec.recommendationId}`,
          recommendationId: rec.recommendationId,
          fieldId: rec.fieldId,
          fieldName: rec.fieldName,
          eventType: 'FOLLOW_UP_EVALUATED',
          timestamp: new Date(rec.followUpEvaluation.evaluatedAt),
          title: `Outcome Evaluation: ${String(rec.followUpEvaluation.status).toUpperCase()}`,
          description: rec.followUpEvaluation.explanation,
          actor: 'Closed-Loop Evaluator',
          status: rec.followUpEvaluation.status,
          ruleVersion: rec.ruleVersion || 'v2.1-QUANTEX-FAO56',
          metadata: {
            conditionMet: rec.followUpEvaluation.conditionMet,
            observedDelta: rec.followUpEvaluation.observedDelta,
          },
        });
      }
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Phase 7 — Agronomist Review Workflow
   * Records specialist review: endorsed, revision_requested, or inspection_required
   */
  static async recordAgronomistReview(
    userId: string,
    reviewerId: string,
    reviewerName: string,
    recommendationId: string,
    status: 'endorsed' | 'revision_requested' | 'inspection_required',
    notes?: string
  ) {
    const reviewRecord = {
      reviewedBy: reviewerId,
      reviewerName: reviewerName || 'Specialist Agronomist',
      reviewedAt: new Date(),
      status,
      notes: notes || `Recommendation review marked as: ${status}`,
    };

    if (isDBConnected) {
      try {
        const existing = await FieldRecommendation.findOne({ recommendationId });
        if (existing) {
          // Idempotency: if already reviewed with same status and notes, return existing without duplicate audit block
          if (
            existing.agronomistReview &&
            existing.agronomistReview.status === status &&
            existing.agronomistReview.notes === reviewRecord.notes
          ) {
            return existing;
          }

          existing.agronomistReview = reviewRecord;
          await existing.save();

          try {
            await BlockchainService.getInstance().addBlock('PRESCRIPTION_AUDIT', {
              recommendationId,
              status,
              reviewerId,
              reviewerName,
              notes: reviewRecord.notes,
              reviewedAt: reviewRecord.reviewedAt.toISOString(),
            });
          } catch (auditErr: any) {
            console.warn('⚠️ [FIELD INTELLIGENCE] Prescription audit notice:', auditErr.message);
          }
          return existing;
        }
      } catch (err: any) {
        console.warn(`⚠️ [FIELD INTELLIGENCE] Agronomist review error: ${err.message}`);
        const dbErr: any = new Error(
          'Service Unavailable: Failed to persist specialist review to durable storage. Please retry.'
        );
        dbErr.statusCode = 503;
        throw dbErr;
      }
    } else {
      if (env.NODE_ENV === 'production') {
        const dbErr: any = new Error(
          'Service Unavailable: Database connection required to record specialist review in production. Please retry.'
        );
        dbErr.statusCode = 503;
        throw dbErr;
      }
    }

    if (memoryRecommendations[recommendationId]) {
      if (env.NODE_ENV === 'production') {
        const dbErr: any = new Error(
          'Service Unavailable: Database connection required to record specialist review in production. Please retry.'
        );
        dbErr.statusCode = 503;
        throw dbErr;
      }

      const memRec = memoryRecommendations[recommendationId];
      if (
        memRec.agronomistReview &&
        memRec.agronomistReview.status === status &&
        memRec.agronomistReview.notes === reviewRecord.notes
      ) {
        return memRec;
      }

      memRec.agronomistReview = reviewRecord;

      try {
        await BlockchainService.getInstance().addBlock('PRESCRIPTION_AUDIT', {
          recommendationId,
          status,
          reviewerId,
          reviewerName,
          notes: reviewRecord.notes,
          reviewedAt: reviewRecord.reviewedAt.toISOString(),
        });
      } catch {
        /* audit safe */
      }

      return memRec;
    }

    const notFoundErr: any = new Error(
      `Field recommendation with ID '${recommendationId}' was not found for review.`
    );
    notFoundErr.statusCode = 404;
    throw notFoundErr;
  }

  /**
   * Retrieves recommendations needing specialist review
   */
  static async getPendingReviews(limit = 20) {
    if (isDBConnected) {
      try {
        const reviews = await FieldRecommendation.find({
          $or: [
            { 'farmerAction.actionTaken': 'requested_review' },
            { urgency: 'critical' },
            { urgency: 'high' },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(limit);
        if (reviews.length > 0) return reviews;
      } catch {
        /* fallback */
      }
    }

    return Object.values(memoryRecommendations)
      .filter(
        (r) =>
          r.farmerAction?.actionTaken === 'requested_review' ||
          r.urgency === 'critical' ||
          r.urgency === 'high'
      )
      .slice(0, limit);
  }

  /**
   * Retrieves recent field recommendations for a user/farm
   */
  static async getHistory(userId: string, farmId = 'farm-01', limit = 10) {
    if (isDBConnected) {
      try {
        const records = await FieldRecommendation.find({ userId, farmId })
          .sort({ createdAt: -1 })
          .limit(limit);
        if (records.length > 0) return records;
      } catch {
        /* fallback to memory */
      }
    }

    const memoryList = Object.values(memoryRecommendations)
      .filter((r) => r.userId === userId && (!farmId || r.farmId === farmId))
      .slice(0, limit);

    return memoryList;
  }
}
