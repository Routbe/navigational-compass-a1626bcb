import { describe, expect, it } from "vitest";
import { modeDecision, socialLoginAllowed } from "@/lib/app-mode";

describe("app mode split", () => {
  it("public mode returns 404 for admin pages and admin API", () => {
    expect(modeDecision("public", "/admin")).toEqual({ kind: "notFound" });
    expect(modeDecision("public", "/admin/custom-badges")).toEqual({ kind: "notFound" });
    expect(modeDecision("public", "/api/admin/users")).toEqual({ kind: "notFound" });
    expect(modeDecision("public", "/@jona")).toEqual({ kind: "allow" });
  });

  it("admin mode redirects the root and public profiles to the admin sign-in", () => {
    expect(modeDecision("admin", "/").kind).toBe("redirect");
    expect(modeDecision("admin", "/@jona").kind).toBe("redirect");
    expect(modeDecision("admin", "/admin")).toEqual({ kind: "allow" });
    expect(modeDecision("admin", "/auth/sign-in")).toEqual({ kind: "allow" });
  });

  it("admin mode refuses social login", () => {
    expect(socialLoginAllowed("admin")).toBe(false);
    expect(socialLoginAllowed("public")).toBe(true);
  });
});
