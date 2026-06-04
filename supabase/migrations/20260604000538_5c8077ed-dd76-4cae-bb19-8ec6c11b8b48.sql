CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT exists (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

ALTER POLICY "admins update bookings" ON public.bookings
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "agent updates assigned booking status" ON public.bookings
  USING ((auth.uid() = agent_id) AND private.has_role(auth.uid(), 'agent'::public.app_role))
  WITH CHECK ((auth.uid() = agent_id) AND private.has_role(auth.uid(), 'agent'::public.app_role) AND (status = ANY (ARRAY['confirmed'::text, 'declined'::text, 'completed'::text, 'cancelled'::text])));

ALTER POLICY "view own bookings" ON public.bookings
  USING ((auth.uid() = user_id) OR (auth.uid() = agent_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "users create threads with verified agent" ON public.chat_threads
  WITH CHECK ((auth.uid() = user_id) AND (auth.uid() <> agent_id) AND private.has_role(agent_id, 'agent'::public.app_role));

ALTER POLICY "view own threads" ON public.chat_threads
  USING (((auth.uid() = user_id) OR (auth.uid() = agent_id)) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "view disputes (parties + staff)" ON public.disputes
  USING ((auth.uid() = raised_by) OR (auth.uid() = against_user) OR private.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = 'moderator'::text)))));

ALTER POLICY "staff resolve disputes" ON public.disputes
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = 'moderator'::text)))));

ALTER POLICY "admins update inspections" ON public.inspections
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "agent updates assigned inspection status" ON public.inspections
  USING ((auth.uid() = agent_id) AND private.has_role(auth.uid(), 'agent'::public.app_role))
  WITH CHECK ((auth.uid() = agent_id) AND private.has_role(auth.uid(), 'agent'::public.app_role) AND (status = ANY (ARRAY['confirmed'::text, 'declined'::text, 'completed'::text, 'cancelled'::text])));

ALTER POLICY "view inspections by role" ON public.inspections
  USING ((auth.uid() = user_id) OR ((auth.uid() = agent_id) AND private.has_role(auth.uid(), 'agent'::public.app_role)) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "agents create listings" ON public.listings
  WITH CHECK ((auth.uid() = agent_id) AND (private.has_role(auth.uid(), 'agent'::public.app_role) OR private.has_role(auth.uid(), 'admin'::public.app_role)));

ALTER POLICY "agents delete own listings" ON public.listings
  USING (((auth.uid() = agent_id) AND private.has_role(auth.uid(), 'agent'::public.app_role)) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "agents update own listings" ON public.listings
  USING (((auth.uid() = agent_id) AND private.has_role(auth.uid(), 'agent'::public.app_role)) OR private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (((auth.uid() = agent_id) AND private.has_role(auth.uid(), 'agent'::public.app_role)) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "verified listings visible to all" ON public.listings
  USING ((status = 'verified'::text) OR (agent_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "view messages of own threads" ON public.messages
  USING ((EXISTS (SELECT 1 FROM public.chat_threads t WHERE ((t.id = messages.thread_id) AND ((auth.uid() = t.user_id) OR (auth.uid() = t.agent_id))))) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "admins manage profiles" ON public.profiles
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "profiles readable scoped" ON public.profiles
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role) OR (private.has_role(auth.uid(), 'agent'::public.app_role) AND ((EXISTS (SELECT 1 FROM public.inspections i WHERE ((i.agent_id = auth.uid()) AND (i.user_id = profiles.user_id)))) OR (EXISTS (SELECT 1 FROM public.bookings b WHERE ((b.agent_id = auth.uid()) AND (b.user_id = profiles.user_id)))) OR (EXISTS (SELECT 1 FROM public.chat_threads t WHERE ((t.agent_id = auth.uid()) AND (t.user_id = profiles.user_id)))))));

ALTER POLICY "admins delete roles" ON public.user_roles
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "admins insert roles" ON public.user_roles
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "admins update roles" ON public.user_roles
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "block self role assignment" ON public.user_roles
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "view own roles" ON public.user_roles
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));