/**
 * YAT FARM NODE - ESP8266 Sensor Node
 * =====================================
 * อ่านค่า Sensor และส่งข้อมูลไปยัง YAT FARM MANAGER API
 *
 * Hardware:
 *   - ESP8266 (NodeMCU / Wemos D1 Mini)
 *   - DHT22 (Temperature + Humidity) → GPIO D4 (GPIO2)
 *   - Soil Moisture Sensor (Analog)   → A0
 *   - LDR Light Sensor (Analog)       → A0 (สลับกับ Soil หรือใช้ Multiplexer)
 *   - Relay Module (Pump Control)     → GPIO D1 (GPIO5)
 *
 * Libraries required (ติดตั้งผ่าน Arduino Library Manager):
 *   - DHT sensor library by Adafruit
 *   - Adafruit Unified Sensor
 *   - ArduinoJson by Benoit Blanchon (version 6.x)
 *
 * Configuration:
 *   แก้ไขค่าในส่วน USER CONFIGURATION ด้านล่างก่อนอัปโหลด
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ─── USER CONFIGURATION ──────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";       // ชื่อ WiFi
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";   // รหัสผ่าน WiFi
const char* SERVER_URL    = "https://YOUR_APP.manus.space"; // URL ของ YAT FARM MANAGER
const char* DEVICE_ID     = "esp8266-001";           // ID อุปกรณ์ (ต้องไม่ซ้ำกัน)

// ─── HARDWARE PINS ───────────────────────────────────────────────────────────
#define DHT_PIN       2     // D4 = GPIO2
#define DHT_TYPE      DHT22
#define RELAY_PIN     5     // D1 = GPIO5 (LOW = เปิดปั๊ม, HIGH = ปิดปั๊ม)
#define SOIL_PIN      A0    // Analog input สำหรับ Soil Moisture

// ─── TIMING ──────────────────────────────────────────────────────────────────
const unsigned long SENSOR_INTERVAL  = 30000;  // ส่งข้อมูล Sensor ทุก 30 วินาที
const unsigned long COMMAND_INTERVAL = 10000;  // ตรวจสอบคำสั่งปั๊มทุก 10 วินาที
const unsigned long WIFI_TIMEOUT     = 30000;  // Timeout การเชื่อมต่อ WiFi

// ─── GLOBALS ─────────────────────────────────────────────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient wifiClient;
HTTPClient http;

unsigned long lastSensorTime  = 0;
unsigned long lastCommandTime = 0;
bool pumpOn = false;

// ─── FUNCTION DECLARATIONS ───────────────────────────────────────────────────
void connectWiFi();
bool sendSensorData(float temp, float hum, float soil, float light);
bool fetchPumpCommand();
void setPump(bool on);
float readSoilMoisture();

// ─── SETUP ───────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.println("\n\n=== YAT FARM NODE ===");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);

  // Init hardware
  pinMode(RELAY_PIN, OUTPUT);
  setPump(false);  // ปิดปั๊มเริ่มต้น
  dht.begin();

  // Connect WiFi
  connectWiFi();
}

// ─── LOOP ─────────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected. Reconnecting...");
    connectWiFi();
  }

  // ── Send sensor data ──
  if (now - lastSensorTime >= SENSOR_INTERVAL) {
    lastSensorTime = now;

    float temperature = dht.readTemperature();
    float humidity    = dht.readHumidity();
    float soil        = readSoilMoisture();
    float light       = analogRead(A0);  // 0-1023 → แปลงเป็น lux ตามต้องการ

    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("[DHT] Read failed. Skipping...");
    } else {
      Serial.printf("[Sensor] Temp=%.1f°C  Hum=%.1f%%  Soil=%.1f%%  Light=%.0f\n",
                    temperature, humidity, soil, light);
      sendSensorData(temperature, humidity, soil, light);
    }
  }

  // ── Fetch pump command ──
  if (now - lastCommandTime >= COMMAND_INTERVAL) {
    lastCommandTime = now;
    fetchPumpCommand();
  }

  delay(100);
}

// ─── WIFI CONNECTION ─────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > WIFI_TIMEOUT) {
      Serial.println("\n[WiFi] Timeout! Restarting...");
      ESP.restart();
    }
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("[WiFi] Connected! IP: ");
  Serial.println(WiFi.localIP());
}

// ─── SEND SENSOR DATA ────────────────────────────────────────────────────────
bool sendSensorData(float temp, float hum, float soil, float light) {
  if (WiFi.status() != WL_CONNECTED) return false;

  String url = String(SERVER_URL) + "/api/sensor";

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["temperature"]  = round(temp * 10) / 10.0;
  doc["humidity"]     = round(hum * 10) / 10.0;
  doc["soilMoisture"] = round(soil * 10) / 10.0;
  doc["light"]        = round(light);

  String payload;
  serializeJson(doc, payload);

  http.begin(wifiClient, url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  int code = http.POST(payload);

  if (code == 200) {
    Serial.println("[API] Sensor data sent OK");
    http.end();
    return true;
  } else {
    Serial.printf("[API] Send failed, HTTP code: %d\n", code);
    http.end();
    return false;
  }
}

// ─── FETCH PUMP COMMAND ──────────────────────────────────────────────────────
bool fetchPumpCommand() {
  if (WiFi.status() != WL_CONNECTED) return false;

  String url = String(SERVER_URL) + "/api/device/" + DEVICE_ID + "/command";

  http.begin(wifiClient, url);
  http.setTimeout(8000);

  int code = http.GET();

  if (code == 200) {
    String body = http.getString();
    http.end();

    StaticJsonDocument<128> doc;
    DeserializationError err = deserializeJson(doc, body);
    if (err) {
      Serial.println("[API] JSON parse error");
      return false;
    }

    const char* pumpStatus = doc["pumpStatus"];
    const char* mode       = doc["mode"];

    bool shouldBeOn = (strcmp(pumpStatus, "on") == 0);

    if (shouldBeOn != pumpOn) {
      Serial.printf("[Pump] Command: %s (mode: %s)\n", pumpStatus, mode);
      setPump(shouldBeOn);
    }
    return true;
  } else {
    Serial.printf("[API] Command fetch failed, HTTP code: %d\n", code);
    http.end();
    return false;
  }
}

// ─── PUMP CONTROL ────────────────────────────────────────────────────────────
void setPump(bool on) {
  pumpOn = on;
  // Relay: LOW = activate (เปิดปั๊ม), HIGH = deactivate (ปิดปั๊ม)
  // ปรับตาม relay module ที่ใช้ (Active LOW หรือ Active HIGH)
  digitalWrite(RELAY_PIN, on ? LOW : HIGH);
  Serial.printf("[Pump] %s\n", on ? "ON" : "OFF");
}

// ─── READ SOIL MOISTURE ──────────────────────────────────────────────────────
float readSoilMoisture() {
  // อ่านค่า Analog 0-1023 แปลงเป็น % (0% = แห้ง, 100% = เปียก)
  // ค่าจริงขึ้นอยู่กับ Sensor ที่ใช้ ปรับ DRY_VALUE และ WET_VALUE ตามการ Calibrate
  const int DRY_VALUE = 900;   // ค่า Analog เมื่อดินแห้ง
  const int WET_VALUE = 300;   // ค่า Analog เมื่อดินเปียก

  int raw = analogRead(SOIL_PIN);
  float pct = map(raw, DRY_VALUE, WET_VALUE, 0, 100);
  pct = constrain(pct, 0, 100);
  return pct;
}
