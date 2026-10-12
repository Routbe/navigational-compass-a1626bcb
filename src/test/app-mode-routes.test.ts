import { describe, expect, it } from "vitest";
import { routeIgnorePattern } from "@/lib/app-mode-routes";

const ignored = (mode: "public" | "admin", name: string) => new RegExp(routeIgnorePattern(mode)!).test(name);

describe("build-time route split", () => {
  it("public build drops admin routes only", () => {
    for (const n of ["admin.tsx", "admin.members.tsx", "admin.index.tsx", "api_.admin.users.ts"]) expect(ignored("public", n)).toBe(true);
    for (const n of ["__root.tsx", "index.tsx", "$username.tsx", "_authenticated", "dashboard.tsx", "auth.tsx"]) expect(ignored("public", n)).toBe(false);
  });
  it("admin build keeps only the portal and sign-in", () => {
    for (const n of ["__root.tsx", "_authenticated.tsx", "_authenticated", "admin.tsx", "admin.sepa.tsx", "auth.$authView.tsx", "auth_.continue.ts", "api_.auth.$.ts", "api_.public.cron.purge-altcha.ts"]) expect(ignored("admin", n)).toBe(false);
    for (const n of ["index.tsx", "$username.tsx", "dashboard.tsx", "console.tsx", "studio.tsx", "api_.public.stripe-webhook.ts"]) expect(ignored("admin", n)).toBe(true);
  });
  it("unset mode keeps everything", () => expect(routeIgnorePattern("all")).toBeUndefined());
});
