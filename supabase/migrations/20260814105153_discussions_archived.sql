-- Discussion archiving: a dedicated flag instead of overwriting the category.
--
-- pages/SyncHub.jsx archived a thread by writing { category: 'archived' }, which
-- destroys the thread's real category (general / business / event / idea /
-- announcement) and is not one of the values the category filter offers.
--
-- Additive and idempotent. NOT applied -- a human runs this, and it has to be
-- applied before the matching SyncHub.jsx change ships, otherwise archiving a
-- thread fails with PGRST204 ("Could not find the 'archived' column of
-- 'discussions' in the schema cache").

begin;

alter table if exists public.discussions
  add column if not exists archived boolean not null default false;

-- Carry over threads archived the old way. Their category stays 'archived' --
-- the original value is not recoverable from the row -- so they are kept out of
-- the active list by the flag alone.
update public.discussions
   set archived = true
 where archived = false
   and category = 'archived';

commit;
