# AgriFlux — Historical Weather & Copernicus Satellite Data Integration

**Version:** 1.0.0  
**Pilot Region:** Thanjavur, Tamil Nadu (Cauvery Delta Basin)  
**Geographic Anchor:** Latitude 10.790861°N, Longitude 79.098145°E, Elevation 59.0m, Timezone GMT  
**Branch:** `feature/weather-satellite-integration`  

---

## 1. Executive Summary

This feature integrates macro-climatic reanalysis data and orbital remote sensing indices into the AgriFlux intelligence platform:
1. **Open-Meteo Historical Weather Reanalysis (ERA5-Land):** High-resolution, multi-year meteorological dataset (2021–2026) consisting of 50,712 hourly observations and 2,113 daily summaries for Thanjavur, Tamil Nadu.
2. **Copernicus Sentinel-2 Level-2A (MSI) Satellite Data Pipeline:** Strict mathematical computation of Normalized Difference Vegetation Index ($\text{NDVI} = \frac{B08 - B04}{B08 + B04}$) with Scene Classification Layer (SCL) cloud/cirrus/shadow masking, 10m spatial resolution, and honest unobserved diagnostic empty states (strictly zero fabricated data).
3. **Decoupled Agronomic Safeguard:** Strict operational decoupling between macro-environmental estimates/orbital spectral indices and physical closed-loop irrigation actuators, preventing uncalibrated macro models from triggering unvalidated farm interventions.

---

## 2. Ingested Datasets & Provenance

### 2.1 Open-Meteo Historical Weather Dataset
- **Local Source Path:** `Data/open-meteo-10.79N79.10E59m.csv`
- **Model:** European Centre for Medium-Range Weather Forecasts (ECMWF) ERA5-Land Reanalysis.
- **Data Type Classification:** `historical_reanalysis_estimate` (strictly separated from direct capacitive on-farm IoT sensors).
- **Structure:**
  - **Metadata Header:** Lat 10.790861, Lon 79.098145, Elevation 59.0m, Timezone GMT.
  - **Hourly Observations Section:** 50,712 rows (`2021-01-01T00:00` to `2026-10-14T23:00`). Metrics: ambient temperature 2m (°C), relative humidity 2m (%), FAO-56 Penman-Monteith reference evapotranspiration $\text{ET}_0$ (mm).
  - **Daily Aggregations Section:** 2,113 rows (`2021-01-01` to `2026-10-14`). Metrics: mean temperature 2m (°C), minimum temperature (°C), maximum temperature (°C), precipitation sum (mm).
- **Physical Bounds Validation:**
  - Temperature: $[-10.0^\circ\text{C}, 65.0^\circ\text{C}]$
  - Relative Humidity: $[0.0\%, 100.0\%]$
  - Precipitation: $[0.0\text{ mm}, 500.0\text{ mm}]$
  - FAO-56 Reference $\text{ET}_0$: $[0.0\text{ mm}, 35.0\text{ mm}]$
- **Idempotency:** Unique compound index on `{ 'coordinates.latitude': 1, 'coordinates.longitude': 1, granularity: 1, dateStr: 1 }`. Duplicate re-imports execute idempotent bulk upserts without creating duplicated records.

### 2.2 Copernicus Sentinel-2 L2A Satellite Observations
- **Constellation:** European Space Agency (ESA) Copernicus Sentinel-2.
- **Instrument:** Multi-Spectral Instrument (MSI).
- **Processing Level:** Level-2A (Bottom-Of-Atmosphere Surface Reflectance, BOA).
- **Target Tile:** `T44NPM` (Cauvery Delta Basin, Tamil Nadu).
- **Spatial Resolution:** 10 meters (B04 and B08).
- **Spectral Bands:**
  - Red: Band 4 ($\lambda_c = 665\text{ nm}$, 10m)
  - Near-Infrared: Band 8 ($\lambda_c = 842\text{ nm}$, 10m)
  - Quality Mask: Scene Classification Layer (SCL)
- **Spectral Index Formula:**
  $$\text{NDVI} = \frac{\rho_{\text{NIR}} - \rho_{\text{Red}}}{\rho_{\text{NIR}} + \rho_{\text{Red}}} = \frac{B08 - B04}{B08 + B04}$$
  - Band Digital Numbers (DN) scaled to surface reflectance ($0.0 - 1.0$) using Sentinel-2 L2A radiometric scale factor 10,000.
  - Zero-denominator guard $\max(0.0001, B08 + B04)$.
  - SCL filtering: pixels classified as cloud shadow (3), medium probability cloud (8), high probability cloud (9), or thin cirrus (10) are excluded from vegetation spatial aggregations.
