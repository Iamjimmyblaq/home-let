
-- Helper: column-locked update enforcement via WITH CHECK using OLD row not available in RLS,
-- so we instead constrain new values to a small allow-list per role.

-- BOOKINGS -----------------------------------------------------------
DROP POLICY IF EXISTS "parties update bookings" ON public.bookings;

-- Customer may only set status to 'cancelled' on their own booking
CREATE POLICY "user cancel own booking" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Agent may only set status to confirmed/declined/completed on assigned booking
CREATE POLICY "agent updates assigned booking status" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = agent_id AND public.has_role(auth.uid(), 'agent'))
  WITH CHECK (
    auth.uid() = agent_id
    AND public.has_role(auth.uid(), 'agent')
    AND status IN ('confirmed','declined','completed','cancelled')
  );

CREATE POLICY "admins update bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- INSPECTIONS --------------------------------------------------------
DROP POLICY IF EXISTS "update inspections by role" ON public.inspections;

-- Customer can only cancel
CREATE POLICY "user cancel own inspection" ON public.inspections
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Assigned agent can transition status only
CREATE POLICY "agent updates assigned inspection status" ON public.inspections
  FOR UPDATE TO authenticated
  USING (auth.uid() = agent_id AND public.has_role(auth.uid(), 'agent'))
  WITH CHECK (
    auth.uid() = agent_id
    AND public.has_role(auth.uid(), 'agent')
    AND status IN ('confirmed','declined','completed','cancelled')
  );

CREATE POLICY "admins update inspections" ON public.inspections
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CHAT THREADS -------------------------------------------------------
DROP POLICY IF EXISTS "create threads" ON public.chat_threads;

CREATE POLICY "users create threads with verified agent" ON public.chat_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() <> agent_id
    AND public.has_role(agent_id, 'agent')
  );
