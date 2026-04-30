import { Layout } from '@/components/Layout';
import { useApp } from '@/store/app';
import { Link, Navigate } from 'react-router-dom';
import { properties } from '@/data/seed';
import { PropertyCard } from '@/components/PropertyCard';
import { Calendar, Heart, Wallet, MessageSquare, Eye, ShieldCheck } from 'lucide-react';
import { naira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const UserDashboard = () => {
  const { user, walletBalance, escrowBalance, favorites } = useApp();
  if (!user) return <Navigate to="/login" />;

  const favs = properties.filter((p) => favorites.includes(p.id));
  const inspections = [
    { id: 'i1', property: properties[0], date: '2026-05-04', time: '14:00', mode: 'Physical', status: 'Confirmed' },
    { id: 'i2', property: properties[2], date: '2026-05-08', time: '11:00', mode: 'Virtual', status: 'Pending' },
  ];

  return (
    <Layout>
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {user.name} 👋</h1>
          <p className="text-muted-foreground">Here's what's happening on your account.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Wallet, label: 'Wallet', v: naira(walletBalance), href: '/wallet', color: 'text-primary bg-primary/10' },
            { icon: ShieldCheck, label: 'In escrow', v: naira(escrowBalance), href: '/wallet', color: 'text-success bg-success/10' },
            { icon: Calendar, label: 'Inspections', v: inspections.length, href: '#', color: 'text-accent bg-accent/20' },
            { icon: Heart, label: 'Saved homes', v: favs.length, href: '/listings', color: 'text-destructive bg-destructive/10' },
          ].map((s) => (
            <Link to={s.href} key={s.label} className="bg-card border rounded-2xl p-5 shadow-soft hover:shadow-elegant transition-all">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'Sora' }}>{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Upcoming inspections</h2>
            {inspections.map((i) => (
              <div key={i.id} className="flex items-center gap-4 p-3 border rounded-xl mb-3">
                <img src={i.property.image} className="h-16 w-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{i.property.title}</div>
                  <div className="text-xs text-muted-foreground">{i.date} at {i.time} · {i.mode}</div>
                </div>
                <Badge className={i.status === 'Confirmed' ? 'bg-success text-success-foreground' : 'bg-accent text-accent-foreground'}>{i.status}</Badge>
              </div>
            ))}
          </div>
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />Quick actions</h2>
            <div className="flex flex-col gap-2">
              <Link to="/listings"><Button variant="outline" className="w-full justify-start"><Eye className="h-4 w-4" /> Browse listings</Button></Link>
              <Link to="/wallet"><Button variant="outline" className="w-full justify-start"><Wallet className="h-4 w-4" /> Top up wallet</Button></Link>
              <Link to="/chat"><Button variant="outline" className="w-full justify-start"><MessageSquare className="h-4 w-4" /> Open messages</Button></Link>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-destructive" />Saved homes</h2>
          {favs.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{favs.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
          ) : (
            <div className="text-center text-muted-foreground py-10 border rounded-2xl border-dashed">
              No saved homes yet. <Link to="/listings" className="text-primary font-medium">Browse listings</Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserDashboard;
