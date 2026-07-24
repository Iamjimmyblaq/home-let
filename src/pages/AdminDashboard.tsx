import { Layout } from '@/components/Layout';
import { Building2, Users, ShieldCheck, AlertTriangle, TrendingUp, Check, X, FileText, UserCog, Eye, Star, Rocket } from 'lucide-react';
import { naira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';
import { StaffDisputesPanel } from '@/components/Disputes';
import { useAuth } from '@/contexts/AuthContext';

type Pending = any;

const KycDocLink = ({ path }: { path: string | null }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    supabase.storage.from('kyc-docs').createSignedUrl(path, 60 * 10).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path]);
  if (!path) return <span className="text-xs text-muted-foreground italic">no doc</span>;
  return (
    <a href={url ?? '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
      <FileText className="h-3 w-3" /> View doc
    </a>
  );
};

const RolesPanel = () => {
  const [q, setQ] = useState('');
  const [people, setPeople] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});

  const load = async () => {
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
    if (q.trim()) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,agency_name.ilike.%${q}%`);
    const { data } = await query;
    setPeople(data || []);
    const ids = (data || []).map((p) => p.user_id);
    if (ids.length) {
      const { data: rs } = await supabase.from('user_roles').select('user_id, role').in('user_id', ids);
      const map: Record<string, string[]> = {};
      (rs || []).forEach((r: any) => { (map[r.user_id] ||= []).push(r.role); });
      setRoles(map);
    } else setRoles({});
  };
  useEffect(() => { load(); }, []);

  const setRole = async (uid: string, role: 'user' | 'agent' | 'admin' | 'moderator') => {
    await supabase.from('user_roles').delete().eq('user_id', uid);
    const { error } = await supabase.from('user_roles').insert({ user_id: uid, role });
    if (error) { toast.error(error.message); return; }
    toast.success(`Role set to ${role}`);
    load();
  };

  return (
    <div className="bg-card border rounded-2xl p-4">
      <div className="flex gap-2 mb-4">
        <Input placeholder="Search by name, phone, agency…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <Button variant="outline" onClick={load}>Search</Button>
      </div>
      <div className="divide-y">
        {people.map((p) => {
          const current = (roles[p.user_id]?.[0]) || 'user';
          return (
            <div key={p.id} className="flex items-center gap-3 py-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">{(p.full_name || '?').charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.full_name || 'Unnamed'} {p.username && <span className="text-xs text-muted-foreground font-normal">@{p.username}</span>}</div>
                <div className="text-xs text-muted-foreground truncate">{p.agency_name || 'Independent'} · KYC {p.kyc_status}</div>
              </div>
              <Badge variant="outline" className="capitalize">{current}</Badge>
              <Select defaultValue={current} onValueChange={(v) => setRole(p.user_id, v as any)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="agent">agent</SelectItem>
                  <SelectItem value="moderator">moderator</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        })}
        {people.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No profiles found.</div>}
      </div>
    </div>
  );
};

const UsersListDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [people, setPeople] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500);
    setPeople(data || []);
  };
  useEffect(() => { if (open) load(); }, [open]);
  const filtered = people.filter((p) =>
    !q.trim() ? true : ((p.full_name || '') + (p.username || '') + (p.phone || '') + (p.agency_name || '')).toLowerCase().includes(q.toLowerCase())
  );
  const doAction = async (uid: string, action: 'suspend' | 'unsuspend' | 'delete', label: string) => {
    if (action === 'delete' && !confirm('Permanently delete this user and every trace of their data? This cannot be undone.')) return;
    if (action === 'suspend' && !confirm('Suspend this user? They will not be able to sign in until you unsuspend them.')) return;
    setBusyId(uid);
    const { data, error } = await supabase.functions.invoke('admin-user-action', { body: { action, target_user_id: uid } });
    setBusyId(null);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || 'Failed'); return; }
    toast.success(label);
    load();
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>All users ({people.length})</DialogTitle></DialogHeader>
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" />
        <div className="divide-y">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2.5 flex-wrap">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">{(p.full_name || '?').charAt(0)}</div>
              <div className="flex-1 min-w-[180px]">
                <div className="text-sm font-medium truncate flex items-center gap-1">
                  {p.full_name || 'Unnamed'}
                  {p.kyc_status === 'verified' && <ShieldCheck className="h-3.5 w-3.5 text-success" />}
                  {p.username && <span className="text-xs text-muted-foreground font-normal">@{p.username}</span>}
                </div>
                <div className="text-xs text-muted-foreground truncate">{p.agency_name || '—'} · {p.phone || 'no phone'} · KYC {p.kyc_status}</div>
              </div>
              <Badge variant="outline" className="capitalize text-xs">{p.kyc_status}</Badge>
              <Button size="sm" variant="outline" disabled={busyId === p.user_id} onClick={() => doAction(p.user_id, 'suspend', 'User suspended')}>Suspend</Button>
              <Button size="sm" variant="ghost" disabled={busyId === p.user_id} onClick={() => doAction(p.user_id, 'unsuspend', 'User unsuspended')}>Unsuspend</Button>
              <Button size="sm" variant="destructive" disabled={busyId === p.user_id} onClick={() => doAction(p.user_id, 'delete', 'User deleted')}>Delete</Button>
            </div>
          ))}
          {filtered.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No matches.</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BoostQueue = ({ onChange }: { onChange: () => void }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const load = async () => {
    const { data } = await supabase.from('listings').select('*').eq('boost_status', 'pending').order('boost_requested_at', { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);
  const approve = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc('approve_boost', { _listing_id: id });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Boost approved — fee deducted from agent wallet');
    load(); onChange();
  };
  const reject = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc('reject_boost', { _listing_id: id });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Boost request rejected');
    load(); onChange();
  };
  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      {rows.length === 0 ? <div className="p-6 text-center text-muted-foreground">No pending boost requests.</div> : rows.map((p) => (
        <div key={p.id} className="flex items-center gap-4 p-4 border-b last:border-0">
          <Rocket className="h-5 w-5 text-accent" />
          <div className="flex-1">
            <div className="font-medium text-sm">{p.title}</div>
            <div className="text-xs text-muted-foreground">{p.location} · {p.boost_days} days · {naira(Number(p.boost_fee || 0))}</div>
          </div>
          <Link to={`/property/${p.id}`} target="_blank" className="text-xs text-primary inline-flex items-center gap-1 hover:underline"><Eye className="h-3.5 w-3.5" /> View</Link>
          <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => reject(p.id)}><X className="h-4 w-4" />Reject</Button>
          <Button size="sm" disabled={busy === p.id} onClick={() => approve(p.id)}><Check className="h-4 w-4" />Approve & charge</Button>
        </div>
      ))}
    </div>
  );
};

const FeaturedPanel = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const load = async () => {
    let query = supabase.from('listings').select('*').eq('status', 'verified').order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(100);
    const { data } = await query;
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);
  const toggle = async (id: string, next: boolean) => {
    const { error } = await supabase.from('listings').update({ featured: next } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? 'Promoted to featured' : 'Removed from featured');
    load();
  };
  const filtered = rows.filter((r) => !q.trim() ? true : (r.title + r.location).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="bg-card border rounded-2xl p-4">
      <Input placeholder="Search verified listings…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" />
      <div className="divide-y">
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center gap-3 py-3">
            <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'} className="h-12 w-12 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate flex items-center gap-2">{p.title} {p.featured && <Star className="h-3.5 w-3.5 fill-accent text-accent" />}</div>
              <div className="text-xs text-muted-foreground truncate">{p.location} · {p.type} · {naira(Number(p.price))}</div>
            </div>
            <Button size="sm" variant={p.featured ? 'outline' : 'default'} onClick={() => toggle(p.id, !p.featured)}>
              {p.featured ? 'Unfeature' : 'Promote to top'}
            </Button>
          </div>
        ))}
        {filtered.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No listings.</div>}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { role } = useAuth();
  const isModerator = role === 'moderator';
  const [agents, setAgents] = useState<Pending[]>([]);
  const [listings, setListings] = useState<Pending[]>([]);
  const [stats, setStats] = useState({ users: 0, listings: 0, escrow: 0, boostPending: 0 });
  const [usersOpen, setUsersOpen] = useState(false);

  const load = async () => {
    const [{ data: a }, { data: l }, { count: uCount }, { count: lCount }, { data: w }, { count: bCount }] = await Promise.all([
      supabase.from('profiles').select('*').in('kyc_status', ['pending']).order('updated_at', { ascending: false }),
      supabase.from('listings').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }),
      supabase.from('wallets').select('escrow_balance'),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('boost_status', 'pending'),
    ]);
    setAgents((a as any) || []);
    setListings((l as any) || []);
    setStats({
      users: uCount || 0,
      listings: lCount || 0,
      escrow: (w || []).reduce((s: number, x: any) => s + Number(x.escrow_balance || 0), 0),
      boostPending: bCount || 0,
    });
  };
  useEffect(() => { if (!isModerator) load(); }, [isModerator]);

  if (isModerator) {
    return (
      <Layout>
        <div className="container py-10">
          
          <h1 className="text-3xl font-bold mb-1">Moderator Console</h1>
          <p className="text-muted-foreground mb-8">Resolve open disputes between users and agents.</p>
          <StaffDisputesPanel role="moderator" />
        </div>
      </Layout>
    );
  }

  const decideAgent = async (id: string, ok: boolean) => {
    await supabase.from('profiles').update({ kyc_status: ok ? 'verified' : 'rejected' }).eq('id', id);
    toast.success(ok ? 'Agent verified' : 'Agent rejected');
    load();
  };

  const decideListing = async (id: string, ok: boolean) => {
    await supabase.from('listings').update({ status: ok ? 'verified' : 'rejected' }).eq('id', id);
    toast.success(ok ? 'Listing approved' : 'Listing rejected');
    load();
  };

  const cards = [
    { icon: Users, label: 'Total users', v: stats.users.toLocaleString(), color: 'text-primary bg-primary/10', onClick: () => setUsersOpen(true) },
    { icon: Building2, label: 'Active listings', v: stats.listings.toLocaleString(), color: 'text-success bg-success/10' },
    { icon: ShieldCheck, label: 'Escrow held', v: naira(stats.escrow), color: 'text-accent bg-accent/20' },
    { icon: AlertTriangle, label: 'Pending KYC', v: agents.length, color: 'text-destructive bg-destructive/10' },
  ];

  return (
    <Layout>
      <div className="container py-10">
        
        <h1 className="text-3xl font-bold mb-1">Admin Console</h1>
        <p className="text-muted-foreground mb-8">Platform-wide moderation, KYC and analytics.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((s) => (
            <button key={s.label} type="button" onClick={s.onClick} disabled={!s.onClick}
              className={`bg-card border rounded-2xl p-5 shadow-soft text-left ${s.onClick ? 'hover:shadow-elegant transition-all cursor-pointer' : 'cursor-default'}`}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'Sora' }}>{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </button>
          ))}
        </div>

        <UsersListDialog open={usersOpen} onClose={() => setUsersOpen(false)} />

        <Tabs defaultValue="agents">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="agents">KYC queue ({agents.length})</TabsTrigger>
            <TabsTrigger value="listings">Pending listings ({listings.length})</TabsTrigger>
            <TabsTrigger value="boosts"><Rocket className="h-4 w-4 mr-1" />Boost queue ({stats.boostPending})</TabsTrigger>
            <TabsTrigger value="featured"><Star className="h-4 w-4 mr-1" />Featured</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="roles"><UserCog className="h-4 w-4 mr-1" />Roles</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="agents" className="mt-4">
            <div className="bg-card border rounded-2xl overflow-hidden">
              {agents.length === 0 ? <div className="p-6 text-center text-muted-foreground">No KYC submissions pending ✓</div> : agents.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-4 border-b last:border-0">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">{(a.full_name || '?').charAt(0)}</div>
                  <div className="flex-1">
                    <div className="font-medium">{a.full_name}</div>
                    <div className="text-xs text-muted-foreground">{a.agency_name || 'Independent'} · {a.phone || 'No phone'}</div>
                    <KycDocLink path={a.kyc_doc_url} />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => decideAgent(a.id, false)}><X className="h-4 w-4" />Reject</Button>
                  <Button size="sm" onClick={() => decideAgent(a.id, true)}><Check className="h-4 w-4" />Approve</Button>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="listings" className="mt-4">
            <div className="bg-card border rounded-2xl overflow-hidden">
              {listings.length === 0 ? <div className="p-6 text-center text-muted-foreground">No listings awaiting review</div> : listings.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-4 border-b last:border-0">
                  <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.location} · {p.type} · {naira(Number(p.price))}</div>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                  <Link to={`/property/${p.id}`} target="_blank" className="inline-flex"><Button size="sm" variant="outline"><Eye className="h-4 w-4" />View</Button></Link>
                  <Button variant="outline" size="sm" onClick={() => decideListing(p.id, false)}><X className="h-4 w-4" />Reject</Button>
                  <Button size="sm" onClick={() => decideListing(p.id, true)}><Check className="h-4 w-4" />Approve</Button>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="boosts" className="mt-4"><BoostQueue onChange={load} /></TabsContent>
          <TabsContent value="featured" className="mt-4"><FeaturedPanel /></TabsContent>
          <TabsContent value="disputes" className="mt-4"><StaffDisputesPanel role="admin" /></TabsContent>
          <TabsContent value="roles" className="mt-4"><RolesPanel /></TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <div className="bg-card border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-success" /><span className="font-semibold">Total escrow protected</span></div>
              <div className="text-4xl font-bold text-primary mb-1" style={{ fontFamily: 'Sora' }}>{naira(stats.escrow)}</div>
              <div className="text-sm text-muted-foreground">Across {stats.users.toLocaleString()} users</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};


export default AdminDashboard;
