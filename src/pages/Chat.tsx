import { Layout } from '@/components/Layout';
import { agents } from '@/data/seed';
import { useState } from 'react';
import { Send, Paperclip, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Msg = { id: string; from: 'me' | 'them'; text: string; time: string };

const seedThreads = agents.slice(0, 3).map((a, i) => ({
  agent: a,
  last: ['Sure, 4pm works.', 'I shared the floor plan above 👆', 'Property is still available.'][i],
  unread: i === 0 ? 2 : 0,
  time: ['Now', '10m', '2h'][i],
}));

const Chat = () => {
  const [activeIdx, setActive] = useState(0);
  const active = seedThreads[activeIdx];
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: '1', from: 'them', text: `Hi, I'm ${active.agent.name}. How can I help with the property today?`, time: '10:02' },
    { id: '2', from: 'me', text: 'Hi! Is the Banana Island duplex still available for inspection this Saturday?', time: '10:04' },
    { id: '3', from: 'them', text: 'Yes it is. I can do 2pm or 4pm. Which works?', time: '10:05' },
  ]);
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { id: String(Date.now()), from: 'me', text, time: 'Now' }]);
    setText('');
    setTimeout(() => setMsgs((m) => [...m, { id: String(Date.now() + 1), from: 'them', text: 'Got it — confirming with the landlord, will get back to you shortly.', time: 'Now' }]), 900);
  };

  return (
    <Layout>
      <div className="container py-6 h-[calc(100vh-160px)]">
        <div className="grid md:grid-cols-[320px_1fr] h-full border rounded-2xl overflow-hidden bg-card">
          <div className="border-r bg-secondary/30 overflow-y-auto">
            <div className="p-4 border-b font-semibold">Messages</div>
            {seedThreads.map((t, i) => (
              <button key={t.agent.id} onClick={() => setActive(i)} className={`w-full p-4 flex gap-3 items-start text-left border-b hover:bg-background transition-colors ${activeIdx === i ? 'bg-background' : ''}`}>
                <img src={t.agent.avatar} className="h-10 w-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center"><div className="font-medium text-sm truncate">{t.agent.name}</div><div className="text-xs text-muted-foreground">{t.time}</div></div>
                  <div className="text-xs text-muted-foreground truncate">{t.last}</div>
                </div>
                {t.unread > 0 && <div className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">{t.unread}</div>}
              </button>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="p-4 border-b flex items-center gap-3">
              <img src={active.agent.avatar} className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-1">{active.agent.name} {active.agent.verified && <ShieldCheck className="h-3.5 w-3.5 text-success" />}</div>
                <div className="text-xs text-success">● Online</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${m.from === 'me' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border rounded-bl-sm'}`}>
                    {m.text}
                    <div className={`text-[10px] mt-1 ${m.from === 'me' ? 'text-white/70' : 'text-muted-foreground'}`}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t flex gap-2">
              <Button type="button" size="icon" variant="ghost"><Paperclip className="h-4 w-4" /></Button>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
              <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
