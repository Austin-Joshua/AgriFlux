# AgriFlux Pre-Hackathon Manual Verification Checklist

**Purpose:** Comprehensive local test matrix for the platform owner to execute in local development prior to the QUANTEX '26 hackathon.  
**Local Test URL:** `http://localhost:3000`  
**Backend API URL:** `http://localhost:5001`  

---

## 1. Authentication & Role Portal Access Matrix

| # | Route / Flow | Target Role | Prerequisites | Critical Actions & Expected Results | Negative Test / Security Check | Status (PASS/FAIL/BLOCKED) | Notes & Observations |
|---|---|---|---|---|---|---|---|
| **A1** | `/login` | Public / Guest | None | Enter email/phone + password. Click "Sign In". Verify redirection to role portal (`/dashboard` for farmer, `/agronomist` for agronomist, `/admin` for admin). | Enter incorrect password. Verify "Invalid credentials" error banner appears without crash. | `[  ]` | |
| **A2** | `/register` | Public / Guest | None | Select role (`Farmer`, `Agronomist`, `Researcher`). Submit valid registration. Verify auto-login and redirection. | Submit form with empty required fields. Verify client validation prevents submission. | `[  ]` | |
| **A3** | Demo Accounts | All Roles | None | Click quick demo buttons ("Demo Farmer", "Demo Agronomist", "Demo Admin"). Verify instant authentication with correct role privileges. | Verify demo tokens contain cryptographic role claims. | `[  ]` | |
| **A4** | `/forgot-password` | Public / Guest | None | Enter registered email. Click "Send Reset Link". Verify success toast notification. | Verify reset token does NOT leak into browser console or backend logs. | `[  ]` | |
| **A5** | Logout Flow | Authenticated | Any active session | Click user profile -> "Logout" in sidebar/navbar. Verify token cleared from `localStorage` and redirect to `/login`. | Press browser "Back" button after logout. Verify protected page cannot be loaded without re-authenticating. | `[  ]` | |

---

## 2. Core Farmer Modules & Workspaces

