import { createFileRoute } from "@tanstack/react-router";

/** Ruimt verlopen Asset Manager-bestanden op (Scaleway + Neon). Token: CRON_SECRET of LOVABLE_CRON_SECRET. */
async function handle(request: Request) {
  const secret = process.env["CRON_SECRET"] ?? process.env["LOVABLE_CRON_SECRET"];
  if (!secret) return new Response("Not configured", { status: 503 });
  const url = new URL(request.url);
  const provided =
    url.searchParams.get("token") ??
    request.headers.get("x-cron-secret") ??
    (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (provided !== secret) return new Response("Unauthorized", { status: 401 });
  const { purgeExpiredAssets } = await import("@/lib/assets.server");
  const { purgeExpiredSharedFiles } = await import("@/lib/storage/shared-files.server");
  // Each purge is fail-safe per object; one failing source never blocks the other.
  const [assets, sharedFiles] = await Promise.allSettled([purgeExpiredAssets(), purgeExpiredSharedFiles()]);
  return Response.json({
    assets: assets.status === "fulfilled" ? assets.value : { error: true },
    sharedFiles: sharedFiles.status === "fulfilled" ? sharedFiles.value : { error: true },
  });
}

export const Route = createFileRoute("/api_/public/cron/cleanup-assets")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
