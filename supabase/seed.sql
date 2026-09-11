-- ---------------------------------------------------------------------------
-- Local seed data
--
-- Applied automatically by `supabase db reset`. Creates two confirmed test
-- users you can sign in as immediately:
--
--   mara@example.com / password123   (free plan)
--   luca@example.com / password123   (premium plan)
--
-- Local development only — never run this against a hosted project.
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated', 'authenticated', 'mara@example.com',
    crypt('password123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Mara Ellis","avatar_emoji":"🎸"}'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated', 'authenticated', 'luca@example.com',
    crypt('password123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Luca Rossi","avatar_emoji":"🍝"}'
  )
on conflict (id) do nothing;

-- Email/password identities so sign-in works.
insert into auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"mara@example.com","email_verified":true}',
   'email', now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   '{"sub":"22222222-2222-2222-2222-222222222222","email":"luca@example.com","email_verified":true}',
   'email', now(), now())
on conflict do nothing;

-- The handle_new_user() trigger created both profiles; make Luca premium.
-- (Direct SQL here runs as the migration owner, so the billing-column guard
-- does not apply — it only blocks clients with an auth.uid().)
update public.profiles set plan = 'premium' where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set bio  = 'Session guitarist, ten years of teaching beginners.'
  where id = '11111111-1111-1111-1111-111111111111';

insert into public.skill_listings (user_id, title, category, description) values
  ('11111111-1111-1111-1111-111111111111', 'Fingerstyle guitar', 'Music',
   'An hour a week, beginner friendly, bring your own guitar.'),
  ('22222222-2222-2222-2222-222222222222', 'Italian cooking', 'Cooking',
   'Fresh pasta from scratch. Bring an apron, leave with dinner.')
on conflict do nothing;

insert into public.wanted_skills (user_id, title, category) values
  ('11111111-1111-1111-1111-111111111111', 'Italian cooking', 'Cooking'),
  ('22222222-2222-2222-2222-222222222222', 'Fingerstyle guitar', 'Music')
on conflict do nothing;
