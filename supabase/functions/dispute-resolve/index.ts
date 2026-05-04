import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Resolution = 'refund_user' | 'release_agent' | 'split';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supaUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(supaUrl, serviceKey);

    // Check staff role (admin OR moderator)
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', user.id);
    const isStaff = (roles || []).some((r: any) => r.role === 'admin' || r.role === 'moderator');
    if (!isStaff) return json({ error: 'Forbidden' }, 403);

    const { dispute_id, resolution, note } = await req.json() as { dispute_id: string; resolution: Resolution; note?: string };
    if (!dispute_id || !['refund_user', 'release_agent', 'split'].includes(resolution)) {
      return json({ error: 'Invalid input' }, 400);
    }

    const { data: dispute } = await admin.from('disputes').select('*').eq('id', dispute_id).maybeSingle();
    if (!dispute) return json({ error: 'Dispute not found' }, 404);
    if (dispute.status !== 'open') return json({ error: 'Dispute already resolved' }, 400);

    const payerId = dispute.raised_by; // user who paid into escrow
    const payeeId = dispute.against_user;
    const amount = Number(dispute.amount);

    // Load payer wallet
    const { data: payer } = await admin.from('wallets').select('available_balance, escrow_balance').eq('user_id', payerId).maybeSingle();
    if (!payer || Number(payer.escrow_balance) < amount) return json({ error: 'Insufficient escrow on payer wallet' }, 400);

    const refundAmt = resolution === 'refund_user' ? amount : resolution === 'split' ? Math.floor(amount / 2) : 0;
    const releaseAmt = amount - refundAmt;

    // Reduce escrow
    await admin.from('wallets').update({
      escrow_balance: Number(payer.escrow_balance) - amount,
      available_balance: Number(payer.available_balance) + refundAmt,
    }).eq('user_id', payerId);

    if (refundAmt > 0) {
      await admin.from('transactions').insert({
        user_id: payerId, type: 'refund', amount: refundAmt,
        description: `Dispute refund (${resolution})`, reference_id: dispute_id,
      });
    }

    if (releaseAmt > 0) {
      const { data: payee } = await admin.from('wallets').select('available_balance').eq('user_id', payeeId).maybeSingle();
      if (payee) {
        await admin.from('wallets').update({ available_balance: Number(payee.available_balance) + releaseAmt }).eq('user_id', payeeId);
      }
      await admin.from('transactions').insert({
        user_id: payeeId, type: 'payout', amount: releaseAmt,
        description: `Dispute release (${resolution})`, reference_id: dispute_id,
      });
    }

    await admin.from('disputes').update({
      status: 'resolved', resolution, resolution_note: note ?? null,
      resolved_by: user.id, resolved_at: new Date().toISOString(),
    }).eq('id', dispute_id);

    return json({ ok: true, refundAmt, releaseAmt });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
