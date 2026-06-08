GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;

DROP POLICY IF EXISTS "admins delete kyc" ON storage.objects;
DROP POLICY IF EXISTS "agents update own kyc" ON storage.objects;
DROP POLICY IF EXISTS "agents upload own kyc" ON storage.objects;
DROP POLICY IF EXISTS "agents view own kyc" ON storage.objects;
DROP POLICY IF EXISTS "authenticated can view agent profiles" ON public.profiles;

DROP POLICY IF EXISTS "users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "avatars publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "agents upload own property photos" ON storage.objects;
DROP POLICY IF EXISTS "agents update own property photos" ON storage.objects;
DROP POLICY IF EXISTS "agents delete own property photos" ON storage.objects;
DROP POLICY IF EXISTS "property photos publicly readable" ON storage.objects;

CREATE POLICY "avatars are readable for display"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "users upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "users update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "users delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "property photos are readable for listings"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'property-photos');

CREATE POLICY "agents upload own property photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-photos'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "agents update own property photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-photos'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'property-photos'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "agents delete own property photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-photos'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "agents create listings" ON public.listings;
CREATE POLICY "agents create listings"
ON public.listings
FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = agent_id
  AND (
    private.has_role((select auth.uid()), 'admin'::public.app_role)
    OR (
      private.has_role((select auth.uid()), 'agent'::public.app_role)
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.user_id = (select auth.uid())
          AND p.kyc_status IN ('pending', 'verified')
      )
    )
  )
);