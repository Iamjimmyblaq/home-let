import { Layout } from '@/components/Layout';
import { useEffect, useRef, useState } from 'react';
import { Send, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';

type Thread = { id: string; user_id: string; agent_id: string; listing_id: string | null; last_message: string | null; last_message_at: string | null; otherName?: string; otherAvatar?: string };
type Msg = { id: string; thread_id: string; sender_id: string; content: string; created_at: string };

const Chat = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(params.get('thread'));
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('chat_threads').select('*').or(`user_id.eq.${user.id},agent_id.eq.${user.id}`).order('last_message_at', { ascending: false, nullsFirst: false });
      const t = (data || []) as Thread[];
      const otherIds = Array.from(new Set(t.map((x) => x.user_id === user.id ? x.agent_id : x.user_id)));
      const profMap = new Map<string, any>();
      if (otherIds.length) {
        const { data: profs } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', otherIds);
        (profs || []).forEach((p: any) => profMap.set(p.user_id, p));
      }
      const enriched = t.map((x) => {
        const otherId = x.user_id === user.id ? x.agent_id : x.user_id;
        const p = profMap.get(otherId);
        return { ...x, otherName: p?.full_name || 'Conversation', otherAvatar: p?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p?.full_name || '?'}` };
      });
      setThreads(enriched);
      if (!activeId && enriched.length) setActiveId(enriched[0].id);
    })();
  }, [user]);

  useEffect(() => {
    if (!activeId) return;
    supabase.from('messages').select('*').eq('thread_id', activeId).order('created_at').then(({ data }) => setMsgs((data as any) || []));
    const channel = supabase.channel(`thread-${activeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${activeId}` }, (payload) => {
        setMsgs((m) => [...m, payload.new as Msg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !activeId) return;
    const content = text.trim();
    setText('');
    await supabase.from('messages').insert({ thread_id: activeId, sender_id: user.id, content });
    await supabase.from('chat_threads').update({ last_message: content, last_message_at: new Date().toISOString() }).eq('id', activeId);
  };

  const active = threads.find((t) => t.id === activeId);

  return (
    <Layout>
      <div className="container py-6 h-[calc(100vh-160px)]">
        <div className="grid md:grid-cols-[320px_1fr] h-full border rounded-2xl overflow-hidden bg-card">
          <div className="border-r bg-secondary/30 overflow-y-auto">
            <div className="p-4 border-b font-semibold">Messages</div>
            {threads.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No conversations yet. Start one from a property page.</div>}
            {threads.map((t) => (
              <button key={t.id} onClick={() => setActiveId(t.id)} className={`w-full p-4 flex gap-3 items-start text-left border-b hover:bg-background transition-colors ${activeId === t.id ? 'bg-background' : ''}`}>
                <img src={t.otherAvatar} className="h-10 w-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center"><div className="font-medium text-sm truncate">{t.otherName}</div><div className="text-xs text-muted-foreground">{t.last_message_at ? new Date(t.last_message_at).toLocaleDateString() : ''}</div></div>
                  <div className="text-xs text-muted-foreground truncate">{t.last_message || 'No messages yet'}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex flex-col">
            {active ? <>
              <div className="p-4 border-b flex items-center gap-3">
                <img src={active.otherAvatar} className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-1">{active.otherName} <ShieldCheck className="h-3.5 w-3.5 text-success" /></div>
                  <div className="text-xs text-success">● Online</div>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20">
                {msgs.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border rounded-bl-sm'}`}>
                        {m.content}
                        <div className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={send} className="p-3 border-t flex gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
                <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
              </form>
            </> : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a conversation to start chatting.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
