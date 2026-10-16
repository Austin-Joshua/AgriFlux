# AgriFlux Platform Owner Manual Verification & Handoff Guide

**Target Event:** QUANTEX '26 (18–19 October 2026)  
**Baseline Branch:** `pre-hackathon-stabilization`  
**Current Baseline Commit:** `59e9f700`  
**Status:** **READY FOR OWNER TESTING**  

---

## 1. Quick Start Commands

To start the complete platform locally:

```powershell
# In the repository root directory:
npm run dev
```

*This single command starts:*
- **Backend API & Socket.IO:** `http://localhost:5001`
- **Frontend Vite Client:** `http://localhost:3000`

Verify that both services have initialized:
1. Open your browser and navigate to `http://localhost:3000` (loads AgriFlux Frontend).
2. Open a separate tab to `http://localhost:5001/health` (should return `{"status":"healthy","worker":...,"timestamp":...}`).

---

## 2. Safe Local Test Accounts

AgriFlux includes pre-configured, safe demo accounts with verified roles. On the login screen (`http://localhost:3000/login`), click any of the **Quick Demo Access** buttons:

| Demo Profile | Role Assigned | Landing Page | Key Features to Test |
|---|---|---|---|
| **Demo Farmer** | `farmer` | `http://localhost:3000/dashboard` | Field Intelligence Engine, IoT telemetry cards, pump switch, consultation wizard, yield prediction. |
| **Demo Agronomist** | `agronomist` | `http://localhost:3000/agronomist` | Farmer consultation request queue, appointment status updates, diagnosis tools. |
| **Demo Admin** | `admin` | `http://localhost:3000/admin` | System health console, active WebSocket connections, system broadcast alerts. |

*Alternatively, register a new account on `http://localhost:3000/register` and select your desired role from the dropdown.*

---

## 3. Recommended Order of Manual Verification

To conduct an efficient, comprehensive validation of the stabilized baseline, follow this prioritized testing sequence:

```
Step 1: Authentication & Token Lifecycle
   └─> Test login with Demo Farmer -> Verify token in localStorage -> Test Logout -> Test wrong password
       
Step 2: Role-Based Authorization
   └─> Log in as Farmer -> Attempt direct navigation to /agronomist -> Verify redirect to /dashboard
   └─> Log in as Agronomist -> Verify /agronomist loads without 403 error
   └─> Log in as Admin -> Verify /admin console loads
       
Step 3: AgriFlux Field Intelligence Engine (Closed-Loop Workflow)
   └─> Open /dashboard -> Inspect active recommendation for 'North Acre Parcel A'
   └─> Verify FAO-56 decision rule citation in the expandable panel
   └─> Click 'Irrigate Now (Recorded)' -> Verify persistence toast and audit record
   └─> Enter '54' in post-irrigation moisture -> Click 'Evaluate Follow-up'
   └─> Verify condition met badge (+30% recovery) and agronomic diagnosis
       
Step 4: IoT Telemetry & Actuator Controls
   └─> Open /irrigation -> Observe real-time moisture gauge updates
   └─> Toggle 'Pump Switch' -> Verify state changes to ON with toast
   └─> Verify provenance tag displays 'source: iot_simulator'
       
Step 5: Agronomic Prediction Services
   └─> Open /yield -> Submit NPK values -> Verify calculated yield and advice chips
   └─> Open /soil -> Set acidic pH (5.2) -> Verify Lime recommendation
   └─> Open /climate -> Verify 7-day forecast cards render without crashes
```

---

## 4. How to Inspect Logs & Network Requests

### Browser Inspection (Frontend)
1. In Google Chrome, Microsoft Edge, or Firefox, press `F12` (or right-click -> **Inspect**).
2. Go to the **Console** tab:
   - Check that no unhandled exceptions or red JavaScript errors appear during page transitions.
   - Look for `📡 [SOCKET] Connected to AgriFlux IoT Gateway` confirming real-time telemetry streaming.
3. Go to the **Network** tab:
   - Filter by `Fetch/XHR`.
   - When clicking buttons (e.g. "Predict Yield", "Irrigate Now", "Book Consultation"), inspect the request URL and verify that responses return `200 OK` with JSON payloads.

### Terminal Inspection (Backend)
In the terminal running `Backend`, observe the structured logs:
- `📡 [IoT SYNC] Synced: M:45% T:24.5°C H:62% P:false [SIMULATOR]` — periodic sensor sync.
- `📡 [SOCKET] Authorized control event from farmer (...)` — authorized actuator commands.
- `⚠️ [SECURITY WARNING]` — any missing optional environment variables (normal in development).

---

## 5. Check-Off Matrix

Use [docs/PRE_HACKATHON_MANUAL_TEST_CHECKLIST.md](file:///c:/Users/austi/OneDrive/Desktop/AgriFlux/AgriFlux/docs/PRE_HACKATHON_MANUAL_TEST_CHECKLIST.md) to record your findings for all 25 routes.

Once you have verified that the core journeys pass without regressions, the platform is **officially ready for the start of QUANTEX '26 on October 18, 2026, at 10:00 AM IST**.
