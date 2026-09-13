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
- **Event attendees have two writers.** `events.attendee_business_ids` is set from the
 attendee tick-list in `components/event/EventForm.jsx` and from Link/Unlink Event on a
 business page (`components/business/EventEngagements.jsx`). `attendee_count` tracks the
 length of that array — the form derives it from the tick-list at submit time, the business
 page steps it by one — so keep both writers in step or the CSV export's "Attendees" column
 drifts.
- **Dialog forms must be their own module-level component.** `pages/Events.jsx` used to
 declare `EventForm` and `EventCard` inside `Events()`, which gave each a new function
 identity on every render, so React remounted the whole subtree on each keystroke and the
 focused input was replaced after one character. Forms live in `components/<area>/`, own
 their own state, and take `initialData` / `onSubmit` / `saving` — see
 `components/business/BusinessForm.jsx` and `components/event/EventForm.jsx`. Never declare
 a component that renders an input inside another component's body.
 `pages/Events.test.jsx` types a multi-character name with `userEvent` and asserts the
 input node is the same object afterwards, which is the only assertion that catches this
 (a single `fireEvent.change` passes either way).
- **Google Calendar links** come from `src/utils/calendar.js`, which reads the day out of
 `events.date` textually (a `new Date()` shifts it west of UTC) and parses the free-text
 `events.time`. Times are handed to Google without a `Z` so they land in the viewer's own
 calendar timezone; an unreadable time falls back to an all-day event.
- **Auth:** Supabase Auth. Roles live in `profiles.role`: `ceo > admin > user`.
- **Account management (`canManage`).** Who may administer whose account is one rule, kept
  in `src/utils/permissions.js` for the UI and mirrored in
  `supabase/functions/_shared/permissions.ts` for the Edge Functions (Deno cannot import
  from `src/`). `src/utils/permissions.test.js` runs both copies over the whole
  caller/target matrix and fails if they disagree, so change them together.
  - Michael (`MICHAEL_ID`) manages anyone. AJ (`AJ_ID`) and any future admin/CEO manage
    regular members but neither Michael nor AJ. Standard members manage nobody.
  - Both protected accounts are gated **on user id**, never on email or name. The
    expected email is documentation plus a drift check
    (`warnOnProtectedIdentityDrift`) that shouts if a rebuilt database repoints an id at
    a different person; it never grants or denies by itself.
  - Editing your own profile is not management and is always allowed. Add/invite has no
    target, so it falls back to the role gate (`canCreateAccounts`).
  - Lockout guards: nobody changes their own role or deletes their own account, deletion
    is limited to `role = 'user'` targets (demote first), and a demotion/deletion that
    would leave no admin or CEO at all is refused.
  - Client checks are UX only. Every one of them is re-run server-side in the Edge
    Functions with the service role — see below.
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
- `create-user`, `update-user`, `delete-user`, `unlock-account` — account management.
  Each authenticates the caller, then applies the shared `canManage` rule through the
  `authorize*` helpers in `_shared/permissions.ts` before touching anything with the
  service role. Use them as the auth pattern to follow.
  - `update-user` is how one member's profile edit of *another* member reaches the
    database; the direct `base44.entities.User.update()` path is for editing yourself.
    It takes `{ targetUserId, updates }`, accepts only whitelisted profile columns,
    requires management rights for `role` / `subscription_status` / `paid_through_date`,
    and normalises `''` to `null` the way `base44Client` does.
- `supabase/functions/_tests/permission-matrix.ts` drives all four handlers through the
  permission matrix with a stubbed supabase-js. It needs Deno, so `npm run test` does not
  run it: `cd supabase/functions/_tests && deno run --allow-env --allow-read permission-matrix.ts`.

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
 still recognised by their legacy `category = 'archived'` value. Unarchiving needs the
 same column: it writes `{ archived: false }`, plus `category: 'general'` for a legacy
 thread whose own category was overwritten.
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
- **`supabase/migrations/20260815012500_profiles_update_hardening.sql` is not applied.**
  Until it is, `profiles` RLS is whatever the hand-rebuilt database ended up with, so an
  admin (or possibly anyone) can still bypass `update-user` by writing another member's
  row straight through PostgREST, and anyone can set their own `role` /
  `subscription_status` / `account_locked`. The migration narrows UPDATE to
  `auth.uid() = id` and adds a trigger that blocks privileged columns for the
  `authenticated`/`anon` roles; the Edge Functions use the service role and are exempt.
  Apply it after the schema reconciliation migration (it names columns that one adds),
  then re-test self-save, admin-edits-member and standard-member-edits-someone-else.
- New/changed Edge Functions still need a human deploy:
  `npx supabase functions deploy update-user --no-verify-jwt --project-ref rebjykbpmhhaxgpclzsg`
  (same for `create-user`, `delete-user`, `unlock-account`, which now import
 `_shared/permissions.ts`). Until `update-user` is deployed, saving another member's
 profile from the Team page fails — including the role selector in
 `TeamMemberEditDialog`, which is the only way a role reaches the database.
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
- **Background push is a future feature, not a bug.** `src/utils/notifications.js` uses the
 `Notification` constructor, which by definition only fires while a tab is open; reminders
 that arrive with the app closed need a service-worker push subscription
 (`registration.pushManager.subscribe()`) plus a push-sender backend and VAPID keys.
 `public/sw.js` has a `push` handler but nothing subscribes, and both `sw.js` and
 `notifications.js` reference `/favicon.ico`, which does not exist in `public/`. The in-app
 help (`src/data/helpContent.js`, `notifications` section) and `docs/USER_GUIDE.md` §21.1
 both state the tab-open limitation, so the wording is accurate as it stands — keep it that
 way until push actually ships.
- `public/manifest.json` exists but its only icon is the remote Base44 logo (1024x791).
  Self-hosted square 192x192 / 512x512 PNGs (plus a maskable variant) are still needed for
  installability.

## Roadmap
Rate limiting → AI follow-up drafts → calendar sync → PWA icons + install polish → webhooks.
