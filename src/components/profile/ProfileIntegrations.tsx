import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { BrandIcon } from "@/components/integrations/BrandIcon";
import { integrationById } from "@/lib/integrations-catalog";
import { paymentUri } from "@/lib/integrations-rules";
import { proxied } from "@/lib/image-proxy-rules";

type Item = {
  provider: string;
  handle: string;
  verified: boolean;
  status: {
    title?: string;
    subtitle?: string;
    url?: string;
    image?: string | null;
    bio?: string;
    stats?: { label: string; value: number }[];
    videos?: { title: string; url: string; date: string | null; thumb: string }[];
    posts?: { title: string; url: string; date: string | null }[];
    chess?: { blitz?: number | null; rapid?: number | null; online?: boolean | null; challengeUrl?: string };
  } | null;
};
type Theme = { card: string; border: string; text: string; muted: string };

/** Live connection cards on a public profile. External images go through the privacy proxy. */
export function ProfileIntegrations({ handle, theme, mode = null }: { handle: string; theme: Theme; mode?: "pro" | "social" | null }) {
  const q = useQuery({
    queryKey: ["profile-integrations", handle, mode],
    queryFn: async (): Promise<Item[]> => {
      const r = await fetch(`/api/public/integrations?handle=${encodeURIComponent(handle)}${mode ? `&mode=${mode}` : ""}`);
      return r.ok ? ((await r.json()) as { items: Item[] }).items : [];
    },
    staleTime: 60_000,
  });
  const items = q.data ?? [];
  if (items.length === 0) return null;
  return (
    <div className="mt-4 grid w-full max-w-sm gap-2">
      {items.map((it) => (
        <Card key={it.provider} item={it} theme={theme} />
      ))}
    </div>
  );
}

function ChessCard({ item, theme }: { item: Item; theme: Theme }) {
  const meta = integrationById(item.provider);
  const c = item.status?.chess ?? {};
  const img = proxied(item.status?.image);
  const online = c.online === true;
  return (
    <div className="flex items-center gap-3 rounded-2xl p-2.5" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
      <a href={item.status?.url} target="_blank" rel="noopener noreferrer" className="relative shrink-0">
        {img ? (
          <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-11 w-11 rounded-lg object-cover" />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ border: `1px solid ${theme.border}` }}>
            <BrandIcon icon={meta?.icon ?? null} className="h-5 w-5" />
          </span>
        )}
        {online && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3" aria-label="Nu online" title="Nu online">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 bg-emerald-500" style={{ borderColor: theme.card }} />
          </span>
        )}
      </a>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: theme.muted }}>
          {meta?.label}
          {online && <span className="normal-case tracking-normal text-emerald-500">· online</span>}
        </span>
        <span className="block truncate text-sm font-medium">{item.status?.title ?? item.handle}</span>
        <span className="mt-0.5 flex gap-1.5 text-[11px] tabular-nums" style={{ color: theme.muted }}>
          {c.blitz ? <span className="rounded px-1.5" style={{ border: `1px solid ${theme.border}` }}>⚡ {c.blitz}</span> : null}
          {c.rapid ? <span className="rounded px-1.5" style={{ border: `1px solid ${theme.border}` }}>⏱ {c.rapid}</span> : null}
        </span>
      </span>
      {c.challengeUrl && (
        <a
          href={c.challengeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: theme.text, color: theme.card }}
        >
          Uitdagen
        </a>
      )}
    </div>
  );
}

function FeedCard({ item, theme }: { item: Item; theme: Theme }) {
  const posts = item.status?.posts ?? [];
  return (
    <div className="rounded-2xl p-3 text-left" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider" style={{ color: theme.muted }}>
        <BrandIcon icon="siRss" className="h-3 w-3" /> Laatste posts · {item.status?.title}
      </span>
      <ul className="mt-2 space-y-1.5">
        {posts.map((p) => (
          <li key={p.url}>
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80">
              <span className="block truncate text-sm font-medium">{p.title}</span>
              {p.date && <span className="text-[11px]" style={{ color: theme.muted }}>{new Date(p.date).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" })}</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VideoCard({ item, theme }: { item: Item; theme: Theme }) {
  const videos = item.status?.videos ?? [];
  return (
    <div className="rounded-2xl p-3 text-left" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
      <a href={item.status?.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider hover:opacity-80" style={{ color: theme.muted }}>
        <BrandIcon icon="siYoutube" className="h-3 w-3" /> Nieuwste video's · {item.status?.title}
      </a>
      <ul className="mt-2 space-y-2">
        {videos.map((v) => {
          const img = proxied(v.thumb);
          return (
            <li key={v.url}>
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:opacity-80">
                {img ? (
                  <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" className="aspect-video w-24 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="aspect-video w-24 shrink-0 rounded-lg" style={{ border: `1px solid ${theme.border}` }} />
                )}
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm font-medium">{v.title}</span>
                  {v.date && <span className="text-[11px]" style={{ color: theme.muted }}>{new Date(v.date).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" })}</span>}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Card({ item, theme }: { item: Item; theme: Theme }) {
  if (item.status?.chess) return <ChessCard item={item} theme={theme} />;
  if (item.status?.videos?.length) return <VideoCard item={item} theme={theme} />;
  if (item.status?.posts?.length) return <FeedCard item={item} theme={theme} />;
  const meta = integrationById(item.provider);
  const [showQr, setShowQr] = useState(false);
  const pay = paymentUri(item.provider, item.handle);
  const img = proxied(item.status?.image);
  const body = (
    <div className="flex items-center gap-3 rounded-2xl p-2.5 pr-4" style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
      {img ? (
        <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ border: `1px solid ${theme.border}` }}>
          <BrandIcon icon={meta?.icon ?? null} className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: theme.muted }}>
          {meta?.label ?? item.provider}
          {item.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-label="Geverifieerd account" />}
        </span>
        <span className="block truncate text-sm font-medium">{pay ? "Steun mij" : item.status?.title ?? item.handle}</span>
        <span className="block truncate text-xs" style={{ color: theme.muted }}>
          {pay ? item.handle : item.status?.subtitle ?? ""}
        </span>
        {!pay && item.status?.bio && <span className="mt-0.5 line-clamp-2 text-xs" style={{ color: theme.muted }}>{item.status.bio}</span>}
        {!pay && item.status?.stats?.length ? (
          <span className="mt-1 flex gap-1.5 text-[11px] tabular-nums" style={{ color: theme.muted }}>
            {item.status.stats.map((st) => (
              <span key={st.label} className="rounded px-1.5" style={{ border: `1px solid ${theme.border}` }}>{st.value.toLocaleString("nl-BE")} {st.label}</span>
            ))}
          </span>
        ) : null}
      </span>
      {pay && <QrCode className="h-4 w-4 shrink-0" aria-hidden />}
    </div>
  );
  if (pay) {
    return (
      <div>
        <button type="button" className="w-full" onClick={() => setShowQr((v) => !v)} aria-expanded={showQr} aria-label={`${meta?.label} QR-code tonen`}>
          {body}
        </button>
        {showQr && (
          <div className="mt-2 flex flex-col items-center gap-2 rounded-2xl p-3" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="rounded-lg bg-background p-2">
              <QRCodeSVG value={pay} size={160} />
            </div>
            <a href={pay} className="text-xs underline" style={{ color: theme.text }}>
              Open in wallet
            </a>
          </div>
        )}
      </div>
    );
  }
  return item.status?.url ? (
    <a href={item.status.url} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    body
  );
}
