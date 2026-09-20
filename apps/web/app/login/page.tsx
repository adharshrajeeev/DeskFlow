import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";
import { getOwnerEmail } from "@/lib/owner";

export default function LoginPage() {
  const ownerEmail = getOwnerEmail();

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="brand">DeskFlow</p>
        <h1>Aquarium control</h1>
        <p className="lede">
          Your private light + filter dashboard. One owner only.
        </p>
        <Suspense fallback={null}>
          <LoginForm ownerEmail={ownerEmail} />
        </Suspense>
        {ownerEmail ? (
          <p className="auth-footer">
            First time? <Link href="/setup">Create owner account</Link>
          </p>
        ) : (
          <p className="auth-footer muted">
            Set <code>DESKFLOW_OWNER_EMAIL</code> in <code>.env.local</code> to
            your email, restart the server, then open{" "}
            <Link href="/setup">/setup</Link>.
          </p>
        )}
      </div>
    </main>
  );
}
