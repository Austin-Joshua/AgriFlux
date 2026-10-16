# 🔒 AgriFlux Application Security Audit

**Standard:** OWASP Top 10 (Web Applications & API Security)  
**Date:** October 16, 2026  
**Status:** Audit & Remediation In-Progress  

---

## 1. Authentication & Authorization Assessment

### 1.1 Broken Object Level Authorization & Role Separation (OWASP API1 / A01:2021)
* **Finding:** The role-based access control middleware `requireRole` in `Backend/src/routes/consultation.routes.ts` failed due to missing `role` claims in the JWT payload. The token signing method in `Backend/src/controllers/auth.controller.ts` signed `{ id, phone }` without `role`.
* **Impact:** High. Agronomists and Admins could not execute authorized duties (viewing all bookings, approving/rejecting consultations). Concurrently, client routes were not guarded by role, enabling farmers to navigate to `/admin` and `/agronomist` dashboard routes without authorization checks.
* **Remediation:** 
  1. Updated JWT signing in `register`, `login`, and `socialLogin` to cryptographically sign `{ id, role, email, phone }`.
  2. Updated `auth.ts` middleware to ensure `req.user.role` is populated and validated.
  3. Upgraded `ProtectedRoute.tsx` to accept an `allowedRoles` array with automatic unauthorized redirection.

### 1.2 Socket.IO Unauthenticated Actuation (OWASP API2 / API5)
* **Finding:** Socket.IO server in `Backend/src/server.ts` allowed unauthenticated connections to emit the `iot-control` event. Any connected WebSocket client could send `{ pumpStatus: true/false }`, which was broadcast to hardware relays without token verification.
* **Impact:** Critical (P0). Unauthorized actuator control on physical or simulated farming hardware.
* **Remediation:** 
  1. Added Socket.IO handshake authentication middleware verifying JWT Bearer token before establishing a connection.
  2. Enforced role checks on `iot-control` event dispatching, restricting pump control to authorized farmers or admins.

### 1.3 Secret Logging in Password Recovery (OWASP A09:2021)
* **Finding:** `Backend/src/controllers/auth.controller.ts` printed cleartext reset tokens and complete reset URLs to `console.log`:
  ```ts
  console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`);
  console.log(`[PASSWORD RESET] Link: http://localhost:3000/reset-password?token=${resetToken}...`);
  ```
* **Impact:** Medium. Any log aggregator or developer environment exposed active reset tokens.
* **Remediation:** Removed the token from logs; tokens are hashed using SHA-256 before storage or validation.

---

## 2. API & Data Security

### 2.1 Missing Rate Limiting on Key Endpoints
* **Finding:** While `/api/` had a broad limiter (500 req / 10 min) and `/api/auth/login` had a 5-attempt limiter, the `/api/iot-data` ingestion endpoint lacked dedicated throttling, allowing volumetric telemetry flooding.
* **Remediation:** Configured specific rate limits for hardware telemetry ingestion (max 60 syncs/minute per device).

### 2.2 Insecure Telemetry Coercion & Silent Zero Fallbacks
* **Finding:** `iot.controller.ts` coerced `Number(moisture) || 0`. If a sensor had a communication timeout or returned `null`, it silently registered as `0%` moisture. This could trigger false irrigation alarms.
* **Remediation:** Implemented strict schema validation rejecting `null`/`undefined` sensor values and recording explicit sensor failure states instead of coercing to 0.

### 2.3 CORS & Origin Policy
* **Current State:** 
  Allowed origins include `env.FRONTEND_URL`, `https://agriflux.vercel.app`, `https://agri-flux-sandy.vercel.app`, and `*.vercel.app` previews.
* **Residual Risk:** Permitting all `*.vercel.app` domains in production is overly broad. In production, this should be restricted to configured project domains.

---

## 3. Dependency Vulnerability Analysis

A baseline `npm audit` revealed:
* **Frontend:** 33 vulnerabilities (1 low, 10 moderate, 20 high, 2 critical) primarily in transitive dependencies of build tools (`vite` / `rollup` plugins).
* **Backend:** 39 vulnerabilities in sub-dependencies.
* **Remediation Plan:** Conservative patching of non-breaking dependencies without altering core framework versions or breaking existing production builds.

---

## 4. Hardware & Actuator Safety Rules

1. Actuators (pumps, valves, misting systems) must **never** be triggered automatically by automated integration tests.
2. In demo/hackathon environments without physical hardware, the system must clearly indicate simulated device status.
3. Every pump command must enforce an automatic safety timeout (maximum continuous runtime of 15 minutes) to prevent motor burn-out or crop flooding.
