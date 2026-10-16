# AgriFlux Pre-Hackathon Known Limitations & Operational Disclosures

**Target Event:** QUANTEX '26 Hackathon  
**Baseline Date:** 16 October 2026  
**Document Purpose:** Complete, transparent disclosure of all mocked data, external service fallbacks, hardware constraints, and machine learning limitations.  

---

## 1. Simulated vs. Production Data Boundaries

| Feature Module | Current Data Source | Nature of Data | Production Requirement | What Must NOT Be Claimed |
|---|---|---|---|---|
| **IoT Sensor Telemetry** | In-memory ring buffer & `IoTReading` MongoDB records | **Simulated & Calibrated** (`source: "iot_simulator"`) | Physical ESP32 nodes connected over WiFi | Do NOT claim real physical capacitive soil probes are transmitting from agricultural fields during the demo. |
| **Actuator Pump Control** | Software state broadcast over Socket.IO / HTTP | **Simulated Event** (`pumpStatus: true/false`) | Bidirectional relay with current sensor feedback | Do NOT claim physical water is flowing into a farm field. |
| **Satellite GIS Imagery** | Sample Copernicus Sentinel-2 Level-2A reflectance bands | **Static / Illustrative Spectral Samples** | Live ESA Copernicus API subscription & cloud masking | Do NOT claim live daily satellite tasking or sub-meter commercial radar imaging. |
| **Mandi Market Prices** | Calibrated regional price trends | **Static / Derived Fallback** | Live e-NAM / AGMARKNET scraping API | Do NOT present prices as live real-time auction bids without external API credentials. |
| **Marketplace & Rentals** | Mock product & equipment listings | **Demo / Seeded Catalog** | Payment gateway (Stripe/Razorpay) & logistics | Do NOT claim financial transactions or delivery fulfillment are operating live. |
| **Plant Disease Diagnosis** | Heuristic rules & sample leaf photos | **Demo Diagnostic Engine** | Edge-deployed MobileNet/YOLO inference service | Do NOT claim a 99% accuracy deep neural network is diagnosing novel pathogens in real time. |

---

## 2. Machine Learning & Predictive Modeling Realities

### Yield Prediction Engine (`POST /api/ai/predict-yield`)
- **Current Architecture:** Implemented in [Backend/src/services/ai.service.ts](file:///c:/Users/austi/OneDrive/Desktop/AgriFlux/AgriFlux/Backend/src/services/ai.service.ts). It uses empirical agronomic impact functions based on IRRI and FAO soil pH curves ($18\%$ yield penalty when $\text{pH} < 5.5$ or $> 7.8$) and NPK satisfaction indices ($\text{Optimal: } N=80, P=45, K=60$).
- **Standalone Python Script (`predict_yield.py`):** The root repository script is an unweighted linear regression template without hyperparameter optimization or an empirical training dataset.
- **Operational Reality:** This is a deterministic agronomic calculation engine, **not** a trained machine learning model.
- **What is Needed for ML Production:**
  1. A multi-season crop yield dataset across regional agro-climatic zones.
  2. Leakage-safe GroupKFold cross-validation (grouping by farm/district) as outlined in [docs/ML_PIPELINE_AUDIT.md](file:///c:/Users/austi/OneDrive/Desktop/AgriFlux/AgriFlux/docs/ML_PIPELINE_AUDIT.md).
  3. Preprocessing pipelines fitted strictly on training partitions.

---

## 3. IoT Firmware & Hardware Boundaries

- **ESP32 Firmware Sketch:** [IoT/esp32_soil_sensor.ino](file:///c:/Users/austi/OneDrive/Desktop/AgriFlux/AgriFlux/IoT/esp32_soil_sensor.ino) has been audited and updated with the `x-iot-api-key` header matching the backend security middleware.
- **Hardware Bench Testing:** The firmware compiles against standard ESP32 Arduino cores. However, physical testing with an actual ESP32 development board, capacitive soil moisture sensor v1.2, and 5V relay module in real soil was **not** conducted during this pre-hackathon stabilization.
- **Acknowledgement Limitation:** When a farmer clicks "Toggle Pump" on the dashboard, the backend broadcasts the command to Socket.IO. Without physical hardware confirmation, the UI displays the *commanded software state*, not a verified physical relay contact closure.

---

## 4. External Service Credentials & Fallback Behavior

| External Integration | Required Environment Variables | Behavior When Unset | Safe Local Behavior |
|---|---|---|---|
| **MongoDB Database** | `MONGODB_URI` | Reverts to 50-item in-memory ring buffer for IoT telemetry and in-memory cache for field recommendations. | Fully operational for local testing without local MongoDB service. |
| **OpenWeatherMap** | `OPENWEATHER_API_KEY` | Reverts to localized seasonal weather parameters (28°C ambient, 60% humidity, 0mm rainfall). | Weather cards render cleanly without network crashes. |
| **Firebase Admin Auth** | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Reverts to built-in email/password JWT authentication and pre-configured demo profiles (`farmer_demo`, `agronomist_demo`, `admin_demo`). | Instant local login with one-click demo buttons. |
| **Twilio SMS Gateway** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Phone OTP defaults to verification bypass code `123456` in development mode. | Allows testing phone login without consuming SMS credits. |

---

## 5. Deployment Readiness Limitations

1. **Vercel Frontend Deployment:**
   - The frontend builds cleanly into `dist/` in 12.61s.
   - For the deployed URL (`https://agri-flux-sandy.vercel.app`) to communicate with the backend, `VITE_API_URL` must point to a live backend deployment (e.g. `https://agriflux-backend.onrender.com/api`).
2. **Backend Hosting Environment:**
   - When deploying to production (Render, Railway, or AWS), `NODE_ENV=production` requires explicit configuration of `MONGODB_URI` and `JWT_SECRET` in the hosting dashboard. The backend will deliberately refuse to start in production without these secrets to prevent insecure defaults.
