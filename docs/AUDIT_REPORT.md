# 🌾 AgriFlux Comprehensive Full-Stack Audit Report

**Date:** October 16, 2026  
**Auditor:** Autonomous Senior Full-Stack, AppSec, QA, IoT, Data & ML Engineering Pair  
**Repository:** [Austin-Joshua/AgriFlux](https://github.com/Austin-Joshua/AgriFlux)  
**Deployed URL:** [agri-flux-sandy.vercel.app](https://agri-flux-sandy.vercel.app/login)  
**Baseline Git Commit:** `f8fb7482`  
**Working Branch:** `audit-and-repair`  

---

## 1. Executive Summary

AgriFlux is designed as an agricultural intelligence platform coordinating farmers, agronomists, and administrators. It integrates real-time IoT soil nodes, crop yield forecasting, satellite GIS monitoring, irrigation scheduling, and expert consultations.

The audit revealed a solid UI foundation and modern React/Vite/Express scaffolding, but identified **critical architectural disconnects**, **security authorization flaws**, **missing database persistence for IoT telemetry**, and **unconnected AI/ML workflows**. 

### Key Audit Findings Overview
* **P0/P1 — Auth & Authorization Lockout:** JWT tokens were generated without the user's `role` payload. Consequently, the backend role guard (`requireRole('agronomist', 'admin')`) permanently returned `403 Forbidden` for all agronomist and admin consultation endpoints.
* **P1 — IoT Route/Firmware Mismatch & Missing Persistence:** The ESP32 firmware (`esp32_soil_sensor.ino`) failed to send the required `x-iot-api-key` header, causing all physical sensor sync requests to be rejected (401). Sensor readings were only stored in an in-memory variable (lost on restart/clustering), and missing sensor readings silently coerced to `0`.
* **P1 — Unauthenticated Socket.IO & Actuator Risk:** The Socket.IO gateway had no authentication or authorization checks. Any client could connect and broadcast `iot-control` commands to toggle pumps without credentials.
* **P1 — Disconnected Frontend AI Workflows:** Frontend pages for Yield Prediction, Irrigation Intelligence, Soil Advisory, Climate Risk, and Climate Simulation were completely disconnected from the backend Express API (`/api/ai/*`). Instead, they executed client-side `setTimeout` simulations with hardcoded confidence ratings (up to 99%).
* **P2 — Role Navigation & Direct URL Protection Gaps:** The client-side route guard (`ProtectedRoute`) verified authentication but did not enforce role separation; farmers could directly access `/agronomist` and `/admin` dashboards, while agronomists/admins lacked dedicated navigation in `Sidebar.tsx`.
* **P2 — 0% Automated Test Coverage:** Neither frontend nor backend contained automated test files, runners, or CI test scripts.

---

## 2. Architecture & Service Inventory

### 2.1 Repository Structure
```
AgriFlux/
├── Backend/                 # Express.js REST API & Socket.IO Gateway (TypeScript)
│   ├── ml/                  # Standalone Python yield prediction script
│   └── src/
│       ├── config/          # DB connection, env validation, Firebase Admin
│       ├── controllers/     # Auth, AI, Consultation, Integration, IoT
│       ├── middleware/      # JWT auth guard
│       ├── routes/          # Express route definitions
│       └── services/        # Rule-based agronomic algorithms
├── Database/
│   └── Models/              # Mongoose Schemas (User, Consultation, Report)
├── Frontend/                # React 18, Vite, TypeScript, Tailwind CSS
│   ├── src/
│       ├── components/      # UI components, layout, modals, chat assistant
│       ├── context/         # AuthContext, ThemeContext
│       ├── hooks/           # useIoT (Socket/polling), useRealisticData
│       ├── pages/           # 25 routes (Farmer, Agronomist, Admin, Services)
│       └── lib/             # Firebase client SDK
├── IoT/                     # ESP32 C++ firmware sketch & documentation
└── docs/                    # System architecture & audit deliverables
```

### 2.2 Technology Stack
| Layer | Technologies | Status |
|---|---|---|
| **Frontend** | React 18.3, Vite 5.4, TypeScript 5.5, Tailwind CSS 3.4, Recharts, Framer Motion, i18next | Functional; builds cleanly |
| **Backend** | Node.js 24, Express 4.18, Socket.IO 4.8, Mongoose 9.2, bcryptjs, jsonwebtoken, helmet | Functional with in-memory fallback |
| **Database** | MongoDB with Mongoose ODM | User, Consultation, Report models present; missing IoT & Field Intelligence models |
| **IoT Transport** | HTTP REST (`/api/iot-data`) & WebSockets (`iot-update`, `iot-control`) | Unauthenticated sockets; firmware missing API key |
| **ML / Analytics** | Python 3.12 (scikit-learn template), Node.js heuristic calculators | Template was disconnected from API |

---

## 3. Comprehensive Route & Feature Inventory

| Route | Intended Role | Auth Required | Component | Backend Endpoint | Status / Issues Identified |
|---|---|---|---|---|---|
| `/login` | Public | No | `Login.tsx` | `POST /api/auth/login` | Working; demo fallback supported |
| `/register` | Public | No | `Register.tsx` | `POST /api/auth/register` | Working; unique index collision handling |
| `/forgot-password` | Public | No | `ForgotPassword.tsx` | `POST /api/auth/forgot-password` | Leaked reset token in backend log; no reset form |
| `/dashboard` | Farmer | Yes | `Dashboard.tsx` | `GET /api/consultations/my-bookings` | Main dashboard; uses mock data in places |
| `/agronomist` | Agronomist | Yes (Agronomist) | `AgronomistDashboard.tsx` | `GET /api/consultations/all`, `PATCH /status` | **BLOCKED:** Backend returned 403 due to missing role in JWT |
| `/admin` | Admin | Yes (Admin) | `AdminDashboard.tsx` | None (all static mock) | No role enforcement in route guard |
| `/book-consultation` | Farmer | Yes | `BookConsultation.tsx` | `POST /api/consultations/book` | Working; UUID vs ObjectId typing risk |
| `/yield` | Farmer | Yes | `YieldPrediction.tsx` | Disconnected (`/api/ai/predict-yield` ignored) | Client-side mock calculation; hardcoded 99% confidence |
| `/irrigation` | Farmer | Yes | `IrrigationIntelligence.tsx` | Disconnected (`/api/ai/irrigation-schedule` ignored) | Client-side calculations |
| `/soil` | Farmer | Yes | `SoilAdvisor.tsx` | Disconnected (`/api/ai/soil-analysis` ignored) | Client-side calculations |
| `/climate` | Farmer | Yes | `ClimateRisk.tsx` | Disconnected (`/api/ai/climate-risk` ignored) | Client-side calculations |
| `/simulator` | Farmer | Yes | `ClimateSimulator.tsx` | Disconnected (`/api/ai/simulate-climate` ignored) | Client-side calculations |
| `/crop-switching` | Farmer | Yes | `CropSwitchingAdvisor.tsx` | None (Client rules) | Working as client advisory tool |
| `/sustainability` | Farmer | Yes | `SustainabilityScore.tsx` | None (Client rules) | Working as client scoring tool |
| `/land-intelligence` | Farmer | Yes | `LandIntelligence.tsx` | None (Client GIS map) | Interactive SVG polygon mapping |
| `/market` | Farmer | Yes | `MarketAnalysis.tsx` | None (Synthetic Mandi data) | Client data generator |
| `/marketplace` | Farmer | Yes | `Marketplace.tsx` | None (Client catalogue) | Working UI; no persistent order backend |
| `/equipment-rental` | Farmer | Yes | `EquipmentRental.tsx` | None (Client catalogue) | Working UI; simulated booking |
| `/subsidies` | Farmer | Yes | `GovernmentSubsidies.tsx` | None (Curated registry) | Working information portal |
| `/investors` | Public/Farmer | Yes | `InvestorsHub.tsx` | None (Curated metrics) | Working presentation UI |
| `/settings` | All | Yes | `Settings.tsx` | None | Local preferences persisted to localStorage |
| `/about` | Public | No | `About.tsx` | None | Informational page |

---

## 4. Prioritized Verified Defects Matrix

| ID | Severity | Category | Affected Component / File | Root Cause | Impact | Repair Action |
|---|---|---|---|---|---|---|
| **BUG-01** | **P0** | Security / Auth | `Backend/src/controllers/auth.controller.ts`, `routes/consultation.routes.ts` | JWT payload did not include `role` during token signing. | Agronomists and Admins received 403 Forbidden on all consultation management endpoints. | Include `role` in JWT payload; update `auth.ts` middleware to parse and attach role. |
| **BUG-02** | **P0** | Security / IoT | `Backend/src/server.ts`, `Frontend/src/hooks/useIoT.ts` | Socket.IO allowed unauthenticated connections to emit `iot-control` events. | Arbitrary web clients could trigger actuator commands without credentials. | Enforce JWT authentication on Socket.IO handshake and authorize `iot-control` emitters. |
| **BUG-03** | **P1** | IoT / Firmware | `IoT/esp32_soil_sensor.ino`, `Backend/src/routes/iot.routes.ts` | ESP32 C++ sketch sent POST without `x-iot-api-key` header required by backend. | Real hardware nodes rejected with 401 Unauthorized. | Add API key header in firmware; support configurable hardware key in backend. |
| **BUG-04** | **P1** | IoT / Persistence | `Backend/src/controllers/iot.controller.ts` | Sensor telemetry only held in memory (`latestIoTData`); missing moisture coerced to 0. | Data loss on restart/cluster fork; invalid telemetry corrupted as zero readings. | Create `IoTReading` database model, persist readings, validate ranges without zero-coercion. |
| **BUG-05** | **P1** | Network / Deploy | `Frontend/src/hooks/useIoT.ts` | Socket.IO URL hardcoded to `http://localhost:5001`. | Broken WebSockets in production deployments on Vercel. | Dynamically resolve Socket.IO server URL from `API_URL` / window location. |
| **BUG-06** | **P1** | Network / Auth | `Frontend/src/hooks/useIoT.ts` | Fallback HTTP `POST /api/iot-data/control` omitted Bearer token header. | HTTP pump control failed with 401 Unauthorized. | Inject current user JWT token into authorization header. |
| **BUG-07** | **P1** | ML & AI | `Frontend/src/pages/YieldPrediction.tsx`, `ai.service.ts`, `ml/predict_yield.py` | Prediction UI never called backend API; ML Python script was completely unreferenced. | Fabricated client-side predictions with unsubstantiated "99% Confidence" claims. | Wire Yield Prediction and AI pages to backend endpoints; integrate reproducible ML inference. |
| **BUG-08** | **P2** | Navigation / Auth | `Frontend/src/components/ProtectedRoute.tsx`, `Sidebar.tsx`, `App.tsx` | Route guard did not check required roles; Sidebar omitted portal links. | Farmers could access admin dashboard; agronomists lacked navigation to their portal. | Add `allowedRoles` to `ProtectedRoute`; add role-aware navigation in Sidebar and Header. |
| **BUG-09** | **P2** | Security / Logs | `Backend/src/controllers/auth.controller.ts` | Cleartext password reset token written to `console.log`. | Secret exposure in production application logs. | Remove token logging; sanitize reset flow. |
| **BUG-10** | **P2** | Code Quality | `Backend/.eslintrc.json`, Prettier | CRLF line endings on Windows caused 1,456 linter errors. | Lint verification blocked. | Configure Prettier line ending rules to handle CRLF/LF gracefully. |
| **BUG-11** | **P2** | QA / Testing | Workspace Root | Zero unit, integration, or contract tests existed. | High risk of undetected regressions during refactoring. | Implement comprehensive automated test suite (Unit, Integration, Auth, IoT, ML). |

---

## 5. Repair Plan & Verification Strategy

1. **Stage 1 (P0): Security & Authorization Repair**
   - Fix JWT signing in `auth.controller.ts` to include `role`.
   - Update `auth.ts` middleware to guarantee `req.user.role` is populated.
   - Enforce Socket.IO authentication middleware on connection and `iot-control` events.
   - Remove cleartext secret logging.
2. **Stage 2 (P1): IoT Persistence & Connection Repair**
   - Implement `IoTReading` model in `Database/Models/IoTReading.ts`.
   - Persist readings with device ID, timestamps, calibrated units, and freshness calculation.
   - Fix ESP32 sketch and IoT route authentication.
   - Fix `useIoT.ts` URL resolution and HTTP auth header.
3. **Stage 3 (P1/P2): Connect Frontend to Backend Services**
   - Connect `YieldPrediction.tsx`, `SoilAdvisor.tsx`, `IrrigationIntelligence.tsx`, `ClimateRisk.tsx` to real Express `/api/ai/*` endpoints.
   - Remove hardcoded 99% confidence labels; display transparent, evidence-based metrics.
   - Add role-based protection in `ProtectedRoute.tsx` and role-specific navigation in `Sidebar.tsx`.
4. **Stage 4 (Hackathon Innovation): AgriFlux Field Intelligence Engine**
   - Build closed-loop backend decision engine connecting IoT, soil, weather, and crop context.
   - Add persistent models for Recommendations and Farmer Actions.
   - Connect the Field Intelligence Workspace to the backend API.
   - Build follow-up observation evaluation comparing post-action telemetry with expected outcomes.
5. **Stage 5 (QA): Comprehensive Automated Test Suite**
   - Unit tests for agronomic decision logic, calculations, and validators.
   - API integration tests for auth, consultations, IoT ingestion, and field intelligence.
   - ML inference contract and leakage tests.
