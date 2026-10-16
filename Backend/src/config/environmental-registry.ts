/**
 * AgriFlux Canonical Environmental Variable Registry
 * -------------------------------------------------
 * Single authoritative source of truth for all environmental, meteorological,
 * orbital, edaphic, and agronomic variables across the AgriFlux platform.
 *
 * Prevents contradictory unit conversions, inconsistent source labels,
 * and unsafe coupling of macro-estimates into real-time farm actuators.
 */

export type SourceType =
  | 'reanalysis_model_estimate'
  | 'satellite_spectral_index'
  | 'laboratory_soil_test'
  | 'soil_health_card'
  | 'gridded_soil_estimate'
  | 'official_agricultural_statistic'
  | 'iot_capacitive_probe'
  | 'iot_simulator';

export type TemporalResolution =
  | 'sub_hourly'
  | 'hourly'
  | 'daily'
  | '5_day_orbital'
  | 'seasonal'
  | 'annual';

export interface EnvironmentalVariableDefinition {
  canonicalName: string;
  displayLabel: string;
  category: 'meteorology' | 'remote_sensing' | 'soil' | 'crop_statistics' | 'telemetry';
  unit: string;
  sourceType: SourceType;
  primarySource: string;
  spatialResolution: string;
  temporalResolution: TemporalResolution;
  validationRange: {
    min: number;
    max: number;
  };
  missingDataPolicy: 'reject' | 'interpolate' | 'flag_unavailable';
  safeForActuatorCoupling: boolean;
  safeForRecommendation: boolean;
  description: string;
}

