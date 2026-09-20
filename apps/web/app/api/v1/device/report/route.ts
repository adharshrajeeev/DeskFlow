import { NextResponse } from "next/server";
import type { DeviceReportRequest, DeviceReportResponse } from "@deskflow/shared";
import { authenticateDeviceRequest } from "@/lib/device-auth";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const auth = await authenticateDeviceRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const payload = body as Partial<DeviceReportRequest>;
    if (
      typeof payload.light_on !== "boolean" ||
      typeof payload.filter_on !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const admin = createServiceClient();
    const now = new Date().toISOString();

    await admin
      .from("devices")
      .update({
        last_seen: now,
        key_last_used_at: now,
      })
      .eq("id", auth.device.id);

    const { error } = await admin
      .from("device_states")
      .update({
        reported_light_on: payload.light_on,
        reported_filter_on: payload.filter_on,
        reported_at: now,
      })
      .eq("device_id", auth.device.id);

    if (error) {
      console.error("Failed to update reported state", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    const response: DeviceReportResponse = {
      ok: true,
      reported: {
        light_on: payload.light_on,
        filter_on: payload.filter_on,
      },
      server_time: now,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("POST /api/v1/device/report", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
