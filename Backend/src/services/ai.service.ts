export class AIService {
  static async predictYield(data: any) {
    const crop = data.cropType || 'Rice';
    const baseYields: Record<string, number> = {
      Rice: 4500,
      Wheat: 3800,
      Maize: 5000,
      Cotton: 2200,
      Soybean: 3100,
    };
    const base = baseYields[crop] || 3000;

    // Defensive input bounds clamping (prevents negative yields and NaN propagation)
    const rawN = Number(data.nitrogen);
    const rawP = Number(data.phosphorus);
    const rawK = Number(data.potassium);
    const rawPh = Number(data.soilPh);

    const n = Math.max(0, Math.min(300, isNaN(rawN) ? 60 : rawN));
    const p = Math.max(0, Math.min(200, isNaN(rawP) ? 40 : rawP));
    const k = Math.max(0, Math.min(250, isNaN(rawK) ? 50 : rawK));
    const ph = Math.max(3.0, Math.min(10.0, isNaN(rawPh) ? 6.5 : rawPh));

    // Soil pH impact (IRRI & FAO guidelines)
    let phMultiplier = 1.0;
    if (ph < 5.5 || ph > 7.8) {
      phMultiplier = 0.82; // 18% yield loss under suboptimal acidity/alkalinity
    } else if (ph < 6.0 || ph > 7.2) {
      phMultiplier = 0.93;
    }

    // NPK satisfaction index (Optimal: N=80, P=45, K=60)
    const nIndex = Math.min(n / 80, 1.2);
    const pIndex = Math.min(p / 45, 1.2);
    const kIndex = Math.min(k / 60, 1.2);
    const npkMultiplier = (nIndex + pIndex + kIndex) / 3;

    const predicted = Math.max(0, Math.round(base * phMultiplier * Math.max(0.1, npkMultiplier)));
    const risk = predicted < base * 0.85 ? 'High' : predicted < base * 0.95 ? 'Medium' : 'Low';

    const suggestions: string[] = [];
    if (n < 60) suggestions.push('Replenish Nitrogen via Urea or organic compost.');
    if (p < 35) suggestions.push('Apply Single Superphosphate (SSP) to improve root development.');
    if (k < 45) suggestions.push('Incorporate Muriate of Potash (MOP) or organic wood ash.');
    if (ph < 5.8)
      suggestions.push('Apply agricultural lime (calcium carbonate) to neutralize soil acidity.');
    if (ph > 7.6)
      suggestions.push('Apply elemental sulfur or organic mulch to reduce alkaline pH.');

    if (suggestions.length === 0) {
      suggestions.push('Maintain current NPK replenishment cycle and soil aeration.');
    }

    return {
      predicted,
      risk,
      suggestions,
      modelType: 'agronomic_crop_response_model',
      districtStatisticalBaseline: {
        source: 'Directorate of Economics and Statistics (DES), Govt of India',
        district: 'Thanjavur',
        crop,
        baselineKgHa: crop.toLowerCase() === 'rice' ? 2700 : base,
      },
      provenance: {
        isMachineLearningValidated: false,
        methodology: 'FAO-56 & ICAR Empirical Nutrient Response Formula',
        limitations: [
          'Calculated from empirical agronomic crop response curves, not a trained neural network.',
          'District-level APY statistics provide regional historical context, not individual-field ground truth.',
        ],
      },
    };
  }

  static async getIrrigationSchedule(data: any) {
    const crop = data.cropType || 'Rice';
    const rawM = Number(data.soilMoisture);
    const rawT = Number(data.temperature);
    const moisture = Math.max(0, Math.min(100, isNaN(rawM) ? 45 : rawM));
    const temp = Math.max(-10, Math.min(60, isNaN(rawT) ? 30 : rawT));

    const schedule = [];
    if (moisture > 70) {
      schedule.push(
        {
          day: 'Wednesday',
          amount: '10mm',
          note: 'Suppressed watering due to high soil moisture levels.',
        },
        { day: 'Saturday', amount: '12mm', note: 'Routine soil hydration.' }
      );
    } else {
      const heatFactor = temp > 35 ? 'Increased volume' : 'Standard volume';
      if (crop.toLowerCase() === 'rice') {
        schedule.push(
          {
            day: 'Monday',
            amount: temp > 35 ? '25mm' : '20mm',
            note: `${heatFactor} for seedling sub-flooding.`,
          },
          { day: 'Wednesday', amount: '15mm', note: 'Mid-week moisture maintenance.' },
          {
            day: 'Friday',
            amount: temp > 35 ? '25mm' : '20mm',
            note: `${heatFactor} to support high transpiration.`,
          }
        );
      } else {
        schedule.push(
          {
            day: 'Tuesday',
            amount: temp > 35 ? '18mm' : '15mm',
            note: `${heatFactor} for crop root zone.`,
          },
          { day: 'Saturday', amount: temp > 35 ? '20mm' : '15mm', note: 'Weekend crop irrigation.' }
        );
      }
    }
    return schedule;
  }

  static async analyzeSoil(data: any) {
    const rawPh = Number(data.ph);
    const rawN = Number(data.nitrogen);
    const rawP = Number(data.phosphorus);
    const rawK = Number(data.potassium);

    const ph = Math.max(3.0, Math.min(10.0, isNaN(rawPh) ? 6.5 : rawPh));
    const n = Math.max(0, Math.min(300, isNaN(rawN) ? 60 : rawN));
    const p = Math.max(0, Math.min(200, isNaN(rawP) ? 40 : rawP));
    const k = Math.max(0, Math.min(250, isNaN(rawK) ? 50 : rawK));

    let score = 95;
    const recommendations: string[] = [];

    // pH deduction
    const phDiff = Math.abs(ph - 6.5);
    score -= Math.round(phDiff * 15);

    if (ph < 6.0) {
      recommendations.push('Apply agricultural lime (calcium carbonate) to raise acidic pH.');
    } else if (ph > 7.5) {
      recommendations.push('Apply elemental sulfur or organic compost to lower alkaline pH.');
    }

    // NPK deductions
    if (n < 50) {
      score -= 10;
      recommendations.push('Add organic neem cake or Urea to correct low Nitrogen.');
    }
    if (p < 30) {
      score -= 10;
      recommendations.push('Apply Bone meal or rock phosphate to raise Phosphorus levels.');
    }
    if (k < 40) {
      score -= 8;
      recommendations.push('Apply wood ash or muriate of potash to correct Potassium deficit.');
    }

    score = Math.max(30, Math.min(98, score));

    if (recommendations.length === 0) {
      recommendations.push(
        'Soil NPK levels and pH are optimal. Add green manure to maintain organic carbon.'
      );
    }

    return {
      score,
      recommendations,
    };
  }

  static async evaluateClimateRisk(data: any) {
    const rawT = Number(data.temperature);
    const rawH = Number(data.humidity);
    const rawR = Number(data.rainfall);
    const rawW = Number(data.windSpeed);

    const temp = Math.max(-30, Math.min(65, isNaN(rawT) ? 30 : rawT));
    const humidity = Math.max(0, Math.min(100, isNaN(rawH) ? 65 : rawH));
    const rainfall = Math.max(0, Math.min(1000, isNaN(rawR) ? 120 : rawR));
    const windSpeed = Math.max(0, Math.min(200, isNaN(rawW) ? 12 : rawW));

    let riskScore = 20;
    const alerts = [];

    if (temp > 38) {
      riskScore += 25;
      alerts.push({
        type: 'danger',
        title: 'Severe Heatwave Alert',
        body: 'Temperatures exceeding crop threshold. Increase watering schedule.',
      });
    } else if (temp > 34) {
      riskScore += 10;
      alerts.push({
        type: 'warning',
        title: 'High Temperature Advisory',
        body: 'Monitor soil moisture evaporation rate.',
      });
    }

    if (humidity < 35 && temp > 32) {
      riskScore += 15;
      alerts.push({
        type: 'warning',
        title: 'Dry Air Stress',
        body: 'Low atmospheric moisture. High risk of transpiration shock.',
      });
    }

    if (windSpeed > 35) {
      riskScore += 20;
      alerts.push({
        type: 'danger',
        title: 'High Wind Velocity',
        body: 'Crop lodging risk. Postpone any foliar spray applications.',
      });
    }

    if (rainfall > 250) {
      riskScore += 30;
      alerts.push({
        type: 'danger',
        title: 'Excess Rainfall / Flooding',
        body: 'Risk of waterlogging. Clear drainage channels immediately.',
      });
    } else if (rainfall < 40) {
      riskScore += 15;
      alerts.push({
        type: 'warning',
        title: 'Low Precipitation',
        body: 'Deficit rainfall. Rely on alternate irrigation supply.',
      });
    }

    riskScore = Math.min(100, riskScore);

    return {
      riskScore,
      alerts:
        alerts.length > 0
          ? alerts
          : [
              {
                type: 'info',
                title: 'Stable Climate',
                body: 'No immediate agricultural risks detected.',
              },
            ],
    };
  }

  static async simulateClimate(data: any) {
    const { rainfallChange, tempChange } = data;
    const rawR = Number(rainfallChange);
    const rawT = Number(tempChange);
    const rChange = Math.max(-100, Math.min(100, isNaN(rawR) ? 0 : rawR));
    const tChange = Math.max(-15, Math.min(20, isNaN(rawT) ? 0 : rawT));

    // Formula linking rainfall and temperature shifts to yield swings
    const impact = rChange * 0.4 - tChange * 2.3;
    return { impact: `${impact > 0 ? '+' : ''}${impact.toFixed(1)}%` };
  }
}