export const ENVIRONMENTAL_VARIABLE_REGISTRY: Record<string, EnvironmentalVariableDefinition> = {
  // --- METEOROLOGY (Open-Meteo ERA5-Land Reanalysis) ---
  temperature_2m_mean: {
    canonicalName: 'temperature_2m_mean',
    displayLabel: 'Daily Mean Ambient Temperature',
    category: 'meteorology',
    unit: '°C',
    sourceType: 'reanalysis_model_estimate',
    primarySource: 'Open-Meteo ERA5-Land Reanalysis (ECMWF)',
    spatialResolution: '0.1° (~9 km grid)',
    temporalResolution: 'daily',
    validationRange: { min: -10.0, max: 60.0 },
    missingDataPolicy: 'flag_unavailable',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description:
      'Estimated 2-meter air temperature model reanalysis. Distinct from on-farm microclimate.',
  },
  temperature_2m_max: {
    canonicalName: 'temperature_2m_max',
    displayLabel: 'Daily Maximum Temperature',
    category: 'meteorology',
    unit: '°C',
    sourceType: 'reanalysis_model_estimate',
    primarySource: 'Open-Meteo ERA5-Land Reanalysis (ECMWF)',
    spatialResolution: '0.1° (~9 km grid)',
    temporalResolution: 'daily',
    validationRange: { min: -10.0, max: 65.0 },
    missingDataPolicy: 'flag_unavailable',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description: 'Daily peak ambient temperature used for heatwave stress risk assessment.',
  },
  temperature_2m_min: {
    canonicalName: 'temperature_2m_min',
    displayLabel: 'Daily Minimum Temperature',
    category: 'meteorology',
    unit: '°C',
    sourceType: 'reanalysis_model_estimate',
    primarySource: 'Open-Meteo ERA5-Land Reanalysis (ECMWF)',
    spatialResolution: '0.1° (~9 km grid)',
    temporalResolution: 'daily',
    validationRange: { min: -10.0, max: 50.0 },
    missingDataPolicy: 'flag_unavailable',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description:
      'Daily minimum ambient temperature used for nocturnal chilling or dewpoint analysis.',
  },
  precipitation_sum: {
    canonicalName: 'precipitation_sum',
    displayLabel: 'Daily Precipitation Sum',
    category: 'meteorology',
    unit: 'mm',
    sourceType: 'reanalysis_model_estimate',
    primarySource: 'Open-Meteo ERA5-Land Reanalysis (ECMWF)',
    spatialResolution: '0.1° (~9 km grid)',
    temporalResolution: 'daily',
    validationRange: { min: 0.0, max: 500.0 },
    missingDataPolicy: 'reject',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description: 'Cumulative atmospheric precipitation. Zero values are valid and preserved.',
  },
  et0_fao_evapotranspiration: {
    canonicalName: 'et0_fao_evapotranspiration',
    displayLabel: 'FAO-56 Reference Evapotranspiration (ET₀)',
    category: 'meteorology',
    unit: 'mm',
    sourceType: 'reanalysis_model_estimate',
    primarySource: 'Open-Meteo ERA5-Land Reanalysis (ECMWF)',
    spatialResolution: '0.1° (~9 km grid)',
    temporalResolution: 'hourly',
    validationRange: { min: 0.0, max: 35.0 },
    missingDataPolicy: 'flag_unavailable',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description:
      'Reference evapotranspiration from hypothetical grass surface. Must not be confused with actual crop ETc.',
  },
  relative_humidity_2m: {
    canonicalName: 'relative_humidity_2m',
    displayLabel: 'Relative Humidity at 2m',
    category: 'meteorology',
    unit: '%',
    sourceType: 'reanalysis_model_estimate',
    primarySource: 'Open-Meteo ERA5-Land Reanalysis (ECMWF)',
    spatialResolution: '0.1° (~9 km grid)',
    temporalResolution: 'hourly',
    validationRange: { min: 0.0, max: 100.0 },
    missingDataPolicy: 'flag_unavailable',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description: 'Ambient atmospheric moisture saturation percentage.',
  },

  // --- REMOTE SENSING (Copernicus Sentinel-2 Level-2A) ---
  sentinel2_ndvi: {
    canonicalName: 'sentinel2_ndvi',
    displayLabel: 'Sentinel-2 L2A Normalized Difference Vegetation Index',
    category: 'remote_sensing',
    unit: 'unitless (-1.0 to 1.0)',
    sourceType: 'satellite_spectral_index',
    primarySource: 'Copernicus Sentinel-2 MSI (Level-2A BOA Reflectance)',
    spatialResolution: '10 meters',
    temporalResolution: '5_day_orbital',
    validationRange: { min: -1.0, max: 1.0 },
    missingDataPolicy: 'flag_unavailable',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description:
      'Normalized ratio (B08 - B04)/(B08 + B04). Reflects canopy green biomass absorption at 10m ground resolution.',
  },
  sentinel2_cloud_cover_pct: {
    canonicalName: 'sentinel2_cloud_cover_pct',
    displayLabel: 'Sentinel-2 Cloud & Shadow Mask Coverage',
    category: 'remote_sensing',
    unit: '%',
    sourceType: 'satellite_spectral_index',
    primarySource: 'Copernicus Sentinel-2 MSI (Scene Classification Layer)',
    spatialResolution: '20 meters (resampled to 10m)',
    temporalResolution: '5_day_orbital',
    validationRange: { min: 0.0, max: 100.0 },
    missingDataPolicy: 'reject',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description: 'Percentage of tile pixels obscured by clouds, thin cirrus, or cloud shadows.',
  },

  // --- SOIL PROPERTIES (Soil Health Card / SoilGrids / Laboratory) ---
  soil_ph: {
    canonicalName: 'soil_ph',
    displayLabel: 'Soil Acidity / Alkalinity (pH)',
    category: 'soil',
    unit: 'pH units',
    sourceType: 'soil_health_card',
    primarySource: 'Government of India Soil Health Card / ICAR-TNAU Laboratory Analysis',
    spatialResolution: 'Point / Field Polygon (0-15 cm sampling depth)',
    temporalResolution: 'seasonal',
    validationRange: { min: 3.5, max: 10.5 },
    missingDataPolicy: 'reject',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description: 'Negative log of hydrogen ion activity in 1:2.5 soil-water suspension.',
  },
  soil_ec: {
    canonicalName: 'soil_ec',
    displayLabel: 'Electrical Conductivity (Salinity)',
    category: 'soil',
    unit: 'dS/m',
    sourceType: 'soil_health_card',
    primarySource: 'Government of India Soil Health Card / ICAR-TNAU Laboratory Analysis',
    spatialResolution: 'Point / Field Polygon (0-15 cm sampling depth)',
    temporalResolution: 'seasonal',
    validationRange: { min: 0.0, max: 15.0 },
    missingDataPolicy: 'reject',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description: 'Measure of dissolved soluble salts in soil solution at 25°C.',
  },
  soil_organic_carbon: {
    canonicalName: 'soil_organic_carbon',
    displayLabel: 'Organic Carbon (OC)',
    category: 'soil',
    unit: '%',
    sourceType: 'soil_health_card',
    primarySource: 'Walkley-Black Wet Oxidation / TNAU Soil Testing Laboratory',
    spatialResolution: 'Point / Field Polygon (0-15 cm sampling depth)',
    temporalResolution: 'seasonal',
    validationRange: { min: 0.05, max: 8.0 },
    missingDataPolicy: 'reject',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description:
      'Primary indicator of soil biological health, cation exchange capacity, and microbial fertility.',
  },
  soil_available_n: {
    canonicalName: 'soil_available_n',
    displayLabel: 'Available Nitrogen (N)',
    category: 'soil',
    unit: 'kg/ha',
    sourceType: 'soil_health_card',
    primarySource: 'Alkaline Permanganate Method / Soil Health Card',
    spatialResolution: 'Point / Field Polygon',
    temporalResolution: 'seasonal',
    validationRange: { min: 10.0, max: 600.0 },
    missingDataPolicy: 'flag_unavailable',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description: 'Mineralizable nitrogen accessible for vegetative crop uptake.',
  },
  soil_available_p: {
    canonicalName: 'soil_available_p',
    displayLabel: 'Available Phosphorus (P₂O₅)',
    category: 'soil',
    unit: 'kg/ha',
    sourceType: 'soil_health_card',
    primarySource: 'Olsen / Bray Method (ICAR-TNAU)',
    spatialResolution: 'Point / Field Polygon',
    temporalResolution: 'seasonal',
    validationRange: { min: 2.0, max: 150.0 },
    missingDataPolicy: 'flag_unavailable',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description: 'Plant-available phosphorus essential for early root development and tillering.',
  },
  soil_available_k: {
    canonicalName: 'soil_available_k',
    displayLabel: 'Available Potassium (K₂O)',
    category: 'soil',
    unit: 'kg/ha',
    sourceType: 'soil_health_card',
    primarySource: 'Neutral Normal Ammonium Acetate Method',
    spatialResolution: 'Point / Field Polygon',
    temporalResolution: 'seasonal',
    validationRange: { min: 20.0, max: 800.0 },
    missingDataPolicy: 'flag_unavailable',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description:
      'Exchangeable potassium vital for osmotic regulation, stem vigor, and pest tolerance.',
  },

  // --- CROP PRODUCTION STATISTICS (Directorate of Economics and Statistics) ---
  crop_apy_area: {
    canonicalName: 'crop_apy_area',
    displayLabel: 'Crop Cultivation Area',
    category: 'crop_statistics',
    unit: 'Hectares',
    sourceType: 'official_agricultural_statistic',
    primarySource:
      'Directorate of Economics & Statistics (DES), Ministry of Agriculture & Farmers Welfare',
    spatialResolution: 'District Level (Thanjavur)',
    temporalResolution: 'annual',
    validationRange: { min: 1.0, max: 1000000.0 },
    missingDataPolicy: 'reject',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description:
      'Official reported agricultural acreage. District baseline, not individual farm parcel.',
  },
  crop_apy_production: {
    canonicalName: 'crop_apy_production',
    displayLabel: 'Total Crop Production',
    category: 'crop_statistics',
    unit: 'Tonnes',
    sourceType: 'official_agricultural_statistic',
    primarySource:
      'Directorate of Economics & Statistics (DES), Ministry of Agriculture & Farmers Welfare',
    spatialResolution: 'District Level (Thanjavur)',
    temporalResolution: 'annual',
    validationRange: { min: 1.0, max: 5000000.0 },
    missingDataPolicy: 'reject',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description: 'Total harvested agricultural output across district reporting units.',
  },
  crop_apy_yield: {
    canonicalName: 'crop_apy_yield',
    displayLabel: 'District Average Crop Yield',
    category: 'crop_statistics',
    unit: 'Tonnes/Hectare',
    sourceType: 'official_agricultural_statistic',
    primarySource:
      'Directorate of Economics & Statistics (DES), Ministry of Agriculture & Farmers Welfare',
    spatialResolution: 'District Level (Thanjavur)',
    temporalResolution: 'annual',
    validationRange: { min: 0.1, max: 15.0 },
    missingDataPolicy: 'reject',
    safeForActuatorCoupling: false,
    safeForRecommendation: true,
    description:
      'Historical official yield benchmark (Production / Area). Contextual baseline only.',
  },

  // --- ON-FARM IoT TELEMETRY (ESP32 Sensor Probes) ---
  soil_moisture_volumetric: {
    canonicalName: 'soil_moisture_volumetric',
    displayLabel: 'Root-Zone Soil Moisture',
    category: 'telemetry',
    unit: '%',
    sourceType: 'iot_capacitive_probe',
    primarySource: 'ESP32 In-Situ Capacitive Soil Probe',
    spatialResolution: 'In-situ Point Probe (10 cm depth)',
    temporalResolution: 'sub_hourly',
    validationRange: { min: 0.0, max: 100.0 },
    missingDataPolicy: 'reject',
    safeForActuatorCoupling: true,
    safeForRecommendation: true,
    description: 'Direct capacitive dielectric permittivity measurement of soil water content.',
  },
};
