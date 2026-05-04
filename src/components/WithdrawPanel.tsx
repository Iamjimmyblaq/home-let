import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { naira } from '@/lib/format';
import { toast } from 'sonner';
import { Banknote, Plus, Loader2 } from 'lucide-react';

type Bank = { name: string; code: string };
type Account = { id: string; bank_name: string; account_number: string; account_name: string; is_default: boolean };
type WD = { id: string; amount: number; status: string; created_at: string; failure_reason: string | null };

export const WithdrawPanel = () => {
  const { user } = useAuth();
  const { wallet, reload } = useWallet();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [withdrawals, setWithdrawals] = useState<WD[]>([]);
  const [amount, setAmount] = useState('');
  const [selected, setSelected] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: a }, { data: w }] = await Promise.all([
      supabase.from('bank_accounts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    setAccounts((a as any) || []);
    setWithdrawals((w as any) || []);
    if (a?.length && !selected) setSelected((a as any).find((x: any) => x.is_default)?.id || (a as any)[0].id);
  };
  useEffect(() => { load(); }, [user]);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error('Minimum ₦100'); return; }
    if (amt > wallet.available_balance) { toast.error('Exceeds available balance'); return; }
    if (!selected) { toast.error('Add a bank account first'); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('paystack-withdraw', {
      body: { action: 'request_withdrawal', amount: amt, bank_account_id: selected },
    });
    setBusy(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || 'Failed'); return; }
    toast.success((data as any).message || 'Withdrawal initiated');
    setAmount('');
    await load(); await reload();
  };

  return (
    <div className="bg-card border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Banknote className="h-4 w-4 text-primary" /> Withdraw funds</h3>
          <p className="text-xs text-muted-foreground">Send money from your wallet to your Nigerian bank account.</p>
        </div>
        <AddBankDialog onAdded={load} />
      </div>

      {accounts.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed rounded-xl p-4 text-center">
          Add a bank account to enable withdrawals.
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <div className="sm:col-span-2">
              <Label>Bank account</Label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.bank_name} • {a.account_number} • {a.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (₦)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            {busy ? 'Processing…' : `Withdraw ${amount ? naira(Number(amount)) : ''}`}
          </Button>
        </>
      )}

      {withdrawals.length > 0 && (
        <div className="mt-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent withdrawals</div>
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between text-sm p-3 border rounded-xl">
                <div>
                  <div className="font-medium">{naira(w.amount)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</div>
                  {w.failure_reason && <div className="text-xs text-destructive">{w.failure_reason}</div>}
                </div>
                <Badge variant={w.status === 'success' ? 'default' : w.status === 'failed' ? 'destructive' : 'secondary'}>
                  {w.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AddBankDialog = ({ onAdded }: { onAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState('');
  const [acctNum, setAcctNum] = useState('');
  const [acctName, setAcctName] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!open || banks.length) return;
    supabase.functions.invoke('paystack-withdraw', { body: { action: 'list_banks' } })
      .then(({ data }) => setBanks((data as any)?.banks || []));
  }, [open]);

  useEffect(() => {
    if (acctNum.length === 10 && bankCode) {
      setVerifying(true); setAcctName('');
      supabase.functions.invoke('paystack-withdraw', { body: { action: 'verify_account', account_number: acctNum, bank_code: bankCode } })
        .then(({ data, error }) => {
          if (error || (data as any)?.error) toast.error((data as any)?.error || 'Could not verify account');
          else setAcctName((data as any).account_name);
        })
        .finally(() => setVerifying(false));
    }
  }, [acctNum, bankCode]);

  const save = async () => {
    if (!acctName) { toast.error('Account not verified'); return; }
    const bank = banks.find((b) => b.code === bankCode);
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('paystack-withdraw', {
      body: { action: 'save_account', bank_code: bankCode, bank_name: bank?.name, account_number: acctNum, account_name: acctName },
    });
    setBusy(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || 'Failed'); return; }
    toast.success('Bank account saved');
    setOpen(false); setBankCode(''); setAcctNum(''); setAcctName('');
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-4 w-4" /> Add bank</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a bank account</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Bank</Label>
            <Select value={bankCode} onValueChange={setBankCode}>
              <SelectTrigger><SelectValue placeholder={banks.length ? 'Choose your bank' : 'Loading banks…'} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {banks.map((b) => <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Account number (10 digits)</Label>
            <Input value={acctNum} onChange={(e) => setAcctNum(e.target.value.replace(/\D/g, '').slice(0, 10))} />
          </div>
          {verifying && <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Verifying…</div>}
          {acctName && <div className="text-sm bg-success/10 text-success border border-success/20 rounded-lg p-2">✓ {acctName}</div>}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={busy || !acctName}>{busy ? 'Saving…' : 'Save account'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
