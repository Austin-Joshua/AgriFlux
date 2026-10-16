/**
 * AgriFlux Master Automated Test Runner
 * Executes all test suites:
 * 1. Authentication & RBAC (auth.test.ts)
 * 2. IoT Telemetry Validation & Persistence (iot.test.ts)
 * 3. Field Intelligence Engine & Closed-Loop Outcomes (field-intelligence.test.ts)
 * 4. AI & Agronomic Calculation Services (ai.test.ts)
 */
import { runAuthTests } from './auth.test';
import { runIoTTests } from './iot.test';
import { runFieldIntelligenceTests } from './field-intelligence.test';
import { runAITests } from './ai.test';
import { runWeatherIngestionTests } from './weather-ingestion.test';
import { runSatelliteProcessingTests } from './satellite-processing.test';

async function main() {
  console.log('================================================================');
  console.log('       AGRIFLUX FULL-STACK AUTOMATED TEST SUITE EXECUTION       ');
  console.log('================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Environment: Node ${process.version}`);
  console.log('----------------------------------------------------------------\n');

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  const suites = [
    { name: 'Suite 1: Authentication, Token Integrity & RBAC Middleware', runner: runAuthTests },
    { name: 'Suite 2: IoT Telemetry Ingestion, Validation & Buffering', runner: runIoTTests },
    {
      name: 'Suite 3: Field Intelligence Engine & Closed-Loop Decisions',
      runner: runFieldIntelligenceTests,
    },
    { name: 'Suite 4: AI & Agronomic Prediction Services', runner: runAITests },
    {
      name: 'Suite 5: Historical Weather CSV Ingestion & Idempotency',
      runner: runWeatherIngestionTests,
    },
    {
      name: 'Suite 6: Sentinel-2 L2A Satellite NDVI Processing & Quality Filters',
      runner: runSatelliteProcessingTests,
    },
  ];

  for (const suite of suites) {
    console.log(`▶ Running ${suite.name}...`);
    const results = await suite.runner();
    for (const r of results) {
      totalTests++;
      if (r.passed) {
        totalPassed++;
        console.log(`  ✔ [PASS] ${r.name}`);
      } else {
        totalFailed++;
        console.error(`  ✖ [FAIL] ${r.name}`);
        if (r.error) {
          console.error(`     Error: ${r.error}`);
        }
      }
    }
    console.log('');
  }

  console.log('================================================================');
  console.log('                        TEST RUN SUMMARY                        ');
  console.log('================================================================');
  console.log(`Total Test Suites: ${suites.length}`);
  console.log(`Total Tests Run:   ${totalTests}`);
  console.log(`Passed Tests:      ${totalPassed}`);
  console.log(`Failed Tests:      ${totalFailed}`);
  console.log(`Success Rate:      ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
  console.log('================================================================');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
