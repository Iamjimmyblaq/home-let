
-- 1. LISTINGS: extra fees, caution fee, terms accepted, unlisted status
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS extra_fees jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS caution_fee bigint NOT NULL DEFAULT 0;

-- Rebuild status check to allow 'unlisted'
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='listings_status_check') THEN
    ALTER TABLE public.listings DROP CONSTRAINT listings_status_check;
  END IF;
END $$;
-- (no check constraint enforced; front-end constrains values)

-- 2. BOOKINGS: caution + extra fees + agent confirmation
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS caution_fee bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS caution_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS extra_fees_total bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS agent_confirmed_at timestamptz;

-- 3. PROFILES: terms + lien
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_lien_until timestamptz;

-- 4. DISPUTES: escalation fields
ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS moderator_proposed_resolution text,
  ADD COLUMN IF NOT EXISTS moderator_proposed_note text,
  ADD COLUMN IF NOT EXISTS moderator_by uuid,
  ADD COLUMN IF NOT EXISTS moderator_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalated_to_admin boolean NOT NULL DEFAULT false;

-- 5. LISTING UNAVAILABILITY table
CREATE TABLE IF NOT EXISTS public.listing_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS listing_unavail_idx ON public.listing_unavailability(listing_id, start_date, end_date);

GRANT SELECT ON public.listing_unavailability TO anon, authenticated;
GRANT INSERT, DELETE ON public.listing_unavailability TO authenticated;
GRANT ALL ON public.listing_unavailability TO service_role;

ALTER TABLE public.listing_unavailability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unavailability visible to all" ON public.listing_unavailability
  FOR SELECT USING (true);
CREATE POLICY "agent manages own unavailability" ON public.listing_unavailability
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.agent_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "agent deletes own unavailability" ON public.listing_unavailability
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND (l.agent_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role))));

-- 6. NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 7. DISPUTE APPEALS table
CREATE TABLE IF NOT EXISTS public.dispute_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_note text,
  admin_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dispute_appeals_agent_idx ON public.dispute_appeals(agent_id, created_at DESC);

GRANT SELECT, INSERT ON public.dispute_appeals TO authenticated;
GRANT ALL ON public.dispute_appeals TO service_role;

ALTER TABLE public.dispute_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own or admin appeals" ON public.dispute_appeals FOR SELECT TO authenticated
  USING (auth.uid() = agent_id OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "agent submits appeal" ON public.dispute_appeals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "admin resolves appeal" ON public.dispute_appeals FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- 8. Trigger: apply lien to agent when 5+ disputes in current month
CREATE OR REPLACE FUNCTION public.apply_agent_dispute_lien()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cnt int;
  is_agent boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.against_user AND role = 'agent') INTO is_agent;
  IF NOT is_agent THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO cnt
  FROM public.disputes
  WHERE against_user = NEW.against_user
    AND created_at >= date_trunc('month', now());

  IF cnt >= 5 THEN
    UPDATE public.profiles
      SET dispute_lien_until = greatest(coalesce(dispute_lien_until, now()), now() + interval '30 days')
      WHERE user_id = NEW.against_user;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_apply_agent_dispute_lien ON public.disputes;
CREATE TRIGGER trg_apply_agent_dispute_lien
AFTER INSERT ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.apply_agent_dispute_lien();

-- 9. Tighten listing creation to enforce lien + accepted terms (agents only; admin bypass)
DROP POLICY IF EXISTS "agents create listings" ON public.listings;
CREATE POLICY "agents create listings" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (
    ((SELECT auth.uid()) = agent_id)
    AND (
      private.has_role((SELECT auth.uid()), 'admin'::app_role)
      OR (
        private.has_role((SELECT auth.uid()), 'agent'::app_role)
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = (SELECT auth.uid())
            AND p.kyc_status = 'verified'
            AND p.terms_accepted_at IS NOT NULL
            AND (p.dispute_lien_until IS NULL OR p.dispute_lien_until < now())
        )
      )
    )
  );

-- 10. Tighten withdrawals under lien
DROP POLICY IF EXISTS "create own withdrawals" ON public.withdrawals;
CREATE POLICY "create own withdrawals" ON public.withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_id) AND (status = 'pending')
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.dispute_lien_until IS NOT NULL
        AND p.dispute_lien_until > now()
    )
  );

