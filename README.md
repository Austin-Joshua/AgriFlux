# 🌾 AgriFlux: Agricultural Intelligence Platform

AgriFlux is a unified agricultural intelligence platform built for smallholder farmers, cooperative managers, expert agronomists, and system administrators. By synthesizing historical meteorological reanalysis, multi-source environmental baselines, real-time IoT sensor telemetry, and agronomic heuristics, AgriFlux translates raw field data into explainable, actionable crop and irrigation management decisions.

---

## 🏛️ System Architecture

AgriFlux operates as a multi-tier distributed architecture comprising a client single-page application (SPA), an Express.js service backend, an IoT telemetry and actuation tier, multi-source environmental pipelines, a closed-loop field decision engine, and a tamper-evident cryptographic audit ledger.

```mermaid
graph TD
    subgraph Client Tier ["Frontend Client (React 18 SPA + Vite)"]
        UI_Entry[App Entry & Providers] --> UI_Auth[Auth & Language Context]
        UI_Auth --> UI_Routes{Role-Based Router}
        UI_Routes -->|Farmer / Admin| UI_Farmer["Farmer Workspace (/dashboard, /irrigation, /soil)"]
        UI_Routes -->|Agronomist / Admin| UI_Agro["Agronomist Portal (/agronomist, /yield, /climate)"]
        UI_Routes -->|Admin Only| UI_Admin["Admin Console (/admin, /users)"]
        UI_Farmer --> UI_DecisionPanel["AI Decision Panel & Stale Badges"]
    end

    subgraph Service Tier ["Service Backend (Express 4 + TypeScript)"]
        API_Gateway[Express Gateway Router] --> MW_Sec[Helmet, CORS, Rate Limiters]
        MW_Sec --> MW_Auth[JWT Verification & RBAC Middleware]
        MW_Sec --> MW_IoTKey["IoT Key Auth (x-iot-api-key)"]
        
        MW_Auth --> CTL_Field[Field Intelligence Controller]
        MW_Auth --> CTL_Env[Environmental Data Controller]
        MW_Auth --> CTL_Audit[Audit Ledger Controller]
        MW_IoTKey --> CTL_IoT[IoT Telemetry & Actuator Controller]
        
        CTL_Field --> ENG_Decision["Decision Engine (FAO-56 MAD + Quality Gate)"]
        CTL_IoT --> ENG_Safety["Actuator Safety Interlock (HTTP 422 on Stale)"]
        CTL_Field --> SRV_Audit["Cryptographic Audit Ledger Service"]
        CTL_IoT --> SOCK[Socket.IO Real-Time Emitter]
    end

    subgraph IoT Tier ["IoT Telemetry & Physical Actuation Tier"]
        ESP32["ESP32 Microcontroller Nodes"] -->|HTTP POST /api/iot-data| MW_IoTKey
        ESP32 <-->|WebSocket Real-Time Feed| SOCK
        CTL_IoT -->|HTTP 202 PENDING_ACK| ESP32
        ESP32 -->|POST /api/iot-data/actuator-ack| CTL_IoT
        SIM["Simulation Profile Engine"] -.->|allowSimulation / isSimulated| ENG_Decision
    end

    subgraph Data Tier ["Environmental Data Ingestion Tier"]
        ERA5["Open-Meteo ERA5-Land (2021-2026 Reanalysis)"] --> SRV_Weather[Weather Ingestion Service]
        S2["Copernicus Sentinel-2 L2A (10m Surface Reflectance)"] --> SRV_Sat[Satellite Processing Service]
        ICAR["ICAR-TNAU Soil Chemistry Benchmarks"] --> SRV_Soil[Soil Reference Service]
        DES["DES APY Historical Crop Statistics (AY 1997-1998)"] --> SRV_Crop[Crop Statistics Service]
        
        SRV_Weather --> DB[(MongoDB Storage / Memory Fallback)]
        SRV_Sat --> DB
        SRV_Soil --> DB
        SRV_Crop --> DB
    end

    subgraph Ledger Tier ["Cryptographic Audit Ledger (Tamper-Evident SHA-256 Block Chain)"]
        SRV_Audit --> BLK_Genesis["Genesis Block (Index 0)"]
        BLK_Genesis --> BLK_1["Block 1: Telemetry Hash"]
        BLK_1 --> BLK_2["Block 2: Recommendation Prescription"]
        BLK_2 --> BLK_3["Block 3: Farmer Actuator Action"]
        BLK_3 --> BLK_4["Block 4: Agronomist Review & Merkle Root"]
        SRV_Audit --> LEDGER_NOTE["*Single-node SHA-256 block chain for tamper-detection, not a decentralized consensus blockchain*"]
    end

    ENG_Decision <--> DB
    CTL_IoT <--> DB
    UI_Entry <-->|HTTP REST / Socket.IO| API_Gateway
```

