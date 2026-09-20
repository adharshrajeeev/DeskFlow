import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDeviceOnline } from "@deskflow/shared";
import { createClient } from "@/lib/supabase/server";
import { PENDING_KEY_COOKIE } from "@/lib/cookies";
import { isOwnerEmail } from "@/lib/owner";
import { BootstrapController } from "@/components/BootstrapController";
import { DashboardShell } from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return "Never";
  const ms = Date.now() - new Date(lastSeen).getTime();
  if (ms < 0) return "Just now";
  if (ms < 1000) return "Just now";
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  return new Date(lastSeen).toLocaleString();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isOwnerEmail(user.email)) {
    await supabase.auth.signOut();
    redirect("/login?error=owner");
  }

  const { data: device } = await supabase
    .from("devices")
    .select("id, name, last_seen, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const cookieStore = await cookies();
  const pendingKey = cookieStore.get(PENDING_KEY_COOKIE)?.value ?? null;

  if (!device) {
    return (
      <div className="dash-app">
        <header className="dash-top">
          <p className="brand">DeskFlow</p>
        </header>
        <div className="dash-body">
          <BootstrapController />
        </div>
      </div>
    );
  }

  const { data: state } = await supabase
    .from("device_states")
    .select(
      "desired_light_on, desired_filter_on, reported_light_on, reported_filter_on",
    )
    .eq("device_id", device.id)
    .maybeSingle();

  return (
    <DashboardShell
      email={user.email ?? ""}
      deviceId={device.id}
      deviceName={device.name}
      lastSeenLabel={formatLastSeen(device.last_seen)}
      isOnline={isDeviceOnline(device.last_seen)}
      pendingKey={pendingKey}
      desiredLight={state?.desired_light_on ?? false}
      desiredFilter={state?.desired_filter_on ?? false}
      reportedLight={state?.reported_light_on ?? false}
      reportedFilter={state?.reported_filter_on ?? false}
    />
  );
}
