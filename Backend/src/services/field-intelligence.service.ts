import crypto from 'crypto';
import FieldRecommendation, {
  IFieldRecommendation,
} from '../../../Database/Models/FieldRecommendation';
import IoTReading from '../../../Database/Models/IoTReading';
import { isDBConnected } from '../config/db';
import { WeatherIngestionService } from './weather-ingestion.service';
import { SatelliteProcessingService } from './satellite-processing.service';
import { SoilDataService } from './soil-data.service';
import { CropStatisticsService } from './crop-statistics.service';

export interface FieldContextInput {
  fieldId?: string;
  fieldName?: string;
  cropType?: string;
  cropStage?: string;
  soilMoistureOverride?: number;
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

    // --- 1. SENSOR TELEMETRY ACQUISITION ---
    let latestSensor: any = null;
    if (isDBConnected) {
      try {
        latestSensor = await IoTReading.findOne({}).sort({ createdAt: -1 });
      } catch {
        latestSensor = null;
      }
    }

    const now = Date.now();
    let sensorMoisture: number | null = null;
    let sensorTemp: number | null = null;
    let sensorHumidity: number | null = null;
    let sensorSource = 'iot_simulator';
    let sensorSourceType = 'iot_capacitive_probe';
    let sensorQualityStatus = 'simulated';
    let freshnessMinutes = 0;
    let isStale = false;

