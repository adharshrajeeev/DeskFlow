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
          {signingOut ? "…" : "Sign Out"}
        </button>
      </header>

      <div className="dash-body">
        {tab === "home" ? (
          <>
            <section className="hero-card">
              <span className="status-pill">
                <span
                  className={`status-dot ${isOnline ? "online" : "offline"}`}
                />
                {isOnline ? "Online" : "Offline"}
              </span>
              <h1>{deviceName}</h1>
              <p className="meta">Last seen {lastSeenLabel}</p>
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
          <svg className="tab-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 3.2 3.5 10.2a1 1 0 0 0-.3.7V20a1 1 0 0 0 1 1h5.2v-5.5h5.2V21H19.8a1 1 0 0 0 1-1v-9.1a1 1 0 0 0-.3-.7L12 3.2Z" />
          </svg>
          Home
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === "secrets" ? "active" : ""}`}
          onClick={() => setTab("secrets")}
        >
          <svg className="tab-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12.8 2.5a5.3 5.3 0 0 0-5.2 5.8l-5 5V18h4.7v-2.2H9.5v-2.2h2.2l1.4-1.4A5.3 5.3 0 1 0 12.8 2.5Zm3.1 3.2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
          </svg>
          Secrets
        </button>
      </nav>
    </div>
  );
}
