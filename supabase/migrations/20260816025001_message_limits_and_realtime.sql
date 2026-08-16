-- ===========================================================================
-- Private messages: daily send limit + Realtime
--
--   Free    — 10 messages per rolling 24 hours
--   Premium — unlimited (the check is skipped entirely)
-- ===========================================================================

create or replace function public.max_messages_per_day(p_user_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  -- NULL means "no limit".
  select case when public.user_plan(p_user_id) = 'premium' then null::int else 10 end;
$$;

create or replace function public.messages_sent_today(p_user_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.messages
  where sender_id = p_user_id
    and created_at > now() - interval '24 hours';
$$;

create or replace function public.can_send_message(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
           when public.max_messages_per_day(p_user_id) is null then true
           else public.messages_sent_today(p_user_id) < public.max_messages_per_day(p_user_id)
         end;
$$;

create or replace function public.message_reset_at(p_user_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select min(created_at) + interval '24 hours'
  from public.messages
  where sender_id = p_user_id
    and created_at > now() - interval '24 hours';
$$;

grant execute on function public.max_messages_per_day(uuid) to authenticated;
grant execute on function public.messages_sent_today(uuid)  to authenticated;
grant execute on function public.can_send_message(uuid)     to authenticated;
grant execute on function public.message_reset_at(uuid)     to authenticated;

create or replace function public.enforce_message_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_send_message(new.sender_id) then
    raise exception
      'Daily limit reached: % messages per day on the free plan',
      public.max_messages_per_day(new.sender_id)
      using errcode = 'SS004',
            hint = 'Upgrade to Premium at /pricing for unlimited messaging.';
  end if;

  return new;
end;
$$;

create trigger messages_enforce_daily_limit
  before insert on public.messages
  for each row execute function public.enforce_message_limit();

-- ---------------------------------------------------------------------------
-- Realtime
--
-- Realtime is opt-in per table. This covers local development and any hosted
-- project the migration is pushed to — but remember the hosted project also
-- needs Realtime enabled for the table in the dashboard (Stage 9 checklist).
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;
  end if;
end;
$$;

-- Realtime only ships the primary key on UPDATE/DELETE unless the table has a
-- full replica identity; messages are INSERT-driven, but this keeps read
-- receipts usable too.
alter table public.messages replica identity full;
