REVOKE ALL ON FUNCTION public.claim_username(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_role_username() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.credit_paystack_wallet(uuid, bigint, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_paystack_wallet(uuid, bigint, text) TO service_role;