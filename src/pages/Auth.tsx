import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Home as HomeIcon, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { AppRole } from '@/contexts/AuthContext';

const roleRedirect = async (): Promise<string> => {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return '/dashboard';
  const { data: rpcRole } = await (supabase as any).rpc('get_my_role');
  if (rpcRole === 'admin' || rpcRole === 'moderator') return '/admin';
  if (rpcRole === 'agent') return '/agent';
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', u.user.id);
  const rs = (roles || []).map((r: any) => r.role);
  if (rs.includes('admin')) return '/admin';
  if (rs.includes('moderator')) return '/admin';
  if (rs.includes('agent')) return '/agent';
  return '/dashboard';
};

const SocialButtons = () => {
  const oauth = async (provider: 'google' | 'apple') => {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message || 'Sign-in failed'); return; }
    if (result.redirected) return;
    window.location.href = await roleRedirect();
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" onClick={() => oauth('google')}>
        <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
        Google
      </Button>
      <Button type="button" variant="outline" onClick={() => oauth('apple')}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
        Apple
      </Button>
    </div>
  );
};

export const Login = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); toast.error(error.message); return; }
    toast.success('Welcome back!');
    const dest = params.get('redirect') || (await roleRedirect());
    // Hard navigation guarantees AuthContext re-initializes with the new session
    // and role state before route guards evaluate.
    window.location.assign(dest);
  };

  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <div className="bg-card border rounded-2xl p-8 shadow-soft">
          <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center mb-4 text-primary-foreground"><HomeIcon className="h-6 w-6" /></div>
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-6">Sign in to continue your search.</p>
          <SocialButtons />
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />OR<div className="h-px flex-1 bg-border" /></div>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">No account? <Link to="/register" className="text-primary font-medium">Create one</Link></p>
        </div>
      </div>
    </Layout>
  );
};

export const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<AppRole>('user');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', phone: '', agency: '' });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = form.username.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) {
      toast.error('Username must be 3-20 chars (letters, numbers, underscore).');
      return;
    }
    if (role === 'agent' && !termsAccepted) {
      toast.error('You must accept the Agent / Landlord Terms to continue.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('register-account', {
      body: {
        email: form.email,
        password: form.password,
        full_name: form.name,
        username: uname,
        phone: form.phone,
        agency_name: role === 'agent' ? form.agency : null,
        role,
        terms_accepted: role === 'agent' ? termsAccepted : false,
        email_redirect_to: `${window.location.origin}/`,
      },
    });
    setBusy(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message); return; }
    toast.success(role === 'agent' ? 'Agent account created — check your email to confirm.' : 'Account created — check your email to confirm.');
    navigate('/login');
  };

  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <div className="bg-card border rounded-2xl p-8 shadow-soft">
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm mb-6">Join thousands renting and buying safely.</p>

          <SocialButtons />
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />OR<div className="h-px flex-1 bg-border" /></div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {(['user', 'agent'] as AppRole[]).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)} className={`p-4 rounded-xl border-2 text-left transition-all ${role === r ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="font-semibold capitalize">{r === 'user' ? 'Renter / Buyer' : 'Agent / Landlord'}</div>
                <div className="text-xs text-muted-foreground">{r === 'user' ? 'Find a home' : 'List your properties'}</div>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} placeholder="e.g. james_eze" required /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234..." /></div>
            {role === 'agent' && (
              <div><Label>Agency / Company</Label><Input value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })} /></div>
            )}
            <div><Label>Password</Label><Input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            {role === 'agent' && (
              <>
                <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg flex gap-2">
                  <ShieldCheck className="h-4 w-4 text-success shrink-0" /> Agents complete KYC verification before listings go live.
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                  <span>
                    I have read and agree to the{' '}
                    <Link to="/agent-terms" target="_blank" className="text-primary underline">Agent / Landlord Terms</Link>{' '}
                    (accurate listings, no off-platform payments, prompt unlisting, etc.).
                  </span>
                </label>
              </>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">Have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link></p>
        </div>
      </div>
    </Layout>
  );
};
