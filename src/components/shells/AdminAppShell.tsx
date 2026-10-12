import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { AdminPortalContext } from "@/components/admin/AdminPortalNav";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { BrandLoader } from "@/components/BrandLoader";

/**
 * Admin shell (rout.dlp.li): portal context for the sidebar navigation plus a role gate.
 * The gate is UX only — every admin server function re-checks the role.
 * Signed-out visitors fall through to the _authenticated sign-in redirect.
 */
export default function AdminAppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { isAdmin, checking } = useIsAdmin();

  if (user && (loading || checking)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="relative h-24 w-24">
          <BrandLoader label="Beheerrechten controleren…" />
        </div>
      </div>
    );
  }
  if (user && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" aria-hidden />
        <h1 className="font-display text-2xl text-foreground">Geen toegang</h1>
        <p className="max-w-sm text-sm text-muted-foreground">Dit beheerportaal is alleen voor beheerders.</p>
        <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">Terug naar ROUT</Link>
      </div>
    );
  }
  return (
    <AdminPortalContext.Provider value={true}>
      <div data-shell="admin">{children}</div>
    </AdminPortalContext.Provider>
  );
}
