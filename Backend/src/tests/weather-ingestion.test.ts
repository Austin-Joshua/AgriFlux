/**
 * AgriFlux Automated Test Suite: Historical Weather CSV Ingestion
 * Uses a clearly-labelled SYNTHETIC test fixture to verify:
 * 1. Extraction of location metadata & coordinates
 * 2. Normalization of hourly and daily time-series
 * 3. Validation & rejection of out-of-range / malformed rows
 * 4. Idempotency (re-importing produces no duplicate observations)
 * 5. Date-range query filtering
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { WeatherIngestionService } from '../services/weather-ingestion.service';

export async function runWeatherIngestionTests(): Promise<
  { name: string; passed: boolean; error?: string }[]
> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Temporary synthetic CSV fixture (Explicitly labeled SYNTHETIC for test purposes)
  const fixturePath = path.resolve(__dirname, 'fixtures', 'synthetic-open-meteo.csv');
  const fixtureDir = path.dirname(fixturePath);

  if (!fs.existsSync(fixtureDir)) {
    fs.mkdirSync(fixtureDir, { recursive: true });
  }

  const syntheticCsvContent = `latitude,longitude,elevation,utc_offset_seconds,timezone,timezone_abbreviation
10.790861,79.098145,59.0,0,GMT,GMT

time,temperature_2m (°C),relative_humidity_2m (%),et0_fao_evapotranspiration (mm)
2026-05-01T00:00,24.5,88,0.02
2026-05-01T01:00,25.0,85,0.03
2026-05-01T02:00,26.2,80,0.15
2026-05-01T03:00,999.0,80,0.15
malformed_row_without_columns
2026-05-01T04:00,27.5,75,0.30

time,temperature_2m_mean (°C),temperature_2m_max (°C),temperature_2m_min (°C),precipitation_sum (mm)
2026-05-01,28.5,34.2,23.8,0.5
2026-05-02,29.1,35.0,24.2,0.0
2026-05-03,27.8,32.5,23.1,14.2
invalid_daily_row_here
`;

  fs.writeFileSync(fixturePath, syntheticCsvContent, 'utf-8');

  // Test 1: Ingest synthetic fixture and extract metadata
  try {
    const summary = await WeatherIngestionService.ingestOpenMeteoCSV(fixturePath);

    assert.strictEqual(summary.location.latitude, 10.790861);
    assert.strictEqual(summary.location.longitude, 79.098145);
    assert.strictEqual(summary.location.elevation, 59.0);
    assert.strictEqual(summary.location.timezone, 'GMT');
    assert.strictEqual(summary.hourlyRecordsProcessed, 4, 'Should import 4 valid hourly rows');
    assert.strictEqual(summary.dailyRecordsProcessed, 3, 'Should import 3 valid daily rows');
    assert.ok(
      summary.skippedDuplicatesOrMalformed >= 2,
      'Should reject the 999C out-of-range temp and malformed rows'
    );
    results.push({
      name: 'Weather Ingestion: Parses metadata and filters malformed/out-of-range rows',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Weather Ingestion: Parses metadata and filters malformed/out-of-range rows',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Idempotency verification (re-ingesting same data does not create duplicate entries)
  try {
    const summary2 = await WeatherIngestionService.ingestOpenMeteoCSV(fixturePath);
    const query = await WeatherIngestionService.queryObservations({
      granularity: 'daily',
      startDate: '2026-05-01',
      endDate: '2026-05-03',
    });

    assert.strictEqual(
      query.data.length,
      3,
      'Re-ingesting must not duplicate records (expected exactly 3 daily records)'
    );
    results.push({
      name: 'Weather Ingestion: Idempotent re-importing prevents duplicate records',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Weather Ingestion: Idempotent re-importing prevents duplicate records',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Date range query filtering
  try {
    const filtered = await WeatherIngestionService.queryObservations({
      granularity: 'daily',
      startDate: '2026-05-02',
      endDate: '2026-05-02',
    });

    assert.strictEqual(filtered.data.length, 1);
    assert.strictEqual(filtered.data[0].dateStr, '2026-05-02');
    assert.strictEqual(filtered.data[0].temperature_2m_mean, 29.1);
    assert.strictEqual(filtered.data[0].precipitation_sum, 0.0);
    results.push({
      name: 'Weather Ingestion: Date range query accurately retrieves temporal slice',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Weather Ingestion: Date range query accurately retrieves temporal slice',
      passed: false,
      error: err.message,
    });
  }

  // Cleanup temporary synthetic fixture
  try {
    if (fs.existsSync(fixturePath)) {
      fs.unlinkSync(fixturePath);
    }
  } catch {
    /* ignore */
  }

  return results;
}
