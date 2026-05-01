import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Wallet = { available_balance: number; escrow_balance: number };

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet>({ available_balance: 0, escrow_balance: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setWallet({ available_balance: 0, escrow_balance: 0 }); setLoading(false); return; }
    const { data } = await supabase.from('wallets').select('available_balance, escrow_balance').eq('user_id', user.id).maybeSingle();
    if (data) setWallet({ available_balance: Number(data.available_balance), escrow_balance: Number(data.escrow_balance) });
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const fund = async (amount: number) => {
    if (!user) return;
    const next = wallet.available_balance + amount;
    await supabase.from('wallets').update({ available_balance: next }).eq('user_id', user.id);
    await supabase.from('transactions').insert({ user_id: user.id, type: 'fund', amount, description: 'Wallet top-up' });
    await load();
  };

  const holdEscrow = async (amount: number, description: string, referenceId?: string) => {
    if (!user) throw new Error('Not signed in');
    if (wallet.available_balance < amount) throw new Error('Insufficient balance');
    const next = { available_balance: wallet.available_balance - amount, escrow_balance: wallet.escrow_balance + amount };
    await supabase.from('wallets').update(next).eq('user_id', user.id);
    await supabase.from('transactions').insert({ user_id: user.id, type: 'escrow_hold', amount, description, reference_id: referenceId ?? null });
    await load();
  };

  const releaseEscrow = async (amount: number, description: string) => {
    if (!user) return;
    const next = { escrow_balance: Math.max(0, wallet.escrow_balance - amount) };
    await supabase.from('wallets').update(next).eq('user_id', user.id);
    await supabase.from('transactions').insert({ user_id: user.id, type: 'escrow_release', amount, description });
    await load();
  };

  return { wallet, loading, fund, holdEscrow, releaseEscrow, reload: load };
};
