import type { DeviceDesiredState, DeviceReportedState } from "./device";

/** Successful GET /api/v1/device/state response. */
export type DeviceStateResponse = {
  device_id: string;
  desired: DeviceDesiredState;
  poll_interval_seconds: number;
  server_time: string;
};

/** Body for POST /api/v1/device/report. */
export type DeviceReportRequest = {
  light_on: boolean;
  filter_on: boolean;
};

export type DeviceReportResponse = {
  ok: true;
  reported: DeviceReportedState;
  server_time: string;
};

export const DEFAULT_POLL_INTERVAL_SECONDS = 5;
export const MIN_POLL_INTERVAL_SECONDS = 3;
export const MAX_POLL_INTERVAL_SECONDS = 60;

export function clampPollInterval(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_POLL_INTERVAL_SECONDS;
  return Math.min(
    MAX_POLL_INTERVAL_SECONDS,
    Math.max(MIN_POLL_INTERVAL_SECONDS, Math.round(seconds)),
  );
}
