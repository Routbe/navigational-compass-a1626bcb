import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPublicSnapchat } from "@/lib/snapchat.functions";
import { proxied } from "@/lib/image-proxy-rules";

type T = { card: string; border: string; text: string; muted: string };

/** Public Snapchat card + manual mood widget (opt-in, no location). */
export function SnapchatProfile({ handle, theme }: { handle: string; theme: T }) {
  const fetchSnap = useServerFn(getPublicSnapchat);
  const { data } = useQuery({ queryKey: ["public-snapchat", handle], queryFn: () => fetchSnap({ data: { handle } }), staleTime: 60_000 });
  if (!data) return null;
  const box = { background: theme.card, borderColor: theme.border, color: theme.text };
  return (
    <div className="mt-3 flex w-full flex-col gap-2">
      {data.mood && (
        <div className="flex items-center gap-2 self-center rounded-full border px-3 py-1.5 text-sm" style={box}>
          {data.mood.bitmojiUrl && <img src={proxied(data.mood.bitmojiUrl) ?? ""} alt="" className="h-6 w-6 object-contain" />}
          <span>{data.mood.emoji}</span>
          <span>{data.mood.text}</span>
        </div>
      )}
      {data.card && (
        <div className="flex items-center gap-3 rounded-2xl border p-3" style={box}>
          {data.card.bitmojiUrl ? (
            <img src={proxied(data.card.bitmojiUrl) ?? ""} alt="Bitmoji" className="h-12 w-12 object-contain" />
          ) : (
            <span className="text-2xl" aria-hidden>👻</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{data.card.displayName ?? "Snapchat"}</p>
            <p className="text-xs" style={{ color: theme.muted }}>✓ Geverifieerd via Snapchat</p>
          </div>
        </div>
      )}
    </div>
  );
}
