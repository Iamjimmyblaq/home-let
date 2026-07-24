import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

type Notif = { id: string; type: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string };

export const NotificationsBell = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
    setItems((data as any) || []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => setItems((prev) => [payload.new as any, ...prev].slice(0, 30)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const unread = items.filter((i) => !i.read_at).length;

  const markOne = async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };
  const markAll = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  };

  if (!user) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-secondary transition-colors" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-[10px] text-destructive-foreground font-bold inline-flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-[70vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-semibold">Notifications</div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAll}><CheckCheck className="h-3 w-3" /> Mark all read</Button>
          )}
        </div>
        <div className="overflow-y-auto flex-1">
          {items.length === 0 && <div className="p-6 text-center text-xs text-muted-foreground">You're all caught up.</div>}
          {items.map((n) => (
            <div key={n.id} className={`px-3 py-2.5 border-b last:border-0 flex gap-2 ${!n.read_at ? 'bg-primary/5' : ''}`}>
              <div className="flex-1 min-w-0">
                {n.link ? (
                  <Link to={n.link} onClick={() => { markOne(n.id); setOpen(false); }} className="text-sm font-medium hover:underline block truncate">{n.title}</Link>
                ) : (
                  <div className="text-sm font-medium truncate">{n.title}</div>
                )}
                {n.body && <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>}
                <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.read_at && (
                <button type="button" onClick={() => markOne(n.id)} className="text-muted-foreground hover:text-primary self-start" title="Mark read">
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
