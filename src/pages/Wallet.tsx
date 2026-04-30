import { Layout } from '@/components/Layout';
import { useApp } from '@/store/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { naira } from '@/lib/format';
import { Wallet as WalletIcon, ShieldCheck, ArrowDown, ArrowUp, Plus, CreditCard, Smartphone } from 'lucide-react';
import { seedTransactions } from '@/data/seed';
import { useState } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Wallet = () => {
  const { walletBalance, escrowBalance, fundWallet, user } = useApp();
  const [amt, setAmt] = useState('50000');

  if (!user) return <Layout><div className="container py-20 text-center">Please sign in to access your wallet.</div></Layout>;

  const fund = () => {
    const n = Number(amt);
    if (!n || n <= 0) return;
    fundWallet(n);
    toast.success(`Wallet funded with ${naira(n)}`);
  };

  return (
    <Layout>
      <div className="container py-10 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Wallet & Escrow</h1>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 rounded-2xl gradient-hero text-primary-foreground p-8 shadow-elegant relative overflow-hidden">
            <WalletIcon className="absolute right-6 top-6 h-8 w-8 opacity-30" />
            <div className="text-white/70 text-sm">Available balance</div>
            <div className="text-4xl font-bold my-2" style={{ fontFamily: 'Sora' }}>{naira(walletBalance)}</div>
            <div className="text-xs text-white/70">Home-let Wallet · NGN</div>
          </div>
          <div className="bg-card border rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><ShieldCheck className="h-4 w-4 text-success" /> In escrow</div>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Sora' }}>{naira(escrowBalance)}</div>
            <div className="text-xs text-muted-foreground mt-2">Held until you confirm transactions.</div>
          </div>
        </div>

        <Tabs defaultValue="fund">
          <TabsList>
            <TabsTrigger value="fund">Fund wallet</TabsTrigger>
            <TabsTrigger value="history">Transaction history</TabsTrigger>
          </TabsList>
          <TabsContent value="fund" className="bg-card border rounded-2xl p-6 mt-4">
            <h3 className="font-semibold mb-4">Add funds</h3>
            <div className="flex gap-2 mb-4">
              {[10000, 50000, 100000, 250000].map((v) => (
                <Button key={v} variant="outline" size="sm" onClick={() => setAmt(String(v))}>{naira(v)}</Button>
              ))}
            </div>
            <Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} className="mb-4 text-lg" />
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <button className="p-4 border-2 border-primary rounded-xl text-left flex items-center gap-3"><CreditCard className="h-5 w-5 text-primary" /><div><div className="font-medium text-sm">Card</div><div className="text-xs text-muted-foreground">Visa, Master, Verve</div></div></button>
              <button className="p-4 border-2 rounded-xl text-left flex items-center gap-3"><Smartphone className="h-5 w-5" /><div><div className="font-medium text-sm">Bank transfer</div><div className="text-xs text-muted-foreground">Paystack / Flutterwave</div></div></button>
            </div>
            <Button size="lg" className="w-full" onClick={fund}><Plus className="h-4 w-4" /> Fund {naira(Number(amt) || 0)}</Button>
          </TabsContent>
          <TabsContent value="history" className="bg-card border rounded-2xl p-6 mt-4">
            <div className="space-y-3">
              {seedTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${t.type === 'fund' ? 'bg-success/10 text-success' : t.type === 'escrow' ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'}`}>
                      {t.type === 'fund' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t.desc}</div>
                      <div className="text-xs text-muted-foreground">{t.date} · {t.status}</div>
                    </div>
                  </div>
                  <div className="font-semibold">{naira(t.amount)}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Wallet;
