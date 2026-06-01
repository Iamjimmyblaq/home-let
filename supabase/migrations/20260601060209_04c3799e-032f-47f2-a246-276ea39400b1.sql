ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agent_rating numeric(2,1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS agent_reviews integer NOT NULL DEFAULT 0;

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.user_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.listings TO service_role;

DROP POLICY IF EXISTS "public can view agent profiles" ON public.profiles;
CREATE POLICY "public can view agent profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (public.has_role(user_id, 'agent'::public.app_role));

DROP POLICY IF EXISTS "public can view agent role rows" ON public.user_roles;
CREATE POLICY "public can view agent role rows"
ON public.user_roles
FOR SELECT
TO anon, authenticated
USING (role = 'agent'::public.app_role);

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = NEW.user_id THEN
    IF NEW.kyc_status = 'verified' AND OLD.kyc_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Only staff can verify KYC';
    END IF;

    IF NEW.kyc_status NOT IN ('none', 'pending', 'rejected') THEN
      NEW.kyc_status := OLD.kyc_status;
    END IF;

    NEW.agent_rating := OLD.agent_rating;
    NEW.agent_reviews := OLD.agent_reviews;
    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_privileged_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileged_fields();

DROP POLICY IF EXISTS "kyc users upload own docs" ON storage.objects;
CREATE POLICY "kyc users upload own docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kyc-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "kyc users update own docs" ON storage.objects;
CREATE POLICY "kyc users update own docs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'kyc-docs' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'kyc-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "kyc docs readable by owner and staff" ON storage.objects;
CREATE POLICY "kyc docs readable by owner and staff"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-docs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);