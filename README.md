# 🌾 AgriFlux: Agricultural Intelligence Platform

AgriFlux is a unified agricultural intelligence platform built for farmers, expert agronomists, and system administrators. By synthesizing historical meteorological reanalysis, multi-source environmental baselines, real-time IoT sensor telemetry, and agronomic heuristics, AgriFlux translates field data into actionable crop and irrigation management.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Frontend Client (React SPA)
        A[App Entry] --> B[Theme & Language Providers]
        B --> C[Protected Navigation Routes]
        C --> D[Farmer Workspace /dashboard]
        C --> E[Agronomist Portal /agronomist]
        C --> F[Admin Control Console /admin]
        C --> G[Environmental Intelligence Hub]
    end

    subgraph Service Backend (Express NodeJS)
        H[Express Server Router] <--> I[JWT & RBAC Middleware]
        H <--> J[Socket.io WebSocket Server]
        H --> K[API Controller Modules]
        K --> L[Field Intelligence Engine]
        K --> M[Environmental Data Service]
    end

    subgraph Persistent Storage & IoT Layer
        N[(MongoDB Durable Storage)]
        O[ESP32 IoT Node / Simulator] -->|HTTP POST x-iot-api-key / WebSockets| J
    end

    Frontend Client <-->|HTTP REST / WebSockets| Service Backend
    Service Backend <--> N
```

---

## 📊 Environmental Data Provenance & Real-World Boundaries

AgriFlux strictly separates verified historical data, regional reference benchmarks, and live telemetry from unsupported predictive claims.

### 1. Historical Weather Reanalysis (Open-Meteo ERA5-Land)
- **Source**: Open-Meteo ERA5-Land Reanalysis (2021–2026) for the Thanjavur pilot region (10.79°N, 79.10°E, 59m elevation, Cauvery Delta).
- **Scope**: Historical model-based reanalysis estimates providing temperature (mean, min, max), precipitation, and FAO-56 Penman-Monteith reference evapotranspiration ($ET_0$).
- **Distinction**: These are historical reanalysis records, **not** live microclimate sensor measurements or operational forecasts. Persisted with idempotency in MongoDB.

### 2. Satellite Spectral Processing (Copernicus Sentinel-2 L2A)
- **Pipeline Architecture**: Multispectral processing service designed for Sentinel-2 MSI Level-2A surface reflectance (Band 04 Red 665nm, Band 08 NIR 842nm at 10m spatial resolution) with Scene Classification Layer (SCL) cloud filtering:
  $$\text{NDVI} = \frac{\text{B08} - \text{B04}}{\text{B08} + \text{B04}}$$
- **Current Integration Status**: **Satellite data not connected**. When genuine raster data has not been ingested, AgriFlux presents an honest empty state (`"Satellite data not connected"`). Synthetic vegetation indices are **never** fabricated or presented as real orbital observations.

### 3. Regional Soil Reference Profile
- **Source**: Published ICAR-TNAU regional soil survey classifications for the Cauvery Delta alluvial basin (pH 6.4, low available N, medium P, high reserve K).
- **Scope**: **Illustrative regional benchmark** providing baseline agro-ecological context.
- **Distinction**: It is **not** an official certified farm Soil Health Card, laboratory report, or in-situ measurement of an individual farm boundary. Operational farm advisories recommend certified soil testing.

### 4. Historical Crop Production Statistics (DES APY)
- **Source**: Directorate of Economics & Statistics (DES), Ministry of Agriculture & Farmers Welfare, Government of India.
- **Scope**: Archived historical records from **Agricultural Year 1997–1998** for Thanjavur Rice (Area: 181,496 Ha, Production: 489,770 Tonnes, Yield: 2.70 t/Ha).
- **Distinction**: Provides macroeconomic historical district yield context; **not** a current seasonal target or individual farm productivity metric.

### 5. Agronomic Yield Estimation vs. Machine Learning
- **Methodology**: Deterministic formula based on crop-specific base yields calibrated with NPK stoichiometry, rainfall distribution, and temperature-humidity indices.
- **Distinction**: Clearly labelled as an **Agronomic Formula Estimate**, distinguished from empirical machine-learning inferences.

### 6. IoT Telemetry & Actuation
- **Integration**: Hardware protocol supporting ESP32 microcontrollers communicating via HTTP POST and WebSockets.
- **Security**: Device-key authentication (`x-iot-api-key`) with fail-closed behavior in production. Two-phase pump actuation state machine (`PENDING_ACK` -> `ACKNOWLEDGED`).
- **Validation**: Full test suite coverage with simulated hardware and physical telemetry endpoints.

---

## 👥 Role-Based Portals & Access Control

AgriFlux enforces strict cryptographic role-based access control (RBAC) across three distinct user roles:

1. **Farmer Portal (`/dashboard`, `/yield`, `/irrigation`, `/soil`)**
   - Environmental Intelligence Hub with Open-Meteo weather charts and regional soil benchmarks.
   - Closed-loop Field Intelligence advisory with FAO-56 irrigation recommendations.
   - Remote irrigation pump controls backed by an actuator state machine.
   - Clean authenticated dashboard with zero automatic voice interference.

2. **Agronomist Portal (`/agronomist`)**
   - Restricted to `agronomist` and `admin` roles.
   - Multi-farm monitoring, pathology trends, and consultation management.

3. **Admin Console (`/admin`)**
   - Restricted to `admin` role.
   - System telemetry monitor, database connection status, and emergency alert broadcast.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Recharts, Lucide Icons, i18next (English, Tamil, Hindi, Telugu, Malayalam).
- **Backend**: Node.js, Express, TypeScript 5, Mongoose/MongoDB, Socket.IO, JWT, Bcrypt.
- **IoT Protocol**: RESTful JSON ingestion with `x-iot-api-key` header, Socket.IO real-time broadcast, ESP32 firmware compatibility.

---

## 🚀 Local Setup & Development

### Prerequisites
- Node.js (v18.x or v20.x or v24.x)
- MongoDB instance (local or MongoDB Atlas connection string)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Austin-Joshua/AgriFlux.git
cd AgriFlux
npm run install-all
```

