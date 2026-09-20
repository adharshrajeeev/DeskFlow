"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ensureAquariumController } from "@/app/actions";

/** Creates the single Aquarium Controller on first login (no manual "create space"). */
export function BootstrapController() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await ensureAquariumController();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <section className="panel">
      <h1>Setting up your aquarium…</h1>
      <p className="muted">Preparing light and filter controls.</p>
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