---

## 🛠️ Real Technology Stack

AgriFlux is engineered with production-ready, typed technologies across all tiers:

### Frontend (`Frontend/package.json`)
- **Core Framework**: React `18.3.1`, React DOM `18.3.1`
- **Build Tooling**: Vite `5.4.2`, TypeScript `5.5.3`
- **Styling**: Tailwind CSS `3.4.1`, PostCSS `8.4.35`, Autoprefixer `10.4.18`
- **Routing & State**: React Router DOM `6.22.3`
- **Data Visualization**: Recharts `2.12.7`
- **Icons & Motion**: Lucide React `0.344.0`, Framer Motion `12.35.0`
- **Internationalization**: i18next `23.10.1`, react-i18next `14.1.0`, i18next-browser-languagedetector `7.2.1`
- **Real-Time Client**: Socket.IO Client `4.8.3`
- **Notifications & Metadata**: React Toastify `11.0.5`, React Helmet Async `3.0.0`
- **Authentication**: Firebase Client SDK `12.11.0`, `@react-oauth/google` `0.13.4`, Axios `1.6.8`

### Backend (`Backend/package.json`)
- **Runtime & Web Framework**: Node.js (v18, v20, or v24), Express `4.18.2`, TypeScript `5.9.3`
- **Database & ODM**: MongoDB, Mongoose `9.2.4`, `mongodb-memory-server` `11.3.0` (for testing & development)
- **Real-Time WebSockets**: Socket.IO `4.8.3`
- **Authentication & Cryptography**: JSON Web Tokens (`jsonwebtoken` `9.0.2`), Bcrypt (`bcryptjs` `2.4.3`), Node.js `crypto`
- **Security & Protection**: Helmet `8.1.0`, CORS `2.8.5`, HPP `0.2.3`, Express Rate Limit `8.3.2`
- **Firebase Administration**: `firebase-admin` `13.7.0`
- **HTTP Client & Utilities**: Axios `1.6.2`, Compression `1.8.1`, Morgan `1.10.1`, Dotenv `16.3.1`
- **Quality & Linting**: ESLint `10.0.2`, TypeScript ESLint `8.62.0`, Prettier `3.8.1`

---

## ⚙️ Environment Variables Reference

AgriFlux uses environment variables to configure database connections, authentication secrets, port assignments, and external APIs.

### Backend Configuration (`Backend/.env.example`)

