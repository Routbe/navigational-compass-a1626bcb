import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Users } from "lucide-react";
import { getPublicCustomBadges } from "@/lib/custom-badges.functions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BadgeEmblem } from "./BadgeEmblem";

type Item = Awaited<ReturnType<typeof getPublicCustomBadges>>[number];

const KIND_LABEL: Record<Item["kind"], string> = {
  crest: "Wapenschild",
  emblem: "Embleem",
  award: "Onderscheiding",
  partner: "Partner",
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

/** Digitaal paspoort: badges as stamps; a click opens the stamp with date, emblem and reason. */
export function ProfilePassport({ handle, theme }: { handle: string | null | undefined; theme: { card: string; border: string; text: string; muted: string } }) {
  const load = useServerFn(getPublicCustomBadges);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState<Item | null>(null);
  useEffect(() => {
    if (!handle) return;
    let alive = true;
    void load({ data: { handle } })
      .then((r) => alive && setItems(r))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [handle, load]);
  if (items.length === 0) return null;
  const since = formatDate(open?.grantedAt ?? null);
  return (
    <>
      <section aria-label="Digitaal paspoort" className={`mt-6 w-full rounded-2xl border p-4 ${theme.card} ${theme.border}`}>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className={`font-display text-sm uppercase tracking-[0.2em] ${theme.text}`}>Digitaal paspoort</h2>
          <span className={`text-xs ${theme.muted}`}>{items.length} {items.length === 1 ? "stempel" : "stempels"}</span>
        </header>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((b, i) => (
            <li key={b.slug}>
              <button
                type="button"
                onClick={() => setOpen(b)}
                aria-label={`${b.name} — stempel bekijken`}
                style={{ borderColor: b.accentColor ?? undefined, rotate: `${((i * 37) % 13) - 6}deg` }}
                className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-primary/60 p-2 transition-transform hover:rotate-0 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BadgeEmblem badge={b} size={40} />
                <span className={`line-clamp-1 text-[10px] font-medium uppercase tracking-wide ${theme.text}`}>{b.name}</span>
                {b.grantedAt && <span className={`text-[9px] ${theme.muted}`}>{new Date(b.grantedAt).toLocaleDateString("nl-BE", { month: "short", year: "numeric" })}</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-sm text-center">
          {open && (
            <>
              <div
                className="mx-auto -mt-2 grid h-32 w-32 place-items-center rounded-full"
                style={{ background: `radial-gradient(circle, ${open.accentColor ?? "var(--primary)"}33 0%, transparent 70%)` }}
              >
                <div className="animate-in zoom-in-50 duration-300">
                  <BadgeEmblem badge={open} size={104} />
                </div>
              </div>
              <DialogHeader className="items-center space-y-1 sm:text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{KIND_LABEL[open.kind]}</p>
                <DialogTitle className="font-display text-2xl">{open.name}</DialogTitle>
                {open.motto && <p className="font-serif text-sm italic">“{open.motto}”</p>}
                <DialogDescription>{open.description ?? `Toegekend door ROUT aan @${handle}.`}</DialogDescription>
              </DialogHeader>
              {open.story && <p className="whitespace-pre-line text-left text-sm leading-relaxed">{open.story}</p>}
              {open.reason && (
                <p className="rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Voor @{handle}: </span>
                  {open.reason}
                </p>
              )}
              <dl className="grid grid-cols-2 gap-2 text-left text-xs">
                {since && (
                  <div className="rounded-lg border border-border p-2">
                    <dt className="text-muted-foreground">Toegekend</dt>
                    <dd className="font-medium">{since}</dd>
                  </div>
                )}
                <div className="rounded-lg border border-border p-2">
                  <dt className="text-muted-foreground">Houders</dt>
                  <dd className="flex items-center gap-1 font-medium">
                    <Users className="h-3 w-3" aria-hidden /> {open.holders}
                  </dd>
                </div>
              </dl>
              {open.issuerName && (
                <p className="text-xs text-muted-foreground">
                  Uitgegeven door{" "}
                  {open.issuerUrl ? (
                    <a href={open.issuerUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-0.5 underline">
                      {open.issuerName} <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : (
                    open.issuerName
                  )}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
