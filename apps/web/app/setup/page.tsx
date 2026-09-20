import Link from "next/link";
import { redirect } from "next/navigation";
import { OwnerSetupForm } from "@/components/OwnerSetupForm";
import { getOwnerEmail } from "@/lib/owner";

export default function SetupPage() {
  const ownerEmail = getOwnerEmail();

  if (!ownerEmail) {
    redirect("/login");
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="brand">DeskFlow</p>
        <h1>First-time setup</h1>
        <p className="lede">
          Create the single owner account for your aquarium. No email
          verification — you can sign in right away.
        </p>
        <OwnerSetupForm ownerEmail={ownerEmail} />
        <p className="auth-footer">
          Already set up? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
