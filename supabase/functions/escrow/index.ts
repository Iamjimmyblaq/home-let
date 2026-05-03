import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'hold' | 'release' | 'refund';
interface Body {
  action: Action;
  amount: number;
  description?: string;
  reference_id?: string;
  payee_user_id?: string; // recipient on release/refund
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supaUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await userClient.auth.getUser();
    if (uErr || !user) return json({ error: 'Unauthorized' }, 401);

    const body = (await req.json()) as Body;
    if (!body.action || !Number.isFinite(body.amount) || body.amount <= 0) {
      return json({ error: 'Invalid action or amount' }, 400);
    }
    const amount = Math.round(body.amount);

    const admin = createClient(supaUrl, serviceKey);

    // Load payer wallet
    const { data: payer, error: pErr } = await admin
      .from('wallets').select('available_balance, escrow_balance').eq('user_id', user.id).maybeSingle();
    if (pErr || !payer) return json({ error: 'Wallet not found' }, 404);

    if (body.action === 'hold') {
      if (payer.available_balance < amount) return json({ error: 'Insufficient balance' }, 400);
      await admin.from('wallets').update({
        available_balance: payer.available_balance - amount,
        escrow_balance: payer.escrow_balance + amount,
      }).eq('user_id', user.id);
      await admin.from('transactions').insert({
        user_id: user.id, type: 'escrow_hold', amount,
        description: body.description || 'Escrow hold', reference_id: body.reference_id ?? null,
      });
      return json({ ok: true, action: 'hold', amount });
    }

    if (body.action === 'release' || body.action === 'refund') {
      if (payer.escrow_balance < amount) return json({ error: 'Insufficient escrow' }, 400);

      // Determine recipient: release -> payee (agent); refund -> payer (back to available)
      const recipientId = body.action === 'refund' ? user.id : body.payee_user_id;
      if (!recipientId) return json({ error: 'payee_user_id required for release' }, 400);

      // Reduce escrow on payer
      await admin.from('wallets').update({
        escrow_balance: payer.escrow_balance - amount,
        ...(body.action === 'refund' ? { available_balance: payer.available_balance + amount } : {}),
      }).eq('user_id', user.id);

      // Credit recipient (release only — refund goes back to payer above)
      if (body.action === 'release') {
        const { data: rec } = await admin.from('wallets').select('available_balance').eq('user_id', recipientId).maybeSingle();
        if (!rec) {
          // rollback
          await admin.from('wallets').update({ escrow_balance: payer.escrow_balance }).eq('user_id', user.id);
          return json({ error: 'Recipient wallet not found' }, 404);
        }
        await admin.from('wallets').update({ available_balance: Number(rec.available_balance) + amount }).eq('user_id', recipientId);
        await admin.from('transactions').insert({
          user_id: recipientId, type: 'payout', amount,
          description: body.description || 'Escrow released', reference_id: body.reference_id ?? null,
        });
      }

      await admin.from('transactions').insert({
        user_id: user.id, type: body.action === 'refund' ? 'refund' : 'escrow_release', amount,
        description: body.description || (body.action === 'refund' ? 'Escrow refunded' : 'Escrow released'),
        reference_id: body.reference_id ?? null,
      });

      return json({ ok: true, action: body.action, amount });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
