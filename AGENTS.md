<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Neon is the only database, reached exclusively through the Lovable Neon connector gateway (`src/lib/neon.ts`: `sql`, `neon()`, `GatewayPool`; keys `LOVABLE_API_KEY` + `NEON_API_KEY`), never a direct connection string. Schema changes are idempotent `db/NN_*.sql` files; runtime `create table if not exists` safety nets go through `runSchemaEnsure`. Why: the connection string stays in Lovable; gateway calls are stateless so cross-request transactions do not exist.
- Login ON rout.be (Better Auth, `better-auth.server.ts`) and login VIA rout.be (OIDC provider, `src/lib/oauth/*`) never share config; provider env vars use the `ROUT_PROVIDER_*` prefix. Why: one role must not break the other.
- Sign-in tiles always render; unconfigured providers show a notice. OAuth callbacks for a provider with missing credentials are refused before Better Auth is created with `provider_not_configured` (400) plus a server warning (`api_/auth/$.ts` + `isProviderConfigured`). Why: missing keys must never hide options or crash auth.
- Public profile visibility (`publicProfile`, `timelineVisible` in `display_prefs`) is enforced server-side in the public profile/timeline functions. Why: client checks leak data.
- Every env var name is documented in `ENVIRONMENT.md` (+ `.env.example`); provider env lookups go through `envAny()` aliases in `better-auth.server.ts` (incl. `<PROVIDER>_OAUTH_CLIENT_*`); the auth secret resolves via `resolveAuthSecret()` with a derived fallback. Why: one findable list; a missing variable never breaks all sign-ins.
- A failed provider-status check on the sign-in screen means unknown (buttons still try), never "all inactive". Why: a flaky status call must not disable logins.
- Every sign-in method returns through `/auth/continue`; destinations and tour drafts use HttpOnly cookies, never URLs. Tour drafts apply only to new accounts; taken handles fall back to onboarding. Why: zero-hop redirects, no token leakage, existing members never overwritten. Auth emails use `sendLocalizedEmail` with static template IDs and non-blocking dispatch so provider outages never break sign-in.
- Bot checks run only via self-hosted ALTCHA proof-of-work (`altcha.server.ts`, single-use via `altcha_used` db/54); `api_/auth/$.ts` refuses email auth flows with `altcha_invalid` (400) before Better Auth runs. Why: no third-party bot service, no tracking.
- Community stats are live counts; reviews show only when `approved` (db/65); empty sections hide. Approving a verification cancels that user's other open same-tier requests (`verification-dedupe.ts`). Why: no fake social proof or duplicate work.
- Vercel builds use nitro's `vercel` preset (auto via `VERCEL`); the sandbox forces cloudflare, so test with sandbox env vars unset.
- Third-party images on public pages load only via `/api/public/proxy-image` (host allowlist in `src/lib/image-proxy-rules.ts`). Why: visitors' IPs must never reach third-party image hosts.
- Emailed action links (review, booking) only confirm on GET, change on POST; status mails send fire-and-forget. Why: scanners open links; mail failures never block actions.
- 2FA/passkeys: Better Auth `twoFactor` + `@better-auth/passkey`, tables in `neon_auth` (db/77). Why: no custom crypto.
- Migrations are applied with `bun scripts/migrate-gateway.ts` (splits each `db/NN_*.sql` into statements, one gateway batch = one transaction, tracked in `schema_migrations`). Why: the gateway rejects multi-statement queries and no direct connection string exists.
- Deployment mode comes only from `src/lib/app-mode.ts` (`VITE_APP_MODE`/`APP_MODE`): `appModeMiddleware` in `src/start.ts` 404s admin paths in public mode and confines admin mode to the portal (noindex), `assertAdminRole` refuses in public mode, and `api_.auth.$.ts` refuses social providers in admin mode. Why: the split must hold server-side, never only in the UI.
- Build-time hard split: `vite.config.ts` passes `routeIgnorePattern(buildMode(process.env))` (`src/lib/app-mode-routes.ts`) as the router's `routeFileIgnorePattern`, so public builds contain no admin route files and admin builds only portal + sign-in routes; new admin routes must be named `admin.*`. Why: admin code must never ship in the public bundle; runtime middleware stays as defence in depth.
- Shells: `__root.tsx` lazily picks `AdminAppShell` for admin paths, else `PublicAppShell`; the admin shell import is a dead branch when `VITE_APP_MODE=public`. Client shell mode (`detectShellMode`, `?mode=`, `app:mode-override`) and `DevModeToggle` are UI-only and disabled on pinned builds. Why: previews can switch views without ever loosening server-side access.
- Stamp claim links (db/92, `badge-claims.server.ts`): tokens `stamp_*`, need a max-claims or expiry, redeemed by signed-in members in one locking statement with a per-user redemption row. Why: no double claims or overruns under concurrency.
- Open-web ownership is proven only by the server-side bio-check (`open-web-rules.ts` + `checkBioVerify`): `verified_via` is 'sso' or 'bio', and changing the handle drops bio verification. User-supplied fetch hosts (RSS, Mastodon) must pass `isPublicHost`. Why: no OAuth, no trust in client input, no SSRF.
- Guestbook (`guestbook.server.ts`, db/90): only signed-in members post, owners pin/delete via `owner_id` checks, public reads return pinned notes of public profiles only. Why: verified network effect, no spam, privacy enforced server-side.
