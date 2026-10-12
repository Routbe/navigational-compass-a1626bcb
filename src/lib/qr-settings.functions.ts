import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/middleware";
import { normalizeQrSettings } from "@/lib/qr-settings";

/** Standalone opslag van de profiel-QR-stijl in `profiles.display_prefs->'qrSettings'`. */
export const saveQrSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => {
    const style = normalizeQrSettings(data);
    if (!style) throw new Error("invalid_qr_settings");
    return style;
  })
  .handler(async ({ data, context }) => {
    const { sql } = await import("@/lib/neon");
    await sql`
      update public.profiles
         set display_prefs = jsonb_set(coalesce(display_prefs, '{}'::jsonb), '{qrSettings}', ${JSON.stringify(data)}::jsonb, true)
       where id = ${context.userId}
    `;
    return { ok: true as const, qrSettings: data };
  });
