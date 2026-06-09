
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS cert_url text,
  ADD COLUMN IF NOT EXISTS cert_type text,
  ADD COLUMN IF NOT EXISTS boost_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS boost_days integer,
  ADD COLUMN IF NOT EXISTS boost_fee bigint,
  ADD COLUMN IF NOT EXISTS boost_until timestamptz,
  ADD COLUMN IF NOT EXISTS boost_requested_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_listings_boost ON public.listings (boost_status, boost_until);

-- Approve a pending boost: deduct from agent wallet and activate
CREATE OR REPLACE FUNCTION public.approve_boost(_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l record;
  bal bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can approve boosts';
  END IF;

  SELECT * INTO l FROM public.listings WHERE id = _listing_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF l.boost_status <> 'pending' THEN RAISE EXCEPTION 'No pending boost'; END IF;
  IF l.boost_fee IS NULL OR l.boost_days IS NULL THEN RAISE EXCEPTION 'Boost details missing'; END IF;

  SELECT available_balance INTO bal FROM public.wallets WHERE user_id = l.agent_id FOR UPDATE;
  IF bal IS NULL OR bal < l.boost_fee THEN
    UPDATE public.listings SET boost_status = 'rejected' WHERE id = _listing_id;
    RAISE EXCEPTION 'Agent wallet has insufficient funds';
  END IF;

  UPDATE public.wallets
    SET available_balance = available_balance - l.boost_fee, updated_at = now()
    WHERE user_id = l.agent_id;

  INSERT INTO public.transactions (user_id, type, amount, description)
    VALUES (l.agent_id, 'boost', -l.boost_fee, 'Listing boost approved: ' || l.title);

  UPDATE public.listings
    SET boost_status = 'active',
        boost_until = now() + (l.boost_days || ' days')::interval,
        featured = true,
        updated_at = now()
    WHERE id = _listing_id;

  RETURN jsonb_build_object('ok', true, 'boost_until', now() + (l.boost_days || ' days')::interval);
END;
$$;

REVOKE ALL ON FUNCTION public.approve_boost(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_boost(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_boost(_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only admins can reject boosts';
  END IF;
  UPDATE public.listings SET boost_status = 'rejected', updated_at = now() WHERE id = _listing_id;
END;
$$;
REVOKE ALL ON FUNCTION public.reject_boost(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_boost(uuid) TO authenticated;
