#include "outputs.h"

static bool lightState = false;
static bool filterState = false;

static void writePin(int pin, bool on, bool activeHigh) {
  const bool level = activeHigh ? on : !on;
  digitalWrite(pin, level ? HIGH : LOW);
}

void outputsBegin() {
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(FILTER_PIN, OUTPUT);
  // Safe startup: both OFF before Wi-Fi.
  setLight(false);
  setFilter(false);
}

void setLight(bool on) {
  lightState = on;
  writePin(LIGHT_PIN, on, LIGHT_ACTIVE_HIGH);
}

void setFilter(bool on) {
  filterState = on;
  writePin(FILTER_PIN, on, FILTER_ACTIVE_HIGH);
}

bool getLight() { return lightState; }
bool getFilter() { return filterState; }
