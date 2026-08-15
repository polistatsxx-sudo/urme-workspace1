// Drives the real Edge Function handlers (with a stubbed supabase-js) through the
// account-management permission matrix and prints what each caller/target pair gets back.
// The vitest suite covers the decision helpers in _shared/permissions.ts; this covers the
// HTTP layer around them -- status codes, the auth check, the field whitelist.
//
//   deno run --allow-env --allow-read supabase/functions/_tests/permission-matrix.ts
//
// Run it from this directory (or with --config supabase/functions/_tests/deno.json) so the
// import map swaps supabase-js for the stub. Exits non-zero on the first mismatch.

import { resetState, state } from './mock-supabase.ts';

const MICHAEL_ID = '24332e6e-fc06-46c4-a491-dc32e1efc58e';
const AJ_ID = 'bd91c741-0173-49fb-b715-8ae6c90919f0';

const michael = { id: MICHAEL_ID, role: 'admin', email: 'polistatsxx@gmail.com' };
const aj = { id: AJ_ID, role: 'ceo', email: 'macecnc@urmeinc.com' };
const futureAdmin = { id: 'admin-2', role: 'admin', email: 'admin2@urmeinc.com' };
const member = { id: 'user-1', role: 'user', email: 'member@urmeinc.com' };
const otherMember = { id: 'user-2', role: 'user', email: 'member2@urmeinc.com' };
const everyone = [michael, aj, futureAdmin, member, otherMember];

Deno.env.set('SUPABASE_URL', 'http://localhost');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
Deno.env.set('SUPABASE_ANON_KEY', 'anon-key');

const handlers: Record<string, (req: Request) => Promise<Response> | Response> = {};
let loading = '';
const realServe = Deno.serve;
// @ts-ignore -- capture the handler each function registers instead of listening.
Deno.serve = (handler: (req: Request) => Promise<Response> | Response) => {
  handlers[loading] = handler;
  return { finished: Promise.resolve(), shutdown: () => Promise.resolve() };
};

for (const name of ['create-user', 'update-user', 'delete-user', 'unlock-account']) {
  loading = name;
  await import(`../${name}/index.ts`);
}
// @ts-ignore -- restore, nothing else uses it.
Deno.serve = realServe;

