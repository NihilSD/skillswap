-- ===========================================================================
-- Plan usage snapshot
--
-- One call returning everything the /profile usage widget shows. It is built
-- from the SAME functions the enforcement triggers call, so the numbers on
-- screen can never drift from what the database will actually allow.
-- A null max means "unlimited".
-- ===========================================================================

create or replace function public.get_plan_usage(p_user_id uuid)
returns table (
  plan                   text,
  listings_used          int,
  listings_max           int,
  active_listings_used   int,
  active_listings_max    int,
  requests_today         int,
  requests_max           int,
  requests_reset_at      timestamptz,
  messages_today         int,
  messages_max           int,
  messages_reset_at      timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    public.user_plan(p_user_id),
    (select count(*)::int from public.skill_listings where user_id = p_user_id),
    public.max_skill_listings(p_user_id),
    (select count(*)::int from public.skill_listings where user_id = p_user_id and active),
    public.max_active_skill_listings(p_user_id),
    public.swap_requests_sent_today(p_user_id),
    public.max_swap_requests_per_day(p_user_id),
    public.swap_request_reset_at(p_user_id),
    public.messages_sent_today(p_user_id),
    public.max_messages_per_day(p_user_id),
    public.message_reset_at(p_user_id);
$$;

grant execute on function public.get_plan_usage(uuid) to authenticated;
