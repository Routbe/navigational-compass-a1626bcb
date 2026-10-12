/**
 * Build-time hard split (used by vite.config.ts, no runtime imports).
 * Returns a regex for the router generator's `routeFileIgnorePattern`: matching
 * route files are left out of the route tree, so their pages and everything they
 * import never enter the bundle. Tested against single file/folder names.
 */
export type BuildMode = "public" | "admin" | "all";

export function buildMode(env: Record<string, string | undefined>): BuildMode {
  const v = env["VITE_APP_MODE"] || env["APP_MODE"];
  return v === "public" || v === "admin" ? v : "all";
}

/** Admin pages + raw admin API. */
const ADMIN = String.raw`^(admin(\..+)?|api_?\.admin(\..+)?)$`;

/** In admin mode keep only: shell, session gate, admin pages, sign-in and the few public endpoints it needs. */
const ADMIN_KEEP = String.raw`^(?!(__root\.|_authenticated(\.|$)|admin(\.|$)|auth[._]|api_\.auth\.|api_\.public\.(auth|session|cron|health|avatar|proxy-image)\.)).+$`;

export function routeIgnorePattern(mode: BuildMode): string | undefined {
  if (mode === "public") return ADMIN;
  if (mode === "admin") return ADMIN_KEEP;
  return undefined;
}
