import { Layout } from '@/components/Layout';
import { Building2, Users, ShieldCheck, AlertTriangle, TrendingUp, Check, X, FileText, UserCog } from 'lucide-react';
import { naira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';
import { StaffDisputesPanel } from '@/components/Disputes';

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
                <div className="text-sm font-medium truncate">{p.full_name || 'Unnamed'}</div>
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

const AdminDashboard = () => {
  const [agents, setAgents] = useState<Pending[]>([]);
  const [listings, setListings] = useState<Pending[]>([]);
  const [stats, setStats] = useState({ users: 0, listings: 0, escrow: 0 });

  const load = async () => {
    const [{ data: a }, { data: l }, { count: uCount }, { count: lCount }, { data: w }] = await Promise.all([
      supabase.from('profiles').select('*').in('kyc_status', ['pending']).order('updated_at', { ascending: false }),
      supabase.from('listings').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }),
      supabase.from('wallets').select('escrow_balance'),
    ]);
    setAgents((a as any) || []);
    setListings((l as any) || []);
    setStats({
      users: uCount || 0,
      listings: lCount || 0,
      escrow: (w || []).reduce((s: number, x: any) => s + Number(x.escrow_balance || 0), 0),
    });
  };
  useEffect(() => { load(); }, []);

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

  return (
    <Layout>
      <div className="container py-10">
        <BackButton to="/" label="Home" />
        <h1 className="text-3xl font-bold mb-1">Admin Console</h1>
        <p className="text-muted-foreground mb-8">Platform-wide moderation, KYC and analytics.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Total users', v: stats.users.toLocaleString(), color: 'text-primary bg-primary/10' },
            { icon: Building2, label: 'Active listings', v: stats.listings.toLocaleString(), color: 'text-success bg-success/10' },
            { icon: ShieldCheck, label: 'Escrow held', v: naira(stats.escrow), color: 'text-accent bg-accent/20' },
            { icon: AlertTriangle, label: 'Pending KYC', v: agents.length, color: 'text-destructive bg-destructive/10' },
          ].map((s) => (
            <div key={s.label} className="bg-card border rounded-2xl p-5 shadow-soft">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'Sora' }}>{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="agents">
          <TabsList>
            <TabsTrigger value="agents">KYC queue ({agents.length})</TabsTrigger>
            <TabsTrigger value="listings">Pending listings ({listings.length})</TabsTrigger>
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
                  <Button variant="outline" size="sm" onClick={() => decideListing(p.id, false)}><X className="h-4 w-4" />Reject</Button>
                  <Button size="sm" onClick={() => decideListing(p.id, true)}><Check className="h-4 w-4" />Approve</Button>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="disputes" className="mt-4"><StaffDisputesPanel /></TabsContent>
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
