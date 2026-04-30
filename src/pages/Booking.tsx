import { Layout } from '@/components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { properties, hotels } from '@/data/seed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { naira } from '@/lib/format';
import { useState } from 'react';
import { useApp } from '@/store/app';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const item: any = properties.find((p) => p.id === id) || hotels.find((h) => h.id === id);
  const { user, walletBalance, toEscrow } = useApp();
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState(1);

  if (!item) return <Layout><div className="container py-20 text-center">Not found.</div></Layout>;

  const isHotel = 'pricePerNight' in item;
  const price = isHotel ? item.pricePerNight : item.price;
  const nights = checkin && checkout ? Math.max(1, Math.ceil((+new Date(checkout) - +new Date(checkin)) / 86400000)) : 1;
  const subtotal = (isHotel || item.type === 'shortlet') ? price * nights : price;
  const fee = Math.round(subtotal * 0.03);
  const total = subtotal + fee;

  const confirm = () => {
    if (!user) { toast.error('Please sign in'); navigate('/login'); return; }
    if (walletBalance < total) { toast.error('Insufficient balance — fund your wallet'); navigate('/wallet'); return; }
    toEscrow(total);
    toast.success('Booking confirmed! Held in escrow until check-in.');
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="container py-10 max-w-5xl grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6">
          <h1 className="text-2xl font-bold mb-6">Confirm your booking</h1>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div><Label>Check-in</Label><Input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></div>
            <div><Label>Check-out</Label><Input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></div>
          </div>
          <div><Label>Guests</Label><Input type="number" min={1} value={guests} onChange={(e) => setGuests(+e.target.value)} /></div>
          <div className="bg-secondary/50 mt-6 rounded-xl p-4 flex gap-3">
            <ShieldCheck className="h-5 w-5 text-success shrink-0" />
            <div className="text-sm text-muted-foreground">Funds are held in escrow and only released to the host after successful check-in.</div>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-6 h-fit">
          <img src={item.image} className="w-full aspect-video object-cover rounded-xl mb-4" />
          <h3 className="font-semibold mb-1">{item.title || item.name}</h3>
          <div className="text-xs text-muted-foreground mb-4">{item.location}</div>
          <div className="space-y-2 text-sm border-t pt-3">
            <div className="flex justify-between"><span className="text-muted-foreground">{naira(price)} {(isHotel || item.type === 'shortlet') ? `× ${nights} nights` : ''}</span><span>{naira(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Service fee (3%)</span><span>{naira(fee)}</span></div>
            <div className="flex justify-between font-bold border-t pt-2 text-base"><span>Total</span><span className="text-primary">{naira(total)}</span></div>
          </div>
          <Button onClick={confirm} size="lg" className="w-full mt-4">Pay {naira(total)} via escrow</Button>
        </div>
      </div>
    </Layout>
  );
};

export default Booking;
