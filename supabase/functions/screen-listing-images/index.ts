import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type Incoming = { path: string; phash: string };

const hamming = (a: string, b: string) => {
  if (a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const images: Incoming[] = Array.isArray(body?.images) ? body.images.slice(0, 8) : [];
    if (!images.length) return json({ error: 'No images supplied' }, 400);

    const admin = createClient(url, service);
    const reasons: { level: 'block' | 'flag'; message: string; image?: string }[] = [];

    // ---------- 1. Internal duplicate detection (perceptual hash) ----------
    const { data: existing } = await admin
      .from('listing_image_fingerprints')
      .select('phash, agent_id, listing_id, image_path');

    for (const img of images) {
      if (!img?.phash) continue;
      const match = (existing ?? []).find(
        (e: any) => e.image_path !== img.path && hamming(String(e.phash), img.phash) <= 5,
      );
      if (match) {
        reasons.push({
          level: (match as any).agent_id === user.id ? 'flag' : 'block',
          image: img.path,
          message: (match as any).agent_id === user.id
            ? 'This photo is already used on another of your listings.'
            : 'This exact photo is already published on Home-Let by another agent.',
        });
      }
    }
    // duplicates inside the same submission
    for (let i = 0; i < images.length; i++) {
      for (let j = i + 1; j < images.length; j++) {
        if (images[i].phash && hamming(images[i].phash, images[j].phash) <= 3) {
          reasons.push({ level: 'flag', image: images[j].path, message: 'Duplicate photo uploaded twice in this listing.' });
        }
      }
    }

    // ---------- 2. AI vision authenticity analysis ----------
    const signed: { path: string; url: string }[] = [];
    for (const img of images) {
      const { data } = await admin.storage.from('property-photos').createSignedUrl(img.path, 600);
      if (data?.signedUrl) signed.push({ path: img.path, url: data.signedUrl });
    }

    let searchQueries: string[] = [];
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (lovableKey && signed.length) {
      const content: any[] = [{
        type: 'text',
        text:
          'You are a real-estate listing fraud screener. For each image, decide whether it looks like an authentic photo taken by the lister, or a reused/stock/marketing image. ' +
          'Look for watermarks, agency logos, listing-portal overlays, price banners, screenshots of other websites, magazine/render quality, or celebrity/landmark properties. ' +
          'Reply ONLY with JSON: {"images":[{"index":0,"suspicious":true,"reason":"...","search_query":"short web search phrase to locate the original online or empty string"}]}',
      }];
      signed.forEach((s) => content.push({ type: 'image_url', image_url: { url: s.url } }));

      const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': lovableKey },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content }],
          response_format: { type: 'json_object' },
        }),
      });

      if (aiRes.status === 429) reasons.push({ level: 'flag', message: 'AI screening is rate limited right now; this listing was not fully verified.' });
      else if (aiRes.status === 402) reasons.push({ level: 'flag', message: 'AI screening credits exhausted; this listing was not fully verified.' });
      else if (!aiRes.ok) {
        console.error('AI screen failed', aiRes.status, await aiRes.text());
      } else {
        const data = await aiRes.json();
        try {
          const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? '{}');
          for (const item of parsed?.images ?? []) {
            const target = signed[Number(item.index) || 0];
            if (item?.suspicious) {
              reasons.push({ level: 'flag', image: target?.path, message: `AI check: ${item.reason || 'image looks reused or promotional.'}` });
            }
            if (item?.search_query) searchQueries.push(String(item.search_query));
          }
        } catch (e) { console.error('AI JSON parse failed', e); }
      }
    }

    // ---------- 3. Web search for matching listings (Firecrawl, optional) ----------
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const webMatches: { title: string; url: string }[] = [];
    if (firecrawlKey && searchQueries.length) {
      for (const q of Array.from(new Set(searchQueries)).slice(0, 3)) {
        try {
          const isGateway = firecrawlKey.startsWith('lovc_');
          const endpoint = isGateway
            ? 'https://connector-gateway.lovable.dev/firecrawl/v2/search'
            : 'https://api.firecrawl.dev/v2/search';
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (isGateway) {
            headers['Authorization'] = `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`;
            headers['X-Connection-Api-Key'] = firecrawlKey;
          } else headers['Authorization'] = `Bearer ${firecrawlKey}`;

          const r = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ query: q, limit: 3 }) });
          if (!r.ok) { console.error('firecrawl failed', r.status, await r.text()); continue; }
          const d = await r.json();
          for (const hit of d?.data ?? []) {
            if (hit?.url) webMatches.push({ title: hit.title || hit.url, url: hit.url });
          }
        } catch (e) { console.error('firecrawl error', e); }
      }
      if (webMatches.length) {
        reasons.push({ level: 'flag', message: `Similar property content found online (${webMatches.length} result(s)) — verify the agent owns these photos.` });
      }
    }

    const verdict = reasons.some((r) => r.level === 'block') ? 'block' : reasons.length ? 'flag' : 'clear';
    return json({ verdict, reasons, webMatches, webSearchEnabled: !!firecrawlKey });
  } catch (e) {
    console.error('screen-listing-images error', e);
    return json({ error: (e as Error).message }, 500);
  }
});
