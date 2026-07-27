CREATE TABLE IF NOT EXISTS public.listing_image_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  phash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_image_fingerprints_phash_idx ON public.listing_image_fingerprints (phash);
CREATE INDEX IF NOT EXISTS listing_image_fingerprints_agent_idx ON public.listing_image_fingerprints (agent_id);

GRANT SELECT, INSERT ON public.listing_image_fingerprints TO authenticated;
GRANT ALL ON public.listing_image_fingerprints TO service_role;

ALTER TABLE public.listing_image_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners insert fingerprints" ON public.listing_image_fingerprints
  FOR INSERT TO authenticated WITH CHECK (agent_id = auth.uid());

CREATE POLICY "owners and staff read fingerprints" ON public.listing_image_fingerprints
  FOR SELECT TO authenticated USING (
    agent_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  );

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS fraud_flags jsonb NOT NULL DEFAULT '[]'::jsonb;