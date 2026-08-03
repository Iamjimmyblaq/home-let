import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Seo, SITE_URL } from '@/components/Seo';
import { naira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BedDouble, Bath, Maximize, MapPin, ShieldCheck, Eye, MessageSquare, Calendar, Phone, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useListing } from '@/hooks/useListings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { item: p, loading } = useListing(id);
  const { user } = useAuth();
  const [active, setActive] = useState(0);

  if (loading) return <Layout><div className="container py-20 text-center">Loading…</div></Layout>;
  if (!p) return <Layout><div className="container py-20 text-center">Property not found.</div></Layout>;

  const priceLabel = p.type === 'rent' || p.type === 'hostel' ? `${naira(p.price)}/year` : p.type === 'shortlet' ? `${naira(p.price)}/night` : naira(p.price);
  const hasCoords = typeof p.latitude === 'number' && typeof p.longitude === 'number';
  // Google Maps satellite (Google Earth-style) embed — works without API key.
  const mapQuery = hasCoords
    ? `${p.latitude},${p.longitude}`
    : encodeURIComponent(`${p.location}, ${p.city}, ${p.state}`);
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&t=k&z=17&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.location}, ${p.city}, ${p.state}`)}`;


  const messageAgent = async () => {
    if (!user) { navigate('/login'); return; }
    if (p.source !== 'db') { navigate('/chat'); return; }
    const { data: existing } = await supabase.from('chat_threads').select('id').eq('user_id', user.id).eq('agent_id', p.agentId).eq('listing_id', p.id).maybeSingle();
    let threadId = existing?.id;
    if (!threadId) {
      const { data, error } = await supabase.from('chat_threads').insert({ user_id: user.id, agent_id: p.agentId, listing_id: p.id }).select('id').single();
      if (error) { toast.error(error.message); return; }
      threadId = data.id;
    }
    navigate(`/chat?thread=${threadId}`);
  };

  return (
    <Layout>
      <Seo
        title={`${p.title} — ${p.location || p.city || 'Nigeria'} | Home-let`.slice(0, 65)}
        description={(p.description || `${p.title} in ${[p.location, p.city, p.state].filter(Boolean).join(', ')} for ${naira(p.price)} on Home-let.`).slice(0, 158)}
        path={`/property/${p.id}`}
        image={p.image}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Accommodation',
          name: p.title,
          description: p.description || undefined,
          image: p.gallery?.length ? p.gallery : p.image,
          url: `${SITE_URL}/property/${p.id}`,
          numberOfBedrooms: p.beds || undefined,
          numberOfBathroomsTotal: p.baths || undefined,
          floorSize: p.sqm ? { '@type': 'QuantitativeValue', value: p.sqm, unitCode: 'MTK' } : undefined,
          address: {
            '@type': 'PostalAddress',
            streetAddress: p.location || undefined,
            addressLocality: p.city || undefined,
            addressRegion: p.state || undefined,
            addressCountry: 'NG',
          },
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: 'NGN',
            availability: 'https://schema.org/InStock',
            url: `${SITE_URL}/property/${p.id}`,
          },
        }}
      />
      <div className="container py-6">
        <div className="text-sm text-muted-foreground mb-3">
          <Link to="/" className="hover:text-foreground">Home</Link> / <Link to="/listings" className="hover:text-foreground">Listings</Link> / <span className="text-foreground">{p.title}</span>
        </div>

        <div className="grid md:grid-cols-4 gap-3 mb-8" onContextMenu={(e) => e.preventDefault()}>
          <div className="md:col-span-3 aspect-[16/10] rounded-2xl overflow-hidden bg-muted relative">
            <img src={p.gallery[active] || p.image} alt={p.title} draggable={false} className="w-full h-full object-cover select-none" />
            <div className="absolute bottom-3 right-3 text-white/80 text-[10px] tracking-widest uppercase drop-shadow">Home-let</div>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-1 gap-3 md:max-h-[calc(100%)] md:overflow-y-auto">
            {p.gallery.map((g, i) => (
              <button key={i} onClick={() => setActive(i)} className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${active === i ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                <img src={g} alt="" draggable={false} className="w-full h-full object-cover select-none" />
              </button>
            ))}
          </div>
        </div>


        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-primary capitalize">{p.type === 'shortlet' ? 'Short-let' : p.type}</Badge>
                {p.verified && <Badge className="bg-success text-success-foreground"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>}
                {p.hasVirtualTour && <Badge className="bg-accent text-accent-foreground"><Eye className="h-3 w-3 mr-1" />360° Available</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{p.title}</h1>
              <div className="flex items-center text-muted-foreground gap-1"><MapPin className="h-4 w-4" />{p.location}{p.city ? `, ${p.city}` : ''}{p.state ? `, ${p.state}` : ''}</div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: BedDouble, label: 'Bedrooms', v: p.beds },
                { icon: Bath, label: 'Bathrooms', v: p.baths },
                { icon: Maximize, label: 'Area', v: p.sqm > 0 ? `${p.sqm} m²` : '—' },
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

            {p.features.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Features & Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success" />{f}</div>
                  ))}
                </div>
              </div>
            )}

            {p.type === 'sale' && p.certUrl && (
              <div className="rounded-2xl border bg-success/5 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-success" />
                  <div>
                    <div className="font-semibold text-sm">Ownership documentation provided</div>
                    <div className="text-xs text-muted-foreground">{p.certType || 'Property certificate'} attached by the agent.</div>
                  </div>
                </div>
                <a href={p.certUrl} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
                  View document <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {p.gallery.length > 0 && (
              <div className="rounded-2xl gradient-hero text-primary-foreground p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">Play the virtual tour</h3>
                  <p className="text-white/80 text-sm">Auto-built from this property's photos — sit back and explore.</p>
                </div>
                <Button onClick={() => navigate(`/tour/${p.id}`)} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold">
                  <Eye className="h-4 w-4" /> Launch virtual tour
                </Button>
              </div>
            )}


            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-xl font-bold">Property location</h2>
                <a href={directionsUrl} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
                  Open map <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              {hasCoords ? (
                <iframe
                  title={`Satellite map for ${p.title}`}
                  src={mapSrc}
                  className="w-full aspect-[16/9] rounded-2xl border bg-muted"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <iframe
                  title={`Map search for ${p.title}`}
                  src={mapSrc}
                  className="w-full aspect-[16/9] rounded-2xl border bg-muted"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}

            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border rounded-2xl p-6 shadow-soft sticky top-20">
              <div className="text-sm text-muted-foreground">Listed price</div>
              <div className="text-3xl font-bold text-primary mb-1" style={{ fontFamily: 'Sora' }}>{priceLabel}</div>
              {p.type === 'shortlet' && (p as any).nightsAvailable ? (
                <div className="text-xs text-muted-foreground mb-3">Up to {(p as any).nightsAvailable} nights available</div>
              ) : <div className="mb-3" />}
              {(p.extraFees?.length || (p.cautionFee || 0) > 0) && (
                <div className="border-t pt-3 mb-3 space-y-1 text-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Additional charges</div>
                  {p.extraFees?.map((ef, i) => (
                    <div key={i} className="flex justify-between"><span className="text-muted-foreground">{ef.label}</span><span>{naira(Number(ef.amount || 0))}</span></div>
                  ))}
                  {(p.cautionFee || 0) > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Caution deposit (refundable)</span><span>{naira(p.cautionFee!)}</span></div>
                  )}
                </div>
              )}
              <Button onClick={() => navigate(`/inspection/${p.id}`)} className="w-full mb-2" size="lg">
                <Calendar className="h-4 w-4" /> Book inspection
              </Button>
              <Button onClick={() => navigate(`/booking/${p.id}`)} variant="outline" className="w-full mb-2" size="lg">
                {p.type === 'shortlet' ? 'Reserve now' : 'Make an offer'}
              </Button>
              <Button onClick={messageAgent} variant="ghost" className="w-full" size="lg">
                <MessageSquare className="h-4 w-4" /> Message agent
              </Button>

              <div className="border-t mt-6 pt-6">
                <div className="flex items-center gap-3">
                  {p.agentAvatar && <img src={p.agentAvatar} alt={p.agentName} className="h-12 w-12 rounded-full object-cover" />}
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-1">
                      {p.agentName} {p.agentVerified && <ShieldCheck className="h-3.5 w-3.5 text-success" />}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.agentAgency}</div>
                  </div>
                </div>
                {p.agentPhone && <Button variant="outline" size="sm" className="w-full mt-3"><Phone className="h-3 w-3" /> {p.agentPhone}</Button>}
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
