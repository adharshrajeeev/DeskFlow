"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/app/actions";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="ghost"
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
