# AgriFlux Field Intelligence Engine: Evidence-Based, Closed-Loop Farm Decisions

## 1. Executive Summary & Problem Statement

Prior to this implementation, agricultural dashboards across AgriFlux displayed disparate sensor cards, weather forecasts, and crop tables. However, a farmer viewing a 25% soil moisture reading was left without an authoritative, evidence-backed next action, an explanation of the underlying agronomic risk, or a mechanism to verify whether their subsequent intervention actually solved the root problem.

The **AgriFlux Field Intelligence Engine** bridges this gap. It introduces an integrated, closed-loop decision architecture that:
1. **Aggregates and validates multi-source field context** (real-time ESP32/simulator telemetry, calibrated soil parameters, crop growth stages, and localized weather forecasts).
2. **Executes deterministic, peer-reviewed agronomic decision rules** based on FAO-56 (Food and Agriculture Organization Irrigation and Drainage Paper No. 56) Management Allowed Depletion (MAD) standards.
3. **Generates structured, explainable recommendations** with transparent decision rules, alternatives, trade-offs, and verifiable follow-up conditions.
4. **Records farmer actions** with an auditable timestamp and actor signature.
5. **Evaluates closed-loop outcomes** against subsequent sensor readings to verify whether the target root-zone condition was achieved or whether follow-up remediation is needed.

---

## 2. End-to-End Architectural Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Authorized Farmer
    participant UI as Field Intelligence Workspace (AIDecisionPanel)
    participant API as Backend Controller (/api/field-intelligence)
    participant Engine as FieldIntelligenceService (FAO-56 Engine)
    participant IoT as IoT Telemetry Stream (ESP32 / DB)
    participant DB as MongoDB (FieldRecommendation Model)

    Farmer->>UI: Select Field & Request Assessment
    UI->>API: POST /api/field-intelligence/recommendation (fieldId, cropType, overrides)
    API->>Engine: generateRecommendation(userId, context)
    Engine->>IoT: Fetch latest sensor telemetry & calculate freshness (minutes)
    Engine->>Engine: Evaluate FAO-56 MAD thresholds, Weather, & NPK rules
    Engine->>DB: Persist recommendation record
    Engine-->>API: Return structured decision payload
    API-->>UI: Render Recommendation, Evidence, & Follow-up Condition
    
    Farmer->>UI: Record Action (e.g., 'IRRIGATED', 20mm drip applied)
    UI->>API: POST /api/field-intelligence/action (recommendationId, actionTaken, notes)
    API->>Engine: recordFarmerAction(userId, recommendationId, action, notes)
    Engine->>DB: Update recommendation with farmerAction audit
    Engine-->>UI: Confirmation & prompt for follow-up observation
    
    Note over Farmer,IoT: Subsequent irrigation cycle completes; new sensor telemetry arrives
    Farmer->>UI: Submit Follow-up Observation (moisture: 54%, temp: 24°C)
    UI->>API: POST /api/field-intelligence/evaluate-followup (recommendationId, telemetry)
    API->>Engine: evaluateFollowUp(userId, recommendationId, telemetry)
    Engine->>Engine: Compare baseline (22%) vs observed (54%) [Delta: +32%]
    Engine->>DB: Persist follow-up evaluation outcome (conditionMet: true)
    Engine-->>UI: Display Closed-Loop Resolution Status & Agronomic Diagnosis
