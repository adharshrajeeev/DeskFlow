import { redirect } from "next/navigation";

/** Public signup disabled — DeskFlow is single-owner. */
export default function SignupPage() {
  redirect("/login");
}
