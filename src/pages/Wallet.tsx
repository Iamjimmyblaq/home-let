import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { naira } from '@/lib/format';
import { Wallet as WalletIcon, ShieldCheck, ArrowDown, ArrowUp, Plus, CreditCard, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/BackButton';
import { WithdrawPanel } from '@/components/WithdrawPanel';
import { MyDisputesList } from '@/components/Disputes';

type Txn = { id: string; type: string; amount: number; description: string | null; created_at: string };

const Wallet = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { wallet, reload } = useWallet();
  const canFund = role === 'user' || role === 'admin' || !role;
  const [amt, setAmt] = useState('50000');
  const [txns, setTxns] = useState<Txn[]>([]);
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    if (!user) return;
    supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setTxns((data as any) || []));
  }, [user, wallet.available_balance, wallet.escrow_balance]);

  // Verify Paystack on return
  useEffect(() => {
    const reference = params.get('reference') || params.get('trxref');
    if (!reference || !user) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke('paystack-verify', { body: { reference } });
      if (error || (data as any)?.error) toast.error((data as any)?.error || error?.message || 'Verification failed');
      else {
        toast.success((data as any)?.already ? 'Payment already credited' : `Wallet funded with ${naira((data as any).amount)}`);
        await reload();
      }
      params.delete('reference'); params.delete('trxref');
      setParams(params, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading) return <Layout><div className="container py-20 text-center">Loading…</div></Layout>;
  if (!user) return <Layout><div className="container py-20 text-center">Please sign in to access your wallet.</div></Layout>;

  const handleFund = async () => {
    const n = Number(amt);
    if (!n || n < 100) { toast.error('Minimum ₦100'); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: { amount: n, callback_url: `${window.location.origin}/wallet` },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      window.location.href = (data as any).authorization_url;
    } catch (e: any) {
      toast.error(e.message || 'Could not start payment');
      setBusy(false);
    }
  };

  const labelOf = (t: string) => t === 'fund' ? 'Top-up' : t === 'escrow_hold' ? 'Held in escrow' : t === 'escrow_release' ? 'Released' : t === 'refund' ? 'Refund' : 'Payout';

  return (
    <Layout>
      <div className="container py-10 max-w-5xl">
        <BackButton />
        <h1 className="text-3xl font-bold mb-6">Wallet & Escrow</h1>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 rounded-2xl gradient-hero text-primary-foreground p-8 shadow-elegant relative overflow-hidden">
            <WalletIcon className="absolute right-6 top-6 h-8 w-8 opacity-30" />
            <div className="text-white/70 text-sm">Available balance</div>
            <div className="text-4xl font-bold my-2" style={{ fontFamily: 'Sora' }}>{naira(wallet.available_balance)}</div>
            <div className="text-xs text-white/70">Home-let Wallet · NGN</div>
          </div>
          <div className="bg-card border rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><ShieldCheck className="h-4 w-4 text-success" /> In escrow</div>
            <div className="text-2xl font-bold" style={{ fontFamily: 'Sora' }}>{naira(wallet.escrow_balance)}</div>
            <div className="text-xs text-muted-foreground mt-2">Held until you confirm transactions.</div>
          </div>
        </div>

        <Tabs defaultValue={canFund ? 'fund' : 'withdraw'}>
          <TabsList>
            {canFund && <TabsTrigger value="fund">Fund wallet</TabsTrigger>}
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="history">Transactions</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>
          {canFund && (
            <TabsContent value="fund" className="bg-card border rounded-2xl p-6 mt-4">
              <h3 className="font-semibold mb-4">Add funds</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {[10000, 50000, 100000, 250000].map((v) => (
                  <Button key={v} variant="outline" size="sm" onClick={() => setAmt(String(v))}>{naira(v)}</Button>
                ))}
              </div>
              <Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} className="mb-4 text-lg" />
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <button className="p-4 border-2 border-primary rounded-xl text-left flex items-center gap-3"><CreditCard className="h-5 w-5 text-primary" /><div><div className="font-medium text-sm">Card</div><div className="text-xs text-muted-foreground">Visa, Master, Verve</div></div></button>
                <button className="p-4 border-2 rounded-xl text-left flex items-center gap-3"><Smartphone className="h-5 w-5" /><div><div className="font-medium text-sm">Bank transfer</div><div className="text-xs text-muted-foreground">Paystack / Flutterwave</div></div></button>
              </div>
              <Button size="lg" className="w-full" onClick={handleFund} disabled={busy}><Plus className="h-4 w-4" /> {busy ? 'Redirecting to Paystack…' : `Fund ${naira(Number(amt) || 0)} via Paystack`}</Button>
            </TabsContent>
          )}
          <TabsContent value="withdraw" className="mt-4"><WithdrawPanel /></TabsContent>
          <TabsContent value="disputes" className="bg-card border rounded-2xl p-6 mt-4"><MyDisputesList /></TabsContent>
          <TabsContent value="history" className="bg-card border rounded-2xl p-6 mt-4">
            <div className="space-y-3">
              {txns.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No transactions yet.</p>}
              {txns.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${t.type === 'fund' ? 'bg-success/10 text-success' : t.type === 'escrow_hold' ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'}`}>
                      {t.type === 'fund' || t.type === 'escrow_release' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t.description || labelOf(t.type)}</div>
                      <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()} · {labelOf(t.type)}</div>
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
