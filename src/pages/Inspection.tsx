import { Layout } from '@/components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { properties, agents } from '@/data/seed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Eye, MapPin, ShieldCheck, Calendar as CalIcon } from 'lucide-react';
import { useApp } from '@/store/app';
import { naira } from '@/lib/format';
import { toast } from 'sonner';

const Inspection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const p = properties.find((x) => x.id === id);
  const { user, walletBalance, toEscrow } = useApp();
  const [mode, setMode] = useState<'virtual' | 'physical'>('physical');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [note, setNote] = useState('');

  if (!p) return <Layout><div className="container py-20 text-center">Property not found.</div></Layout>;
  const agent = agents.find((a) => a.id === p.agentId)!;
  const fee = mode === 'virtual' ? 2_500 : 10_000;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in'); navigate('/login'); return; }
    if (walletBalance < fee) { toast.error('Insufficient wallet balance'); navigate('/wallet'); return; }
    toEscrow(fee);
    toast.success('Inspection booked! Agent will confirm shortly.');
    navigate('/dashboard');
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
            <Button type="submit" size="lg" className="w-full"><CalIcon className="h-4 w-4" /> Confirm & pay {naira(fee)} (escrow)</Button>
          </form>

          <div className="bg-card border rounded-2xl p-6 h-fit">
            <img src={p.image} alt={p.title} className="w-full aspect-video object-cover rounded-xl mb-4" />
            <h3 className="font-semibold">{p.title}</h3>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><MapPin className="h-3 w-3" />{p.location}, {p.state}</div>
            <div className="border-t pt-3 flex items-center gap-3">
              <img src={agent.avatar} className="h-10 w-10 rounded-full" />
              <div className="text-sm">
                <div className="font-medium">{agent.name}</div>
                <div className="text-xs text-muted-foreground">{agent.agency}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Inspection;