### 2. Configure Environment Variables
Copy the example environment files:
```bash
# In Backend/
cp Backend/.env.example Backend/.env

# In Frontend/
cp Frontend/.env.example Frontend/.env
```

Ensure `Backend/.env` contains your MongoDB connection string and a secret key:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/agriflux
JWT_SECRET=agriflux_development_secret_2026
FRONTEND_URL=http://localhost:3000
IOT_API_KEY=agriflux-iot-key-dev
```

### 3. Seed Environmental Data (Optional)
To ingest historical weather reanalysis and archived APY statistics into MongoDB:
```bash
# In Backend/
npm run ingest:weather
npm run ingest:apy
```

### 4. Run Development Servers
```bash
npm run dev
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001/api`

### 5. Demo Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Farmer** | `farmer@agriflux.com` | `Farmer@123` |
| **Agronomist** | `agronomist@agriflux.com` | `Agro@123` |
| **Admin** | `admin@agriflux.com` | `Admin@123` |

---

## 🧪 Automated Verification Suite

AgriFlux includes a comprehensive 10-suite automated test suite covering authentication, RBAC, IoT validation, actuator state machines, data ingestion, and regression tests.

```bash
cd Backend && npm test
```

### Verified Test Suites (45/45 Passing):
1. **Suite 1**: Authentication, Token Integrity, RBAC Middleware & Post-Login Voice Regression (6 tests)
2. **Suite 2**: IoT Telemetry Ingestion, Validation & Buffering (6 tests)
3. **Suite 3**: Field Intelligence Engine & Closed-Loop Decisions (6 tests)
4. **Suite 4**: AI & Agronomic Prediction Services (5 tests)
5. **Suite 5**: Historical Weather CSV Ingestion & Idempotency (3 tests)
6. **Suite 6**: Sentinel-2 L2A Satellite NDVI Processing & Quality Filters (5 tests)
7. **Suite 7**: Soil Health Card & Laboratory Chemistry Ingestion (3 tests)
8. **Suite 8**: Directorate of Economics & Statistics (DES) APY Ingestion (2 tests)
9. **Suite 9**: IoT Actuator State Machine & Acknowledgement Protocol (6 tests)
10. **Suite 10**: Field Intelligence Multi-Source Environmental Integration (3 tests)

---

## 🔒 Security & Code Standards

1. **Authentication Security**: Passwords hashed with Bcrypt (salt rounds: 10). Cryptographic JWT tokens signed with user role and verified on all protected API routes.
2. **Fail-Closed IoT Endpoints**: Device endpoints (`POST /api/iot-data`, `POST /api/iot-data/actuator-ack`) enforce `x-iot-api-key` validation with fail-closed behavior in production.
3. **CORS & Rate Limiting**: Strict CORS allowlisting against `FRONTEND_URL`. Production rate limiting against brute-force attacks.
4. **Clean Post-Login UX**: Zero unwanted automated speech synthesis, microphone activation, or floating widgets.
