"use client";

import { useState, useTransition } from "react";
import {
  setDesiredFilter,
  setDesiredLight,
} from "@/app/actions";

type Props = {
  deviceId: string;
  desiredLight: boolean;
  desiredFilter: boolean;
  reportedLight: boolean;
  reportedFilter: boolean;
  isOnline: boolean;
};

export function OutputControls({
  deviceId,
  desiredLight,
  desiredFilter,
  reportedLight,
  reportedFilter,
  isOnline,
}: Props) {
  return (
    <div className="controls">
      <OutputCard
        title="Aquarium Light"
        deviceId={deviceId}
        desired={desiredLight}
        reported={reportedLight}
        isOnline={isOnline}
        onToggle={(on) => setDesiredLight(deviceId, on)}
      />
      <OutputCard
        title="Aquarium Filter"
        deviceId={deviceId}
        desired={desiredFilter}
        reported={reportedFilter}
        isOnline={isOnline}
        onToggle={(on) => setDesiredFilter(deviceId, on)}
      />
    </div>
  );
}

function OutputCard({
  title,
  desired,
  reported,
  isOnline,
  onToggle,
}: {
  title: string;
  deviceId: string;
  desired: boolean;
  reported: boolean;
  isOnline: boolean;
  onToggle: (on: boolean) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(next: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await onToggle(next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <section className="output-card">
      <h2>{title}</h2>
      <dl className="state-meta">
        <div>
          <dt>Desired</dt>
          <dd className={desired ? "on" : "off"}>{desired ? "ON" : "OFF"}</dd>
        </div>
        <div>
          <dt>Actual</dt>
          <dd className={reported ? "on" : "off"}>{reported ? "ON" : "OFF"}</dd>
        </div>
      </dl>
      {!isOnline ? <p className="offline-note">Device offline</p> : null}
      <div className="toggle-row">
        <button
          type="button"
          className={desired ? "active" : ""}
          disabled={pending || desired}
          onClick={() => toggle(true)}
        >
          ON
        </button>
        <button
          type="button"
          className={!desired ? "active off" : "off"}
          disabled={pending || !desired}
          onClick={() => toggle(false)}
        >
          OFF
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
