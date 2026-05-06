import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: cErr } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claims.claims.sub as string;

    const { reference } = await req.json();
    if (!reference || typeof reference !== 'string') {
      return new Response(JSON.stringify({ error: 'Reference required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const secret = Deno.env.get('PAYSTACK_SECRET_KEY')!;
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const result = await res.json();
    if (!result.status || result.data?.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Payment not successful', status: result.data?.status }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const metaUserId = result.data?.metadata?.user_id;
    if (metaUserId && metaUserId !== userId) {
      return new Response(JSON.stringify({ error: 'Reference does not belong to user' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const naira = Math.floor(Number(result.data.amount) / 100);

    // Service-role client for atomic credit + idempotency check
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Idempotency: check existing transaction with this reference description
    const { data: existing } = await admin.from('transactions')
      .select('id').eq('user_id', userId).eq('description', `Paystack: ${reference}`).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, already: true, amount: naira }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: w, error: wErr } = await admin.from('wallets').select('available_balance').eq('user_id', userId).maybeSingle();
    if (wErr) throw wErr;
    const current = Number(w?.available_balance || 0);
    const next = current + naira;
    if (w) {
      const { error: uErr } = await admin.from('wallets').update({ available_balance: next }).eq('user_id', userId);
      if (uErr) throw uErr;
    } else {
      const { error: iErr } = await admin.from('wallets').insert({ user_id: userId, available_balance: next, escrow_balance: 0 });
      if (iErr) throw iErr;
    }
    await admin.from('transactions').insert({ user_id: userId, type: 'fund', amount: naira, description: `Paystack: ${reference}` });

    return new Response(JSON.stringify({ ok: true, amount: naira, balance: next }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('paystack-verify-error', e);
    return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
