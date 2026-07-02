import { Layout } from '@/components/Layout';
import { Link } from 'react-router-dom';
import { Building2, Calendar, Eye, Plus, TrendingUp, Wallet, ShieldCheck, Trash2, Edit, Rocket, Sparkles } from 'lucide-react';
import { naira, shortNaira } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useListings } from '@/hooks/useListings';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';
import { WithdrawPanel } from '@/components/WithdrawPanel';
import { RaiseDisputeButton, MyDisputesList } from '@/components/Disputes';
import { NIGERIAN_STATES } from '@/data/nigerianStates';

const BOOST_BASE_FEE = 2500; // ₦2,500 for 2 days
const BOOST_BASE_DAYS = 2;
const boostFeeFor = (days: number) =>
  days <= BOOST_BASE_DAYS ? BOOST_BASE_FEE : BOOST_BASE_FEE + Math.ceil((days - BOOST_BASE_DAYS) * (BOOST_BASE_FEE / BOOST_BASE_DAYS));

type Insp = { id: string; listing_id: string; user_id: string; mode: string; scheduled_at: string; status: string; fee: number };

const KYCBanner = () => {
  const { profile, user, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!profile || !user) return null;
  if (profile.kyc_status === 'verified') return (
    <div className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
      <ShieldCheck className="h-5 w-5 text-success" />
      <div className="text-sm font-medium">Your agent profile is KYC-verified.</div>
    </div>
  );
  const onUpload = async (file: File) => {
    setBusy(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('kyc-docs').upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setBusy(false); return; }
    await supabase.from('profiles').update({ kyc_status: 'pending', kyc_doc_url: path }).eq('user_id', user.id);
    await refresh();
    setBusy(false);
    toast.success('KYC submitted — admin will review shortly.');
  };
  return (
    <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-accent" />
        <div>
          <div className="font-medium text-sm">KYC verification: <span className="capitalize">{profile.kyc_status}</span></div>
          <div className="text-xs text-muted-foreground">Upload a government ID (PDF/JPG/PNG). Listings stay hidden until verified.</div>
        </div>
      </div>
      {profile.kyc_status !== 'pending' && (
        <label className="inline-flex">
          <input type="file" className="hidden" accept="image/*,.pdf" disabled={busy} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          <Button size="sm" disabled={busy} asChild><span>{busy ? 'Uploading…' : 'Upload KYC document'}</span></Button>
        </label>
      )}
    </div>
  );
};

