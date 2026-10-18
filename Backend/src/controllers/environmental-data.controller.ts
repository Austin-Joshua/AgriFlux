import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { WeatherIngestionService } from '../services/weather-ingestion.service';
import { SatelliteProcessingService } from '../services/satellite-processing.service';
import { SoilDataService } from '../services/soil-data.service';
import { CropStatisticsService } from '../services/crop-statistics.service';
import { ENVIRONMENTAL_VARIABLE_REGISTRY } from '../config/environmental-registry';

/**
 * GET /api/environmental/registry
 * Returns authoritative typed definitions and validation bounds for all environmental variables
 */
export const getEnvironmentalRegistry = (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    version: '1.0.0',
    totalVariables: Object.keys(ENVIRONMENTAL_VARIABLE_REGISTRY).length,
    registry: ENVIRONMENTAL_VARIABLE_REGISTRY,
  });
};

/**
 * GET /api/environmental/weather
 * Retrieves historical weather observations for Thanjavur, Tamil Nadu
 */
export const getHistoricalWeather = async (req: Request, res: Response) => {
  try {
    const { granularity, startDate, endDate, limit } = req.query;

    const rawLimit = limit ? parseInt(limit as string, 10) : 60;
    const safeLimit = Math.min(365, Math.max(1, isNaN(rawLimit) ? 60 : rawLimit));

    const result = await WeatherIngestionService.queryObservations({
      granularity: (granularity as 'hourly' | 'daily') || 'daily',
      startDate: startDate as string,
      endDate: endDate as string,
      limit: safeLimit,
    });

    return res.status(200).json({
      success: true,
      metadata: {
        location: 'Thanjavur, Tamil Nadu',
        coordinates: { latitude: 10.790861, longitude: 79.098145 },
        elevation: '59m',
        source: 'Open-Meteo Historical Weather Reanalysis',
        dataType: 'historical_reanalysis_estimate',
        disclaimer:
          'Data represents historical atmospheric reanalysis model estimates, distinct from physical on-farm IoT sensors.',
      },
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve historical weather observations.',
      error: error.message,
    });
  }
};

/**
 * GET /api/environmental/satellite/ndvi
 * Retrieves Sentinel-2 L2A satellite-derived NDVI observations
 */
export const getSatelliteNDVI = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const rawLimit = limit ? parseInt(limit as string, 10) : 20;
    const safeLimit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));

    const result = await SatelliteProcessingService.queryObservations({
      startDate: startDate as string,
      endDate: endDate as string,
      limit: safeLimit,
    });

    return res.status(200).json({
      success: true,
      metadata: {
        region: 'Thanjavur, Tamil Nadu',
        tileId: 'T44NPM',
        constellation: 'Copernicus Sentinel-2',
        instrument: 'MSI (Multi-Spectral Instrument)',
        processingLevel: 'Level-2A (Surface Reflectance)',
        formula: 'NDVI = (B08 - B04) / (B08 + B04)',
        spectralBands: {
          red: 'B04 (665 nm)',
          nir: 'B08 (842 nm)',
        },
        dataType: 'satellite_derived_spectral_index',
        disclaimer:
          'Satellite NDVI reflects canopy chlorophyll absorption at 10m spatial resolution. It is distinct from direct capacitive soil moisture measurements.',
      },
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve satellite NDVI observations.',
      error: error.message,
    });
  }
};

/**
 * GET /api/environmental/soil
 * Retrieves latest verified soil test profile for region
 */
export const getSoilProfile = async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;

    const coords = lat && lon ? { latitude: lat, longitude: lon } : undefined;
    const profile = await SoilDataService.getLatestSoilProfile(coords);

    return res.status(200).json({
      success: true,
      metadata: {
        disclaimer:
          'Soil test profile reflects laboratory or Soil Health Card chemistry (0-15cm sampling depth), distinct from surface moisture readings.',
      },
      ...profile,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve soil profile.',
      error: error.message,
    });
  }
};

/**
 * POST /api/environmental/soil/ingest
 * Ingests a verified Soil Health Card or laboratory record
 */
export const ingestSoilData = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload?.latitude || !payload?.longitude || payload?.ph === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Invalid soil payload: latitude, longitude, and ph are required.',
      });
    }

    const observation = await SoilDataService.ingestSoilRecord(payload);

    return res.status(201).json({
      success: true,
      message: 'Soil Health Card observation ingested successfully.',
      data: observation,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Failed to ingest soil record.',
      error: error.message,
    });
  }
};

