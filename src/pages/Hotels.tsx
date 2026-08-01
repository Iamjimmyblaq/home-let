import { Layout } from '@/components/Layout';
import { Seo } from '@/components/Seo';
import { Link } from 'react-router-dom';
import { hotels } from '@/data/seed';
import { naira } from '@/lib/format';
import { Star, MapPin, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Search } from 'lucide-react';

const Hotels = () => {
  return (
    <Layout>
    <Seo
      title="Book Hotels & Short Stays in Nigeria — Home-let"
      description="Compare hotel rooms and short-stay accommodation across Nigeria with escrow-protected booking on Home-let."
      path="/hotels"
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Hotels and short stays in Nigeria',
        itemListElement: hotels.map((h, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Hotel',
            name: h.name,
            image: h.image,
            address: {
              '@type': 'PostalAddress',
              streetAddress: h.location,
              addressLocality: h.city,
              addressCountry: 'NG',
            },
            aggregateRating: { '@type': 'AggregateRating', ratingValue: h.rating, ratingCount: 1 },
            priceRange: `NGN ${h.pricePerNight} per night`,
          },
        })),
      }}
    />
      <section className="gradient-hero text-primary-foreground py-16">
        <div className="container">
          <h1 className="text-4xl font-bold mb-2">Hotels & short-let stays</h1>
          <p className="text-white/80 mb-6">Book vetted hotels and serviced apartments across Nigeria.</p>
          <div className="bg-card text-foreground rounded-2xl p-3 flex flex-col md:flex-row gap-2 shadow-elegant max-w-3xl">
            <div className="flex-1 flex items-center gap-2 px-3"><Search className="h-4 w-4 text-muted-foreground" /><Input placeholder="City, hotel..." className="border-0 focus-visible:ring-0 px-0" /></div>
            <div className="flex-1 flex items-center gap-2 px-3 border-l"><Calendar className="h-4 w-4 text-muted-foreground" /><Input placeholder="Check-in" className="border-0 focus-visible:ring-0 px-0" /></div>
            <div className="flex-1 flex items-center gap-2 px-3 border-l"><Calendar className="h-4 w-4 text-muted-foreground" /><Input placeholder="Check-out" className="border-0 focus-visible:ring-0 px-0" /></div>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">Search</Button>
          </div>
        </div>
      </section>

      <div className="container py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((h) => (
          <Link to={`/booking/${h.id}`} key={h.id} className="rounded-2xl overflow-hidden bg-card border shadow-soft hover:shadow-elegant transition-all group">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              <img src={h.image} alt={h.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{h.name}</h3>
                <span className="flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-accent text-accent" />{h.rating}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground gap-1 mb-3"><MapPin className="h-3 w-3" />{h.location}, {h.city}</div>
              <div className="flex flex-wrap gap-1 mb-4">
                {h.amenities.slice(0, 3).map((a) => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
              </div>
              <div className="flex items-baseline justify-between border-t pt-3">
                <div>
                  <div className="text-lg font-bold text-primary" style={{ fontFamily: 'Sora' }}>{naira(h.pricePerNight)}</div>
                  <div className="text-xs text-muted-foreground">per night</div>
                </div>
                <Button size="sm">Book</Button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
};

export default Hotels;
