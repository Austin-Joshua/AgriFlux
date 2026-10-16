import crypto from 'crypto';
import FieldRecommendation, {
  IFieldRecommendation,
} from '../../../Database/Models/FieldRecommendation';
import IoTReading from '../../../Database/Models/IoTReading';
import { isDBConnected } from '../config/db';

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
}

// In-memory cache for demo mode
const memoryRecommendations: Record<string, any> = {};

export class FieldIntelligenceService {
  /**
   * Generates a structured, evidence-based agronomic recommendation
   */
  static async generateRecommendation(userId: string, context: FieldContextInput): Promise<any> {
    const fieldId = context.fieldId || 'field-01';
    const fieldName = context.fieldName || 'North Acre Parcel A';
    const cropType = context.cropType || 'Rice';
    const cropStage = context.cropStage || 'Vegetative (Tillering)';

    // 1. Retrieve latest sensor telemetry
    let latestSensor: any = null;
    if (isDBConnected) {
      try {
        latestSensor = await IoTReading.findOne({}).sort({ createdAt: -1 });
      } catch {
        latestSensor = null;
      }
    }

    const now = Date.now();
    let sensorMoisture = 45.0;
    let sensorTemp = 25.0;
    let sensorHumidity = 60.0;
    let sensorSource = 'iot_simulator';
    let freshnessMinutes = 0;
    let isStale = false;

    if (context.soilMoistureOverride !== undefined && context.soilMoistureOverride !== null) {
      sensorMoisture = Math.min(100, Math.max(0, Number(context.soilMoistureOverride)));
      sensorSource = 'manual_input';
    } else if (latestSensor) {
      sensorMoisture = latestSensor.moisture;
      sensorTemp = latestSensor.temperature;
      sensorHumidity = latestSensor.humidity;
      sensorSource = latestSensor.isSimulated ? 'iot_simulator' : 'esp32_hardware';
      const readingAge =
        now - new Date(latestSensor.createdAt || latestSensor.rawTimestamp).getTime();
      freshnessMinutes = Math.max(0, Math.round(readingAge / 60000));
      isStale = freshnessMinutes > 15;
    }

    // 2. Validate parameters
    const soilPh = Number(context.soilPhOverride) || 6.4;
    const nitrogen = Number(context.nitrogenOverride) || 55;
    const phosphorus = Number(context.phosphorusOverride) || 38;
    const potassium = Number(context.potassiumOverride) || 48;
    const rainMm = Number(context.forecastRainMm) || 0;
    const rainProb = Number(context.forecastRainProbability) || 15;
    const ambientTemp = Number(context.ambientTemp) || sensorTemp || 28;
    const ambientHumidity = Number(context.humidity) || sensorHumidity || 60;

    // 3. Domain Decision Logic (FAO 56 & Agronomic extension rules)
    const decisionRules: string[] = [];
    const assumptions: string[] = [
      `Assumes ${cropType} is at '${cropStage}' development phase.`,
      `Telemetry source: ${sensorSource} (freshness: ${freshnessMinutes}m).`,
      'Calculations follow FAO-56 crop water depletion guidelines.',
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

    // Rule 1: Saturated soil or imminent heavy precipitation
    if (sensorMoisture >= 75 || (rainMm >= 20 && rainProb >= 65)) {
      action = 'POSTPONE_IRRIGATION';
      actionLabel = 'Postpone Irrigation — High Moisture & Rain Inbound';
      urgency = sensorMoisture > 82 ? 'high' : 'medium';
      decisionRules.push(
        `Triggered by high soil moisture (${sensorMoisture}%) or forecast precipitation (${rainMm}mm at ${rainProb}% probability).`
      );
      explanation = `Soil moisture is currently at ${sensorMoisture}% which exceeds optimal field capacity. Additionally, the forecast indicates ${rainMm}mm rainfall within 24 hours. Applying additional water now risks root hypoxia, nutrient leaching, and increased sheath blight susceptibility.`;
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
    // Rule 2: Critical drought stress
    else if (sensorMoisture < 28 && rainMm < 5) {
      action = 'IRRIGATE_IMMEDIATE';
      actionLabel = 'Immediate Irrigation Required — Root Zone Deficit';
      urgency = sensorMoisture < 20 ? 'critical' : 'high';
      decisionRules.push(
        `Triggered by soil moisture (${sensorMoisture}%) falling below FAO-56 Management Allowed Depletion (MAD 50% / threshold 28%) with negligible rain forecast (${rainMm}mm).`
      );
      explanation = `Soil moisture has depleted to ${sensorMoisture}%, which is severely below the managed depletion threshold for ${cropType}. Ambient temperature is ${ambientTemp}°C. Without timely hydration, crop transpiration stress will cause stomatal closure and vegetative yield stunting.`;
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
    else if (sensorMoisture < 42 && rainMm < 10) {
      action = 'IRRIGATE_LIGHT';
      actionLabel = 'Schedule Light Irrigation Cycle (15mm)';
      urgency = 'medium';
      decisionRules.push(
        `Triggered by soil moisture (${sensorMoisture}%) reaching the lower bounds of optimal tillering range (42%).`
      );
      explanation = `Moisture levels are currently at ${sensorMoisture}%. A standard 15mm irrigation cycle will restore root-zone water content to ideal field capacity without oversaturating the soil profile.`;
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
    // Rule 4: Potassium deficit with stable moisture
    else if (potassium < 35 && sensorMoisture >= 45) {
      action = 'NUTRIENT_APPLICATION';
      actionLabel = 'Apply Potassium (MOP) Supplementation';
      urgency = 'medium';
      decisionRules.push(
        `Triggered by low soil Potassium (${potassium} kg/ha < optimal 45 kg/ha) while soil moisture is receptive (${sensorMoisture}%).`
      );
      explanation = `Soil moisture is receptive at ${sensorMoisture}%, making this an ideal window for applying Muriate of Potash (MOP) at 25 kg/ha to bolster stem rigidity and disease resistance prior to panicle initiation.`;
      alternatives.push({
        action: 'Apply organic wood ash',
        tradeOff: 'Cost-effective organic alternative with slower nutrient release.',
      });
      expectedCondition = {
        parameter: 'Canopy Color / NPK Index',
        targetRange: 'Nutrient absorption within 7 days',
        timeframeHours: 72,
        description: 'Verify nutrient uptake without root burn.',
      };
    }
    // Rule 5: Extreme heatwave stress
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
    // Rule 6: Optimal condition
    else {
      action = 'MONITOR_OPTIMAL';
      actionLabel = 'Field Conditions Optimal — Continue Monitoring';
      urgency = 'low';
      decisionRules.push(
        `Soil moisture (${sensorMoisture}%), temperature (${ambientTemp}°C), and pH (${soilPh}) are within optimal agronomic targets.`
      );
      explanation = `All validated telemetry metrics are within optimal parameters for ${cropType}. Soil moisture is steady at ${sensorMoisture}%, pH is ${soilPh}, and no immediate weather risks are detected.`;
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
          freshnessMinutes,
          isStale,
        },
        soilTemp: { value: sensorTemp, unit: '°C', source: sensorSource },
        soilPh: { value: soilPh, unit: 'pH', source: 'calibrated_test' },
        soilNitrogen: { value: nitrogen, unit: 'kg/ha' },
        soilPhosphorus: { value: phosphorus, unit: 'kg/ha' },
        soilPotassium: { value: potassium, unit: 'kg/ha' },
        ambientTemp: { value: ambientTemp, unit: '°C' },
        humidity: { value: ambientHumidity, unit: '%' },
        forecastRainMm: { value: rainMm, unit: 'mm' },
        forecastRainProbability: { value: rainProb, unit: '%' },
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
   * Closed-loop evaluation: evaluates subsequent observation against the expected follow-up condition
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