- **Agronomic Vegetation Health Classification:**
  - $\text{NDVI} \ge 0.60$: `high_vigor` (Dense canopy, peak vegetative growth)
  - $0.35 \le \text{NDVI} < 0.60$: `moderate_vigor` (Developing canopy, standard crop foliage)
  - $0.15 \le \text{NDVI} < 0.35$: `sparse_vegetation` (Early emergence or post-harvest residue)
  - $\text{NDVI} < 0.15$: `water_or_bare_soil`
  - Cloud cover $> 60\%$: `cloud_obscured`
- **Raster Storage Policy:** Raw Sentinel-2 L2A `.SAFE` / `.jp2` rasters are NOT stored directly in MongoDB. The backend extracts spatial statistics (mean, median, min, max, stdDev, valid pixel %, cloud cover %) and stores derived records in `SatelliteObservation`.
- **Honest Empty State Policy:** When no Sentinel-2 L2A product has been ingested for a temporal query, the API returns an explicit diagnostic empty state (`isDataAvailable: false`) with required band criteria and target tile details. AgriFlux does NOT fabricate synthetic NDVI values.

---

## 3. Database Schemas

### 3.1 `HistoricalWeather` (`Database/Models/HistoricalWeather.ts`)
```typescript
interface IHistoricalWeather {
  locationName: string;                    // Default: 'Thanjavur, Tamil Nadu'
  coordinates: {
    latitude: number;                     // 10.790861
    longitude: number;                    // 79.098145
  };
  elevationMeters: number;                // 59.0
  timezone: string;                       // 'GMT'
  granularity: 'hourly' | 'daily';
  dateStr: string;                        // 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm'
  timestamp: Date;
  temperature?: {
    mean?: number;
    min?: number;
    max?: number;
    instantaneous?: number;
  };
  relativeHumidityPct?: number;
  precipitationMm?: number;
  et0EvapotranspirationMm?: number;
  source: 'open-meteo-reanalysis';
  dataType: 'historical_reanalysis_estimate';
  status: 'observed' | 'estimated' | 'interpolated';
  importedAt: Date;
}
```
**Compound Index:**
```typescript
HistoricalWeatherSchema.index(
  { 'coordinates.latitude': 1, 'coordinates.longitude': 1, granularity: 1, dateStr: 1 },
  { unique: true }
);
```

### 3.2 `SatelliteObservation` (`Database/Models/SatelliteObservation.ts`)
```typescript
interface ISatelliteObservation {
  regionName: string;                     // 'Thanjavur, Tamil Nadu'
  coordinates: {
    latitude: number;
    longitude: number;
  };
  spatialResolutionMeters: number;        // 10
  tileId: string;                         // 'T44NPM'
  constellation: 'Copernicus';
  satellite: string;                      // 'Copernicus Sentinel-2'
  instrument: 'MSI';
  processingLevel: 'Level-2A';
  productIdentifier: string;              // e.g., 'S2A_MSIL2A_20240315T050651_...'
  acquisitionDate: Date;
  ndvi: {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
  };
  cloudCoveragePercentage: number;
  validPixelPercentage: number;
  processingMethod: string;
  bandSources: {
    redBand: 'B04';
    nirBand: 'B08';
    sceneClassificationBand?: 'SCL';
  };
  vegetationHealth: 'high_vigor' | 'moderate_vigor' | 'sparse_vegetation' | 'water_or_bare_soil' | 'cloud_obscured';
  dataType: 'satellite_derived_spectral_index';
  status: 'observed' | 'cloud_masked';
  importedAt: Date;
}
```
**Compound Index:**
```typescript
SatelliteObservationSchema.index(
  { 'coordinates.latitude': 1, 'coordinates.longitude': 1, acquisitionDate: 1 },
  { unique: true }
);
```

---

## 4. API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/environmental/weather` | Public / Auth | Queries historical weather observations for Thanjavur by `granularity` (`daily`/`hourly`), `startDate`, `endDate`, and `limit`. |
| `GET` | `/api/environmental/satellite/ndvi` | Public / Auth | Queries Copernicus Sentinel-2 NDVI observations by date range. Returns honest empty state if no raster has been imported. |
| `POST` | `/api/environmental/ingest/weather` | Admin (`requireRole('admin')`) | Triggers server-side CSV streaming ingestion from `filePath` (defaults to `Data/open-meteo-10.79N79.10E59m.csv`). |
| `POST` | `/api/environmental/ingest/satellite` | Admin (`requireRole('admin')`) | Ingests verified Sentinel-2 L2A band matrices with SCL masking, calculates spatial statistics, and persists observations. |

---

## 5. Ingestion CLI Commands

