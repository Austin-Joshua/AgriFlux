# 🤖 AgriFlux Machine Learning Pipeline Audit

**Date:** October 16, 2026  
**Auditor:** Autonomous Machine Learning & Data Science Engineer  

---

## 1. Audit of Existing ML Assets

### 1.1 Model Discovery
* **File Inspected:** `Backend/ml/predict_yield.py` (30 lines).
* **Observed Implementation:**
  ```python
  def predict_yield(data):
      crop_type = data.get('cropType', 'Rice')
      nitrogen = float(data.get('nitrogen', 50))
      phosphorus = float(data.get('phosphorus', 30))
      potassium = float(data.get('potassium', 40))
      base_yields = {'Rice': 4500, 'Wheat': 3800, 'Corn': 5000}
      base = base_yields.get(crop_type, 3000)
      impact = (nitrogen / 100 + phosphorus / 50 + potassium / 60) / 3
      yield_val = int(base * impact)
      return {"predicted_yield": yield_val, "confidence": 0.85 + (0.1 * impact if impact < 1 else 0.05)}
  ```
* **Findings:**
  1. **Not a Trained ML Model:** This script is a heuristic linear toy formula, not a machine learning model.
  2. **Disconnected Asset:** The script was never invoked by the Express backend API or any service controller.
  3. **No Trained Artifacts:** No `.pkl`, `.onnx`, or serialized model checkpoints existed in the repository.
  4. **No Training Dataset:** No raw or processed training dataset (`.csv`, `.parquet`, or database records) was present in the repository.
  5. **Fabricated Metrics in Frontend:** The frontend (`YieldPrediction.tsx`) displayed a hardcoded `99%` confidence rating and did not call the backend.

---

## 2. Leakage Prevention & Train/Test Split Guidelines

To transition AgriFlux from toy heuristics to genuine, defensible ML without fabricating performance claims:

1. **Agronomic Data Splitting Rule:** 
   Random k-fold splitting on agricultural datasets with repeated observations from the same farm or field causes **severe spatial-temporal data leakage**. Split strategies must be:
   - **GroupKFold** grouped on `farm_id` or `field_id` to ensure models generalize across unseen land parcels.
   - **TimeSeriesSplit** when historical weather or seasonal crop cycles are predicted sequentially.
2. **Preprocessing Isolation:**
   All scalers (StandardScaler, MinMaxScaler) and category encoders must be fit exclusively on training folds and transformed on validation/test folds.
3. **Evaluation Integrity:**
   Never report single-point metrics on synthetic datasets as real-world evidence. Metrics (MAE, RMSE, $R^2$) must be accompanied by explicit dataset provenance.

---

## 3. Production Inference & Fallback Strategy

* When an ML model artifact is unavailable, the system must clearly label outputs as **Rule-Based Agronomic Estimates** derived from published agricultural extension guidelines (ICAR / FAO), rather than claiming "AI-Powered Predictions".
* The inference interface must validate required inputs (Crop type, NPK, Soil pH, Moisture, Rainfall) and return structured uncertainty bounds rather than arbitrary high confidence scores.
