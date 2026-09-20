"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissPendingKey, rotateDeviceKey } from "@/app/actions";

type Props = {
  deviceId: string;
  pendingKey: string | null;
};

export function SecretsPanel({ deviceId, pendingKey }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [key, setKey] = useState(pendingKey);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onDismiss() {
    startTransition(async () => {
      await dismissPendingKey();
      setKey(null);
      router.refresh();
    });
  }

  function onRotate() {
    setError(null);
    startTransition(async () => {
      const result = await rotateDeviceKey(deviceId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setKey(result.deviceKey);
      setCopied(false);
      router.refresh();
    });
  }

  async function copyAll() {
    if (!key) return;
    const text = [
      `#define DEVICE_ID "${deviceId}"`,
      `#define DEVICE_KEY "${key}"`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <div className="secrets-card warn">
      <h2>Device secrets</h2>
      <p>
        Paste these into{" "}
        <code>firmware/deskflow-esp32/include/secrets.h</code> on your ESP.
        The device key is shown only when generated — store it safely.
      </p>

      <div className="field">
        <label>
          Device ID
          <div className="mono-box">{deviceId}</div>
        </label>
      </div>

      {key ? (
        <>
          <div className="field">
            <label>
              Device Key (one-time)
              <div className="mono-box">{key}</div>
            </label>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="action-row">
            <button type="button" className="btn" onClick={copyAll}>
              {copied ? "Copied" : "Copy for secrets.h"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={pending}
              onClick={onDismiss}
            >
              Hide key
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Key is hidden. Generate a new one if you lost it — then update the
            ESP and re-flash.
          </p>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="action-row">
            <button
              type="button"
              className="btn-secondary"
              disabled={pending}
              onClick={onRotate}
            >
              {pending ? "Generating…" : "Generate new device key"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
