
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
