/**
 * AgriFlux AI - ESP32 Soil Intelligence Node (v1.1.0)
 * --------------------------------------------------
 * Transmits real-time moisture, temperature, and humidity to the AgriFlux API.
 */

#include <WiFi.h>
#include <HTTPClient.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server Configuration
// Use your local machine's IP (e.g., 192.168.1.5) if running backend locally
const char* serverUrl = "http://YOUR_LOCAL_IP:5001/api/iot-data";

// Pin Configuration
const int SOIL_SENSOR_PIN = 34; // Capacitive Soil Moisture Sensor
const int RELAY_PIN = 26;       // Water Pump Relay

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Pump OFF by default

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read moisture
    int moistureValue = analogRead(SOIL_SENSOR_PIN);
    float moisturePercent = map(moistureValue, 4095, 0, 0, 100);
    
    // Simulate/Read Temperature & Humidity (Example values if DHT not present)
    float temperature = 26.5 + (random(-5, 5) / 10.0);
    float humidity = 55.0 + (random(-10, 10) / 10.0);
    bool pumpStatus = (digitalRead(RELAY_PIN) == HIGH);

    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Construct Payload
    String payload = "{";
    payload += "\"moisture\": " + String(moisturePercent) + ",";
    payload += "\"temperature\": " + String(temperature) + ",";
    payload += "\"humidity\": " + String(humidity) + ",";
    payload += "\"pumpStatus\": " + String(pumpStatus ? "true" : "false");
    payload += "}";

    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      Serial.println("📡 [SYNC SUCCESS] " + payload);
    } else {
      Serial.print("❌ [SYNC ERROR] Code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
  
  delay(5000); // Pulse every 5 seconds for real-time dashboard
}
