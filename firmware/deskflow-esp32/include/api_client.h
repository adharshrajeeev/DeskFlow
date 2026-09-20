#pragma once

#include <Arduino.h>

struct DesiredState {
  bool light_on = false;
  bool filter_on = false;
  int poll_interval_seconds = 5;
  bool ok = false;
};

bool ensureWifiConnected();
DesiredState fetchDesiredState();
bool reportActualState(bool light_on, bool filter_on);
int clampPollInterval(int seconds);
