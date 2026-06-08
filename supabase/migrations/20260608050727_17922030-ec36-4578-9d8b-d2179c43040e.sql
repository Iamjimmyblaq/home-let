DROP POLICY IF EXISTS "kyc docs readable by owner and staff" ON storage.objects;
DROP POLICY IF EXISTS "kyc users upload own docs" ON storage.objects;
DROP POLICY IF EXISTS "kyc users update own docs" ON storage.objects;

CREATE POLICY "kyc docs readable by owner and staff"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-docs'
  AND (
    (select auth.uid())::text = (storage.foldername(name))[1]
    OR private.has_role((select auth.uid()), 'admin'::public.app_role)
    OR private.has_role((select auth.uid()), 'moderator'::public.app_role)
  )
);

CREATE POLICY "kyc users upload own docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-docs'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "kyc users update own docs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-docs'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'kyc-docs'
  AND (select auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "admins delete kyc docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-docs'
  AND private.has_role((select auth.uid()), 'admin'::public.app_role)
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
          AND p.kyc_status = 'verified'
      )
    )
  )
);