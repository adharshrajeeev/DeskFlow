#include <Arduino.h>

#if defined(ESP8266)
#include <ESP8266WiFi.h>
#else
#include <WiFi.h>
#endif

#include "api_client.h"
#include "outputs.h"
#include "secrets.h"

static int pollIntervalMs = 5000;

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("DeskFlow — Aquarium Controller");
  Serial.println("Safe startup: light=OFF filter=OFF");

  outputsBegin();

  // Never print DEVICE_KEY.
  Serial.printf("Device ID: %s\n", DEVICE_ID);
  Serial.printf("API: %s\n", API_BASE_URL);
  Serial.printf("Light pin (builtin LED): GPIO %d\n", LIGHT_PIN);

  ensureWifiConnected();
}

void loop() {
  const DesiredState desired = fetchDesiredState();

  if (desired.ok) {
    if (desired.light_on != getLight()) {
      setLight(desired.light_on);
      Serial.printf("[gpio] light -> %s (GPIO %d)\n",
                    desired.light_on ? "ON" : "OFF", LIGHT_PIN);
    }
    if (desired.filter_on != getFilter()) {
      setFilter(desired.filter_on);
      Serial.printf("[gpio] filter -> %s (GPIO %d)\n",
                    desired.filter_on ? "ON" : "OFF", FILTER_PIN);
    }

    reportActualState(getLight(), getFilter());
    pollIntervalMs = clampPollInterval(desired.poll_interval_seconds) * 1000;
  } else {
    Serial.println("[loop] Poll failed — holding last GPIO state");
  }

  delay(pollIntervalMs);
}
