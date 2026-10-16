/**
 * AgriFlux Open-Meteo Weather Ingestion CLI
 * Usage:
 *   npx ts-node src/scripts/ingest-weather.ts [path_to_csv]
 */
import path from 'path';
import { connectDB } from '../config/db';
import { WeatherIngestionService } from '../services/weather-ingestion.service';

async function main() {
  console.log('================================================================');
  console.log('    AGRIFLUX OPEN-METEO HISTORICAL WEATHER INGESTION SCRIPT    ');
  console.log('================================================================');

  // Attempt database connection
  await connectDB();

  const argPath = process.argv[2];
  const targetFile = argPath
    ? path.resolve(process.cwd(), argPath)
    : path.resolve(process.cwd(), '..', 'Data', 'open-meteo-10.79N79.10E59m.csv');

  console.log(`Target CSV: ${targetFile}`);
  console.log('Parsing and validating Open-Meteo reanalysis records...\n');

  try {
    const summary = await WeatherIngestionService.ingestOpenMeteoCSV(targetFile);

    console.log('✔ INGESTION COMPLETED SUCCESSFULLY:');
    console.log(`  Location:           ${summary.location.name}`);
    console.log(
      `  Coordinates:        ${summary.location.latitude}°N, ${summary.location.longitude}°E (${summary.location.elevation}m)`
    );
    console.log(`  Timezone:           ${summary.location.timezone}`);
    console.log(`  Total Lines:        ${summary.totalLinesProcessed}`);
    console.log(
      `  Hourly Records:     ${summary.hourlyRecordsImported} (processed ${summary.hourlyRecordsProcessed})`
    );
    console.log(
      `  Daily Summaries:    ${summary.dailyRecordsImported} (processed ${summary.dailyRecordsProcessed})`
    );
    console.log(`  Date Range:         ${summary.dateRange.start} to ${summary.dateRange.end}`);
    console.log(`  Skipped/Malformed:  ${summary.skippedDuplicatesOrMalformed}`);
    console.log(`  Duration:           ${summary.executionTimeMs} ms`);
    console.log('================================================================');
    process.exit(0);
  } catch (error: any) {
    console.error(`✖ Ingestion failed: ${error.message}`);
    process.exit(1);
  }
}

main();
