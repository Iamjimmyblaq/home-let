import { Layout } from '@/components/Layout';
import { Link } from 'react-router-dom';
import { PropertyCard } from '@/components/PropertyCard';
import { Calendar, CheckCircle2, Heart, Wallet, MessageSquare, Eye, ShieldCheck } from 'lucide-react';
import { naira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useFavorites } from '@/hooks/useFavorites';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useListings } from '@/hooks/useListings';
import { BackButton } from '@/components/BackButton';
import { RaiseDisputeButton } from '@/components/Disputes';
import { toast } from 'sonner';

type InspectionRow = { id: string; listing_id: string; mode: string; scheduled_at: string; status: string; agent_id: string; fee: number };
type BookingRow = { id: string; listing_id: string | null; hotel_ref: string | null; check_in: string; check_out: string; status: string; total_amount: number };

const UserDashboard = () => {
  const { user, profile } = useAuth();
  const { wallet, reload } = useWallet();
  const { favorites } = useFavorites();
  const { items } = useListings();
  const [inspections, setInspections] = useState<InspectionRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: ins }, { data: bk }] = await Promise.all([
        supabase.from('inspections').select('id,listing_id,mode,scheduled_at,status,agent_id,fee').eq('user_id', user.id).order('scheduled_at', { ascending: true }),
        supabase.from('bookings').select('id,listing_id,hotel_ref,check_in,check_out,status,total_amount').eq('user_id', user.id).order('check_in', { ascending: true }),
      ]);
      setInspections((ins as any) || []);
      setBookings((bk as any) || []);
    })();
  }, [user]);

  const favs = useMemo(() => items.filter((p) => favorites.includes(p.id)), [items, favorites]);
  const titleOf = (lid: string) => items.find((i) => i.id === lid)?.title || 'Property';

  const releaseInspection = async (id: string) => {
    const { data, error } = await supabase.functions.invoke('inspection-settle', { body: { inspection_id: id } });
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || 'Could not release funds'); return; }
    toast.success('Inspection confirmed — funds released.');
    setInspections((prev) => prev.map((i) => i.id === id ? { ...i, status: 'settled' } : i));
    reload();
  };

  return (
    <Layout>
      <div className="container py-10">
        <BackButton to="/" label="Home" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || user?.email} 👋</h1>
          <p className="text-muted-foreground">Here's what's happening on your account.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Wallet, label: 'Wallet', v: naira(wallet.available_balance), href: '/wallet', color: 'text-primary bg-primary/10' },
            { icon: ShieldCheck, label: 'In escrow', v: naira(wallet.escrow_balance), href: '/wallet', color: 'text-success bg-success/10' },
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
            {inspections.length === 0 && <p className="text-sm text-muted-foreground">No inspections yet.</p>}
            {inspections.map((i) => (
              <div key={i.id} className="flex items-center gap-4 p-3 border rounded-xl mb-3 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <div className="font-medium text-sm">{titleOf(i.listing_id)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(i.scheduled_at).toLocaleString()} · {i.mode} · {naira(i.fee)}</div>
                </div>
                <Badge className={i.status === 'confirmed' ? 'bg-success text-success-foreground' : 'bg-accent text-accent-foreground'}>{i.status}</Badge>
                {i.status === 'completed' && <Button size="sm" onClick={() => releaseInspection(i.id)}><CheckCircle2 className="h-4 w-4" /> Release funds</Button>}
                {(i.status === 'completed' || i.status === 'confirmed' || i.status === 'cancelled') && <RaiseDisputeButton inspectionId={i.id} againstUser={i.agent_id} amount={i.fee} />}
              </div>
            ))}
            {bookings.length > 0 && (
              <>
                <h3 className="font-semibold mt-6 mb-2 text-sm">Bookings</h3>
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center gap-4 p-3 border rounded-xl mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{b.listing_id ? titleOf(b.listing_id) : (b.hotel_ref || 'Stay')}</div>
                      <div className="text-xs text-muted-foreground">{b.check_in} → {b.check_out}</div>
                    </div>
                    <div className="text-sm font-semibold">{naira(b.total_amount)}</div>
                    <Badge variant="secondary">{b.status}</Badge>
                  </div>
                ))}
              </>
            )}
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
