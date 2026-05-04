-- 1. Add moderator role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

-- 2. Bank accounts
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_number text NOT NULL,
  bank_code text NOT NULL,
  bank_name text NOT NULL,
  account_name text NOT NULL,
  recipient_code text,
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, account_number, bank_code)
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bank accounts select" ON public.bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own bank accounts insert" ON public.bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bank accounts update" ON public.bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own bank accounts delete" ON public.bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- 3. Withdrawals
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank_account_id uuid NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending',
  paystack_transfer_code text,
  paystack_reference text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own withdrawals" ON public.withdrawals FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "create own withdrawals" ON public.withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Disputes
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid,
  booking_id uuid,
  raised_by uuid NOT NULL,
  against_user uuid NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  resolution text,
  resolution_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Helper: text-based moderator check (avoids same-tx enum restriction)
CREATE POLICY "view disputes (parties + staff)" ON public.disputes FOR SELECT
  USING (
    auth.uid() = raised_by
    OR auth.uid() = against_user
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text = 'moderator')
  );
CREATE POLICY "raise disputes" ON public.disputes FOR INSERT
  WITH CHECK (auth.uid() = raised_by);
CREATE POLICY "staff resolve disputes" ON public.disputes FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text = 'moderator')
  );
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX disputes_status_idx ON public.disputes(status);
CREATE INDEX withdrawals_user_idx ON public.withdrawals(user_id, created_at DESC);