-- Account management is now server-side: supabase/functions/update-user, delete-user and
-- unlock-account authenticate the caller, apply the canManage rule and write with the
-- service role (which bypasses RLS). PostgREST therefore no longer needs to let one
-- signed-in member write another member's profile row, and it must not let anyone hand
-- themselves a role, a subscription or an unlock.
--
-- Human-applied, like every migration in this repo, and only after
-- 20260814072821_schema_reconciliation.sql (the trigger below names columns that
-- migration adds). Re-test after applying:
--   * Profile page self-save                                  -> allowed
--   * Team -> edit another member -> Save                      -> allowed, via update-user
--   * A standard member editing anyone else through PostgREST  -> denied
--   * Anyone setting their own role/subscription/lock state     -> denied

alter table public.profiles enable row level security;

-- Replace whatever UPDATE policies the hand-rebuilt database ended up with. Policies
-- declared FOR ALL are left alone on purpose: dropping one would take SELECT/INSERT/
-- DELETE with it. The notice below flags them for a human to narrow by hand.
do $$
declare
  policy_name text;
begin
  for policy_name in
    select polname from pg_policy
    where polrelid = 'public.profiles'::regclass and polcmd = 'w'
  loop
    execute format('drop policy if exists %I on public.profiles', policy_name);
  end loop;

  for policy_name in
    select polname from pg_policy
    where polrelid = 'public.profiles'::regclass and polcmd = '*'
  loop
    raise notice 'profiles policy "%" is FOR ALL and still permits UPDATE; narrow it by hand', policy_name;
  end loop;
end
$$;

create policy profiles_self_update on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Self-service updates are for profile content only. Role, lockout state and
-- subscription state are management fields and belong to the Edge Functions.
create or replace function public.profiles_block_privileged_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- PostgREST runs as authenticated/anon; the Edge Functions run as service_role and
  -- are deliberately exempt, as is a human on psql.
  if current_user in ('authenticated', 'anon') then
    if new.role is distinct from old.role
      or new.account_locked is distinct from old.account_locked
      or new.failed_login_attempts is distinct from old.failed_login_attempts
      or new.subscription_status is distinct from old.subscription_status
      or new.paid_through_date is distinct from old.paid_through_date
    then
      raise exception 'Privileged profile columns can only be changed through the account-management functions.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_privileged_self_update on public.profiles;
create trigger profiles_block_privileged_self_update
  before update on public.profiles
  for each row execute function public.profiles_block_privileged_self_update();
