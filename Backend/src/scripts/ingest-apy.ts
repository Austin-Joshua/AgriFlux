import path from 'path';
import fs from 'fs';
import { CropStatisticsService } from '../services/crop-statistics.service';
import { connectDB } from '../config/db';

async function run() {
  console.log('================================================================');
  console.log('   AGRIFLUX DES CROP STATISTICS (APY) INGESTION SCRIPT          ');
  console.log('================================================================');

  await connectDB();

  const candidatePaths = [
    path.resolve(process.cwd(), '..', 'Data', 'horizontal_crop_vertical_year_report.xls'),
    path.resolve(process.cwd(), 'Data', 'horizontal_crop_vertical_year_report.xls'),
    path.resolve(__dirname, '..', '..', '..', 'Data', 'horizontal_crop_vertical_year_report.xls'),
  ];

  const targetFile = candidatePaths.find((p) => fs.existsSync(p));
  if (!targetFile) {
    console.error('❌ DES APY file not found in candidate paths:');
    candidatePaths.forEach((p) => console.error(`   - ${p}`));
    process.exit(1);
  }

  console.log(`Target DES Report: ${targetFile}`);
  console.log('Parsing and validating official Area, Production, and Yield records...');

  try {
    const summary = await CropStatisticsService.ingestDESReport(targetFile);
    console.log('\n✔ INGESTION COMPLETED SUCCESSFULLY:');
    console.log(`  Source:             Directorate of Economics & Statistics (DES)`);
    console.log(`  Records Processed:  ${summary.totalRecordsProcessed}`);
    console.log(`  Records Imported:   ${summary.totalRecordsImported}`);
    summary.records.forEach((r, idx) => {
      console.log(
        `  [Record ${idx + 1}] ${r.state} · ${r.district} · ${r.crop} (${r.season}) · ${r.agriculturalYear}`
      );
      console.log(
        `             Area: ${r.areaHectares.toLocaleString()} Ha | Production: ${r.productionTonnes.toLocaleString()} Tonnes | Yield: ${r.yieldTonnePerHectare} t/Ha (${r.yieldKgPerHectare} kg/Ha)`
      );
    });
    console.log(`  Execution Time:     ${summary.executionTimeMs} ms`);
    console.log('================================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Ingestion failed:', err.message);
    process.exit(1);
  }
}

run();
