#pragma once

#include <Arduino.h>

// GPIO mapping — later these can drive relay modules.
constexpr int LIGHT_PIN = 25;
constexpr int FILTER_PIN = 26;

// Active-HIGH for LED testing. For active-LOW relays, invert in setLight/setFilter.
constexpr bool OUTPUT_ACTIVE_HIGH = true;

void outputsBegin();
void setLight(bool on);
void setFilter(bool on);
bool getLight();
bool getFilter();
