import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { checkIntegrationVerify, startIntegrationVerify } from "@/lib/integrations.functions";

type Provider = "bluesky" | "wsocial" | "mastodon" | "github";

/** "Verifieer eigenaarschap": temporary code in the public bio, checked server-side. */
export function VerifyOwnership({ provider, label, onVerified }: { provider: Provider; label: string; onVerified: () => void }) {
  const start = useServerFn(startIntegrationVerify);
  const check = useServerFn(checkIntegrationVerify);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = async () => {
    setBusy(true);
    try {
      const r = await start({ data: { provider } });
      if (r.ok && r.code) setCode(r.code);
      else toast.error("Kon geen code aanmaken");
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    setBusy(true);
    try {
      const { result } = await check({ data: { provider } });
      if (result === "verified") {
        toast.success(`${label} geverifieerd`, { description: "Je mag de code nu uit je bio halen." });
        setCode(null);
        onVerified();
      } else if (result === "not_found") toast.error("Code niet gevonden in je bio", { description: "Sla je bio op en probeer opnieuw." });
      else if (result === "expired") toast.error("Code verlopen", { description: "Vraag een nieuwe code aan." });
      else toast.error(`${label}-profiel niet bereikbaar`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => void open()} disabled={busy} className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-primary/50 text-xs font-medium text-primary hover:bg-primary/10">
        {busy && !code ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
        Verifieer eigenaarschap
      </button>
      <Dialog open={Boolean(code)} onOpenChange={(o) => !o && setCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifieer je {label}-account</DialogTitle>
            <DialogDescription>
              Plak deze code tijdelijk in je biografie op {label} en klik op Controleer. De code is 30 minuten geldig.
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => code && void navigator.clipboard.writeText(code).then(() => toast.success("Gekopieerd"))}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm"
          >
            {code}
            <Copy className="h-4 w-4" aria-label="Kopieer code" />
          </button>
          <DialogFooter>
            <button type="button" onClick={() => void run()} disabled={busy} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Controleer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
