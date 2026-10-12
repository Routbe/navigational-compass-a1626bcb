import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { BadgeCheck, ExternalLink } from "lucide-react";
import type { ShowcaseCard } from "@/lib/showcase.functions";
import { cn } from "@/lib/utils";

/** Bento layout: first card large, then a repeating wide/square rhythm. */
const SPAN = ["sm:col-span-2 sm:row-span-2", "", "", "sm:col-span-2", "", "sm:row-span-2", "", "sm:col-span-2"];

export function ExploreGallery({ cards, filters = false }: { cards: ShowcaseCard[]; filters?: boolean }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter(
      (c) =>
        (!onlyVerified || c.verified) &&
        (!q || c.handle.toLowerCase().includes(q) || (c.displayName ?? "").toLowerCase().includes(q)),
    );
  }, [cards, query, onlyVerified]);

  if (!cards.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
        <p>{t("explore.empty")}</p>
        <Link to="/tour" className="mt-4 inline-flex font-medium text-foreground underline underline-offset-4">
          {t("explore.cta")}
        </Link>
      </div>
    );
  }

  return (
    <>
      {filters && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("explore.search")}
              aria-label={t("explore.search")}
              className="min-h-11 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none transition-colors focus:border-foreground/50"
            />
          </label>
          <div className="flex gap-2" role="group">
            {([false, true] as const).map((v) => (
              <button
                key={String(v)}
                type="button"
                aria-pressed={onlyVerified === v}
                onClick={() => setOnlyVerified(v)}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                  onlyVerified === v ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t(v ? "explore.filter.verified" : "explore.filter.all")}
              </button>
            ))}
          </div>
        </div>
      )}
      {shown.length === 0 && <p className="py-12 text-center text-muted-foreground">{t("explore.noResults")}</p>}
      <div className="grid auto-rows-[200px] grid-cols-1 gap-4 sm:grid-cols-4">
        {shown.map((c, i) => {
          const big = i === 0;
          return (
            <Link
              key={c.handle}
              to="/$username"
              params={{ username: c.handle }}
              preload="intent"
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 [@media(hover:hover)]:hover:border-foreground/40 [@media(hover:hover)]:hover:shadow-lg animate-in fade-in slide-in-from-bottom-2",
                SPAN[i % SPAN.length],
              )}
            >
              <div className="flex items-center gap-3">
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt="" loading="lazy" className={cn("rounded-full border border-border object-cover", big ? "h-16 w-16" : "h-11 w-11")} />
                ) : (
                  <span className={cn("flex items-center justify-center rounded-full bg-muted font-serif font-semibold text-foreground", big ? "h-16 w-16 text-2xl" : "h-11 w-11 text-lg")}>
                    {(c.displayName ?? c.handle).charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className={cn("flex items-center gap-1.5 truncate font-serif font-semibold text-foreground", big ? "text-2xl" : "text-base")}>
                    {c.displayName ?? c.handle}
                    {c.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label={t("explore.filter.verified")} />}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">rout.be/{c.handle}</p>
                </div>
              </div>
              {(c.tagline || c.bio) && (
                <p className={cn("text-muted-foreground", big ? "line-clamp-4 text-lg leading-relaxed" : "line-clamp-2 text-sm")}>
                  {c.tagline || c.bio}
                </p>
              )}
              <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground opacity-70">
                {t("explore.view")} <ExternalLink className="h-3 w-3" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>

    </>
  );
}