/**
 * GET /api/environmental/crop-statistics
 * Queries official DES APY historical production statistics
 */
export const getCropStatistics = async (req: Request, res: Response) => {
  try {
    const { district, crop, year } = req.query;

    const result = await CropStatisticsService.queryStatistics({
      district: district as string,
      crop: crop as string,
      agriculturalYear: year as string,
    });

    const baseline = await CropStatisticsService.getDistrictYieldBaseline(
      district as string,
      crop as string
    );

    return res.status(200).json({
      success: true,
      baseline,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve crop production statistics.',
      error: error.message,
    });
  }
};

const validateSafeDataPath = (filePath?: string): boolean => {
  if (!filePath || typeof filePath !== 'string') return true;
  const resolved = path.resolve(filePath);
  const cwd = path.resolve(process.cwd());
  const parent = path.resolve(process.cwd(), '..');
  // Ensure strict directory boundary checking to prevent prefix-matching sibling paths
  const isWithinRepo =
    resolved === cwd ||
    resolved === parent ||
    resolved.startsWith(cwd + path.sep) ||
    resolved.startsWith(parent + path.sep);
  const hasValidExt = /\.(csv|xls|xlsx|json)$/i.test(resolved);
  return isWithinRepo && hasValidExt;
};

/**
 * POST /api/environmental/crop-statistics/ingest
 * Triggers ingestion of official DES APY report file
 */
export const ingestCropStatistics = async (req: Request, res: Response) => {
  try {
    const customPath = req.body?.filePath;
    if (customPath && !validateSafeDataPath(customPath)) {
      return res.status(400).json({
        success: false,
        message:
          'Security error: File path traversal outside authorized Data directories is strictly prohibited.',
      });
    }

    const candidatePaths = [
      path.resolve(process.cwd(), '..', 'Data', 'horizontal_crop_vertical_year_report.xls'),
      path.resolve(process.cwd(), 'Data', 'horizontal_crop_vertical_year_report.xls'),
      path.resolve(__dirname, '..', '..', '..', 'Data', 'horizontal_crop_vertical_year_report.xls'),
    ];
    const defaultPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
    const targetFile = customPath || defaultPath;

    const summary = await CropStatisticsService.ingestDESReport(targetFile);

    return res.status(200).json({
      success: true,
      message: 'DES crop production statistics report ingested successfully.',
      summary,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to ingest crop statistics report.',
      error: error.message,
    });
  }
};

/**
 * POST /api/environmental/ingest/weather
 * Triggers ingestion of Open-Meteo CSV file
 */
export const triggerWeatherIngestion = async (req: Request, res: Response) => {
  try {
    const customPath = req.body?.filePath;
    if (customPath && !validateSafeDataPath(customPath)) {
      return res.status(400).json({
        success: false,
        message:
          'Security error: File path traversal outside authorized Data directories is strictly prohibited.',
      });
    }

    const candidatePaths = [
      path.resolve(process.cwd(), '..', 'Data', 'open-meteo-10.79N79.10E59m.csv'),
      path.resolve(process.cwd(), 'Data', 'open-meteo-10.79N79.10E59m.csv'),
      path.resolve(__dirname, '..', '..', '..', 'Data', 'open-meteo-10.79N79.10E59m.csv'),
    ];
    const defaultPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
    const targetFile = customPath || defaultPath;

    const maxHourly = req.body?.maxHourlyRows ? Number(req.body.maxHourlyRows) : undefined;
    const maxDaily = req.body?.maxDailyRows ? Number(req.body.maxDailyRows) : undefined;

    const summary = await WeatherIngestionService.ingestOpenMeteoCSV(targetFile, {
      maxHourlyRows: maxHourly,
      maxDailyRows: maxDaily,
    });

    return res.status(200).json({
      success: true,
      message: 'Open-Meteo historical weather CSV ingested successfully.',
      summary,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to ingest weather CSV.',
      error: error.message,
    });
  }
};

/**
 * POST /api/environmental/ingest/satellite
 * Ingests a verified Sentinel-2 L2A band matrix for Thanjavur
 */
export const ingestSatelliteData = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload?.productIdentifier || !payload?.acquisitionDate || !payload?.samples) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid Sentinel-2 payload: productIdentifier, acquisitionDate, and samples array are required.',
      });
    }

    const observation = await SatelliteProcessingService.ingestObservation(payload);

    return res.status(201).json({
      success: true,
      message: 'Sentinel-2 L2A observation processed and persisted successfully.',
      data: observation,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process Sentinel-2 observation.',
      error: error.message,
    });
  }
};
