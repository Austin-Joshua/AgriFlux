import sys
import json

# This is a template for the ML model integration
# In production, this would load a saved .pkl model (RandomForest/XGBoost)

def predict_yield(data):
    # Dynamic logic based on input data
    crop_type = data.get('cropType', 'Rice')
    nitrogen = float(data.get('nitrogen', 50))
    phosphorus = float(data.get('phosphorus', 30))
    potassium = float(data.get('potassium', 40))
    
    base_yields = {'Rice': 4500, 'Wheat': 3800, 'Corn': 5000}
    base = base_yields.get(crop_type, 3000)
    
    # Calculate impact (simple linear model for demo)
    impact = (nitrogen / 100 + phosphorus / 50 + potassium / 60) / 3
    yield_val = int(base * impact)
    
    return {"predicted_yield": yield_val, "confidence": 0.85 + (0.1 * impact if impact < 1 else 0.05)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_data = json.loads(sys.argv[1])
        result = predict_yield(input_data)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "No data provided"}))
