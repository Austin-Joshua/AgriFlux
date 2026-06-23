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

    const n = Number(data.nitrogen) || 60;
    const p = Number(data.phosphorus) || 40;
    const k = Number(data.potassium) || 50;
    const ph = Number(data.soilPh) || 6.5;

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

    const predicted = Math.round(base * phMultiplier * npkMultiplier);
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
    };
  }

  static async getIrrigationSchedule(data: any) {
    const crop = data.cropType || 'Rice';
    const moisture = Number(data.soilMoisture) || 45;
    const temp = Number(data.temperature) || 30;

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
    const ph = Number(data.ph) || 6.5;
    const n = Number(data.nitrogen) || 60;
    const p = Number(data.phosphorus) || 40;
    const k = Number(data.potassium) || 50;

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
    const temp = Number(data.temperature) || 30;
    const humidity = Number(data.humidity) || 65;
    const rainfall = Number(data.rainfall) || 120;
    const windSpeed = Number(data.windSpeed) || 12;

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
    const rChange = Number(rainfallChange) || 0;
    const tChange = Number(tempChange) || 0;

    // Formula linking rainfall and temperature shifts to yield swings
    const impact = rChange * 0.4 - tChange * 2.3;
    return { impact: `${impact > 0 ? '+' : ''}${impact.toFixed(1)}%` };
  }
}
