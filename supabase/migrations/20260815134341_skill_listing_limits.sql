-- ===========================================================================
-- Plan limits for skill listings
--
-- RLS can say "this row is yours". It cannot say "you already have as many of
-- these as your plan allows" — that needs a count. So the caps from
-- docs/plan-limits.md live in these functions, called from BEFORE triggers on
-- skill_listings. Enforcement therefore holds for the UI, a hand-crafted API
-- call, Studio's SQL editor as that user, or any future admin tool.
--
--   Free    — 1 listing total, 1 active
--   Premium — 3 listings total, 3 active
-- ===========================================================================

-- Plan of a user, defaulting to the most restrictive answer if the profile is
-- somehow missing.
create or replace function public.user_plan(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select plan from public.profiles where id = p_user_id), 'free');
$$;

-- Maximum number of listings (total and active are the same cap today, but
-- they are separate functions so they can diverge without touching callers).
create or replace function public.max_skill_listings(p_user_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case when public.user_plan(p_user_id) = 'premium' then 3 else 1 end;
$$;

create or replace function public.max_active_skill_listings(p_user_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case when public.user_plan(p_user_id) = 'premium' then 3 else 1 end;
$$;

-- True when the user has room for one more listing.
create or replace function public.can_add_skill_listing(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select count(*) from public.skill_listings where user_id = p_user_id)
         < public.max_skill_listings(p_user_id);
$$;

-- True when the user has room for one more ACTIVE listing.
create or replace function public.can_activate_skill_listing(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select count(*) from public.skill_listings where user_id = p_user_id and active)
         < public.max_active_skill_listings(p_user_id);
$$;

grant execute on function public.user_plan(uuid)                  to authenticated;
grant execute on function public.max_skill_listings(uuid)         to authenticated;
grant execute on function public.max_active_skill_listings(uuid)  to authenticated;
grant execute on function public.can_add_skill_listing(uuid)      to authenticated;
grant execute on function public.can_activate_skill_listing(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
--
-- Custom SQLSTATEs let the UI map a limit to friendly copy plus an upgrade
-- link, instead of surfacing a raw Postgres error:
--   SS001 — too many listings in total
--   SS002 — too many ACTIVE listings
-- ---------------------------------------------------------------------------

create or replace function public.enforce_skill_listing_insert_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_add_skill_listing(new.user_id) then
    raise exception
      'Plan limit reached: % listing(s) allowed on the % plan',
      public.max_skill_listings(new.user_id), public.user_plan(new.user_id)
      using errcode = 'SS001',
            hint = 'Upgrade to Premium at /pricing to list more skills.';
  end if;

  if new.active and not public.can_activate_skill_listing(new.user_id) then
    raise exception
      'Plan limit reached: % active listing(s) allowed on the % plan',
      public.max_active_skill_listings(new.user_id), public.user_plan(new.user_id)
      using errcode = 'SS002',
            hint = 'Deactivate another skill or upgrade to Premium at /pricing.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_skill_listing_update_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only an inactive -> active transition can breach the active cap.
  if new.active and not old.active
     and not public.can_activate_skill_listing(new.user_id) then
    raise exception
      'Plan limit reached: % active listing(s) allowed on the % plan',
      public.max_active_skill_listings(new.user_id), public.user_plan(new.user_id)
      using errcode = 'SS002',
            hint = 'Deactivate another skill or upgrade to Premium at /pricing.';
  end if;

  -- A listing may never be handed to another user.
  if new.user_id <> old.user_id then
    raise exception 'A skill listing cannot change owner' using errcode = 'SS005';
  end if;

  return new;
end;
$$;

create trigger skill_listings_enforce_insert_limit
  before insert on public.skill_listings
  for each row execute function public.enforce_skill_listing_insert_limit();

create trigger skill_listings_enforce_update_limit
  before update on public.skill_listings
  for each row execute function public.enforce_skill_listing_update_limit();
