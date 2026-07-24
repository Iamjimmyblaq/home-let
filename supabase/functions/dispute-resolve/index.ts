import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Resolution = 'refund_user' | 'release_agent' | 'split';
type Action = 'propose' | 'approve' | 'reject' | 'escalate' | 'override';

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
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', user.id);
    const roleSet = new Set((roles || []).map((r: any) => r.role));
    const isAdmin = roleSet.has('admin');
    const isModerator = roleSet.has('moderator');
    if (!isAdmin && !isModerator) return json({ error: 'Forbidden' }, 403);

    const body = await req.json() as { action: Action; dispute_id: string; resolution?: Resolution; note?: string };
    const { action, dispute_id, resolution, note } = body;
    if (!dispute_id || !action) return json({ error: 'Invalid input' }, 400);

    const { data: dispute } = await admin.from('disputes').select('*').eq('id', dispute_id).maybeSingle();
    if (!dispute) return json({ error: 'Dispute not found' }, 404);
    if (dispute.status === 'resolved') return json({ error: 'Dispute already resolved' }, 400);

    // MODERATOR: propose or escalate
    if (action === 'propose') {
      if (!resolution || !['refund_user', 'release_agent', 'split'].includes(resolution)) return json({ error: 'Invalid resolution' }, 400);
      await admin.from('disputes').update({
        moderator_proposed_resolution: resolution,
        moderator_proposed_note: note ?? null,
        moderator_by: user.id,
        moderator_at: new Date().toISOString(),
        status: 'pending_admin',
      }).eq('id', dispute_id);
      await admin.from('notifications').insert({
        user_id: dispute.raised_by, type: 'dispute',
        title: 'Moderator proposed a decision', body: 'A moderator has proposed a resolution. Awaiting admin approval.',
        link: '/dashboard',
      });
      return json({ ok: true });
    }

    if (action === 'escalate') {
      if (!isModerator && !isAdmin) return json({ error: 'Forbidden' }, 403);
      await admin.from('disputes').update({ escalated_to_admin: true, moderator_proposed_note: note ?? dispute.moderator_proposed_note }).eq('id', dispute_id);
      return json({ ok: true });
    }

    // Only admin from here on
    if (!isAdmin) return json({ error: 'Only admin can finalize' }, 403);

    if (action === 'reject') {
      // Admin rejects the moderator's proposal — clears it, keeps dispute open
      await admin.from('disputes').update({
        moderator_proposed_resolution: null,
        moderator_proposed_note: null,
        status: 'open',
      }).eq('id', dispute_id);
      return json({ ok: true });
    }

    // approve or override — admin picks final resolution
    const finalResolution: Resolution | undefined =
      action === 'override' ? resolution : (dispute.moderator_proposed_resolution as Resolution | undefined) || resolution;
    if (!finalResolution || !['refund_user', 'release_agent', 'split'].includes(finalResolution)) return json({ error: 'No resolution set' }, 400);

    const payerId = dispute.raised_by;
    const payeeId = dispute.against_user;
    const amount = Number(dispute.amount);

    const { data: payer } = await admin.from('wallets').select('available_balance, escrow_balance').eq('user_id', payerId).maybeSingle();
    if (!payer || Number(payer.escrow_balance) < amount) return json({ error: 'Insufficient escrow' }, 400);

    const refundAmt = finalResolution === 'refund_user' ? amount : finalResolution === 'split' ? Math.floor(amount / 2) : 0;
    const releaseAmt = amount - refundAmt;

    await admin.from('wallets').update({
      escrow_balance: Number(payer.escrow_balance) - amount,
      available_balance: Number(payer.available_balance) + refundAmt,
    }).eq('user_id', payerId);

    if (refundAmt > 0) {
      await admin.from('transactions').insert({
        user_id: payerId, type: 'refund', amount: refundAmt,
        description: `Dispute refund (${finalResolution})`, reference_id: dispute_id,
      });
    }
    if (releaseAmt > 0) {
      const { data: payee } = await admin.from('wallets').select('available_balance').eq('user_id', payeeId).maybeSingle();
      if (payee) {
        await admin.from('wallets').update({ available_balance: Number(payee.available_balance) + releaseAmt }).eq('user_id', payeeId);
      }
      await admin.from('transactions').insert({
        user_id: payeeId, type: 'payout', amount: releaseAmt,
        description: `Dispute release (${finalResolution})`, reference_id: dispute_id,
      });
    }

    await admin.from('disputes').update({
      status: 'resolved', resolution: finalResolution, resolution_note: note ?? dispute.moderator_proposed_note ?? null,
      resolved_by: user.id, resolved_at: new Date().toISOString(),
      admin_approved: true,
    }).eq('id', dispute_id);

    return json({ ok: true, refundAmt, releaseAmt, resolution: finalResolution });
  } catch (e) {
    console.error('dispute-resolve error', e);
    return json({ error: 'An internal error occurred.' }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
