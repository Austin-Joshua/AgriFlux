import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { WeatherIngestionService } from '../services/weather-ingestion.service';
import { SatelliteProcessingService } from '../services/satellite-processing.service';

/**
 * GET /api/environmental/weather
 * Retrieves historical weather observations for Thanjavur, Tamil Nadu
 */
export const getHistoricalWeather = async (req: Request, res: Response) => {
  try {
    const { granularity, startDate, endDate, limit } = req.query;

    const result = await WeatherIngestionService.queryObservations({
      granularity: (granularity as 'hourly' | 'daily') || 'daily',
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string, 10) : 60,
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

    const result = await SatelliteProcessingService.queryObservations({
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string, 10) : 20,
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
 * POST /api/environmental/ingest/weather
 * Triggers ingestion of Open-Meteo CSV file
 */
export const triggerWeatherIngestion = async (req: Request, res: Response) => {
  try {
    const customPath = req.body?.filePath;
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
