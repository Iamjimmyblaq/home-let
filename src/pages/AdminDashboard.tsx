import { Layout } from '@/components/Layout';
import { Building2, Users, ShieldCheck, AlertTriangle, TrendingUp, Check, X } from 'lucide-react';
import { naira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Pending = any;

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
