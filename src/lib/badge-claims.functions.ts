import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";

const token = z.string().regex(/^stamp_[a-z0-9]{8,32}$/);

async function guard(userId: string) {
  const { assertAdminRole } = await import("./admin.server");
  await assertAdminRole(userId);
}

export const adminCreateClaimLink = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        badgeId: z.string().uuid(),
        maxClaims: z.number().int().min(1).max(100_000).nullable(),
        expiresAt: z.string().datetime().nullable(),
        reason: z.string().trim().max(200).nullable(),
      })
      .refine((v) => v.maxClaims != null || v.expiresAt != null, "Stel een maximum of vervaldatum in.")
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { createClaimLink } = await import("./badge-claims.server");
    return createClaimLink(context.userId, { ...data, reason: data.reason || null });
  });

export const adminListClaimLinks = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ badgeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { listClaimLinks } = await import("./badge-claims.server");
    return listClaimLinks(data.badgeId);
  });

export const adminRevokeClaimLink = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { revokeClaimLink } = await import("./badge-claims.server");
    return revokeClaimLink(context.userId, data.id);
  });

export const getStampClaim = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => z.object({ token }).parse(d))
  .handler(async ({ data }) => {
    const { previewClaim } = await import("./badge-claims.server");
    return previewClaim(data.token);
  });

export const redeemStampClaim = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: unknown) => z.object({ token }).parse(d))
  .handler(async ({ data, context }) => {
    const { enforceRateLimit } = await import("./rate-limit.server");
    enforceRateLimit(`stamp-claim:${context.userId}`, 20, 60_000);
    const { redeemClaim } = await import("./badge-claims.server");
    return { result: await redeemClaim(data.token, context.userId) };
  });