| # | Route | Target Role | Key Components | Critical Actions & Expected Results | Negative Tests & Edge Cases | Status (PASS/FAIL/BLOCKED) | Notes & Observations |
|---|---|---|---|---|---|---|---|
| **F1** | `/dashboard` | Farmer | Dashboard Cards, Field Map, AIDecisionPanel | 1. Page renders without console errors.<br>2. Field Intelligence workspace loads active recommendation.<br>3. IoT status card displays live/simulator telemetry.<br>4. Soil and yield summary cards display loaded values. | Disconnect internet briefly. Verify page falls back to cached/in-memory state gracefully. | `[  ]` | |
| **F2** | `/yield` | Farmer | YieldPrediction Form & Chart | 1. Enter Nitrogen (80), Phosphorus (40), Potassium (50), Rainfall (800).<br>2. Click "Predict Yield".<br>3. Verify backend `POST /api/ai/predict-yield` is called.<br>4. Result card displays kg/ha prediction and agronomic advice chips. | Enter negative or non-numeric values. Verify form sanitizes or displays validation error. | `[  ]` | |
| **F3** | `/irrigation` | Farmer | IrrigationIntelligence, Soil moisture gauge, Pump switch | 1. Observe real-time moisture gauge.<br>2. Toggle "Pump Switch".<br>3. Verify status changes to 'ON' with toast notification.<br>4. Verify Socket.IO or HTTP fallback sends command. | Attempt to toggle pump with expired token. Verify command is rejected with 401. | `[  ]` | |
| **F4** | `/soil` / `/soil-advisor` | Farmer | SoilAdvisor, NPK nutrient bars | 1. Adjust soil pH slider to 5.2 (acidic).<br>2. Click "Analyze Soil".<br>3. Verify Agricultural Lime recommendation appears. | Adjust pH to 8.2 (alkaline). Verify Elemental Sulfur advice appears. | `[  ]` | |
| **F5** | `/crop-health` | Farmer | CropHealthMonitoring, Disease scanner | 1. Select sample crop disease photo or run scan.<br>2. Verify diagnostic card displays symptoms and management options.<br>3. Verify demo/simulated tag is visible if offline. | Upload invalid file type (.txt). Verify file validation rejects upload. | `[  ]` | |
| **F6** | `/climate` | Farmer | ClimateRisk, Weather alerts | 1. Review 7-day temperature & precipitation forecast.<br>2. Verify heatwave and storm risk indicators. | Check behavior when weather API key is missing. Verify fallback default data renders. | `[  ]` | |
| **F7** | `/simulator` | Farmer / Researcher | ClimateSimulator, Slider controls | 1. Adjust temperature (+3°C) and drought sliders.<br>2. Click "Run Simulation".<br>3. Verify simulated yield impact chart updates. | Set extreme variables (+10°C, 0mm rain). Verify model handles boundary conditions. | `[  ]` | |
| **F8** | `/crop-switching` | Farmer | CropSwitchingAdvisor | 1. Select current crop and regional soil type.<br>2. View higher-profit alternative crops (e.g. Millet, Sorghum).<br>3. Verify profitability and water savings comparison. | Test with low water availability setting. | `[  ]` | |
| **F9** | `/sustainability` | Farmer | SustainabilityScore | 1. View carbon footprint and water conservation grade (e.g., 'A- / 84').<br>2. Verify breakdown of soil organic matter and biodiversity. | Review score calculation transparently. | `[  ]` | |
| **F10** | `/land-intelligence` | Farmer | LandIntelligence, Satellite GIS Map | 1. View NDVI/EVI vegetation heatmaps.<br>2. Verify field boundary polygons and acreage calculation ($1\text{ ha} \approx 2.47\text{ acres}$). | Click polygon corners. Verify coordinate readout. | `[  ]` | |
| **F11** | `/book-consultation` | Farmer | BookConsultation Wizard | 1. Select specialty (Soil Health, Irrigation).<br>2. Choose date/time slot.<br>3. Submit booking request.<br>4. Verify confirmation toast and booking appears under `/dashboard`. | Submit booking without choosing time slot. Verify wizard blocks advance. | `[  ]` | |
| **F12** | `/marketplace` | Farmer / Buyer | Marketplace Product Grid | 1. Filter by category (Seeds, Organic Fertilizers, Tools).<br>2. Search for "Compost".<br>3. Verify item details modal opens with honest pricing. | Note: Payment gateway is an interface demonstration. | `[  ]` | |
| **F13** | `/equipment-rental` | Farmer | EquipmentRental Grid | 1. Inspect tractor and harvester rental listings.<br>2. Click "Rent Machine". Verify rental booking dialog appears. | Check daily rate calculations. | `[  ]` | |
| **F14** | `/subsidies` | Farmer | GovernmentSubsidies Directory | 1. Filter schemes by state or central category (PM-KISAN, Drip Irrigation Subsidy).<br>2. Click "Apply / Check Eligibility". Verify requirements list. | Test search bar with "Solar". | `[  ]` | |
| **F15** | `/market` | Farmer | MarketAnalysis Price Trends | 1. Inspect regional Mandi commodity price charts.<br>2. Filter by crop (Wheat, Rice, Tomato). Verify trend lines. | Verify source attribution (Simulated / AGMARKNET fallback). | `[  ]` | |
| **F16** | `/investors` | Farmer / Investor | InvestorsHub Impact Metrics | 1. Review farm sustainability investment metrics and ROI calculator. | Verify metrics are clearly labeled as projections. | `[  ]` | |
| **F17** | `/settings` | Authenticated | Settings Form | 1. Switch language (English, Tamil, Hindi, Telugu, Malayalam).<br>2. Toggle Dark/Light mode.<br>3. Update notification preferences. | Refresh page after theme change. Verify theme persists. | `[  ]` | |
| **F18** | `/about` | Authenticated | About Page | 1. Inspect project mission, technical stack overview, and Copernicus attribution. | Verify external links open safely in new tabs (`noopener`). | `[  ]` | |

