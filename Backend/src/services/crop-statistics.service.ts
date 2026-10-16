import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import CropProductionStatistic, {
  ICropProductionStatistic,
} from '../../../Database/Models/CropProductionStatistic';
import { isDBConnected } from '../config/db';

export interface CropStatisticRecord {
  state: string;
  district: string;
  crop: string;
  season: string;
  agriculturalYear: string;
  areaHectares: number;
  productionTonnes: number;
  yieldTonnePerHectare: number;
  yieldKgPerHectare: number;
  source: string;
  verificationStatus: 'verified_official' | 'calculated_from_ap' | 'provisional';
}

export interface APYIngestionSummary {
  filePath: string;
  totalRecordsProcessed: number;
  totalRecordsImported: number;
  records: CropStatisticRecord[];
  executionTimeMs: number;
}

// In-memory cache for development / demo mode when MongoDB is offline
const memoryAPYRecords: Map<string, CropStatisticRecord> = new Map();

export class CropStatisticsService {
  /**
   * Parses an official Directorate of Economics & Statistics (DES) APY export file.
   * Handles HTML table format (.xls export from desagri.gov.in) with multi-row headers.
   */
  static async ingestDESReport(filePath: string): Promise<APYIngestionSummary> {
    const startTime = Date.now();
    if (!fs.existsSync(filePath)) {
      throw new Error(`DES APY report file not found at: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records: CropStatisticRecord[] = [];

    // Parse HTML table rows using structured regex
    // Looks for rows with <td> values matching the DES schema:
    // <td>1. Tamil Nadu</td> <td>1. Thanjavur</td> <td>1997 - 1998</td> <td>181,496.00</td> <td>489,770.00</td> <td>2.70</td>
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match: RegExpExecArray | null;

    while ((match = rowRegex.exec(fileContent)) !== null) {
      const rowHtml = match[1];
      if (rowHtml.includes('<th') || !rowHtml.includes('<td')) {
        continue; // Skip header rows
      }

      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        // Strip HTML tags and trim
        const cleanText = cellMatch[1].replace(/<[^>]+>/g, '').trim();
        if (cleanText) cells.push(cleanText);
      }

      if (cells.length >= 6) {
        // Normalize state and district names (strip numbering like "1. Tamil Nadu")
        const state = cells[0].replace(/^\d+\.\s*/, '').trim();
        const district = cells[1].replace(/^\d+\.\s*/, '').trim();
        const agriculturalYear = cells[2].trim();

        // Parse numerical values, stripping commas
        const areaHectares = parseFloat(cells[3].replace(/,/g, ''));
        const productionTonnes = parseFloat(cells[4].replace(/,/g, ''));
        let yieldTonnePerHectare = parseFloat(cells[5].replace(/,/g, ''));

        if (isNaN(areaHectares) || areaHectares <= 0) continue;
        if (isNaN(productionTonnes) || productionTonnes < 0) continue;

        // If yield is missing or invalid, calculate Y = P / A
        let verificationStatus: CropStatisticRecord['verificationStatus'] = 'verified_official';
        if (isNaN(yieldTonnePerHectare) || yieldTonnePerHectare <= 0) {
          yieldTonnePerHectare = Math.round((productionTonnes / areaHectares) * 100) / 100;
          verificationStatus = 'calculated_from_ap';
        }

        const yieldKgPerHectare = Math.round(yieldTonnePerHectare * 1000);

        const record: CropStatisticRecord = {
          state,
          district,
          crop: 'Rice',
          season: 'Whole Year',
          agriculturalYear,
          areaHectares,
          productionTonnes,
          yieldTonnePerHectare,
          yieldKgPerHectare,
          source:
            'Directorate of Economics and Statistics (DES), Ministry of Agriculture & Farmers Welfare, Govt of India',
          verificationStatus,
        };

        records.push(record);

        // Store in memory
        const key = `${state}_${district}_${record.crop}_${record.season}_${agriculturalYear}`;
        memoryAPYRecords.set(key, record);
      }
    }

    // Persist to MongoDB if connected
    const isConnected = isDBConnected || mongoose.connection.readyState === 1;
    if (isConnected && records.length > 0) {
      const ops = records.map((rec) => ({
        updateOne: {
          filter: {
            state: rec.state,
            district: rec.district,
            crop: rec.crop,
            season: rec.season,
            agriculturalYear: rec.agriculturalYear,
          },
          update: { $set: rec },
          upsert: true,
        },
      }));
      await CropProductionStatistic.bulkWrite(ops as any, { ordered: false });
    }

    return {
      filePath,
      totalRecordsProcessed: records.length,
      totalRecordsImported: records.length,
      records,
      executionTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Queries crop production statistics by district, crop, and year.
   */
  static async queryStatistics(filter: {
    district?: string;
    crop?: string;
    agriculturalYear?: string;
  }) {
    const targetDistrict = filter.district || 'Thanjavur';
    const targetCrop = filter.crop || 'Rice';

    const isConnected = isDBConnected || mongoose.connection.readyState === 1;
    if (isConnected) {
      const query: Record<string, any> = {
        district: new RegExp(`^${targetDistrict}$`, 'i'),
        crop: new RegExp(`^${targetCrop}$`, 'i'),
      };
      if (filter.agriculturalYear) {
        query.agriculturalYear = filter.agriculturalYear;
      }

      const results = await CropProductionStatistic.find(query)
        .sort({ agriculturalYear: -1 })
        .lean();
      if (results.length > 0) {
        return {
          source:
            'Directorate of Economics and Statistics (DES), Ministry of Agriculture & Farmers Welfare',
          count: results.length,
          data: results,
        };
      }
    }

    // Fallback to in-memory store
    let list = Array.from(memoryAPYRecords.values());
    list = list.filter(
      (r) =>
        r.district.toLowerCase() === targetDistrict.toLowerCase() &&
        r.crop.toLowerCase() === targetCrop.toLowerCase()
    );
    if (filter.agriculturalYear) {
      list = list.filter((r) => r.agriculturalYear === filter.agriculturalYear);
    }

    return {
      source:
        'Directorate of Economics and Statistics (DES), Ministry of Agriculture & Farmers Welfare',
      count: list.length,
      data: list,
    };
  }

  /**
   * Returns district-level baseline yield for context comparison.
   */
  static async getDistrictYieldBaseline(district = 'Thanjavur', crop = 'Rice') {
    const stats = await this.queryStatistics({ district, crop });
    if (stats.data.length > 0) {
      const latest = stats.data[0];
      return {
        isAvailable: true,
        district: latest.district,
        crop: latest.crop,
        agriculturalYear: latest.agriculturalYear,
        isHistoricalArchive: true,
        historicalScope: `Archived Agricultural Year ${latest.agriculturalYear} (DES Official Record)`,
        disclaimer:
          'Archived district-level macro statistic from historical DES reporting. Not a modern seasonal yield benchmark or individual farm productivity target.',
        yieldKgPerHectare: latest.yieldKgPerHectare,
        yieldTonnePerHectare: latest.yieldTonnePerHectare,
        areaHectares: latest.areaHectares,
        productionTonnes: latest.productionTonnes,
        source: latest.source,
      };
    }

    // Default historical baseline from Thanjavur Rice DES record (1997-1998)
    return {
      isAvailable: true,
      district: 'Thanjavur',
      crop: 'Rice',
      agriculturalYear: '1997 - 1998',
      isHistoricalArchive: true,
      historicalScope:
        'Archived Agricultural Year 1997–1998 (Whole Year). Not a modern seasonal yield target.',
      disclaimer:
        'Archived district-level macro statistic from Agricultural Year 1997–1998. Not a modern seasonal yield benchmark or an individual farm yield target.',
      yieldKgPerHectare: 2700,
      yieldTonnePerHectare: 2.7,
      areaHectares: 181496.0,
      productionTonnes: 489770.0,
      source:
        'Directorate of Economics and Statistics (DES), Ministry of Agriculture & Farmers Welfare (Historical Baseline)',
    };
  }
}