| Variable Name | Required? | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `5001` | TCP port on which the Express HTTP server listens. |
| `NODE_ENV` | Optional | `development` | Operating environment (`development`, `test`, or `production`). In `production`, strict security validations are enforced. |
| `MONGODB_URI` | **Required** in Production | `mongodb://localhost:27017/agriflux` | MongoDB connection URI. In production, unauthenticated localhost strings are strictly rejected. |
| `JWT_SECRET` | **Required** in Production | `your_strong_random_jwt_secret_32_chars` | Secret key used to sign and verify HMAC-SHA256 JWT tokens. Must be >= 32 characters in production. |
| `JWT_EXPIRE` | Optional | `7d` | Token expiration duration (e.g., `24h`, `7d`). |
| `FRONTEND_URL` | Optional | `http://localhost:3000` | Allowed CORS origin for browser client connections. |
| `IOT_API_KEY` | Optional | `agriflux-iot-key-dev` | Pre-shared key expected in `x-iot-api-key` header for ESP32 nodes. In production, failing to set this key triggers fail-closed rejection. |
| `AUDIT_SIGNING_KEY` | Optional | `your_hmac_sha256_audit_signing_key` | Secret key used to generate HMAC-SHA256 signatures for tamper-evident audit ledger blocks. |
| `AUTO_SEED_DEMO` | Optional | `false` | Explicit flag to enable demo account seeding on non-production startup. Refused in production. |
| `ALLOW_DEMO_LOGIN` | Optional | `true` in dev | Determines whether demo login presets are shown on the frontend. |
| `FIREBASE_PROJECT_ID` | Optional | `your-firebase-project-id` | Firebase Admin project ID for SMS OTP authentication. |
| `FIREBASE_CLIENT_EMAIL`| Optional | `firebase-adminsdk@...` | Service account client email for Firebase Admin SDK. |
| `FIREBASE_PRIVATE_KEY` | Optional | `-----BEGIN PRIVATE KEY-----\n...` | Service account RSA private key for Firebase Admin SDK. |

### Frontend Configuration (`Frontend/.env.example`)

| Variable Name | Required? | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Optional | `http://localhost:5001/api` | Base HTTP URL of the AgriFlux Backend API. In production, points to the live backend domain. |

---

## 👥 Demo Accounts Policy & Usage

To prevent credential leakage and unauthorized access in hosted environments, AgriFlux enforces a strict demo provisioning policy:

1. **Refused in Production**: The backend server strictly refuses to seed demo accounts when `NODE_ENV=production`. Any attempt to trigger automatic seeding during production startup is blocked and audited.
2. **Dedicated Operator CLI**: In development and staging environments, demo accounts are provisioned exclusively through an operator-initiated CLI script:
   ```bash
   cd Backend
   npm run seed:demo
   ```
3. **Idempotent & Safe**: If demo accounts already exist, `seed:demo` preserves their existing passwords and does not overwrite or corrupt existing records.
4. **Credential Sanitation**: Seeding logs never print plain text passwords or secrets to stdout.

### Pre-Configured Demo Roles (For Local Testing Only)

