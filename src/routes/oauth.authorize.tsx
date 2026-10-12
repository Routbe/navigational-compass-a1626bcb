import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { RoutLogo } from "@/components/RoutLogo";
import { Check, Eye, KeyRound, Loader2, Mail, ShieldCheck, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  describeAuthorizeRequest,
  decideAuthorizeRequest,
  sendStepUpCode,
  verifyStepUp,
  silentAuthorize,
  type AuthorizePrompt,
} from "@/lib/oauth/console.functions";

type Search = {
  client_id?: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
  nonce?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  response_type?: string;
  prompt?: string;
  max_age?: string;
  acr_values?: string;
  login_hint?: string;
};

export const Route = createFileRoute("/oauth/authorize")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    client_id: typeof search["client_id"] === "string" ? search["client_id"] : undefined,
    redirect_uri: typeof search["redirect_uri"] === "string" ? search["redirect_uri"] : undefined,
    scope: typeof search["scope"] === "string" ? search["scope"] : undefined,
    state: typeof search["state"] === "string" ? search["state"] : undefined,
    nonce: typeof search["nonce"] === "string" ? search["nonce"] : undefined,
    code_challenge:
      typeof search["code_challenge"] === "string" ? search["code_challenge"] : undefined,
    code_challenge_method:
      typeof search["code_challenge_method"] === "string"
        ? search["code_challenge_method"]
        : undefined,
    response_type:
      typeof search["response_type"] === "string" ? search["response_type"] : undefined,
    prompt: typeof search["prompt"] === "string" ? search["prompt"] : undefined,
    max_age:
      typeof search["max_age"] === "string" || typeof search["max_age"] === "number"
        ? String(search["max_age"])
        : undefined,
    acr_values: typeof search["acr_values"] === "string" ? search["acr_values"] : undefined,
    login_hint: typeof search["login_hint"] === "string" ? search["login_hint"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Toestemming geven — Login met ROUT" },
      {
        name: "description",
        content: "Bekijk welke gegevens een app van je ROUT-account wil zien en kies zelf.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Toestemming geven — Login met ROUT" },
      {
        property: "og:description",
        content: "Bekijk welke gegevens een app van je ROUT-account wil zien en kies zelf.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthorizePage,
});

const SCOPE_TEXT: Record<string, { icon: typeof User; text: string }> = {
  openid: { icon: KeyRound, text: "Bevestigen dat jij het bent (een vast, uniek ROUT-ID)." },
  profile: { icon: User, text: "Je openbare naam, handle en profielfoto." },
  email: { icon: Mail, text: "Je e-mailadres en of het bevestigd is." },
  linked_accounts: {
    icon: ShieldCheck,
    text: "Welke accounts (bv. Google, GitHub) je aan ROUT koppelde, om dubbele accounts te voorkomen.",
  },
};

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  github: "GitHub",
  gitlab: "GitLab",
  microsoft: "Microsoft",
  infomaniak: "Infomaniak",
  oidc: "ROUT ID",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
  discord: "Discord",
  linkedin: "LinkedIn",
};

/** "je e-mail en je openbare profiel" — one plain sentence for the requested data. */
function summarize(scopes: string[]): string {
  const parts: string[] = [];
  if (scopes.includes("email")) parts.push("je e-mail");
  if (scopes.includes("profile")) parts.push("je openbare profiel");
  if (scopes.includes("linked_accounts")) parts.push("je gekoppelde accounts");
  if (parts.length === 0) return "Deze app vraagt enkel te bevestigen dat jij het bent.";
  const last = parts.pop();
  return `Deze app vraagt toegang tot ${parts.length ? `${parts.join(", ")} en ${last}` : last}.`;
}

