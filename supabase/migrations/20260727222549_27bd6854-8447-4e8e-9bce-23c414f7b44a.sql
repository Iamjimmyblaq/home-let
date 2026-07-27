-- 1) chat_threads: prevent reassigning participants
DROP POLICY IF EXISTS "update own threads" ON public.chat_threads;
CREATE POLICY "update own threads"
ON public.chat_threads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = agent_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = agent_id);

CREATE OR REPLACE FUNCTION public.lock_chat_thread_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.agent_id IS DISTINCT FROM OLD.agent_id
     OR NEW.listing_id IS DISTINCT FROM OLD.listing_id THEN
    RAISE EXCEPTION 'Chat thread participants cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_chat_thread_participants ON public.chat_threads;
CREATE TRIGGER lock_chat_thread_participants
BEFORE UPDATE ON public.chat_threads
FOR EACH ROW EXECUTE FUNCTION public.lock_chat_thread_participants();

-- 2) profiles: remove full-row agent exposure; serve public data via definer view
DROP POLICY IF EXISTS "anon safe agent profile fields" ON public.profiles;
DROP POLICY IF EXISTS "auth safe agent profile fields" ON public.profiles;

DROP VIEW IF EXISTS public.agents_public;
CREATE VIEW public.agents_public
WITH (security_invoker = off) AS
SELECT p.user_id,
       p.full_name,
       p.username,
       p.avatar_url,
       p.agency_name,
       p.bio,
       (p.kyc_status = 'verified') AS verified,
       COALESCE(p.agent_rating, 0::numeric) AS agent_rating,
       COALESCE(p.agent_reviews, 0) AS agent_reviews
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'agent'::public.app_role;

GRANT SELECT ON public.agents_public TO anon, authenticated;