alter table if exists public.profiles
  add column if not exists failed_login_attempts integer not null default 0,
  add column if not exists account_locked boolean not null default false,
  add column if not exists mfa_enabled boolean not null default false;

update public.profiles
set failed_login_attempts = coalesce(failed_login_attempts, 0),
    account_locked = coalesce(account_locked, false),
    mfa_enabled = coalesce(mfa_enabled, false);

alter table if exists public.profiles
  alter column failed_login_attempts set default 0,
  alter column account_locked set default false,
  alter column mfa_enabled set default false;
