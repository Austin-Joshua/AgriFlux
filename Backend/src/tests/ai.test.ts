/**
 * AgriFlux Automated Test Suite: AI & Agronomic Calculation Services
 * Verifies domain logic for:
 * 1. Yield prediction and NPK/pH impact
 * 2. Irrigation schedule generation
 * 3. Soil health scoring and fertilizer recommendation
 * 4. Climate risk evaluation
 */
import assert from 'assert';
import { AIService } from '../services/ai.service';

export async function runAITests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Yield prediction computes calibrated base yield and risk
  try {
    const output = await AIService.predictYield({
      cropType: 'Wheat',
      nitrogen: 80,
      phosphorus: 45,
      potassium: 60,
      soilPh: 6.5,
    });

    assert.strictEqual(typeof output.predicted, 'number');
    assert.ok(
      output.predicted >= 3500 && output.predicted <= 4200,
      `Wheat yield should be in range 3500-4200 kg/ha, got ${output.predicted}`
    );
    assert.strictEqual(output.risk, 'Low');
    assert.ok(output.suggestions.length > 0);
    results.push({
      name: 'AI Service: Calibrated wheat yield prediction with balanced NPK',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'AI Service: Calibrated wheat yield prediction with balanced NPK',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Low Nitrogen flags Urea suggestion and lowers yield
  try {
    const output = await AIService.predictYield({
      cropType: 'Wheat',
      nitrogen: 20, // severe deficit
      phosphorus: 45,
      potassium: 60,
      soilPh: 6.5,
    });

    assert.ok(
      output.suggestions.some(
        (s) => s.toLowerCase().includes('nitrogen') || s.toLowerCase().includes('urea')
      )
    );
    assert.ok(output.predicted < 3500, 'Yield should be suppressed by nitrogen deficit');
    results.push({
      name: 'AI Service: Nitrogen deficit suppresses yield and suggests replenishment',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'AI Service: Nitrogen deficit suppresses yield and suggests replenishment',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Irrigation schedule suppresses watering when soil moisture > 70%
  try {
    const schedule = await AIService.getIrrigationSchedule({
      cropType: 'Wheat',
      soilMoisture: 75,
      temperature: 25,
    });

    assert.ok(Array.isArray(schedule), 'Schedule must be an array');
    assert.ok(
      schedule.some((s) => s.note.includes('Suppressed watering')),
      'High moisture must suppress irrigation'
    );
    results.push({
      name: 'AI Service: High moisture (>70%) suppresses irrigation volume',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'AI Service: High moisture (>70%) suppresses irrigation volume',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Soil analysis scores health and produces actionable remediation
  try {
    const soilHealth = await AIService.analyzeSoil({
      ph: 5.2, // acidic
      nitrogen: 30, // low
      phosphorus: 20, // low
      potassium: 35, // low
    });

    assert.ok(
      soilHealth.score < 70,
      `Score for degraded soil should be < 70, got ${soilHealth.score}`
    );
    assert.ok(
      soilHealth.recommendations.some((r) => r.includes('lime')),
      'Acidic soil must recommend lime'
    );
    assert.ok(
      soilHealth.recommendations.some(
        (r) => r.includes('Nitrogen') || r.includes('neem cake') || r.includes('Urea')
      )
    );
    results.push({
      name: 'AI Service: Soil analysis identifies acidic pH and NPK deficits',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'AI Service: Soil analysis identifies acidic pH and NPK deficits',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: Climate risk elevates score and generates alerts for heatwave
  try {
    const climate = await AIService.evaluateClimateRisk({
      temperature: 41, // severe heatwave
      humidity: 30,
      rainfall: 0,
      windSpeed: 25,
    });

    assert.ok(
      climate.riskScore > 35,
      `Heatwave should elevate risk score > 35, got ${climate.riskScore}`
    );
    assert.ok(
      climate.alerts.some((a: any) => a.title.includes('Heatwave')),
      'Must alert on heatwave condition'
    );
    results.push({ name: 'AI Service: Climate risk engine detects severe heatwave', passed: true });
  } catch (err: any) {
    results.push({
      name: 'AI Service: Climate risk engine detects severe heatwave',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
