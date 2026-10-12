/** Which remote images the privacy proxy may fetch (browser-safe, testable). */
export const PROXY_HOSTS = [
  "i.scdn.co",
  "mosaic.scdn.co",
  "lastfm.freetls.fastly.net",
  "i.ytimg.com",
  "yt3.ggpht.com",
  "avatars.githubusercontent.com",
  "gitlab.com",
  "secure.gravatar.com",
  "cdn.bsky.app",
  "wakatime.com",
  "sdk.bitmoji.com",
  "images.bitmoji.com",
  "images.chesscomfiles.com",
  "files.mastodon.social",
  "cdn.masto.host",
  "media.mstdn.social",
  "files.mastodon.online",
];

export function isAllowedProxyUrl(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return null;
  const host = u.hostname.toLowerCase();
  // Literal IPs never pass: allowlisted names only, so no internal addresses.
  if (/^[\d.]+$/.test(host) || host.includes(":")) return null;
  return PROXY_HOSTS.includes(host) ? u : null;
}

/** Browser helper: route an external image through ROUT. */
export function proxied(url: string | null | undefined): string | null {
  if (!url) return null;
  return isAllowedProxyUrl(url) ? `/api/public/proxy-image?url=${encodeURIComponent(url)}` : null;
}
