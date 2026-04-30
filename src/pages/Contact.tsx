import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const Contact = () => (
  <Layout>
    <div className="container py-16 grid lg:grid-cols-2 gap-12">
      <div>
        <h1 className="text-4xl font-bold mb-3">Get in touch</h1>
        <p className="text-muted-foreground mb-8">We're here 7 days a week to help you find a home, list a property, or resolve disputes.</p>
        <div className="space-y-4">
          {[
            { icon: Mail, label: 'Email', v: 'hello@homelet.ng' },
            { icon: Phone, label: 'Phone', v: '+234 1 888 0420' },
            { icon: MessageSquare, label: 'WhatsApp', v: '+234 803 555 0100' },
            { icon: MapPin, label: 'Office', v: '14 Adeola Odeku, Victoria Island, Lagos' },
          ].map((c) => (
            <div key={c.label} className="flex items-start gap-4 p-4 bg-card border rounded-xl">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><c.icon className="h-5 w-5" /></div>
              <div><div className="text-xs text-muted-foreground">{c.label}</div><div className="font-medium">{c.v}</div></div>
            </div>
          ))}
        </div>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); toast.success("Message sent. We'll reply within 24h."); (e.target as HTMLFormElement).reset(); }}
        className="bg-card border rounded-2xl p-8 shadow-soft space-y-4"
      >
        <h2 className="text-xl font-bold">Send us a message</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="First name" required />
          <Input placeholder="Last name" required />
        </div>
        <Input type="email" placeholder="Email" required />
        <Input placeholder="Subject" required />
        <Textarea placeholder="How can we help?" rows={5} required />
        <Button type="submit" size="lg" className="w-full">Send message</Button>
      </form>
    </div>
  </Layout>
);

export default Contact;
