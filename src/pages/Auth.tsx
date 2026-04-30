import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp, Role } from '@/store/app';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Home as HomeIcon, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const Login = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@homelet.ng');
  const [role, setRole] = useState<Role>('user');

  const handleLogin = (e: React.FormEvent, r?: Role) => {
    e.preventDefault();
    const useRole = r || role;
    login(email, useRole);
    toast.success(`Welcome back!`);
    navigate(useRole === 'admin' ? '/admin' : useRole === 'agent' ? '/agent' : '/dashboard');
  };

  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <div className="bg-card border rounded-2xl p-8 shadow-soft">
          <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center mb-4 text-primary-foreground"><HomeIcon className="h-6 w-6" /></div>
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-6">Sign in to continue your search.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><Label>Password</Label><Input type="password" defaultValue="demo1234" required /></div>
            <Button type="submit" className="w-full" size="lg">Sign in</Button>
          </form>
          <div className="my-6 border-t" />
          <div className="text-xs text-muted-foreground text-center mb-3">Quick demo logins</div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={(e) => handleLogin(e, 'user')}>User</Button>
            <Button variant="outline" size="sm" onClick={(e) => handleLogin(e, 'agent')}>Agent</Button>
            <Button variant="outline" size="sm" onClick={(e) => handleLogin(e, 'admin')}>Admin</Button>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-6">No account? <Link to="/register" className="text-primary font-medium">Create one</Link></p>
        </div>
      </div>
    </Layout>
  );
};

export const Register = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('user');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login(form.email, role, form.name);
    toast.success('Account created!');
    navigate(role === 'agent' ? '/agent' : '/dashboard');
  };

  return (
    <Layout>
      <div className="container py-16 max-w-md">
        <div className="bg-card border rounded-2xl p-8 shadow-soft">
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm mb-6">Join thousands renting and buying safely.</p>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {(['user', 'agent'] as Role[]).map((r) => (
              <button key={r} onClick={() => setRole(r)} className={`p-4 rounded-xl border-2 text-left transition-all ${role === r ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="font-semibold capitalize">{r === 'user' ? 'Renter / Buyer' : 'Agent / Landlord'}</div>
                <div className="text-xs text-muted-foreground">{r === 'user' ? 'Find a home' : 'List your properties'}</div>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            {role === 'agent' && (
              <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg flex gap-2">
                <ShieldCheck className="h-4 w-4 text-success shrink-0" /> Agents complete KYC verification before going live.
              </div>
            )}
            <Button type="submit" className="w-full" size="lg">Create account</Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">Have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link></p>
        </div>
      </div>
    </Layout>
  );
};
