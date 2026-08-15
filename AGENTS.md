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
- **Two kinds of contact.** A business has a *primary contact* stored on its own row
  (`businesses.contact_name` / `contact_title` / `contact_email` / `contact_phone`) and,
  separately, any number of `contacts` rows linked by `business_id`. The primary contact is
  not a Contact entity and has no id, so anything that offers a contact picker has to
  surface it explicitly — `components/business/LogInteractionForm.jsx` does, keyed on a
  `'primary'` sentinel, and writes `interactions.contact_name` with no `contact_id`.
  De-dupe by name (case-insensitive) so a business that has both does not list it twice.
- **Auth:** Supabase Auth. Roles live in `profiles.role`: `ceo > admin > user`.
- **Auth context:** `src/lib/AuthContext.jsx` holds the signed-in user's `profiles` row and
  loads it once at app start. Anything that writes to `profiles` must call the context's
  `refreshProfile()` afterwards or the UI keeps rendering the pre-write row —
  `qc.invalidateQueries(['users'])` only refreshes the TanStack Query cache, not the
  context. `refreshProfile` is identity-stable, so it is safe as an effect dependency.
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
npm run test # vitest, jsdom
```
Client config comes from environment variables (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, optional `VITE_STRIPE_PAYMENT_LINK`). These are set as
Cursor environment secrets; `.env.local` is gitignored and must NOT be committed.

`npm run lint` is clean and must stay clean. `npm run typecheck` runs `tsc` over the
whole `src` tree with `allowJs` + `checkJs` (see `jsconfig.json`) and still reports
~145 errors, all of them TypeScript inference limits in untyped JS — required-vs-optional
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
- **Reconstructed-schema gap.** The live database was rebuilt by hand from a reconstructed
  schema and lost columns in the process, so Add/Save forms fail with
  `400 PGRST204 ("Could not find the '<col>' column of '<table>' in the schema cache")`.
  `businesses.address` and `businesses.assigned_to_name` were confirmed missing and added
  manually. `supabase/migrations/20260814072821_schema_reconciliation.sql` reconciles all
  twelve `TABLE_MAP` tables: it was generated by sweeping every
  `base44.entities.*.create()` / `.update()` call site plus every form's default state
  object, cross-checked against the reference entity schemas in `base44/entities/*.jsonc`,
  and is additive and idempotent (`ADD COLUMN IF NOT EXISTS` only). **It has not been
  applied** — a human needs to run it, then re-test each Add/Save form.
  A full database sweep on 2026-08-14 confirmed every CHECK constraint and RLS policy is
  correct, and dropped the stray `NOT NULL` on `events.title` and `email_templates.name`
  (done directly via psql, so there is no migration file for it).
- `base44/entities/*.jsonc` are the pre-migration Base44 entity definitions and are the
  closest thing the repo has to a schema of record: field names, types, defaults and the
  enum values behind each CHECK constraint. Treat them as the reference when reconciling.
- **`supabase/migrations/20260814105153_discussions_archived.sql` must be applied before
  the current `SyncHub.jsx` ships.** Archiving a thread now writes `{ archived: true }`
  instead of overwriting `category` with a value that is not in the category enum. Until
  the column exists, archiving fails with PGRST204 and previously archived threads are
  still recognised by their legacy `category = 'archived'` value.
- Empty strings are normalised to `null` centrally, in `base44Client`'s entity `create()`
  and `update()`. Forms are free to keep sending `''` for an unset optional value; the
  adapter converts every top-level `''` before it reaches PostgREST, so uuid, timestamptz
  and integer columns no longer reject them (`22P02` / `22007`). Nested objects and arrays
  (jsonb payloads such as `discussions.replies`) are left alone. Do not re-add per-form
  `|| null` fixes, and keep new adapters going through the same normalisation.
- Open schema decisions the reconciliation migration deliberately does not make (all
  detailed in the migration file's footer):
  - Every table needs `created_date` because the adapter's `list()` falls back to
    `.order('created_date', { ascending: false })`; `updated_date` is additionally required
    on `email_templates`, `businesses` and `profiles`.
  - Column *names* all line up — no renames are needed. The naming is just inconsistent
    across tables (`events.name` vs `title` elsewhere, `ideas.description` vs
    `discussions.content`); do not "align" them or you will split data.
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
- Password reset: `ResetPassword` now gates on a recovery *session* rather than a `?token=`
  query param — the token arrives in the URL hash and is consumed by the Supabase client
  (`detectSessionInUrl`, pinned on in `src/lib/supabaseClient.js`), which then reports it
  through `onAuthStateChange`. `auth.forgotPassword` asks for a
  `${origin}/reset-password` redirect. Supabase-side confirmation still needed:
  `/reset-password` must be in the project's Redirect URL allow-list, and the recovery
  email template has to keep using the default `{{ .ConfirmationURL }}` link.
- `Register.jsx` still has no route. Self-signup appears to be intentionally closed
  (accounts are created by admins through the `create-user` Edge Function), so it was left
  unrouted — confirm that is deliberate before wiring it up.
- Push notifications are not wired up: `public/sw.js` has a `push` handler but nothing calls
  `registration.pushManager.subscribe()`, and both `sw.js` and `src/utils/notifications.js`
  reference `/favicon.ico`, which does not exist in `public/`.
- `public/manifest.json` exists but its only icon is the remote Base44 logo (1024x791).
  Self-hosted square 192x192 / 512x512 PNGs (plus a maskable variant) are still needed for
  installability.

## Roadmap
Rate limiting → AI follow-up drafts → calendar sync → PWA icons + install polish → webhooks.
