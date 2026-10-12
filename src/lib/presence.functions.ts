import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/middleware";

/** The caller's own Live Presence connections (no tokens). */
export const getMyPresence = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const s = await import("./spotify-presence.server");
    return { spotifyReady: s.spotifyConfigured(), connections: await s.myConnections(context.userId) };
  });

export const setSpotifyPresenceVisible = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { show: boolean }) => ({ show: input?.show === true }))
  .handler(async ({ data, context }) => {
    const s = await import("./spotify-presence.server");
    await s.setShowOnProfile(context.userId, data.show);
    return { ok: true };
  });

export const disconnectSpotifyPresence = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const s = await import("./spotify-presence.server");
    await s.disconnectSpotify(context.userId);
    return { ok: true };
  });

export const setSpotifyPresenceScope = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { verified: boolean; alias: boolean }) => ({
    verified: input?.verified === true,
    alias: input?.alias === true,
  }))
  .handler(async ({ data, context }) => {
    const s = await import("./spotify-presence.server");
    await s.setSpotifyScope(context.userId, data);
    return { ok: true };
  });
