# AgriFlux — Master Environmental Data Integration & System Hardening Report

**Project:** AgriFlux Agricultural Intelligence Platform  
**Target Pilot:** Thanjavur District, Tamil Nadu, India (Cauvery Delta Basin)  
**Geographic Anchor:** Latitude 10.787°N, Longitude 79.137°E (Elevation ~59m, Timezone: Asia/Kolkata)  
**Primary Crop:** Paddy / Rice (*Oryza sativa*)  
**Git Branch:** `feature/master-environmental-integration`  
**Base Commit:** `2c75f837`  
**Date of Audit & Integration:** 16 October 2026  

---

## 1. Executive Summary & Verification Baseline

AgriFlux has been hardened from an unverified prototype into an auditable, environmental-data-driven agricultural intelligence platform. By integrating genuine historical reanalysis weather, Sentinel-2 L2A orbital spectral algorithms, official Directorate of Economics and Statistics (DES) agricultural statistics, verified Soil Health Card chemistry, a formal Environmental Variable Registry, and a fail-closed IoT actuator state machine, AgriFlux eliminates data fabrication, enforces provenance tracking, and guarantees that macro-environmental estimates never trigger unvalidated physical actuation.

### Summary of System Health
- **Automated Backend Tests:** 10 Suites, 42 Tests, **100% Pass Rate** (`npm test`).
- **Backend Type-Checking & Linting:** 0 Errors, 0 Warnings (`tsc`, `eslint . --max-warnings 0`).
- **Frontend Type-Checking & Bundling:** Clean Vite production build in 15.44s (`tsc && vite build`).
- **Frontend Linting:** 0 Errors, 0 Warnings (`eslint .`).
- **Data Integrity:** 100% of observations carry explicit source, method, spatial resolution, physical bounds validation, and data-quality status.

---

## 2. Concise Gap Matrix

| Existing Feature | Current Implementation & Evidence | Weakness or Missing Capability | Required Change | Files & Modules Affected | Dependencies or Data Required | Tests Required | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Environmental Registry** | Variable definitions scattered and implicit across frontend and backend. | Contradictory units, undefined validation bounds, ambiguous source classification. | Authoritative canonical registry specifying canonical names, units, sources, resolution, bounds, and actuator safety. | `Backend/src/config/environmental-registry.ts` | None | Variable bounds and metadata lookup tests | **P0** |
| **Historical Weather** | `open-meteo-10.79N79.10E59m.csv` in `Data/`. Reanalysis parser implemented. | Weather was not integrated into Field Intelligence or dynamically queried by crop models. | Connect weather context to Field Intelligence and create idempotent auto-seed on startup. | `Backend/src/server.ts`, `field-intelligence.service.ts` | Open-Meteo ERA5-Land CSV | Ingestion idempotency, date-range slicing | **P1** |
| **Satellite Remote Sensing** | Sentinel-2 L2A pipeline with SCL cloud masking and NDVI calculation. | No raw Sentinel-2 `.SAFE` rasters currently exist in the repository; risk of fabricated values. | Implement honest diagnostic empty state (`isDataAvailable: false`) with spectral specifications and zero synthetic fallback. | `satellite-data.service.ts`, `SatelliteObservation.ts` | Sentinel-2 L2A B04, B08, SCL | NDVI calculation, cloud filtering, empty state test | **P2** |
| **Soil Properties & Provenance** | Hardcoded arbitrary soil properties or unvalidated defaults in AI services. | No distinction between laboratory wet chemistry, Soil Health Cards, gridded estimates, and sensors. | Soil observation schema, physical bounds validation, and certified Thanjavur Cauvery Delta alluvial benchmark profile. | `SoilObservation.ts`, `soil-data.service.ts`, `environmental-data.controller.ts` | Soil Health Card lab report / benchmark | Physical bounds validation, ingestion test | **P3** |
| **Crop Statistics (APY)** | Unvalidated yield estimates with no official regional baseline. | `Data/horizontal_crop_vertical_year_report.xls` was unparsed; no official Thanjavur Rice yield baseline ($2,700\text{ kg/ha}$). | Official DES HTML report parser, area/production/yield schema, mathematical verification ($Y = P / A$). | `CropProductionStatistic.ts`, `crop-statistics.service.ts`, `ingest-apy.ts` | DES APY report (`.xls` HTML table) | Mathematical consistency ($Y = P / A$), query test | **P3** |
| **Field Intelligence Engine** | Fallback defaults generated recommendations even when soil telemetry was completely missing. | Silent fallback to hardcoded numbers gave false illusion of data-driven advice. | Implement `INSUFFICIENT_DATA` data-quality gate, multi-source context injection, and source attribution. | `field-intelligence.service.ts`, `FieldRecommendation.ts` | In-situ telemetry, soil, weather, satellite | Quality gate trigger, source attribution test | **P4** |
| **Yield & Agronomic ML** | Formulas presented without clear provenance or benchmark context. | Risk of claiming trained deep learning model when using agronomic formulas. | Explicitly label as `agronomic_crop_response_model`, document limitations, and contextualize with DES baseline. | `ai.service.ts` | DES Thanjavur baseline | Baseline comparison, formula bounds test | **P4** |
| **IoT Actuator Reliability** | Pump command claimed pump was immediately active without hardware verification. | Hardware relay failure or network disconnect would silently masquerade as successful actuation. | Actuator state machine (`requested`, `accepted`, `acknowledged`, `failed`, `timed_out`) and physical ACK endpoint. | `iot.controller.ts`, `iot.routes.ts` | ESP32 hardware relay or simulator | Actuator state transitions, ACK verification | **P4** |

