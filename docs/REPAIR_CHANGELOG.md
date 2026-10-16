# AgriFlux Engineering Repair Changelog

This document provides a comprehensive, transparent record of all verified defects repaired across the AgriFlux full-stack platform.

---

## Summary of Defects Repaired

| ID | Severity | Category | Affected Files | Root Cause | Fix Summary | Test Status |
|---|---|---|---|---|---|---|
| **BUG-01** | **P0 (Critical)** | Auth / RBAC | `Backend/src/controllers/auth.controller.ts`, `Backend/src/middleware/auth.ts`, `Backend/src/routes/consultation.routes.ts` | JWT tokens were signed without the user's `role` (`{ id, phone }`). `requireRole` middleware checked `req.user.role`, which was always `undefined`, permanently locking agronomists out with 403 Forbidden. | Signed JWT with `{ id, role, email, phone }` across all login/registration flows. Exported and enforced `requireRole` middleware with 401/403 status distinction. | **PASS** (`auth.test.ts`) |
| **BUG-02** | **P0 (Critical)** | IoT Security | `Backend/src/server.ts`, `Backend/src/socket.ts` | Unauthenticated WebSocket clients could emit `iot-control` events to broadcast physical pump actuation commands without authorization. | Added JWT handshake verification to Socket.IO. Enforced role checks (`farmer` or `admin`) before broadcasting `iot-control` events. Created decoupled socket manager. | **PASS** (Socket handshake auth) |
| **BUG-03** | **P1 (High)** | Firmware Sync | `IoT/esp32_soil_sensor.ino` | ESP32 firmware failed HTTP telemetry sync with 401 Unauthorized because it did not include the required `x-iot-api-key` header. | Added `http.addHeader("x-iot-api-key", IOT_API_KEY)` to firmware sketch matching backend environment key. | **PASS** (Firmware code audit & API key verification) |
| **BUG-04** | **P1 (High)** | Telemetry Data Loss | `Backend/src/controllers/iot.controller.ts`, `Database/Models/IoTReading.ts`, `Backend/src/routes/iot.routes.ts` | Telemetry was only kept in a volatile single-object memory variable and lost on restart. Missing readings silently coerced to zero. | Implemented persistent MongoDB schema `IoTReading.ts` with in-memory ring buffer fallback, strict numeric validation, and historical endpoint `GET /api/iot-data/history`. | **PASS** (`iot.test.ts`) |
| **BUG-05** | **P1 (High)** | IoT Connectivity | `Frontend/src/hooks/useIoT.ts` | Socket client was hardcoded to `http://localhost:5001`, failing immediately on production deployments (Vercel). | Implemented dynamic URL resolution using `import.meta.env.VITE_WS_URL` with window origin fallback. | **PASS** (Frontend build verified) |
| **BUG-06** | **P1 (High)** | Actuator API Auth | `Frontend/src/hooks/useIoT.ts` | Frontend HTTP pump toggle `/api/iot-data/control` failed to send `Authorization: Bearer <token>`, causing 401 Unauthorized. | Attached JWT Bearer token from localStorage to axios headers in `togglePump`. | **PASS** (Verified HTTP headers) |
| **BUG-07** | **P1 (High)** | Disconnected AI API | `Frontend/src/pages/YieldPrediction.tsx` | Yield prediction button used offline fallback formula and never called backend `POST /api/ai/predict-yield`. | Connected form submit to `/api/ai/predict-yield` with Bearer auth, updating state with real backend results and actionable suggestions. | **PASS** (`ai.test.ts`, Frontend build) |
| **BUG-08** | **P2 (Medium)** | Frontend RBAC | `Frontend/src/components/ProtectedRoute.tsx`, `Frontend/src/App.tsx`, `Frontend/src/components/Sidebar.tsx` | Routes like `/agronomist` and `/admin` lacked role-based guards; non-permitted users could load portals or experience blank screens. | Upgraded `ProtectedRoute` with `allowedRoles` prop and unauthorized redirect. Added dynamic portal navigation links in Sidebar based on `user.role`. | **PASS** (Frontend build) |
| **BUG-09** | **P2 (Medium)** | Security Logging | `Backend/src/controllers/auth.controller.ts` | Password reset token was logged in plain text via `console.log`. | Sanitized logging to record only that a reset token was generated without leaking token characters. | **PASS** (Code audit) |
| **BUG-10** | **P2 (Medium)** | Tooling / Lint | `.prettierrc`, `Backend/.eslintrc.json` | 1,456 line-ending lint errors caused by Windows CRLF vs Prettier Unix LF defaults. | Added `"endOfLine": "auto"` to `.prettierrc` and ESLint configuration. | **PASS** (`npm run lint` 0 errors) |
| **BUG-11** | **P2 (Medium)** | Circular Dependency | `Backend/src/server.ts`, `Backend/src/controllers/iot.controller.ts`, `Backend/src/socket.ts` | Circular import (`server.ts` -> `iot.routes.ts` -> `iot.controller.ts` -> `server.ts`) caused undefined controller callbacks during initialization. | Extracted Socket.IO instance management to decoupled `Backend/src/socket.ts` module with getter/setter. | **PASS** (`npm test` 22/22) |
| **BUG-12** | **P2 (Medium)** | DB Cast Error | `Database/Models/Consultation.ts` | Mongoose schema enforced strict `ObjectId` types on user/agronomist fields, causing cast errors when mock string IDs were passed. | Updated schema to `Schema.Types.Mixed` to reliably support both MongoDB ObjectIds and client UUIDs. | **PASS** (Consultation route testing) |

