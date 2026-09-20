import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDeviceOnline } from "@deskflow/shared";
import { createClient } from "@/lib/supabase/server";
import { PENDING_KEY_COOKIE } from "@/lib/cookies";
import { isOwnerEmail } from "@/lib/owner";
import { AutoRefresh } from "@/components/AutoRefresh";
import { BootstrapController } from "@/components/BootstrapController";
import { EspSetupBanner } from "@/components/EspSetupBanner";
import { OutputControls } from "@/components/OutputControls";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return "Never";
  const ms = Date.now() - new Date(lastSeen).getTime();
  if (ms < 0) return "Just now";
  if (ms < 1000) return "Just now";
  if (ms < 60_000) return `${Math.floor(ms / 1000)} seconds ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} minutes ago`;
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

  return (
    <main className="dash-shell">
      <header className="dash-header">
        <div>
          <p className="brand">DeskFlow</p>
          <p className="user-email">{user.email}</p>
        </div>
        <SignOutButton />
      </header>

      {!device ? (
        <BootstrapController />
      ) : (
        <>
          <AutoRefresh />
          <EspSetupBanner deviceId={device.id} pendingKey={pendingKey} />

          <section className="panel">
            <h1>{device.name}</h1>
            <div className="status-row">
              <span
                className={`status-dot ${isDeviceOnline(device.last_seen) ? "online" : "offline"}`}
              />
              <span>
                {isDeviceOnline(device.last_seen) ? "Online" : "Offline"}
              </span>
              <span className="muted">
                Last seen: {formatLastSeen(device.last_seen)}
              </span>
            </div>
          </section>

          <DeviceControls deviceId={device.id} />
        </>
      )}
    </main>
  );
}

async function DeviceControls({ deviceId }: { deviceId: string }) {
  const supabase = await createClient();
  const { data: state } = await supabase
    .from("device_states")
    .select(
      "desired_light_on, desired_filter_on, reported_light_on, reported_filter_on",
    )
    .eq("device_id", deviceId)
    .maybeSingle();

  const { data: device } = await supabase
    .from("devices")
    .select("last_seen")
    .eq("id", deviceId)
    .maybeSingle();

  return (
    <OutputControls
      deviceId={deviceId}
      desiredLight={state?.desired_light_on ?? false}
      desiredFilter={state?.desired_filter_on ?? false}
      reportedLight={state?.reported_light_on ?? false}
      reportedFilter={state?.reported_filter_on ?? false}
      isOnline={isDeviceOnline(device?.last_seen ?? null)}
    />
  );
}