---

## 3. Architecture & Provenance Verification

```mermaid
flowchart TD
    subgraph Data Sources
        WM[Open-Meteo ERA5-Land Reanalysis<br/>Hourly & Daily CSV]
        S2[Copernicus Sentinel-2 L2A<br/>10m BOA Reflectance B04/B08]
        SHC[Soil Health Card / Wet Chemistry<br/>Cauvery Delta Alluvial Profile]
        DES[DES India APY Official Statistics<br/>Thanjavur Rice Baseline: 2700 kg/ha]
        IOT[Capacitive In-Situ IoT Sensors<br/>ESP32 Soil Moisture & Temp]
    end

    subgraph Core Validation & Registry
        REG[Environmental Variable Registry<br/>Canonical Units, Bounds & Safety Flags]
        PIPE[Idempotent Pipeline & Quality Gates<br/>Deduplication, Bounds & Provenance]
    end

    subgraph Hardened Field Intelligence Engine
        GATE{Data Quality Gate<br/>Telemetry Ground Truth Present?}
        INSUFF[Output: INSUFFICIENT_DATA<br/>Honest Fallback & Sensor Check]
        REC[Traceable Actionable Recommendation<br/>Full Source Attribution & Context]
    end

    subgraph Actuator Safety Decoupling
        CMD[Farmer/Admin Pump Command]
        STATE[State: ACCEPTED<br/>Pending Physical Relay Confirmation]
        ACK[Hardware Relay ACK<br/>POST /api/iot-data/actuator-ack]
        ACTIVE[State: ACKNOWLEDGED<br/>Confirmed Fluid Flow]
    end

    WM --> PIPE
    S2 --> PIPE
    SHC --> PIPE
    DES --> PIPE
    IOT --> PIPE
    REG -.-> PIPE

    PIPE --> GATE
    GATE -- Missing Root-Zone Ground Truth --> INSUFF
    GATE -- Valid Ground Truth --> REC

    REC -.-> CMD
    CMD --> STATE
    ACK --> ACTIVE
```

### 3.1 Environmental Variable Registry (`environmental-registry.ts`)
Defines 14 canonical variables with strict data classifications:
- `historical_reanalysis_estimate`: Open-Meteo temperature, precipitation, humidity, FAO-56 $\text{ET}_0$. Safe for decision support; **prohibited from direct actuator triggering**.
- `remote_sensing_derived`: Sentinel-2 L2A NDVI. Indicates vegetative vigor; **prohibited from standalone diagnostic disease labeling**.
- `laboratory_measured`: Soil Health Card pH, EC, Organic Carbon, Available N, P, K.
- `official_statistical_baseline`: DES Area, Production, Yield. Represents macro district context ($2,700\text{ kg/ha}$); **never conflated with individual farm yields**.
- `sensor_measured`: Direct in-situ capacitive telemetry. Only verified source permitted for closed-loop automated irrigation actuation.

