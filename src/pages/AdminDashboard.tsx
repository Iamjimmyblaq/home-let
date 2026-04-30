import { Layout } from '@/components/Layout';
import { useApp } from '@/store/app';
import { Navigate } from 'react-router-dom';
import { properties, agents } from '@/data/seed';
import { Building2, Users, ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { naira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminDashboard = () => {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" />;

  const pendingAgents = agents.filter((a) => !a.verified);
  const flaggedListings = properties.filter((p) => !p.verified);

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-1">Admin Console</h1>
        <p className="text-muted-foreground mb-8">Platform-wide moderation, KYC and analytics.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Total users', v: '12,482', color: 'text-primary bg-primary/10' },
            { icon: Building2, label: 'Active listings', v: properties.length * 670, color: 'text-success bg-success/10' },
            { icon: ShieldCheck, label: 'Escrow held', v: naira(2_140_000_000), color: 'text-accent bg-accent/20' },
            { icon: AlertTriangle, label: 'Open disputes', v: 7, color: 'text-destructive bg-destructive/10' },
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
            <TabsTrigger value="agents">KYC queue</TabsTrigger>
            <TabsTrigger value="listings">Flagged listings</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="agents" className="mt-4">
            <div className="bg-card border rounded-2xl overflow-hidden">
              {pendingAgents.length ? pendingAgents.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-4 border-b last:border-0">
                  <img src={a.avatar} className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.agency} · {a.phone}</div>
                  </div>
                  <Button variant="outline" size="sm">Review docs</Button>
                  <Button size="sm">Approve</Button>
                </div>
              )) : <div className="p-6 text-center text-muted-foreground">All agents verified ✓</div>}
            </div>
          </TabsContent>
          <TabsContent value="listings" className="mt-4">
            <div className="bg-card border rounded-2xl overflow-hidden">
              {flaggedListings.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-4 border-b last:border-0">
                  <img src={p.image} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.location}</div>
                  </div>
                  <Badge variant="destructive">Unverified</Badge>
                  <Button size="sm" variant="outline">Inspect</Button>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="disputes" className="mt-4">
            <div className="bg-card border rounded-2xl p-6 text-center text-muted-foreground">No open disputes 🎉</div>
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <div className="bg-card border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-success" /><span className="font-semibold">Platform GMV (30d)</span></div>
              <div className="text-4xl font-bold text-primary mb-1" style={{ fontFamily: 'Sora' }}>{naira(840_000_000)}</div>
              <div className="text-sm text-muted-foreground">+24% MoM</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
