
-- 1) Public agents directory view (safe columns only), bypasses RLS via definer view
CREATE OR REPLACE VIEW public.agents_public AS
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

-- 2) Tighten profiles: remove public agent-profile exposure (phone/kyc leak)
DROP POLICY IF EXISTS "agent profiles publicly viewable" ON public.profiles;

-- 3) Tighten user_roles: remove anon enumeration; keep authenticated for app checks
DROP POLICY IF EXISTS "anon can view agent role rows" ON public.user_roles;

-- 4) Remove overly-permissive realtime SELECT on messages if present
DROP POLICY IF EXISTS "authenticated can use realtime" ON public.messages;

-- 5) Restrict SECURITY DEFINER function execution to intended callers
-- Trigger-only / internal functions: revoke from anon & authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_role_username() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_profile_privileged_fields() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_username(text, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.credit_paystack_wallet(uuid, bigint, text) FROM anon, authenticated, PUBLIC;

-- Admin-only RPCs
REVOKE EXECUTE ON FUNCTION public.approve_boost(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_boost(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_boost(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_boost(uuid) TO authenticated;

-- Role helpers used by the app
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