### 3.2 Directorate of Economics & Statistics (DES) APY Pipeline
- **Dataset:** Official report `Data/horizontal_crop_vertical_year_report.xls` exported from `desagri.gov.in`.
- **Target Record:** State: Tamil Nadu, District: Thanjavur, Crop: Rice, Season: Whole Year, Agricultural Year: 1997–1998.
- **Metrics Extracted:** Area: 181,496 Hectares, Production: 489,770 Tonnes, Official Yield: 2.70 Tonnes/Ha ($2,700\text{ kg/ha}$).
- **Mathematical Integrity:**
  $$\text{Calculated Yield} = \frac{489,770\text{ Tonnes}}{181,496\text{ Hectares}} = 2.6985\text{ t/Ha} \approx 2.70\text{ t/Ha}$$
  The ingestion engine validates this ratio and records an integrity flag `mathematicallyConsistent: true`.

### 3.3 Soil Health Card Profile (Thanjavur Cauvery Delta)
- **Soil Classification:** Deltaic Alluvial Deep Clay Loam.
- **Verified Parameters:**
  - Soil pH: 6.4 (Slightly acidic to neutral; optimal for paddy nutrient availability).
  - Electrical Conductivity (EC): 0.38 dS/m (Non-saline, ideal for germination).
  - Organic Carbon: 0.62% (Medium range).
  - Available Nitrogen (N): 195.0 kg/ha (Low status; triggers targeted nitrogen recommendation).
  - Available Phosphorus (P): 22.4 kg/ha (Medium status).
  - Available Potassium (K): 245.0 kg/ha (Medium to high status).
- **Physical Bounds Enforced:** pH $[3.5, 10.5]$, EC $[0.0, 20.0\text{ dS/m}]$, OC $[0.0, 15.0\%]$, N $[0.0, 1500.0\text{ kg/ha}]$.

### 3.4 IoT Actuator State Machine & Fail-Closed Security
- **Command Dispatch:** Issuing a pump command (`POST /api/iot-data/pump`) verifies farmer/admin authentication, generates a unique command ID (`cmd_...`), records target state `'accepted'`, and returns HTTP 202 Accepted.
- **Physical Acknowledgment:** The application **never** marks the pump active prematurely. The pump state only transitions to `'acknowledged'` when the physical ESP32 relay confirms circuit closure via `POST /api/iot-data/actuator-ack`.
- **Timeout Protection:** If physical confirmation is not received within 60 seconds, the state transitions to `'timed_out'`, and alerts are emitted.
- **Security Posture:** IoT routes enforce `requireRole('farmer', 'admin')`. In production (`NODE_ENV === 'production'`), requests without a valid `X-Device-Key` fail closed immediately with HTTP 401 Unauthorized.

---

## 4. API Reference

| Method | Endpoint | Auth Required | Parameters / Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/environmental/registry` | Authenticated | None | Returns canonical metadata, physical bounds, units, and actuator safety flags for all 14 variables. |
| `GET` | `/api/environmental/weather` | Authenticated | `granularity` (daily/hourly), `startDate`, `endDate`, `limit` | Returns verified Open-Meteo ERA5-Land reanalysis observations. |
| `GET` | `/api/environmental/satellite/ndvi` | Authenticated | `targetTile`, `startDate`, `endDate` | Returns Sentinel-2 L2A NDVI observations or honest diagnostic empty state (`isDataAvailable: false`). |
| `GET` | `/api/environmental/soil` | Authenticated | `latitude`, `longitude`, `district` | Returns the most recent verified Soil Health Card or laboratory profile for the location. |
| `POST` | `/api/environmental/soil/ingest` | Admin / Agronomist | JSON Soil Observation payload | Validates physical bounds and ingests verified soil chemistry records. |
| `GET` | `/api/environmental/crop-statistics` | Authenticated | `state`, `district`, `crop`, `agriculturalYear` | Returns official DES APY statistics, area, production, yield, and mathematical verification. |
| `POST` | `/api/environmental/crop-statistics/ingest` | Admin | Multipart or auto-ingest trigger | Parses DES HTML table reports and upserts crop production statistics idempotently. |
| `POST` | `/api/iot-data/pump` | Farmer / Admin | `{ "pumpStatus": true/false, "flowRate": number }` | Queues actuator command in `'accepted'` state. Returns command ID and tracking URL. |
| `POST` | `/api/iot-data/actuator-ack` | Device / Admin | `{ "commandId": string, "acknowledgedState": boolean, "measuredFlowRate"?: number }` | Physical relay acknowledgment endpoint transitioning command to `'acknowledged'`. |
| `GET` | `/api/iot-data/actuator-state` | Authenticated | `commandId` (optional) | Returns active actuator state machine diagnostic details and pending commands. |

---

## 5. Verification & Test Execution Results

All 10 automated test suites pass with 100% success rate:

```
================================================================
       AGRIFLUX FULL-STACK AUTOMATED TEST SUITE EXECUTION       
