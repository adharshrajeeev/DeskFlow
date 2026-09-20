#pragma once

#include <Arduino.h>

// ESP8266 NodeMCU: built-in LED is GPIO 2 (D4), active-LOW.
#ifndef DESKFLOW_LIGHT_PIN
#ifdef LED_BUILTIN
#define DESKFLOW_LIGHT_PIN LED_BUILTIN
#else
#define DESKFLOW_LIGHT_PIN 2
#endif
#endif

#ifndef DESKFLOW_FILTER_PIN
#define DESKFLOW_FILTER_PIN 4
#endif

constexpr int LIGHT_PIN = DESKFLOW_LIGHT_PIN;
constexpr int FILTER_PIN = DESKFLOW_FILTER_PIN;

// Built-in blue LED on ESP8266 is usually ON when pin is LOW.
constexpr bool LIGHT_ACTIVE_HIGH = false;
// External LED/relay on D2 (GPIO4) — HIGH = ON for simple LED tests.
constexpr bool FILTER_ACTIVE_HIGH = true;

void outputsBegin();
void setLight(bool on);
void setFilter(bool on);
bool getLight();
bool getFilter();
