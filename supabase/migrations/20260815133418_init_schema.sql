-- ===========================================================================
-- SkillSwap — initial schema
--
-- Identity comes from Supabase's built-in auth.users table. Everything below
-- hangs off a public.profiles row that is created automatically by a trigger
-- on auth.users, so profiles can never drift out of sync with auth.
--
-- Row Level Security is enabled on every table and is the primary access
-- control layer: the anon/authenticated keys can only ever see what these
-- policies allow.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  name                   text not null default '',
  avatar_emoji           text not null default '🙂',
  bio                    text,
  plan                   text not null default 'free' check (plan in ('free', 'premium')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz not null default now()
);

comment on table public.profiles is
  'Public profile for each auth.users row. Created automatically by handle_new_user().';

create table public.skill_listings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  category    text not null,
  description text not null default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.skill_listings is
  'Skills a user offers to teach. Plan caps are enforced by triggers added in Stage 3.';

create table public.wanted_skills (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  category   text not null,
  created_at timestamptz not null default now()
);

comment on table public.wanted_skills is
  'Skills a user wants to learn. No plan limit applies here.';

create table public.swap_requests (
  id                       uuid primary key default gen_random_uuid(),
  from_user_id             uuid not null references public.profiles (id) on delete cascade,
  to_user_id               uuid not null references public.profiles (id) on delete cascade,
  offered_skill_listing_id uuid not null references public.skill_listings (id) on delete cascade,
  message                  text,
  status                   text not null default 'pending'
                             check (status in ('pending', 'accepted', 'declined', 'completed')),
  created_at               timestamptz not null default now(),
  constraint swap_requests_no_self_request check (from_user_id <> to_user_id)
);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content     text not null check (length(trim(content)) > 0),
  created_at  timestamptz not null default now(),
  read_at     timestamptz,
  constraint messages_no_self_message check (sender_id <> receiver_id)
);

create table public.ratings (
  id              uuid primary key default gen_random_uuid(),
  swap_request_id uuid not null references public.swap_requests (id) on delete cascade,
  rater_user_id   uuid not null references public.profiles (id) on delete cascade,
  rated_user_id   uuid not null references public.profiles (id) on delete cascade,
  score           int not null check (score between 1 and 5),
  comment         text,
  created_at      timestamptz not null default now(),
  constraint ratings_one_per_rater_per_swap unique (swap_request_id, rater_user_id),
  constraint ratings_no_self_rating check (rater_user_id <> rated_user_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
--
-- The first two back the rolling 24-hour "how many have I sent today?" counts
-- used by the plan-limit functions in Stages 5 and 6.
-- ---------------------------------------------------------------------------

create index swap_requests_from_user_created_at_idx
  on public.swap_requests (from_user_id, created_at desc);

create index messages_sender_created_at_idx
  on public.messages (sender_id, created_at desc);

create index skill_listings_user_id_idx    on public.skill_listings (user_id);
create index skill_listings_active_idx     on public.skill_listings (active, created_at desc);
create index wanted_skills_user_id_idx     on public.wanted_skills (user_id);
create index swap_requests_to_user_idx     on public.swap_requests (to_user_id, created_at desc);
create index messages_receiver_created_idx on public.messages (receiver_id, created_at desc);
create index ratings_rated_user_id_idx     on public.ratings (rated_user_id);

-- ---------------------------------------------------------------------------
-- Keep profiles in sync with auth.users
--
-- SECURITY DEFINER so the insert runs as the function owner and is not blocked
-- by the RLS policies below. search_path is pinned for safety.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_emoji, plan)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'avatar_emoji', ''), '🙂'),
    'free'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.skill_listings enable row level security;
alter table public.wanted_skills  enable row level security;
alter table public.swap_requests  enable row level security;
alter table public.messages       enable row level security;
alter table public.ratings        enable row level security;

-- profiles ------------------------------------------------------------------
-- The directory is public to signed-in users. Only the owner can change a row.
-- (Stripe columns are never selected by client code; the service role handles
-- those in Stage 8.)

create policy "Signed-in users can read every profile"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- skill_listings ------------------------------------------------------------
-- Anyone signed in sees active listings; you additionally see your own
-- inactive ones so you can manage them from /profile.

create policy "Signed-in users can read active listings"
  on public.skill_listings for select
  to authenticated
  using (active or auth.uid() = user_id);

create policy "Users can create their own listings"
  on public.skill_listings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own listings"
  on public.skill_listings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own listings"
  on public.skill_listings for delete
  to authenticated
  using (auth.uid() = user_id);

-- wanted_skills -------------------------------------------------------------
-- Readable by any signed-in user (the Stage 4 "best match" sort compares
-- listings against the viewer's own wants), writable only by the owner.

create policy "Signed-in users can read wanted skills"
  on public.wanted_skills for select
  to authenticated
  using (true);

create policy "Users can create their own wanted skills"
  on public.wanted_skills for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own wanted skills"
  on public.wanted_skills for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own wanted skills"
  on public.wanted_skills for delete
  to authenticated
  using (auth.uid() = user_id);

-- swap_requests -------------------------------------------------------------
-- Only the two parties can see a request. You can only send as yourself, and
-- you can never rewrite who the request is between.

create policy "Participants can read their swap requests"
  on public.swap_requests for select
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can only send swap requests as themselves"
  on public.swap_requests for insert
  to authenticated
  with check (auth.uid() = from_user_id);

create policy "Participants can update their swap requests"
  on public.swap_requests for update
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id)
  with check (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- messages ------------------------------------------------------------------

create policy "Participants can read their messages"
  on public.messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can only send messages as themselves"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- Lets the recipient stamp read_at. The sender cannot edit a sent message.
create policy "Recipients can mark messages read"
  on public.messages for update
  to authenticated
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- ratings -------------------------------------------------------------------
-- Ratings are public to signed-in users (they feed the Stage 7 leaderboard),
-- but you can only ever write one as yourself, for a swap you took part in,
-- about the other party, once it is completed.

create policy "Signed-in users can read ratings"
  on public.ratings for select
  to authenticated
  using (true);

create policy "Participants can rate a completed swap"
  on public.ratings for insert
  to authenticated
  with check (
    auth.uid() = rater_user_id
    and rater_user_id <> rated_user_id
    and exists (
      select 1
      from public.swap_requests sr
      where sr.id = swap_request_id
        and sr.status = 'completed'
        and auth.uid() in (sr.from_user_id, sr.to_user_id)
        and rated_user_id in (sr.from_user_id, sr.to_user_id)
    )
  );
