import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYSTACK = 'https://api.paystack.co';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const PAYSTACK_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_KEY) return json({ error: 'Paystack key not configured' }, 500);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supaUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const action: 'list_banks' | 'verify_account' | 'save_account' | 'request_withdrawal' = body.action;

    const ps = (path: string, init?: RequestInit) =>
      fetch(`${PAYSTACK}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${PAYSTACK_KEY}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
      });

    if (action === 'list_banks') {
      const r = await ps('/bank?country=nigeria&perPage=100');
      const j = await r.json();
      return json({ banks: j.data || [] });
    }

    if (action === 'verify_account') {
      const { account_number, bank_code } = body;
      if (!account_number || !bank_code) return json({ error: 'Missing details' }, 400);
      const r = await ps(`/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`);
      const j = await r.json();
      if (!j.status) return json({ error: j.message || 'Could not verify' }, 400);
      return json({ account_name: j.data.account_name, account_number: j.data.account_number });
    }

    const admin = createClient(supaUrl, serviceKey);

    if (action === 'save_account') {
      const { account_number, bank_code, bank_name, account_name } = body;
      if (!account_number || !bank_code || !account_name) return json({ error: 'Missing details' }, 400);

      // Create transfer recipient on Paystack
      const r = await ps('/transferrecipient', {
        method: 'POST',
        body: JSON.stringify({ type: 'nuban', name: account_name, account_number, bank_code, currency: 'NGN' }),
      });
      const j = await r.json();
      if (!j.status) return json({ error: j.message || 'Could not create recipient' }, 400);

      // Mark previous as not default
      await admin.from('bank_accounts').update({ is_default: false }).eq('user_id', user.id);
      const { data, error } = await admin.from('bank_accounts').upsert({
        user_id: user.id, account_number, bank_code, bank_name, account_name,
        recipient_code: j.data.recipient_code, is_default: true,
      }, { onConflict: 'user_id,account_number,bank_code' }).select().maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, account: data });
    }

    if (action === 'request_withdrawal') {
      const { amount, bank_account_id } = body;
      const amt = Math.round(Number(amount));
      if (!amt || amt < 100) return json({ error: 'Minimum withdrawal is ₦100' }, 400);
      if (!bank_account_id) return json({ error: 'Choose a bank account' }, 400);

      // Verify wallet balance
      const { data: wallet } = await admin.from('wallets').select('available_balance').eq('user_id', user.id).maybeSingle();
      if (!wallet || Number(wallet.available_balance) < amt) return json({ error: 'Insufficient balance' }, 400);

      const { data: ba } = await admin.from('bank_accounts').select('*').eq('id', bank_account_id).eq('user_id', user.id).maybeSingle();
      if (!ba?.recipient_code) return json({ error: 'Bank account not ready' }, 400);

      // Reserve funds first (deduct then create withdrawal record)
      await admin.from('wallets').update({ available_balance: Number(wallet.available_balance) - amt }).eq('user_id', user.id);

      const reference = `wd_${user.id.slice(0, 8)}_${Date.now()}`;
      const { data: wd, error: wdErr } = await admin.from('withdrawals').insert({
        user_id: user.id, bank_account_id, amount: amt, status: 'processing', paystack_reference: reference,
      }).select().maybeSingle();
      if (wdErr) {
        await admin.from('wallets').update({ available_balance: Number(wallet.available_balance) }).eq('user_id', user.id);
        return json({ error: wdErr.message }, 500);
      }

      // Initiate transfer
      const r = await ps('/transfer', {
        method: 'POST',
        body: JSON.stringify({
          source: 'balance', amount: amt * 100, recipient: ba.recipient_code, reason: 'Home-let withdrawal', reference,
        }),
      });
      const j = await r.json();

      if (!j.status) {
        // Refund and mark failed
        await admin.from('wallets').update({ available_balance: Number(wallet.available_balance) }).eq('user_id', user.id);
        await admin.from('withdrawals').update({ status: 'failed', failure_reason: j.message || 'Transfer failed' }).eq('id', wd!.id);
        return json({ error: j.message || 'Transfer failed' }, 400);
      }

      const status = j.data.status === 'success' ? 'success' : (j.data.status === 'otp' ? 'processing' : j.data.status);
      await admin.from('withdrawals').update({
        status, paystack_transfer_code: j.data.transfer_code,
      }).eq('id', wd!.id);

      await admin.from('transactions').insert({
        user_id: user.id, type: 'withdrawal', amount: amt,
        description: `Withdrawal to ${ba.bank_name} ••${ba.account_number.slice(-4)}`,
        reference_id: wd!.id,
      });

      return json({ ok: true, status, withdrawal_id: wd!.id, message: j.data.status === 'otp' ? 'OTP required from your Paystack dashboard to finalize.' : 'Transfer initiated.' });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
