import { runSchemaEnsure } from "@/lib/db/schema-ensure.server";
import { sql } from "@/lib/neon";
import type { AliasProfileInput } from "@/lib/alias-profile.server";
import type { StudioProfileInput } from "@/lib/studio-profile.server";

export type ProfileSpace = "verified" | "alias";
export type ProfileDraftPayload = StudioProfileInput | AliasProfileInput;
export type SerializableDraftPayload = {
  username: string;
  displayName?: string | null;
  tagline?: string | null;
  avatarUrl?: string | null;
  faviconUrl?: string | null;
  theme?: string | null;
  cardStyle?: string | null;
  blocks?: Record<string, string | number | boolean | null | (string | number | boolean | null)[]>[];
  displayPrefs?: Record<string, string | number | boolean | null | (string | number | boolean | null)[]> | null;
};

export type DraftMeta = {
  draftRevision: number;
  publishedRevision: number;
  hasUnpublishedChanges: boolean;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
};

type Row = Record<string, unknown>;

let tableReady: Promise<void> | null = null;
async function ensureDraftTable(): Promise<void> {
  tableReady ??= runSchemaEnsure(async () => {
    await sql`
      create table if not exists public.profile_drafts (
        user_id uuid not null references public.profiles(id) on delete cascade,
        space text not null check (space in ('verified', 'alias')),
        payload jsonb not null default '{}'::jsonb,
        revision bigint not null default 1,
        published_revision bigint not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        published_at timestamptz,
        primary key (user_id, space)
      )
    `;
  }, "profile-drafts.server.ts").catch((error) => {
    tableReady = null;
    throw error;
  });
  return tableReady;
}

function rowMeta(row: Row): DraftMeta {
  const draftRevision = Number(row["revision"] ?? 0);
  const publishedRevision = Number(row["published_revision"] ?? 0);
  return {
    draftRevision,
    publishedRevision,
    hasUnpublishedChanges: draftRevision !== publishedRevision,
    draftUpdatedAt: (row["updated_at"] as string | null) ?? null,
    publishedAt: (row["published_at"] as string | null) ?? null,
  };
}

export async function readOrCreateProfileDraft(
  userId: string,
  space: ProfileSpace,
  livePayload: ProfileDraftPayload,
): Promise<{ payload: SerializableDraftPayload; meta: DraftMeta }> {
  await ensureDraftTable();
  await sql`
    insert into public.profile_drafts (user_id, space, payload, revision, published_revision, published_at)
    values (${userId}, ${space}, ${JSON.stringify(livePayload)}::jsonb, 1, 1, now())
    on conflict (user_id, space) do nothing
  `;
  const rows = (await sql`
    select payload, revision, published_revision, updated_at, published_at
      from public.profile_drafts
     where user_id = ${userId} and space = ${space}
     limit 1
  `) as Row[];
  const row = rows[0];
  if (!row) throw new Error("draft_not_found");
  return {
    payload: (row["payload"] as SerializableDraftPayload | null) ?? (livePayload as SerializableDraftPayload),
    meta: rowMeta(row),
  };
}

export async function saveProfileDraft(
  userId: string,
  space: ProfileSpace,
  payload: ProfileDraftPayload,
  expectedRevision: number,
): Promise<DraftMeta> {
  await ensureDraftTable();
  try {
    const rows = (await sql.query(
      `select * from public.save_profile_draft($1::uuid, $2::text, $3::jsonb, $4::bigint)`,
      [userId, space, JSON.stringify(payload), expectedRevision],
    )) as Row[];
    const row = rows[0];
    if (!row) throw new Error("draft_save_failed");
    return rowMeta(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("draft_conflict")) throw new Error("draft_conflict");
    throw error;
  }
}

export async function publishProfileDraft(
  userId: string,
  space: ProfileSpace,
  expectedRevision: number,
): Promise<DraftMeta> {
  await ensureDraftTable();
  try {
    const rows = (await sql.query(
      `select * from public.publish_profile_draft($1::uuid, $2::text, $3::bigint)`,
      [userId, space, expectedRevision],
    )) as Row[];
    const row = rows[0];
    if (!row) throw new Error("publish_failed");
    return rowMeta(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("draft_conflict")) throw new Error("draft_conflict");
    throw error;
  }
}

export async function discardProfileDraft(
  userId: string,
  space: ProfileSpace,
  livePayload: ProfileDraftPayload,
  expectedRevision: number,
): Promise<{ payload: SerializableDraftPayload; meta: DraftMeta }> {
  const saved = await saveProfileDraft(userId, space, livePayload, expectedRevision);
  const rows = (await sql`
    update public.profile_drafts
       set published_revision = revision, published_at = now(), updated_at = now()
     where user_id = ${userId} and space = ${space} and revision = ${saved.draftRevision}
     returning payload, revision, published_revision, updated_at, published_at
  `) as Row[];
  const row = rows[0];
  if (!row) throw new Error("draft_conflict");
  return { payload: (row["payload"] as SerializableDraftPayload) ?? (livePayload as SerializableDraftPayload), meta: rowMeta(row) };
}