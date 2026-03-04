import sys
import json
import pandas as pd
import numpy as np

# This is a template for the ML model integration
# In production, this would load a saved .pkl model (RandomForest/XGBoost)

def predict_yield(data):
    # Mock ML logic matching the backend/frontend rule engine for the demo
    # In reality: model.predict(df)
    yield_val = 4000
    return {"predicted_yield": yield_val, "confidence": 0.92}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_data = json.loads(sys.argv[1])
        result = predict_yield(input_data)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "No data provided"}))