-- 11. Booking overlap check via trigger (only for shortlet/hotel with listing_id)
CREATE OR REPLACE FUNCTION public.check_booking_availability()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.listing_id IS NULL THEN RETURN NEW; END IF;

  -- Check blocked ranges from agent
  IF EXISTS (
    SELECT 1 FROM public.listing_unavailability u
    WHERE u.listing_id = NEW.listing_id
      AND daterange(u.start_date, u.end_date, '[]') && daterange(NEW.check_in, NEW.check_out, '[]')
  ) THEN
    RAISE EXCEPTION 'These dates are unavailable for this property';
  END IF;

  -- Check overlapping confirmed bookings
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.listing_id = NEW.listing_id
      AND b.id <> COALESCE(NEW.id, gen_random_uuid())
      AND b.status IN ('pending','confirmed')
      AND daterange(b.check_in, b.check_out, '[]') && daterange(NEW.check_in, NEW.check_out, '[]')
  ) THEN
    RAISE EXCEPTION 'These dates overlap another booking';
  END IF;

  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_check_booking_availability ON public.bookings;
CREATE TRIGGER trg_check_booking_availability
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.check_booking_availability();

-- 12. Notifications: helper + triggers
CREATE OR REPLACE FUNCTION public.notify(_user uuid, _type text, _title text, _body text, _link text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (_user, _type, _title, _body, _link);
$$;
REVOKE ALL ON FUNCTION public.notify(uuid,text,text,text,text) FROM anon, authenticated;

-- Inspection insert -> notify agent
CREATE OR REPLACE FUNCTION public.on_inspection_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify(NEW.agent_id, 'inspection', 'New inspection request', 'A user booked an inspection on your property.', '/agent');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_on_inspection_insert ON public.inspections;
CREATE TRIGGER trg_on_inspection_insert AFTER INSERT ON public.inspections
FOR EACH ROW EXECUTE FUNCTION public.on_inspection_insert();

-- Booking insert -> notify agent
CREATE OR REPLACE FUNCTION public.on_booking_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.agent_id IS NOT NULL THEN
    PERFORM public.notify(NEW.agent_id, 'booking', 'New booking received', 'A guest just booked your property.', '/agent');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_on_booking_insert ON public.bookings;
CREATE TRIGGER trg_on_booking_insert AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.on_booking_insert();

-- Transaction insert -> notify recipient
CREATE OR REPLACE FUNCTION public.on_transaction_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify(NEW.user_id, 'transaction', 'Wallet ' || NEW.type, coalesce(NEW.description, ''), '/wallet');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_on_transaction_insert ON public.transactions;
CREATE TRIGGER trg_on_transaction_insert AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.on_transaction_insert();

-- 13. Caution refund RPC (agent confirms intact -> refund payer)
CREATE OR REPLACE FUNCTION public.confirm_booking_checkout(_booking_id uuid, _intact boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b record; payer_wallet record; agent_wallet record;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF b.agent_id <> auth.uid() AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only the listing agent can confirm checkout';
  END IF;
  IF b.caution_status <> 'held' THEN RAISE EXCEPTION 'Caution deposit not held'; END IF;

  SELECT * INTO payer_wallet FROM public.wallets WHERE user_id = b.user_id FOR UPDATE;
  IF payer_wallet.escrow_balance < b.caution_fee THEN RAISE EXCEPTION 'Insufficient escrow'; END IF;

  IF _intact THEN
    -- refund to guest
    UPDATE public.wallets SET
      escrow_balance = escrow_balance - b.caution_fee,
      available_balance = available_balance + b.caution_fee,
      updated_at = now()
      WHERE user_id = b.user_id;
    UPDATE public.bookings SET caution_status = 'refunded', agent_confirmed_at = now(), status = 'completed' WHERE id = _booking_id;
    INSERT INTO public.transactions (user_id, type, amount, description)
      VALUES (b.user_id, 'refund', b.caution_fee, 'Caution refund on checkout');
    PERFORM public.notify(b.user_id, 'transaction', 'Caution refunded', 'Your caution deposit has been refunded.', '/wallet');
  ELSE
    -- forfeit to agent
    SELECT * INTO agent_wallet FROM public.wallets WHERE user_id = b.agent_id FOR UPDATE;
    UPDATE public.wallets SET
      escrow_balance = escrow_balance - b.caution_fee, updated_at = now()
      WHERE user_id = b.user_id;
    UPDATE public.wallets SET
      available_balance = available_balance + b.caution_fee, updated_at = now()
      WHERE user_id = b.agent_id;
    UPDATE public.bookings SET caution_status = 'forfeited', agent_confirmed_at = now(), status = 'completed' WHERE id = _booking_id;
    INSERT INTO public.transactions (user_id, type, amount, description)
      VALUES (b.agent_id, 'payout', b.caution_fee, 'Caution forfeited on checkout');
    PERFORM public.notify(b.user_id, 'transaction', 'Caution withheld', 'The agent reported damages; caution was withheld. Raise a dispute if you disagree.', '/dashboard');
  END IF;
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.confirm_booking_checkout(uuid, boolean) TO authenticated;
