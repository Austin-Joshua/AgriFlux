# AgriFlux Hackathon Contribution Changelog (QUANTEX '26)

## 1. Mission & Scope Clarification

In compliance with the hackathon rules and Section 19 of the engineering mandate, this document maintains a strict, auditable distinction between:
- **Pre-Existing Baseline Capabilities:** Code and features existing prior to the event (standard dashboard shells, unverified AI formula templates, unconnected IoT firmware sketches).
- **Official 24-Hour Event Contributions:** Architectural repairs, security hardening, automated test suites, telemetry persistence, and the flagship **Field Intelligence Engine**.
- **Future Unimplemented Scope:** Long-term integrations deferred beyond the hackathon window.

---

## 2. Event Contribution Breakdown

### A. Core Innovation: AgriFlux Field Intelligence Engine (Closed-Loop Farm Decisions)
- **Problem Solved:** Connected fragmented soil, weather, crop, and IoT cards into a unified, evidence-based agronomic decision workflow.
- **Backend Service Implementation:**
  - `Backend/src/services/field-intelligence.service.ts`: Built deterministic agronomic decision engine implementing FAO-56 Management Allowed Depletion (MAD) calculations, weather risk evaluation, and NPK remediation logic.
  - `Backend/src/controllers/field-intelligence.controller.ts`: Built authenticated REST controller handling recommendation requests, farmer action logging, and follow-up telemetry evaluations.
  - `Backend/src/routes/field-intelligence.routes.ts`: Mounted endpoints under `/api/field-intelligence` with JWT authentication and rate limiting.
  - `Database/Models/FieldRecommendation.ts`: Implemented Mongoose model persisting structured recommendations, observations, farmer action audit logs, and closed-loop outcome evaluations.
- **Frontend Workspace Implementation:**
  - `Frontend/src/components/AIDecisionPanel.tsx`: Re-engineered the decision workspace into a multi-field control center with telemetry provenance badges, FAO-56 rule transparency, interactive action recording, and real-time follow-up outcome evaluation.

### B. High-Impact Security & Authorization Hardening
- **JWT Cryptographic Role Integrity (`auth.controller.ts`):** Resolved P0 defect where tokens omitted user roles, locking agronomists out with 403 errors. Tokens now securely sign `{ id, role, email, phone }`.
- **Role-Based Access Control Middleware (`middleware/auth.ts`):** Implemented strict `requireRole(...roles)` checking with proper HTTP 401/403 status code semantics.
- **Actuator Command Authorization (`server.ts` & `socket.ts`):** Secured Socket.IO with JWT handshake authentication, restricting pump actuation (`iot-control`) to verified `farmer` and `admin` roles.
- **Information Leakage Remediation (`auth.controller.ts`):** Removed plain-text password reset token logging.

### C. IoT Telemetry Reliability & Hardware Synchronization
- **Telemetry Persistence & Ring Buffer (`iot.controller.ts`, `IoTReading.ts`):** Replaced volatile in-memory storage with MongoDB persistence and a 50-item fallback ring buffer.
- **Safe Telemetry Validation (`iot.controller.ts`):** Prevented silent coercion of missing sensor readings to zero. Implemented strict physical bounds validation (0-100% moisture, -10-60°C temperature, 0-100% humidity).
- **Firmware API Key Fix (`IoT/esp32_soil_sensor.ino`):** Added `x-iot-api-key` header to ESP32 sketch matching backend authentication requirements.
- **Dynamic Production WebSocket URL (`Frontend/src/hooks/useIoT.ts`):** Replaced hardcoded `localhost:5001` with `VITE_WS_URL` and window origin resolution.

### D. Automated Quality Assurance & Testing Suite
- **Backend Test Runner (`Backend/src/tests/runAllTests.ts`):** Created master automated test runner executing 4 comprehensive suites (22 unit/integration tests) with 100% pass rate.
- **Auth & RBAC Suite (`src/tests/auth.test.ts`):** Verifies token signing, role preservation, bcrypt hashing, and middleware rejection.
- **IoT Telemetry Suite (`src/tests/iot.test.ts`):** Verifies missing field rejection, physical bounds, and freshness calculation.
- **Field Intelligence Suite (`src/tests/field-intelligence.test.ts`):** Verifies FAO-56 decision rules, farmer action logging, and closed-loop follow-up evaluations.
- **AI Domain Logic Suite (`src/tests/ai.test.ts`):** Verifies calibrated yield predictions, NPK soil health scoring, and climate risk alerts.

---

## 3. Contributor Ownership Matrix

| Contributor Role | Primary Responsibilities | Deliverables Produced |
|---|---|---|
| **Integration & Backend Lead** | System architecture, JWT role integrity, Socket.IO authorization, Field Intelligence Service, circular dependency resolution | `field-intelligence.service.ts`, `server.ts`, `socket.ts`, `auth.ts`, `auth.controller.ts` |
| **Frontend & UI Lead** | Field Intelligence workspace, role-based routing, dynamic sidebar portals, API integration, responsive styling | `AIDecisionPanel.tsx`, `ProtectedRoute.tsx`, `Sidebar.tsx`, `YieldPrediction.tsx`, `useIoT.ts` |
| **Data/IoT & QA Lead** | Telemetry schema, persistence, ESP32 firmware headers, automated test runner, 22 test specifications | `IoTReading.ts`, `FieldRecommendation.ts`, `iot.controller.ts`, `esp32_soil_sensor.ino`, `src/tests/*` |

---

## 4. Transparent Disclosures & Hackathon Integrity

1. **No Fabricated Machine Learning:** The linear formula in `predict_yield.py` was evaluated honestly in `docs/ML_PIPELINE_AUDIT.md`. Rather than fabricating a fake 99% accuracy model without training data, the team built a deterministic agronomic decision engine grounded in FAO-56 standards.
2. **Hardware vs Simulator:** Physical ESP32 actuators were tested in simulation mode. Telemetry records generated without physical hardware are explicitly labeled with `isSimulated: true` and `source: "iot_simulator"`.
3. **Audit Before Modifying:** All changes followed a strict staged workflow, backed by automated regression tests and zero breaking database migrations.
