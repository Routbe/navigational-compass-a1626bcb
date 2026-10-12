/** Browser-safe rules for keyless open-web fetchers and bio-check verification. */

/** Providers whose ownership can be proven by putting a code in the public bio. */
export const BIO_VERIFIABLE = ["bluesky", "wsocial", "mastodon", "github"] as const;
export function isBioVerifiable(provider: string): boolean {
  return (BIO_VERIFIABLE as readonly string[]).includes(provider);
}

/** A verification code stays valid this long. */
export const VERIFY_CODE_TTL_MS = 30 * 60 * 1000;

/** True when the code appears in the bio (case-insensitive, HTML stripped). */
export function bioContainsCode(bio: string | null | undefined, code: string): boolean {
  if (!bio || !code) return false;
  const text = bio.replace(/<[^>]*>/g, " ").toLowerCase();
  return text.includes(code.toLowerCase());
}

/**
 * Public host check for user-supplied URLs fetched server-side (RSS, Mastodon instance).
 * Blocks IP literals and internal names so the fetcher cannot reach private networks.
 */
export function isPublicHost(host: string): boolean {
  const h = host.toLowerCase();
  if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(h)) return false;
  return !/(^|\.)(localhost|local|internal|lan|home|corp|intranet|test|invalid|example)$/.test(h);
}

/** `@user@domain` → `user@domain`, or null. */
export function normalizeMastodon(raw: string): string | null {
  let v = raw.trim().toLowerCase();
  const m = v.match(/^https:\/\/([^/]+)\/@([a-z0-9_]{1,30})\/?$/);
  if (m) v = `${m[2]}@${m[1]}`;
  v = v.replace(/^@/, "");
  const [user, domain, extra] = v.split("@");
  if (extra !== undefined || !user || !domain) return null;
  if (!/^[a-z0-9_]{1,30}$/.test(user) || !isPublicHost(domain)) return null;
  return `${user}@${domain}`;
}

/** Feed URL, `name.substack.com`, `medium.com/@name`, `letterboxd.com/name` → https feed URL, or null. */
export function normalizeFeed(raw: string): string | null {
  let v = raw.trim();
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return null;
  }
  if (u.username || u.password || (u.port && u.port !== "443")) return null;
  u.protocol = "https:";
  const host = u.hostname.toLowerCase();
  if (!isPublicHost(host)) return null;
  const path = u.pathname.replace(/\/+$/, "");
  if (host.endsWith(".substack.com") && (path === "" || path === "/")) return `https://${host}/feed`;
  if (host === "medium.com" && /^\/@[A-Za-z0-9._-]+$/.test(path)) return `https://medium.com/feed${path}`;
  if (host === "letterboxd.com" && /^\/[A-Za-z0-9_]+$/.test(path)) return `https://letterboxd.com${path}/rss/`;
  return u.toString();
}

export type FeedItem = { title: string; url: string; date: string | null };

function decode(s: string): string {
  return s
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/** Lightweight RSS 2.0 / Atom parser: the newest `limit` entries with https links only. */
export function parseFeed(xml: string, limit = 3): { title: string | null; items: FeedItem[] } {
  const channelTitle = xml.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1];
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/g) ?? [];
  const items: FeedItem[] = [];
  for (const b of blocks) {
    const title = b.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1];
    const link =
      b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/)?.[1] ??
      b.match(/<link[^>]*href=["']([^"']+)["']/)?.[1] ??
      b.match(/<link>([\s\S]*?)<\/link>/)?.[1];
    const date = b.match(/<(pubDate|published|updated|dc:date)>([\s\S]*?)<\/\1>/)?.[2];
    const url = link ? decode(link) : "";
    if (!title || !/^https:\/\//.test(url)) continue;
    const t = Date.parse(date ? decode(date) : "");
    items.push({ title: decode(title).slice(0, 160), url, date: Number.isNaN(t) ? null : new Date(t).toISOString() });
    if (items.length >= limit) break;
  }
  return { title: channelTitle ? decode(channelTitle).slice(0, 120) : null, items };
}
