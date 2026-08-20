-- ===========================================================================
-- Security hardening — findings from the penetration test
--
-- 1. A message recipient could rewrite the CONTENT of a message sent to them,
--    which stayed attributed to the original sender (message forgery).
-- 2. Any signed-in user could read everyone's stripe_customer_id and
--    stripe_subscription_id through the public directory policy.
-- 3. No length limits on user-supplied text: a 200 KB bio, a 5,000-character
--    display name and a 1,000-character "emoji" were all accepted.
-- 4. The sender of a swap request could rewrite its message after sending.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Messages are immutable except for the read receipt
--
-- RLS is row-level: "you may update rows addressed to you" cannot express
-- "but only the read_at column". A trigger can.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_message_immutability()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Service role (no auth.uid()) is trusted server-side code.
  if auth.uid() is null then
    return new;
  end if;

  if new.content   is distinct from old.content
     or new.sender_id   is distinct from old.sender_id
     or new.receiver_id is distinct from old.receiver_id
     or new.created_at  is distinct from old.created_at then
    raise exception 'A sent message cannot be altered'
      using errcode = 'SS008',
            hint = 'Only the read receipt (read_at) may be updated.';
  end if;

  return new;
end;
$$;

create trigger messages_enforce_immutability
  before update on public.messages
  for each row execute function public.enforce_message_immutability();

-- ---------------------------------------------------------------------------
-- 2. Hide billing identifiers from the client entirely
--
-- A table-level GRANT covers every column, so the column subset has to be
-- re-granted after revoking the table-level privilege. After this, the anon
-- and authenticated roles cannot read stripe_customer_id or
-- stripe_subscription_id at all — not even their own. The Stripe routes read
-- the caller's own value through the SECURITY DEFINER function below, and the
-- webhook writes them as the service role.
-- ---------------------------------------------------------------------------

revoke select on public.profiles from anon, authenticated;
grant  select (id, name, avatar_emoji, bio, plan, created_at)
  on public.profiles to anon, authenticated;

-- Writes are narrowed to the three fields the profile form actually edits.
revoke update on public.profiles from anon, authenticated;
grant  update (name, avatar_emoji, bio) on public.profiles to authenticated;

create or replace function public.my_stripe_customer_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select stripe_customer_id from public.profiles where id = auth.uid();
$$;

grant execute on function public.my_stripe_customer_id() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Length limits on everything a user can type
--
-- Without these a single request can store hundreds of kilobytes per row, and
-- oversized values break every layout that renders them.
-- ---------------------------------------------------------------------------

update public.profiles set
  name         = left(name, 60),
  bio          = left(bio, 280),
  avatar_emoji = left(avatar_emoji, 8);

alter table public.profiles
  add constraint profiles_name_length         check (length(name) <= 60),
  add constraint profiles_bio_length          check (bio is null or length(bio) <= 280),
  add constraint profiles_avatar_emoji_length check (length(avatar_emoji) between 1 and 8);

alter table public.skill_listings
  add constraint skill_listings_title_length       check (length(title) between 2 and 80),
  add constraint skill_listings_description_length check (length(description) <= 400),
  add constraint skill_listings_category_length    check (length(category) <= 40);

alter table public.wanted_skills
  add constraint wanted_skills_title_length    check (length(title) between 2 and 80),
  add constraint wanted_skills_category_length check (length(category) <= 40);

alter table public.messages
  add constraint messages_content_length check (length(content) <= 2000);

alter table public.swap_requests
  add constraint swap_requests_message_length check (message is null or length(message) <= 400);

alter table public.ratings
  add constraint ratings_comment_length check (comment is null or length(comment) <= 280);

-- ---------------------------------------------------------------------------
-- 4. A swap request's message is fixed once sent
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

  -- The message is part of the record the recipient acted on; it must not be
  -- rewritten after the fact.
  if v_uid is not null and new.message is distinct from old.message then
    raise exception 'A sent swap request message cannot be edited' using errcode = 'SS006';
  end if;

  if new.status = old.status then
    return new;
  end if;

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
