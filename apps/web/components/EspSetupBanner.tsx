"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissPendingKey, rotateDeviceKey } from "@/app/actions";

type Props = {
  deviceId: string;
  pendingKey: string | null;
};

export function EspSetupBanner({ deviceId, pendingKey }: Props) {
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

  if (!key) {
    return (
      <section className="panel">
        <h2>ESP32 credentials</h2>
        <p className="muted">
          Device ID is always visible below. If you lost the device key, rotate
          it and update <code>secrets.h</code> on the ESP32.
        </p>
        <p className="device-id">
          Device ID: <code>{deviceId}</code>
        </p>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="button" disabled={pending} onClick={onRotate}>
          {pending ? "Rotating…" : "Generate new device key"}
        </button>
      </section>
    );
  }

  return (
    <section className="panel warn-panel">
      <h2>Copy into ESP32 secrets.h</h2>
      <p>
        Save this key now. Put your Wi‑Fi and Vercel/local API URL in{" "}
        <code>firmware/deskflow-esp32/include/secrets.h</code>, then flash.
      </p>
      <label>
        Device ID
        <input readOnly value={deviceId} />
      </label>
      <label>
        Device Key
        <input readOnly value={key} />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="toggle-row">
        <button type="button" onClick={copyAll}>
          {copied ? "Copied" : "Copy for secrets.h"}
        </button>
        <button type="button" className="ghost" disabled={pending} onClick={onDismiss}>
          I saved it — hide key
        </button>
      </div>
    </section>
  );
}
