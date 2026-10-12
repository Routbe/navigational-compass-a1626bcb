import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { canSwitchShellMode, isAdminPath, MODE_OVERRIDE_KEY, type ShellMode } from "@/lib/app-mode";
import { cn } from "@/lib/utils";

/** Floating [Publiek] / [Admin] switch for development and previews; never on pinned builds. */
export function DevModeToggle() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(canSwitchShellMode()), []);
  if (!visible) return null;
  const active: ShellMode = isAdminPath(path) ? "admin" : "public";

  const pick = (mode: ShellMode) => {
    try {
      window.localStorage.setItem(MODE_OVERRIDE_KEY, mode);
    } catch {
      /* storage blocked */
    }
    void navigate({ to: mode === "admin" ? "/admin" : "/" } as never);
  };

  return (
    <div role="group" aria-label="Weergave wisselen" className="fixed bottom-3 left-1/2 z-[100] flex -translate-x-1/2 gap-1 rounded-full border border-border bg-background/90 p-1 text-xs shadow-lg backdrop-blur">
      {(["public", "admin"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={active === m}
          onClick={() => pick(m)}
          className={cn("rounded-full px-3 py-1", active === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {m === "public" ? "Publiek" : "Admin"}
        </button>
      ))}
    </div>
  );
}
