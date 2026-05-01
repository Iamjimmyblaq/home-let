import { Layout } from '@/components/Layout';
import { agents } from '@/data/seed';
import { seedUnified } from '@/data/seedUnified';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Star, Phone, MessageSquare } from 'lucide-react';
import { PropertyCard } from '@/components/PropertyCard';

export const Agents = () => (
  <Layout>
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-2">Verified agents & landlords</h1>
      <p className="text-muted-foreground mb-8">Every Home-let agent passes KYC, ID verification, and reference checks.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((a) => (
          <Link to={`/agent-profile/${a.id}`} key={a.id} className="bg-card border rounded-2xl p-6 shadow-soft hover:shadow-elegant transition-all">
            <div className="flex items-center gap-4 mb-4">
              <img src={a.avatar} alt={a.name} className="h-16 w-16 rounded-full object-cover" />
              <div>
                <div className="font-semibold flex items-center gap-1">{a.name} {a.verified && <ShieldCheck className="h-4 w-4 text-success" />}</div>
                <div className="text-xs text-muted-foreground">{a.agency}</div>
                <div className="flex items-center gap-1 text-xs mt-1"><Star className="h-3 w-3 fill-accent text-accent" />{a.rating} · {a.reviews} reviews</div>
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
    </div>
  </Layout>
);

export const AgentProfile = () => {
  const { id } = useParams();
  const a = agents.find((x) => x.id === id);
  if (!a) return <Layout><div className="container py-20 text-center">Agent not found.</div></Layout>;
  const listings = seedUnified.filter((p) => p.agentId === a.id);
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
            <div className="text-white/80">{a.agency}</div>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" />{a.rating} ({a.reviews} reviews)</span>
              <span>·</span><span>{a.listings} listings</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary"><Phone className="h-4 w-4" />{a.phone}</Button>
            <Link to="/chat"><Button className="bg-accent text-accent-foreground"><MessageSquare className="h-4 w-4" />Message</Button></Link>
          </div>
        </div>
      </div>
      <div className="container py-10">
        <p className="text-muted-foreground max-w-3xl mb-8">{a.bio}</p>
        <h2 className="text-2xl font-bold mb-4">Active listings</h2>
        {listings.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{listings.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
        ) : <p className="text-muted-foreground">No active listings.</p>}
      </div>
    </Layout>
  );
};
