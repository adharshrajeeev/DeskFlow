import { NextResponse } from "next/server";
import {
  DEFAULT_POLL_INTERVAL_SECONDS,
  type DeviceStateResponse,
} from "@deskflow/shared";
import { authenticateDeviceRequest } from "@/lib/device-auth";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const auth = await authenticateDeviceRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const admin = createServiceClient();
    const now = new Date().toISOString();

    const { error: touchError } = await admin
      .from("devices")
      .update({
        last_seen: now,
        key_last_used_at: now,
      })
      .eq("id", auth.device.id);

    if (touchError) {
      console.error("Failed to update last_seen", touchError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    const { data: state, error: stateError } = await admin
      .from("device_states")
      .select("desired_light_on, desired_filter_on")
      .eq("device_id", auth.device.id)
      .maybeSingle();

    if (stateError) {
      console.error("Failed to load device state", stateError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    if (!state) {
      const { error: insertError } = await admin.from("device_states").insert({
        device_id: auth.device.id,
      });
      if (insertError) {
        console.error("Failed to create device state", insertError);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    }

    const body: DeviceStateResponse = {
      device_id: auth.device.id,
      desired: {
        light_on: state?.desired_light_on ?? false,
        filter_on: state?.desired_filter_on ?? false,
      },
      poll_interval_seconds: DEFAULT_POLL_INTERVAL_SECONDS,
      server_time: now,
    };

    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    console.error("GET /api/v1/device/state", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