---

## 3. AgriFlux Field Intelligence Engine (Flagship Pre-Hackathon Feature)

**Component Location:** Top of `/dashboard` ([Frontend/src/components/AIDecisionPanel.tsx](file:///c:/Users/austi/OneDrive/Desktop/AgriFlux/AgriFlux/Frontend/src/components/AIDecisionPanel.tsx))

| Test Step | Action Description | Expected Result | Verified Result | Status |
|---|---|---|---|---|
| **IE-1** | **Field Context Selection:** Select "North Acre Parcel A (Rice, Tillering)" | Workspace loads baseline recommendation. Telemetry badges display moisture (24%), temperature (26°C), and source (`iot_simulator`). | Baseline loaded; telemetry provenance badge visible. | `[  ]` |
| **IE-2** | **FAO-56 Rule Citation:** Expand "Agronomic Decision Logic" panel | Displays: *"Triggered by soil moisture (24%) falling below FAO-56 Management Allowed Depletion (MAD 50% / threshold 28%)."* | Rule citations match peer-reviewed standard. | `[  ]` |
| **IE-3** | **Urgency & Alternatives:** Verify recommendation severity | Urgency displayed as `CRITICAL / HIGH`. Alternative actions list "Postpone 6 hours until evening" with trade-offs. | Urgency chip color-coded; alternatives rendered. | `[  ]` |
| **IE-4** | **Record Farmer Action:** Click "Irrigate Now (Recorded)" | Action is submitted to `POST /api/field-intelligence/action`. Success toast confirms persistence. Farmer action audit badge appears. | Action persisted in DB; button state updates. | `[  ]` |
| **IE-5** | **Closed-Loop Evaluation (Success):** Enter post-irrigation moisture `54%` in the follow-up box and click "Evaluate Follow-up" | Backend computes $+30\%$ moisture recovery. Status badge updates to green `CONDITION MET (IMPROVED)`. Diagnostic confirms root-zone replenishment. | Condition met; delta calculated; explanation clear. | `[  ]` |
| **IE-6** | **Closed-Loop Evaluation (Deficit):** Select "North Acre Parcel A", enter post-action reading `22%`, and click "Evaluate Follow-up" | Backend detects persistent deficit. Status badge displays amber `ALERT: CONDITION NOT MET`. Guidance prompts inspection of pump lines. | Condition not met; diagnostic alerts farmer. | `[  ]` |

---

## 4. Role-Restricted Portals & Authorization Security

| Route | Authorized Role | Unauthorized Roles Tested | Expected Behavior | Observed Result | Status |
|---|---|---|---|---|---|
| `/agronomist` | `agronomist`, `admin` | `farmer`, unauthenticated | Farmer attempting access must be redirected to `/dashboard` or `/login`. Agronomist must load consultation queue. | Farmer redirected; agronomist loads consultation hub. | `[  ]` |
| `/admin` | `admin` | `farmer`, `agronomist`, unauthenticated | Non-admins attempting access must be redirected. Admin must see system telemetry & database status. | Non-admin redirected; admin loads control console. | `[  ]` |
| `GET /api/consultations/farmer` | `agronomist`, `admin` | `farmer` (via curl/Postman) | Request with farmer token receives HTTP 403 Forbidden. Request with agronomist token receives HTTP 200. | HTTP 403 for farmer; HTTP 200 for agronomist. | `[  ]` |
| `POST /api/iot-data/control` | `farmer`, `admin` | Anonymous | Request without Bearer token receives HTTP 401 Unauthorized. | HTTP 401 Unauthorized returned. | `[  ]` |

---

## 5. Owner Sign-Off Record

- **Tested By:** __________________________________
- **Date Tested:** __________________________________
- **Git Commit Tested:** `59e9f700`
- **Overall Result:** `[  ] ACCEPTED AS PRE-HACKATHON BASELINE` / `[  ] ISSUES FOUND (SEE NOTES)`
