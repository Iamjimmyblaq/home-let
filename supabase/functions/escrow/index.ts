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
  booking_id?: string;
  inspection_id?: string;
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

    if (body.action === 'refund') {
      if (payer.escrow_balance < amount) return json({ error: 'Insufficient escrow' }, 400);
      await admin.from('wallets').update({
        escrow_balance: payer.escrow_balance - amount,
        available_balance: payer.available_balance + amount,
      }).eq('user_id', user.id);
      await admin.from('transactions').insert({
        user_id: user.id, type: 'refund', amount,
        description: body.description || 'Escrow refunded',
        reference_id: body.reference_id ?? null,
      });
      return json({ ok: true, action: 'refund', amount });
    }

    if (body.action === 'release') {
      // Resolve recipient strictly from a verified booking/inspection where caller is the customer.
      let recipientId: string | null = null;
      let refId: string | null = body.reference_id ?? null;

      if (body.booking_id) {
        const { data: b } = await admin.from('bookings')
          .select('user_id, agent_id').eq('id', body.booking_id).maybeSingle();
        if (!b || b.user_id !== user.id) return json({ error: 'Booking not found' }, 404);
        if (!b.agent_id) return json({ error: 'Booking has no agent' }, 400);
        recipientId = b.agent_id;
        refId = body.booking_id;
      } else if (body.inspection_id) {
        const { data: i } = await admin.from('inspections')
          .select('user_id, agent_id').eq('id', body.inspection_id).maybeSingle();
        if (!i || i.user_id !== user.id) return json({ error: 'Inspection not found' }, 404);
        recipientId = i.agent_id;
        refId = body.inspection_id;
      } else {
        return json({ error: 'booking_id or inspection_id is required to release escrow' }, 400);
      }

      if (payer.escrow_balance < amount) return json({ error: 'Insufficient escrow' }, 400);

      const { data: rec } = await admin.from('wallets').select('available_balance').eq('user_id', recipientId).maybeSingle();
      if (!rec) return json({ error: 'Recipient wallet not found' }, 404);

      await admin.from('wallets').update({ escrow_balance: payer.escrow_balance - amount }).eq('user_id', user.id);
      await admin.from('wallets').update({ available_balance: Number(rec.available_balance) + amount }).eq('user_id', recipientId);

      await admin.from('transactions').insert([
        { user_id: user.id, type: 'escrow_release', amount, description: body.description || 'Escrow released', reference_id: refId },
        { user_id: recipientId, type: 'payout', amount, description: body.description || 'Escrow payout', reference_id: refId },
      ]);

      return json({ ok: true, action: 'release', amount });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('escrow-error', e);
    return json({ error: 'An internal error occurred. Please try again.' }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
