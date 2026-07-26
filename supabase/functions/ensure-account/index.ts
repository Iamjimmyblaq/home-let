import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const SUPER_ADMIN_EMAILS = ['home-let@zohomail.com', 'odamajames65@gmail.com'];
const isSuperAdmin = (email: string) => SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());

const normalizeUsername = (value: string) => {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '').slice(0, 20);
  return cleaned.length >= 3 ? cleaned : `user_${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(supaUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(supaUrl, serviceKey);
    const meta = user.user_metadata || {};
    const email = String(user.email || '').toLowerCase();
    const requested = String(meta.role || '').toLowerCase();
    const chosenRole = isSuperAdmin(email) ? 'admin' : requested === 'agent' || requested === 'landlord' ? 'agent' : 'user';
    const fullName = String(meta.full_name || user.email?.split('@')[0] || 'User').trim();
    const phone = meta.phone ? String(meta.phone).trim() : null;
    const agency = meta.agency_name ? String(meta.agency_name).trim() : null;

    const { data: profile } = await admin.from('profiles').select('user_id, username').eq('user_id', user.id).maybeSingle();
    let username = profile?.username || normalizeUsername(String(meta.username || user.email?.split('@')[0] || 'user'));
    if (!profile?.username) {
      let candidate = username;
      let suffix = 0;
      while (true) {
        const { data: existing } = await admin.from('profiles').select('user_id').eq('username', candidate).neq('user_id', user.id).maybeSingle();
        if (!existing) break;
        suffix += 1;
        candidate = `${username.slice(0, Math.max(3, 19 - String(suffix).length))}_${suffix}`;
      }
      username = candidate;
    }

    await admin.from('profiles').upsert({
      user_id: user.id,
      full_name: fullName,
      phone,
      agency_name: chosenRole === 'agent' ? agency : null,
      username,
    }, { onConflict: 'user_id', ignoreDuplicates: false });

    if (chosenRole === 'admin') {
      await admin.from('user_roles').delete().eq('user_id', user.id).neq('role', 'admin');
    }

    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', user.id);
    if (!roles?.length) {
      await admin.from('user_roles').insert({ user_id: user.id, role: chosenRole, username });
    } else if (chosenRole === 'admin' && !roles.some((r: any) => r.role === 'admin')) {
      await admin.from('user_roles').insert({ user_id: user.id, role: 'admin', username });
    } else {
      await admin.from('user_roles').update({ username }).eq('user_id', user.id);
    }

    await admin.from('wallets').upsert({ user_id: user.id, available_balance: 0, escrow_balance: 0 }, { onConflict: 'user_id', ignoreDuplicates: true });
    return json({ ok: true, role: roles?.length ? roles[0].role : chosenRole });
  } catch (error) {
    console.error('ensure-account-error', error);
    return json({ error: 'An internal error occurred. Please try again.' }, 500);
  }
});
