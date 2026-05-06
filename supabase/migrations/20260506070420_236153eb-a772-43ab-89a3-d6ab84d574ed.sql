
DROP POLICY IF EXISTS "profiles readable scoped" ON public.profiles;

CREATE POLICY "profiles readable scoped"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
  OR (
    public.has_role(auth.uid(), 'agent')
    AND (
      EXISTS (SELECT 1 FROM public.inspections i
              WHERE i.agent_id = auth.uid() AND i.user_id = profiles.user_id)
      OR EXISTS (SELECT 1 FROM public.bookings b
                 WHERE b.agent_id = auth.uid() AND b.user_id = profiles.user_id)
      OR EXISTS (SELECT 1 FROM public.chat_threads t
                 WHERE t.agent_id = auth.uid() AND t.user_id = profiles.user_id)
    )
  )
);
