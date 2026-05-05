import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { inspection_id } = await req.json() as { inspection_id?: string };
    if (!inspection_id) return json({ error: 'inspection_id is required' }, 400);

    const admin = createClient(supaUrl, serviceKey);
    const { data: inspection } = await admin.from('inspections').select('*').eq('id', inspection_id).maybeSingle();
    if (!inspection) return json({ error: 'Inspection not found' }, 404);
    if (inspection.user_id !== user.id) return json({ error: 'Only the customer can release inspection funds' }, 403);
    if (inspection.status === 'settled') return json({ error: 'Inspection is already settled' }, 400);
    if (!['confirmed', 'completed'].includes(inspection.status)) return json({ error: 'Inspection must be accepted or completed before release' }, 400);

    const { data: dispute } = await admin.from('disputes').select('id').eq('inspection_id', inspection_id).eq('status', 'open').maybeSingle();
    if (dispute) return json({ error: 'Resolve the open dispute before releasing funds' }, 400);

    const fee = Number(inspection.fee);
    const agentShare = Math.round(fee * 0.6);
    const platformShare = fee - agentShare;

    const { data: payer } = await admin.from('wallets').select('available_balance, escrow_balance').eq('user_id', user.id).maybeSingle();
    if (!payer || Number(payer.escrow_balance) < fee) return json({ error: 'Insufficient escrow balance' }, 400);

    const { data: agentWallet } = await admin.from('wallets').select('available_balance').eq('user_id', inspection.agent_id).maybeSingle();
    if (!agentWallet) return json({ error: 'Agent wallet not found' }, 404);

    await admin.from('wallets').update({ escrow_balance: Number(payer.escrow_balance) - fee }).eq('user_id', user.id);
    await admin.from('wallets').update({ available_balance: Number(agentWallet.available_balance) + agentShare }).eq('user_id', inspection.agent_id);

    await admin.from('transactions').insert([
      { user_id: user.id, type: 'escrow_release', amount: fee, description: 'Inspection completed — funds released', reference_id: inspection_id },
      { user_id: inspection.agent_id, type: 'payout', amount: agentShare, description: 'Inspection earnings (60%)', reference_id: inspection_id },
      { user_id: user.id, type: 'platform_fee', amount: platformShare, description: 'Inspection platform fee (40%)', reference_id: inspection_id },
    ]);

    await admin.from('inspections').update({ status: 'settled' }).eq('id', inspection_id);
    return json({ ok: true, agentShare, platformShare });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}