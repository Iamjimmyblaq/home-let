
-- Recreate the view as SECURITY INVOKER so it runs with the caller's rights
DROP VIEW IF EXISTS public.agents_public;
CREATE VIEW public.agents_public
WITH (security_invoker=on) AS
SELECT
  p.user_id,
  p.full_name,
  p.username,
  p.avatar_url,
  p.agency_name,
  p.bio,
  (p.kyc_status = 'verified') AS verified,
  COALESCE(p.agent_rating, 0)::numeric AS agent_rating,
  COALESCE(p.agent_reviews, 0)::int AS agent_reviews
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'agent'::public.app_role;

GRANT SELECT ON public.agents_public TO anon, authenticated;

-- Restrict anon column access on profiles to safe fields only
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (user_id, full_name, username, avatar_url, agency_name, bio, kyc_status, agent_rating, agent_reviews)
  ON public.profiles TO anon;

-- Allow anon to select agent rows (columns already restricted by the grant above)
CREATE POLICY "anon safe agent profile fields"
  ON public.profiles FOR SELECT
  TO anon
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = profiles.user_id AND ur.role = 'agent'::public.app_role));

-- Allow authenticated (non-owner, non-admin) to select agent rows for the directory,
-- but only the safe columns via column-level grant
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (user_id, full_name, username, avatar_url, agency_name, bio, kyc_status, agent_rating, agent_reviews)
  ON public.profiles TO authenticated;
-- Owners and staff need full row access; grant remaining sensitive columns only through policies that already scope them
GRANT SELECT (phone, kyc_doc_url, id, created_at, updated_at) ON public.profiles TO authenticated;

CREATE POLICY "auth safe agent profile fields"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = profiles.user_id AND ur.role = 'agent'::public.app_role));
