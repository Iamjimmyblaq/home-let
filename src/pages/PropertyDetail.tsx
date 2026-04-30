import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { properties, agents } from '@/data/seed';
import { naira, shortNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BedDouble, Bath, Maximize, MapPin, ShieldCheck, Eye, MessageSquare, Calendar, Phone, Star, Check } from 'lucide-react';
import { useState } from 'react';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const p = properties.find((x) => x.id === id);
  const [active, setActive] = useState(0);

  if (!p) return <Layout><div className="container py-20 text-center">Property not found.</div></Layout>;
  const agent = agents.find((a) => a.id === p.agentId)!;
  const priceLabel = p.type === 'rent' ? `${naira(p.price)}/year` : p.type === 'shortlet' ? `${naira(p.price)}/night` : naira(p.price);

  return (
    <Layout>
      <div className="container py-6">
        <div className="text-sm text-muted-foreground mb-3">
          <Link to="/" className="hover:text-foreground">Home</Link> / <Link to="/listings" className="hover:text-foreground">Listings</Link> / <span className="text-foreground">{p.title}</span>
        </div>

        {/* Gallery */}
        <div className="grid md:grid-cols-4 gap-3 mb-8">
          <div className="md:col-span-3 aspect-[16/10] rounded-2xl overflow-hidden bg-muted">
            <img src={p.gallery[active]} alt={p.title} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 md:grid-cols-1 gap-3">
            {p.gallery.slice(0, 4).map((g, i) => (
              <button key={i} onClick={() => setActive(i)} className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${active === i ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                <img src={g} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-primary capitalize">{p.type === 'shortlet' ? 'Short-let' : p.type}</Badge>
                {p.verified && <Badge className="bg-success text-success-foreground"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>}
                {p.hasVirtualTour && <Badge className="bg-accent text-accent-foreground"><Eye className="h-3 w-3 mr-1" />360° Available</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{p.title}</h1>
              <div className="flex items-center text-muted-foreground gap-1"><MapPin className="h-4 w-4" />{p.location}, {p.city}, {p.state}</div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: BedDouble, label: 'Bedrooms', v: p.beds },
                { icon: Bath, label: 'Bathrooms', v: p.baths },
                { icon: Maximize, label: 'Area', v: `${p.sqm} m²` },
              ].map((s) => (
                <div key={s.label} className="bg-secondary/50 rounded-xl p-4 text-center">
                  <s.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="font-bold">{s.v}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">About this property</h2>
              <p className="text-muted-foreground leading-relaxed">{p.description}</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">Features & Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success" />{f}</div>
                ))}
              </div>
            </div>

            {p.hasVirtualTour && (
              <div className="rounded-2xl gradient-hero text-primary-foreground p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">Take a 360° virtual tour</h3>
                  <p className="text-white/80 text-sm">Explore every room from your device.</p>
                </div>
                <Button onClick={() => navigate(`/tour/${p.id}`)} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold">
                  <Eye className="h-4 w-4" /> Launch 360° Tour
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border rounded-2xl p-6 shadow-soft sticky top-20">
              <div className="text-sm text-muted-foreground">Listed price</div>
              <div className="text-3xl font-bold text-primary mb-4" style={{ fontFamily: 'Sora' }}>{priceLabel}</div>
              <Button onClick={() => navigate(`/inspection/${p.id}`)} className="w-full mb-2" size="lg">
                <Calendar className="h-4 w-4" /> Book inspection
              </Button>
              <Button onClick={() => navigate(`/booking/${p.id}`)} variant="outline" className="w-full mb-2" size="lg">
                {p.type === 'shortlet' ? 'Reserve now' : 'Make an offer'}
              </Button>
              <Button onClick={() => navigate('/chat')} variant="ghost" className="w-full" size="lg">
                <MessageSquare className="h-4 w-4" /> Message agent
              </Button>

              <div className="border-t mt-6 pt-6">
                <Link to={`/agent-profile/${agent.id}`} className="flex items-center gap-3 group">
                  <img src={agent.avatar} alt={agent.name} className="h-12 w-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-1 group-hover:text-primary">
                      {agent.name} {agent.verified && <ShieldCheck className="h-3.5 w-3.5 text-success" />}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" />{agent.rating} · {agent.reviews} reviews
                    </div>
                  </div>
                </Link>
                <Button variant="outline" size="sm" className="w-full mt-3"><Phone className="h-3 w-3" /> {agent.phone}</Button>
              </div>

              <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-xs text-muted-foreground flex gap-2">
                <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                <span>All payments are protected by Home-let escrow until you confirm.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PropertyDetail;
