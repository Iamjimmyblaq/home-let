DROP POLICY IF EXISTS "create own withdrawals" ON public.withdrawals;
CREATE POLICY "create own withdrawals" ON public.withdrawals
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'::text
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.dispute_lien_until IS NOT NULL AND p.dispute_lien_until > now()
  )
  AND EXISTS (
    SELECT 1 FROM public.bank_accounts b
    WHERE b.id = bank_account_id AND b.user_id = auth.uid()
  )
);