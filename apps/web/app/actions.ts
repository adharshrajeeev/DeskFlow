"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateDeviceKey, hashDeviceKey } from "@/lib/device-auth";
import { PENDING_KEY_COOKIE } from "@/lib/cookies";
import { isOwnerEmail } from "@/lib/owner";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function ensureAquariumController(): Promise<
  | { ok: true; deviceId: string; name: string; pendingKey: string | null }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isOwnerEmail(user.email)) {
    return { ok: false, error: "Not authorized" };
  }

  const cookieStore = await cookies();
  const pendingKey = cookieStore.get(PENDING_KEY_COOKIE)?.value ?? null;

  const { data: existing } = await supabase
    .from("devices")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      deviceId: existing.id,
      name: existing.name,
      pendingKey,
    };
  }

  const deviceKey = generateDeviceKey();
  const deviceKeyHash = hashDeviceKey(deviceKey);

  const { data: device, error: insertError } = await supabase
    .from("devices")
    .insert({
      user_id: user.id,
      name: "Aquarium Controller",
      device_key_hash: deviceKeyHash,
    })
    .select("id, name")
    .single();

  if (insertError || !device) {
    console.error(insertError);
    return { ok: false, error: "Failed to create aquarium controller" };
  }

  const { error: stateError } = await supabase.from("device_states").insert({
    device_id: device.id,
  });

  if (stateError) {
    console.error(stateError);
    await supabase.from("devices").delete().eq("id", device.id);
    return { ok: false, error: "Failed to initialize controller state" };
  }

  cookieStore.set(PENDING_KEY_COOKIE, deviceKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  revalidatePath("/");
  return {
    ok: true,
    deviceId: device.id,
    name: device.name,
    pendingKey: deviceKey,
  };
}

export async function rotateDeviceKey(
  deviceId: string,
): Promise<{ ok: true; deviceKey: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isOwnerEmail(user.email)) {
    return { ok: false, error: "Not authorized" };
  }

  const { data: device } = await supabase
    .from("devices")
    .select("id")
    .eq("id", deviceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!device) {
    return { ok: false, error: "Device not found" };
  }

  const deviceKey = generateDeviceKey();
  const { error } = await supabase
    .from("devices")
    .update({
      device_key_hash: hashDeviceKey(deviceKey),
      key_created_at: new Date().toISOString(),
    })
    .eq("id", deviceId);

  if (error) {
    return { ok: false, error: "Failed to rotate key" };
  }

  const cookieStore = await cookies();
  cookieStore.set(PENDING_KEY_COOKIE, deviceKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  revalidatePath("/");
  return { ok: true, deviceKey };
}

export async function dismissPendingKey(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_KEY_COOKIE);
  revalidatePath("/");
}

export async function setDesiredLight(
  deviceId: string,
  on: boolean,
): Promise<ActionResult> {
  return setDesiredOutput(deviceId, { desired_light_on: on });
}

export async function setDesiredFilter(
  deviceId: string,
  on: boolean,
): Promise<ActionResult> {
  return setDesiredOutput(deviceId, { desired_filter_on: on });
}

async function setDesiredOutput(
  deviceId: string,
  patch: { desired_light_on?: boolean; desired_filter_on?: boolean },
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isOwnerEmail(user.email)) {
    return { ok: false, error: "Not authorized" };
  }

  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("id")
    .eq("id", deviceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (deviceError || !device) {
    return { ok: false, error: "Device not found" };
  }

  const { error } = await supabase
    .from("device_states")
    .update(patch)
    .eq("device_id", deviceId);

  if (error) {
    console.error(error);
    return { ok: false, error: "Failed to update desired state" };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

/**
 * Create the single owner account with service role.
 * Marks email confirmed immediately — no verification email sent.
 */
export async function createOwnerAccount(
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ownerEmail = process.env.DESKFLOW_OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail) {
    return {
      ok: false,
      error: "Set DESKFLOW_OWNER_EMAIL in .env.local first",
    };
  }

  if (!password || password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }

  const { createServiceClient } = await import("@/lib/supabase/admin");
  const admin = createServiceClient();

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 50,
  });

  if (listError) {
    return { ok: false, error: listError.message };
  }

  const existing = listed.users.find(
    (u) => u.email?.toLowerCase() === ownerEmail,
  );

  if (existing) {
    // Ensure confirmed + update password so they can log in without email.
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existing.id,
      {
        password,
        email_confirm: true,
      },
    );
    if (updateError) {
      return { ok: false, error: updateError.message };
    }
    return { ok: true };
  }

  const { error: createError } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password,
    email_confirm: true,
  });

  if (createError) {
    return { ok: false, error: createError.message };
  }

  return { ok: true };
}
