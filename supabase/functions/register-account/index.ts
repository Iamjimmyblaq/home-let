import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const clean = (value: unknown) => String(value || '').trim();
const normalizeUsername = (value: string) => {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '').slice(0, 20);
  return /^[a-z0-9_]{3,20}$/.test(cleaned) ? cleaned : '';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const email = clean(body.email).toLowerCase();
    const password = String(body.password || '');
    const fullName = clean(body.full_name) || email.split('@')[0];
    const username = normalizeUsername(clean(body.username));
    const requestedRole = clean(body.role).toLowerCase();
    const role = requestedRole === 'agent' || requestedRole === 'landlord' ? 'agent' : 'user';
    const phone = clean(body.phone) || null;
    const agencyName = role === 'agent' ? clean(body.agency_name) || null : null;
    const redirectTo = clean(body.email_redirect_to);

    if (!email.includes('@') || password.length < 6 || !username) {
      return json({ error: 'Enter a valid email, password, and username.' }, 400);
    }

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anon = createClient(supaUrl, anonKey);
    const admin = createClient(supaUrl, serviceKey);

    const { data: usernameOwner } = await admin.from('profiles').select('user_id').eq('username', username).maybeSingle();
    if (usernameOwner) return json({ error: 'That username is already taken.' }, 409);

    const { data, error } = await anon.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo || undefined,
        data: { full_name: fullName, username, phone, agency_name: agencyName, role },
      },
    });
    if (error) return json({ error: error.message }, 400);
    if (!data.user?.id) return json({ error: 'Could not create account.' }, 400);

    await admin.from('profiles').upsert({
      user_id: data.user.id,
      full_name: fullName,
      username,
      phone,
      agency_name: agencyName,
    }, { onConflict: 'user_id' });
    await admin.from('user_roles').upsert({ user_id: data.user.id, role, username }, { onConflict: 'user_id,role' });
    await admin.from('wallets').upsert({ user_id: data.user.id, available_balance: 0, escrow_balance: 0 }, { onConflict: 'user_id', ignoreDuplicates: true });

    return json({ ok: true, role });
  } catch (error) {
    console.error('register-account-error', error);
    return json({ error: 'An internal error occurred. Please try again.' }, 500);
  }
});