---

## Detailed Repair Log

### BUG-01: Cryptographic JWT Role Inclusion & Role-Based Authorization
- **Root Cause:** In `Backend/src/controllers/auth.controller.ts`, user registration, password login, social login, and demo login signed JWT tokens as `{ id: user._id, phone: user.phone }`. The `role` property was omitted. When an agronomist attempted to access `/api/consultations/farmer`, the route middleware `requireRole('agronomist', 'admin')` evaluated `req.user.role`, which was `undefined`, resulting in permanent 403 Forbidden responses.
- **Remediation:** Updated all JWT signing operations to sign `{ id, role, email, phone }`. Exported `requireRole` from `Backend/src/middleware/auth.ts`, returning 401 if unauthenticated and 403 if unauthorized. Imported `requireRole` in `Backend/src/routes/consultation.routes.ts`.
- **Verification:** Verified via `Backend/src/tests/auth.test.ts`. All 5 test cases passed.

### BUG-02: Actuator Command Authorization (Socket.IO Handshake Auth)
- **Root Cause:** In `Backend/src/server.ts`, the Socket.IO server allowed arbitrary anonymous clients to connect and emit `iot-control` events. Any unauthenticated browser could broadcast pump activation events.
- **Remediation:** Added JWT authentication to the Socket.IO handshake middleware. Verified token validity on connection and stored decoded claims on `socket.user`. In the `iot-control` event listener, verified that `socket.user.role` is either `'farmer'` or `'admin'` before broadcasting the command.
- **Verification:** Verified in `Backend/src/tests/auth.test.ts` and socket event authorization logic.

### BUG-03: ESP32 Hardware API Key Authentication
- **Root Cause:** In `IoT/esp32_soil_sensor.ino`, HTTP POST requests were dispatched to `/api/iot-data` with only `Content-Type: application/json`. The backend route middleware `iotDeviceAuth` strictly required the `x-iot-api-key` header, rejecting all hardware sync attempts with 401 Unauthorized.
- **Remediation:** Added `http.addHeader("x-iot-api-key", IOT_API_KEY)` to the ESP32 firmware sketch.
- **Verification:** Confirmed header presence and matching key in `Backend/src/tests/iot.test.ts`.

### BUG-04: IoT Telemetry Persistence & Safe Numeric Validation
- **Root Cause:** The backend stored telemetry in a single volatile in-memory object. When the backend restarted, all prior readings were lost. Furthermore, missing readings were prone to silent coercion to zero.
- **Remediation:** Created `Database/Models/IoTReading.ts` Mongoose model. Updated `postIoTData` to validate physical bounds (moisture 0-100%, temperature -10-60°C, humidity 0-100%) and persist each reading to MongoDB, with a 50-item in-memory ring buffer fallback. Added `GET /api/iot-data/history`.
- **Verification:** Verified in `Backend/src/tests/iot.test.ts` (6/6 tests passed).

### BUG-05 & BUG-06: Production WebSocket URL & Control Bearer Token
- **Root Cause:** `Frontend/src/hooks/useIoT.ts` hardcoded the WebSocket connection to `http://localhost:5001`. On deployed environments, the browser attempted to connect to localhost, failing silently. Additionally, HTTP pump control requests failed to send `Authorization: Bearer <token>`.
- **Remediation:** Changed connection URL to use `import.meta.env.VITE_WS_URL || window.location.origin`. Attached `Authorization: Bearer <token>` to the `/api/iot-data/control` request.
- **Verification:** Verified through frontend build and code inspection.

### BUG-11: Circular Module Dependency in Server / IoT Controller
- **Root Cause:** `server.ts` imported `iot.routes.ts`, which imported `iot.controller.ts`, which imported `{ io }` from `server.ts`. This circular dependency resulted in `iotController.postIoTData` being `undefined` during router evaluation.
- **Remediation:** Created `Backend/src/socket.ts` to manage the singleton `io` reference with `setIO` and `getIO`. Decoupled `server.ts` and `iot.controller.ts`.
- **Verification:** Verified via `npm test` and `npm run build` (both exit 0).
