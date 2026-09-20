/** Desired output state commanded by the dashboard (user intent). */
export type DeviceDesiredState = {
  light_on: boolean;
  filter_on: boolean;
};

/** Actual output state reported by the ESP32 after applying GPIO. */
export type DeviceReportedState = {
  light_on: boolean;
  filter_on: boolean;
};

export type DeviceRow = {
  id: string;
  user_id: string;
  name: string;
  last_seen: string | null;
  created_at: string;
};

export type DeviceStateRow = {
  device_id: string;
  desired_light_on: boolean;
  desired_filter_on: boolean;
  reported_light_on: boolean;
  reported_filter_on: boolean;
  updated_at: string;
  reported_at: string | null;
};

/** Online if last_seen is within this window (ms). */
export const ONLINE_THRESHOLD_MS = 30_000;

export function isDeviceOnline(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false;
  const t = new Date(lastSeen).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < ONLINE_THRESHOLD_MS;
}
