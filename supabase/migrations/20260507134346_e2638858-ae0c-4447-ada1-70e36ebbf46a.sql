ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS username text;

CREATE OR REPLACE FUNCTION public.claim_username(_preferred text, _email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base text;
  candidate text;
  suffix int := 0;
BEGIN
  base := lower(regexp_replace(coalesce(nullif(trim(_preferred), ''), split_part(coalesce(_email, 'user'), '@', 1), 'user'), '[^a-zA-Z0-9_]', '_', 'g'));
  base := trim(both '_' from base);
  IF length(base) < 3 THEN
    base := 'user_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  END IF;
  base := substr(base, 1, 20);
  candidate := base;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    suffix := suffix + 1;
    candidate := substr(base, 1, greatest(3, 20 - length(suffix::text) - 1)) || '_' || suffix::text;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chosen_role public.app_role;
  chosen_username text;
BEGIN
  chosen_role := CASE
    WHEN lower(coalesce(new.raw_user_meta_data->>'role', '')) IN ('agent', 'landlord') THEN 'agent'::public.app_role
    ELSE 'user'::public.app_role
  END;

  chosen_username := public.claim_username(new.raw_user_meta_data->>'username', new.email);

  INSERT INTO public.profiles (user_id, full_name, phone, agency_name, username)
  VALUES (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email,'@',1)),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'agency_name', '')), ''),
    chosen_username
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    phone = coalesce(public.profiles.phone, excluded.phone),
    agency_name = coalesce(public.profiles.agency_name, excluded.agency_name),
    username = coalesce(public.profiles.username, excluded.username),
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role, username)
  VALUES (new.id, chosen_role, chosen_username)
  ON CONFLICT (user_id, role) DO UPDATE SET username = excluded.username;

  INSERT INTO public.wallets (user_id, available_balance, escrow_balance)
  VALUES (new.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.sync_role_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_roles
  SET username = NEW.username
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_username_to_roles ON public.profiles;
CREATE TRIGGER sync_profile_username_to_roles
AFTER INSERT OR UPDATE OF username ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_role_username();

UPDATE public.user_roles ur
SET username = p.username
FROM public.profiles p
WHERE p.user_id = ur.user_id
  AND ur.username IS DISTINCT FROM p.username;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_paystack_reference_unique
ON public.transactions (description)
WHERE type = 'fund' AND description LIKE 'Paystack:%';

CREATE OR REPLACE FUNCTION public.credit_paystack_wallet(_user_id uuid, _amount bigint, _reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_balance bigint;
BEGIN
  IF _user_id IS NULL OR _amount IS NULL OR _amount <= 0 OR nullif(trim(_reference), '') IS NULL THEN
    RAISE EXCEPTION 'Invalid wallet credit request';
  END IF;

  INSERT INTO public.wallets (user_id, available_balance, escrow_balance)
  VALUES (_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  IF EXISTS (
    SELECT 1 FROM public.transactions
    WHERE type = 'fund' AND description = 'Paystack: ' || _reference
  ) THEN
    SELECT available_balance INTO new_balance FROM public.wallets WHERE user_id = _user_id;
    RETURN jsonb_build_object('already', true, 'balance', new_balance);
  END IF;

  UPDATE public.wallets
  SET available_balance = available_balance + _amount,
      updated_at = now()
  WHERE user_id = _user_id
  RETURNING available_balance INTO new_balance;

  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (_user_id, 'fund', _amount, 'Paystack: ' || _reference);

  RETURN jsonb_build_object('already', false, 'balance', new_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.credit_paystack_wallet(uuid, bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_paystack_wallet(uuid, bigint, text) FROM anon;
REVOKE ALL ON FUNCTION public.credit_paystack_wallet(uuid, bigint, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.credit_paystack_wallet(uuid, bigint, text) TO service_role;