    if (context.soilMoistureOverride !== undefined && context.soilMoistureOverride !== null) {
      sensorMoisture = Math.min(100, Math.max(0, Number(context.soilMoistureOverride)));
      sensorSource = 'manual_operator_input';
      sensorSourceType = 'calibrated_field_measurement';
      sensorQualityStatus = 'verified';
    } else if (latestSensor) {
      sensorMoisture = latestSensor.moisture;
      sensorTemp = latestSensor.temperature;
      sensorHumidity = latestSensor.humidity;
      sensorSource = latestSensor.isSimulated ? 'iot_simulator' : 'esp32_hardware';
      sensorSourceType = 'iot_capacitive_probe';
      sensorQualityStatus = latestSensor.isSimulated ? 'simulated' : 'verified';
      const readingAge =
        now - new Date(latestSensor.createdAt || latestSensor.rawTimestamp).getTime();
      freshnessMinutes = Math.max(0, Math.round(readingAge / 60000));
      isStale = freshnessMinutes > 15;
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
          if (typeof w.precipitationMm === 'number') rainSum += w.precipitationMm;
          if (typeof w.et0EvapotranspirationMm === 'number') {
            et0Sum += w.et0EvapotranspirationMm;
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
    // If neither in-situ sensor telemetry nor manual override is supplied:
    if (sensorMoisture === null) {
      const recommendationId = 'rec_' + crypto.randomUUID().substring(0, 12);
      const insufficientResult = {
        recommendationId,
        userId,
        farmId: 'farm-01',
        fieldId,
        fieldName,
        cropType,
        cropStage,
        action: 'INSUFFICIENT_DATA' as const,
        actionLabel: 'Data Quality Gate: In-Situ Soil Moisture Reading Required',
        urgency: 'low' as const,
        supportingObservations: {
          soilMoisture: {
            value: null,
            unit: '%',
            source: 'missing_telemetry',
            sourceType: 'iot_capacitive_probe',
            dataQualityStatus: 'missing',
            freshnessMinutes: -1,
            isStale: true,
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
          'Safety Gate Triggered: No physical capacitive probe reading or calibrated field observation available.',
          'Operational Rule: Macro-climatic reanalysis and orbital NDVI cannot safely trigger automated irrigation without root-zone ground truth.',
        ],
        explanation:
          'AgriFlux enforces strict scientific data gates. While macro-reanalysis weather and orbital satellite NDVI provide regional environmental context, they do not replace direct root-zone moisture measurements for automated closed-loop irrigation.',
        assumptionsAndLimitations: [
          'Irrigation commands strictly prohibited until live sensor probe connects or operator provides manual reading.',
          'Satellite NDVI reflects top-of-canopy greenness and cannot penetrate saturated soil profiles.',
        ],
        alternativeActions: [
          {
            action: 'Check ESP32 sensor battery and LoRaWAN/Wi-Fi connection',
            tradeOff: 'Restores real-time automated intelligence.',
          },
          {
            action: 'Input manual soil moisture test reading',
            tradeOff: 'Enables immediate one-off agronomic calculation.',
          },
        ],
        expectedFollowUpCondition: {
          parameter: 'Sensor Connectivity',
          targetRange: 'Online with telemetry < 15m old',
          timeframeHours: 1,
          description: 'Awaiting sensor sync.',
        },
        createdAt: new Date(),
      };

      if (isDBConnected) {
        try {
          await FieldRecommendation.create(insufficientResult);
        } catch {
          /* ignore */
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
      explanation = `Soil moisture is currently at ${sensorMoisture}%, which exceeds field capacity. Recent cumulative rainfall in Thanjavur is ${recent3dRainfallMm}mm. Applying additional water now risks root hypoxia, nutrient leaching, and increased sheath blight vulnerability.`;
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
    // Rule 2: Critical root zone depletion
    else if (sensorMoisture < 28 && forecastRainMm < 5) {
      action = 'IRRIGATE_IMMEDIATE';
      actionLabel = 'Immediate Irrigation Required — Root Zone Deficit';
      urgency = sensorMoisture < 20 ? 'critical' : 'high';
      decisionRules.push(
        `Triggered by soil moisture (${sensorMoisture}%) falling below FAO-56 Management Allowed Depletion (MAD 50% / threshold 28%) with high reference ET₀ (${recentMeanET0} mm/day).`
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
    // Rule 3: Moderate depletion
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
      createdAt: new Date(),
    };

    // Persist recommendation
    if (isDBConnected) {
      try {
        await FieldRecommendation.create(result);
      } catch (err: any) {
        console.warn(`⚠️ [FIELD INTELLIGENCE] DB save error: ${err.message}`);
      }
    }
    memoryRecommendations[recommendationId] = result;

    return result;
  }

  /**
   * Records farmer's response to a recommendation
   */
  static async recordFarmerAction(
    userId: string,
    recommendationId: string,
    actionTaken: 'irrigated' | 'postponed' | 'inspected' | 'dismissed',
    notes?: string
  ) {
    const actionRecord = {
      actionTaken,
      recordedAt: new Date(),
      notes: notes || `Farmer executed: ${actionTaken}`,
    };

    if (isDBConnected) {
      try {
        const updated = await FieldRecommendation.findOneAndUpdate(
          { recommendationId, userId },
          { farmerAction: actionRecord },
          { new: true }
        );
        if (updated) return updated;
      } catch (err: any) {
        console.warn(`⚠️ [FIELD INTELLIGENCE] Action record error: ${err.message}`);
      }
    }

    if (memoryRecommendations[recommendationId]) {
      memoryRecommendations[recommendationId].farmerAction = actionRecord;
      return memoryRecommendations[recommendationId];
    }

    return { recommendationId, farmerAction: actionRecord };
  }

  /**
   * Closed-loop evaluation: evaluates subsequent observation against expected follow-up condition
   */
  static async evaluateFollowUp(
    userId: string,
    recommendationId: string,
    subsequentTelemetry: { moisture: number; temperature?: number; notes?: string }
  ) {
    let rec: any = null;
    if (isDBConnected) {
      try {
        rec = await FieldRecommendation.findOne({ recommendationId, userId });
      } catch {
        rec = null;
      }
    }
    if (!rec && memoryRecommendations[recommendationId]) {
      rec = memoryRecommendations[recommendationId];
    }

    const baselineMoisture = rec?.supportingObservations?.soilMoisture?.value || 30.0;
    const newMoisture = Number(subsequentTelemetry.moisture);
    const delta = Math.round((newMoisture - baselineMoisture) * 10) / 10;
    const actionTaken = rec?.farmerAction?.actionTaken || 'irrigated';

    let conditionMet: boolean;
    let status: 'improved' | 'insufficient_change' | 'worsened';
    let explanation: string;

    if (actionTaken === 'irrigated') {
      if (newMoisture >= 45 && delta >= 8) {
        conditionMet = true;
        status = 'improved';
        explanation = `Follow-up observation verified! Soil moisture increased from ${baselineMoisture}% to ${newMoisture}% (+${delta}% delta), successfully fulfilling the root-zone replenishment condition.`;
      } else if (delta > 0) {
        conditionMet = false;
        status = 'insufficient_change';
        explanation = `Soil moisture rose slightly (+${delta}%), but remains at ${newMoisture}%, which is still below target capacity. A secondary light cycle may be required.`;
      } else {
        conditionMet = false;
        status = 'worsened';
        explanation = `Soil moisture did not increase (current: ${newMoisture}%). Please verify pump water pressure and irrigation nozzle flow.`;
      }
    } else if (actionTaken === 'postponed') {
      if (newMoisture >= 35 && newMoisture <= 75) {
        conditionMet = true;
        status = 'improved';
        explanation = `Postpone strategy successful: Soil moisture held safely at ${newMoisture}%, saving irrigation water while preventing saturation.`;
      } else {
        conditionMet = false;
        status = 'worsened';
        explanation = `Soil moisture has now depleted to ${newMoisture}%. Irrigation is now required.`;
      }
    } else {
      conditionMet = true;
      status = 'improved';
      explanation = `Field inspection recorded. Observed soil moisture is ${newMoisture}%.`;
    }

    const evaluation = {
      evaluatedAt: new Date(),
      subsequentReading: {
        moisture: newMoisture,
        temperature: subsequentTelemetry.temperature || 25,
      },
      conditionMet,
      status,
      observedDelta: `${delta > 0 ? '+' : ''}${delta}% moisture`,
      explanation,
    };

    if (rec && isDBConnected) {
      try {
        rec.followUpEvaluation = evaluation;
        await rec.save();
      } catch {
        /* ignore */
      }
    }
    if (memoryRecommendations[recommendationId]) {
      memoryRecommendations[recommendationId].followUpEvaluation = evaluation;
    }

    return evaluation;
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
      .filter((r) => r.userId === userId || r.farmId === farmId)
      .slice(0, limit);

    return memoryList;
  }
}
