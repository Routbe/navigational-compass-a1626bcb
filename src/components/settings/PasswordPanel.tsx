import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField, isPasswordCompliant } from "@/components/PasswordField";
import { getPasswordState, requestSecurityCode, setAccountPassword } from "@/lib/account-security.functions";

export const PASSWORD_STATE_KEY = ["password-state"];

/**
 * Password: change with the current one, or — never set / forgotten — with a
 * 6-digit code sent to the account's e-mail.
 */
export function PasswordPanel() {
  const qc = useQueryClient();
  const state = useQuery({ queryKey: PASSWORD_STATE_KEY, queryFn: useServerFn(getPasswordState) });
  const askCode = useServerFn(requestSecurityCode);
  const save = useServerFn(setAccountPassword);
  const has = state.data?.hasPassword ?? false;

  const [useCode, setUseCode] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const codeMode = !has || useCode;

  const sendCode = async () => {
    setBusy(true);
    try {
      const r = await askCode({ data: { purpose: "password" } });
      if (r.ok) {
        setSentTo(r.sentTo);
        toast.success(`Code verstuurd naar ${r.sentTo}`);
      } else toast.error(r.reason === "rate_limited" ? "Te veel aanvragen. Probeer later opnieuw." : "Geen e-mailadres gevonden.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (next !== confirm) return toast.error("De wachtwoorden zijn niet gelijk.");
    setBusy(true);
    try {
      const r = await save({ data: { newPassword: next, ...(codeMode ? { code } : { currentPassword: current }) } });
      if (!r.ok) {
        return toast.error(r.reason === "bad_code" ? "Deze code klopt niet of is verlopen." : r.reason === "bad_password" ? "Je huidige wachtwoord klopt niet." : "Er ging iets mis.");
      }
      toast.success(has ? "Je wachtwoord is gewijzigd." : "Je wachtwoord is ingesteld.");
      setCurrent(""); setNext(""); setConfirm(""); setCode(""); setSentTo(null); setUseCode(false);
      await qc.invalidateQueries({ queryKey: PASSWORD_STATE_KEY });
    } catch {
      toast.error("Er ging iets mis.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-lg font-medium">
        <KeyRound className="h-4 w-4" /> Wachtwoord
      </h2>
      {state.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {has
              ? "Wijzig je wachtwoord met je huidige wachtwoord."
              : "Je hebt nog geen wachtwoord (je logt in met Google, Apple, een passkey…). Stel er een in met een code via e-mail."}
          </p>

          {codeMode ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={sendCode} disabled={busy} className="h-11">
                {sentTo ? "Nieuwe code sturen" : "Stuur code naar mijn e-mail"}
              </Button>
              {sentTo && (
                <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} maxLength={6}
                  inputMode="numeric" autoComplete="one-time-code" placeholder="123456" aria-label="Code uit e-mail"
                  className="h-11 w-36 rounded-xl text-center font-mono tracking-[0.3em]" />
              )}
            </div>
          ) : (
            <Input value={current} type="password" placeholder="Huidig wachtwoord" maxLength={128}
              autoComplete="current-password" onChange={(e) => setCurrent(e.target.value)} className="h-11 rounded-xl" />
          )}

          <PasswordField label={has ? "Nieuw wachtwoord" : "Wachtwoord"} value={next} onChange={setNext} />
          <Input value={confirm} type="password" placeholder="Herhaal wachtwoord" maxLength={128}
            autoComplete="new-password" onChange={(e) => setConfirm(e.target.value)} className="h-11 rounded-xl" />

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={submit}
              disabled={busy || !isPasswordCompliant(next) || (codeMode ? code.length !== 6 : !current)}
              className="h-11">
              {has ? "Wachtwoord wijzigen" : "Wachtwoord instellen"}
            </Button>
            {has && (
              <button type="button" onClick={() => setUseCode((v) => !v)}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                {useCode ? "Ik weet mijn wachtwoord" : "Wachtwoord vergeten? Gebruik een code via e-mail"}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
