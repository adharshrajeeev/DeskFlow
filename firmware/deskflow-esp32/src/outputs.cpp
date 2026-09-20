#include "outputs.h"

static bool lightState = false;
static bool filterState = false;

static void writePin(int pin, bool on) {
  const bool level = OUTPUT_ACTIVE_HIGH ? on : !on;
  digitalWrite(pin, level ? HIGH : LOW);
}

void outputsBegin() {
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(FILTER_PIN, OUTPUT);
  // Safe startup: both outputs OFF before network connects.
  setLight(false);
  setFilter(false);
}

void setLight(bool on) {
  lightState = on;
  writePin(LIGHT_PIN, on);
}

void setFilter(bool on) {
  filterState = on;
  writePin(FILTER_PIN, on);
}

bool getLight() { return lightState; }
bool getFilter() { return filterState; }
