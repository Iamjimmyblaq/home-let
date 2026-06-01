REVOKE ALL ON FUNCTION public.protect_profile_privileged_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile_privileged_fields() FROM anon;
REVOKE ALL ON FUNCTION public.protect_profile_privileged_fields() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.protect_profile_privileged_fields() TO service_role;