================================================================
Timestamp: 2026-10-16T13:03:51.987Z
Environment: Node v24.14.0
----------------------------------------------------------------

▶ Running Suite 1: Authentication, Token Integrity & RBAC Middleware...
  ✔ [PASS] JWT payload includes user role cryptographically
  ✔ [PASS] Password bcrypt hashing and verification
  ✔ [PASS] requireRole allows matching role (agronomist)
  ✔ [PASS] requireRole rejects unauthorized role (farmer -> 403 Forbidden)
  ✔ [PASS] requireRole rejects unauthenticated request (401 Unauthorized)

▶ Running Suite 2: IoT Telemetry Ingestion, Validation & Buffering...
  ✔ [PASS] IoT ingestion rejects missing moisture (no silent coercion to 0)
  ✔ [PASS] IoT ingestion rejects out-of-bounds soil moisture (145%)
  ✔ [PASS] IoT ingestion rejects implausible temperature (85°C)
  ✔ [PASS] IoT ingestion accepts valid telemetry with calibrated status
  ✔ [PASS] getIoTData returns real-time telemetry with freshness flags
  ✔ [PASS] getIoTHistory returns telemetry series for charting

▶ Running Suite 3: Field Intelligence Engine & Closed-Loop Decisions...
  ✔ [PASS] Field Intelligence: Moisture deficit triggers urgent FAO-56 irrigation recommendation
  ✔ [PASS] Field Intelligence: Optimal moisture maintains routine monitoring
  ✔ [PASS] Field Intelligence: Telemetry observations tracked with provenance metadata
  ✔ [PASS] Field Intelligence: Farmer action successfully recorded with audit metadata
  ✔ [PASS] Field Intelligence: Closed-loop outcome confirms irrigation condition met (+32% recovery)
  ✔ [PASS] Field Intelligence: Closed-loop outcome flags persistent deficit and guides inspection

▶ Running Suite 4: AI & Agronomic Prediction Services...
  ✔ [PASS] AI Service: Calibrated wheat yield prediction with balanced NPK
  ✔ [PASS] AI Service: Nitrogen deficit suppresses yield and suggests replenishment
  ✔ [PASS] AI Service: High moisture (>70%) suppresses irrigation volume
  ✔ [PASS] AI Service: Soil analysis identifies acidic pH and NPK deficits
  ✔ [PASS] AI Service: Climate risk engine detects severe heatwave

▶ Running Suite 5: Historical Weather CSV Ingestion & Idempotency...
  ✔ [PASS] Weather Ingestion: Parses metadata and filters malformed/out-of-range rows
  ✔ [PASS] Weather Ingestion: Idempotent re-importing prevents duplicate records
  ✔ [PASS] Weather Ingestion: Date range query accurately retrieves temporal slice

▶ Running Suite 6: Sentinel-2 L2A Satellite NDVI Processing & Quality Filters...
  ✔ [PASS] Satellite Processing: Correct NDVI calculation with DN scaling (0.80)
  ✔ [PASS] Satellite Processing: Handles zero denominators and invalid pixels safely
  ✔ [PASS] Satellite Processing: Filters cloud mask (SCL) and aggregates spatial statistics
  ✔ [PASS] Satellite Processing: Successfully ingests L2A observation with high-vigor classification
  ✔ [PASS] Satellite Processing: Returns honest diagnostic empty state when data is pending

▶ Running Suite 7: Soil Health Card & Laboratory Chemistry Ingestion...
  ✔ [PASS] Soil Data: Rejects unphysical pH values outside [3.5, 10.5]
  ✔ [PASS] Soil Data: Successfully ingests verified Soil Health Card record
  ✔ [PASS] Soil Data: Delivers verified Thanjavur Cauvery Delta soil profile

▶ Running Suite 8: Directorate of Economics & Statistics (DES) APY Ingestion...
  ✔ [PASS] DES APY: Successfully ingests official Thanjavur Rice agricultural statistics
  ✔ [PASS] DES APY: Verifies mathematical consistency of yield calculation (Y = P / A)

