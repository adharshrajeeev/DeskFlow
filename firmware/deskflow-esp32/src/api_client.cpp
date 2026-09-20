#include "api_client.h"
#include "secrets.h"

#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

namespace {

constexpr int MIN_POLL = 3;
constexpr int MAX_POLL = 60;
constexpr int DEFAULT_POLL = 5;

String stateUrl() {
  return String(API_BASE_URL) + "/api/v1/device/state";
}

String reportUrl() {
  return String(API_BASE_URL) + "/api/v1/device/report";
}

bool useTls() {
  return String(API_BASE_URL).startsWith("https://");
}

}  // namespace

int clampPollInterval(int seconds) {
  if (seconds < MIN_POLL) return MIN_POLL;
  if (seconds > MAX_POLL) return MAX_POLL;
  return seconds;
}

bool ensureWifiConnected() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  Serial.println("[wifi] Connecting...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  const uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[wifi] Connected: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println("[wifi] Connect failed — keeping last GPIO state");
  return false;
}

DesiredState fetchDesiredState() {
  DesiredState result;

  if (!ensureWifiConnected()) {
    return result;
  }

  HTTPClient http;
  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  bool begun = false;
  if (useTls()) {
    // Production certificates: setCertificate / setCACert in a follow-up if needed.
    // For MVP on ESP32 + public HTTPS (Vercel), insecure is commonly used for bring-up.
    // Prefer proper CA validation before long-term deployment.
    secureClient.setInsecure();
    begun = http.begin(secureClient, stateUrl());
  } else {
    begun = http.begin(plainClient, stateUrl());
  }

  if (!begun) {
    Serial.println("[api] begin() failed");
    return result;
  }

  http.addHeader("X-Device-Id", DEVICE_ID);
  http.addHeader("X-Device-Key", DEVICE_KEY);
  http.setTimeout(10000);

  const int code = http.GET();
  if (code != HTTP_CODE_OK) {
    Serial.printf("[api] GET state failed: HTTP %d\n", code);
    http.end();
    return result;
  }

  const String body = http.getString();
  http.end();

  JsonDocument doc;
  const DeserializationError err = deserializeJson(doc, body);
  if (err) {
    Serial.printf("[api] JSON parse error: %s\n", err.c_str());
    return result;
  }

  result.light_on = doc["desired"]["light_on"] | false;
  result.filter_on = doc["desired"]["filter_on"] | false;
  result.poll_interval_seconds =
      clampPollInterval(doc["poll_interval_seconds"] | DEFAULT_POLL);
  result.ok = true;

  Serial.printf(
      "[api] desired light=%s filter=%s poll=%ds\n",
      result.light_on ? "ON" : "OFF",
      result.filter_on ? "ON" : "OFF",
      result.poll_interval_seconds);

  return result;
}

bool reportActualState(bool light_on, bool filter_on) {
  if (!ensureWifiConnected()) {
    return false;
  }

  HTTPClient http;
  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  bool begun = false;
  if (useTls()) {
    secureClient.setInsecure();
    begun = http.begin(secureClient, reportUrl());
  } else {
    begun = http.begin(plainClient, reportUrl());
  }

  if (!begun) {
    Serial.println("[api] report begin() failed");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", DEVICE_ID);
  http.addHeader("X-Device-Key", DEVICE_KEY);
  http.setTimeout(10000);

  JsonDocument doc;
  doc["light_on"] = light_on;
  doc["filter_on"] = filter_on;
  String payload;
  serializeJson(doc, payload);

  const int code = http.POST(payload);
  http.end();

  if (code != HTTP_CODE_OK) {
    Serial.printf("[api] POST report failed: HTTP %d\n", code);
    return false;
  }

  Serial.println("[api] reported actual state");
  return true;
}
