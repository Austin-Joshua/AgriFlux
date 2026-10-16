import { Router } from 'express';
import * as environmentalController from '../controllers/environmental-data.controller';
import { auth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * Public / Authenticated Read Endpoints
 * Delivers canonical variable registry, historical weather, Sentinel-2 NDVI,
 * verified soil profiles, and official DES crop production statistics.
 */
router.get('/registry', environmentalController.getEnvironmentalRegistry);
router.get('/weather', environmentalController.getHistoricalWeather);
router.get('/satellite/ndvi', environmentalController.getSatelliteNDVI);
router.get('/soil', environmentalController.getSoilProfile);
router.get('/crop-statistics', environmentalController.getCropStatistics);

/**
 * Protected Administrative & Agronomist Ingestion Endpoints
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

router.post(
  '/soil/ingest',
  auth,
  requireRole('farmer', 'agronomist', 'admin'),
  environmentalController.ingestSoilData
);

router.post(
  '/crop-statistics/ingest',
  auth,
  requireRole('admin'),
  environmentalController.ingestCropStatistics
);

export default router;
