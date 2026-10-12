/**
 * Split-brain deployment mode (client-safe).
 *
 *   public — rout.be: every /admin surface is a hard 404.
 *   admin  — rout.dlp.li: only the admin portal + its sign-in; no social login, noindex.
 *   all    — unset (preview / single deploy): everything served, as before.
 *
 * Set via VITE_APP_MODE (build time, both bundles); the server also honours APP_MODE.
 */
export type AppMode = "public" | "admin" | "all";

const parse = (v: unknown): AppMode | null => (v === "public" || v === "admin" ? v : null);

export function appMode(): AppMode {
  const server = typeof process !== "undefined" ? parse(process.env?.["APP_MODE"]) : null;
  return server ?? parse(import.meta.env["VITE_APP_MODE"]) ?? "all";
}

export const isAdminMode = () => appMode() === "admin";
export const isPublicMode = () => appMode() === "public";

/** Admin-only surfaces (pages + raw API). */
export function isAdminPath(pathname: string): boolean {
  return /^\/(admin|api_?\/admin)(\/|$)/.test(pathname);
}

/** Paths the admin portal may serve; everything else redirects to the admin sign-in. */
export function isAdminPortalPath(pathname: string): boolean {
  return (
    isAdminPath(pathname) ||
    /^\/(auth|api\/auth|api_\/auth|_serverFn|assets|@(vite|fs|id|react-refresh)|src\/|node_modules\/|__)/.test(pathname) ||
    /^\/api\/public\/(cron|altcha)/.test(pathname) ||
    /\.(js|css|map|png|svg|ico|webmanifest|json|txt|woff2?)$/.test(pathname)
  );
}

export type ModeDecision = { kind: "allow" } | { kind: "notFound" } | { kind: "redirect"; to: string };

/** Single routing decision used by both the server middleware and the router. */
export function modeDecision(mode: AppMode, pathname: string): ModeDecision {
  if (mode === "public" && isAdminPath(pathname)) return { kind: "notFound" };
  if (mode === "admin" && !isAdminPortalPath(pathname)) {
    return { kind: "redirect", to: "/auth/sign-in?redirect=%2Fadmin" };
  }
  return { kind: "allow" };
}

/** Social/OAuth sign-in is never allowed on the admin portal. */
export function socialLoginAllowed(mode: AppMode): boolean {
  return mode !== "admin";
}
