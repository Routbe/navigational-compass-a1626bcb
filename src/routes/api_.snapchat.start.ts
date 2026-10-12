import { createFileRoute } from "@tanstack/react-router";

/** Starts Snap Kit login for the signed-in member (links Snapchat + Bitmoji). */
export const Route = createFileRoute("/api_/snapchat/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const back = (q: string) => new Response(null, { status: 302, headers: { location: `/studio?snapchat=${q}` } });
        const { currentUser } = await import("@/lib/auth/session.server");
        const user = await currentUser().catch(() => null);
        if (!user) return new Response(null, { status: 302, headers: { location: "/auth/sign-in?next=/studio" } });
        const s = await import("@/lib/snapchat.server");
        if (!s.snapchatConfigured()) {
          console.warn("[snapchat] not configured: SNAPCHAT_CLIENT_ID / SNAPCHAT_CLIENT_SECRET missing");
          return back("not_configured");
        }
        return new Response(null, { status: 302, headers: { location: s.snapchatAuthorizeUrl(user.id, request) } });
      },
    },
  },
});
