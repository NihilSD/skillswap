-- ===========================================================================
-- Protect the billing columns on profiles
--
-- Found during the Stage 9 enforcement audit: the "users can update their own
-- profile" RLS policy is row-level, not column-level, so a signed-in user
-- could PATCH their own row and set plan = 'premium' — granting themselves
-- every paid limit without paying.
--
-- RLS cannot express "these columns are off limits", so a trigger does it.
-- Only the service role (auth.uid() is null — the Stripe webhook) may change
-- plan, stripe_customer_id or stripe_subscription_id.
-- ===========================================================================

create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- The service role bypasses this: it has no auth.uid() and is only used by
  -- the Stripe webhook, which is the sole legitimate writer of these columns.
  if auth.uid() is null then
    return new;
  end if;

  if new.plan is distinct from old.plan then
    raise exception 'Your plan is set by billing, not by the profile form'
      using errcode = 'SS007',
            hint = 'Upgrade through Stripe Checkout at /pricing.';
  end if;

  if new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id then
    raise exception 'Billing identifiers cannot be changed from the client'
      using errcode = 'SS007';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_billing_columns
  before update on public.profiles
  for each row execute function public.protect_profile_billing_columns();
