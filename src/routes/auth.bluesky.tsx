import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import {
  finishBlueskyLogin,
  getPendingBlueskyLogin,
  requestFediverseEmailCode,
} from "@/lib/bluesky-login.functions";

/**
 * Laatste stap na een geslaagde Bluesky-aanmelding: Bluesky geeft geen
 * e-mailadres door, en zonder e-mailadres bestaat er geen ROUT-account.
 */
export const Route = createFileRoute("/auth/bluesky")({
  head: () => ({
    meta: [
      { title: "Je ROUT-account voltooien" },
      {
        name: "description",
        content: "Bevestig je e-mailadres met een code om je aanmelding via Bluesky of Mastodon af te ronden.",
      },
      { property: "og:title", content: "Je ROUT-account voltooien" },
      {
        property: "og:description",
        content: "Bevestig je e-mailadres met een code om je aanmelding via Bluesky of Mastodon af te ronden.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BlueskyEmailStep,
});

function BlueskyEmailStep() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [handle, setHandle] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getPendingBlueskyLogin({})
      .then((res) => {
        setHandle(res.handle);
        setProvider(res.provider);
      })
      .catch(() => setHandle(null));
  }, []);

  const providerLabel = provider === "mastodon" ? "Mastodon" : "Bluesky";

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await requestFediverseEmailCode({ data: { email } });
      setStep("code");
      toast.success("We hebben je een code gestuurd.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dat lukte niet. Probeer opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await finishBlueskyLogin({ data: { code } });
      await refresh();
      void nav({ to: res.next as never, replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dat lukte niet. Probeer opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-7">
          <h1 className="mb-1 font-display text-2xl text-foreground">
            {step === "email" ? "Nog één stap" : "Controleer je mailbox"}
          </h1>
          <p className="mb-4 text-sm text-muted-foreground">
            {step === "email"
              ? `${handle ? `${handle} is bevestigd bij ${providerLabel}. ` : ""}Vul je e-mailadres in om je ROUT-account te voltooien.`
              : `We stuurden een code van 6 cijfers naar ${email}. Pas na deze code wordt je account gekoppeld.`}
          </p>
          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="bsky-email" className="text-sm">E-mailadres</Label>
                <Input
                  id="bsky-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jij@domein.be"
                  autoComplete="email"
                  maxLength={254}
                  required
                  className="h-10 rounded-lg"
                />
              </div>
              <Button type="submit" className="h-11 w-full rounded-lg font-medium" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Stuur code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="bsky-code" className="text-sm">Code</Label>
                <Input
                  id="bsky-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  className="h-10 rounded-lg text-center font-mono text-lg tracking-[0.4em]"
                />
              </div>
              <Button type="submit" className="h-11 w-full rounded-lg font-medium" disabled={loading || code.length !== 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Account bevestigen"}
              </Button>
              <div className="flex justify-between text-xs text-muted-foreground">
                <button type="button" className="hover:text-foreground" onClick={() => setStep("email")}>
                  Ander e-mailadres
                </button>
                <button type="button" className="hover:text-foreground" disabled={loading} onClick={() => void sendCode()}>
                  Code opnieuw sturen
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
