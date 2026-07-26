CREATE OR REPLACE FUNCTION public.is_permanent_admin_email(_email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT lower(coalesce(_email, '')) IN ('home-let@zohomail.com', 'odamajames65@gmail.com')
$$;

REVOKE ALL ON FUNCTION public.is_permanent_admin_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_permanent_admin_email(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN public.is_permanent_admin_email(auth.jwt() ->> 'email') THEN 'admin'::public.app_role
    ELSE (
      SELECT role
      FROM public.user_roles
      WHERE user_id = auth.uid()
      ORDER BY CASE role
        WHEN 'admin' THEN 1
        WHEN 'moderator' THEN 2
        WHEN 'agent' THEN 3
        WHEN 'user' THEN 4
        ELSE 5
      END
      LIMIT 1
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  chosen_role public.app_role;
  chosen_username text;
BEGIN
  chosen_role := CASE
    WHEN public.is_permanent_admin_email(new.email) THEN 'admin'::public.app_role
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

  IF public.is_permanent_admin_email(new.email) THEN
    DELETE FROM public.user_roles WHERE user_id = new.id AND role <> 'admin'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role, username)
  VALUES (new.id, chosen_role, chosen_username)
  ON CONFLICT (user_id, role) DO UPDATE SET username = excluded.username;

  INSERT INTO public.wallets (user_id, available_balance, escrow_balance)
  VALUES (new.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$function$;

-- Apply immediately if the account already exists
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = 'home-let@zohomail.com' LIMIT 1;
  IF uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = uid AND role <> 'admin'::public.app_role;
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;