import { Layout } from '@/components/Layout';
import { useApp } from '@/store/app';
import { Link, Navigate } from 'react-router-dom';
import { properties } from '@/data/seed';
import { Building2, Calendar, Eye, Plus, TrendingUp, Wallet } from 'lucide-react';
import { naira, shortNaira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AgentDashboard = () => {
  const { user, walletBalance } = useApp();
  if (!user) return <Navigate to="/login" />;

  // pretend the agent owns first 4 listings
  const listings = properties.slice(0, 4);
  const inspections = [
    { id: 'i1', property: listings[0], client: 'Tomi A.', date: '2026-05-04 14:00', status: 'Confirmed' },
    { id: 'i2', property: listings[1], client: 'Jane K.', date: '2026-05-05 10:00', status: 'Pending' },
    { id: 'i3', property: listings[2], client: 'Femi O.', date: '2026-05-06 16:00', status: 'Confirmed' },
  ];

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agent dashboard</h1>
            <p className="text-muted-foreground">Manage listings, inspections and earnings.</p>
          </div>
          <Button size="lg"><Plus className="h-4 w-4" /> New listing</Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Building2, label: 'Active listings', v: listings.length, color: 'text-primary bg-primary/10' },
            { icon: Calendar, label: 'Pending inspections', v: 2, color: 'text-accent bg-accent/20' },
            { icon: Eye, label: 'Views (30d)', v: '1,284', color: 'text-success bg-success/10' },
            { icon: Wallet, label: 'Earnings', v: naira(walletBalance + 1_250_000), color: 'text-primary bg-primary/10' },
          ].map((s) => (
            <div key={s.label} className="bg-card border rounded-2xl p-5 shadow-soft">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'Sora' }}>{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="listings">
          <TabsList>
            <TabsTrigger value="listings">My listings</TabsTrigger>
            <TabsTrigger value="inspections">Inspection requests</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>
          <TabsContent value="listings" className="mt-4">
            <div className="bg-card border rounded-2xl overflow-hidden">
              {listings.map((p) => (
                <Link to={`/property/${p.id}`} key={p.id} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-secondary/30 transition-colors">
                  <img src={p.image} className="h-16 w-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.location} · {p.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{shortNaira(p.price)}</div>
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="inspections" className="mt-4">
            <div className="bg-card border rounded-2xl overflow-hidden">
              {inspections.map((i) => (
                <div key={i.id} className="flex items-center gap-4 p-4 border-b last:border-0">
                  <img src={i.property.image} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{i.property.title}</div>
                    <div className="text-xs text-muted-foreground">{i.client} · {i.date}</div>
                  </div>
                  <Badge className={i.status === 'Confirmed' ? 'bg-success text-success-foreground' : 'bg-accent text-accent-foreground'}>{i.status}</Badge>
                  {i.status === 'Pending' && <Button size="sm">Accept</Button>}
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="earnings" className="mt-4">
            <div className="bg-card border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-success" /><span className="font-semibold">Last 30 days</span></div>
              <div className="text-4xl font-bold text-primary mb-1" style={{ fontFamily: 'Sora' }}>{naira(1_250_000)}</div>
              <div className="text-sm text-muted-foreground">+18% vs previous period</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AgentDashboard;
