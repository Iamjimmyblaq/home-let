import { Layout } from '@/components/Layout';
import { Link } from 'react-router-dom';
import { PropertyCard } from '@/components/PropertyCard';
import { Calendar, CheckCircle2, Heart, Wallet, MessageSquare, Eye, ShieldCheck, Users, Trash2, Star } from 'lucide-react';
import { naira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useFavorites } from '@/hooks/useFavorites';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useListings } from '@/hooks/useListings';
import { RaiseDisputeButton } from '@/components/Disputes';
import { toast } from 'sonner';

type InspectionRow = { id: string; listing_id: string; mode: string; scheduled_at: string; status: string; agent_id: string; fee: number };
type BookingRow = { id: string; listing_id: string | null; hotel_ref: string | null; check_in: string; check_out: string; status: string; total_amount: number };
type AgentDir = { user_id: string; name: string; agency: string; avatar: string; verified: boolean; rating: number; listings: number };

const useAgentsDirectory = () => {
  const [items, setItems] = useState<AgentDir[]>([]);
  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'agent');
      const ids = (roles || []).map((r: any) => r.user_id);
      if (!ids.length) return;
      const [{ data: profs }, { data: lst }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, username, agency_name, avatar_url, kyc_status, agent_rating').in('user_id', ids),
        supabase.from('listings').select('agent_id, status').in('agent_id', ids),
      ]);
      const counts: Record<string, number> = {};
      (lst || []).forEach((l: any) => { if (l.status === 'verified') counts[l.agent_id] = (counts[l.agent_id] || 0) + 1; });
      const rows: AgentDir[] = (profs || []).map((p: any) => ({
        user_id: p.user_id,
        name: p.full_name || p.username || 'Agent',
        agency: p.agency_name || 'Independent',
        avatar: p.avatar_url && /^https?:/.test(p.avatar_url) ? p.avatar_url : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.full_name || 'A')}`,
        verified: p.kyc_status === 'verified',
        rating: Number(p.agent_rating || 4.6),
        listings: counts[p.user_id] || 0,
      }));
      rows.sort((a, b) => Number(b.verified) - Number(a.verified) || b.listings - a.listings);
      setItems(rows);
    })();
  }, []);
  return items;
};

const DeleteAccountButton = () => {
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const onDelete = async () => {
    if (!confirm('This will permanently delete your account and every trace of your data. Continue?')) return;
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('admin-user-action', { body: { action: 'delete_self' } });
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || 'Delete failed'); setBusy(false); return; }
    toast.success('Account deleted. Goodbye.');
    await signOut();
    window.location.href = '/';
  };
  return (
    <Button variant="destructive" size="sm" disabled={busy} onClick={onDelete}>
      <Trash2 className="h-4 w-4" /> {busy ? 'Deleting…' : 'Delete my account'}
    </Button>
  );
};

const UserDashboard = () => {
  const { user, profile } = useAuth();
  const { wallet, reload } = useWallet();
  const { favorites } = useFavorites();
  const { items } = useListings();
  const [inspections, setInspections] = useState<InspectionRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const agents = useAgentsDirectory();

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

        <div className="mb-10">
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-bold text-xl flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />Latest verified listings</h2>
            <Link to="/listings" className="text-sm text-primary hover:underline">Browse all →</Link>
          </div>
          {items.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{items.slice(0, 8).map((p) => <PropertyCard key={p.id} p={p} />)}</div>
          ) : (
            <div className="text-center text-muted-foreground py-10 border rounded-2xl border-dashed">No listings yet.</div>
          )}
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

        <div className="mt-10">
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-bold text-xl flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Top agents & landlords</h2>
            <Link to="/agents" className="text-sm text-primary hover:underline">See all →</Link>
          </div>
          {agents.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 border rounded-2xl border-dashed">No agents yet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {agents.slice(0, 8).map((a) => (
                <Link key={a.user_id} to={`/agent-profile/${a.user_id}`} className="bg-card border rounded-2xl p-4 shadow-soft hover:shadow-elegant transition-all flex items-center gap-3">
                  <img src={a.avatar} alt={a.name} className="h-12 w-12 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate flex items-center gap-1">{a.name}{a.verified && <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.agency}</div>
                    <div className="flex items-center gap-2 text-xs mt-1 text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-accent text-accent" />{a.rating.toFixed(1)}</span>
                      <span>·</span><span>{a.listings} listing{a.listings === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 border-t pt-8">
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-sm">Danger zone</div>
              <div className="text-xs text-muted-foreground">Permanently delete your account and every trace of your data from Home-let.</div>
            </div>
            <DeleteAccountButton />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserDashboard;