async function call(fn: string, caller: Record<string, unknown> | null, body: unknown, profiles = everyone) {
  resetState(profiles.map((p) => ({ ...p })), caller ? { id: String(caller.id) } : null);
  const response = await handlers[fn](
    new Request('http://localhost', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
  const text = await response.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(text);
  } catch { /* empty body */ }
  return { status: response.status, error: parsed?.error as string | undefined };
}

const rows: Array<[string, string, number, string]> = [];
let failures = 0;

async function check(label: string, fn: string, expected: number, run: () => Promise<{ status: number; error?: string }>) {
  const { status, error } = await run();
  const ok = status === expected;
  if (!ok) failures += 1;
  rows.push([label, fn, status, `${ok ? 'PASS' : `FAIL (expected ${expected})`}${error ? ` — ${error}` : ''}`]);
}

const profileEdit = { display_name: 'Edited By Test' };

await check('Michael edits AJ', 'update-user', 200, () => call('update-user', michael, { targetUserId: AJ_ID, updates: profileEdit }));
await check('Michael edits a member', 'update-user', 200, () => call('update-user', michael, { targetUserId: member.id, updates: profileEdit }));
await check('AJ edits Michael', 'update-user', 403, () => call('update-user', aj, { targetUserId: MICHAEL_ID, updates: profileEdit }));
await check('AJ edits a member', 'update-user', 200, () => call('update-user', aj, { targetUserId: member.id, updates: profileEdit }));
await check('AJ edits a future admin', 'update-user', 200, () => call('update-user', aj, { targetUserId: futureAdmin.id, updates: profileEdit }));
await check('Future admin edits AJ', 'update-user', 403, () => call('update-user', futureAdmin, { targetUserId: AJ_ID, updates: profileEdit }));
await check('Future admin edits Michael', 'update-user', 403, () => call('update-user', futureAdmin, { targetUserId: MICHAEL_ID, updates: profileEdit }));
await check('Future admin edits a member', 'update-user', 200, () => call('update-user', futureAdmin, { targetUserId: member.id, updates: profileEdit }));
await check('Member edits another member', 'update-user', 403, () => call('update-user', member, { targetUserId: otherMember.id, updates: profileEdit }));
await check('Member edits their own profile', 'update-user', 200, () => call('update-user', member, { targetUserId: member.id, updates: profileEdit }));
await check('Member sets their own subscription', 'update-user', 403, () => call('update-user', member, { targetUserId: member.id, updates: { subscription_status: 'active' } }));
await check('Admin sets a member subscription', 'update-user', 200, () => call('update-user', futureAdmin, { targetUserId: member.id, updates: { subscription_status: 'active', paid_through_date: '' } }));
await check('Admin writes account_locked directly', 'update-user', 400, () => call('update-user', futureAdmin, { targetUserId: member.id, updates: { account_locked: false } }));
await check('Admin promotes a member', 'update-user', 200, () => call('update-user', futureAdmin, { targetUserId: member.id, updates: { role: 'admin' } }));
await check('Admin demotes themselves', 'update-user', 403, () => call('update-user', futureAdmin, { targetUserId: futureAdmin.id, updates: { role: 'user' } }));
// Michael manages by id even when his own row is not privileged, so this is the one
// realistic way to reach the "keep one admin" backstop.
await check('Demotion leaving no admin', 'update-user', 403, () => call('update-user', michael, { targetUserId: AJ_ID, updates: { role: 'user' } }, [{ ...michael, role: 'user' }, aj, member]));
await check('Anonymous edit', 'update-user', 401, () => call('update-user', null, { targetUserId: member.id, updates: profileEdit }));

await check('Michael unlocks AJ', 'unlock-account', 200, () => call('unlock-account', michael, { targetUserId: AJ_ID }));
await check('AJ unlocks Michael', 'unlock-account', 403, () => call('unlock-account', aj, { targetUserId: MICHAEL_ID }));
await check('AJ unlocks a member', 'unlock-account', 200, () => call('unlock-account', aj, { targetUserId: member.id }));
await check('Future admin unlocks AJ', 'unlock-account', 403, () => call('unlock-account', futureAdmin, { targetUserId: AJ_ID }));
await check('Member unlocks another member', 'unlock-account', 403, () => call('unlock-account', member, { targetUserId: otherMember.id }));

await check('Admin deletes a member', 'delete-user', 200, () => call('delete-user', futureAdmin, { targetUserId: member.id }));
await check('Michael deletes AJ', 'delete-user', 403, () => call('delete-user', michael, { targetUserId: AJ_ID }));
await check('AJ deletes Michael', 'delete-user', 403, () => call('delete-user', aj, { targetUserId: MICHAEL_ID }));
await check('Admin deletes themselves', 'delete-user', 403, () => call('delete-user', futureAdmin, { targetUserId: futureAdmin.id }));
await check('Member deletes another member', 'delete-user', 403, () => call('delete-user', member, { targetUserId: otherMember.id }));

await check('Admin invites a member', 'create-user', 200, () => call('create-user', futureAdmin, { full_name: 'New Person', email: 'new@urmeinc.com', password: 'hunter2hunter2' }));
await check('AJ invites a member', 'create-user', 200, () => call('create-user', aj, { full_name: 'New Person', email: 'new2@urmeinc.com', password: 'hunter2hunter2' }));
await check('Member invites a member', 'create-user', 403, () => call('create-user', member, { full_name: 'New Person', email: 'new3@urmeinc.com', password: 'hunter2hunter2' }));
await check('Anonymous invite', 'create-user', 401, () => call('create-user', null, { full_name: 'New Person', email: 'new4@urmeinc.com', password: 'hunter2hunter2' }));

const pad = (value: string, width: number) => value.padEnd(width);
console.log('');
console.log(`${pad('SCENARIO', 38)}${pad('FUNCTION', 16)}${pad('STATUS', 8)}RESULT`);
console.log('-'.repeat(110));
for (const [label, fn, status, result] of rows) {
  console.log(`${pad(label, 38)}${pad(fn, 16)}${pad(String(status), 8)}${result}`);
}
console.log('-'.repeat(110));

// The '' paid_through_date above must reach the database as null, like the PostgREST adapter does.
resetState(everyone.map((p) => ({ ...p })), { id: futureAdmin.id });
await call('update-user', futureAdmin, { targetUserId: member.id, updates: { paid_through_date: '' } });
const normalised = state.updated?.paid_through_date === null;
if (!normalised) failures += 1;
console.log(`Empty string normalised to null before the write: ${normalised ? 'PASS' : 'FAIL'}`);

console.log(`\n${rows.length + 1} checks, ${failures} failure(s)`);
if (failures > 0) Deno.exit(1);