| Role | Email Identifier | Default Role Scope | Operational Permissions |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@agriflux.com` | `farmer` | Access to field dashboard, IoT monitoring, irrigation controls, soil advisory, and consultation bookings. |
| **Agronomist** | `agronomist@agriflux.com` | `agronomist` | Multi-farm crop health monitoring, prescription review & endorsement, and climate risk simulation. |
| **Admin** | `admin@agriflux.com` | `admin` | Full system control, user role elevation, emergency broadcasting, and audit chain verification. |

> [!WARNING]
> Default passwords for demo accounts must never be used in publicly hosted environments. For production deployments, create unique accounts through `/api/auth/register` with strong passwords.

---

## 🌐 Verified Routes & API Endpoints

### Frontend Protected & Public Routes (`Frontend/src/App.tsx`)

| Path | Access Level | Target Component | Description |
| :--- | :---: | :--- | :--- |
| `/` or `/home` | Public | `LandingPage` | Platform overview, features, and public entry point. |
| `/login` | Public | `Login` | Email/password, phone OTP, and Google authentication. |
| `/register` | Public | `Register` | New farmer and specialist onboarding registration. |
| `/forgot-password` | Public | `ForgotPassword` | Password recovery workflow. |
| `/onboarding` | Authenticated | `Onboarding` | User role and farm profile initialization. |
| `/dashboard` | `farmer`, `admin` | `Dashboard` | Real-time farm overview, IoT status, and weather charts. |
| `/irrigation` | `farmer`, `admin` | `IrrigationIntelligence` | Closed-loop FAO-56 irrigation decisions & pump control. |
| `/soil` | `farmer`, `admin` | `SoilAdvisor` | Soil health card analysis & ICAR regional reference. |
| `/crop-health` | `farmer`, `admin` | `CropHealthMonitoring` | Field vegetation health & Sentinel-2 surface reflectance status. |
| `/land-intelligence` | `farmer`, `admin` | `LandIntelligence` | GIS boundary and cadastral parcel intelligence. |
| `/marketplace` | `farmer`, `admin` | `Marketplace` | Agri-input marketplace & trade exchange. |
| `/equipment-rental` | `farmer`, `admin` | `EquipmentRental` | Farm machinery rental registry. |
| `/subsidies` | `farmer`, `admin` | `GovernmentSubsidies` | Central & State agricultural subsidy schemes. |
| `/market` | `farmer`, `admin` | `MarketAnalysis` | Mandi commodity prices & crop trend forecasting. |
| `/investors` | `farmer`, `admin` | `InvestorsHub` | Farm funding & agtech investor portfolio. |
| `/book-consultation` | `farmer`, `admin` | `BookConsultation` | Direct appointment scheduling with certified agronomists. |
| `/agronomist` | `agronomist`, `admin` | `AgronomistDashboard` | Multi-farm clinical triage, pathology trends, prescription reviews. |
| `/yield` | `agronomist`, `admin` | `YieldPrediction` | Agronomic formula yield estimates vs historical DES APY. |
| `/climate` | `agronomist`, `admin` | `ClimateRisk` | Extreme climate risk matrix & vulnerability indices. |
| `/simulator` | `agronomist`, `admin` | `ClimateSimulator` | Microclimate temperature & precipitation stress simulation. |
| `/sustainability` | `agronomist`, `admin` | `SustainabilityScore` | Environmental stewardship & carbon emission scorecard. |
| `/admin` | `admin` | `AdminDashboard` | System health diagnostics, audit verification, user management. |
| `/settings` | Authenticated | `Settings` | Profile preferences, language selection, security settings. |
| `/about` | Authenticated | `About` | Team, mission, scientific disclosures, and data provenance. |
| `/404` | Public | `NotFoundPage` | Graceful 404 page for unmatched routes. |

---

### Backend API Endpoints Reference

#### 1. Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new user account with role selection.
- `POST /api/auth/login` — Authenticate credentials; returns signed JWT token.
- `POST /api/auth/send-otp` — Dispatch verification OTP via Firebase / simulated gateway (Rate limited).
- `POST /api/auth/verify-otp` — Verify 6-digit OTP token and return session.
- `POST /api/auth/social-login` — Google OAuth credential exchange.
- `POST /api/auth/forgot-password` — Password recovery dispatch.
- `POST /api/auth/logout` — Invalidate client session.
- `PATCH /api/auth/users/:userId/role` — Role elevation (Requires `admin` role).

#### 2. IoT Telemetry & Actuation (`/api/iot-data`)
- `POST /api/iot-data` — Ingest sensor telemetry from ESP32 hardware or simulator. Requires `x-iot-api-key` header or JWT Bearer. Rejects future-dated timestamps (>60s) and spoofed cross-user telemetry with HTTP 403.
- `GET /api/iot-data` — Retrieve latest telemetry reading for an instrumented field (`fieldId` parameter). Returns HTTP 404 if no reading exists (no cross-field data leakage).
- `GET /api/iot-data/history` — Scoped historical telemetry readings for the authenticated user and parcel.
- `POST /api/iot-data/control` — Issue pump actuation command (`pumpStatus: boolean`). Enforces **Actuator Safety Interlock**: rejects pump activation with HTTP 422 `TRIPPED_STALE_TELEMETRY` if telemetry > 15 minutes old (emergency deactivation always permitted). Requires `farmer` or `admin` role.
- `POST /api/iot-data/actuator-ack` — Physical hardware execution acknowledgment from ESP32. Requires `x-iot-api-key`.
- `GET /api/iot-data/actuator-state` — Get current pump command state machine status (`PENDING_ACK`, `ACKNOWLEDGED`, `FAULT`).

#### 3. Field Intelligence & Decision Engine (`/api/field-intelligence`)
- `POST /api/field-intelligence/recommend` — Generate explainable FAO-56 irrigation recommendation. Requires JWT. Enforces **Data Quality Gate**: if telemetry is stale (>15m), missing, or invalid, safely blocks `IRRIGATE_IMMEDIATE` and returns `INSUFFICIENT_DATA`.
- `GET /api/field-intelligence/context` — Retrieve aggregated multi-source context (soil, weather, telemetry).
- `POST /api/field-intelligence/action` — Record farmer physical execution action on timeline.
- `GET /api/field-intelligence/timeline/:fieldId` — Retrieve chronologically ordered field event timeline.
- `POST /api/field-intelligence/evaluate` — Record follow-up outcome evaluation (verifies moisture recovery vs worsening).
- `POST /api/field-intelligence/review` — Specialist review and endorsement of recommendation. Requires `agronomist` or `admin` role. Seals event into audit ledger.
- `GET /api/field-intelligence/reviews` — Fetch pending agronomist reviews. Requires `agronomist` or `admin`.
- `GET /api/field-intelligence/history` — Retrieve historical recommendation ledger for authenticated farmer.

#### 4. Environmental Data (`/api/environmental`)
- `GET /api/environmental/registry` — Canonical environmental variable registry and units.
- `GET /api/environmental/weather` — Historical weather reanalysis data (Open-Meteo ERA5-Land).
- `GET /api/environmental/satellite/ndvi` — Sentinel-2 L2A NDVI data (returns honest empty state when unintegrated).
- `GET /api/environmental/soil` — Published ICAR-TNAU regional soil reference benchmark.
- `GET /api/environmental/crop-statistics` — DES APY historical crop production statistics.
- `POST /api/environmental/ingest/weather` — Trigger weather CSV reanalysis ingestion (Requires `admin`).
- `POST /api/environmental/ingest/satellite` — Ingest satellite raster reflections (Requires `admin`).
- `POST /api/environmental/soil/ingest` — Ingest calibrated soil lab test (Requires `farmer`, `agronomist`, or `admin`).
- `POST /api/environmental/crop-statistics/ingest` — Ingest agricultural yield statistics (Requires `admin`).

#### 5. Cryptographic Audit Ledger (`/api/blockchain`)
- `GET /api/blockchain/chain` — Retrieve the full tamper-evident cryptographic block chain.
- `GET /api/blockchain/verify` — Execute cryptographic block-by-block hash and Merkle root verification.
- `POST /api/blockchain/log` — Seal an agronomic or administrative event into an immutable block. Requires `agronomist` or `admin`.

#### 6. AI Agronomic Predictions (`/api/ai`)
- `POST /api/ai/predict-yield` — Agronomic formula crop yield prediction. Requires JWT.
- `POST /api/ai/irrigation-schedule` — Multi-day irrigation scheduling advisory. Requires JWT.
- `POST /api/ai/soil-analysis` — NPK stoichiometry and fertilizer optimization. Requires JWT.
- `POST /api/ai/climate-risk` — Extreme heat, drought, and flood risk assessment. Requires JWT.
- `POST /api/ai/simulate-climate` — What-if climate stress simulation. Requires JWT.

#### 7. Specialist Consultations (`/api/consultations`)
- `POST /api/consultations/book` — Schedule appointment with agronomist specialist. Requires JWT.
- `GET /api/consultations/my-bookings` — List consultations booked by authenticated user.
- `GET /api/consultations/all` — List all consultations across the platform (Requires `agronomist` or `admin`).
- `PATCH /api/consultations/:id/status` — Update booking status (`scheduled`, `completed`, `cancelled`).

---

## 📊 Environmental Data Provenance & Real-World Boundaries

AgriFlux maintains scientific rigor by strictly differentiating verified historical data, regional reference baselines, and live sensor measurements from speculative models:

### 1. Historical Weather Reanalysis (Open-Meteo ERA5-Land)
- **Source**: Open-Meteo ERA5-Land Reanalysis (2021–2026) for the Thanjavur pilot district (10.79°N, 79.10°E, 59m elevation, Cauvery Delta).
- **Scope**: Historical model-based reanalysis providing daily temperature ($T_{\text{mean}}$, $T_{\text{min}}$, $T_{\text{max}}$), precipitation sum ($\text{mm}$), and FAO-56 Penman-Monteith reference evapotranspiration ($ET_0$).
- **Distinction**: These are historical reanalysis estimates, **not** live microclimate measurements or 14-day operational forecasts. Ingested idempotently into MongoDB.

### 2. Satellite Spectral Processing (Copernicus Sentinel-2 L2A)
- **Pipeline Architecture**: Multispectral processing pipeline designed for Sentinel-2 MSI Level-2A surface reflectance (Band 04 Red 665nm, Band 08 NIR 842nm at 10m spatial resolution) with Scene Classification Layer (SCL) cloud masking:
  $$\text{NDVI} = \frac{\text{B08} - \text{B04}}{\text{B08} + \text{B04}}$$
- **Current Integration Status**: **Satellite data not connected**. When genuine raster data has not been ingested, AgriFlux presents an honest empty state (`"Satellite data not connected"`). Synthetic vegetation indices are **never** fabricated or presented as real orbital observations.

### 3. Regional Soil Reference Profile
- **Source**: Published ICAR-TNAU regional soil survey classifications for the Cauvery Delta alluvial basin (pH 6.4, low available N, medium P, high reserve K).
- **Scope**: **Illustrative regional benchmark** providing agro-ecological context for the district.
- **Distinction**: It is **not** an official certified farm Soil Health Card, laboratory report, or in-situ measurement of an individual farm boundary. Operational farm advisories recommend certified soil testing.

### 4. Historical Crop Production Statistics (DES APY)
- **Source**: Directorate of Economics & Statistics (DES), Ministry of Agriculture & Farmers Welfare, Government of India.
- **Scope**: Archived historical records from **Agricultural Year 1997–1998** for Thanjavur Rice (Area: 181,496 Ha, Production: 489,770 Tonnes, Yield: 2.70 t/Ha).
- **Distinction**: Provides macroeconomic historical district yield context; **not** a current seasonal target or individual farm productivity metric.

### 5. Agronomic Decision Engine vs. Machine Learning
- **Irrigation Logic**: Implements the Food and Agriculture Organization (FAO) Irrigation and Drainage Paper No. 56 Penman-Monteith equation and Maximum Allowable Depletion (MAD) framework.
- **Yield Modeling**: Deterministic agronomic formula based on crop-specific base potential calibrated with NPK stoichiometry, rainfall distribution, and temperature-humidity indices. Clearly labeled as an **Agronomic Formula Estimate**, distinguished from empirical machine learning inferences.

### 6. Cryptographic Audit Ledger vs. Blockchain
- **Ledger Model**: A single-node, tamper-evident SHA-256 block chain with Merkle tree verification and HMAC signing.
- **Distinction**: Provides immutable local auditability for farm actions and agronomist reviews. It is **not** a decentralized, proof-of-work, or multi-validator cryptocurrency blockchain.

---

## 🧪 Automated Verification Suite

AgriFlux includes a comprehensive 16-suite automated test suite covering authentication, RBAC, IoT validation, actuator state machines, data ingestion, stale telemetry gating, actuator safety interlocks, and regression tests.

```bash
cd Backend
npm test
```

### Verified Test Suites (130/130 Passing — 100% Pass Rate):

| Suite | Description | Test Count |
| :--- | :--- | :---: |
| **Suite 1** | Authentication, Token Integrity, RBAC Middleware & Post-Login Voice Regression | 6 tests |
| **Suite 2** | IoT Telemetry Ingestion, Validation & Buffering | 6 tests |
| **Suite 3** | Field Intelligence Engine & Closed-Loop Decisions | 6 tests |
| **Suite 4** | AI & Agronomic Prediction Services | 5 tests |
| **Suite 5** | Historical Weather CSV Ingestion & Idempotency | 3 tests |
| **Suite 6** | Sentinel-2 L2A Satellite NDVI Processing & Quality Filters | 5 tests |
| **Suite 7** | Soil Health Card & Laboratory Chemistry Ingestion | 3 tests |
| **Suite 8** | Directorate of Economics & Statistics (DES) APY Ingestion | 2 tests |
| **Suite 9** | IoT Actuator State Machine & Acknowledgement Protocol | 6 tests |
| **Suite 10** | Field Intelligence Multi-Source Environmental Integration | 3 tests |
| **Suite 11** | Blockchain Ledger Persistence, Concurrency & Security | 18 tests |
| **Suite 12** | Decision Engine Defect Remediation & Verification Suite | 12 tests |
| **Suite 13** | Quantex Master Audit & Defect Remediation Verification | 5 tests |
| **Suite 14** | Quantex Closed-Loop End-to-End Workflow Verification | 7 tests |
| **Suite 15** | Demo Account Seeding Security & Secret Validation | 7 tests |
| **Suite 16** | Stale Telemetry Gating, Actuator Safety Interlock & Tenant Isolation | 18 tests |
| **TOTAL** | **Full End-to-End Automated Test Verification** | **130 tests** |

---

## 🔒 Security & Production Checklist

1. **Production Secret Strength**: The backend checks JWT secrets on startup; weak or default placeholder secrets (`agriflux_development_secret_2026`) are refused in production mode. Secrets must be >= 32 characters.
2. **Fail-Closed Hardware Authentication**: ESP32 endpoints enforce `x-iot-api-key` validation using constant-time cryptographic hash comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks (CWE-208).
3. **Telemetry Freshness & Actuator Interlock**:
   - Telemetry older than 15 minutes is flagged as `stale`.
   - Stale telemetry triggers the `INSUFFICIENT_DATA` safety gate, suppressing automated irrigation recommendations.
   - Physical pump activation commands against stale telemetry are blocked with HTTP 422 `TRIPPED_STALE_TELEMETRY`.
   - Emergency deactivations (`pumpStatus: false`) are always permitted immediately.
4. **Tenant Isolation**:
   - Telemetry queries for uninstrumented fields return HTTP 404 without leaking other parcels.
   - Sensor ingestion validates device and user ownership, rejecting cross-user spoofing with HTTP 403.
5. **Rate Limiting & Abuse Prevention**: Express rate limiters protect authentication, OTP dispatch, and compute-heavy AI prediction endpoints.
6. **No Plaintext Credential Logging**: All startup, database connection, and seeding logs redact credentials and connection strings.
7. **Clean Post-Login UX**: Zero unwanted automated speech synthesis, microphone activation, or floating widgets upon authentication.

---

## 🚀 Quickstart: Local Setup & Development

### Prerequisites
- Node.js (v18.x, v20.x, or v24.x)
- Git
- MongoDB (local community edition or Atlas connection string)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Austin-Joshua/AgriFlux.git
cd AgriFlux
npm run install-all
```

### 2. Configure Environment Variables
```bash
# Backend environment configuration
cp Backend/.env.example Backend/.env

# Frontend environment configuration
cp Frontend/.env.example Frontend/.env
```

### 3. Provision Demo Accounts (Non-Production Only)
```bash
cd Backend
npm run seed:demo
```

### 4. Run Development Servers
From the repository root:
```bash
npm run dev
```
- **Frontend SPA**: `http://localhost:3000`
- **Backend API**: `http://localhost:5001/api`
