import { Router } from 'express';
import * as environmentalController from '../controllers/environmental-data.controller';
import { auth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * Public / Authenticated Read Endpoints
 * Delivers historical Open-Meteo weather series & Sentinel-2 NDVI metrics
 */
router.get('/weather', environmentalController.getHistoricalWeather);
router.get('/satellite/ndvi', environmentalController.getSatelliteNDVI);

/**
 * Protected Administrative Ingestion Endpoints
 * Used by ingestion scripts and administrators
 */
router.post(
  '/ingest/weather',
  auth,
  requireRole('admin'),
  environmentalController.triggerWeatherIngestion
);

router.post(
  '/ingest/satellite',
  auth,
  requireRole('admin'),
  environmentalController.ingestSatelliteData
);

export default router;
