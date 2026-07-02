import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supaUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: uErr } = await userClient.auth.getUser();
    if (uErr || !user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(supaUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const targetId = String(body.target_user_id || user.id);

    // Check caller role
    const { data: roleRows } = await admin.from('user_roles').select('role').eq('user_id', user.id);
    const isAdmin = (roleRows || []).some((r: any) => r.role === 'admin');
    const isSelf = targetId === user.id;

    // Only self can delete their own account (via delete_self), otherwise must be admin
    if (action === 'delete_self') {
      if (!isSelf) return json({ error: 'Can only delete your own account' }, 403);
    } else {
      if (!isAdmin) return json({ error: 'Admin only' }, 403);
      if (targetId === user.id && action !== 'unsuspend') return json({ error: 'Cannot perform this on yourself' }, 400);
    }

    if (action === 'delete' || action === 'delete_self') {
      // Cascades remove profile, listings, wallets, chats, etc.
      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, deleted: targetId });
    }

    if (action === 'suspend') {
      const days = Math.max(1, Math.min(365 * 10, Number(body.days) || 3650));
      const { error } = await admin.auth.admin.updateUserById(targetId, { ban_duration: `${days * 24}h` } as any);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, suspended: targetId, days });
    }

    if (action === 'unsuspend') {
      const { error } = await admin.auth.admin.updateUserById(targetId, { ban_duration: 'none' } as any);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, unsuspended: targetId });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('admin-user-action-error', e);
    return json({ error: 'Internal error' }, 500);
  }
});
