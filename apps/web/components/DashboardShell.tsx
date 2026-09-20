"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/app/actions";
import { AutoRefresh } from "@/components/AutoRefresh";
import { OutputControls } from "@/components/OutputControls";
import { SecretsPanel } from "@/components/SecretsPanel";

type Tab = "home" | "secrets";

type Props = {
  email: string;
  deviceId: string;
  deviceName: string;
  lastSeenLabel: string;
  isOnline: boolean;
  pendingKey: string | null;
  desiredLight: boolean;
  desiredFilter: boolean;
  reportedLight: boolean;
  reportedFilter: boolean;
};

export function DashboardShell({
  email,
  deviceId,
  deviceName,
  lastSeenLabel,
  isOnline,
  pendingKey,
  desiredLight,
  desiredFilter,
  reportedLight,
  reportedFilter,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(pendingKey ? "secrets" : "home");
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="dash-app">
      {tab === "home" ? <AutoRefresh /> : null}

      <header className="dash-top">
        <div>
          <p className="brand">DeskFlow</p>
          <p className="user-email">{email}</p>
        </div>
        <button
          type="button"
          className="btn-ghost"
          disabled={signingOut}
          onClick={handleSignOut}
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </header>

      <div className="dash-body">
        {tab === "home" ? (
          <>
            <section className="hero-card">
              <span className="status-pill">
                <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
                {isOnline ? "Online" : "Offline"}
              </span>
              <h1>{deviceName}</h1>
              <p className="meta">Last seen: {lastSeenLabel}</p>
            </section>

            <OutputControls
              deviceId={deviceId}
              desiredLight={desiredLight}
              desiredFilter={desiredFilter}
              reportedLight={reportedLight}
              reportedFilter={reportedFilter}
              isOnline={isOnline}
            />
          </>
        ) : (
          <SecretsPanel deviceId={deviceId} pendingKey={pendingKey} />
        )}
      </div>

      <nav className="tab-bar" aria-label="Main">
        <button
          type="button"
          className={`tab-btn ${tab === "home" ? "active" : ""}`}
          onClick={() => setTab("home")}
        >
          <span className="tab-icon" aria-hidden>
            ⌂
          </span>
          Home
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === "secrets" ? "active" : ""}`}
          onClick={() => setTab("secrets")}
        >
          <span className="tab-icon" aria-hidden>
            ⚙
          </span>
          Secrets
        </button>
      </nav>
    </div>
  );
}
