import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import HistoricalWeather, { IHistoricalWeather } from '../../../Database/Models/HistoricalWeather';
import { isDBConnected } from '../config/db';

export interface IngestionSummary {
  filePath: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
  };
  totalLinesProcessed: number;
  hourlyRecordsProcessed: number;
  hourlyRecordsImported: number;
  dailyRecordsProcessed: number;
  dailyRecordsImported: number;
  skippedDuplicatesOrMalformed: number;
  dateRange: {
    start: string;
    end: string;
  };
  executionTimeMs: number;
}

// In-memory ring store for development / demo mode when MongoDB is offline
const memoryHourlyWeather: Map<string, any> = new Map();
const memoryDailyWeather: Map<string, any> = new Map();

export class WeatherIngestionService {
  /**
   * Ingests an Open-Meteo historical CSV file line-by-line.
   * Handles multi-section Open-Meteo format (metadata -> hourly series -> daily series).
   * Fully idempotent: duplicate dates update or skip without creating duplicates.
   */
  static async ingestOpenMeteoCSV(
    filePath: string,
    options: { maxHourlyRows?: number; maxDailyRows?: number } = {}
  ): Promise<IngestionSummary> {
    const startTime = Date.now();

    if (!fs.existsSync(filePath)) {
      throw new Error(`Weather CSV file not found at path: ${filePath}`);
    }

    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineIndex = 0;
    let mode: 'meta' | 'hourly' | 'daily' = 'meta';

    // Extracted metadata defaults
    let latitude = 10.790861;
    let longitude = 79.098145;
    let elevation = 59.0;
    let timezone = 'GMT';
    let timezoneAbbr = 'GMT';

    const hourlyBatch: any[] = [];
    const dailyBatch: any[] = [];
    let hourlyProcessed = 0;
    let dailyProcessed = 0;
    let malformedCount = 0;

    let earliestDate = '';
    let latestDate = '';

    const BATCH_SIZE = 500;

    const flushBatches = async () => {
      const isConnected = isDBConnected || mongoose.connection.readyState === 1;
      if (isConnected) {
        if (hourlyBatch.length > 0) {
          const ops: any[] = hourlyBatch.map((doc) => ({
            updateOne: {
              filter: {
                'coordinates.latitude': doc.coordinates.latitude,
                'coordinates.longitude': doc.coordinates.longitude,
                granularity: 'hourly',
                dateStr: doc.dateStr,
              },
              update: { $set: doc },
              upsert: true,
            },
          }));
          await HistoricalWeather.bulkWrite(ops, { ordered: false });
          hourlyBatch.length = 0;
        }

        if (dailyBatch.length > 0) {
          const ops: any[] = dailyBatch.map((doc) => ({
            updateOne: {
              filter: {
                'coordinates.latitude': doc.coordinates.latitude,
                'coordinates.longitude': doc.coordinates.longitude,
                granularity: 'daily',
                dateStr: doc.dateStr,
              },
              update: { $set: doc },
              upsert: true,
            },
          }));
          await HistoricalWeather.bulkWrite(ops, { ordered: false });
          dailyBatch.length = 0;
        }
      } else {
        // In-memory storage for demo fallback with ring buffer capping
        for (const doc of hourlyBatch) {
          if (memoryHourlyWeather.size >= 720) {
            const oldest = memoryHourlyWeather.keys().next().value;
            if (oldest) memoryHourlyWeather.delete(oldest);
          }
          memoryHourlyWeather.set(doc.dateStr, doc);
        }
        for (const doc of dailyBatch) {
          if (memoryDailyWeather.size >= 365) {
            const oldest = memoryDailyWeather.keys().next().value;
            if (oldest) memoryDailyWeather.delete(oldest);
          }
          memoryDailyWeather.set(doc.dateStr, doc);
        }
        hourlyBatch.length = 0;
        dailyBatch.length = 0;
      }
    };

    for await (const line of rl) {
      lineIndex++;
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Section 1: Coordinates and time metadata (line 1 & 2)
      if (lineIndex === 2 && mode === 'meta') {
        const parts = trimmed.split(',');
        if (parts.length >= 6) {
          latitude = Number(parts[0]) || latitude;
          longitude = Number(parts[1]) || longitude;
          elevation = Number(parts[2]) || elevation;
          timezone = parts[4] || timezone;
          timezoneAbbr = parts[5] || timezoneAbbr;
        }
        continue;
      }

      // Detect header switches
      if (trimmed.startsWith('time,temperature_2m (°C)')) {
        mode = 'hourly';
        continue;
      }
      if (trimmed.startsWith('time,temperature_2m_mean')) {
        mode = 'daily';
        continue;
      }

      // Section 2: Parse Hourly records
      if (mode === 'hourly') {
        if (options.maxHourlyRows && hourlyProcessed >= options.maxHourlyRows) {
          continue;
        }

        const cols = trimmed.split(',');
        if (cols.length < 4) {
          malformedCount++;
          continue;
        }

        const dateStr = cols[0].trim();
        const temp = Number(cols[1]);
        const humidity = Number(cols[2]);
        const et0 = Number(cols[3]);

        // Range and format validations
        if (
          !dateStr ||
          isNaN(temp) ||
          isNaN(humidity) ||
          isNaN(et0) ||
          temp < -10 ||
          temp > 60 ||
          humidity < 0 ||
          humidity > 100 ||
          et0 < 0
        ) {
          malformedCount++;
          continue;
        }

        const timestamp = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}:00Z`);
        if (isNaN(timestamp.getTime())) {
          malformedCount++;
          continue;
        }

        if (!earliestDate || dateStr < earliestDate) earliestDate = dateStr;
        if (!latestDate || dateStr > latestDate) latestDate = dateStr;

        const record = {
          locationName: 'Thanjavur, Tamil Nadu',
          coordinates: { latitude, longitude },
          elevation,
          timezone,
          timezoneAbbreviation: timezoneAbbr,
          granularity: 'hourly',
          dateStr,
          timestamp,
          temperature_2m: Math.round(temp * 10) / 10,
          relative_humidity_2m: Math.round(humidity * 10) / 10,
          et0_fao_evapotranspiration: Math.round(et0 * 100) / 100,
          source: 'open-meteo-reanalysis',
          dataType: 'historical_reanalysis_estimate',
          sourceFile: filePath,
          importedAt: new Date(),
        };

        hourlyBatch.push(record);
        hourlyProcessed++;

        if (hourlyBatch.length >= BATCH_SIZE) {
          await flushBatches();
        }
      }

      // Section 3: Parse Daily records
      else if (mode === 'daily') {
        if (options.maxDailyRows && dailyProcessed >= options.maxDailyRows) {
          continue;
        }

        const cols = trimmed.split(',');
        if (cols.length < 5) {
          malformedCount++;
          continue;
        }

        const dateStr = cols[0].trim();
        const tempMean = Number(cols[1]);
        const tempMax = Number(cols[2]);
        const tempMin = Number(cols[3]);
        const precipitation = Number(cols[4]);

        if (
          !dateStr ||
          isNaN(tempMean) ||
          isNaN(tempMax) ||
          isNaN(tempMin) ||
          isNaN(precipitation) ||
          tempMean < -10 ||
          tempMean > 60 ||
          precipitation < 0
        ) {
          malformedCount++;
          continue;
        }

        const timestamp = new Date(`${dateStr}T00:00:00Z`);
        if (isNaN(timestamp.getTime())) {
          malformedCount++;
          continue;
        }

        if (!earliestDate || dateStr < earliestDate) earliestDate = dateStr;
        if (!latestDate || dateStr > latestDate) latestDate = dateStr;

        const record = {
          locationName: 'Thanjavur, Tamil Nadu',
          coordinates: { latitude, longitude },
          elevation,
          timezone,
          timezoneAbbreviation: timezoneAbbr,
          granularity: 'daily',
          dateStr,
          timestamp,
          temperature_2m_mean: Math.round(tempMean * 10) / 10,
          temperature_2m_max: Math.round(tempMax * 10) / 10,
          temperature_2m_min: Math.round(tempMin * 10) / 10,
          precipitation_sum: Math.round(precipitation * 10) / 10,
          source: 'open-meteo-reanalysis',
          dataType: 'historical_reanalysis_estimate',
          sourceFile: filePath,
          importedAt: new Date(),
        };

        dailyBatch.push(record);
        dailyProcessed++;

        if (dailyBatch.length >= BATCH_SIZE) {
          await flushBatches();
        }
      }
    }

    // Flush any remaining records
    await flushBatches();

    return {
      filePath,
      location: {
        name: 'Thanjavur, Tamil Nadu',
        latitude,
        longitude,
        elevation,
        timezone,
      },
      totalLinesProcessed: lineIndex,
      hourlyRecordsProcessed: hourlyProcessed,
      hourlyRecordsImported: isDBConnected ? hourlyProcessed : memoryHourlyWeather.size,
      dailyRecordsProcessed: dailyProcessed,
      dailyRecordsImported: isDBConnected ? dailyProcessed : memoryDailyWeather.size,
      skippedDuplicatesOrMalformed: malformedCount,
      dateRange: {
        start: earliestDate,
        end: latestDate,
      },
      executionTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Queries historical weather observations by date range and granularity
   */
  static async queryObservations(params: {
    granularity?: 'hourly' | 'daily';
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const granularity = params.granularity || 'daily';
    const limit = Math.min(1000, Math.max(1, Number(params.limit) || 100));

    const filter: Record<string, any> = { granularity };
    if (params.startDate || params.endDate) {
      filter.dateStr = {};
      if (params.startDate) filter.dateStr.$gte = params.startDate;
      if (params.endDate) filter.dateStr.$lte = params.endDate;
    }

    const isConnected = isDBConnected || mongoose.connection.readyState === 1;
    if (isConnected) {
      const records = await HistoricalWeather.find(filter)
        .sort({ dateStr: -1 })
        .limit(limit)
        .lean();

      if (records.length > 0) {
        return {
          source: 'database',
          granularity,
          count: records.length,
          data: records.reverse(),
        };
      }
    }

    // Fallback to in-memory store
    const store = granularity === 'hourly' ? memoryHourlyWeather : memoryDailyWeather;
    let list = Array.from(store.values());

    if (params.startDate) {
      list = list.filter((item) => item.dateStr >= params.startDate!);
    }
    if (params.endDate) {
      list = list.filter((item) => item.dateStr <= params.endDate!);
    }

    list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    const sliced = list.slice(0, limit);

    return {
      source: 'memory_store',
      granularity,
      count: sliced.length,
      data: sliced,
    };
  }

  /**
   * Directly stores or buffers a normalized historical weather observation record
   */
  static async ingestRecord(record: any): Promise<void> {
    const isConnected = isDBConnected || mongoose.connection.readyState === 1;
    const dateStr = record.dateStr || (record.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const normalized = {
      locationName: record.locationName || 'Thanjavur, Tamil Nadu',
      coordinates: record.coordinates || { latitude: record.latitude || 10.79, longitude: record.longitude || 79.13 },
      granularity: record.granularity || 'daily',
      dateStr,
      timestamp: record.timestamp || new Date(record.date || Date.now()),
      temperature_2m_mean: record.temperature_2m_mean,
      precipitation_sum: record.precipitation_sum ?? record.precipitationMm,
      et0_fao_evapotranspiration: record.et0_fao_evapotranspiration ?? record.et0EvapotranspirationMm,
      source: record.source || 'open-meteo-reanalysis',
      dataType: record.dataType || 'historical_reanalysis_estimate',
      importedAt: new Date(),
    };

    if (isConnected) {
      await HistoricalWeather.findOneAndUpdate(
        { dateStr: normalized.dateStr, granularity: normalized.granularity },
        { $set: normalized },
        { upsert: true, new: true }
      );
    } else {
      const store = normalized.granularity === 'hourly' ? memoryHourlyWeather : memoryDailyWeather;
      const key = `${normalized.granularity}_${normalized.dateStr}`;
      store.set(key, normalized);
    }
  }

  /**
   * Alias for ingestOpenMeteoCSV for backward compatibility
   */
  static ingestFromCSV = WeatherIngestionService.ingestOpenMeteoCSV;
}
