/**
 * Generic AT Protocol verification engine, shared by Bluesky and Wsocial.
 * Ownership = the handle resolves (DNS TXT `_atproto.<handle>` or
 * `https://<handle>/.well-known/atproto-did`) to a DID whose profile, read via
 * the network's official AppView API, links back to the member's ROUT page.
 */

export type AtNetwork = {
  id: "bluesky" | "wsocial";
  label: string;
  /** Handle suffixes that belong to this network. */
  suffixes: string[];
  /** Public AppView used for official profile reads. */
  appView: string;
};

export const AT_NETWORKS: Record<AtNetwork["id"], AtNetwork> = {
  bluesky: {
    id: "bluesky",
    label: "Bluesky",
    suffixes: ["bsky.social", "bsky.team", "blacksky.app", "eurosky.social"],
    appView: "https://public.api.bsky.app",
  },
  wsocial: {
    id: "wsocial",
    label: "Wsocial",
    suffixes: ["wsocial.eu"],
    appView: "https://public.api.bsky.app",
  },
};

const HANDLE_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export function normalizeAtHandle(input: string, network: AtNetwork): string | null {
  let h = String(input ?? "").trim().toLowerCase().replace(/^@/, "");
  h = h.replace(/^https?:\/\/(www\.)?(bsky\.app|wsocial\.eu)\/profile\//, "").replace(/\/.*$/, "");
  if (!h) return null;
  if (!h.includes(".")) h = `${h}.${network.suffixes[0]}`;
  return HANDLE_RE.test(h) ? h : null;
}

async function resolveViaDns(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=_atproto.${handle}&type=TXT`, {
      headers: { accept: "application/dns-json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { Answer?: { data: string }[] };
    for (const a of json.Answer ?? []) {
      const m = a.data.replace(/"/g, "").match(/^did=(did:[a-z]+:[a-zA-Z0-9._:%-]+)$/);
      if (m) return m[1];
    }
  } catch {
    /* fall through */
  }
  return null;
}

async function resolveViaWellKnown(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://${handle}/.well-known/atproto-did`, { redirect: "error" });
    if (!res.ok) return null;
    const did = (await res.text()).trim();
    return /^did:[a-z]+:[a-zA-Z0-9._:%-]+$/.test(did) ? did : null;
  } catch {
    return null;
  }
}

export async function resolveAtHandle(handle: string): Promise<string | null> {
  return (await resolveViaDns(handle)) ?? (await resolveViaWellKnown(handle));
}

export type AtVerifyResult =
  | { ok: true; did: string; handle: string; network: AtNetwork["id"] }
  | { ok: false; reason: "invalid_handle" | "unresolved" | "no_profile" | "link_missing" };

/** Checks that `handle` on `network` belongs to the ROUT member `routHandle`. */
export async function verifyAtHandle(
  networkId: AtNetwork["id"],
  rawHandle: string,
  routHandle: string,
): Promise<AtVerifyResult> {
  const network = AT_NETWORKS[networkId];
  const handle = normalizeAtHandle(rawHandle, network);
  if (!handle) return { ok: false, reason: "invalid_handle" };
  // A custom domain equal to the member's own rout.be subdomain is proof by itself.
  const did = await resolveAtHandle(handle);
  if (!did) return { ok: false, reason: "unresolved" };
  try {
    const res = await fetch(`${network.appView}/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`);
    if (!res.ok) return { ok: false, reason: "no_profile" };
    const p = (await res.json()) as { handle?: string; description?: string };
    if ((p.handle ?? "").toLowerCase() !== handle) return { ok: false, reason: "unresolved" };
    const r = routHandle.toLowerCase().replace(/^@/, "");
    const bio = (p.description ?? "").toLowerCase();
    const linked = handle.endsWith(`.${r}.rout.be`) || handle === `${r}.rout.be` ||
      [`rout.be/${r}`, `rout.be/u/${r}`].some((n) => bio.includes(n));
    return linked ? { ok: true, did, handle, network: networkId } : { ok: false, reason: "link_missing" };
  } catch {
    return { ok: false, reason: "no_profile" };
  }
}