const AgentProfileForm = () => {
  const { user, profile, refresh } = useAuth();
  const [f, setF] = useState({ full_name: '', username: '', phone: '', agency_name: '', bio: '' });
  const [avatarSrc, setAvatarSrc] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (profile) setF({
      full_name: profile.full_name || '', username: profile.username || '',
      phone: profile.phone || '', agency_name: profile.agency_name || '', bio: profile.bio || '',
    });
  }, [profile]);
  useEffect(() => {
    if (!profile?.avatar_url) { setAvatarSrc(''); return; }
    if (/^(https?:|data:|blob:|\/)/.test(profile.avatar_url) && !profile.avatar_url.includes('/object/public/avatars/')) {
      setAvatarSrc(profile.avatar_url);
      return;
    }
    const marker = '/object/public/avatars/';
    const path = profile.avatar_url.includes(marker)
      ? decodeURIComponent(profile.avatar_url.split(marker)[1].split('?')[0])
      : profile.avatar_url;
    supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24).then(({ data }) => setAvatarSrc(data?.signedUrl ?? ''));
  }, [profile?.avatar_url]);
  if (!user) return null;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from('profiles').update(f).eq('user_id', user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await refresh();
    toast.success('Profile updated');
  };
  const onAvatar = async (file: File) => {
    if (!user) return;
    setBusy(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { toast.error(upErr.message); setBusy(false); return; }
    const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24);
    const { error: updErr } = await supabase.from('profiles').update({ avatar_url: path }).eq('user_id', user.id);
    if (updErr) { toast.error(updErr.message); setBusy(false); return; }
    setAvatarSrc(signed?.signedUrl ?? '');
    await refresh();
    toast.success('Avatar updated');
    setBusy(false);
  };
  return (
    <form onSubmit={save} className="bg-card border rounded-2xl p-6 space-y-4 max-w-2xl">
      <div className="flex items-center gap-4">
        <img src={avatarSrc || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.full_name || 'A')}`} className="h-16 w-16 rounded-full object-cover" />
        <label className="inline-flex">
          <input type="file" className="hidden" accept="image/*" disabled={busy} onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])} />
          <Button type="button" size="sm" variant="outline" disabled={busy} asChild><span>{busy ? 'Uploading…' : 'Change avatar'}</span></Button>
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required /></div>
        <div><Label>Username</Label><Input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase() })} placeholder="e.g. james_eze" /></div>
        <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><Label>Agency / Company</Label><Input value={f.agency_name} onChange={(e) => setF({ ...f, agency_name: e.target.value })} /></div>
      </div>
      <div><Label>Bio</Label><Textarea rows={4} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="Tell renters about your experience and specialties." /></div>
      <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</Button>
    </form>
  );
};


type ListingFormState = {
  title: string; type: string; price: string; bedrooms: string; bathrooms: string; area: string;
  location: string; city: string; state: string; latitude: string; longitude: string;
  description: string; amenities: string; tour: string;
  cert_type: string; cert_url: string;
};

const emptyForm: ListingFormState = {
  title: '', type: 'rent', price: '', bedrooms: '2', bathrooms: '2', area: '120',
  location: '', city: '', state: 'Lagos', latitude: '', longitude: '', description: '', amenities: '', tour: '',
  cert_type: '', cert_url: '',
};

const ListingFormFields = ({ f, setF, images, setImages, busy, setBusy, userId }: {
  f: ListingFormState; setF: (u: ListingFormState) => void;
  images: string[]; setImages: (u: string[] | ((p: string[]) => string[])) => void;
  busy: boolean; setBusy: (b: boolean) => void; userId: string;
}) => {
  const [geocoding, setGeocoding] = useState(false);

  const onPickImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('property-photos').upload(path, file, { contentType: file.type, upsert: false });
      if (error) { toast.error(`${file.name}: ${error.message}`); continue; }
      uploaded.push(path);
    }
    setImages((prev) => [...prev, ...uploaded]);
    setBusy(false);
    if (uploaded.length) toast.success(`${uploaded.length} photo(s) uploaded`);
  };

  const onPickCert = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const path = `${userId}/cert-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('property-photos').upload(path, file, { contentType: file.type, upsert: false });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setF({ ...f, cert_url: path });
    toast.success('Certificate attached');
  };

  const geocode = async () => {
    const q = [f.location, f.city, f.state, 'Nigeria'].filter(Boolean).join(', ');
    if (!q.trim()) { toast.error('Enter an address first'); return; }
    setGeocoding(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { 'Accept-Language': 'en' } });
      const data = await r.json();
      if (!data?.[0]) { toast.error('Address not found, drop a pin manually.'); return; }
      setF({ ...f, latitude: String(data[0].lat), longitude: String(data[0].lon) });
      toast.success('Coordinates filled from address');
    } catch (e: any) { toast.error(e.message || 'Geocode failed'); }
    finally { setGeocoding(false); }
  };

  const [previews, setPreviews] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      const out: Record<string, string> = {};
      for (const img of images) {
        if (/^https?:|^blob:|^data:/.test(img)) { out[img] = img; continue; }
        const { data } = await supabase.storage.from('property-photos').createSignedUrl(img, 60 * 60);
        if (data?.signedUrl) out[img] = data.signedUrl;
      }
      setPreviews(out);
    })();
  }, [images]);

  return (
    <>
      <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Type</Label>
          <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rent">For Rent</SelectItem>
              <SelectItem value="sale">For Sale</SelectItem>
              <SelectItem value="shortlet">Short-let</SelectItem>
              <SelectItem value="hotel">Hotel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Price (₦)</Label><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Beds</Label><Input type="number" value={f.bedrooms} onChange={(e) => setF({ ...f, bedrooms: e.target.value })} /></div>
        <div><Label>Baths</Label><Input type="number" value={f.bathrooms} onChange={(e) => setF({ ...f, bathrooms: e.target.value })} /></div>
        <div><Label>Area (m²)</Label><Input type="number" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Location</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} required placeholder="Lekki Phase 1" /></div>
        <div><Label>City</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Lekki" /></div>
        <div><Label>State</Label>
          <Select value={f.state} onValueChange={(v) => setF({ ...f, state: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div><Label>Latitude</Label><Input type="number" step="any" value={f.latitude} onChange={(e) => setF({ ...f, latitude: e.target.value })} placeholder="6.4478" /></div>
        <div><Label>Longitude</Label><Input type="number" step="any" value={f.longitude} onChange={(e) => setF({ ...f, longitude: e.target.value })} placeholder="3.4723" /></div>
        <Button type="button" variant="outline" onClick={geocode} disabled={geocoding}>{geocoding ? 'Locating…' : 'Find on map'}</Button>
      </div>
      <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} /></div>
      <div><Label>Amenities (comma separated)</Label><Input value={f.amenities} onChange={(e) => setF({ ...f, amenities: e.target.value })} placeholder="Pool, Gym, Security" /></div>
      <div>
        <Label>Property photos (multiple)</Label>
        <label className="mt-1 flex items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer hover:bg-secondary/40 transition">
          <input type="file" className="hidden" accept="image/*" multiple disabled={busy} onChange={(e) => onPickImages(e.target.files)} />
          <span className="text-sm text-muted-foreground">{busy ? 'Uploading…' : 'Click to add photos — they auto-build the virtual tour'}</span>
        </label>
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {images.map((img) => (
              <div key={img} className="relative aspect-square rounded-lg overflow-hidden border group">
                <img src={previews[img] || ''} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages((prev) => prev.filter((u) => u !== img))} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div><Label>360° tour URL (optional)</Label><Input value={f.tour} onChange={(e) => setF({ ...f, tour: e.target.value })} placeholder="Leave blank — virtual tour is auto-built from your photos" /></div>
      {f.type === 'sale' && (
        <div className="border rounded-xl p-3 bg-secondary/30 space-y-2">
          <div className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Ownership certificate (optional, helps buyers trust your listing)</div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Select value={f.cert_type} onValueChange={(v) => setF({ ...f, cert_type: v })}>
              <SelectTrigger><SelectValue placeholder="Certificate type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="C of O">Certificate of Occupancy (C of O)</SelectItem>
                <SelectItem value="Governor's Consent">Governor's Consent</SelectItem>
                <SelectItem value="Deed of Assignment">Deed of Assignment</SelectItem>
                <SelectItem value="Survey Plan">Registered Survey Plan</SelectItem>
                <SelectItem value="Excision">Excision / Gazette</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <label className="inline-flex">
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => onPickCert(e.target.files?.[0])} />
              <Button type="button" variant="outline" asChild><span>{f.cert_url ? 'Replace file' : 'Attach file'}</span></Button>
            </label>
          </div>
          {f.cert_url && <div className="text-xs text-success">✓ Document attached</div>}
        </div>
      )}
    </>
  );
};

const NewListingDialog = ({ onCreated, disabled, disabledReason }: { onCreated: () => void; disabled?: boolean; disabledReason?: string }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [f, setF] = useState<ListingFormState>(emptyForm);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (images.length === 0) { toast.error('Upload at least one photo'); return; }
    setBusy(true);
    const { error } = await supabase.from('listings').insert({
      agent_id: user.id, title: f.title, type: f.type as any, price: Number(f.price),
      bedrooms: +f.bedrooms, bathrooms: +f.bathrooms, area_sqm: +f.area,
      location: f.location, city: f.city, state: f.state, description: f.description,
      amenities: f.amenities.split(',').map((s) => s.trim()).filter(Boolean),
      images, tour_url: f.tour || null,
      latitude: f.latitude ? Number(f.latitude) : null,
      longitude: f.longitude ? Number(f.longitude) : null,
      cert_type: f.type === 'sale' && f.cert_type ? f.cert_type : null,
      cert_url: f.type === 'sale' && f.cert_url ? f.cert_url : null,
      status: 'pending',
    } as any);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Listing submitted — pending admin verification.');
    setImages([]); setF(emptyForm);
    setOpen(false); onCreated();
  };
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <DialogTrigger asChild>
        <Button size="lg" disabled={disabled} title={disabled ? disabledReason : undefined}>
          <Plus className="h-4 w-4" /> New listing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create a new listing</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <ListingFormFields f={f} setF={setF} images={images} setImages={setImages} busy={busy} setBusy={setBusy} userId={user.id} />
          <DialogFooter><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Submit for review'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const EditListingDialog = ({ listingId, onSaved }: { listingId: string; onSaved: () => void }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [f, setF] = useState<ListingFormState>(emptyForm);

  const loadRow = async () => {
    const { data } = await supabase.from('listings').select('*').eq('id', listingId).maybeSingle();
    if (!data) return;
    const d: any = data;
    setF({
      title: d.title || '', type: d.type || 'rent', price: String(d.price ?? ''),
      bedrooms: String(d.bedrooms ?? 0), bathrooms: String(d.bathrooms ?? 0), area: String(d.area_sqm ?? 0),
      location: d.location || '', city: d.city || '', state: d.state || 'Lagos',
      latitude: d.latitude != null ? String(d.latitude) : '', longitude: d.longitude != null ? String(d.longitude) : '',
      description: d.description || '', amenities: (d.amenities || []).join(', '), tour: d.tour_url || '',
      cert_type: d.cert_type || '', cert_url: d.cert_url || '',
    });
    setImages(d.images || []);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from('listings').update({
      title: f.title, type: f.type as any, price: Number(f.price),
      bedrooms: +f.bedrooms, bathrooms: +f.bathrooms, area_sqm: +f.area,
      location: f.location, city: f.city, state: f.state, description: f.description,
      amenities: f.amenities.split(',').map((s) => s.trim()).filter(Boolean),
      images, tour_url: f.tour || null,
      latitude: f.latitude ? Number(f.latitude) : null,
      longitude: f.longitude ? Number(f.longitude) : null,
      cert_type: f.type === 'sale' && f.cert_type ? f.cert_type : null,
      cert_url: f.type === 'sale' && f.cert_url ? f.cert_url : null,
    } as any).eq('id', listingId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Listing updated');
    setOpen(false); onSaved();
  };

  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) loadRow(); }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="Edit listing"><Edit className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit listing</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <ListingFormFields f={f} setF={setF} images={images} setImages={setImages} busy={busy} setBusy={setBusy} userId={user.id} />
          <DialogFooter><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const BoostDialog = ({ listingId, title, walletBalance, onSubmitted }: { listingId: string; title: string; walletBalance: number; onSubmitted: () => void }) => {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(2);
  const [busy, setBusy] = useState(false);
  const fee = boostFeeFor(days);
  const insufficient = walletBalance < fee;

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.from('listings').update({
      boost_status: 'pending', boost_days: days, boost_fee: fee, boost_requested_at: new Date().toISOString(),
    } as any).eq('id', listingId);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Boost request submitted for admin review.');
    setOpen(false); onSubmitted();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="Boost listing"><Rocket className="h-4 w-4 text-accent" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Boost "{title}"</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Promoted listings appear at the top of browse pages and category cards. Fee is deducted from your wallet only when admin approves.</p>
          <div>
            <Label>Number of days</Label>
            <Input type="number" min={2} max={60} value={days} onChange={(e) => setDays(Math.max(2, Math.min(60, Number(e.target.value) || 2)))} />
            <div className="text-xs text-muted-foreground mt-1">Base: ₦2,500 for 2 days. Extra days at ₦1,250/day.</div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 flex justify-between text-sm">
            <span>Fee</span><span className="font-semibold">{naira(fee)}</span>
          </div>
          <div className="text-xs flex justify-between">
            <span>Wallet balance</span>
            <span className={insufficient ? 'text-destructive' : 'text-success'}>{naira(walletBalance)}</span>
          </div>
          {insufficient && <div className="text-xs text-destructive">Top up your wallet to submit this boost request.</div>}
          <DialogFooter>
            <Button onClick={submit} disabled={busy || insufficient}>{busy ? 'Submitting…' : 'Submit for review'}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};




