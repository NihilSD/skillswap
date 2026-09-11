-- ===========================================================================
-- Discover / marketplace query
--
-- Filtering is a Premium feature. Rather than trusting the UI to hide the
-- filter bar, the gate lives here: the function reads the caller's plan and
-- silently drops the search/category/sort arguments for free users. A crafted
-- request with ?q=…&category=… therefore returns the same plain, newest-first
-- list a free user gets in the UI.
--
-- SECURITY INVOKER (the default) so RLS still applies on top: only active
-- listings and public profile fields ever come back.
-- ===========================================================================

create or replace function public.discover_listings(
  p_search   text default null,
  p_category text default null,
  p_sort     text default 'newest'
)
returns table (
  id          uuid,
  title       text,
  category    text,
  description text,
  created_at  timestamptz,
  teacher_id  uuid,
  name        text,
  avatar_emoji text,
  bio         text,
  match_score int
)
language plpgsql
stable
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_premium boolean;
begin
  if v_uid is null then
    return;
  end if;

  v_premium := public.user_plan(v_uid) = 'premium';

  -- The gate. Free plan gets a plain, unfiltered, newest-first list.
  if not v_premium then
    p_search   := null;
    p_category := null;
    p_sort     := 'newest';
  end if;

  p_search := nullif(trim(coalesce(p_search, '')), '');

  return query
  select
    l.id,
    l.title,
    l.category,
    l.description,
    l.created_at,
    p.id            as teacher_id,
    p.name,
    p.avatar_emoji,
    p.bio,
    m.score::int    as match_score
  from public.skill_listings l
  join public.profiles p on p.id = l.user_id
  cross join lateral (
    -- How well this listing lines up with what the viewer wants to learn:
    -- an exact title match counts double, a shared category counts once.
    select coalesce(sum(
             case when lower(w.title) = lower(l.title) then 2
                  when w.category = l.category        then 1
                  else 0 end), 0) as score
    from public.wanted_skills w
    where w.user_id = v_uid
  ) m
  where l.active
    and l.user_id <> v_uid
    and (p_category is null or l.category = p_category)
    and (
      p_search is null
      or l.title ilike '%' || p_search || '%'
      or l.description ilike '%' || p_search || '%'
      or l.category ilike '%' || p_search || '%'
      or p.name ilike '%' || p_search || '%'
    )
  order by
    case when p_sort = 'match' then m.score end desc nulls last,
    l.created_at desc;
end;
$$;

grant execute on function public.discover_listings(text, text, text) to authenticated;
