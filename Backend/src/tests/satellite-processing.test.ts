/**
 * AgriFlux Automated Test Suite: Sentinel-2 L2A Satellite Processing & NDVI
 * Verifies:
 * 1. Pixel-level NDVI calculation: (B08 - B04) / (B08 + B04)
 * 2. Surface reflectance scaling (0-10000 DN to 0.0-1.0)
 * 3. Zero denominator and invalid pixel edge cases
 * 4. Scene Classification (SCL) cloud filtering
 * 5. Spatial summary statistics (mean, median, min, max, stdDev)
 * 6. Agronomic vegetation vigor classification
 * 7. Honest empty state reporting when Copernicus raster is pending
 */
import assert from 'assert';
import {
  SatelliteProcessingService,
  Sentinel2BandSample,
} from '../services/satellite-processing.service';

export async function runSatelliteProcessingTests(): Promise<
  { name: string; passed: boolean; error?: string }[]
> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Pixel-level NDVI calculation with 0-10000 DN scaling
  try {
    // Dense healthy paddy canopy: Red reflectance ~0.05 (500 DN), NIR reflectance ~0.45 (4500 DN)
    // Expected NDVI = (0.45 - 0.05) / (0.45 + 0.05) = 0.40 / 0.50 = 0.80
    const pixel = SatelliteProcessingService.calculatePixelNDVI(500, 4500);

    assert.strictEqual(pixel.isValid, true);
    assert.strictEqual(pixel.ndvi, 0.8);
    results.push({
      name: 'Satellite Processing: Correct NDVI calculation with DN scaling (0.80)',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Satellite Processing: Correct NDVI calculation with DN scaling (0.80)',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Edge cases: zero denominator and unphysical reflectance
  try {
    const zeroDenom = SatelliteProcessingService.calculatePixelNDVI(0, 0);
    assert.strictEqual(zeroDenom.isValid, true);
    assert.strictEqual(zeroDenom.ndvi, 0.0, 'Zero reflectance should yield 0.0 without crash');

    const negativeReflectance = SatelliteProcessingService.calculatePixelNDVI(-100, 2000);
    assert.strictEqual(negativeReflectance.isValid, false, 'Negative reflectance must be rejected');

    const nanVal = SatelliteProcessingService.calculatePixelNDVI(NaN, 2000);
    assert.strictEqual(nanVal.isValid, false, 'NaN pixel must be rejected');

    results.push({
      name: 'Satellite Processing: Handles zero denominators and invalid pixels safely',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Satellite Processing: Handles zero denominators and invalid pixels safely',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Matrix aggregation with SCL cloud filtering
  try {
    const sampleMatrix: Sentinel2BandSample[] = [
      { pixelIndex: 1, b04_red: 600, b08_nir: 4200 }, // Healthy crop: ~0.75
      { pixelIndex: 2, b04_red: 800, b08_nir: 3800 }, // Healthy crop: ~0.65
      { pixelIndex: 3, b04_red: 1200, b08_nir: 2400 }, // Moderate crop: ~0.33
      { pixelIndex: 4, b04_red: 2500, b08_nir: 2500 }, // Bare soil: 0.0
      { pixelIndex: 5, b04_red: 5000, b08_nir: 5000, scl_classification: 9 }, // Cloud pixel (SCL=9) -> must be filtered
    ];

    const stats = SatelliteProcessingService.processBandMatrix(sampleMatrix);

    assert.ok(stats.mean > 0.4, 'Mean NDVI should reflect vegetated field');
    assert.strictEqual(stats.validPixelPercentage, 80, '4 out of 5 pixels should be valid');
    assert.strictEqual(stats.cloudCoveragePercentage, 20, '1 out of 5 pixels is cloud (20%)');
    assert.ok(stats.min <= stats.median && stats.median <= stats.max);
    assert.strictEqual(stats.vegetationHealth, 'moderate_vigor');

    results.push({
      name: 'Satellite Processing: Filters cloud mask (SCL) and aggregates spatial statistics',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Satellite Processing: Filters cloud mask (SCL) and aggregates spatial statistics',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Ingestion and retrieval of synthetic Sentinel-2 L2A summary
  try {
    const observation = await SatelliteProcessingService.ingestObservation({
      productIdentifier: 'S2A_MSIL2A_20261014T050721_N0500_R019_T44NPM_TEST_FIXTURE',
      acquisitionDate: '2026-10-14T05:07:21Z',
      satellite: 'Sentinel-2A',
      regionName: 'Thanjavur Pilot Basin',
      samples: [
        { pixelIndex: 1, b04_red: 400, b08_nir: 4800 }, // High vigor (~0.85)
        { pixelIndex: 2, b04_red: 500, b08_nir: 4500 }, // High vigor (~0.80)
        { pixelIndex: 3, b04_red: 600, b08_nir: 4200 }, // High vigor (~0.75)
      ],
      reportedCloudCoveragePercentage: 2.5,
    });

    assert.strictEqual(observation.vegetationHealth, 'high_vigor');
    assert.ok(observation.ndvi.mean >= 0.7);
    assert.strictEqual(observation.tileId, 'T44NPM');
    assert.strictEqual(observation.status, 'observed');

    results.push({
      name: 'Satellite Processing: Successfully ingests L2A observation with high-vigor classification',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Satellite Processing: Successfully ingests L2A observation with high-vigor classification',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: Honest empty state for unobserved date ranges
  try {
    const unobserved: any = await SatelliteProcessingService.queryObservations({
      startDate: '2020-01-01',
      endDate: '2020-01-02',
    });

    assert.strictEqual(unobserved.isDataAvailable, false);
    assert.ok(
      unobserved.message && unobserved.message.includes('No Copernicus Sentinel-2 Level-2A raster')
    );
    assert.ok(Array.isArray(unobserved.requiredBands) && unobserved.requiredBands.length >= 2);
    results.push({
      name: 'Satellite Processing: Returns honest diagnostic empty state when data is pending',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Satellite Processing: Returns honest diagnostic empty state when data is pending',
      passed: false,
      error: err.message,
    });
  }

  return results;
}
