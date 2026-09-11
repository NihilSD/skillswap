-- ===========================================================================
-- Leaderboard
--
-- Ranked by completed swaps, then average rating. Aggregated in one query in
-- the database rather than N+1 round trips from Next.js.
-- ===========================================================================

create or replace function public.get_leaderboard(p_limit int default 50)
returns table (
  rank            bigint,
  user_id         uuid,
  name            text,
  avatar_emoji    text,
  completed_swaps bigint,
  avg_rating      numeric,
  ratings_count   bigint,
  skills          text[]
)
language sql
stable
security definer
set search_path = public
as $$
  with completed as (
    -- A completed swap counts for both parties.
    select p.id as user_id, count(sr.id) as completed_swaps
    from public.profiles p
    left join public.swap_requests sr
      on sr.status = 'completed'
     and p.id in (sr.from_user_id, sr.to_user_id)
    group by p.id
  ),
  rated as (
    select rated_user_id as user_id,
           round(avg(score)::numeric, 2) as avg_rating,
           count(*) as ratings_count
    from public.ratings
    group by rated_user_id
  ),
  tagged as (
    select user_id, array_agg(title order by created_at) as skills
    from (
      select user_id, title, created_at,
             row_number() over (partition by user_id order by created_at) as rn
      from public.skill_listings
      where active
    ) s
    where rn <= 2
    group by user_id
  )
  select
    rank() over (
      order by c.completed_swaps desc,
               coalesce(r.avg_rating, 0) desc,
               coalesce(r.ratings_count, 0) desc,
               p.created_at
    ) as rank,
    p.id,
    p.name,
    p.avatar_emoji,
    c.completed_swaps,
    r.avg_rating,
    coalesce(r.ratings_count, 0) as ratings_count,
    coalesce(t.skills, array[]::text[]) as skills
  from public.profiles p
  join completed c on c.user_id = p.id
  left join rated  r on r.user_id = p.id
  left join tagged t on t.user_id = p.id
  order by rank
  limit p_limit;
$$;

-- A user outside the visible top N still gets to see where they stand.
create or replace function public.get_user_rank(p_user_id uuid)
returns table (
  rank            bigint,
  completed_swaps bigint,
  avg_rating      numeric,
  ratings_count   bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select rank, completed_swaps, avg_rating, ratings_count
  from public.get_leaderboard(1000000)
  where user_id = p_user_id;
$$;

grant execute on function public.get_leaderboard(int)  to authenticated;
grant execute on function public.get_user_rank(uuid)   to authenticated;
