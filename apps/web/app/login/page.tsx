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
        <h1>Welcome back</h1>
        <p className="lede">Your aquarium, from anywhere.</p>
        <Suspense fallback={null}>
          <LoginForm ownerEmail={ownerEmail} />
        </Suspense>
        {ownerEmail ? (
          <p className="auth-footer">
            First time? <Link href="/setup">Create owner account</Link>
          </p>
        ) : (
          <p className="auth-footer muted">
            Set <code>DESKFLOW_OWNER_EMAIL</code> in <code>.env.local</code>.
          </p>
        )}
      </div>
    </main>
  );
}