```

---

## 3. Agronomic Decision Rules & Domain Logic

The engine avoids opaque, unverified black-box heuristics in favor of testable, deterministic agronomic principles:

### A. Management Allowed Depletion (FAO-56 MAD)
For field crops (such as Tomato, Rice, Maize, Wheat), total available water ($TAW$) in the root zone is defined by:
$$TAW = 1000 \cdot (\theta_{FC} - \theta_{WP}) \cdot Z_r$$
Where:
- $\theta_{FC}$ is soil moisture at field capacity (~65% for loam).
- $\theta_{WP}$ is moisture at permanent wilting point (~25% for loam).
- $Z_r$ is effective rooting depth.

The critical threshold for readily available water ($RAW$) is governed by the depletion fraction $p$ ($p \approx 0.40 - 0.50$):
$$RAW = p \cdot TAW$$

- **Rule 1 (Critical Depletion — Immediate Irrigation):**
  If current volumetric soil moisture $\theta < 28\%$ and forecast precipitation $< 5\text{ mm}$, trigger `IRRIGATE_IMMEDIATE` with `CRITICAL/HIGH` urgency.
  *Explanation:* Stomatal conductance shuts down to prevent desiccation, immediately suppressing photosynthesis and cell expansion.

- **Rule 2 (Precipitation Inbound / Saturated Soil — Postpone Irrigation):**
  If soil moisture $\theta \ge 75\%$ OR (forecast precipitation $\ge 20\text{ mm}$ with probability $\ge 65\%$), trigger `POSTPONE_IRRIGATION`.
  *Explanation:* Over-application risks root hypoxia, anaerobic denitrification, sheath blight susceptibility, and unnecessary water pumping energy.

- **Rule 3 (Optimal Envelope — Routine Monitoring):**
  If moisture is within the crop's optimal band ($45\% - 65\%$), pH is between $6.0 - 7.5$, and temperature $< 35^\circ\text{C}$, trigger `MONITOR_OPTIMAL`.

- **Rule 4 (Heatwave Evaporative Shock Mitigation):**
  If ambient temperature $> 36^\circ\text{C}$ and relative humidity $< 40\%$, Vapor Pressure Deficit (VPD) is severely elevated. The engine recommends micro-canopy misting or kaolin clay reflective spraying.

---

## 4. API Endpoint Specifications

All endpoints require JWT Bearer Authentication (`Authorization: Bearer <token>`).

### 1. `GET /api/field-intelligence/latest`
Retrieves the most recent active recommendation for the authenticated user and farm.
- **Query Params:** `fieldId` (optional, default `field-01`)
- **Response:**
  ```json
  {
    "success": true,
    "recommendation": {
      "recommendationId": "rec_a91b2c3d4e5f",
      "fieldId": "field-01",
      "fieldName": "North Parcel (Tomato)",
      "cropType": "Tomato",
      "action": "IRRIGATE_IMMEDIATE",
      "actionLabel": "Immediate Irrigation Required — Root Zone Deficit",
      "urgency": "high",
      "explanation": "Soil moisture has depleted to 22%, which is severely below the managed depletion threshold...",
      "decisionRules": [
        "Triggered by soil moisture (22%) falling below FAO-56 Management Allowed Depletion (MAD 50% / threshold 28%)..."
      ],
      "supportingObservations": {
        "soilMoisture": { "value": 22.0, "unit": "%", "source": "esp32_hardware", "freshnessMinutes": 2, "isStale": false }
      },
      "expectedFollowUpCondition": {
        "parameter": "Soil Moisture",
        "targetRange": "48% – 65%",
        "timeframeHours": 4
      }
    }
  }
  ```

### 2. `POST /api/field-intelligence/recommendation`
Generates a new recommendation for a specific field with optional agronomic overrides.
- **Payload:**
  ```json
  {
    "fieldId": "field-01",
    "fieldName": "North Parcel",
    "cropType": "Tomato",
    "cropStage": "Flowering & Fruit Set",
    "soilMoistureOverride": 22.0,
    "forecastRainMm": 0,
    "forecastRainProbability": 5
  }
  ```

### 3. `POST /api/field-intelligence/action`
Records a farmer's response to an existing recommendation.
- **Payload:**
  ```json
  {
    "recommendationId": "rec_a91b2c3d4e5f",
    "actionTaken": "irrigated",
    "notes": "Applied 20mm drip cycle in evening"
  }
  ```

### 4. `POST /api/field-intelligence/evaluate-followup`
Evaluates post-action telemetry to verify whether the agronomic condition was satisfied.
- **Payload:**
  ```json
  {
    "recommendationId": "rec_a91b2c3d4e5f",
    "moisture": 54.0,
    "temperature": 24.5
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "evaluation": {
      "conditionMet": true,
      "status": "improved",
      "observedDelta": "+32% moisture",
      "explanation": "Follow-up observation verified! Soil moisture increased from 22% to 54% (+32% delta), successfully fulfilling the root-zone replenishment condition."
    }
  }
  ```

---

## 5. UI Integration (`Frontend/src/components/AIDecisionPanel.tsx`)

The UI is built with rich responsive components:
- **Field Context Bar:** Allows selecting between active parcels (North Parcel Tomato, East Field Corn, South Terrace Wheat).
- **Telemetry Provenance Badges:** Clearly labels whether observations originate from live ESP32 hardware, the IoT simulator, or manual overrides, with real-time freshness in minutes.
- **Urgency Indicator:** Color-coded priority chip (Critical, High, Medium, Low).
- **Decision Rule Inspector:** Expandable panel displaying exact FAO-56 standards cited for the decision.
- **Interactive Action Bar:** Four action buttons (`Irrigate Now`, `Postpone`, `Field Inspected`, `Dismiss`) that persist directly to the database.
- **Closed-Loop Resolution Panel:** Once an action is recorded, reveals the follow-up evaluation workspace where new readings can be tested and verified.

---

## 6. Safety & Hardware Actuator Disclosures

- **Actuator Decoupling:** Remote pump activation requires explicit JWT authentication (`farmer` or `admin` role). Generating an irrigation recommendation does **not** automatically trigger physical hardware.
- **Simulator Labeling:** When hardware is not connected, the interface and backend explicitly flag `source: "iot_simulator"` and `isSimulated: true`.
- **Manual Override:** Farmers retain final decision authority and can postpone or dismiss recommendations with explanatory notes.
