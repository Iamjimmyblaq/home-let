DROP POLICY IF EXISTS "owners insert fingerprints" ON public.listing_image_fingerprints;

CREATE POLICY "owners insert fingerprints"
ON public.listing_image_fingerprints
FOR INSERT
TO authenticated
WITH CHECK (
  agent_id = auth.uid()
  AND (
    listing_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.agent_id = auth.uid()
    )
  )
);