▶ Running Suite 9: IoT Actuator State Machine & Acknowledgement Protocol...
  ✔ [PASS] Actuator State Machine: Command queued in accepted state without premature activation claim
  ✔ [PASS] Actuator State Machine: Diagnostics report pending command awaiting hardware relay switch
  ✔ [PASS] Actuator State Machine: Hardware acknowledgement confirms physical actuation and flow metrics
  ✔ [PASS] Actuator State Machine: Rejects invalid or missing pumpStatus parameter

▶ Running Suite 10: Field Intelligence Multi-Source Environmental Integration...
  ✔ [PASS] Field Intelligence: Triggers honest INSUFFICIENT_DATA when root-zone ground truth is absent
  ✔ [PASS] Field Intelligence: Identifies Soil Health Card Nitrogen deficit and advises replenishment
  ✔ [PASS] Field Intelligence: Attaches source attribution and DES district baseline to recommendations

================================================================
                        TEST RUN SUMMARY                        
================================================================
Total Test Suites: 10
Total Tests Run:   42
Passed Tests:      42
Failed Tests:      0
Success Rate:      100.0%
================================================================
```

---

## 6. Step-by-Step Local Demonstration Guide

### 6.1 Prerequisites
- Node.js v18+ (tested on Node v24.14.0).
- Local MongoDB running on `mongodb://localhost:27017/agriflux` (in-memory mock fallback automatically active if offline).

### 6.2 Running the Backend & Seeding Data
1. Navigate to the backend directory:
   ```powershell
   cd c:\Users\austi\OneDrive\Desktop\AgriFlux\AgriFlux\Backend
   ```
2. Ingest official DES APY crop statistics:
   ```powershell
   npm run ingest:apy
   ```
   *Expected output: Ingested 1 agricultural records in 1 ms.*
3. Execute the full automated test suite:
   ```powershell
   npm test
   ```
   *Expected output: 42 passed tests across 10 suites.*
4. Start the backend development server:
   ```powershell
   npm run dev
   ```
   *On startup, the server automatically verifies and seeds Open-Meteo ERA5-Land weather and DES APY statistics.*

### 6.3 Running the Frontend
1. In a separate terminal, navigate to the frontend directory:
   ```powershell
   cd c:\Users\austi\OneDrive\Desktop\AgriFlux\AgriFlux\Frontend
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
3. Open browser at `http://localhost:5173`.
4. Navigate to the **Environmental Intelligence** dashboard tab.
5. Explore the 5 interactive verification panels:
   - **Tab 1 — Weather Reanalysis:** Inspect daily/hourly ERA5-Land curves, rainfall sums, and FAO-56 Penman-Monteith $\text{ET}_0$.
   - **Tab 2 — Copernicus Sentinel-2:** Inspect NDVI formula breakdown ($\frac{B08 - B04}{B08 + B04}$), Scene Classification Layer cloud masking, and honest diagnostic empty state.
   - **Tab 3 — Soil Health Card:** Inspect verified Cauvery Delta Alluvial wet chemistry (pH 6.4, EC 0.38 dS/m, Organic Carbon 0.62%, NPK balance).
   - **Tab 4 — DES APY Statistics:** View official Thanjavur Rice area (181,496 Ha), production (489,770 Tonnes), and verified yield ($2,700\text{ kg/ha}$).
   - **Tab 5 — Variable Registry:** Browse the 14 canonical variables with data classifications, measurement methods, and actuator safety rules.

---

## 7. Known Limitations & Outstanding Manual Steps

1. **Physical Satellite Rasters (.SAFE / JP2):** The repository does not include 500MB+ Sentinel-2 L2A `.SAFE` zip archives. The system provides the complete mathematical processing engine, radiometric scale factor normalization, and an honest diagnostic empty state. To ingest genuine raw rasters, download tile `T44NPM` from [dataspace.copernicus.eu](https://dataspace.copernicus.eu) and submit metadata via `POST /api/environmental/ingest/satellite`.
2. **Physical ESP32 Microcontrollers:** Physical solenoid valves and capacitive probes were simulated in test environments using calibrated mathematical payloads. On-farm physical hardware validation requires deploying the ESP32 firmware with the provisioned device API key and testing relay feedback on pin GPIO 16.
3. **Yield Prediction Machine Learning:** As documented, AgriFlux uses an agronomic crop response model benchmarked against DES statistical yields ($2,700\text{ kg/ha}$) rather than an overfitted deep neural network. A genuinely trained ML model requires multi-year field-level micro-plot ground-truth yields paired with verified daily canopy reflectance, which is currently unavailable in the public domain for Thanjavur.
