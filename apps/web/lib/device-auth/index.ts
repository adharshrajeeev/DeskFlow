import { createHash, randomBytes, timingSafeEqual } from "crypto";

const KEY_BYTES = 32;

/** Generate a cryptographically secure device secret (shown once). */
export function generateDeviceKey(): string {
  return randomBytes(KEY_BYTES).toString("base64url");
}

/** Store only this hash in the database. */
export function hashDeviceKey(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

/** Constant-time comparison of plaintext key against stored SHA-256 hex hash. */
export function verifyDeviceKey(plaintext: string, storedHash: string): boolean {
  if (!plaintext || !storedHash) return false;
  const candidate = Buffer.from(hashDeviceKey(plaintext), "utf8");
  const expected = Buffer.from(storedHash, "utf8");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export type AuthenticatedDevice = {
  id: string;
  user_id: string;
  name: string;
  device_key_hash: string;
  last_seen: string | null;
};

/**
 * Authenticate device from request headers.
 * On failure returns a generic 401 (does not reveal whether the device ID exists).
 */
export async function authenticateDeviceRequest(
  request: Request,
): Promise<
  | { ok: true; device: AuthenticatedDevice }
  | { ok: false; status: 400 | 401; message: string }
> {
  const deviceId = request.headers.get("x-device-id")?.trim();
  const deviceKey = request.headers.get("x-device-key")?.trim();

  if (!deviceId || !deviceKey) {
    return { ok: false, status: 400, message: "Missing device credentials" };
  }

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(deviceId)) {
    return { ok: false, status: 401, message: "Invalid credentials" };
  }

  const { createServiceClient } = await import("@/lib/supabase/admin");
  const admin = createServiceClient();

  const { data: device, error } = await admin
    .from("devices")
    .select("id, user_id, name, device_key_hash, last_seen")
    .eq("id", deviceId)
    .maybeSingle();

  if (error || !device) {
    return { ok: false, status: 401, message: "Invalid credentials" };
  }

  if (!verifyDeviceKey(deviceKey, device.device_key_hash)) {
    return { ok: false, status: 401, message: "Invalid credentials" };
  }

  return { ok: true, device: device as AuthenticatedDevice };
}
