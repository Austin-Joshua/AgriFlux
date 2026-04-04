# AgriFlux AI - IoT Integration (v1.0.0)

Welcome to the AgriFlux IoT module. This folder contains the blueprints and hardware integration logic required to connect real-world sensors to the AgriFlux AI platform.

## 🛠️ Hardware Requirements
- **Microcontroller**: ESP32 (Recommended for WiFi/BLE support).
- **Soil Sensor**: Capacitive Soil Moisture Sensor (Analog).
- **Communication**: HTTP POST to AgriFlux Integration API.
- **Actuators**: 5V/12V Relay for water pump control.

## 🚀 Deployment Steps
1.  **Configure WiFi**: Update `ssid` and `password` in `esp32_soil_sensor.ino`.
2.  **API Endpoint**: Update `serverUrl` to point to your deployed AgriFlux Backend.
3.  **Sensor Calibration**: Calibrate the analog thresholds based on your specific soil type.
4.  **Sync Node**: The backend will automatically recognize the `sensorId` once the first payload is received.

## 📡 API Data Structure
The backend expects JSON payloads for sensor synchronization:

```json
{
  "sensorId": "NODE_01",
  "moisture": 45.5,
  "timestamp": "2026-04-04T12:00:00Z"
}
```

---
**AgriFlux AI – Bridging the gap between IoT and Intelligent Agriculture.**