function AuthorizePage() {
  const search = Route.useSearch();
  const { user, loading, signOut } = useAuth();
  const describe = useServerFn(describeAuthorizeRequest);
  const decide = useServerFn(decideAuthorizeRequest);
  const sendCode = useServerFn(sendStepUpCode);
  const verifyCode = useServerFn(verifyStepUp);
  const silent = useServerFn(silentAuthorize);
  const isSilent = (search.prompt ?? "").split(" ").includes("none");
  const [prompt, setPrompt] = useState<AuthorizePrompt | null>(null);
  const [busy, setBusy] = useState(false);
  const [richOptIn, setRichOptIn] = useState(false);
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [stepUpDone, setStepUpDone] = useState(false);

  const payload = {
    clientId: search.client_id ?? "",
    redirectUri: search.redirect_uri ?? "",
    scope: search.scope ?? "openid",
    state: search.state ?? null,
    nonce: search.nonce ?? null,
    codeChallenge: search.code_challenge ?? "",
    codeChallengeMethod: search.code_challenge_method ?? "",
    prompt: search.prompt ?? null,
    maxAge: search.max_age ?? null,
    acrValues: search.acr_values ?? null,
    loginHint: search.login_hint ?? null,
  };

  // Niet ingelogd? Eerst aanmelden, daarna terug naar exact dit scherm.
  // prompt=none: never show a screen — redirect back with a code or an OIDC error.
  useEffect(() => {
    if (!isSilent || loading) return;
    if (!payload.clientId || !payload.redirectUri) {
      setPrompt({ ok: false, error: "Deze aanvraag mist verplichte gegevens." });
      return;
    }
    silent({ data: payload })
      .then((r) => {
        if ("redirectTo" in r) window.location.replace(r.redirectTo);
        else setPrompt({ ok: false, error: r.error });
      })
      .catch(() => setPrompt({ ok: false, error: "De aanvraag kon niet gecontroleerd worden." }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSilent, loading]);

  useEffect(() => {
    if (isSilent || loading || user) return;
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/auth/sign-in?next=${encodeURIComponent(next)}`;
  }, [loading, user]);

  useEffect(() => {
    if (!user || isSilent) return;
    if (search.response_type && search.response_type !== "code") {
      setPrompt({ ok: false, error: "Alleen de veilige code-flow wordt ondersteund." });
      return;
    }
    if (!payload.clientId || !payload.redirectUri) {
      setPrompt({ ok: false, error: "Deze aanvraag mist verplichte gegevens." });
      return;
    }
    describe({ data: payload })
      .then(setPrompt)
      .catch(() => setPrompt({ ok: false, error: "De aanvraag kon niet gecontroleerd worden." }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search.client_id, search.redirect_uri, search.scope, search.code_challenge]);

  async function requestCode() {
    setBusy(true);
    setCodeError(null);
    try {
      const r = await sendCode({ data: { clientId: payload.clientId } });
      if (r.ok) setCodeSentTo(r.sentTo ?? "je e-mailadres");
      else setCodeError(r.error ?? "De code kon niet verstuurd worden.");
    } catch {
      setCodeError("De code kon niet verstuurd worden.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode() {
    if (!/^\d{6}$/.test(code)) {
      setCodeError("Vul de 6 cijfers in.");
      return;
    }
    setBusy(true);
    setCodeError(null);
    try {
      const r = await verifyCode({ data: { clientId: payload.clientId, code } });
      if (r.ok) setStepUpDone(true);
      else setCodeError(r.error);
    } catch {
      setCodeError("Controleren lukte niet. Probeer opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  async function switchAccount() {
    setBusy(true);
    const next = `${window.location.pathname}${window.location.search}`;
    try {
      await signOut();
    } finally {
      window.location.href = `/auth/sign-in?next=${encodeURIComponent(next)}`;
    }
  }

  async function choose(allow: boolean) {
    setBusy(true);
    try {
      const result = await decide({ data: { ...payload, allow, richIdentityOptIn: richOptIn } });
      if ("redirectTo" in result) window.location.href = result.redirectTo;
      else if (result.error.startsWith("Bevestig")) {
        setStepUpDone(false);
        setCodeError(result.error);
      } else setPrompt({ ok: false, error: result.error });
    } catch {
      setPrompt({ ok: false, error: "Er ging iets mis. Probeer het opnieuw." });
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user || !prompt) {
    return (
      <main className="dark flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{!loading && !user ? "Even aanmelden bij ROUT…" : "Aanvraag controleren…"}</span>
        </div>
      </main>
    );
  }

  if (!prompt.ok) {
    return (
      <main className="dark flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl">
          <h1 className="font-display text-xl text-foreground">Deze aanvraag klopt niet</h1>
          <p className="mt-2 text-sm text-muted-foreground">{prompt.error}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            We sturen je hierbij niet terug naar de app: dat zou onveilig zijn.
          </p>
        </div>
      </main>
    );
  }

  const appName = prompt.app?.name ?? "deze app";
  const handle = prompt.account?.handle;
  const needsCode = Boolean(prompt.requiresStepUp) && !stepUpDone;
  const scopes = prompt.scopes ?? [];

  return (
    <main className="dark flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
        {/* App ↔ ROUT */}
        <div className="flex items-center justify-center gap-3">
          {prompt.app?.logoUrl ? (
            <img
              src={prompt.app.logoUrl}
              alt=""
              className="h-12 w-12 rounded-2xl border border-border object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-base font-medium text-muted-foreground">
              {appName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="flex items-center gap-1" aria-hidden>
            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          </span>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background">
            <RoutLogo className="h-6 w-auto" />
          </span>
        </div>

        <h1 className="mt-6 text-center font-display text-2xl leading-tight">
          Aanmelden bij {appName}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">met je ROUT-identiteit</p>

        {/* Ingelogd als */}
        <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Ingelogd als
          </p>
          <div className="mt-3 flex items-center gap-3">
            {prompt.account?.avatarUrl ? (
              <img
                src={prompt.account.avatarUrl}
                alt=""
                className="h-11 w-11 rounded-full border border-border object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-sm text-muted-foreground">
                {(handle ?? prompt.account?.email ?? "?").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {prompt.account?.name || (handle ? `@${handle}` : prompt.account?.email)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {handle ? `rout.be/${handle} · ` : ""}
                {prompt.account?.email}
              </p>
            </div>
            <Check className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </div>
          {(prompt.linkedProviders?.length ?? 0) > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Gekoppeld:</span>
              {prompt.linkedProviders!.map((p) => (
                <span key={p} className="rounded-full border border-border px-2 py-0.5 text-xs capitalize">
                  {PROVIDER_LABEL[p] ?? p}
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={switchAccount}
            disabled={busy}
            className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Ander account gebruiken
          </button>
        </div>
        {scopes.includes("linked_accounts") && (prompt.linkedProviders?.length ?? 0) > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Had je bij {appName} al een account via{" "}
            {prompt.linkedProviders!.map((p) => PROVIDER_LABEL[p] ?? p).join(", ")}? Dan kan {appName} het herkennen en koppelen in plaats van een dubbel account te maken.
          </p>
        )}

        {/* Transparantie */}
        <p className="mt-6 text-sm">{summarize(scopes)}</p>
        <ul className="mt-3 space-y-2">
          {scopes.map((scope) => {
            const item = SCOPE_TEXT[scope];
            const Icon = item?.icon ?? ShieldCheck;
            return (
              <li key={scope} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{item?.text ?? scope}</span>
              </li>
            );
          })}
        </ul>

        {prompt.richIdentity && (
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3 text-sm">
            <Checkbox
              checked={richOptIn}
              onCheckedChange={(v) => setRichOptIn(v === true)}
              aria-label="Openbare activiteit delen"
            />
            <span>
              <span className="flex items-center gap-1.5 font-medium">
                <Eye className="h-3.5 w-3.5" aria-hidden /> Openbare activiteit delen (optioneel)
              </span>
              <span className="text-xs text-muted-foreground">
                Badges en mijlpalen die al publiek op je profiel staan. Niets privé.
              </span>
            </span>
          </label>
        )}

        {/* Strict: inline verificatie */}
        {needsCode && (
          <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4" aria-hidden /> Extra bevestiging vereist
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {appName} vraagt een extra controle. We sturen een eenmalige code van 6 cijfers.
            </p>
            {codeSentTo ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Code verstuurd naar {codeSentTo}.</p>
                <div className="flex gap-2">
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="font-mono tracking-[0.4em]"
                    aria-label="Verificatiecode"
                  />
                  <Button onClick={confirmCode} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Bevestig"}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={requestCode}
                  className="text-xs text-muted-foreground underline"
                  disabled={busy}
                >
                  Nieuwe code sturen
                </button>
              </div>
            ) : (
              <Button variant="outline" className="mt-3 w-full" onClick={requestCode} disabled={busy}>
                <Mail className="h-4 w-4" aria-hidden /> Stuur code per e-mail
              </Button>
            )}
            {codeError && <p className="mt-2 text-xs text-destructive">{codeError}</p>}
          </div>
        )}
        {prompt.requiresStepUp && stepUpDone && (
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5" aria-hidden /> Identiteit bevestigd.
          </p>
        )}

        <Button
          className="mt-6 h-12 w-full rounded-2xl text-base"
          disabled={busy || needsCode}
          onClick={() => choose(true)}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Autoriseren"}
        </Button>
        <Button
          variant="outline"
          className="mt-2 h-11 w-full rounded-2xl"
          disabled={busy}
          onClick={() => choose(false)}
        >
          Weigeren
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {prompt.app?.privacyUrl && (
            <a href={prompt.app.privacyUrl} className="underline" rel="noreferrer noopener">
              Privacybeleid
            </a>
          )}
          {prompt.app?.privacyUrl && prompt.app?.termsUrl ? " · " : ""}
          {prompt.app?.termsUrl && (
            <a href={prompt.app.termsUrl} className="underline" rel="noreferrer noopener">
              Gebruiksvoorwaarden
            </a>
          )}
        </p>
      </div>
    </main>
  );
}
