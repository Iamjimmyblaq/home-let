CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT CASE
    WHEN lower(coalesce(auth.jwt() ->> 'email', '')) = 'odamajames65@gmail.com' THEN 'admin'::public.app_role
    ELSE (
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
    )
  END
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO service_role;