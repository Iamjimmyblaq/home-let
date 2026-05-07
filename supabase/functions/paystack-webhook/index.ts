import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const toHex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  return toHex(digest) === signature;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!secret) return json({ error: 'Payment provider is not configured' }, 500);

    const rawBody = await req.text();
    const valid = await verifySignature(rawBody, req.headers.get('x-paystack-signature'), secret);
    if (!valid) return json({ error: 'Invalid signature' }, 401);

    const payload = JSON.parse(rawBody);
    if (payload.event !== 'charge.success' || payload.data?.status !== 'success') return json({ ok: true, ignored: true });

    const userId = payload.data?.metadata?.user_id;
    const reference = payload.data?.reference;
    const amount = Math.floor(Number(payload.data?.amount || 0) / 100);
    if (!userId || !reference || amount <= 0) return json({ ok: true, ignored: true });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error } = await admin.rpc('credit_paystack_wallet', { _user_id: userId, _amount: amount, _reference: reference });
    if (error) throw error;

    return json({ ok: true });
  } catch (error) {
    console.error('paystack-webhook-error', error);
    return json({ error: 'An internal error occurred. Please try again.' }, 500);
  }
});
