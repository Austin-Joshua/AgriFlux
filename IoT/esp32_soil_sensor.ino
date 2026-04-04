/**
 * AgriFlux AI - ESP32 Soil Intelligence Node (v1.0.0)
 * --------------------------------------------------
 * This script is a production-ready blueprint for the AgriFlux IoT node.
 * It periodically reads soil moisture levels and transmits them to the 
 * AgriFlux Cloud via the Integration API.
 */

#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "https://your-agriflux-api.com/api/integration/sensor-sync";

// Pin Configuration
const int SOIL_SENSOR_PIN = 34; // Capacitive Soil Moisture Sensor (Analog)
const int RELAY_PIN = 26;       // Water Pump Relay (Digital)

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Ensure pump is OFF by default

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    int moistureValue = analogRead(SOIL_SENSOR_PIN);
    float moisturePercent = map(moistureValue, 4095, 0, 0, 100);

    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"sensorId\": \"NODE_01\", \"moisture\": " + String(moisturePercent) + "}";
    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      Serial.println("Data synced successfully");
    } else {
      Serial.println("Error syncing data");
    }
    http.end();
  }
  delay(60000); // Sync every 60 seconds
}
