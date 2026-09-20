"use client";

import { useEffect, useState, useTransition } from "react";
import { setDesiredFilter, setDesiredLight } from "@/app/actions";
import { ToggleSwitch } from "@/components/ToggleSwitch";

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
    <div className="control-stack">
      <SwitchRow
        title="Aquarium Light"
        desired={desiredLight}
        reported={reportedLight}
        isOnline={isOnline}
        onToggle={(on) => setDesiredLight(deviceId, on)}
      />
      <SwitchRow
        title="Aquarium Filter"
        desired={desiredFilter}
        reported={reportedFilter}
        isOnline={isOnline}
        onToggle={(on) => setDesiredFilter(deviceId, on)}
      />
    </div>
  );
}

function SwitchRow({
  title,
  desired,
  reported,
  isOnline,
  onToggle,
}: {
  title: string;
  desired: boolean;
  reported: boolean;
  isOnline: boolean;
  onToggle: (on: boolean) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState(desired);

  useEffect(() => {
    setOptimistic(desired);
  }, [desired]);

  function handleChange(next: boolean) {
    setError(null);
    setOptimistic(next);
    startTransition(async () => {
      const result = await onToggle(next);
      if (!result.ok) {
        setOptimistic(!next);
        setError(result.error);
      }
    });
  }

  return (
    <section className={`switch-card ${optimistic ? "is-on" : ""}`}>
      <div>
        <h2>{title}</h2>
        <p className="switch-meta">
          Desired <strong>{optimistic ? "ON" : "OFF"}</strong>
          {" · "}
          Actual <strong>{reported ? "ON" : "OFF"}</strong>
        </p>
        {!isOnline ? <span className="offline-chip">Device offline</span> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </div>
      <ToggleSwitch
        label={`${title} ${optimistic ? "on" : "off"}`}
        checked={optimistic}
        disabled={pending}
        onChange={handleChange}
      />
    </section>
  );
}
