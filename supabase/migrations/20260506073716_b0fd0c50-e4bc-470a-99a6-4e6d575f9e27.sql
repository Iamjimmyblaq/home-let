
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  chosen_role app_role;
begin
  chosen_role := CASE
    WHEN (new.raw_user_meta_data->>'role') = 'agent' THEN 'agent'::app_role
    ELSE 'user'::app_role
  END;

  insert into public.profiles (user_id, full_name, phone, agency_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'agency_name'
  );

  insert into public.user_roles (user_id, role) values (new.id, chosen_role)
  on conflict do nothing;

  insert into public.wallets (user_id, available_balance, escrow_balance)
  values (new.id, 0, 0) on conflict do nothing;

  return new;
end; $function$;

DROP POLICY IF EXISTS "users create bookings" ON public.bookings;
DROP POLICY IF EXISTS "users create pending bookings" ON public.bookings;
CREATE POLICY "users create pending bookings"
ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND total_amount > 0
  AND (
    listing_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.agent_id IS NOT DISTINCT FROM bookings.agent_id
    )
  )
);

DROP POLICY IF EXISTS "users create inspections" ON public.inspections;
DROP POLICY IF EXISTS "users create valid inspections" ON public.inspections;
CREATE POLICY "users create valid inspections"
ON public.inspections
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND mode IN ('virtual','physical')
  AND ((mode = 'virtual' AND fee = 2500) OR (mode = 'physical' AND fee = 10000))
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_id
      AND l.agent_id = inspections.agent_id
  )
);
