/** Single-owner DeskFlow — only this email may use the dashboard. */
export function getOwnerEmail(): string | null {
  const email = process.env.DESKFLOW_OWNER_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  const owner = getOwnerEmail();
  if (!owner) {
    // If unset, allow any authenticated user (dev convenience).
    // Set DESKFLOW_OWNER_EMAIL in production so only you can log in.
    return true;
  }
  if (!email) return false;
  return email.trim().toLowerCase() === owner;
}
