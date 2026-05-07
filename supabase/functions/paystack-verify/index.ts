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

    const { data: credit, error: creditErr } = await admin.rpc('credit_paystack_wallet', {
      _user_id: userId,
      _amount: naira,
      _reference: reference,
    });
    if (creditErr) throw creditErr;
    const next = Number((credit as any)?.balance || 0);

    return new Response(JSON.stringify({ ok: true, already: Boolean((credit as any)?.already), amount: naira, balance: next }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('paystack-verify-error', e);
    return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
