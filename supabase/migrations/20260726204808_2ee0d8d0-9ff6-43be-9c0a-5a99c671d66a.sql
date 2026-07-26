DROP POLICY IF EXISTS "authenticated can use realtime" ON realtime.messages;

CREATE POLICY "users subscribe to own thread topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.chat_threads t
    WHERE realtime.topic() = 'thread-' || t.id::text
      AND (auth.uid() = t.user_id OR auth.uid() = t.agent_id)
  )
);