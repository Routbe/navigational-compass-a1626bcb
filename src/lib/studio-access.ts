/** Verified-profile tab is unlocked only for verified, active (or paid) accounts. Pure + testable. */
export function verifiedTabUnlocked(state: { verified: boolean; status?: string | null; isPaid?: boolean } | null | undefined): boolean {
  if (!state) return false;
  return state.verified && (state.status === "active" || Boolean(state.isPaid));
}
