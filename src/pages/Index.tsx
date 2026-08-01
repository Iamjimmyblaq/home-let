import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShieldCheck, Wallet, Eye, Star, ArrowRight, Building2, KeyRound, Hotel, Trees, School } from 'lucide-react';
import { seedUnified } from '@/data/seedUnified';
import { PropertyCard } from '@/components/PropertyCard';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const featured = seedUnified.slice(0, 4);

  return (
    <Layout>
    <Seo
      title="Home-let — Rent, Buy & Short-let Homes in Nigeria"
      description="Find verified homes, short-lets, hotels, land and hostels across Nigeria. Escrow-protected payments and 360° virtual tours."
      path="/"
    />
      {/* HERO */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, hsl(41 96% 52% / 0.4), transparent 40%), radial-gradient(circle at 80% 60%, hsl(218 89% 52% / 0.5), transparent 50%)' }} />
        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-medium mb-6">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Escrow-protected · Verified agents
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] text-balance mb-6">
              Rent, buy or short-let homes in Nigeria — <span className="text-accent">without the wahala.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl">
              Tour properties in 360°, book physical inspections, and pay safely through Home-let escrow. No more agent runs without keys.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); navigate(`/listings?q=${encodeURIComponent(q)}`); }}
              className="bg-card text-foreground rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-elegant max-w-2xl"
            >
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="Try 'Lekki 3 bedroom', 'Banana Island', 'Abuja'..."
                  className="border-0 focus-visible:ring-0 px-0 h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold">
                Search
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 mt-4">
              {['Buy', 'Rent', 'Short-let', 'Hotels', 'Land', 'Hostel', 'Lagos', 'Abuja', 'Verified'].map((t) => (
                <button key={t} onClick={() => navigate(`/listings?q=${t}`)} className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* QUICK CATEGORIES */}
      <section className="container -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Building2, label: 'Buy a home', sub: '1,200+ homes', href: '/listings?type=sale' },
            { icon: KeyRound, label: 'Rent yearly', sub: '3,400+ flats', href: '/listings?type=rent' },
            { icon: Hotel, label: 'Short-let', sub: '850+ stays', href: '/listings?type=shortlet' },
            { icon: Hotel, label: 'Hotels', sub: '200+ partners', href: '/hotels' },
            { icon: Trees, label: 'Land', sub: 'Plots & acres', href: '/listings?type=land' },
            { icon: School, label: 'Hostels', sub: 'Student stays', href: '/listings?type=hostel' },
          ].map((c) => (
            <Link key={c.label} to={c.href} className="bg-card p-5 rounded-2xl border shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-all">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3"><c.icon className="h-5 w-5 text-primary" /></div>
              <div className="font-semibold">{c.label}</div>
              <div className="text-xs text-muted-foreground">{c.sub}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-1">Featured properties</h2>
            <p className="text-muted-foreground">Hand-picked by our verification team this week</p>
          </div>
          <Link to="/listings"><Button variant="ghost">View all <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-secondary/40 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">How Home-let works</h2>
            <p className="text-muted-foreground">Three simple steps from search to keys.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Eye, title: '1. Tour virtually', desc: 'Walk through every room in 360° before stepping out of your house.' },
              { icon: ShieldCheck, title: '2. Book inspection', desc: 'Pay a refundable deposit into escrow to lock a verified agent visit.' },
              { icon: Wallet, title: '3. Pay safely', desc: 'Funds are released only when you confirm — full escrow protection.' },
            ].map((s) => (
              <div key={s.title} className="bg-card p-8 rounded-2xl border shadow-soft">
                <div className="h-12 w-12 rounded-xl gradient-gold flex items-center justify-center mb-4 shadow-gold">
                  <s.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="container py-20">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          {[
            { n: '5,400+', l: 'Verified listings' },
            { n: '320+', l: 'KYC-verified agents' },
            { n: '₦2.1B', l: 'Protected via escrow' },
            { n: '4.8★', l: 'Avg user rating' },
          ].map((s) => (
            <div key={s.l} className="p-6">
              <div className="text-4xl font-bold text-primary" style={{ fontFamily: 'Sora' }}>{s.n}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="container pb-20">
        <div className="rounded-3xl gradient-hero text-primary-foreground p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, hsl(41 96% 52% / 0.5), transparent 50%)' }} />
          <div className="relative max-w-3xl">
            <div className="flex gap-1 mb-4">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-accent text-accent" />)}</div>
            <p className="text-2xl md:text-3xl font-medium mb-6 leading-snug">
              "I closed on my Lekki flat from London. Toured in 360°, paid via escrow, and my keys were waiting when I landed. Game changer."
            </p>
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop" alt="" className="h-12 w-12 rounded-full" />
              <div>
                <div className="font-semibold">Tomi A.</div>
                <div className="text-sm text-white/70">Diaspora buyer · London → Lagos</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
