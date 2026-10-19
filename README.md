# 🌾 AgriFlux: Agricultural Intelligence & Autonomous Irrigation Platform

[![Build & Verification Status](https://img.shields.io/badge/tests-130%2F130%20passing%20(100%25)-brightgreen.svg)](reports/README_SECURITY_TELEMETRY_TEST_RESULTS.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%204.18-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Mongoose-47A248.svg)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AgriFlux is a unified agricultural decision platform and physical IoT actuation system engineered for smallholder farmers, cooperative managers (FPOs), and certified agronomists. Focused on climate-vulnerable agricultural basins (such as the Cauvery Delta, Tamil Nadu), AgriFlux bridges the gap between raw hardware sensor readings, open environmental reanalysis datasets, and real-world farm actuation.

- **Production Frontend**: [https://agri-flux-sandy.vercel.app/](https://agri-flux-sandy.vercel.app/)
- **Production Backend**: [https://agriflux-backend.onrender.com/](https://agriflux-backend.onrender.com/)
- **Primary Repository**: [https://github.com/Austin-Joshua/AgriFlux](https://github.com/Austin-Joshua/AgriFlux)

---

## 🌍 The Problem & Real-World Application

Smallholder farmers in tropical and deltaic farming zones face compounding operational challenges:
1. **Irrigation Inefficiency**: Uncalibrated flood irrigation depletes aquifers and stresses crop root zones, while drought stress causes irreversible yield losses.
2. **Silent Sensor Failure**: Traditional IoT platforms silently actuate pumps based on outdated, disconnected, or malformed sensor data, risking crop drowning or equipment burnout.
3. **Black-Box AI Claims**: Farmers are frequently given unsupported predictive advice from opaque models without explainability, scientific provenance, or agronomist accountability.
4. **Fragmented Agricultural Tools**: Soil health data, weather forecasts, market rates, and agronomist consultations are scattered across disconnected applications.

### The AgriFlux Solution
AgriFlux introduces a **closed-loop field intelligence architecture**:
- **Explainable Decision Engine**: Uses the Food and Agriculture Organization (FAO-56) Penman-Monteith and Maximum Allowable Depletion (MAD) framework.
- **Fail-Safe Telemetry Gate**: Strictly gates recommendations and physical actuation behind a 15-minute sensor freshness window.
- **Tamper-Evident Audit Ledger**: Every recommendation, farmer action, and agronomist review is cryptographically linked in a single-node SHA-256 block chain with Merkle tree verification.

---

## 🎯 System Scope: Core MVP vs. Supporting Ecosystem

AgriFlux maintains scientific and engineering rigor by clearly distinguishing the **Core Closed-Loop MVP** from the **Supporting Feature Ecosystem**.

```
                                ┌────────────────────────────────────────────────────────┐
                                │              AGRIFLUX APPLICATION SUITE                │
                                └──────────────────────────┬─────────────────────────────┘
                                                           │
                      ┌────────────────────────────────────┴────────────────────────────────────┐
                      ▼                                                                         ▼
   ┌─────────────────────────────────────┐                                   ┌─────────────────────────────────────┐
   │         CORE CLOSED-LOOP MVP        │                                   │     SUPPORTING ECOSYSTEM MODULES    │
   ├─────────────────────────────────────┤                                   ├─────────────────────────────────────┤
   │ 1. Telemetry Quality Gate (15m)     │                                   │ 1. Regional Soil Health Profile     │
   │ 2. Explainable FAO-56 Engine        │                                   │ 2. Formula Agronomic Yield Model    │
   │ 3. Actuator Safety Interlock (422)  │                                   │ 3. Climate Risk & Stress Simulator  │
   │ 4. Two-Phase Pump Hardware ACK      │                                   │ 4. Sentinel-2 Satellite Interface   │
   │ 5. Cryptographic Audit Ledger       │                                   │ 5. Specialist Consultation Booking  │
   │ 6. Tenant & Parcel Scoping          │                                   │ 6. Marketplace & Subsidy Directory  │
   └─────────────────────────────────────┘                                   └─────────────────────────────────────┘
```

### 1. The Core Closed-Loop MVP (Hero Workflow)
The Core MVP comprises the critical path from physical sensor to physical pump:
- **Telemetry Ingestion & Quality Evaluation**: Continuous ingestion of soil moisture, ambient temperature, and relative humidity via ESP32 microcontrollers or simulated nodes. Categorizes telemetry into 5 discrete quality states: `fresh`, `stale`, `missing`, `invalid`, `simulated`.
- **Explainable Irrigation Decision Engine**: Implements FAO-56 Penman-Monteith reference evapotranspiration ($ET_0$) and crop coefficient ($K_c$) depletion curves. If telemetry is stale (>15 min) or invalid, the engine halts with `INSUFFICIENT_DATA` rather than guessing.
- **Actuator Safety Interlock**: Remote pump activations (`pumpStatus: true`) are verified against telemetry freshness. If readings are older than 15 minutes, commands are refused with **HTTP 422 Unprocessable Entity** (`TRIPPED_STALE_TELEMETRY`). Emergency shutoff (`pumpStatus: false`) is always permitted immediately.
- **Two-Phase Actuator Protocol**: Enforces a strict command lifecycle (`PENDING_ACK` -> physical execution by hardware -> `ACKNOWLEDGED`).
- **Cryptographic Audit Ledger**: An immutable SHA-256 block chain recording telemetry hashes, generated prescriptions, farmer execution logs, and agronomist reviews.
- **Tenant & Parcel Isolation**: Strict boundary scoping ensuring queries for uninstrumented parcels return HTTP 404 and prevent cross-farmer telemetry leakage.

### 2. Supporting Ecosystem Modules
These modules complement the core decision loop with broader agro-ecological context:
- **Soil Advisory & Regional Benchmarks (`/soil`)**: Delivers baseline ICAR-TNAU Cauvery Delta alluvial chemistry (pH 6.4, low N, medium P, high K) and accepts certified Soil Health Card parameters.
- **Formula-Based Yield Estimation (`/yield`)**: Calculates deterministic agronomic potential based on crop base yields, NPK stoichiometry, and temperature-humidity indices, contrasted against historical DES APY statistics.
- **Climate Risk & What-If Stress Simulator (`/climate`, `/simulator`)**: Interactive parametric simulation modeling crop heat stress, drought thresholds, and flood risks across vegetative, flowering, and maturity stages.
- **Crop Health & Satellite Spectral Interface (`/crop-health`)**: Multispectral NDVI pipeline specified for Copernicus Sentinel-2 MSI Level-2A surface reflectance (Band 04 & Band 08). Transparently displays `"Satellite data not connected"` when real orbital rasters are not present.
- **Specialist Consultation Portal (`/agronomist`, `/book-consultation`)**: Clinical triage interface where agronomists review pending prescriptions, add endorsement notes, and seal decisions into the audit ledger.
- **Market Intelligence & Community Hub (`/marketplace`, `/equipment-rental`, `/subsidies`, `/market`)**: Directory of farm machinery rentals, central and state agricultural subsidy schemes, and mandi commodity pricing.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client Tier ["Frontend Client (React 18 SPA + Vite)"]
        UI_Entry[App Entry & Providers] --> UI_Auth[Auth Context & Theme Providers]
        UI_Auth --> UI_Router{Protected Role Router}
        UI_Router -->|Farmer / Admin| UI_Farmer["Farmer Workspace (/dashboard, /irrigation, /soil)"]
        UI_Router -->|Agronomist / Admin| UI_Agro["Agronomist Portal (/agronomist, /yield, /climate)"]
        UI_Router -->|Admin Only| UI_Admin["Admin Control Console (/admin)"]
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
        SRV_Audit --> LEDGER_NOTE["*Single-node SHA-256 block chain for tamper-detection, not a decentralized cryptocurrency blockchain*"]
    end

    ENG_Decision <--> DB
    CTL_IoT <--> DB
    UI_Entry <-->|HTTP REST / Socket.IO| API_Gateway
```

---

## 🛠️ Complete Technology Stack

### Frontend Application (`Frontend/package.json`)
| Package / Dependency | Version | Purpose |
| :--- | :---: | :--- |
| **`react`** & **`react-dom`** | `18.3.1` | Core UI component framework and virtual DOM rendering. |
| **`typescript`** | `5.5.3` | Type-safe static analysis and typed component props. |
| **`vite`** | `5.4.2` | Fast HMR development server and optimized ES production bundler. |
| **`tailwindcss`** | `3.4.1` | Utility-first responsive CSS styling with dark/light theming. |
| **`react-router-dom`** | `6.22.3` | Client-side declarative routing and role-based route guards. |
| **`recharts`** | `2.12.7` | SVG time-series charts for telemetry, weather, and yield models. |
| **`lucide-react`** | `0.344.0` | Clean, modern iconography across all dashboard panels. |
| **`framer-motion`** | `12.35.0` | Fluid micro-animations, modal transitions, and responsive drawers. |
| **`socket.io-client`** | `4.8.3` | Real-time WebSocket connection to backend for live IoT broadcasts. |
| **`i18next`** & **`react-i18next`** | `23.10.1` | Multi-language localization (English, Tamil, Hindi, Telugu, Malayalam). |
| **`firebase`** | `12.11.0` | Client authentication SDK for Google OAuth and phone verification. |
| **`axios`** | `1.6.8` | HTTP client with centralized bearer token and error interceptors. |
| **`react-toastify`** | `11.0.5` | Non-blocking user feedback alerts and system notifications. |
| **`react-helmet-async`**| `3.0.0` | Dynamic document metadata, title tags, and SEO tags. |

### Backend API Service (`Backend/package.json`)
| Package / Dependency | Version | Purpose |
| :--- | :---: | :--- |
| **`express`** | `4.18.2` | Web server framework handling RESTful routing and middleware. |
| **`typescript`** | `5.9.3` | Strong backend typing, interfaces, and strict compiler checks. |
| **`mongoose`** | `9.2.4` | MongoDB Object Data Modeling (ODM) with schema validation. |
| **`socket.io`** | `4.8.3` | Bidirectional WebSocket server broadcasting sensor events to clients. |
| **`jsonwebtoken`** | `9.0.2` | Cryptographic JWT signing and role-based authorization verification. |
| **`bcryptjs`** | `2.4.3` | One-way password hashing using salted Blowfish key derivation (10 rounds). |
| **`helmet`** | `8.1.0` | Security headers (CSP, HSTS, X-Content-Type-Options, Frameguard). |
| **`cors`** | `2.8.5` | Strict cross-origin resource sharing allowlist against `FRONTEND_URL`. |
| **`express-rate-limit`**| `8.3.2` | Rate limiting protection on authentication and compute-heavy endpoints. |
| **`firebase-admin`** | `13.7.0` | Server-side validation of Google tokens and Firebase service account keys. |
| **`mongodb-memory-server`** | `11.3.0` | Ephemeral in-memory database engine for automated testing suites. |
| **`eslint`** & **`prettier`** | `10.0.2` | Static code analysis, security auditing, and automated formatting. |

---

## ⚙️ Environment Variables Reference

### Backend Configuration (`Backend/.env.example`)

| Variable Name | Required? | Default / Example Value | Operational Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `5001` | TCP port on which the Express server listens. |
| `NODE_ENV` | **Required** in Prod | `production` | Environment mode (`development`, `test`, `production`). In production, strict security validations are active. |
| `MONGODB_URI` | **Required** in Prod | `mongodb+srv://...` | Remote MongoDB Atlas URI. Unauthenticated localhost strings are strictly rejected in production. |
| `JWT_SECRET` | **Required** in Prod | `random_32_char_hex_key` | Secret key for signing HMAC-SHA256 JWT tokens. Must be >= 32 characters in production. |
| `JWT_EXPIRE` | Optional | `7d` | Token expiration period. |
| `FRONTEND_URL` | **Required** in Prod | `https://agri-flux-sandy.vercel.app` | Allowed CORS origin for web browser client access. |
| `IOT_API_KEY` | Optional | `agriflux-iot-key-dev` | Pre-shared key expected in `x-iot-api-key` header for ESP32 nodes. In production, missing key triggers fail-closed 401. |
| `AUDIT_SIGNING_KEY` | Optional | `random_32_char_hex_key` | Secret key used to generate HMAC-SHA256 signatures for the cryptographic audit ledger. |
| `AUTO_SEED_DEMO` | Optional | `false` | Explicit flag to enable demo account seeding on non-production startup. Refused in production. |
| `FIREBASE_PROJECT_ID` | Optional | `agriflux-ai` | Firebase project ID for server-side auth validation. |
| `FIREBASE_CLIENT_EMAIL`| Optional | `firebase-adminsdk@...` | Service account email for Firebase Admin SDK. |
| `FIREBASE_PRIVATE_KEY` | Optional | `-----BEGIN PRIVATE KEY-----\n...` | Service account RSA private key for Firebase Admin SDK. |

### Frontend Configuration (`Frontend/.env.example`)

| Variable Name | Required? | Default / Example Value | Operational Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | **Required** | `https://agriflux-backend.onrender.com/api` | Base API URL pointing to the backend (must end in `/api` without trailing slash). |
| `VITE_FIREBASE_API_KEY` | Optional | `AIzaSyCvNUuv7rC0wzt...` | Firebase client API key for Google & Phone authentication. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Optional | `agriflux-ai.firebaseapp.com` | Firebase authentication domain. |
| `VITE_FIREBASE_PROJECT_ID` | Optional | `agriflux-ai` | Firebase project identifier. |
| `VITE_FIREBASE_APP_ID` | Optional | `1:464366143152:web:...` | Unique web application client ID in Firebase. |

---

## 👥 Demo Accounts Policy & Usage

To prevent credential leakage in deployed environments, AgriFlux enforces a strict demo provisioning policy:
1. **Refused in Production**: The backend strictly refuses to provision demo accounts when `NODE_ENV === 'production'`.
2. **Dedicated Operator CLI**: In development and staging, demo accounts are created via an operator CLI script:
   ```bash
   cd Backend && npm run seed:demo
   ```
3. **Idempotent & Safe**: If demo accounts already exist, `seed:demo` preserves their existing passwords and records.
4. **Credential Sanitation**: Seeding logs redact all passwords and connection strings.

### Pre-Configured Demo Roles (For Local Testing Only)
| Role | Email Identifier | Default Role Scope | Operational Permissions |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@agriflux.com` | `farmer` | Access to field dashboard, IoT telemetry, irrigation controls, soil advisory, and consultation bookings. |
| **Agronomist** | `agronomist@agriflux.com` | `agronomist` | Multi-farm triage, pathology trends, prescription reviews, and climate risk simulation. |
| **Admin** | `admin@agriflux.com` | `admin` | Full system control, role elevation, emergency broadcasting, and audit chain verification. |

---

## 🌐 Verified Routes & API Endpoints

### Frontend Routes (`Frontend/src/App.tsx`)
- **Public Routes**: `/`, `/home` (Landing Page), `/login`, `/register`, `/forgot-password`, `/404`
- **Protected Farmer & Admin Routes**:
  - `/dashboard` — Real-time farm overview, live sensor cards, and weather charts.
  - `/irrigation` — Closed-loop FAO-56 irrigation decisions, freshness badges, and pump controls.
  - `/soil` — Soil health card analysis & ICAR regional reference baseline.
  - `/crop-health` — Field vegetation health and Sentinel-2 satellite status.
  - `/land-intelligence` — Cadastral parcel intelligence and GIS boundaries.
  - `/marketplace` — Agricultural inputs and trade directory.
  - `/equipment-rental` — Tractor and machinery hiring registry.
  - `/subsidies` — Central and State government agricultural subsidy schemes.
  - `/market` — Mandi commodity prices and trend analysis.
  - `/investors` — Farm funding portfolio and investor pitch metrics.
  - `/book-consultation` — Direct appointment scheduling with agronomists.
- **Protected Agronomist & Admin Routes**:
  - `/agronomist` — Multi-farm clinical triage, pathology trends, and prescription review.
  - `/yield` — Deterministic agronomic formula yield estimation vs historical DES APY.
  - `/climate` & `/simulator` — Extreme weather vulnerability matrix and parametric stress simulator.
  - `/sustainability` — Environmental stewardship and carbon footprint scoring.
- **Protected Admin-Only Routes**:
  - `/admin` — System diagnostics, audit chain verification, and user management.
- **Common Protected Routes**:
  - `/settings` — Profile preferences, language switching, security settings.
  - `/about` — Scientific disclosures, methodology, and data provenance.
  - `/onboarding` — First-time user setup.

### Backend API Endpoints Reference
- **Authentication (`/api/auth`)**:
  - `POST /register`, `POST /login`, `POST /send-otp`, `POST /verify-otp`, `POST /social-login`, `POST /forgot-password`, `POST /logout`
  - `PATCH /users/:userId/role` (Admin only)
- **IoT Telemetry & Actuation (`/api/iot-data`)**:
  - `POST /` — Ingest sensor telemetry (`x-iot-api-key` or JWT). Enforces skew checks and anti-spoofing (403).
  - `GET /` — Latest reading for requested field (`fieldId`). Returns 404 for uninstrumented fields.
  - `GET /history` — Scoped historical telemetry.
  - `POST /control` — Pump actuation command. Refuses activation on stale telemetry with **HTTP 422 `TRIPPED_STALE_TELEMETRY`**. Emergency shutoff always allowed.
  - `POST /actuator-ack` — Physical hardware execution confirmation from ESP32.
  - `GET /actuator-state` — Current actuator state machine status (`PENDING_ACK`, `ACKNOWLEDGED`).
- **Field Intelligence & Decisions (`/api/field-intelligence`)**:
  - `POST /recommend` — Explainable FAO-56 irrigation advice with 15-minute telemetry freshness gate.
  - `GET /context` — Multi-source field context (soil, weather, telemetry).
  - `POST /action` — Farmer recorded action on field timeline.
  - `GET /timeline/:fieldId` — Chronological field event history.
  - `POST /evaluate` — Follow-up outcome evaluation (moisture recovery vs worsening).
  - `POST /review` & `GET /reviews` — Agronomist prescription endorsement (Agronomist/Admin only).
  - `GET /history` — Historical recommendation audit log.
- **Environmental Data Ingestion (`/api/environmental`)**:
  - `GET /registry`, `GET /weather`, `GET /satellite/ndvi`, `GET /soil`, `GET /crop-statistics`
  - `POST /ingest/weather`, `POST /ingest/satellite`, `POST /soil/ingest`, `POST /crop-statistics/ingest`
- **Cryptographic Audit Ledger (`/api/blockchain`)**:
  - `GET /chain` — Full SHA-256 block chain retrieval.
  - `GET /verify` — Merkle root and cryptographic hash link verification.
  - `POST /log` — Seal arbitrary event into immutable block (Agronomist/Admin only).
- **AI Agronomic Predictions (`/api/ai`)**:
  - `POST /predict-yield`, `POST /irrigation-schedule`, `POST /soil-analysis`, `POST /climate-risk`, `POST /simulate-climate`
- **Specialist Consultations (`/api/consultations`)**:
  - `POST /book`, `GET /my-bookings`, `GET /all`, `PATCH /:id/status`

---

## 📊 Scientific Data Provenance & Real-World Boundaries

AgriFlux strictly separates verified real-world baselines from speculative claims:

1. **Historical Weather Reanalysis (Open-Meteo ERA5-Land)**:
   - Covers 2021–2026 for the Thanjavur pilot district (10.79°N, 79.10°E, Cauvery Delta). Provides temperature, precipitation, and reference evapotranspiration ($ET_0$).
   - *Boundary*: Historical model-based reanalysis estimates, **not** live microclimate sensor readings or operational 14-day forecasts.
2. **Satellite Spectral Processing (Copernicus Sentinel-2 L2A)**:
   - Multispectral pipeline designed for Sentinel-2 MSI Level-2A surface reflectance (Band 04 Red 665nm, Band 08 NIR 842nm at 10m resolution) with Scene Classification Layer (SCL) cloud masking.
   - *Boundary*: When genuine raster tiles are not ingested, AgriFlux presents an honest empty state (`"Satellite data not connected"`). Synthetic vegetation indices are **never** fabricated.
3. **Regional Soil Reference Profile**:
   - Published ICAR-TNAU regional soil survey classifications for the Cauvery Delta alluvial basin (pH 6.4, low N, medium P, high reserve K).
   - *Boundary*: An **illustrative regional benchmark** providing agro-ecological context; **not** an individual farm Soil Health Card or laboratory test.
4. **Historical Crop Production Statistics (DES APY)**:
   - Directorate of Economics & Statistics (DES), Ministry of Agriculture & Farmers Welfare, Government of India. Archived records from **Agricultural Year 1997–1998** for Thanjavur Rice.
   - *Boundary*: Macroeconomic historical district yield context; **not** a farm-level seasonal yield guarantee.
5. **Deterministic Agronomic Formula vs Machine Learning**:
   - Irrigation logic implements the FAO-56 Penman-Monteith and Maximum Allowable Depletion (MAD) framework. Yield estimations are deterministic agronomic formulas calibrated against NPK stoichiometry and climate indices, transparently distinguished from black-box ML.
6. **Cryptographic Audit Ledger vs Cryptocurrency Blockchain**:
   - A single-node, tamper-evident SHA-256 block chain with Merkle tree verification and HMAC signing.
   - *Boundary*: Provides local cryptographic auditability and tamper-detection. It is **not** a decentralized, multi-validator proof-of-work/stake cryptocurrency network.

---

## 🧪 Automated Verification Suite (16 Suites, 130 Tests — 100% Passing)

AgriFlux includes a comprehensive automated test suite validating security, decision reliability, and safety interlocks:

```bash
cd Backend && npm test
```

| Suite | Focus Area | Tests | Result |
| :---: | :--- | :---: | :---: |
| **Suite 1** | Authentication, Token Integrity, RBAC Middleware & Post-Login Voice Regression | 6 | **PASS** |
| **Suite 2** | IoT Telemetry Ingestion, Ring Buffer, Validation & Device IDs | 6 | **PASS** |
| **Suite 3** | Field Intelligence Engine, Closed-Loop Decisions & Moisture Depletion | 6 | **PASS** |
| **Suite 4** | AI & Agronomic Prediction Services (Yield, Schedule, Risk) | 5 | **PASS** |
| **Suite 5** | Historical Weather CSV Ingestion & Idempotency | 3 | **PASS** |
| **Suite 6** | Sentinel-2 L2A Satellite NDVI Processing & Quality Filters | 5 | **PASS** |
| **Suite 7** | Soil Health Card & Laboratory Chemistry Ingestion | 3 | **PASS** |
| **Suite 8** | Directorate of Economics & Statistics (DES) APY Ingestion | 2 | **PASS** |
| **Suite 9** | IoT Actuator State Machine & Two-Phase Acknowledgement Protocol | 6 | **PASS** |
| **Suite 10**| Field Intelligence Multi-Source Environmental Integration | 3 | **PASS** |
| **Suite 11**| Blockchain Ledger Persistence, Concurrency & Security | 18 | **PASS** |
| **Suite 12**| Decision Engine Defect Remediation & Verification Suite | 12 | **PASS** |
| **Suite 13**| Quantex Master Audit & Defect Remediation Verification | 5 | **PASS** |
| **Suite 14**| Quantex Closed-Loop End-to-End Workflow Verification | 7 | **PASS** |
| **Suite 15**| Demo Account Seeding Security & Secret Validation | 7 | **PASS** |
| **Suite 16**| Stale Telemetry Gating, Actuator Safety Interlock & Tenant Isolation | 18 | **PASS** |
| **TOTAL** | **Comprehensive Regression & Security Gate** | **130** | **100% PASS** |

Detailed execution evidence is documented in [reports/README_SECURITY_TELEMETRY_TEST_RESULTS.md](reports/README_SECURITY_TELEMETRY_TEST_RESULTS.md).

---

## 🚀 Quickstart: Local Setup & Development

### Prerequisites
- Node.js (`v18.x`, `v20.x`, or `v24.x`)
- Git
- MongoDB (local instance or MongoDB Atlas cluster)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Austin-Joshua/AgriFlux.git
cd AgriFlux
npm run install-all
```

### 2. Configure Environment Files
```bash
# In Backend/
cp Backend/.env.example Backend/.env

# In Frontend/
cp Frontend/.env.example Frontend/.env
```

Ensure `Backend/.env` has:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/agriflux
JWT_SECRET=agriflux_development_secret_2026
FRONTEND_URL=http://localhost:3000
IOT_API_KEY=agriflux-iot-key-dev
```

### 3. Provision Demo Accounts (Non-Production Only)
```bash
cd Backend && npm run seed:demo
```

### 4. Run Development Servers
From the root directory:
```bash
npm run dev
```
- **Frontend Client**: `http://localhost:3000`
- **Backend API**: `http://localhost:5001/api`

---

## 🔒 Security & Quality Standards

- **Code Cleanliness**: 0 ESLint warnings (`eslint . --max-warnings 0`) and 0 TypeScript compilation errors (`tsc`).
- **Cryptographic Safeguards**: Constant-time comparison (`crypto.timingSafeEqual`) for IoT API keys (CWE-208 mitigation).
- **Actuator Interlock**: Refuses physical pump actuation on telemetry > 15 minutes old with HTTP 422.
- **Fail-Closed Design**: Database disconnections and invalid signatures cause the system to safely halt critical operations rather than continuing in an inconsistent state.
- **Clean Post-Login UX**: Zero unwanted automated voice synthesis, microphone triggers, or intrusive floating popups upon authentication.
