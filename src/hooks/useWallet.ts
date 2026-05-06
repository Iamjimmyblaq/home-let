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

  // Wallet funding goes through Paystack edge functions (paystack-initialize / paystack-verify);
  // direct client writes to wallets/transactions are not allowed.
  const fund = async (_amount: number) => {
    throw new Error('Use Paystack checkout to fund your wallet.');
  };

  const callEscrow = async (body: any) => {
    const { data, error } = await supabase.functions.invoke('escrow', { body });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    await load();
    return data;
  };

  const holdEscrow = (amount: number, description: string, referenceId?: string) =>
    callEscrow({ action: 'hold', amount, description, reference_id: referenceId });

  const releaseEscrow = (amount: number, payee_user_id: string, description: string, referenceId?: string) =>
    callEscrow({ action: 'release', amount, payee_user_id, description, reference_id: referenceId });

  const refundEscrow = (amount: number, description: string, referenceId?: string) =>
    callEscrow({ action: 'refund', amount, description, reference_id: referenceId });

  return { wallet, loading, fund, holdEscrow, releaseEscrow, refundEscrow, reload: load };
};
