import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { properties as seedProperties, Property as SeedProperty, agents as seedAgents } from '@/data/seed';

export type DbListing = {
  id: string;
  agent_id: string;
  title: string;
  description: string | null;
  type: 'rent' | 'sale' | 'shortlet' | 'hotel';
  category: string | null;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  location: string;
  city: string | null;
  state: string | null;
  amenities: string[];
  images: string[];
  tour_url: string | null;
  status: 'pending' | 'verified' | 'rejected' | 'inactive';
  featured: boolean;
  latitude: number | null;
  longitude: number | null;
  cert_url?: string | null;
  cert_type?: string | null;
  boost_status?: string | null;
  boost_until?: string | null;
};

// Unified card-friendly type combining seeded mock data + real DB rows
export type UnifiedProperty = {
  id: string;
  source: 'seed' | 'db';
  title: string;
  type: 'rent' | 'sale' | 'shortlet' | 'hotel';
  price: number;
  location: string;
  city: string;
  state: string;
  beds: number;
  baths: number;
  sqm: number;
  image: string;
  gallery: string[];
  agentId: string;
  agentName?: string;
  agentAvatar?: string;
  agentAgency?: string;
  agentPhone?: string;
  agentVerified?: boolean;
  verified: boolean;
  features: string[];
  description: string;
  hasVirtualTour: boolean;
  tourUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const seedCoords: Record<string, { latitude: number; longitude: number }> = {
  p1: { latitude: 6.4698, longitude: 3.5517 },
  p2: { latitude: 6.4316, longitude: 3.4542 },
  p3: { latitude: 6.4478, longitude: 3.4723 },
  p4: { latitude: 9.0876, longitude: 7.4948 },
  p5: { latitude: 6.5163, longitude: 3.3792 },
  p6: { latitude: 6.4532, longitude: 4.0953 },
  p7: { latitude: 6.4314, longitude: 3.5082 },
  p8: { latitude: 6.6156, longitude: 3.3838 },
};

const seedToUnified = (p: SeedProperty): UnifiedProperty => {
  const a = seedAgents.find((x) => x.id === p.agentId);
  const coords = seedCoords[p.id];
  return {
    id: p.id, source: 'seed', title: p.title, type: p.type, price: p.price,
    location: p.location, city: p.city, state: p.state,
    beds: p.beds, baths: p.baths, sqm: p.sqm,
    image: p.image, gallery: p.gallery, agentId: p.agentId,
    agentName: a?.name, agentAvatar: a?.avatar, agentAgency: a?.agency, agentPhone: a?.phone, agentVerified: a?.verified,
    verified: p.verified, features: p.features, description: p.description, hasVirtualTour: p.hasVirtualTour,
    latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null,
  };
};

const isDirectUrl = (value?: string | null) => !!value && (/^(https?:|data:|blob:|\/)/.test(value));

const pathFromStorageUrl = (value: string, bucket: string) => {
  const marker = `/object/public/${bucket}/`;
  const index = value.indexOf(marker);
  return index >= 0 ? decodeURIComponent(value.slice(index + marker.length).split('?')[0]) : value;
};

const signedStorageUrl = async (bucket: string, value?: string | null) => {
  if (!value) return null;
  if (isDirectUrl(value) && !value.includes(`/object/public/${bucket}/`)) return value;
  const path = pathFromStorageUrl(value, bucket);
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24);
  return data?.signedUrl ?? value;
};

const dbToUnified = (l: DbListing, profileMap: Map<string, any>, gallery: string[], avatarUrl: string | null): UnifiedProperty => {
  const prof = profileMap.get(l.agent_id);
  return {
    id: l.id, source: 'db', title: l.title, type: l.type, price: Number(l.price),
    location: l.location, city: l.city || '', state: l.state || '',
    beds: l.bedrooms, baths: l.bathrooms, sqm: l.area_sqm || 0,
    image: gallery[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200',
    gallery: gallery.length ? gallery : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200'],
    agentId: l.agent_id,
    agentName: prof?.full_name || 'Agent',
    agentAvatar: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${prof?.full_name || 'A'}`,
    agentAgency: prof?.agency_name || 'Independent',
    agentPhone: prof?.phone || '',
    agentVerified: prof?.kyc_status === 'verified',
    verified: l.status === 'verified',
    features: l.amenities,
    description: l.description || '',
    hasVirtualTour: !!l.tour_url || gallery.length > 0,
    tourUrl: l.tour_url,
    latitude: l.latitude,
    longitude: l.longitude,
  };
};

const resolveDbListing = async (l: DbListing, profileMap: Map<string, any>) => {
  const prof = profileMap.get(l.agent_id);
  const gallery = (await Promise.all((l.images || []).map((img) => signedStorageUrl('property-photos', img)))).filter(Boolean) as string[];
  const avatarUrl = await signedStorageUrl('avatars', prof?.avatar_url);
  return dbToUnified(l, profileMap, gallery, avatarUrl);
};

export const useListings = (opts?: { agentId?: string; includeUnverified?: boolean }) => {
  const [items, setItems] = useState<UnifiedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('listings').select('*').order('created_at', { ascending: false });
    if (opts?.agentId) q = q.eq('agent_id', opts.agentId);
    const { data } = await q;
    const dbRows = (data || []) as DbListing[];
    const filtered = opts?.includeUnverified || opts?.agentId ? dbRows : dbRows.filter((r) => r.status === 'verified');

    const agentIds = Array.from(new Set(filtered.map((r) => r.agent_id)));
    let profileMap = new Map<string, any>();
    if (agentIds.length) {
      const { data: profs } = await supabase.from('profiles').select('*').in('user_id', agentIds);
      profileMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
    }

    const dbUnified = await Promise.all(filtered.map((r) => resolveDbListing(r, profileMap)));
    if (opts?.agentId) {
      setItems(dbUnified);
    } else {
      // blend with seeded mock data for browse pages
      setItems([...dbUnified, ...seedProperties.map(seedToUnified)]);
    }
    setLoading(false);
  }, [opts?.agentId, opts?.includeUnverified]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, reload: load };
};

export const useListing = (id?: string) => {
  const [item, setItem] = useState<UnifiedProperty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      // try seed first
      const seed = seedProperties.find((p) => p.id === id);
      if (seed) { setItem(seedToUnified(seed)); setLoading(false); return; }
      const { data } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
      if (data) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('user_id', (data as any).agent_id).maybeSingle();
        const map = new Map([[(data as any).agent_id, prof]]);
        setItem(await resolveDbListing(data as DbListing, map));
      }
      setLoading(false);
    })();
  }, [id]);

  return { item, loading };
};
