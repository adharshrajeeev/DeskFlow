"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOwnerAccount } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";

/** First-time setup for the single owner only — no email verification. */
export function OwnerSetupForm({ ownerEmail }: { ownerEmail: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const created = await createOwnerAccount(password);
    if (!created.ok) {
      setLoading(false);
      setError(created.error);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: ownerEmail,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="auth-form">
      <label>
        Owner email
        <input type="email" readOnly value={ownerEmail} />
      </label>
      <label>
        Choose a password
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create my DeskFlow account"}
      </button>
    </form>
  );
}
