
-- 1. Booking total amount must match listing price (prevents under-payment exploit)
DROP POLICY IF EXISTS "users create pending bookings" ON public.bookings;
CREATE POLICY "users create pending bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND total_amount > 0
  AND (
    listing_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = bookings.listing_id
        AND NOT (l.agent_id IS DISTINCT FROM bookings.agent_id)
        AND bookings.total_amount >= l.price
    )
  )
);

-- 2. Restrict public agent profile reads to authenticated users (removes anon phone exposure)
DROP POLICY IF EXISTS "public can view agent profiles" ON public.profiles;
CREATE POLICY "authenticated can view agent profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(user_id, 'agent'::public.app_role));

-- 3. Restrict public agent role rows to authenticated users (removes anon username enumeration)
DROP POLICY IF EXISTS "public can view agent role rows" ON public.user_roles;
CREATE POLICY "authenticated can view agent role rows"
ON public.user_roles
FOR SELECT
TO authenticated
USING (role = 'agent'::public.app_role);

-- 4. Baseline RLS on realtime.messages: only authenticated users may subscribe
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated can use realtime" ON realtime.messages;
CREATE POLICY "authenticated can use realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);
