CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN lower(coalesce(auth.jwt() ->> 'email', '')) = 'odamajames65@gmail.com' THEN 'admin'::public.app_role
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

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chosen_role public.app_role;
  chosen_username text;
BEGIN
  chosen_role := CASE
    WHEN lower(coalesce(new.email, '')) = 'odamajames65@gmail.com' THEN 'admin'::public.app_role
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

  IF lower(coalesce(new.email, '')) = 'odamajames65@gmail.com' THEN
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
$$;

WITH admin_user AS (
  SELECT id
  FROM auth.users
  WHERE lower(email) = 'odamajames65@gmail.com'
  ORDER BY created_at DESC
  LIMIT 1
), admin_profile AS (
  INSERT INTO public.profiles (user_id, full_name, username)
  SELECT id, 'Odama James', public.claim_username('odamajames65', 'odamajames65@gmail.com')
  FROM admin_user
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING user_id, username
)
DELETE FROM public.user_roles ur
USING admin_user au
WHERE ur.user_id = au.id
  AND ur.role <> 'admin'::public.app_role;

WITH admin_user AS (
  SELECT id
  FROM auth.users
  WHERE lower(email) = 'odamajames65@gmail.com'
  ORDER BY created_at DESC
  LIMIT 1
), admin_profile AS (
  SELECT user_id, username
  FROM public.profiles
  WHERE user_id = (SELECT id FROM admin_user)
)
INSERT INTO public.user_roles (user_id, role, username)
SELECT au.id, 'admin'::public.app_role, coalesce(ap.username, 'odamajames65')
FROM admin_user au
LEFT JOIN admin_profile ap ON ap.user_id = au.id
ON CONFLICT (user_id, role) DO UPDATE SET username = excluded.username;

WITH admin_user AS (
  SELECT id
  FROM auth.users
  WHERE lower(email) = 'odamajames65@gmail.com'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.wallets (user_id, available_balance, escrow_balance)
SELECT id, 0, 0 FROM admin_user
ON CONFLICT (user_id) DO NOTHING;