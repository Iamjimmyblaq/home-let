
-- Storage policies for avatars and property-photos buckets
CREATE POLICY "users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars publicly readable" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "agents upload own property photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "agents update own property photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'property-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "agents delete own property photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "property photos publicly readable" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-photos');

-- KYC-gated listing creation: require verified KYC unless admin
DROP POLICY IF EXISTS "agents create listings" ON public.listings;
CREATE POLICY "agents create listings" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = agent_id
    AND (
      private.has_role(auth.uid(), 'admin'::public.app_role)
      OR (
        private.has_role(auth.uid(), 'agent'::public.app_role)
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid() AND p.kyc_status = 'verified'
        )
      )
    )
  );
