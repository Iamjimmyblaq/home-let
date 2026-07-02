
-- Nights available on shortlets
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS nights_available integer;

-- Allow anyone (anon + authenticated) to view profiles of users who are agents,
-- so the public /agents directory and user dashboards can list them.
DROP POLICY IF EXISTS "agent profiles publicly viewable" ON public.profiles;
CREATE POLICY "agent profiles publicly viewable"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = profiles.user_id AND ur.role = 'agent'::public.app_role
  )
);

-- Ensure anon can read the agent role rows for the agents directory
DROP POLICY IF EXISTS "anon can view agent role rows" ON public.user_roles;
CREATE POLICY "anon can view agent role rows"
ON public.user_roles
FOR SELECT
TO anon
USING (role = 'agent'::public.app_role);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.user_roles TO anon;
