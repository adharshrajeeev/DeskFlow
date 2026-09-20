export type {
  DeviceDesiredState,
  DeviceReportedState,
  DeviceRow,
  DeviceStateRow,
} from "./device";
export {
  ONLINE_THRESHOLD_MS,
  isDeviceOnline,
} from "./device";

export type {
  DeviceStateResponse,
  DeviceReportRequest,
  DeviceReportResponse,
} from "./api";
export {
  DEFAULT_POLL_INTERVAL_SECONDS,
  MIN_POLL_INTERVAL_SECONDS,
  MAX_POLL_INTERVAL_SECONDS,
  clampPollInterval,
} from "./api";
