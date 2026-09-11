-- ===========================================================================
-- Swap requests: daily send limit + legal status transitions
--
--   Free    — 1 request per rolling 24 hours
--   Premium — 3 per rolling 24 hours
--
-- Same pattern as the skill-listing caps: the count lives in a function, the
-- function is called from a BEFORE INSERT trigger, so the limit holds however
-- the row is inserted.
-- ===========================================================================

create or replace function public.max_swap_requests_per_day(p_user_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case when public.user_plan(p_user_id) = 'premium' then 3 else 1 end;
$$;

create or replace function public.swap_requests_sent_today(p_user_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.swap_requests
  where from_user_id = p_user_id
    and created_at > now() - interval '24 hours';
$$;

create or replace function public.can_send_swap_request(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.swap_requests_sent_today(p_user_id)
         < public.max_swap_requests_per_day(p_user_id);
$$;

-- When the oldest request inside the window ages out, the user gets a slot
-- back. The UI turns this into a live "resets in Xh Ym" countdown.
create or replace function public.swap_request_reset_at(p_user_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select min(created_at) + interval '24 hours'
  from public.swap_requests
  where from_user_id = p_user_id
    and created_at > now() - interval '24 hours';
$$;

grant execute on function public.max_swap_requests_per_day(uuid) to authenticated;
grant execute on function public.swap_requests_sent_today(uuid)  to authenticated;
grant execute on function public.can_send_swap_request(uuid)     to authenticated;
grant execute on function public.swap_request_reset_at(uuid)     to authenticated;

create or replace function public.enforce_swap_request_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_send_swap_request(new.from_user_id) then
    raise exception
      'Daily limit reached: % swap request(s) per day on the % plan',
      public.max_swap_requests_per_day(new.from_user_id),
      public.user_plan(new.from_user_id)
      using errcode = 'SS003',
            hint = 'Upgrade to Premium at /pricing for more requests per day.';
  end if;

  return new;
end;
$$;

create trigger swap_requests_enforce_daily_limit
  before insert on public.swap_requests
  for each row execute function public.enforce_swap_request_limit();

-- ---------------------------------------------------------------------------
-- Status transitions
--
-- RLS lets both participants update the row; this narrows that down to the
-- moves that actually make sense, and to the party allowed to make them.
--   pending  -> accepted | declined   (recipient only)
--   accepted -> completed             (either party)
-- Nothing else, and never a change of participants or offered skill.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_swap_request_transition()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if new.from_user_id <> old.from_user_id
     or new.to_user_id <> old.to_user_id
     or new.offered_skill_listing_id <> old.offered_skill_listing_id then
    raise exception 'A swap request cannot change participants' using errcode = 'SS006';
  end if;

  if new.status = old.status then
    return new;
  end if;

  -- The service role (v_uid is null) is trusted; it is only ever used by
  -- server-side code we control.
  if v_uid is null then
    return new;
  end if;

  if old.status = 'pending' and new.status in ('accepted', 'declined') then
    if v_uid <> old.to_user_id then
      raise exception 'Only the recipient can accept or decline a request'
        using errcode = 'SS006';
    end if;
  elsif old.status = 'accepted' and new.status = 'completed' then
    if v_uid not in (old.from_user_id, old.to_user_id) then
      raise exception 'Only a participant can complete a swap' using errcode = 'SS006';
    end if;
  else
    raise exception 'Cannot move a swap request from % to %', old.status, new.status
      using errcode = 'SS006';
  end if;

  return new;
end;
$$;

create trigger swap_requests_enforce_transition
  before update on public.swap_requests
  for each row execute function public.enforce_swap_request_transition();