### 5.1 Weather Ingestion CLI
Run the automated streaming ingestion script from the backend directory:
```powershell
cd c:\Users\austi\OneDrive\Desktop\AgriFlux\AgriFlux\Backend
npm run ingest:weather
```
**Actual Benchmark Execution Output:**
```
✔ INGESTION COMPLETED SUCCESSFULLY:
  Location:           Thanjavur, Tamil Nadu
  Coordinates:        10.790861°N, 79.098145°E (59m)
  Timezone:           GMT
  Total Lines:        52831
  Hourly Records:     50712 (processed 50712)
  Daily Summaries:    2113 (processed 2113)
  Date Range:         2021-01-01 to 2026-10-14T23:00
  Skipped/Malformed:  0
  Duration:           343 ms
```

---

## 6. Frontend Dashboard Integration

### 6.1 Component: `EnvironmentalIntelligence.tsx` (`Frontend/src/components/EnvironmentalIntelligence.tsx`)
- **Placement:** Integrated directly above the bottom row of the AgriFlux Dashboard (`Frontend/src/pages/Dashboard.tsx`).
- **Interactive Features:**
  - **Tab Switcher:** Toggle smoothly between Open-Meteo Weather Reanalysis and Copernicus Sentinel-2 NDVI.
  - **Open-Meteo View:**
    - Dual-axis interactive chart: Recharts ComposedChart with ambient temperature area gradient (left Y-axis) and precipitation rainfall bars (right Y-axis).
    - Summary KPI cards: Mean Temp (°C), Total Rainfall (mm), FAO-56 Reference Evapotranspiration $\text{ET}_0$ (mm), and Observation Timeline count.
    - Granularity Selector: Daily summaries vs Hourly continuous timeline.
    - Temporal Range Switcher: 7-day, 14-day, 30-day windows.
  - **Sentinel-2 NDVI View:**
    - Displays genuine L2A surface reflectance observations, Mean/Min/Max NDVI, standard deviation, cloud cover %, and vegetation vigor badge (`High Vigor`, `Moderate Vigor`, etc.).
    - Meaningful, transparent empty state when raw products are awaiting upload, complete with target tile (`T44NPM`), required spectral bands, and a demonstration processor.
  - **Agronomic Decoupling Safeguard:**
    - Prominent banner explicitly stating that reanalysis weather estimates and satellite indices are isolated from automated closed-loop irrigation pumps until on-site capacitive calibration is verified.

---

## 7. Automated Test Suites & Validation

All 6 test suites comprising 30 automated tests execute in `Backend/src/tests/runAllTests.ts`:
```powershell
cd c:\Users\austi\OneDrive\Desktop\AgriFlux\AgriFlux\Backend
npm test
```
**Test Results:**
- **Suite 1:** Authentication, Token Integrity & RBAC Middleware (5/5 PASS)
- **Suite 2:** IoT Telemetry Ingestion, Validation & Buffering (6/6 PASS)
- **Suite 3:** Field Intelligence Engine & Closed-Loop Decisions (6/6 PASS)
- **Suite 4:** AI & Agronomic Prediction Services (5/5 PASS)
- **Suite 5:** Historical Weather CSV Ingestion & Idempotency (3/3 PASS):
  - *Weather Ingestion: Parses metadata and filters malformed/out-of-range rows*
  - *Weather Ingestion: Idempotent re-importing prevents duplicate records*
  - *Weather Ingestion: Date range query accurately retrieves temporal slice*
- **Suite 6:** Sentinel-2 L2A Satellite NDVI Processing & Quality Filters (5/5 PASS):
  - *Satellite Processing: Correct NDVI calculation with DN scaling (0.80)*
  - *Satellite Processing: Handles zero denominators and invalid pixels safely*
  - *Satellite Processing: Filters cloud mask (SCL) and aggregates spatial statistics*
  - *Satellite Processing: Successfully ingests L2A observation with high-vigor classification*
  - *Satellite Processing: Returns honest diagnostic empty state when data is pending*

**Total Tests:** 30  
**Passed:** 30 (100.0%)  
**Failed:** 0  

---

## 8. Verification & Handoff Checklist

| Gate | Status | Command |
|---|---|---|
| Backend Test Suite | ✅ 30/30 Passed | `npm test` |
| Backend TypeScript Build | ✅ 0 Errors | `npm run build` |
| Backend ESLint | ✅ 0 Errors, 0 Warnings | `npm run lint` |
| Open-Meteo CSV Ingestion | ✅ 52,825 records ingested in 343ms | `npm run ingest:weather` |
| Frontend TypeScript Build | In Progress / Validating | `npm run build` |
| Safety & Integrity Rules | ✅ Complied | No fabricated datasets, no secrets exposed, no overwrite of user work |
