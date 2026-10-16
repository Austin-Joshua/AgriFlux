# AgriFlux: Known Limitations, Assumptions & Operational Boundaries

In strict adherence to engineering integrity and Section 2 & 16 of the audit protocol, this document explicitly records all known limitations, operational assumptions, and external dependencies of the AgriFlux platform.

---

## 1. Machine Learning & Predictive Workflows

1. **Yield Prediction Formula vs Trained Neural Networks:**
   - **Current State:** The yield prediction capability in `Backend/src/services/ai.service.ts` uses calibrated empirical formulas incorporating FAO soil pH impact curves and NPK satisfaction indices.
   - **Standalone Script:** The script `predict_yield.py` in the repository root is an unweighted linear regression template without hyperparameter tuning or a validated training dataset.
   - **Operational Guidance:** Do **not** represent the current yield prediction feature as a neural network or deep-learning model trained on real-world multi-year field trials. Before claiming production ML accuracy, a leakage-safe pipeline (as specified in `docs/ML_PIPELINE_AUDIT.md`) must be trained on authentic regional harvest datasets using GroupKFold cross-validation.

2. **Crop Disease & Computer Vision:**
   - **Current State:** The plant disease detection features utilize heuristic classification and mock confidence scores when external vision model endpoints are unreachable.
   - **Operational Guidance:** When demonstrating to farmers or hackathon judges, state clearly that vision diagnosis is an interface demonstration until integrated with an active edge-deployed MobileNet/YOLO inference service.

---

## 2. IoT Telemetry & Actuator Hardware

1. **Hardware Verification Scope:**
   - **Firmware Status:** The ESP32 firmware sketch (`IoT/esp32_soil_sensor.ino`) has been verified for syntax, JSON payload schema, WiFi reconnection logic, and `x-iot-api-key` header inclusion.
   - **Physical Hardware:** Testing was executed against the **AgriFlux Calibrated IoT Simulator** and HTTP ingestion endpoints. Physical microcontroller hardware connected to capacitive soil probes in real soil was **not** physically deployed during this audit cycle.
   - **Telemetry Labeling:** All simulator-generated records in the database and UI are explicitly tagged with `isSimulated: true` and `source: "iot_simulator"`.

2. **Actuator Control Safety & Boundaries:**
   - **Human-in-the-Loop:** AgriFlux does **not** allow autonomous, automated activation of physical irrigation pumps. Recommendations provide guidance; pump commands require explicit authenticated farmer authorization.
   - **Acknowledgement Limitation:** Toggling the pump switch in the UI confirms backend event broadcast to Socket.IO. In the absence of bidirectional physical relay telemetry, the UI reflects the commanded software state rather than confirmed physical water flow.

---

## 3. External Services & Environment Dependencies

1. **MongoDB Database:**
   - **Operational Behavior:** The backend includes a robust in-memory fallback. If a local or cloud MongoDB instance is unavailable (`MONGODB_URI` not connected), the system seamlessly buffers the latest 50 IoT telemetry records and Field Intelligence recommendations in memory without crashing.
   - **Production Requirement:** For multi-month telemetry retention and historical trend analysis, a persistent MongoDB cluster (Atlas or self-hosted) must be provisioned.

2. **Weather API Credentials:**
   - **Current State:** In the absence of an active `OPENWEATHER_API_KEY`, the weather integration falls back to localized seasonal defaults (28°C ambient temp, 60% humidity, 0mm rainfall).
   - **Operational Guidance:** For live hyper-local micro-climate forecasts, a valid API key must be supplied in `.env`.

3. **Firebase Authentication & SMS OTP:**
   - **Current State:** When Firebase Admin credentials are unconfigured, social login and phone OTP features default to authenticated demo profiles (`farmer_demo`, `agronomist_demo`, `admin_demo`).
   - **Operational Guidance:** Standard email/password registration with bcrypt hashing and JWT tokens functions fully without external dependencies.
