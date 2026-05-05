CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'moderator' THEN 2
    WHEN 'agent' THEN 3
    WHEN 'user' THEN 4
    ELSE 5
  END
  LIMIT 1
$$;

DROP POLICY IF EXISTS "profiles readable by all auth" ON public.profiles;
CREATE POLICY "profiles readable by platform members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'moderator'::app_role)
  OR public.has_role(auth.uid(), 'agent'::app_role)
);

DROP POLICY IF EXISTS "view own inspections" ON public.inspections;
CREATE POLICY "view inspections by role"
ON public.inspections
FOR SELECT
USING (
  auth.uid() = user_id
  OR (auth.uid() = agent_id AND public.has_role(auth.uid(), 'agent'::app_role))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "parties update inspections" ON public.inspections;
CREATE POLICY "update inspections by role"
ON public.inspections
FOR UPDATE
USING (
  auth.uid() = user_id
  OR (auth.uid() = agent_id AND public.has_role(auth.uid(), 'agent'::app_role))
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = user_id
  OR (auth.uid() = agent_id AND public.has_role(auth.uid(), 'agent'::app_role))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "agents update own listings" ON public.listings;
CREATE POLICY "agents update own listings"
ON public.listings
FOR UPDATE
USING ((auth.uid() = agent_id AND public.has_role(auth.uid(), 'agent'::app_role)) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((auth.uid() = agent_id AND public.has_role(auth.uid(), 'agent'::app_role)) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "agents delete own listings" ON public.listings;
CREATE POLICY "agents delete own listings"
ON public.listings
FOR DELETE
USING ((auth.uid() = agent_id AND public.has_role(auth.uid(), 'agent'::app_role)) OR public.has_role(auth.uid(), 'admin'::app_role));

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
ALTER TABLE public.listings REPLICA IDENTITY FULL;