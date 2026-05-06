
-- 1) user_roles: block non-admin writes via RESTRICTIVE policies
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;

CREATE POLICY "admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Restrictive: even if any other policy exists, block users from inserting their own row
CREATE POLICY "block self role assignment" ON public.user_roles
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) wallets: remove direct user UPDATE
DROP POLICY IF EXISTS "users update own wallet" ON public.wallets;

-- 3) transactions: remove direct user INSERT
DROP POLICY IF EXISTS "insert own transactions" ON public.transactions;

-- 4) realtime: drop sensitive tables from broadcast
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.transactions;

-- 5) profiles: restrict agent SELECT to related users only
DROP POLICY IF EXISTS "profiles readable by platform members" ON public.profiles;

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
      OR EXISTS (SELECT 1 FROM public.listings l
                 WHERE l.agent_id = auth.uid())
        AND false  -- agents see their own profile via auth.uid() = user_id above
    )
  )
);

-- 6) withdrawals: force status='pending' on insert
DROP POLICY IF EXISTS "create own withdrawals" ON public.withdrawals;

CREATE POLICY "create own withdrawals"
ON public.withdrawals FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');
