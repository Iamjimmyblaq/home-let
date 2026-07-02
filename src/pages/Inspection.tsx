import { Layout } from '@/components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Eye, MapPin, ShieldCheck, Calendar as CalIcon } from 'lucide-react';
import { naira } from '@/lib/format';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useListing } from '@/hooks/useListings';
import { supabase } from '@/integrations/supabase/client';
import { BackButton } from '@/components/BackButton';

const Inspection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { item: p, loading } = useListing(id);
  const { user } = useAuth();
  const { wallet, holdEscrow } = useWallet();
  const [mode, setMode] = useState<'virtual' | 'physical'>('physical');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Layout><div className="container py-20 text-center">Loading…</div></Layout>;
  if (!p) return <Layout><div className="container py-20 text-center">Property not found.</div></Layout>;

  const fee = mode === 'virtual' ? 2_500 : 10_000;
  const isReal = p.source === 'db';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in'); navigate('/login'); return; }
    if (wallet.available_balance < fee) { toast.error('Insufficient wallet balance'); navigate('/wallet'); return; }

    setBusy(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      if (isReal) {
        const { error } = await supabase.from('inspections').insert({
          listing_id: p.id, user_id: user.id, agent_id: p.agentId,
          mode, scheduled_at: scheduledAt, fee, notes: note || null, status: 'pending',
        });
        if (error) throw error;
      }
      await holdEscrow(fee, `Inspection deposit — ${p.title}`);
      toast.success('Inspection booked! Agent will confirm shortly.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Could not book inspection');
    } finally { setBusy(false); }
  };

  return (
    <Layout>
      <div className="container py-10 max-w-5xl">
        
        <h1 className="text-3xl font-bold mb-6">Book an inspection</h1>
        <div className="grid lg:grid-cols-3 gap-6">
          <form onSubmit={submit} className="lg:col-span-2 bg-card border rounded-2xl p-6 space-y-5">
            <div>
              <Label className="mb-2 block">Inspection type</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <button type="button" onClick={() => setMode('virtual')} className={`p-4 border-2 rounded-xl text-left transition-all ${mode === 'virtual' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <Eye className="h-5 w-5 text-primary mb-2" />
                  <div className="font-semibold">Virtual (Video call)</div>
                  <div className="text-xs text-muted-foreground">Agent walks you through over Zoom · {naira(2500)}</div>
                </button>
                <button type="button" onClick={() => setMode('physical')} className={`p-4 border-2 rounded-xl text-left transition-all ${mode === 'physical' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <MapPin className="h-5 w-5 text-primary mb-2" />
                  <div className="font-semibold">Physical visit</div>
                  <div className="text-xs text-muted-foreground">In-person at the property · {naira(10000)}</div>
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Preferred date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
              <div><Label>Preferred time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></div>
            </div>
            <div>
              <Label>Notes for agent (optional)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any specific things you want to see..." />
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-success shrink-0" />
              <div className="text-sm text-muted-foreground">Your {naira(fee)} deposit is held in escrow and refunded if the agent cancels or doesn't show up.</div>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}><CalIcon className="h-4 w-4" /> {busy ? 'Booking…' : `Confirm & pay ${naira(fee)} (escrow)`}</Button>
          </form>
          <div className="bg-card border rounded-2xl p-6 h-fit">
            <img src={p.image} alt={p.title} className="w-full aspect-video object-cover rounded-xl mb-4" />
            <h3 className="font-semibold">{p.title}</h3>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><MapPin className="h-3 w-3" />{p.location}{p.state ? `, ${p.state}` : ''}</div>
            <div className="border-t pt-3 flex items-center gap-3">
              {p.agentAvatar && <img src={p.agentAvatar} className="h-10 w-10 rounded-full object-cover" />}
              <div className="text-sm">
                <div className="font-medium">{p.agentName}</div>
                <div className="text-xs text-muted-foreground">{p.agentAgency}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Inspection;
