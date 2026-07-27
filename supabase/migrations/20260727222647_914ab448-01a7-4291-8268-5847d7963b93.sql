-- Private profile data table
CREATE TABLE public.profiles_private (
  user_id uuid PRIMARY KEY,
  phone text,
  kyc_doc_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles_private TO authenticated;
GRANT ALL ON public.profiles_private TO service_role;

ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages private profile"
ON public.profiles_private FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "staff read private profile"
ON public.profiles_private FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));

CREATE POLICY "staff update private profile"
ON public.profiles_private FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));

CREATE TRIGGER profiles_private_updated_at
BEFORE UPDATE ON public.profiles_private
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing sensitive data
INSERT INTO public.profiles_private (user_id, phone, kyc_doc_url)
SELECT user_id, phone, kyc_doc_url FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.profiles DROP COLUMN phone;
ALTER TABLE public.profiles DROP COLUMN kyc_doc_url;

-- Restore the public agent directory view as a plain (invoker) view
DROP VIEW IF EXISTS public.agents_public;
CREATE VIEW public.agents_public
WITH (security_invoker = on) AS
SELECT p.user_id,
       p.full_name,
       p.username,
       p.avatar_url,
       p.agency_name,
       p.bio,
       (p.kyc_status = 'verified') AS verified,
       COALESCE(p.agent_rating, 0::numeric) AS agent_rating,
       COALESCE(p.agent_reviews, 0) AS agent_reviews
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'agent'::public.app_role;

GRANT SELECT ON public.agents_public TO anon, authenticated;

CREATE POLICY "anon safe agent profile fields"
ON public.profiles FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = profiles.user_id AND ur.role = 'agent'::public.app_role));

CREATE POLICY "auth safe agent profile fields"
ON public.profiles FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = profiles.user_id AND ur.role = 'agent'::public.app_role));

-- Keep signup provisioning working with the new table
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

  INSERT INTO public.profiles (user_id, full_name, agency_name, username)
  VALUES (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email,'@',1)),
    nullif(trim(coalesce(new.raw_user_meta_data->>'agency_name', '')), ''),
    chosen_username
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    agency_name = coalesce(public.profiles.agency_name, excluded.agency_name),
    username = coalesce(public.profiles.username, excluded.username),
    updated_at = now();

  INSERT INTO public.profiles_private (user_id, phone)
  VALUES (new.id, nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''))
  ON CONFLICT (user_id) DO UPDATE SET
    phone = coalesce(public.profiles_private.phone, excluded.phone),
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