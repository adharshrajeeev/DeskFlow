"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/app/actions";

/** @deprecated Prefer DashboardShell sign-out; kept for any leftover imports. */
export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={async () => {
        await signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
