import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, MapPin, MessageSquare, LifeBuoy } from 'lucide-react';
import { toast } from 'sonner';

export const CONTACT_EMAILS = {
  general: 'hello@home-let.com',
  support: 'support@home-let.com',
} as const;

const CATEGORIES: { value: string; label: string; channel: keyof typeof CONTACT_EMAILS }[] = [
  { value: 'general', label: 'General enquiry', channel: 'general' },
  { value: 'listing', label: 'Listing or agent enquiry', channel: 'general' },
  { value: 'partnership', label: 'Partnership / press', channel: 'general' },
  { value: 'complaint', label: 'Complaint', channel: 'support' },
  { value: 'dispute', label: 'Dispute or refund', channel: 'support' },
  { value: 'payment', label: 'Payment / wallet issue', channel: 'support' },
];

const Contact = () => {
  const [category, setCategory] = useState('general');
  const channel = CATEGORIES.find((c) => c.value === category)?.channel ?? 'general';
  const routedTo = CONTACT_EMAILS[channel];

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const subject = `[${CATEGORIES.find((c) => c.value === category)?.label}] ${data.get('subject')}`;
    const body = `From: ${data.get('first')} ${data.get('last')} <${data.get('email')}>\n\n${data.get('message')}`;
    window.location.href = `mailto:${routedTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success(`Routed to ${routedTo} — we reply within 24h.`);
    form.reset();
  };

  return (
    <Layout>
      <div className="container py-16 grid lg:grid-cols-2 gap-12">
        <div>
          <h1 className="text-4xl font-bold mb-3">Get in touch</h1>
          <p className="text-muted-foreground mb-8">We're here 7 days a week to help you find a home, list a property, or resolve disputes.</p>
          <div className="space-y-4">
            {[
              { icon: Mail, label: 'General enquiries', v: CONTACT_EMAILS.general },
              { icon: LifeBuoy, label: 'Complaints & disputes', v: CONTACT_EMAILS.support },
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
        <form onSubmit={onSubmit} className="bg-card border rounded-2xl p-8 shadow-soft space-y-4">
          <h2 className="text-xl font-bold">Send us a message</h2>
          <div>
            <Label>What is this about?</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Goes to <span className="font-medium text-foreground">{routedTo}</span></p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="first" placeholder="First name" required />
            <Input name="last" placeholder="Last name" required />
          </div>
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="subject" placeholder="Subject" required />
          <Textarea name="message" placeholder="How can we help?" rows={5} required />
          <Button type="submit" size="lg" className="w-full">Send message</Button>
        </form>
      </div>
    </Layout>
  );
};

export default Contact;
