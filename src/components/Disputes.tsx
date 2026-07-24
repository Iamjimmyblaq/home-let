import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { naira } from '@/lib/format';
import { toast } from 'sonner';
import { ShieldAlert, Gavel, ArrowUpRight } from 'lucide-react';

type Dispute = {
  id: string; inspection_id: string | null; booking_id: string | null;
  raised_by: string; against_user: string; amount: number; reason: string;
  status: string; resolution: string | null; resolution_note: string | null;
  moderator_proposed_resolution: string | null; moderator_proposed_note: string | null;
  moderator_by: string | null; escalated_to_admin: boolean; admin_approved: boolean;
  created_at: string;
};

const RES_LABEL: Record<string, string> = {
  refund_user: 'Refund user 100%',
  release_agent: 'Release to agent 100%',
  split: 'Split 50/50',
};

export const RaiseDisputeButton = ({
  inspectionId, bookingId, againstUser, amount, label = 'Raise dispute',
}: { inspectionId?: string; bookingId?: string; againstUser: string; amount: number; label?: string }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  const submit = async () => {
    if (reason.trim().length < 10) { toast.error('Please describe the issue (10+ chars)'); return; }
    setBusy(true);
    const { error } = await supabase.from('disputes').insert({
      inspection_id: inspectionId ?? null, booking_id: bookingId ?? null,
      raised_by: user.id, against_user: againstUser, amount, reason: reason.trim(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Dispute raised. A moderator will review shortly.');
    setOpen(false); setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><ShieldAlert className="h-4 w-4" /> {label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Raise a dispute</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          Funds in escrow ({naira(amount)}) will be frozen until a moderator reviews and an admin approves the final decision.
        </p>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What went wrong? Include any details for the moderator and admin." rows={5} />
        <DialogFooter><Button onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit dispute'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const MyDisputesList = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Dispute[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('disputes').select('*')
      .or(`raised_by.eq.${user.id},against_user.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .then(({ data }) => setItems((data as any) || []));
  }, [user]);

  if (!items.length) return <p className="text-sm text-muted-foreground">No disputes.</p>;
  return (
    <div className="space-y-2">
      {items.map((d) => (
        <div key={d.id} className="border rounded-xl p-3 text-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="font-medium">{naira(d.amount)} · {d.raised_by === user!.id ? 'You raised' : 'Raised against you'}</div>
            <Badge variant={d.status === 'resolved' ? 'default' : d.status === 'pending_admin' ? 'secondary' : 'outline'}>{d.status === 'pending_admin' ? 'pending admin' : d.status}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>
          <div className="mt-1">{d.reason}</div>
          {d.moderator_proposed_resolution && !d.resolution && (
            <div className="mt-1 text-xs text-muted-foreground"><strong>Moderator proposal:</strong> {RES_LABEL[d.moderator_proposed_resolution]} — awaiting admin approval</div>
          )}
          {d.resolution && <div className="mt-1 text-xs"><strong>Resolved:</strong> {RES_LABEL[d.resolution] || d.resolution} — {d.resolution_note}</div>}
        </div>
      ))}
    </div>
  );
};

/** Panel used in Moderator + Admin consoles. Behavior branches by role. */
export const StaffDisputesPanel = ({ role }: { role: 'moderator' | 'admin' }) => {
  const [items, setItems] = useState<Dispute[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('disputes').select('*').order('created_at', { ascending: false }).limit(200);
    setItems((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const call = async (id: string, body: any, ok: string) => {
    setBusy(id);
    const { data, error } = await supabase.functions.invoke('dispute-resolve', { body: { dispute_id: id, ...body } });
    setBusy(null);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || 'Failed'); return; }
    toast.success(ok); load();
  };

  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      {items.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No disputes.</div>}
      {items.map((d) => {
        const isPendingAdmin = d.status === 'pending_admin';
        return (
          <div key={d.id} className="p-4 border-b last:border-0 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium">{naira(d.amount)} held in escrow</div>
                <div className="text-xs text-muted-foreground">
                  Raised by {d.raised_by.slice(0, 8)}… against {d.against_user.slice(0, 8)}… · {new Date(d.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {d.escalated_to_admin && <Badge variant="destructive" className="text-[10px]">Escalated</Badge>}
                <Badge variant={d.status === 'resolved' ? 'default' : isPendingAdmin ? 'secondary' : d.status === 'open' ? 'destructive' : 'outline'}>
                  {isPendingAdmin ? 'pending admin' : d.status}
                </Badge>
              </div>
            </div>
            <div className="text-sm bg-secondary/40 rounded-lg p-3">{d.reason}</div>

            {d.moderator_proposed_resolution && (
              <div className="text-xs bg-accent/10 border border-accent/30 rounded-lg p-2">
                <strong>Moderator proposal:</strong> {RES_LABEL[d.moderator_proposed_resolution]}
                {d.moderator_proposed_note && <> — {d.moderator_proposed_note}</>}
              </div>
            )}

            {d.status === 'resolved' && (
              <div className="text-xs"><strong>Resolved:</strong> {RES_LABEL[d.resolution || ''] || d.resolution} — {d.resolution_note}</div>
            )}

            {/* MODERATOR view */}
            {role === 'moderator' && d.status === 'open' && (
              <div className="grid sm:grid-cols-[180px_1fr_auto_auto] gap-2 items-center">
                <Select value={resolutions[d.id] || ''} onValueChange={(v) => setResolutions({ ...resolutions, [d.id]: v })}>
                  <SelectTrigger><SelectValue placeholder="Propose decision" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund_user">Refund user (100%)</SelectItem>
                    <SelectItem value="release_agent">Release to agent (100%)</SelectItem>
                    <SelectItem value="split">Split 50/50</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea value={notes[d.id] || ''} onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })} placeholder="Reasoning for the admin" rows={1} />
                <Button variant="outline" onClick={() => call(d.id, { action: 'escalate', note: notes[d.id] || '' }, 'Escalated to admin')} disabled={busy === d.id}>
                  <ArrowUpRight className="h-4 w-4" /> Escalate
                </Button>
                <Button onClick={() => call(d.id, { action: 'propose', resolution: resolutions[d.id], note: notes[d.id] || '' }, 'Proposal sent to admin')} disabled={busy === d.id || !resolutions[d.id]}>
                  Propose
                </Button>
              </div>
            )}
            {role === 'moderator' && isPendingAdmin && (
              <div className="text-xs text-muted-foreground italic">Awaiting admin approval — you cannot release funds directly.</div>
            )}

            {/* ADMIN view */}
            {role === 'admin' && d.status !== 'resolved' && (
              <div className="space-y-2">
                {isPendingAdmin && (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => call(d.id, { action: 'approve' }, 'Approved — funds released')} disabled={busy === d.id}>
                      <Gavel className="h-4 w-4" /> Approve moderator's decision
                    </Button>
                    <Button variant="outline" onClick={() => call(d.id, { action: 'reject' }, 'Proposal rejected — dispute reopened')} disabled={busy === d.id}>
                      Reject proposal
                    </Button>
                  </div>
                )}
                <div className="grid sm:grid-cols-[180px_1fr_auto] gap-2 items-center">
                  <Select value={resolutions[d.id] || ''} onValueChange={(v) => setResolutions({ ...resolutions, [d.id]: v })}>
                    <SelectTrigger><SelectValue placeholder="Override decision" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refund_user">Refund user (100%)</SelectItem>
                      <SelectItem value="release_agent">Release to agent (100%)</SelectItem>
                      <SelectItem value="split">Split 50/50</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea value={notes[d.id] || ''} onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })} placeholder="Admin note" rows={1} />
                  <Button variant="destructive" onClick={() => call(d.id, { action: 'override', resolution: resolutions[d.id], note: notes[d.id] || '' }, 'Override applied — funds released')} disabled={busy === d.id || !resolutions[d.id]}>
                    <Gavel className="h-4 w-4" /> Override & release
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
