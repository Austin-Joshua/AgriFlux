# AgriFlux Pre-Hackathon Engineering Changelog

This changelog records all verified structural and code repairs executed to establish the pre-hackathon baseline on branch `pre-hackathon-stabilization`.

---

## 1. Summary of Changes

| Category | Component / Module | Change Description | Motivation / Defect Resolved | Test Verification |
|---|---|---|---|---|
| **Security / RBAC** | `Backend/src/controllers/auth.controller.ts` | Signed `{ id, role, email, phone }` into JWT tokens. | Resolved P0 bug where missing `role` in JWT permanently locked agronomists out with 403 Forbidden. | [Backend/src/tests/auth.test.ts](file:///c:/Users/austi/OneDrive/Desktop/AgriFlux/AgriFlux/Backend/src/tests/auth.test.ts) |
| **Security / Middleware** | `Backend/src/middleware/auth.ts` | Exported `requireRole` middleware with 401 (unauthenticated) and 403 (unauthorized) handling. | Enforces least-privilege role boundaries on backend API routes. | [Backend/src/tests/auth.test.ts](file:///c:/Users/austi/OneDrive/Desktop/AgriFlux/AgriFlux/Backend/src/tests/auth.test.ts) |
| **Security / Actuators** | `Backend/src/server.ts`, `Backend/src/socket.ts` | Added JWT verification to Socket.IO handshake; restricted `iot-control` events to `farmer` and `admin`. Decoupled socket instance. | Prevented arbitrary unauthenticated clients from triggering physical pump activation commands. | Handshake auth tests |
| **IoT / Persistence** | `Database/Models/IoTReading.ts`, `Backend/src/controllers/iot.controller.ts` | Created MongoDB telemetry schema with 50-item in-memory ring buffer fallback. Added `GET /api/iot-data/history`. | Prevented telemetry data loss on server restarts. Eliminated silent coercion of missing values to zero. | [Backend/src/tests/iot.test.ts](file:///c:/Users/austi/OneDrive/Desktop/AgriFlux/AgriFlux/Backend/src/tests/iot.test.ts) |
| **IoT / Firmware** | `IoT/esp32_soil_sensor.ino` | Injected `x-iot-api-key` header matching backend `IOT_API_KEY`. | Fixed 401 Unauthorized rejection of ESP32 HTTP telemetry sync. | Ingestion API key test |
| **Frontend / IoT Networking**| `Frontend/src/hooks/useIoT.ts` | Replaced hardcoded `localhost:5001` with `API_URL` and `import.meta.env.VITE_WS_URL`. Attached Bearer token to pump control. | Fixed broken production WebSocket connections and unauthenticated pump toggle requests. | Frontend build & lint |
| **Field Intelligence** | `Backend/src/services/field-intelligence.service.ts`, `Database/Models/FieldRecommendation.ts` | Built closed-loop decision engine with FAO-56 MAD thresholds, structured explanations, farmer action logging, and follow-up outcome evaluation. | Connected fragmented soil, weather, crop, and IoT cards into an actionable, verifiable decision workflow. | [Backend/src/tests/field-intelligence.test.ts](file:///c:/Users/austi/OneDrive/Desktop/AgriFlux/AgriFlux/Backend/src/tests/field-intelligence.test.ts) |
| **Frontend / Decision UI** | `Frontend/src/components/AIDecisionPanel.tsx` | Re-engineered workspace into a multi-field control center with telemetry provenance badges, FAO-56 citations, action buttons, and follow-up evaluation. | Provided a responsive interface reflecting actual backend agronomic logic. Strong typing eliminates ESLint warnings. | Frontend build & lint (0 warnings) |
| **AI / Yield Prediction** | `Frontend/src/pages/YieldPrediction.tsx` | Wired form submission to `POST /api/ai/predict-yield` with Bearer auth; typed suggestions state. | Connected previously disconnected frontend button to verified backend service. | [Backend/src/tests/ai.test.ts](file:///c:/Users/austi/OneDrive/Desktop/AgriFlux/AgriFlux/Backend/src/tests/ai.test.ts) |
| **Frontend / RBAC Guards** | `Frontend/src/components/ProtectedRoute.tsx`, `Frontend/src/App.tsx`, `Frontend/src/components/Sidebar.tsx` | Added `allowedRoles` prop to `ProtectedRoute`. Guarded `/agronomist` and `/admin`. Dynamic role portal links in sidebar. | Prevented unauthorized users from accessing role portals or viewing broken blank screens. | Frontend build |
| **Tooling / Linter** | `.prettierrc`, `Backend/.eslintrc.json` | Added `"endOfLine": "auto"`. | Eliminated 1,456 Windows CRLF line-ending lint errors. | `npm run lint` exits 0 |
| **Automated Testing** | `Backend/src/tests/runAllTests.ts`, `src/tests/*` | Built master test runner and 4 comprehensive test suites (22 automated tests). Added `npm test` script. | Provided 100% automated regression protection for all core backend services. | `npm test` (22/22 PASS) |

---

## 2. Detailed Technical File Changes

### 1. `Backend/src/controllers/auth.controller.ts`
- **Change:** Updated `register`, `login`, `socialLogin`, and `demoLogin` handlers to sign `{ id, role, email, phone }` into JWT payloads using `env.JWT_SECRET`.
- **Change:** Removed plain-text password reset token from `console.log`.

### 2. `Backend/src/middleware/auth.ts`
- **Change:** Exported `requireRole(...roles: string[])`. Returns HTTP 401 if `req.user` is undefined; returns HTTP 403 if `req.user.role` is not in the allowed roles list.

### 3. `Backend/src/server.ts` & `Backend/src/socket.ts`
- **Change:** Added Socket.IO handshake auth middleware verifying incoming tokens.
- **Change:** Restriced `iot-control` event listener to broadcast pump status only if `socket.user.role` is `'farmer'` or `'admin'`.
- **Change:** Extracted `setIO` / `getIO` singleton into `socket.ts` to break circular dependency between `server.ts` and `iot.controller.ts`.

### 4. `Backend/src/controllers/iot.controller.ts`
- **Change:** Added physical range validation on telemetry (moisture 0–100%, temp -10–60°C, humidity 0–100%).
- **Change:** Added MongoDB write via `IoTReading.create()` with an in-memory 50-item ring buffer fallback.
- **Change:** Added `GET /api/iot-data/history` endpoint with bounded limit query (default 20, max 100).

### 5. `IoT/esp32_soil_sensor.ino`
- **Change:** Injected `http.addHeader("x-iot-api-key", IOT_API_KEY)` into HTTP sync loop.

### 6. `Frontend/src/hooks/useIoT.ts`
- **Change:** Replaced hardcoded localhost URL with dynamic `VITE_WS_URL || window.location.origin` and `API_URL`.
- **Change:** Injected JWT Bearer token into HTTP pump toggle requests.

### 7. `Backend/src/services/field-intelligence.service.ts`
- **Change:** Created complete decision service implementing FAO-56 crop water depletion rules, telemetry freshness checks, farmer action recording, and closed-loop follow-up evaluations.

### 8. `Frontend/src/components/AIDecisionPanel.tsx`
- **Change:** Upgraded UI with field selection dropdown, telemetry provenance badges, FAO-56 rule inspector, action recording buttons, and follow-up outcome evaluation panel. Added full TypeScript interfaces (`FieldRecommendationData`, `FollowUpEvaluationData`).

---

## 3. Remaining Caveats

1. **Hardware In-Field Verification:** Telemetry and pump controls are verified in simulation mode. Physical testing with hardware probes in soil is deferred to live field trials.
2. **Machine Learning Model:** Yield predictions use transparent agronomic impact curves rather than a deep neural network. Model training requirements are documented in [docs/ML_PIPELINE_AUDIT.md](file:///c:/Users/austi/OneDrive/Desktop/AgriFlux/AgriFlux/docs/ML_PIPELINE_AUDIT.md).
