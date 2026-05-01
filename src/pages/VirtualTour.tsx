import { Layout } from '@/components/Layout';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Lock, ArrowLeft, Maximize, RotateCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useListing } from '@/hooks/useListings';
import { useState } from 'react';
import { toast } from 'sonner';

const VirtualTour = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { item: p, loading } = useListing(id);
  const { user } = useAuth();
  const { wallet, holdEscrow } = useWallet();
  const [unlocked, setUnlocked] = useState(false);
  const [room, setRoom] = useState(0);

  if (loading) return <Layout><div className="container py-20 text-center">Loading…</div></Layout>;
  if (!p) return <Layout><div className="container py-20 text-center">Tour not found.</div></Layout>;

  const fee = 2_500;
  const rooms = ['Living Room', 'Master Bedroom', 'Kitchen', 'Bathroom', 'Balcony'];

  const unlock = async () => {
    if (!user) { toast.error('Please sign in first'); navigate('/login'); return; }
    if (wallet.available_balance < fee) { toast.error('Insufficient wallet balance'); navigate('/wallet'); return; }
    try {
      await holdEscrow(fee, `360° tour unlock — ${p.title}`);
      setUnlocked(true);
      toast.success('Tour unlocked. Enjoy!');
    } catch (e: any) { toast.error(e.message); }
  };


  return (
    <Layout>
      <div className="bg-black text-white min-h-[80vh] relative">
        <div className="container py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white hover:bg-white/10"><ArrowLeft className="h-4 w-4" /> Back</Button>
          <div className="text-sm">{p.title} · 360° Tour</div>
        </div>

        <div className="relative aspect-video max-w-6xl mx-auto rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800">
          <img src={p.gallery[room % p.gallery.length]} alt="" className={`w-full h-full object-cover transition-all ${unlocked ? '' : 'blur-2xl scale-110'}`} />
          {!unlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md p-8">
                <div className="h-16 w-16 rounded-2xl gradient-gold mx-auto mb-4 flex items-center justify-center shadow-gold">
                  <Lock className="h-7 w-7 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Unlock 360° tour</h2>
                <p className="text-white/70 mb-6 text-sm">Refundable ₦{fee.toLocaleString()} fee held in escrow. Refunded if you book an inspection.</p>
                <Button onClick={unlock} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold">
                  <Eye className="h-4 w-4" /> Unlock now (₦{fee.toLocaleString()})
                </Button>
              </div>
            </div>
          )}
          {unlocked && (
            <>
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg text-sm">{rooms[room % rooms.length]}</div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="h-9 w-9 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center hover:bg-white/10"><RotateCw className="h-4 w-4" /></button>
                <button className="h-9 w-9 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center hover:bg-white/10"><Maximize className="h-4 w-4" /></button>
              </div>
            </>
          )}
        </div>

        {unlocked && (
          <div className="container py-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {rooms.map((r, i) => (
                <button key={r} onClick={() => setRoom(i)} className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${room === i ? 'bg-accent text-accent-foreground' : 'bg-white/10 hover:bg-white/20'}`}>
                  {r}
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center bg-white/5 rounded-2xl p-6">
              <div>
                <div className="font-semibold">Like what you see?</div>
                <div className="text-sm text-white/70">Book a physical inspection — your tour fee is fully refunded.</div>
              </div>
              <Link to={`/inspection/${p.id}`}><Button className="bg-accent text-accent-foreground">Book inspection</Button></Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VirtualTour;
