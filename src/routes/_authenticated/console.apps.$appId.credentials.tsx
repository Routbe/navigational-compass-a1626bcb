import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ConsoleCard, ConsolePage } from "@/components/console/ConsolePage";
import { errorText } from "@/components/console/console-data";
import { useAppPage } from "@/components/console/useAppPage";
import { rotateOAuthSecret } from "@/lib/oauth/console.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/console/apps/$appId/credentials")({
  component: CredentialsPage,
});

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
        <code className="flex-1 break-all text-xs">{value}</code>
        <button type="button" aria-label={`Kopieer ${label}`} onClick={() => { navigator.clipboard.writeText(value); toast.success("Gekopieerd"); }}>
          <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>
  );
}

function CredentialsPage() {
  const { appId } = Route.useParams();
  const { app } = useAppPage(appId);
  const rotate = useServerFn(rotateOAuthSecret);
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const origin = typeof window === "undefined" ? "https://rout.be" : window.location.origin;

  return (
    <ConsolePage title="Credentials" description="Sleutels waarmee je app zich bij ROUT aanmeldt.">
      <ConsoleCard>
        <div className="space-y-4">
          <CopyField label="Client ID" value={app.clientId} />
          {secret ? (
            <div className="space-y-2">
              <CopyField label="Nieuw client secret (wordt maar één keer getoond)" value={secret} />
            </div>
          ) : (
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Client secret</p>
              <p className="text-sm">{app.hasSecret ? "••••••••••••••••  (verborgen, enkel bij aanmaak zichtbaar)" : "Nog geen secret"}</p>
            </div>
          )}
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              if (!confirm("Nieuw secret aanmaken? Het oude werkt meteen niet meer.")) return;
              setBusy(true);
              try { setSecret((await rotate({ data: { id: app.id } })).clientSecret); }
              catch (e) { toast.error(errorText(e, "Vernieuwen mislukt.")); }
              finally { setBusy(false); }
            }}
          >
            <RefreshCw className="h-4 w-4" /> Secret vernieuwen
          </Button>
        </div>
      </ConsoleCard>
      <ConsoleCard title="Endpoints">
        <div className="space-y-3">
          <CopyField label="Discovery" value={`${origin}/.well-known/openid-configuration`} />
        </div>
      </ConsoleCard>
    </ConsolePage>
  );
}
