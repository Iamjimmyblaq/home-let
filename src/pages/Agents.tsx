import { Layout } from '@/components/Layout';
import { agents as seedAgents } from '@/data/seed';
import { seedUnified } from '@/data/seedUnified';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Star, Phone, MessageSquare } from 'lucide-react';
import { PropertyCard } from '@/components/PropertyCard';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AgentRow = {
  id: string;
  user_id: string;
  name: string;
  username: string | null;
  agency: string;
  avatar: string;
  bio: string;
  phone: string;
  verified: boolean;
  rating: number;
  reviews: number;
  listings: number;
};

const fromSeed = (a: typeof seedAgents[number]): AgentRow => ({
  id: a.id, user_id: a.id, name: a.name, username: null, agency: a.agency, avatar: a.avatar,
  bio: a.bio, phone: a.phone, verified: a.verified, rating: a.rating, reviews: a.reviews, listings: a.listings,
});

const useAgentList = () => {
  const [items, setItems] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: profs } = await (supabase as any).from('agents_public').select('*');
      const ids = ((profs as any[]) || []).map((p) => p.user_id);
      let counts: Record<string, number> = {};
      if (ids.length) {
        const { data: lst } = await supabase.from('listings').select('agent_id, status').in('agent_id', ids);
        (lst || []).forEach((l: any) => { if (l.status === 'verified') counts[l.agent_id] = (counts[l.agent_id] || 0) + 1; });
      }
      const dbRows: AgentRow[] = ((profs as any[]) || []).map((p: any) => ({
        id: p.user_id,
        user_id: p.user_id,
        name: p.full_name || p.username || 'Agent',
        username: p.username,
        agency: p.agency_name || 'Independent',
        avatar: p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.full_name || 'A')}`,
        bio: p.bio || 'Verified Home-let agent.',
        phone: '',
        verified: !!p.verified,
        rating: Number(p.agent_rating || (p.verified ? 4.8 : 4.0)),
        reviews: Number(p.agent_reviews || counts[p.user_id] || 0),
        listings: counts[p.user_id] || 0,
      }));

      const merged = [...dbRows, ...seedAgents.map(fromSeed)];
      // sort by rating desc, then reviews desc
      merged.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews || b.listings - a.listings);
      setItems(merged);
      setLoading(false);
    })();
  }, []);

  return { items, loading };
};

export const Agents = () => {
  const { items, loading } = useAgentList();
  return (
    <Layout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-2">Verified agents & landlords</h1>
        <p className="text-muted-foreground mb-8">Ranked by rating. Every Home-let agent passes KYC, ID verification, and reference checks.</p>
        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading agents…</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((a) => (
              <Link to={`/agent-profile/${a.id}`} key={a.id} className="bg-card border rounded-2xl p-6 shadow-soft hover:shadow-elegant transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <img src={a.avatar} alt={a.name} className="h-16 w-16 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold flex items-center gap-1">{a.name} {a.verified && <ShieldCheck className="h-4 w-4 text-success" />}</div>
                    <div className="text-xs text-muted-foreground">{a.agency}{a.username ? ` · @${a.username}` : ''}</div>
                    <div className="flex items-center gap-1 text-xs mt-1"><Star className="h-3 w-3 fill-accent text-accent" />{a.rating.toFixed(1)} · {a.reviews} reviews</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{a.bio}</p>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">{a.listings} listings</Badge>
                  <Button size="sm" variant="outline">View profile →</Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export const AgentProfile = () => {
  const { id } = useParams();
  const seed = seedAgents.find((x) => x.id === id);
  const [a, setA] = useState<AgentRow | null>(seed ? fromSeed(seed) : null);
  const [dbListings, setDbListings] = useState<any[]>([]);

  useEffect(() => {
    if (seed || !id) return;
    (async () => {
      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', id).maybeSingle();
      if (p) {
        setA({
          id: p.user_id, user_id: p.user_id,
          name: p.full_name || p.username || 'Agent', username: p.username,
          agency: p.agency_name || 'Independent',
          avatar: p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.full_name || 'A')}`,
          bio: p.bio || 'Verified Home-let agent.', phone: '',
          verified: p.kyc_status === 'verified', rating: Number(p.agent_rating || 4.6), reviews: Number(p.agent_reviews || 0), listings: 0,
        });
      }
      const { data: l } = await supabase.from('listings').select('*').eq('agent_id', id).eq('status', 'verified');
      setDbListings(l || []);
    })();
  }, [id, seed]);

  if (!a) return <Layout><div className="container py-20 text-center">Agent not found.</div></Layout>;
  const seedListings = seedUnified.filter((p) => p.agentId === a.id);
  const allListings = [
    ...seedListings,
    ...dbListings.map((l: any) => ({
      id: l.id, source: 'db' as const, title: l.title, type: l.type, price: Number(l.price),
      location: l.location, city: l.city || '', state: l.state || '',
      beds: l.bedrooms, baths: l.bathrooms, sqm: l.area_sqm || 0,
      image: l.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200',
      gallery: l.images || [], agentId: l.agent_id,
      agentName: a.name, agentAvatar: a.avatar, agentAgency: a.agency, agentPhone: a.phone, agentVerified: a.verified,
      verified: true, features: l.amenities || [], description: l.description || '', hasVirtualTour: !!l.tour_url, tourUrl: l.tour_url,
      latitude: l.latitude, longitude: l.longitude,
    })),
  ];

  return (
    <Layout>
      <div className="gradient-hero text-primary-foreground">
        <div className="container py-12 flex flex-col md:flex-row items-start md:items-center gap-6">
          <img src={a.avatar} alt={a.name} className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white/30" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{a.name}</h1>
              {a.verified && <Badge className="bg-success text-success-foreground"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>}
            </div>
            <div className="text-white/80">{a.agency}{a.username ? ` · @${a.username}` : ''}</div>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" />{a.rating.toFixed(1)} ({a.reviews} reviews)</span>
              <span>·</span><span>{allListings.length} listings</span>
            </div>
          </div>
          <div className="flex gap-2">
            {a.phone && <Button variant="secondary"><Phone className="h-4 w-4" />{a.phone}</Button>}
            <Link to="/chat"><Button className="bg-accent text-accent-foreground"><MessageSquare className="h-4 w-4" />Message</Button></Link>
          </div>
        </div>
      </div>
      <div className="container py-10">
        <p className="text-muted-foreground max-w-3xl mb-8">{a.bio}</p>
        <h2 className="text-2xl font-bold mb-4">Active listings</h2>
        {allListings.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{allListings.map((p) => <PropertyCard key={p.id} p={p as any} />)}</div>
        ) : <p className="text-muted-foreground">No active listings.</p>}
      </div>
    </Layout>
  );
};
