import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/** Plays a short beep using the Web Audio API (no asset file needed). */
const beep = (freq = 880, duration = 220) => {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
    osc.onended = () => ctx.close();
  } catch { /* noop */ }
};

/** Subscribe to inspections (as agent) and transactions (payouts) and beep + toast on new events. */
export const useBeepNotifications = () => {
  const { user, role } = useAuth();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const isHost = role === 'agent' || role === 'admin';
    const ch = supabase
      .channel(`beeps-${user.id}`)
      // New inspection booking targeted at this agent/landlord
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inspections', filter: `agent_id=eq.${user.id}` },
        (payload) => {
          if (!isHost) return;
          const id = (payload.new as any).id;
          if (seen.current.has(id)) return; seen.current.add(id);
          beep(880, 200); setTimeout(() => beep(1175, 220), 220);
          toast.success('🔔 New inspection booked!', { description: 'A user just requested an inspection.' });
        })
      // New hotel/short-let booking targeted at this host
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings', filter: `agent_id=eq.${user.id}` },
        (payload) => {
          if (!isHost) return;
          const id = (payload.new as any).id;
          if (seen.current.has(id)) return; seen.current.add(id);
          beep(784, 180); setTimeout(() => beep(1046, 240), 200);
          toast.success('🔔 New booking received!', { description: 'A guest just booked your property.' });
        })
      // Inspection status changes (completed) — beep for both parties
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inspections',
          filter: role === 'agent' ? `agent_id=eq.${user.id}` : `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as any, o = payload.old as any;
          if ((n.status === 'completed' || n.status === 'settled') && n.status !== o.status) {
            beep(660, 180); setTimeout(() => beep(990, 280), 200);
            toast.success(n.status === 'settled' ? '✅ Inspection funds released' : '✅ Inspection completed', { description: n.status === 'settled' ? 'The transaction is complete.' : 'Customer can now release funds.' });
          }
        })
      // Payouts / fund credits
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const t = payload.new as any;
          if (t.type === 'payout' || t.type === 'escrow_release' || t.type === 'fund') {
            beep(1320, 160); setTimeout(() => beep(990, 240), 180);
            toast.success(`💰 ${t.description || 'Transaction completed'}`);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, role]);
};