const AgentDashboard = () => {
  const { user, role, profile, loading: authLoading } = useAuth();
  const { wallet } = useWallet();
  const { items: listings, reload } = useListings({ agentId: user?.id });
  const [inspections, setInspections] = useState<Insp[]>([]);

  const loadInsp = async () => {
    if (!user) return;
    const { data } = await supabase.from('inspections').select('*').eq('agent_id', user.id).order('scheduled_at', { ascending: true });
    setInspections((data as any) || []);
  };
  useEffect(() => { loadInsp(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`agent-insp-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inspections', filter: `agent_id=eq.${user.id}` },
        () => loadInsp())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (authLoading) return <Layout><div className="container py-20 text-center">Loading…</div></Layout>;
  if (role !== 'agent' && role !== 'admin') {
    return <Layout><div className="container py-20 text-center text-muted-foreground">Agent access only.</div></Layout>;
  }

  const updateInsp = async (id: string, status: string) => {
    const { error } = await supabase.from('inspections').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    loadInsp();
    toast.success(status === 'confirmed' ? 'Inspection accepted' : status === 'cancelled' ? 'Inspection declined' : 'Inspection marked completed');
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await supabase.from('listings').delete().eq('id', id);
    reload();
    toast.success('Listing removed');
  };

  const titleOf = (lid: string) => listings.find((l) => l.id === lid)?.title || 'Property';
  const pending = inspections.filter((i) => i.status === 'pending').length;

  return (
    <Layout>
      <div className="container py-10">
        
        <KYCBanner />
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agent dashboard</h1>
            <p className="text-muted-foreground">Manage listings, inspections and earnings.</p>
          </div>
          <NewListingDialog
            onCreated={reload}
            disabled={role === 'agent' && profile?.kyc_status !== 'verified'}
            disabledReason="Complete KYC verification to create listings."
          />

        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Building2, label: 'My listings', v: listings.length, color: 'text-primary bg-primary/10' },
            { icon: Calendar, label: 'Pending inspections', v: pending, color: 'text-accent bg-accent/20' },
            { icon: Eye, label: 'Confirmed', v: inspections.filter((i) => i.status === 'confirmed').length, color: 'text-success bg-success/10' },
            { icon: Wallet, label: 'Wallet', v: naira(wallet.available_balance), color: 'text-primary bg-primary/10' },
          ].map((s) => (
            <div key={s.label} className="bg-card border rounded-2xl p-5 shadow-soft">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'Sora' }}>{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="listings">
          <TabsList>
            <TabsTrigger value="listings">My listings</TabsTrigger>
            <TabsTrigger value="inspections">Inspection requests</TabsTrigger>
            <TabsTrigger value="earnings">Earnings & withdraw</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="listings" className="mt-4">
            <div className="bg-card border rounded-2xl overflow-hidden">
              {listings.length === 0 && <div className="p-8 text-center text-muted-foreground">No listings yet — create one to get started.</div>}
              {listings.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-secondary/30 transition-colors">
                  <Link to={`/property/${p.id}`}><img src={p.image} className="h-16 w-16 rounded-lg object-cover" /></Link>
                  <Link to={`/property/${p.id}`} className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {p.title}
                      {p.featured && <Badge className="bg-accent text-accent-foreground text-[10px]"><Sparkles className="h-3 w-3 mr-1" />Boosted</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.location} · {p.type}</div>
                  </Link>
                  <div className="text-right">
                    <div className="font-bold text-primary">{shortNaira(p.price)}</div>
                    <Badge variant={p.verified ? 'default' : 'secondary'} className="text-xs">{p.verified ? 'Verified' : 'Pending'}</Badge>
                  </div>
                  <EditListingDialog listingId={p.id} onSaved={reload} />
                  <BoostDialog listingId={p.id} title={p.title} walletBalance={wallet.available_balance} onSubmitted={reload} />
                  <Button size="icon" variant="ghost" onClick={() => deleteListing(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="inspections" className="mt-4">
            <div className="bg-card border rounded-2xl overflow-hidden">
              {inspections.length === 0 && <div className="p-8 text-center text-muted-foreground">No inspection requests yet.</div>}
              {inspections.map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-4 border-b last:border-0 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <div className="font-medium text-sm">{titleOf(i.listing_id)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(i.scheduled_at).toLocaleString()} · {i.mode} · {naira(i.fee)}</div>
                  </div>
                  <Badge className={i.status === 'confirmed' ? 'bg-success text-success-foreground' : i.status === 'pending' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground'}>{i.status}</Badge>
                  {i.status === 'pending' && <>
                    <Button size="sm" onClick={() => updateInsp(i.id, 'confirmed')}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => updateInsp(i.id, 'cancelled')}>Decline</Button>
                  </>}
                  {i.status === 'confirmed' && <Button size="sm" variant="outline" onClick={() => updateInsp(i.id, 'completed')}>Mark done</Button>}
                  {(i.status === 'completed' || i.status === 'cancelled') && (
                    <RaiseDisputeButton inspectionId={i.id} againstUser={i.user_id} amount={i.fee} />
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="earnings" className="mt-4 space-y-4">
            <div className="bg-card border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-success" /><span className="font-semibold">Wallet balance</span></div>
              <div className="text-4xl font-bold text-primary mb-1" style={{ fontFamily: 'Sora' }}>{naira(wallet.available_balance)}</div>
              <div className="text-sm text-muted-foreground">60% revenue share on completed bookings. Withdraw any time below.</div>
            </div>
            <WithdrawPanel />
          </TabsContent>
          <TabsContent value="disputes" className="mt-4 bg-card border rounded-2xl p-6"><MyDisputesList /></TabsContent>
          <TabsContent value="profile" className="mt-4"><AgentProfileForm /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AgentDashboard;
