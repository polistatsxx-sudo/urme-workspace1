# URME — Agent Guide

URME ("URME Match Flow") is a mobile-first B2B networking & matchmaking CRM.
Single-page app, migrated off the Base44 low-code platform to Supabase.

## Stack
- **Frontend:** Vite 8, React 18, React Router, TailwindCSS, shadcn/ui, TanStack Query, Framer Motion, Recharts
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions), project ref `rebjykbpmhhaxgpclzsg`
- **Hosting:** Vercel (auto-deploys on push to `main`)
- **Node:** v20+

## Architecture
- **Data layer:** `src/api/base44Client.js` is a compatibility shim that preserves the
  old `base44.entities.*` / `base44.auth.*` / `base44.integrations.*` / `base44.functions.*`
  SDK surface on top of Supabase/PostgREST. All CRM reads/writes go browser-direct to
  PostgREST with the public anon key. **RLS is the only authorization boundary.**
- **Entity → table map** (in base44Client.js): Business→businesses, Contact→contacts,
  Interaction→interactions, Match→matches, Event→events, Task→tasks, Idea→ideas,
  Discussion→discussions, FinanceEntry→finance_entries, EmailTemplate→email_templates,
  AppSettings→app_settings, User→profiles.
- **Adapter surface** (keep call sites in sync with it): entities expose
  `list(orderBy)`, `filter(filters, orderBy)`, `create`, `update(id, updates)`, `delete(id)`.
  Auth exposes `me`, `login({email, password})`, `register({email, password, full_name})`,
  `logout(redirectTo?)`, `forgotPassword(email)`, `resetPassword(newPassword)`,
  `onAuthStateChange`. There is no `resetPasswordRequest`.
- **Auth:** Supabase Auth. Roles live in `profiles.role`: `ceo > admin > user`.
- **AI:** `src/utils/ai.js` and `base44.integrations.Core.InvokeLLM({prompt, response_json_schema, model, temperature})`
  both call the `invoke-llm` Edge Function. `model` and `temperature` are optional and are
  forwarded to the function; only `prompt` is required.

## Edge Functions (supabase/functions/)
- `invoke-llm` — LLM proxy. **Multi-provider routing by caller identity:** Michael's
  user ID → Grok (xAI, `XAI_API_KEY`); everyone else → Anthropic Claude (`ANTHROPIC_API_KEY`).
  Reads the Authorization header to identify the user and logs `user_id` with token counts.
  Deploy with `--no-verify-jwt`.
- `auth-login-guard` — pre-login lockout precheck / failed / success (advisory, see Known Issues)
- `create-user`, `delete-user`, `unlock-account` — admin/ceo-only user management
  (these correctly authenticate the caller — use them as the auth pattern to follow)

## Local development
```bash
npm ci
npm run dev          # Vite on :5173
npm run build        # emits dist/
npm run lint
npm run typecheck
```
Client config comes from environment variables (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, optional `VITE_STRIPE_PAYMENT_LINK`). These are set as
Cursor environment secrets; `.env.local` is gitignored and must NOT be committed.

`npm run lint` is clean and must stay clean. `npm run typecheck` runs `tsc` over the
whole `src` tree with `allowJs` + `checkJs` (see `jsconfig.json`) and still reports
~150 errors, all of them TypeScript inference limits in untyped JS — required-vs-optional
props on plain function components, `useMutation` variables inferred as `void`, and
`useState({})` shapes. `src/types/react-forwardref.d.ts` widens `React.forwardRef`'s prop
generic, which TypeScript otherwise infers as `{}` for the shadcn/ui JS components.
Do not "fix" that backlog by disabling `checkJs`.

## Deploying Edge Functions (manual, human-run)
```bash
supabase functions deploy <name> --no-verify-jwt --project-ref rebjykbpmhhaxgpclzsg
```
Set secrets with: `supabase secrets set NAME=value --project-ref rebjykbpmhhaxgpclzsg`

## Known issues / manual follow-ups
- Schema + RLS are NOT version-controlled. Capture with `supabase db pull` (needs DB creds).
  Known extra `profiles` columns beyond the base set: `failed_login_attempts`,
  `account_locked`, `mfa_enabled`, `ai_provider`, `ai_api_key`.
- `profiles.ai_api_key` / `profiles.ai_provider` are dead columns — the UI that wrote them
  has been removed. Drop the columns and purge any stored values (needs DB access).
- 3-strike lockout is advisory/bypassable; `auth-login-guard` is unauthenticated. Needs redesign.
  Direct `signInWithPassword` and Google OAuth skip it entirely, and any unauthenticated
  caller can lock an arbitrary account by posting `{action: 'failed', email}`.
- `invoke-llm` has no rate limiting / cost caps (caller identity + `user_id` usage logging
  is now in place as the prerequisite).
- Deployed Edge Function code must be kept in sync with this repo (past drift occurred:
  the repo copy of `invoke-llm` was Anthropic-only long after production had moved to
  multi-provider routing).
- `.env.local` is no longer tracked, but it remains in git history — rotating anything
  sensitive that was in it is a human decision.
- Password reset: `ResetPassword` gates on a `?token=` query param. Supabase recovery links
  do not use that shape by default, so confirm the auth email template and redirect URL
  before treating the reset flow as working.
- Push notifications are not wired up: `public/sw.js` has a `push` handler but nothing calls
  `registration.pushManager.subscribe()`, and both `sw.js` and `src/utils/notifications.js`
  reference `/favicon.ico`, which does not exist in `public/`.
- `public/manifest.json` exists but its only icon is the remote Base44 logo (1024x791).
  Self-hosted square 192x192 / 512x512 PNGs (plus a maskable variant) are still needed for
  installability.

## Roadmap
Rate limiting → AI follow-up drafts → calendar sync → PWA icons + install polish → webhooks.
